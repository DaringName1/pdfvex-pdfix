import './pdf-search.css';
import {clearPdfSearchFallback,paintPdfSearchFallback} from './pdf-search-fallback.js';
import {pdfSearchText,pdfSearchModel,normalizePdfSearch as normalize} from './pdf-search-model.js';
import {searchPageContent} from './pdf-search-page.js';
export {pdfSearchText} from './pdf-search-model.js';

const MAX_MATCHES=10_000;
// Preserve UTF-16 offsets even when lowercase expands a Unicode character.
function offsets(raw){
  const starts=[],ends=[];let index=0,space=null,hasText=false;
  for(const character of raw){const end=index+character.length;
    if(/\s/u.test(character)){if(hasText)space=space?{start:space.start,end}:{start:index,end};}
    else{if(space){starts.push(space.start);ends.push(space.end);space=null;}for(let n=0;n<character.toLowerCase().length;n++){starts.push(index);ends.push(end);}hasText=true;}
    index=end;
  }
  return {starts,ends};
}

export class PdfSearch{
  constructor(reader){
    this.reader=reader;this.matches=[];this.selected=-1;this.version=0;
    this.highlightName=`pdfix-search-${reader.queryId}`;this.activeName=`pdfix-active-${reader.queryId}`;
    this.readableHighlightName=`pdfix-readable-search-${reader.queryId}`;this.readableActiveName=`pdfix-readable-active-${reader.queryId}`;
    this.controls=reader.element('div',undefined,'search-navigation');
    this.controls.innerHTML='<button class="secondary compact" data-search-previous aria-label="Previous search match" title="Previous match (Shift F3)" disabled>‹ Previous</button><output class="search-position" aria-live="polite">0 matches</output><button class="secondary compact" data-search-next aria-label="Next search match" title="Next match (F3)" disabled>Next ›</button><button class="text-button search-stop" hidden>Stop search</button>';
    reader.root.querySelector('.search-status').before(this.controls);
    this.scopeLabel=reader.element('label','Search scope');this.scopeLabel.hidden=true;this.scopeSelect=reader.element('select');this.scopeSelect.setAttribute('aria-label','PDF search scope');
    for(const [value,text]of [['page','This page'],['all','Entire PDF']]){const option=reader.element('option',text);option.value=value;this.scopeSelect.append(option);}this.scopeLabel.append(this.scopeSelect);reader.root.querySelector('.pdf-search').prepend(this.scopeLabel);
    this.resumeButton=reader.element('button','Continue search','secondary compact');this.resumeButton.hidden=true;this.resumeButton.onclick=()=>this.search(this.original,{resume:true}).catch(error=>reader.announce(error.message,true));this.controls.append(this.resumeButton);
    this.scopeSelect.onchange=()=>{this.clear();this.configurePagedScope();};
    this.controls.querySelector('[data-search-previous]').onclick=()=>this.move(-1).catch(error=>reader.announce(error.message,true));
    this.controls.querySelector('[data-search-next]').onclick=()=>this.move(1).catch(error=>reader.announce(error.message,true));
    this.controls.querySelector('.search-stop').onclick=()=>this.stop();
    const style=reader.element('style');style.textContent=`::highlight(${this.highlightName}){background-color:#f5d57a80;color:transparent}::highlight(${this.activeName}){background-color:#ffa339b3;color:transparent;text-decoration:underline solid #92551a}::highlight(${this.readableHighlightName}){background-color:#f5d57a80}::highlight(${this.readableActiveName}){background-color:#ffa339b3;text-decoration:underline solid #92551a}.readable-page p.search-hit{background-color:#f5d57a40}.readable-page p.search-active{outline:2px solid #92551a}`;this.controls.append(style);
    reader.root.querySelector('.pdf-query').addEventListener('keydown',event=>{if(event.key==='Enter'&&normalize(event.target.value)===this.query&&this.matches.length){event.preventDefault();this.move(event.shiftKey?-1:1).catch(error=>reader.announce(error.message,true));}});
  }
  update(){
    const count=this.matches.length;this.controls.querySelector('.search-position').textContent=count?(this.selected<0?`${count.toLocaleString()} ${count===1?'match':'matches'}`:`${this.selected+1} of ${count.toLocaleString()}`):'0 matches';
    this.controls.querySelectorAll('[data-search-previous],[data-search-next]').forEach(button=>button.disabled=!count||!this.reader.copyAllowed);
    this.controls.querySelector('.search-stop').hidden=!this.searching;
    this.resumeButton.hidden=this.searching||!this.canResume||this.capped;
    for(const button of this.reader.results.children){const active=Number(button.dataset.match)===this.selected;button.classList.toggle('current',active);button.setAttribute('aria-current',active?'true':'false');}
  }
  configurePagedScope(){
    const reader=this.reader,whole=this.scopeSelect.value==='all';this.scopeLabel.hidden=false;
    reader.root.querySelector('.inspector-title h2').textContent=whole?'Find in this PDF':'Find on this page';
    reader.root.querySelector('.pdf-search label[for]').textContent=whole?'Search selectable text across this PDF':'Search this page’s selectable text';
    reader.root.querySelector('.pdf-search button').setAttribute('aria-label',whole?'Search entire PDF':'Search this PDF page');
    const button=reader.root.querySelector('[data-action="find"]');button.setAttribute('aria-label',whole?'Find in this PDF':'Find on this page');button.title=whole?'Find throughout the PDF, one extracted page at a time (Ctrl+F).':'Find selectable text on the displayed page (Ctrl+F).';
    reader.root.querySelector('.search-status').textContent=whole?'Entire PDF search reads one page at a time. Stop or navigate to pause; Continue resumes. Scans need selectable text.':'Find searches only the displayed page. Choose Entire PDF to search every page.';
  }
  clear(){this.version++;this.controller?.abort();this.controller=null;this.searching=false;this.canResume=false;this.nextPage=1;this.matches=[];this.selected=-1;this.capped=false;this.scopePage=null;this.query='';this.reader.results.replaceChildren();this.reader.query='';this.highlight();this.update();}
  pageChanged(){
    if(this.scopePage!=null&&this.scopePage!==this.reader.pageNumber){this.clear();this.reader.root.querySelector('.search-status').textContent='Page changed. Find searches only the displayed page; run it again for this page.';}
    else if(this.reader.file.pagedSource&&this.searching&&this.searchViewPage!==this.reader.pageNumber)this.stop();
  }
  async search(value,{resume=false}={}){
    const reader=this.reader;if(!reader.doc||!reader.copyAllowed)return;
    const whole=reader.file.pagedSource&&this.scopeSelect.value==='all';
    // Stop background continuous rendering before a bounded scan. Page-only
    // Find uses rendered text; Entire PDF uses disposable extracted-page text.
    // A newer navigation or search always wins.
    if(reader.file.pagedSource){
      const doc=reader.doc,page=reader.pageNumber;if(!resume||!whole)this.clear();const version=this.version;
      await reader.singlePageView();
      if(reader.disposed||reader.doc!==doc||reader.pageNumber!==page||version!==this.version)return;
      if(!whole){
        const ready=()=>reader.paper.dataset.ready==='true'&&this.renderedPage===page&&reader.index.has(page);
        // Opening Find can reflow a fitted page. Finish that display render
        // instead of refusing a query pasted before the resize debounce fires.
        if(!ready())await reader.renderPage();
        if(reader.disposed||reader.doc!==doc||reader.pageNumber!==page||version!==this.version)return;
        if(!ready())throw new Error('Wait for selectable text on this page, then try Find again.');
      }
    }
    if(!resume||!whole||!this.canResume||normalize(value)!==this.query)this.clear();else{this.version++;this.controller?.abort();}
    this.original=value.trim().slice(0,200);this.query=normalize(this.original);reader.query=this.original;
    this.scopePage=reader.file.pagedSource&&!whole?reader.pageNumber:null;this.searchViewPage=reader.pageNumber;
    const version=this.version,status=reader.root.querySelector('.search-status');if(!this.query){status.textContent=this.scopePage==null?'Enter a word or phrase to search this PDF.':'Enter a word or phrase to search only the displayed page.';return;}
    this.searching=true;this.complete=false;this.update();this.highlight();const doc=reader.doc,controller=new AbortController();this.controller=controller;
    try{
      for(let pageNumber=this.scopePage??this.nextPage;pageNumber<=(this.scopePage??doc.numPages);pageNumber++){
        if(reader.disposed||reader.doc!==doc||version!==this.version)return;status.textContent=`Searching page ${pageNumber} of ${doc.numPages}…`;
        let text=reader.index.get(pageNumber);
        if(text===undefined){if(this.scopePage!=null)throw new Error('Selectable text on this page is unavailable. Wait for the page and try again.');if(whole)text=await doc.getSearchText(pageNumber,{signal:controller.signal});else{const content=await searchPageContent(doc,pageNumber,{signal:controller.signal,timeoutMs:reader.sourceCapabilities?.rangeLoading?120000:20000});text=pdfSearchText(content);reader.cacheText(pageNumber,text);}if(reader.disposed||reader.doc!==doc||version!==this.version)return;}
        const normalized=normalize(text);let position=0,first=-1,count=0;
        while((position=normalized.indexOf(this.query,position))!==-1){
          if(this.matches.length>=MAX_MATCHES){this.capped=true;break;}
          if(first<0)first=this.matches.length;this.matches.push({page:pageNumber,start:position,end:position+this.query.length});count++;position+=this.query.length;
        }
        if(count){const button=reader.element('button',undefined,'search-result');button.dataset.match=String(first);button.append(reader.element('b',`${reader.navigation.reference(pageNumber)} · ${count} ${count===1?'match':'matches'}`),reader.element('span',normalized.slice(Math.max(0,this.matches[first].start-45),this.matches[first].end+90)));button.onclick=()=>this.select(first).catch(error=>reader.announce(error.message,true));reader.results.append(button);}
        this.nextPage=pageNumber+1;this.canResume=whole&&this.nextPage<=doc.numPages;this.update();if(this.capped)break;await new Promise(resolve=>setTimeout(resolve,0));
      }
      if(reader.disposed||reader.doc!==doc||version!==this.version)return;this.searching=false;this.complete=!this.capped;this.update();this.summary();this.highlight();
    }catch(error){if(reader.disposed||reader.doc!==doc||version!==this.version)return;this.searching=false;this.canResume=whole&&this.nextPage<=doc.numPages;this.update();status.textContent=`Search stopped: ${error.message} ${this.scopePage==null?'Results from earlier pages remain available.':'Only the displayed page was searched.'}`;if(whole&&(error.code==='CANCELED'||error.name==='RenderingCancelledException'))return;throw error;}
    finally{if(this.controller===controller)this.controller=null;}
  }
  summary(prefix=''){
    const reader=this.reader,count=this.matches.length,pages=new Set(this.matches.map(match=>match.page)).size;
    const scope=this.scopePage==null?'':`Only ${reader.navigation.reference(this.scopePage)} was searched. Other pages were not searched. `;
    reader.root.querySelector('.search-status').textContent=scope+(prefix||(count?`${this.capped?'Showing the first ':''}${count.toLocaleString()} ${count===1?'match':'matches'} on ${pages} ${pages===1?'page':'pages'}.${this.capped?' Narrow your search to find later matches.':' Use Next / Previous or F3 / Shift F3.'}`:'No matches in selectable text. Scanned pages need OCR.'));
  }
  stop(){if(!this.searching)return;this.version++;this.controller?.abort();this.controller=null;this.searching=false;this.complete=false;this.canResume=this.reader.file.pagedSource&&this.scopePage==null&&this.nextPage<=this.reader.doc.numPages;this.update();this.summary('Search stopped. The matches already found are available.'+(this.scopePage==null?' Later pages have not been searched.':''));}
  async move(direction){this.pageChanged();if(!this.matches.length||!this.reader.copyAllowed)return;const next=this.selected<0?(direction<0?this.matches.length-1:0):(this.selected+direction+this.matches.length)%this.matches.length;return this.select(next);}
  async select(index){
    this.pageChanged();const match=this.matches[index],reader=this.reader;if(!match||reader.disposed||!reader.copyAllowed)return;if(reader.file.pagedSource&&this.searching)this.stop();
    const version=this.version;await reader.singlePageView();if(reader.disposed||version!==this.version)return;this.selected=index;this.update();if(reader.pageNumber!==match.page||reader.paper.dataset.ready!=='true')await reader.go(match.page);
    if(reader.disposed||version!==this.version||this.selected!==index||reader.pageNumber!==match.page)return;
    this.highlight();this.scrollActive();
  }
  rendered(content){this.model=pdfSearchModel(content);this.renderedPage=this.reader.pageNumber;this.highlight();if(this.matches[this.selected]?.page===this.renderedPage)this.scrollActive();}
  clearHighlights(){for(const name of [this.highlightName,this.activeName,this.readableHighlightName,this.readableActiveName])CSS.highlights?.delete(name);for(const root of [this.reader.layer,this.reader.readable]){clearPdfSearchFallback(root);root?.querySelectorAll('.search-hit,.search-active').forEach(span=>span.classList.remove('search-hit','search-active'));}this.activeRanges=[];}
  highlight(){
    this.clearHighlights();const reader=this.reader;if(!this.query||!reader.copyAllowed||this.renderedPage!==reader.pageNumber||!this.model)return;
    const hits=[],active=[],mappings=new Map(),divs=reader.textLayer?.textDivs??[];let position=0,count=0,firstSegment=0;
    const readable=!reader.readable.hidden,fragments=new Map();
    if(readable)for(const paragraph of reader.readable.querySelectorAll('p'))for(const fragment of paragraph.pdfSourceFragments??[])fragments.set(fragment.run,{...fragment,paragraph});
    const chosen=this.matches[this.selected];
    while((position=this.model.text.indexOf(this.query,position))!==-1&&count++<MAX_MATCHES){
      const end=position+this.query.length,selected=chosen?.page===reader.pageNumber&&chosen.start===position;
      while(firstSegment<this.model.segments.length&&this.model.segments[firstSegment].end<=position)firstSegment++;
      for(let index=firstSegment;index<this.model.segments.length;index++){
        const segment=this.model.segments[index];if(segment.start>=end)break;if(hits.length>=2000&&!selected)break;
        const fragment=readable?fragments.get(segment.run):null,div=readable?fragment?.paragraph:divs[segment.run],node=div?.firstChild;if(!node||node.nodeType!==3)continue;
        let mapping=mappings.get(segment.run);if(!mapping){mapping=offsets(readable?fragment.text:segment.raw);mappings.set(segment.run,mapping);}
        const base=fragment?.start??0,localStart=mapping.starts[Math.max(0,position-segment.start)],localEnd=mapping.ends[Math.min(end,segment.end)-segment.start-1];
        if(localStart===undefined||localEnd===undefined)continue;
        const startOffset=base+localStart,endOffset=base+localEnd;
        if(startOffset===undefined||endOffset===undefined||endOffset>node.length)continue;
        const range=reader.root.ownerDocument.createRange();range.setStart(node,startOffset);range.setEnd(node,endOffset);hits.push(range);if(selected)active.push(range);
      }
      position=end;
    }
    if(CSS.highlights&&typeof Highlight==='function'){
      const all=new Highlight(...hits),current=new Highlight(...active);all.priority=1;current.priority=2;CSS.highlights.set(readable?this.readableHighlightName:this.highlightName,all);CSS.highlights.set(readable?this.readableActiveName:this.activeName,current);
      this.activeRanges=active;
    }else this.activeRanges=paintPdfSearchFallback(hits,active);
  }
  scrollActive(){
    const reader=this.reader;
    if(!reader.readable.hidden){
      const match=this.matches[this.selected];if(match?.page!==reader.pageNumber||this.renderedPage!==reader.pageNumber)return;
      const source=this.model?.segments.find(segment=>segment.end>match.start&&segment.start<match.end);if(!source)return;
      const paragraph=Array.from(reader.readable.querySelectorAll('p')).find(p=>p.pdfSourceRuns?.has(source.run));
      if(paragraph){this.readableOmission=null;paragraph.scrollIntoView({block:'center'});}
      else{const key=`${this.version}/${this.selected}/${reader.readableView?.settings.order}`;if(this.readableOmission!==key){this.readableOmission=key;reader.announce('This match is not shown in the current readable layout. Choose PDF content sequence or return to page artwork.');}}
      return;
    }
    const rect=this.activeRanges?.[0]?.getBoundingClientRect();if(!rect?.width&&!rect?.height)return;
    const stage=reader.stage,bounds=stage.getBoundingClientRect();stage.scrollBy({left:rect.left-bounds.left+rect.width/2-stage.clientWidth/2,top:rect.top-bounds.top+rect.height/2-stage.clientHeight/2,behavior:'auto'});
  }
  dispose(){this.version++;this.controller?.abort();this.controller=null;this.searching=false;this.clearHighlights();this.matches=[];this.model=null;}
}
