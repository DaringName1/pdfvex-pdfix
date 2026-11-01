import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),value=>value.toString(16).padStart(2,'0')).join('');

// A separate PDF.js worker renders only the explicitly selected, sealed entry.
// PDF actions, links, attachments and scripts have no UI execution route here.
export class PdfPortfolioPreview{
 constructor(packet,{purpose='embedded'}={}){this.packet=packet;this.purpose=purpose==='signed'?'signed':'embedded';this.serial=0;this.closed=false;this.rendering=false;}
 async bounded(promise){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('PDF artwork preview exceeded its 20-second operation limit.')),20000);})]);}finally{clearTimeout(timer);}}
 async open(){
  const {bytes,report}=this.packet;
  if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>(this.purpose==='signed'?100:10)*1024*1024||await hash(bytes)!==report?.entry?.sha256)throw new Error('This entry does not match its reviewed decoded fingerprint.');
  if(this.closed){bytes.fill(0);return;}
  this.dialog=el('dialog');this.dialog.className='pdf-portfolio-preview';this.dialog.setAttribute('aria-label',this.purpose==='signed'?'Certificate-signed PDF artwork preview':'Embedded PDF artwork preview');
  const heading=el('h2',report.entry.name),policy=el('p',this.purpose==='signed'?'Read-only artwork from the exact certificate-signed copy. Signature integrity is checked separately. Its document actions stay inactive; this preview does not establish certificate trust or legal validity.':'Read-only artwork from the exact selected embedded PDF. Its links, scripts, forms and attachments are inactive. This preview does not certify file safety or document fidelity.');
  const navigation=el('div');navigation.className='portfolio-actions';this.previous=el('button','Previous page');this.next=el('button','Next page');this.page=el('input');this.page.type='number';this.page.min='1';this.page.value='1';this.page.setAttribute('aria-label','PDF preview page');const close=el('button','Close preview');close.onclick=()=>this.close();this.previous.onclick=()=>this.navigate(this.pageNumber-1);this.next.onclick=()=>this.navigate(this.pageNumber+1);this.page.onchange=()=>this.navigate(Number(this.page.value));navigation.append(this.previous,this.page,this.next,close);
  this.status=el('p',this.purpose==='signed'?'Opening the exact signed copy…':'Opening the selected embedded PDF…');this.status.setAttribute('role','status');this.canvas=el('canvas');this.canvas.setAttribute('aria-label','PDF preview page artwork');this.canvas.tabIndex=0;this.canvas.hidden=true;this.dialog.append(heading,policy,navigation,this.canvas,el('p','Previewed PDF SHA-256: '+report.entry.sha256),this.status);document.body.append(this.dialog);this.dialog.showModal();this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();});
  try{
   const assets=new URL('pdf-assets/',document.baseURI).href;
   this.task=pdfjs.getDocument({data:new Uint8Array(bytes),cMapUrl:assets+'cmaps/',cMapPacked:true,standardFontDataUrl:assets+'standard_fonts/',wasmUrl:assets+'wasm/',iccUrl:assets+'iccs/',isEvalSupported:false,enableXfa:false,maxImageSize:16000000,stopAtErrors:true});
   this.task.onPassword=()=>{this.status.textContent='This embedded PDF is encrypted. Extract it and open it through the authorized password workflow.';this.task.destroy().catch(()=>{});};
   this.doc=await this.bounded(this.task.promise);if(this.closed)return;
   if(this.doc.numPages>500)throw new Error('Embedded PDF preview supports up to 500 physical pages. Extract this file to use the normal reader.');
   this.page.max=String(this.doc.numPages);await this.navigate(1);
  }catch(error){if(!this.closed){this.status.textContent=error.message;this.canvas.hidden=true;}await this.task?.destroy().catch(()=>{});this.doc=null;}
  finally{bytes.fill(0);this.packet=null;}
 }
 async navigate(number){
  if(this.closed||this.rendering||!this.doc)return;
  if(!Number.isInteger(number)||number<1||number>this.doc.numPages){this.page.value=String(this.pageNumber||1);return;}
  const serial=++this.serial;this.rendering=true;this.previous.disabled=true;this.next.disabled=true;this.page.disabled=true;
  try{
   const page=await this.bounded(this.doc.getPage(number));if(this.closed||serial!==this.serial)return;
   const initial=page.getViewport({scale:1});if(!Number.isFinite(initial.width)||!Number.isFinite(initial.height)||initial.width<=0||initial.height<=0)throw new Error('Embedded page geometry is invalid.');
   const scale=Math.min(1.5,1100/initial.width,Math.sqrt(16000000/(initial.width*initial.height))),view=page.getViewport({scale});
   this.canvas.width=Math.ceil(view.width);this.canvas.height=Math.ceil(view.height);if(this.canvas.width*this.canvas.height>16000000)throw new Error('Embedded page exceeds its preview pixel budget.');
   this.renderTask=page.render({canvasContext:this.canvas.getContext('2d'),viewport:view,background:'white'});await this.bounded(this.renderTask.promise);page.cleanup();
   if(this.closed||serial!==this.serial)return;
   this.pageNumber=number;this.page.value=String(number);this.canvas.hidden=false;this.status.textContent=`${this.purpose==='signed'?'Signed copy':'Embedded'} page ${number} of ${this.doc.numPages}. Preview only; review the original page artwork before using this content.`;
  }catch(error){this.renderTask?.cancel();if(!this.closed){this.status.textContent=error.message;this.canvas.hidden=true;}}
  finally{this.rendering=false;if(!this.closed){this.previous.disabled=!this.doc||number<=1;this.next.disabled=!this.doc||number>=this.doc.numPages;this.page.disabled=!this.doc;}}
 }
 async close(){
  if(this.closing)return this.closing;this.closed=true;this.serial++;this.renderTask?.cancel();
  this.dialog?.close();this.dialog?.remove();this.packet?.bytes?.fill(0);
  this.closing=(async()=>{try{await this.bounded(this.task?.destroy()??Promise.resolve());}finally{if(this.canvas){this.canvas.width=1;this.canvas.height=1;}this.doc=null;this.packet=null;}})();
  return this.closing;
 }
}
