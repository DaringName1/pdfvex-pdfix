import {pageRange,rangeLabel} from './page-ranges.js';
import './annotation-summary.css';

const MAX_PAGES=100,MAX_ANNOTATIONS=10000,MAX_BYTES=2*1024*1024;
const text=value=>{if(typeof value!=='string')return '';if(value.length>MAX_BYTES)throw new Error('An annotation exceeds the 2 MB summary budget. Choose a smaller page selection.');return value.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u202a-\u202e\u2066-\u2069]/g,'');};
const short=value=>typeof value==='string'?text(value.slice(0,300)).replace(/[\r\n\t]/g,' ')+(value.length>300?'…':''):'';
const node=(tag,value,className)=>{const element=document.createElement(tag);if(value!==undefined)element.textContent=value;if(className)element.className=className;return element;};

export class AnnotationSummary {
  constructor(reader,{announce=()=>{},onClosed}={}){this.reader=reader;this.announce=announce;this.onClosed=onClosed;this.closed=false;this.busy=false;this.saving=false;this.generation=0;this.waiters=new Set();}
  open(){
    const reader=this.reader;
    if(reader.disposed||!reader.doc||!reader.file?.id||!reader.copyAllowed)throw new Error('Open a PDF that permits copying before exporting an annotation summary.');
    this.file=reader.file;this.doc=reader.doc;this.currentPage=reader.pageNumber;
    this.dialog=node('dialog',undefined,'annotation-summary');const titleId='annotation-summary-'+crypto.randomUUID();this.dialog.setAttribute('aria-labelledby',titleId);
    const heading=node('h2','Export annotation summary');heading.id=titleId;
    const description=node('p','Summarize existing PDF annotation text and metadata from this opened source. Your original stays unchanged. Unsaved PDFix marks and forms are separate drafts; save their reviewed PDF copy and open that copy to include its annotations.');
    const controls=node('div',undefined,'annotation-summary-options'),modeLabel=node('label','Pages ');this.mode=node('select');this.mode.setAttribute('aria-label','Annotation summary pages');
    for(const[value,label]of [['current',`Current page (${this.currentPage})`],['all','All pages'],['range','Page range']]){const option=node('option',label);option.value=value;this.mode.append(option);}modeLabel.append(this.mode);
    this.rangeLabel=node('label','Physical page range ');this.range=node('input');this.range.type='text';this.range.maxLength=2000;this.range.value=String(this.currentPage);this.range.placeholder='1–3, 5';this.range.setAttribute('aria-label','Annotation summary physical page range');this.rangeLabel.append(this.range);this.rangeLabel.hidden=true;controls.append(modeLabel,this.rangeLabel);
    const limits=node('p','Limits: 100 selected pages, 10,000 parsed annotations and 2 MB of summary text. Page ranges use physical page numbers; printed page labels are included when available.','footnote');
    const actions=node('div',undefined,'annotation-summary-actions');this.buildButton=node('button','Build summary','secondary');this.stopButton=node('button','Stop','secondary');this.saveButton=node('button','Save text copy','primary');this.closeButton=node('button','Close','secondary');for(const button of [this.buildButton,this.stopButton,this.saveButton,this.closeButton])button.type='button';actions.append(this.buildButton,this.stopButton,this.saveButton,this.closeButton);
    this.status=node('p','Choose pages, then build the summary.','annotation-summary-status');this.status.setAttribute('role','status');this.status.setAttribute('aria-live','polite');
    this.previewLabel=node('label','Summary preview ');this.preview=node('textarea');this.preview.readOnly=true;this.preview.setAttribute('aria-label','Annotation summary text preview');this.previewLabel.append(this.preview);this.previewLabel.hidden=true;
    this.dialog.append(heading,node('p',this.file.name),description,controls,limits,actions,this.status,this.previewLabel);document.body.append(this.dialog);this.dialog.showModal();
    this.mode.onchange=()=>{this.rangeLabel.hidden=this.mode.value!=='range';this.invalidate();};this.range.oninput=()=>this.invalidate();
    this.buildButton.onclick=()=>this.run(()=>this.build());this.stopButton.onclick=()=>this.cancel();this.saveButton.onclick=()=>this.run(()=>this.save());this.closeButton.onclick=()=>this.close();
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();});this.dialog.addEventListener('close',()=>{if(!this.closed)this.close();});
    this.update();return this;
  }
  invalidate(){if(this.busy||this.closed)return;this.output=null;this.preview.value='';this.previewLabel.hidden=true;this.status.textContent='Selection changed. Build a new summary before saving.';this.update();}
  update(){if(this.closed)return;this.mode.disabled=this.range.disabled=this.buildButton.disabled=this.busy;this.saveButton.disabled=this.busy||!this.output;this.stopButton.hidden=!this.busy||this.saving;this.closeButton.disabled=this.saving;}
  selectedPages(){const count=this.doc.numPages;const pages=this.mode.value==='current'?[this.currentPage-1]:this.mode.value==='all'?Array.from({length:count},(_,index)=>index):this.mode.value==='range'?pageRange(this.range.value,count):[];if(!pages.length||pages.length>MAX_PAGES)throw new Error('Choose between 1 and 100 pages. Use a smaller range for larger PDFs.');return pages;}
  check(version){if(this.closed||version!==this.generation||this.reader.disposed||this.reader.doc!==this.doc||this.reader.file!==this.file||!this.reader.copyAllowed)throw new Error('Annotation summary canceled or the source session changed. No copy was saved.');}
  wait(promise){let reject;const canceled=new Promise((_,failure)=>{reject=failure;});this.waiters.add(reject);return Promise.race([promise,canceled]).finally(()=>this.waiters.delete(reject));}
  async run(action){if(this.closed||this.busy)return;this.busy=true;this.update();this.active=(async()=>{try{await action();}catch(error){if(!this.closed){this.status.textContent=error.message;this.announce(error.message,true);}}finally{clearTimeout(this.timer);this.busy=false;this.saving=false;this.update();}})();return this.active;}
  async build(){
    this.output=null;this.preview.value='';this.previewLabel.hidden=true;
    const version=++this.generation,pages=this.selectedPages(),encoder=new TextEncoder(),parts=[];let byteCount=0,annotationCount=0,summaryCount=0,readableCount=0,emptyCount=0,popupCount=0;
    const append=value=>{const part=String(value);byteCount+=encoder.encode(part).length;if(byteCount>MAX_BYTES)throw new Error('The summary exceeds 2 MB. Choose fewer pages. No partial summary will be saved.');parts.push(part);};
    this.timer=setTimeout(()=>this.cancel('Annotation summary exceeded 45 seconds. Choose fewer pages.'),45000);
    this.check(version);
    append('PDFix annotation summary\nSource: '+short(this.file.name)+'\nPhysical pages: '+rangeLabel(pages)+'\nCreated: '+new Date().toISOString()+'\n\n');
    append('This is a plain-text inventory of existing PDF.js-readable annotations from the opened source snapshot. It is not a complete third-party review exchange. Reply references are reported only when exposed by the parser; their parent may be outside this page selection. Author and dates are source claims, not verified identities. Metadata longer than 300 characters is shortened with an ellipsis. No annotation scripts, links, attachments, HTML or rich-text resources are opened.\n\nUnsaved PDFix markups/form drafts are not included. Annotations without readable comment text remain listed as metadata; their appearance or written meaning is not fabricated. Popup entries are omitted to avoid repeating their parent comment.\n\n');
    for(let index=0;index<pages.length;index++){
      this.check(version);const physical=pages[index]+1;this.status.textContent=`Reading annotations on page ${physical} (${index+1} of ${pages.length})…`;
      const page=await this.wait(this.doc.getPage(physical));this.check(version);const annotations=await this.wait(page.getAnnotations({intent:'display'}));this.check(version);
      if(!Array.isArray(annotations))throw new Error('A page returned unsupported annotation data. No partial summary will be saved.');
      annotationCount+=annotations.length;if(annotationCount>MAX_ANNOTATIONS)throw new Error('The selection exceeds 10,000 annotations. Choose fewer pages. No partial summary will be saved.');
      const label=this.reader.navigation?.labels?.[physical-1],reference='Physical page '+physical+(typeof label==='string'&&label!==String(physical)?' · printed label: '+short(label):'');
      append(reference+'\n'+('-'.repeat(40))+'\n');let pageCount=0;
      for(const annotation of annotations){
        this.check(version);if(!annotation||typeof annotation!=='object')throw new Error('An annotation could not be read. No partial summary will be saved.');
        if(annotation.subtype==='Popup'){popupCount++;continue;}
        const contents=text(annotation.contentsObj?.str??annotation.contents),author=short(annotation.titleObj?.str??annotation.title),id=short(annotation.id),subtype=short(annotation.subtype)||'Unspecified annotation';
        if(contents.trim())readableCount++;else emptyCount++;
        pageCount++;summaryCount++;
        append(`[${summaryCount}] ${subtype}\n`+(id?'Annotation ID: '+id+'\n':'')+'Author: '+(author||'not provided')+'\n');
        const created=short(annotation.creationDate),modified=short(annotation.modificationDate),reply=short(annotation.inReplyTo),replyType=short(annotation.replyType);
        if(created)append('Created (source date): '+created+'\n');if(modified)append('Modified (source date): '+modified+'\n');if(reply)append('Reply/group parent reference: '+reply+(replyType?' · type: '+replyType:'')+'\n');
        append(contents.trim()?'Comment text:\n'+contents+'\n\n':'Comment text: no readable text supplied by this annotation.\n\n');
      }
      if(!pageCount)append('No non-popup annotations returned for this page.\n\n');
      await this.wait(new Promise(resolve=>setTimeout(resolve,0)));
    }
    this.check(version);append(`Summary: ${summaryCount} listed annotations; ${readableCount} with readable text; ${emptyCount} without readable text; ${popupCount} popup entries omitted. ${pages.length} selected pages were inspected.\n`);
    const joined=parts.join(''),bytes=encoder.encode(joined);if(bytes.length>MAX_BYTES)throw new Error('The summary exceeds 2 MB. Choose fewer pages.');
    this.output=bytes;this.preview.value=joined;this.previewLabel.hidden=false;
    this.status.textContent=`Summary ready: ${summaryCount} annotations on ${pages.length} selected pages; ${emptyCount} have no readable text. Review the text before saving a new copy.`;
  }
  async save(){
    this.check(this.generation);if(!this.output)return;this.saving=true;this.update();this.status.textContent='Choose a new filename for the annotation summary…';
    await window.pdfix.editorGuard(true);
    try{const result=await window.pdfix.exportDocument(this.file.id,'txt',this.output);if(result){this.status.textContent='Annotation summary saved: '+result.name+'. Original PDF unchanged.';this.announce(this.status.textContent);}else this.status.textContent='Save canceled. The summary remains available.';}
    finally{await window.pdfix.editorGuard(false);}
  }
  cancel(message='Annotation summary canceled. No copy was saved.'){if(this.saving)return;this.generation++;for(const reject of this.waiters)reject(new Error(message));if(!this.closed)this.status.textContent=message;}
  async close(){if(this.closed||this.saving)return;this.cancel();this.closed=true;clearTimeout(this.timer);await this.active;this.output=null;this.preview.value='';this.dialog.close();this.dialog.remove();this.onClosed?.();}
  async prepareDeparture(){if(this.saving)throw new Error('Finish saving the annotation summary before closing.');await this.close();}
}
