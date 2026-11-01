import {navigatePdfDestination} from './pdf-destination.js';
export class ReaderNavigation{
  constructor(reader){this.reader=reader;this.bookmarks=[];this.pending=Promise.resolve();this.outlineLoaded=false;this.root=reader.root.querySelector('.pdf-navigation');this.tabs=this.root.querySelectorAll('[data-navigation]');this.tabs.forEach(button=>{button.onclick=()=>this.select(button.dataset.navigation);button.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tabs=[...this.tabs].filter(tab=>!tab.hidden),index=tabs.indexOf(button),next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;this.select(tabs[next].dataset.navigation);tabs[next].focus();};});this.select('pages');}
  select(name){
    this.tabs.forEach(button=>{const active=button.dataset.navigation===name;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
    this.root.querySelectorAll('[data-navigation-panel]').forEach(panel=>panel.hidden=panel.dataset.navigationPanel!==name);
    this.root.classList.toggle('wide-navigation',name!=='pages');
    if(name==='outline'&&this.loaded&&!this.outlineLoaded)this.loadOutline().catch(error=>this.reader.announce('Document outline is unavailable. '+error.message,true));
    if(name==='pages')this.reader.scheduleThumbnails();
  }
  reference(page){const label=this.labels?.[page-1];return `Page ${page}${label&&label!==String(page)?` · ${label}`:''}`;}
  async load({restoreIntent=this.reader.navigationIntent}={}){
    const r=this.reader,doc=r.doc;
    const saved=r.file.id&&window.pdfix?await window.pdfix.reading(r.file.id).catch(error=>{r.announce(error.message,true);return null;}):null;
    if(r.disposed||r.doc!==doc)return;
    await this.loadLabels().catch(error=>{if(!r.disposed&&r.doc===doc)r.announce('Printed page labels are unavailable. '+error.message,true);});
    if(r.disposed||r.doc!==doc)return;
    this.bookmarks=(saved?.bookmarks||[]).filter(b=>b.page<=doc.numPages);const savedPage=Math.min(doc.numPages,saved?.page||1);
    this.root.querySelector('[data-save-bookmark]').onclick=()=>this.saveBookmark().catch(error=>r.announce(error.message,true));this.renderBookmarks();this.loaded=true;
    if(this.tabs.length&&[...this.tabs].some(tab=>tab.dataset.navigation==='outline'&&tab.getAttribute('aria-selected')==='true'))await this.loadOutline();
    if(r.disposed||r.doc!==doc)return;
    if(restoreIntent===r.navigationIntent&&savedPage!==r.pageNumber)await r.go(savedPage);else if(this.dirtyBeforeLoad)this.rememberPage();
  }
  async loadOutline(){
    if(this.outlineLoaded||this.outlineLoading)return this.outlineLoading;
    const r=this.reader,doc=r.doc;if(!doc)return;this.outlineLoading=Promise.all([doc.getOutline().catch(()=>null),this.loadLabels()]).then(([outline])=>{
      if(r.disposed||r.doc!==doc)return;
      const panel=this.root.querySelector('.outline-list');panel.replaceChildren();let count=0;
    const visit=(items,depth)=>{if(depth>20)return;for(const item of items||[]){if(++count>1000)return;const button=document.createElement('button');button.textContent=String(item.title||'Untitled section').slice(0,160);button.className='outline-entry';button.style.paddingLeft=`${10+Math.min(depth,6)*12}px`;
      if(!item.dest){button.disabled=true;button.title=item.url?'This bookmark points outside the document. External link handling is not available yet.':'This bookmark has no supported page destination.';}
      else button.onclick=()=>this.goDestination(item.dest,doc).catch(error=>{if(!r.disposed)r.announce(error.message,true);});
      panel.append(button);visit(item.items,depth+1);if(count>=1000)return;}};
      visit(outline,0);if(!panel.childElementCount)panel.textContent='This PDF has no document outline.';
      if(doc.navigationTruncated)panel.append(r.element('p','Some navigation entries or page labels exceeded the bounded limits and were omitted.','footnote'));
      if(count>=1000)panel.append(r.element('p','Showing the first 1,000 outline entries.','footnote'));
      this.outlineLoaded=true;
    }).finally(()=>{this.outlineLoading=null;});return this.outlineLoading;
  }
  goDestination(destination,expectedDoc=this.reader.doc){return navigatePdfDestination(this.reader,destination,{expectedDoc});}
  async loadLabels(){
    if(this.labelsLoaded)return this.exactLabels;
    if(this.labelsLoading)return this.labelsLoading;
    const r=this.reader,doc=r.doc;if(!doc)return null;
    this.labelsLoading=doc.getPageLabels().then(labels=>{
      if(r.disposed||r.doc!==doc)return null;
      this.exactLabels=Array.isArray(labels)&&labels.length===doc.numPages&&labels.every(label=>typeof label==='string'&&label.length<=4096)&&labels.reduce((count,label)=>count+label.length,0)<=1024*1024?[...labels]:null;
      this.labels=Array.isArray(labels)?labels.slice(0,25000).map(label=>String(label).slice(0,100)):null;
      this.labelsLoaded=true;this.renderBookmarks();
      const label=this.labels?.[r.pageNumber-1],status=r.root.querySelector('.page-status');
      if(label&&label!==String(r.pageNumber)&&r.paper.dataset.ready==='true'&&status&&!status.textContent.includes(' · Label '))status.textContent+=' · Label '+label;
      return this.exactLabels;
    }).finally(()=>{this.labelsLoading=null;});return this.labelsLoading;
  }
  currentState(){return {page:this.reader.pageNumber,bookmarks:this.bookmarks.map(b=>({...b}))};}
  persist(){const r=this.reader;if(!this.loaded){this.dirtyBeforeLoad=true;return Promise.resolve();}if(!r.file.id||!window.pdfix)return Promise.resolve();const state=this.currentState();this.pending=this.pending.catch(()=>{}).then(()=>window.pdfix.saveReading(r.file.id,state));return this.pending;}
  rememberPage(){this.persist().catch(error=>{if(!this.warned){this.warned=true;this.reader.announce(`Reading position could not be remembered. ${error.message}`,true);}});}
  showBookmarks(){this.reader.setPane('thumbnails',true);this.select('saved');const input=this.root.querySelector('.bookmark-name');input.value=this.reference(this.reader.pageNumber);input.focus();input.select();}
  async saveBookmark(){
    const input=this.root.querySelector('.bookmark-name'),page=this.reader.pageNumber,title=input.value.trim()||this.reference(page),previous=this.bookmarks.map(b=>({...b}));
    if(!this.bookmarks.some(b=>b.page===page)&&this.bookmarks.length>=100)throw new Error('This document has 100 saved pages. Remove one before saving another.');
    this.bookmarks=[...this.bookmarks.filter(b=>b.page!==page),{page,title:title.slice(0,80)}].sort((a,b)=>a.page-b.page);
    try{await this.persist();this.renderBookmarks();this.root.querySelector('.bookmark-status').textContent=`Saved ${this.reference(page)} locally.`;}catch(error){this.bookmarks=previous;throw error;}
  }
  renderBookmarks(){
    const list=this.root.querySelector('.bookmark-list');list.replaceChildren();
    for(const mark of this.bookmarks){const row=document.createElement('div');row.className='saved-page';const open=document.createElement('button');open.className='saved-page-open';const title=document.createElement('b'),reference=document.createElement('small');title.textContent=mark.title;reference.textContent=this.reference(mark.page);open.append(title,reference);open.onclick=()=>this.reader.go(mark.page).catch(error=>this.reader.announce(error.message,true));const remove=document.createElement('button');remove.className='icon-button';remove.textContent='×';remove.setAttribute('aria-label',`Remove saved page ${mark.page}`);remove.onclick=async()=>{const previous=this.bookmarks;this.bookmarks=this.bookmarks.filter(b=>b.page!==mark.page);try{await this.persist();this.renderBookmarks();}catch(error){this.bookmarks=previous;this.reader.announce(error.message,true);}};row.append(open,remove);list.append(row);}
    if(!this.bookmarks.length)list.textContent='Save a page to return to it later.';
  }
}
