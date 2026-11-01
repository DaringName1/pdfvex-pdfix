import './pdf-link-review.css';
import {navigatePdfDestination,resolvePdfDestination} from './pdf-destination.js';
const MAX_ANNOTATIONS=5000,MAX_LINKS=100,MAX_URL=4096,MAX_BYTES=100*1024*1024;
const REF=/^[1-9]\d{0,9}R(?:[1-9]\d{0,4})?$/;
const forbidden=/[\p{Cc}\p{Cf}\p{Cs}]/u;
const node=(tag,text,className)=>{const value=document.createElement(tag);if(text!==undefined)value.textContent=text;if(className)value.className=className;return value;};
const readable=value=>String(value??'').replace(/[\p{Cc}\p{Cf}\p{Cs}]/gu,char=>'\\u'+char.charCodeAt(0).toString(16).padStart(4,'0'));
export function reviewablePdfUrl(value){
  if(typeof value!=='string'||!value.length||value.length>MAX_URL)return {ok:false,reason:'The destination is empty or exceeds 4,096 characters.'};
  if(value!==value.trim()||forbidden.test(value)||value.includes('\\')||/%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(value))return {ok:false,reason:'The destination contains unsupported whitespace, control characters or backslashes.'};
  if(!/^https?:\/\//i.test(value))return {ok:false,reason:'Only explicit HTTP and HTTPS destinations can be reviewed for opening.'};
  try{const parsed=new URL(value);if(!['http:','https:'].includes(parsed.protocol)||!parsed.hostname||parsed.username||parsed.password||parsed.href.length>MAX_URL)return {ok:false,reason:'The destination has credentials or an unsupported address.'};return {ok:true,url:parsed.href,host:parsed.host};}catch{return {ok:false,reason:'The destination is not a supported web address.'};}
}
function cancellable(promise,signal){return new Promise((resolve,reject)=>{
  if(signal.aborted){reject(new Error('Link review canceled.'));return;}
  const abort=()=>{clearTimeout(timer);reject(new Error('Link review canceled.'));};signal.addEventListener('abort',abort,{once:true});
  const finish=(error,value)=>{clearTimeout(timer);signal.removeEventListener('abort',abort);error?reject(error):resolve(value);};
  const timer=setTimeout(()=>finish(new Error('The page link review exceeded its reading limit.')),15000);
  Promise.resolve(promise).then(value=>finish(null,value),error=>finish(error));
});}
export class PdfLinkReview{
  constructor(reader,{reviewExternal,cancelExternal}={}){this.reader=reader;this.reviewExternal=reviewExternal;this.cancelExternal=cancelExternal;this.disposed=false;this.generation=0;}
  current(generation){return !this.disposed&&!this.reader.disposed&&this.dialog?.open&&this.generation===generation&&this.reader.doc===this.document&&this.reader.file===this.source&&this.reader.pageNumber===this.page;}
  async show(){
    if(this.disposed||this.reader.disposed||!this.reader.doc)return;
    this.close();this.document=this.reader.doc;this.source=this.reader.file;this.page=this.reader.pageNumber;const generation=++this.generation;
    this.controller=new AbortController();this.trigger=document.activeElement;
    const dialog=node('dialog',undefined,'pdf-link-review');this.dialog=dialog;
    const heading=node('h2',`Links on page ${this.page}`);heading.id='pdf-links-'+crypto.randomUUID();dialog.setAttribute('aria-labelledby',heading.id);
    const title=node('p',readable(this.source.name).slice(0,220),'pdf-link-source');
    const policy=node('p','Destinations are supplied by the PDF. Reading this list does not open websites, run actions or export attachments. Browser opening requires a separate Windows review of the original annotation.','pdf-link-policy');
    this.status=node('p','Reading the current page’s link annotations…','pdf-link-status');this.status.setAttribute('role','status');this.status.setAttribute('aria-live','polite');
    const filterLabel=node('label','Filter destinations','pdf-link-filter');this.filter=node('input');this.filter.type='search';this.filter.maxLength=200;this.filter.setAttribute('aria-label','Filter link destinations');this.filter.disabled=true;filterLabel.append(this.filter);
    this.list=node('ol',undefined,'pdf-link-list');this.list.setAttribute('aria-label','Link destinations');
    const actions=node('div',undefined,'pdf-link-actions'),close=node('button','Close','primary');close.type='button';close.onclick=()=>this.close();actions.append(close);
    dialog.append(heading,title,policy,filterLabel,this.status,this.list,actions);document.body.append(dialog);
    dialog.addEventListener('close',()=>{if(this.dialog===dialog)this.close();},{once:true});this.filter.oninput=()=>this.filterList();dialog.showModal();close.focus();
    try{
      const signal=this.controller.signal,page=await cancellable(this.document.getPage(this.page),signal);
      const annotations=await cancellable(page.getAnnotations({intent:'display'}),signal);if(!this.current(generation))return;
      if(!Array.isArray(annotations)||annotations.length>MAX_ANNOTATIONS)throw new Error('This page exceeds the 5,000-annotation review limit.');
      const links=annotations.filter(item=>item?.subtype==='Link');this.linkCount=links.length;this.rows=[];
      const selected=links.slice(0,MAX_LINKS);let index=0;
      for(let start=0;start<selected.length;start+=4){
        const records=await Promise.all(selected.slice(start,start+4).map(annotation=>this.describe(annotation,signal)));
        if(!this.current(generation))return;for(const record of records)this.append(record,++index,generation);
      }
      this.nativeLinksTruncated=!!page.nativeLinksTruncated;this.filter.disabled=false;this.filterList();
    }catch(error){if(this.current(generation))this.status.textContent=error?.message||'This page’s links could not be read.';}
  }
  async describe(annotation,signal){
    const record={id:typeof annotation.id==='string'&&REF.test(annotation.id)?annotation.id:null};
    if(annotation.attachment||annotation.attachmentId||annotation.actions||annotation.action||annotation.setOCGState||annotation.resetForm)return {...record,kind:'blocked',text:'PDF action or embedded-file destination',reason:'Attachment, script, named and other document actions are not run.'};
    if(annotation.dest!==undefined&&annotation.dest!==null){
      try{
        const raw=annotation.dest;
        if(typeof raw==='string'&&(raw.length>1024||forbidden.test(raw)))throw new Error();
        const destination=typeof raw==='string'?await cancellable(this.document.getDestination(raw),signal):raw;
        if(!Array.isArray(destination)||destination.length<2||destination.length>10)throw new Error();
        const first=destination[0];let pageIndex;
        if(Number.isInteger(first))pageIndex=first;
        else if(first&&Number.isInteger(first.num)&&first.num>0&&Number.isInteger(first.gen)&&first.gen>=0&&first.gen<=65535)pageIndex=await cancellable(this.document.getPageIndex(first),signal);
        else throw new Error();
        if(!Number.isInteger(pageIndex)||pageIndex<0||pageIndex>=this.document.numPages)throw new Error();
        const page=pageIndex+1,label=readable(this.reader.navigation?.labels?.[pageIndex]||'').slice(0,100);
        await cancellable(resolvePdfDestination(this.document,destination),signal);
        return {...record,kind:'internal',page,destination,text:`Page ${page}${label&&label!==String(page)?' · printed label '+label:''}`,reason:'Goes to the destination’s position and view within the opened PDF.'};
      }catch{return {...record,kind:'blocked',text:'Internal PDF destination',reason:'The page destination could not be safely resolved.'};}
    }
    const original=typeof annotation.unsafeUrl==='string'?annotation.unsafeUrl:annotation.url;
    const safe=reviewablePdfUrl(original);
    return {...record,kind:safe.ok?'external':'blocked',text:typeof original==='string'?readable(original.slice(0,MAX_URL))+(original.length>MAX_URL?' [destination exceeds display limit]':''):'Unsupported PDF action or destination',host:safe.host,reason:safe.ok?'The original action type must still be checked by Windows before opening.':safe.reason};
  }
  append(record,index,generation){
    const row=node('li',undefined,'pdf-link-entry');row.append(node('h3',`Link ${index} · ${record.kind==='internal'?'within this PDF':record.kind==='external'?'web destination':'blocked destination'}`));
    const destination=node('textarea');destination.readOnly=true;destination.spellcheck=false;destination.value=record.text;destination.setAttribute('aria-label',`Full destination for link ${index}`);destination.rows=2;row.append(destination,node('p',record.reason,'pdf-link-reason'));
    if(record.kind==='internal'){
      const go=node('button',`Go to page ${record.page}`,'secondary compact');go.type='button';go.onclick=async()=>{if(!this.current(generation))return;const doc=this.document;this.close();try{await navigatePdfDestination(this.reader,record.destination,{expectedDoc:doc});}catch(error){if(!this.reader.disposed)this.reader.announce(error.message,true);}};row.append(go);
    }else if(record.kind==='external'){
      row.append(node('p','Host shown by URL parser: '+record.host,'pdf-link-host'));
      const label=node('label',undefined,'pdf-link-consent'),ack=node('input');ack.type='checkbox';label.append(ack,document.createTextNode('I reviewed the full destination above.'));
      const open=node('button','Review opening in browser','secondary compact');open.type='button';open.disabled=true;
      const available=typeof this.reviewExternal==='function'&&typeof this.source.id==='string'&&!!record.id;
      ack.disabled=!available;ack.onchange=()=>{open.disabled=!ack.checked||this.busy;};row.append(label,open);
      if(!available)row.append(node('p','Browser review is unavailable for this preview or unsupported annotation reference.','pdf-link-reason'));
      open.onclick=()=>this.openExternal(record,generation,open,ack); // No href, window.open, fetch or renderer URL is sent.
    }
    this.list.append(row);this.rows.push({row,text:record.text.toLocaleLowerCase()});
  }
  filterList(){if(!this.rows)return;const query=this.filter.value.trim().toLocaleLowerCase();let count=0;for(const entry of this.rows){entry.row.hidden=query&&!entry.text.includes(query);if(!entry.row.hidden)count++;}this.status.textContent=this.linkCount?`${count} of ${this.rows.length} listed links shown.${this.linkCount>MAX_LINKS?' This page has '+this.linkCount+' links; only the first '+MAX_LINKS+' are listed.':''}`:'No link annotations were found on this page.';if(this.nativeLinksTruncated)this.status.textContent+=' Some original links are unsupported or exceed on-demand metadata limits.';}
  async sourceHash(signal){
    const bytes=this.source.bytes;if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>MAX_BYTES)throw new Error('The opened source snapshot is unavailable.');
    const hash=await cancellable(crypto.subtle.digest('SHA-256',bytes),signal);return [...new Uint8Array(hash)].map(value=>value.toString(16).padStart(2,'0')).join('');
  }
  async openExternal(record,generation,button,ack){
    if(!this.current(generation)||this.busy||!ack.checked||!record.id)return;this.busy=true;button.disabled=true;this.list.querySelectorAll('button').forEach(value=>value.disabled=true);
    try{
      const signal=this.controller.signal,sourceSha256=await this.sourceHash(signal);if(!this.current(generation))return;
      const request=Object.freeze({sourceID:this.source.id,sourceSha256,page:this.page,annotationID:record.id});this.pendingRequest=request;
      this.status.textContent='Windows is checking the original link action and reviewing the destination…';
      const result=await this.reviewExternal(request,{signal});if(this.current(generation))this.status.textContent=result?.opened?'Reviewed destination opened in your browser.':result?.message||'Browser opening canceled.';
    }catch(error){if(this.current(generation))this.status.textContent=error?.message||'This destination was blocked.';}
    finally{if(this.generation===generation){this.pendingRequest=null;this.busy=false;}if(this.current(generation)){this.list.querySelectorAll('button').forEach(value=>value.disabled=false);this.list.querySelectorAll('.pdf-link-entry').forEach(row=>{const input=row.querySelector('input[type=checkbox]'),open=row.querySelector('label+button');if(input&&open)open.disabled=!input.checked||input.disabled;});}}
  }
  pageChanged(){if(this.dialog&&(this.reader.pageNumber!==this.page||this.reader.doc!==this.document||this.reader.disposed))this.close();}
  close(){
    this.generation++;this.controller?.abort();this.controller=null;
    if(this.pendingRequest&&this.cancelExternal){const request=this.pendingRequest;Promise.resolve().then(()=>this.cancelExternal(request)).catch(()=>{});}
    this.pendingRequest=null;this.busy=false;const dialog=this.dialog;this.dialog=null;
    if(dialog){if(dialog.open)dialog.close();dialog.remove();if(this.trigger?.isConnected&&!this.reader.disposed)this.trigger.focus();}
    this.rows=null;
  }
  dispose(){this.disposed=true;this.close();this.reader=null;}
}
