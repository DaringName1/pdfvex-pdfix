import {ReaderProofHost} from './reader-proof-host.js';
import { OcrSession } from './ocr-session.js';

import { pdfJob } from './pdf-jobs.js';

import { PdfReader } from './pdf-reader.js';

import { PdfComparison } from './pdf-comparison.js';
import { OCR_LANGUAGES, requireOcrLanguage } from './ocr-languages.js';

const normalize=text=>text.replace(/\s+/g,' ').trim();

export class OcrWorkspace {

  constructor(file,reader,ui){this.file=file;this.reader=reader;Object.assign(this,ui);this.records=[];}

  open(){

    if(!this.reader.doc){this.announce('Wait until the PDF is open.',true);return;}

    if(!this.reader.copyAllowed){this.announce('This PDF restricts copying. Obtain an owner-authorized, unrestricted copy before OCR.',true);return;}

    this.inline=!!this.reader?.hasToolStrip&&!!this.reader.paper?.isConnected;this.dialog=this.element(this.inline?'section':'dialog',undefined,'ocr-workspace'+(this.inline?' ocr-inline':''));

    this.dialog.innerHTML=`<div class="dialog-header"><div><h2>Make a scan searchable</h2><p class="subtitle">Turn the picture of the words into real text you can search and copy. Everything happens on this computer.</p></div><button class="icon-button" aria-label="Close OCR workspace">×</button></div>

      <p class="operation-warning">Works on printed text in one language, up to 20 pages. Pages that already have text are left as they are. You can correct words before saving; the scan itself looks the same. The new copy leaves out comments, links and bookmarks, and PDFs with forms, signatures or a password are not supported. Recognition can make mistakes, so check the words.</p>

      <div class="ocr-actions"><label>OCR language <select data-ocr-language aria-label="OCR language"></select></label><button class="primary" data-start>Start local OCR</button><button class="secondary" data-cancel>Cancel</button><span class="ocr-progress" role="status" aria-live="polite">No file is sent online.</span></div>

      <div class="ocr-review" hidden><div class="ocr-review-heading"><label>Review scan page <select data-review-page aria-label="OCR review page"></select></label><span class="ocr-confidence"></span><button class="secondary compact" data-next-uncertain>Next uncertain line</button></div><p class="ocr-confidence-note">Lines below 80% recognition confidence, or with an unavailable score, are flagged for extra review. Scores describe the original recognition and do not change when you correct text. They are estimates, not accuracy guarantees; check every line against the scan, including unflagged text. Searchable PDF text supports only characters encoded by the bundled Western font; reviewed text exports retain Unicode.</p><div class="ocr-review-columns"><div class="ocr-scan-frame"><div class="ocr-scan"><img alt="Scanned page for OCR review"><div class="ocr-position" hidden></div></div></div><div class="ocr-lines" aria-label="Recognized text corrections"></div></div>

      <div class="ocr-actions"><button class="primary" data-preview>Preview searchable copy</button><button class="secondary" data-edit>Edit reviewed text in a document</button><button class="secondary" data-export-text>Export reviewed text</button><button class="secondary" data-export-lines>Export OCR line inventory CSV</button></div></div>

      <div class="ocr-output" hidden><div class="ocr-actions"><b>Searchable copy reopened and text verified</b><button class="secondary" data-compare>Compare with original</button><button class="primary" data-save>Save searchable copy</button></div><div class="ocr-output-reader"></div></div>`;

    if(this.inline){const result=this.element('div',undefined,'ocr-inline-result');result.append(this.q('.ocr-review'),this.q('.ocr-output'));this.host=new ReaderProofHost(this.reader,{panel:this.dialog,proof:result,label:'Make a scan searchable',onEscape:()=>this.finish()});this.q('[data-cancel]').hidden=!this.busy;}else{document.body.append(this.dialog);this.dialog.showModal();}

    this.status=this.q('.ocr-progress');

    const languageSelect=this.q('[data-ocr-language]');
    for(const language of OCR_LANGUAGES){const option=this.element('option',language.name);option.value=language.code;languageSelect.append(option);}
    languageSelect.onchange=()=>{this.records=[];this.selectedLanguage=null;this.invalidate();this.q('.ocr-review').hidden=true;this.status.textContent='Language changed. Start local OCR to recognize with the selected language.';};

    this.q('[aria-label="Close OCR workspace"]').onclick=()=>this.finish();this.dialog.addEventListener('close',()=>this.dispose());

    this.q('[data-start]').onclick=()=>this.run(()=>this.recognize());

    this.q('[data-cancel]').onclick=()=>{if(!this.busy){this.finish();return;}this.cancelled=true;this.session?.dispose();this.job?.cancel();this.renderTask?.cancel();this.status.textContent='Operation canceled. No copy was saved.';};

    this.q('[data-review-page]').onchange=()=>this.run(()=>this.showRecord());



    this.q('[data-next-uncertain]').onclick=()=>this.run(()=>this.nextUncertain());

    this.q('[data-preview]').onclick=()=>this.run(()=>this.preview());

    this.q('[data-edit]').onclick=()=>this.run(()=>this.edit());

    this.q('[data-export-text]').onclick=()=>this.run(()=>this.exportReviewed('txt'));

    this.q('[data-export-lines]').onclick=()=>this.run(()=>this.exportReviewed('csv'));

    this.q('[data-save]').onclick=()=>this.run(async()=>{const result=await window.pdfix.saveCopy(this.file.id,this.output.bytes);if(result)this.announce(`Saved ${result.name}. Reviewed OCR text is searchable; original unchanged.`);});

    this.q('[data-compare]').onclick=()=>this.run(async()=>{if(!this.output)return;this.comparison?.dispose();this.comparison=new PdfComparison([{name:this.file.name,doc:this.reader.doc,copyAllowed:this.reader.copyAllowed}],{name:'Searchable copy',doc:this.previewReader.doc,copyAllowed:this.previewReader.copyAllowed},{element:this.element,announce:this.announce});await this.comparison.open();});

    this.controls(false);

  }

  controls(busy){

    [...this.dialog.querySelectorAll('button,input,select,textarea'),...(this.host?.frame?.querySelectorAll('button,input,select,textarea')||[])].forEach(control=>{if(control.hasAttribute('data-cancel')||control.hasAttribute('aria-label')&&control.tagName==='BUTTON')return;control.disabled=busy;});



    this.q('[data-preview]').disabled=busy||!this.records.length;

    this.q('[data-edit]').disabled=busy||!this.records.length;

    this.q('[data-export-text]').disabled=busy||!this.records.length;

    this.q('[data-export-lines]').disabled=busy||!this.records.length;

    this.q('[data-save]').disabled=busy||!this.output;

    this.q('[data-compare]').disabled=busy||!this.output;

    this.q('[data-cancel]').disabled=false;this.q('[data-cancel]').textContent=busy?'Stop':'Cancel';this.q('[data-cancel]').hidden=this.inline&&!busy;

  }

  async run(action){if(this.busy||this.closed)return;this.busy=true;this.controls(true);try{await action();}catch(error){if(!this.closed){this.status.textContent=this.cancelled?'Operation canceled. No copy was saved.':error.message;this.announce(this.status.textContent,!this.cancelled);}}finally{this.busy=false;if(!this.closed)this.controls(false);}}

  check(){if(this.closed||this.cancelled||this.reader.disposed)throw new Error('OCR was canceled. No copy was saved.');}

  invalidate(){this.comparison?.dispose();this.output=null;this.previewReader?.dispose();this.previewReader=null;this.q('.ocr-output').hidden=true;this.q('.ocr-output-reader').replaceChildren();this.controls(this.busy);}

  async renderScan(number){

    this.check();const page=await this.reader.doc.getPage(number),base=page.getViewport({scale:1});

    const scale=Math.min(2,Math.sqrt(16000000/(base.width*base.height))),viewport=page.getViewport({scale});

    const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);

    if(canvas.width*canvas.height>16000000)throw new Error('This scan exceeds the 16-million-pixel OCR limit. Extract or resize it first.');

    try{this.renderTask=page.render({canvasContext:canvas.getContext('2d'),viewport});await this.renderTask.promise;this.check();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('The scan could not be prepared.');return {blob,transform:[...viewport.transform],width:canvas.width,height:canvas.height};}

    finally{canvas.width=canvas.height=0;}

  }

  async recognize(){

    this.cancelled=false;this.records=[];this.uncertainCursor=null;this.invalidate();this.q('.ocr-review').hidden=true;

    if(this.reader.doc.numPages>20)throw new Error('Local OCR supports up to 20 pages. Use Organize pages to extract a smaller PDF first.');

    this.job=pdfJob({action:'inspect',bytes:this.file.bytes});await this.job.promise;this.check();

    const scans=[];

    for(let number=1;number<=this.reader.doc.numPages;number++){this.check();this.status.textContent=`Checking page ${number} of ${this.reader.doc.numPages}…`;const page=await this.reader.doc.getPage(number),text=await page.getTextContent();if(!text.items.some(item=>item.str?.trim()))scans.push(number);}

    if(!scans.length)throw new Error('Every page already has selectable text. Use PDF search or Edit a document copy.');

    this.session?.dispose();this.selectedLanguage=requireOcrLanguage(this.q('[data-ocr-language]').value);this.session=new OcrSession(this.selectedLanguage.code,progress=>{if(!this.closed&&!this.cancelled)this.status.textContent=`${this.currentPage?`Page ${this.currentPage}: `:''}${progress.status} · ${Math.round((progress.progress||0)*100)}%`;});

    const initialized=await this.session.initialize();this.check();if(initialized.language!==this.selectedLanguage.code)throw new Error('The local OCR engine loaded a different language. Start again.');

    for(const number of scans){this.check();this.currentPage=number;const raster=await this.renderScan(number);const result=await this.session.recognize(new Uint8Array(await raster.blob.arrayBuffer()));this.check();if(result.language!==this.selectedLanguage.code)throw new Error('The local OCR result language did not match the selected language. Start again.');if(result.lines.length)this.records.push({index:number-1,transform:raster.transform,width:raster.width,height:raster.height,lines:result.lines,confidence:result.confidence,language:result.language,languageName:this.selectedLanguage.name,languageSource:'user-selected'});}

    this.session.dispose();this.currentPage=null;

    if(!this.records.length)throw new Error(`No ${this.selectedLanguage.name} text was recognized. Try a clearer scan. Handwriting recognition is not claimed.`);

    const select=this.q('[data-review-page]');select.replaceChildren();for(const record of this.records){const option=this.element('option',`Page ${record.index+1}`);option.value=record.index;select.append(option);}

    this.q('.ocr-review').hidden=false;this.host?.showProof(true);await this.showRecord();this.status.textContent=`Recognized ${this.records.length} scanned ${this.records.length===1?'page':'pages'} using ${this.selectedLanguage.name}, selected by you. ${this.uncertainLines().length} lines flagged for extra review. Review every page before creating a copy.`;

  }

  async showRecord(){

    const record=this.records.find(r=>r.index===Number(this.q('[data-review-page]').value));if(!record)return;

    const raster=await this.renderScan(record.index+1);this.check();if(this.imageUrl)URL.revokeObjectURL(this.imageUrl);this.imageUrl=URL.createObjectURL(raster.blob);this.q('.ocr-scan img').src=this.imageUrl;

    this.q('.ocr-confidence').textContent=`Engine confidence ${Math.round(record.confidence)}% · Check against the scan`;

    const position=this.q('.ocr-position');position.hidden=true;this.q('.ocr-scan-frame').scrollTop=0;const container=this.q('.ocr-lines');container.replaceChildren();

    record.lines.forEach((line,index)=>{const uncertain=!Number.isFinite(line.confidence)||line.confidence<80,label=this.element('label',`Line ${index+1} · ${Number.isFinite(line.confidence)?Math.round(line.confidence)+'% recognition confidence':'confidence unavailable'}${uncertain?' · review carefully':''}`);label.classList.toggle('ocr-uncertain',uncertain);const input=this.element('input');input.dataset.ocrLine=String(index);input.type='text';input.maxLength=2000;input.value=line.text;input.setAttribute('aria-label',`OCR page ${record.index+1} line ${index+1}`);input.onfocus=()=>{const b=line.bbox;Object.assign(position.style,{left:b.x0/record.width*100+'%',top:b.y0/record.height*100+'%',width:(b.x1-b.x0)/record.width*100+'%',height:(b.y1-b.y0)/record.height*100+'%'});position.hidden=false;requestAnimationFrame(()=>{if(this.closed||!position.isConnected||position.hidden)return;const frame=this.q('.ocr-scan-frame'),top=position.offsetTop,bottom=top+position.offsetHeight;if(top<frame.scrollTop)frame.scrollTop=Math.max(0,top-12);else if(bottom>frame.scrollTop+frame.clientHeight)frame.scrollTop=bottom-frame.clientHeight+12;});};input.oninput=()=>{line.text=input.value;this.invalidate();};label.append(input);container.append(label);});

  }

  uncertainLines(){return this.records.flatMap(record=>record.lines.map((line,index)=>({record,index,line}))).filter(item=>!Number.isFinite(item.line.confidence)||item.line.confidence<80);}

  async nextUncertain(){

    const items=this.uncertainLines();if(!items.length){this.status.textContent='No lines were flagged by the confidence estimate. Review all text against the scan anyway.';return;}

    const active=document.activeElement,currentPage=Number(this.q('[data-review-page]').value),last=this.uncertainCursor,current=active?.dataset.ocrLine!==undefined?items.findIndex(item=>item.record.index===currentPage&&item.index===Number(active.dataset.ocrLine)):last?items.findIndex(item=>item.record.index===last.page&&item.index===last.line):-1,item=items[(current+1)%items.length];

    this.q('[data-review-page]').value=String(item.record.index);await this.showRecord();this.check();this.uncertainCursor={page:item.record.index,line:item.index};this.q(`[data-ocr-line="${item.index}"]`)?.focus();this.status.textContent=`Flagged line ${(current+1)%items.length+1} of ${items.length} · page ${item.record.index+1}, line ${item.index+1}. Confidence is an estimate; compare with the highlighted scan location.`;

  }

  async preview(){

    this.cancelled=false;this.invalidate();this.job=pdfJob({action:'ocr',bytes:this.file.bytes,recognized:this.records},p=>{this.status.textContent=`${p.stage}: ${p.current} of ${p.total}…`;});const output=await this.job.promise;this.check();

    const panel=this.q('.ocr-output');panel.querySelector('b').textContent='Checking the searchable copy…';panel.hidden=false;this.host?.showProof(true);this.previewReader=new PdfReader(this.q('.ocr-output-reader'),{...this.file,id:null,bytes:output.bytes},{announce:this.announce,element:this.element,icon:this.icon});await this.previewReader.open();this.check();

    if(!this.previewReader.doc||this.previewReader.doc.numPages!==this.reader.doc.numPages)throw new Error('The output could not be reopened. Nothing was saved.');

    for(const record of this.records){const page=await this.previewReader.doc.getPage(record.index+1),content=await page.getTextContent(),text=normalize(content.items.filter(i=>'str'in i).map(i=>i.str).join(' '));for(const line of record.lines)if(line.text.trim()&&!text.includes(normalize(line.text)))throw new Error(`Searchable text verification failed on page ${record.index+1}. Nothing was saved.`);}

    this.output=output;panel.querySelector('b').textContent='Searchable copy reopened and text verified';this.status.textContent='Reviewed text was verified in the reopened PDF. Check the preview, then save a new copy.';panel.scrollIntoView({block:'start'});

  }

  async exportReviewed(format){

    if(!this.records.length)throw new Error('Review the recognized text before exporting.');

    let output;

    if(format==='csv'){

      const cell=value=>{let text=String(value??'');if(/^[\s]*[=+@-]/.test(text)||/^[\t\r\n]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';},rows=[['Source page','OCR language','Language source','OCR line','Engine confidence estimate','Review flag','Reviewed text']];

      for(const record of this.records)for(const [index,line]of record.lines.entries())rows.push([record.index+1,record.language,record.languageSource,index+1,Number.isFinite(line.confidence)?Math.round(line.confidence):'',!Number.isFinite(line.confidence)||line.confidence<80?'Check carefully':'Check against scan',line.text]);

      output=rows.map(row=>row.map(cell).join(',')).join('\r\n');

    }else{

      const pages=[];let chars=0;

      for(let index=0;index<this.reader.doc.numPages;index++){this.check();const record=this.records.find(r=>r.index===index);let lines;if(record)lines=record.lines.map(line=>line.text);else{const page=await this.reader.doc.getPage(index+1);lines=this.reader.visualLines(await page.getTextContent(),page.getViewport({scale:1}));}const text=lines.join('\n');chars+=text.length;if(chars>2*1024*1024)throw new Error('Reviewed text exceeds the 2 MB export limit.');pages.push(`Source page ${index+1}${record?` · OCR language ${record.language} (user-selected)`:''}\n${text}`);}

      output=pages.join('\n\n');

    }

    const bytes=new TextEncoder().encode(output);if(bytes.length>4*1024*1024)throw new Error('The reviewed text export exceeds 4 MB.');this.check();const saved=await window.pdfix.exportDocument(this.file.id,format,bytes);if(this.closed)return;

    if(saved){this.status.textContent=`Saved ${saved.name}. ${format==='csv'?'CSV is a reviewed OCR line inventory with confidence estimates; it does not reconstruct table cells. Spreadsheet-sensitive text is prefixed with an apostrophe.':'Text includes reviewed OCR lines and existing selectable text in source-page order; page artwork and document formatting are omitted.'} Original unchanged.`;this.announce(this.status.textContent);}

  }

  async edit(){

    const content=[];let chars=0;

    for(let index=0;index<this.reader.doc.numPages;index++){const record=this.records.find(r=>r.index===index);let lines;if(record)lines=record.lines.map(l=>l.text).filter(Boolean);else {const page=await this.reader.doc.getPage(index+1);lines=this.reader.visualLines(await page.getTextContent(),page.getViewport({scale:1}));}content.push({type:'heading',attrs:{level:2},content:[{type:'text',text:`Source page ${index+1}`}]});for(const line of lines){chars+=line.length;if(chars>2*1024*1024)throw new Error('Recognized document text exceeds the 2 MB editor limit.');content.push({type:'paragraph',content:[{type:'text',text:line}]});}}

    if(!chars)throw new Error('No reviewed text remains.');this.finish();await this.onEdit({type:'doc',content});

  }

  finish(){if(this.inline)this.dispose();else this.dialog.close();}
 q(selector){return this.dialog?.querySelector(selector)||this.host?.frame?.querySelector(selector)||null;}
 dispose(){if(this.closed)return;this.host?.dispose();this.closed=true;this.session?.dispose();this.job?.cancel();this.renderTask?.cancel();this.comparison?.dispose();this.previewReader?.dispose();if(this.imageUrl)URL.revokeObjectURL(this.imageUrl);this.dialog.remove();this.records=[];this.output=null;}

}

