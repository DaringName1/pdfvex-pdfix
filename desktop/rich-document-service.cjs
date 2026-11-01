const LIMITS=require('./document-limits.cjs');
const {createHash}=require('node:crypto');
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {validRichRequest,validRtfImport,validRichOutput,validDocxImport}=require('./rich-document-validation.cjs');
class RichDocumentService extends ContainedServiceContext{
 constructor(options){super('Rich document processing','Rich-document',options);}
 async run(action,id,source,draft){
  if(!['read-docx','read-rtf','write-docx','write-rtf'].includes(action))throw new Error('Unsupported contained rich document operation.');
  const sourceId=id??'new-rich-document';if(typeof sourceId!=='string'||!sourceId||sourceId.length>100||/[\x00-\x1f]/.test(sourceId))throw new Error('Invalid rich document source identity.');
  const reading=action==='read-rtf'||action==='read-docx';
  if(reading&&(!source||source.ext!==(action==='read-docx'?'docx':'rtf')||source.bytes.length>LIMITS.WORD_IMPORT_BYTES))throw new Error(!source||source.ext!==(action==='read-docx'?'docx':'rtf')?'Open a DOCX or RTF file to edit it.':'This document is larger than 100 MB, the most PDFix can open for editing. Open it in Word and use Compress Pictures, or save a copy without large pictures, then open that copy here.');
  const bytes=source?Uint8Array.from(source.bytes):Uint8Array.of(1);if(!bytes.length||bytes.length>100*1024*1024)throw new Error('Invalid immutable document source.');
  if(source&&createHash('sha256').update(bytes).digest('hex')!==source.fingerprint){bytes.fill(0);throw new Error('The document source changed before containment.');}
  let options;try{options=reading?{}:{draft:structuredClone(validRichRequest(draft))};}catch(error){bytes.fill(0);throw error;}
  return this._runContained(sourceId,null,action==='read-docx'?'rich-docx-read':action==='read-rtf'?'rich-rtf-read':action==='write-docx'?'rich-docx-write':'rich-rtf-write',bytes,options,action==='read-docx'?validDocxImport:action==='read-rtf'?validRtfImport:value=>validRichOutput(value,action==='write-docx'?'docx':'rtf'));
 }
}
let service=new RichDocumentService(),restart=null;
async function richDocumentJob(action,id,source,draft){if(restart)await restart;return service.run(action,id,source,draft);}
async function cancelRichDocumentJob(id){return service.cancel(id??'new-rich-document');}
async function disposeRichDocumentService(){return service.dispose();}
function restartRichDocumentService(){if(restart)return restart;const old=service;restart=old.dispose().then(()=>{if(service===old)service=new RichDocumentService(old.options);}).finally(()=>{restart=null;});return restart;}
async function richDocumentStatus(){return service.status();}
module.exports={richDocumentJob,cancelRichDocumentJob,disposeRichDocumentService,restartRichDocumentService,richDocumentStatus};
