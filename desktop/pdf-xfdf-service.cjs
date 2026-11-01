const path=require('node:path'),os=require('node:os');
const {DocumentSandboxService}=require('./document-sandbox-service.cjs');
const {hash,canonicalJSON,validXfdfDraft,validSource,validToken,validXfdfResult}=require('./pdf-xfdf-validation.cjs');
class PdfXfdfService{
 constructor({runtimeDirectory=path.resolve(__dirname,'../dist/native/document-engine'),stagingDirectory=path.join(os.tmpdir(),'PDFix-contained-XFDF')}={}){this.options={runtimeDirectory,stagingDirectory};this.engine=new DocumentSandboxService(this.options);this.active=null;this.verified=null;this.generation=0;this.disposed=false;}
 async build(sourceId,source,token,value){
  if(this.disposed)throw new Error('The XFDF containment service has closed.');if(this.active)throw new Error('Finish or cancel the current XFDF export first.');
  validToken(token);const draft=validXfdfDraft(value),bytes=validSource(sourceId,source),sourceSha256=hash(bytes),generation=++this.generation,controller=new AbortController(),job={sourceId,token,generation,controller,promise:null};this.verified=null;this.active=job;
  // No worker/direct fallback. Missing broker/runtime, containment or cleanup fails closed.
  job.promise=this.engine.run('xfdf-export',bytes,{draft},result=>validXfdfResult(result,draft,sourceSha256),{signal:controller.signal});
  let result;try{result=await job.promise;}finally{bytes.fill(0);if(this.engine.closed)this.disposed=true;if(!this.engine.active?.unsafe&&this.active===job)this.active=null;}
  if(this.disposed||generation!==this.generation)throw new Error('XFDF export canceled. No output was saved.');
  validXfdfResult(result,draft,sourceSha256);this.verified={sourceId,token,sourceSha256,bytes:Buffer.from(result.bytes),report:structuredClone(result.report)};
  return {token,bytes:Uint8Array.from(result.bytes),report:structuredClone(result.report),receiptSha256:hash(Buffer.from(canonicalJSON(result.report)+'\n'))};
 }
 output(sourceId,source,token){
  if(this.disposed)throw new Error('The XFDF containment service has closed.');validToken(token);const current=validSource(sourceId,source),value=this.verified;
  if(!value||value.sourceId!==sourceId||value.token!==token||value.sourceSha256!==hash(current)||value.report.sha256!==hash(value.bytes))throw new Error('Build and review a fresh source-bound XFDF export before saving.');
  return {bytes:Buffer.from(value.bytes),report:structuredClone(value.report)};
 }
 async cancel(sourceId,token){const job=this.active;if(job?.sourceId!==sourceId||token&&job.token!==token)return false;this.generation++;job.controller.abort();await this.engine.cancel();return !this.engine.active?.unsafe;}
 async discard(sourceId,token){if(this.verified?.sourceId===sourceId&&(!token||this.verified.token===token))this.verified=null;await this.cancel(sourceId,token);return true;}
 async dispose(){this.disposed=true;this.generation++;this.verified=null;this.active?.controller.abort();await this.engine.dispose();if(this.engine.cleanupFailure||this.engine.active?.unsafe)throw new Error('XFDF containment termination/cleanup could not be observed. This service stays closed.');}
 async status(){return this.engine.status();}
}
module.exports={PdfXfdfService};
