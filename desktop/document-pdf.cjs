const LIMITS=require('./document-limits.cjs');
const {documentBandParagraphs,documentBandText,sideMargins}=require('./document-band-model.cjs');
const {validDocumentLayout,documentPageMargins,documentPapers}=require('./document-layout-validation.cjs');
const {validLinkTarget,validDocumentAnchor}=require('./document-link-model.cjs');
const {HIGHLIGHTS,validHighlight}=require('./document-mark-model.cjs');
const {validParagraphFormat,paragraphOffsets,INDENT_INCHES}=require('./document-paragraph-model.cjs');
const {validateDocumentImage,validateDocumentImages}=require('./document-image-validation.cjs');
const {validateDocumentTables,tableColumnWidths}=require('./document-table-validation.cjs');
const {randomUUID}=require('node:crypto');
const {DocumentOutputService}=require('./document-output-service.cjs');
const {hash,validDocumentOutputInspection}=require('./document-output-validation.cjs');
class DocumentPdfError extends Error{constructor(code,message){super(message);this.code=code;}}
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const FONTS={sans:'Arial, "Segoe UI", sans-serif',serif:'"Times New Roman", serif',mono:'Consolas, "Courier New", monospace'};
function documentHtml(doc,options){
 const fail=()=>{throw new DocumentPdfError('DOCUMENT','This document is too large or contains formatting this PDF export cannot preserve.');};
 if(!doc||doc.type!=='doc'||JSON.stringify(doc).length>LIMITS.DOCUMENT_BYTES)fail();try{validateDocumentTables(doc);validateDocumentImages(doc);}catch(error){throw new DocumentPdfError('DOCUMENT',error.message);}
 try{options=validDocumentLayout(options);}catch(error){throw new DocumentPdfError('SETTINGS',error.message);}
 let count=0,characters=0,imageCount=0;
 const visit=(node,depth=0)=>{
  if(depth>64||++count>LIMITS.DOCUMENT_NODES||!node||typeof node.type!=='string')fail();
  if(node.type==='documentImage'){const a=validateDocumentImage(node.attrs);imageCount++;return `<img src="${escape(a.src)}" alt="${escape(a.alt)}" width="${a.width}" height="${a.height}" data-pixel-width="${a.pixelWidth}" data-pixel-height="${a.pixelHeight}" style="width:${a.width}px;height:auto;aspect-ratio:${a.width}/${a.height}">`;}
  if(node.type==='text'){if(typeof node.text!=='string'||(characters+=node.text.length)>LIMITS.DOCUMENT_TEXT)fail();let text=escape(node.text);for(const mark of node.marks??[]){if(mark?.type==='documentTextStyle'){const attrs=mark.attrs??{},styles=[];if(attrs.font){if(!Object.hasOwn(FONTS,attrs.font))fail();styles.push('font-family:'+FONTS[attrs.font]);}if(attrs.size!==undefined&&attrs.size!==null){if(!Number.isFinite(attrs.size)||attrs.size<8||attrs.size>72)fail();styles.push('font-size:'+attrs.size+'pt');}if(attrs.color){if(!/^#[0-9a-f]{6}$/i.test(attrs.color))fail();styles.push('color:'+attrs.color);}text='<span style="'+escape(styles.join(';'))+'">'+text+'</span>';continue;}if(mark?.type==='documentLink'){let href;try{href=validLinkTarget(mark.attrs?.href);}catch{fail();}text='<a href="'+escape(href)+'">'+text+'</a>';continue;}if(mark?.type==='highlight'){let color;try{color=validHighlight(mark.attrs?.color);}catch{fail();}text='<mark style="background-color:'+HIGHLIGHTS[color].hex+';color:inherit">'+text+'</mark>';continue;}const tag={bold:'strong',italic:'em',underline:'u',strike:'s',code:'code',superscript:'sup',subscript:'sub'}[mark?.type];if(!tag)fail();text=`<${tag}>${text}</${tag}>`;}return text;}
  if(node.type==='table'){const widths=tableColumnWidths(node),total=widths.reduce((a,b)=>a+b,0);return '<table><colgroup>'+widths.map(width=>'<col style="width:'+width/total*100+'%">').join('')+'</colgroup>'+node.content.map(child=>visit(child,depth+1)).join('')+'</table>';}
  if(node.type==='pageBreak')return '<div class="page-break"></div>';
  if(node.type==='hardBreak')return '<br>';if(node.type==='horizontalRule')return '<hr>';
  if(node.content!==undefined&&!Array.isArray(node.content))fail();
  const tags={table:'table',tableRow:'tr',tableCell:'td',tableHeader:'th',doc:'main',paragraph:'p',bulletList:'ul',orderedList:'ol',listItem:'li',blockquote:'blockquote',codeBlock:'pre'},tag=node.type==='heading'&&[1,2,3,4,5,6].includes(node.attrs?.level)?'h'+node.attrs.level:tags[node.type];if(!tag)fail();
  let attrs='';if(['tableCell','tableHeader'].includes(node.type)){attrs=` colspan="${node.attrs?.colspan??1}" rowspan="${node.attrs?.rowspan??1}"`;if(node.attrs?.background)attrs+=' style="background-color:'+node.attrs.background+'"';}if(['paragraph','heading'].includes(node.type)&&node.attrs?.textAlign!==undefined&&node.attrs.textAlign!==null){if(!['left','center','right','justify'].includes(node.attrs.textAlign))fail();attrs=' style="text-align:'+node.attrs.textAlign+'"';}if(['paragraph','heading'].includes(node.type)){let format;try{format=validParagraphFormat(node.attrs);}catch{fail();}const offsets=paragraphOffsets(format),extra=(offsets.left?'margin-left:'+offsets.left*INDENT_INCHES+'in;':'')+(offsets.firstLine?'text-indent:'+offsets.firstLine*INDENT_INCHES+'in;':'')+(offsets.right?'margin-right:'+offsets.right*INDENT_INCHES+'in;':'')+(format.lineSpacing?'line-height:'+format.lineSpacing+';':'')+(format.spaceBefore!==null?'margin-top:'+format.spaceBefore+'pt;':'')+(format.spaceAfter!==null?'margin-bottom:'+format.spaceAfter+'pt;':'');if(extra)attrs=attrs?attrs.slice(0,-1)+';'+extra+'"':' style="'+extra+'"';}if(node.type==='orderedList'&&node.attrs?.start!==undefined){if(!Number.isInteger(node.attrs.start)||node.attrs.start<1||node.attrs.start>1000000)fail();attrs=` start="${node.attrs.start}"`;}
  if(node.type==='heading'&&node.attrs?.anchor){let anchor;try{anchor=validDocumentAnchor(node.attrs.anchor);}catch{fail();}attrs+=' id="'+anchor+'"';}return `<${tag}${attrs}>${(node.content??[]).map(child=>visit(child,depth+1)).join('')||(['p','li'].includes(tag)?'<br>':'')}</${tag}>`;
 };
 const body=visit(doc);if(!characters&&!imageCount&&!documentBandParagraphs(options,'header').some(p=>p.runs.some(r=>r.text.trim()))&&!documentBandParagraphs(options,'footer').some(p=>p.runs.some(r=>r.text.trim())))throw new DocumentPdfError('EMPTY','Add text or an inline image before exporting a document PDF.');
 const html=`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>PDFix document copy</title><style>html{color:#162a35;background:white;font:${options.size}pt/${options.lineHeight} ${FONTS[options.font]}}body{margin:0}p{white-space:pre-wrap;margin:0 0 .65em;overflow-wrap:anywhere;orphans:2;widows:2}h1,h2,h3,h4,h5,h6{break-after:avoid;overflow-wrap:anywhere;margin:1em 0 .5em}h1{font-size:1.9em}h2{font-size:1.5em}h3{font-size:1.2em}h4{font-size:1.08em}h5{font-size:1em}h6{font-size:.92em;text-transform:uppercase;letter-spacing:.03em}ul,ol{padding-left:1.8em}li{overflow-wrap:anywhere}li p{margin-bottom:.25em}blockquote{margin:.7em 0;padding-left:1em;border-left:2pt solid #92b5ad}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-family:Consolas,"Courier New",monospace;padding:.6em;background:#f4f6f5}code{font-family:Consolas,"Courier New",monospace}.page-break{break-before:page;height:0}table{border-collapse:collapse;width:100%;table-layout:fixed;margin:.8em 0}td,th{border:.75pt solid #bccfc9;padding:5pt;vertical-align:top;overflow-wrap:anywhere}th{background:#e9f3ef;font-weight:bold}img{max-width:100%;vertical-align:middle;object-fit:fill}td p,th p{margin:0 0 .25em}tr{break-inside:avoid}hr{border:0;border-top:1pt solid #b8c5c6;margin:1em 0}</style></head><body>${body}</body></html>`;
 return {html,characters,imageCount,options:{...options}};
}
function documentBandTemplate(options,location){
 const paragraphs=documentBandParagraphs(options,location),numbers=options.pageNumbers&&options.pageNumberPlacement===location;if(!paragraphs.length&&!numbers)return '<span></span>';
 const text=paragraphs.map(paragraph=>`<div style="text-align:${paragraph.align};white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.25">${paragraph.runs.some(run=>run.text.length)?paragraph.runs.map(run=>`<span style="font-family:${escape(FONTS[run.font])};font-size:${run.size}pt;color:${run.color};font-weight:${run.bold?'bold':'normal'};font-style:${run.italic?'italic':'normal'};text-decoration:${run.underline?'underline':'none'}">${escape(run.text)}</span>`).join(''):'<br>'}</div>`).join('');
 return `<div style="font:9pt ${escape(FONTS[options.font])};color:#65716f;line-height:1.25;width:100%;box-sizing:border-box;padding:0 ${sideMargins(options).right}mm 0 ${sideMargins(options).left}mm">${text}${numbers?`<div style="text-align:${options.pageNumberAlign}"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`:''}</div>`;
}
class DocumentPdfService{
 constructor(BrowserWindow,options){this.BrowserWindow=BrowserWindow;this.verifier=new DocumentOutputService(options);this.options=this.verifier.options;this.active=null;this.closed=false;this.cleanupFailure=false;}
 response(pathname){return this.active&&!this.active.canceled&&!this.active.timedOut&&!this.closed&&pathname===`/document-print/${this.active.token}`?this.active.html:null;}
 destroyWindow(job){
  if(!job.window)return;
  try{if(!job.window.isDestroyed())job.window.destroy();if(!job.window.isDestroyed())throw new Error('The document print window did not close.');}
  catch(error){this.closed=true;this.cleanupFailure=true;throw new DocumentPdfError('CLEANUP','Document PDF cleanup was not observed. This service stays closed.');}
 }
 check(job){if(job.canceled||this.closed)throw new DocumentPdfError('CANCELED','PDF export canceled. No copy was saved.');if(job.timedOut)throw new DocumentPdfError('TIMEOUT','Document PDF creation exceeded 60 seconds. Try a smaller document.');}
 stop(job,timedOut=false){
  if(timedOut)job.timedOut=true;else job.canceled=true;
  let error;try{this.destroyWindow(job);}catch(value){error=value;}
  job.rejectStop(error??new DocumentPdfError(timedOut?'TIMEOUT':'CANCELED',timedOut?'Document PDF creation exceeded 60 seconds. Try a smaller document.':'PDF export canceled. No copy was saved.'));
  // Start termination immediately. render() also awaits this exact cancellation before release.
  if(!job.verifierCancellation)job.verifierCancellation=this.verifier.cancel(job.token,job.token).catch(value=>{this.closed=true;this.cleanupFailure=true;throw value;});
  job.verifierCancellation.catch(()=>{});
 }
 async cancel(){const job=this.active;if(!job)return false;this.stop(job);try{await job.promise;}catch{}if(this.cleanupFailure||this.verifier.disposed||this.verifier.engine.active?.unsafe||this.verifier.engine.cleanupFailure){this.closed=true;throw new DocumentPdfError('CLEANUP','Document PDF termination or cleanup was not observed. This service stays closed.');}return true;}
 async dispose(){
  this.closed=true;const job=this.active;if(job){this.stop(job);try{await job.promise;}catch{}}
  await this.verifier.dispose();if(this.cleanupFailure)throw new DocumentPdfError('CLEANUP','Document PDF cleanup was not observed. This service stays closed.');
 }
 async status(){return {...await this.verifier.status(),active:Boolean(this.active),renderActive:Boolean(this.active),closed:this.closed||this.verifier.disposed,cleanupFailure:this.cleanupFailure||this.verifier.engine.cleanupFailure,outputInspection:'Exact SHA-256 and byte length, 1–500 pages, MediaBox widths/heights 100–2000 pt; hidden Chromium printing followed by contained PDF inspection.'};}
 async create(doc,options){
  if(this.closed||this.verifier.disposed)throw new DocumentPdfError('CLOSED','The document PDF containment service has closed.');
  if(this.active)throw new DocumentPdfError('BUSY','Another document PDF is being prepared.');const input=documentHtml(doc,options);options=input.options;const job={...input,token:randomUUID(),canceled:false,timedOut:false,promise:null,printedBytes:null,verifierCancellation:null};this.active=job;
  job.promise=this.render(job,input,options);return await job.promise;
 }
 async render(job,input,options){
  const pageMargins=documentPageMargins(options);let timer,output,result,error;
  const stopped=new Promise((_,reject)=>{job.rejectStop=reject;});stopped.catch(()=>{});
  try{
   const win=new this.BrowserWindow({show:false,width:800,height:1100,autoHideMenuBar:true,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,spellcheck:false,backgroundThrottling:false}});job.window=win;
   win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',event=>event.preventDefault());win.webContents.on('will-attach-webview',event=>event.preventDefault());
   timer=setTimeout(()=>this.stop(job,true),60000);
   output=(async()=>{
    await win.loadURL(`pdfix://app/document-print/${job.token}`);this.check(job);
    if(job.imageCount){await win.webContents.executeJavaScript("Promise.all(Array.from(document.images, async image => {await image.decode();if(!image.complete || image.naturalWidth !== Number(image.dataset.pixelWidth) || image.naturalHeight !== Number(image.dataset.pixelHeight))throw new Error('A bounded embedded image could not be decoded.');})).then(() => true)");this.check(job);}
    const bytes=await win.webContents.printToPDF({pageSize:options.paper==='custom'?{width:options.customSize[0]/25.4,height:options.customSize[1]/25.4}:documentPapers[options.paper].label,landscape:options.landscape,printBackground:true,margins:{top:pageMargins.top/25.4,bottom:pageMargins.bottom/25.4,left:pageMargins.left/25.4,right:pageMargins.right/25.4},displayHeaderFooter:!!(options.pageNumbers||documentBandParagraphs(options,'header').length||documentBandParagraphs(options,'footer').length),headerTemplate:documentBandTemplate(options,'header'),footerTemplate:documentBandTemplate(options,'footer'),generateTaggedPDF:false});
    job.printedBytes=bytes;this.check(job);if(!bytes.length||bytes.length>100*1024*1024)throw new DocumentPdfError('OUTPUT','The document PDF exceeds 100 MB. Try a smaller document.');
    const sourceSha256=hash(bytes),inspection=await this.verifier.inspect(job.token,job.token,bytes);this.check(job);validDocumentOutputInspection(inspection,sourceSha256,bytes.length);
    if(hash(bytes)!==sourceSha256)throw new DocumentPdfError('OUTPUT','The generated document PDF changed before verification.');
    return {bytes:Uint8Array.from(bytes),pageCount:inspection.pageCount,characters:input.characters,imageCount:input.imageCount};
   })();
   result=await Promise.race([output,stopped]);
  }catch(value){error=value;}
  finally{
   clearTimeout(timer);
   // Never free the render slot while late print bytes or verifier work can still arrive.
   if(job.canceled||job.timedOut||this.closed){try{await (job.verifierCancellation??this.verifier.cancel(job.token,job.token));}catch(value){this.closed=true;this.cleanupFailure=true;error=value;}}
   if(output){try{const late=await output;if(late!==result)late.bytes.fill(0);}catch{}}
   try{this.destroyWindow(job);}catch(value){error=value;}
   job.printedBytes?.fill(0);job.printedBytes=null;job.html='';
   if(this.verifier.disposed||this.verifier.engine.cleanupFailure||this.verifier.engine.active?.unsafe){this.closed=true;this.cleanupFailure=true;}
   if(!this.cleanupFailure&&!this.verifier.engine.active?.unsafe&&this.active===job)this.active=null;
  }
  if(this.cleanupFailure){result?.bytes.fill(0);throw new DocumentPdfError('CLEANUP','Document PDF termination or cleanup was not observed. This service stays closed.');}
  try{this.check(job);}catch(value){result?.bytes.fill(0);throw value;}
  if(error){result?.bytes.fill(0);if(error instanceof DocumentPdfError)throw error;throw new DocumentPdfError('PDF','The local document PDF renderer or contained output inspector could not finish. Try a smaller document or export DOCX.');}
  return result;
 }
}
module.exports={DocumentPdfService,DocumentPdfError,documentHtml,documentBandTemplate};
