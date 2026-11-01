'use strict';
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {hash,selection,validTagsSource,validTagsToken,validTagsInspection,validTagsResult}=require('./pdf-tags-validation.cjs');
class PdfTagsError extends Error{constructor(message){super(message);this.code='PDF_TAGS';}}
class PdfTagsService extends ContainedServiceContext{
 constructor(options){super('PDF accessibility tag-tree remediation','Tags',options);}
 source(sourceId,source){if(this.disposed)throw new PdfTagsError('The PDF tag-tree containment service has closed.');try{return validTagsSource(sourceId,source);}catch(error){throw new PdfTagsError(error.message);}}
 async inspect(sourceId,source){
  if(this.active)throw new PdfTagsError('A tag-tree operation is already running or being canceled.');const bytes=this.source(sourceId,source),sourceSha256=hash(bytes);
  try{const report=await this._runContained(sourceId,null,'tags-inspect',bytes,{},value=>validTagsInspection(value,sourceSha256));return validTagsInspection(report,sourceSha256);}catch(error){throw new PdfTagsError(error.message);}
 }
 async build(sourceId,source,token,value){
  if(this.active)throw new PdfTagsError('A tag-tree operation is already running or being canceled.');let selected;try{validTagsToken(token);selected=selection(value);}catch(error){throw new PdfTagsError(error.message);}const bytes=this.source(sourceId,source),sourceSha256=hash(bytes),byteLength=bytes.length;this.clearVerified();
  try{const result=await this._runContained(sourceId,token,'tags-build',bytes,{selection:selected},result=>validTagsResult(result,selected,sourceSha256,byteLength));validTagsResult(result,selected,sourceSha256,byteLength);this.verified={sourceId,token,sourceSha256,bytes:Buffer.from(result.bytes),report:structuredClone(result.report),receiptSha256:hash(JSON.stringify(result.report))};return {token,bytes:Uint8Array.from(result.bytes),report:structuredClone(result.report)};}catch(error){throw new PdfTagsError(error.message);}
 }
 output(sourceId,source,token){
  try{validTagsToken(token);}catch(error){throw new PdfTagsError(error.message);}const value=this.verified,bytes=this.source(sourceId,source),sourceSha256=hash(bytes);bytes.fill(0);
  if(!value||value.sourceId!==sourceId||value.token!==token||value.sourceSha256!==sourceSha256||value.report.sha256!==hash(value.bytes)||value.receiptSha256!==hash(JSON.stringify(value.report)))throw new PdfTagsError('Build and review a fresh tag-tree copy before saving.');return {bytes:Buffer.from(value.bytes),report:structuredClone(value.report)};
 }
 clearVerified(sourceId,token){const value=this.verified;if(value&&(!sourceId||value.sourceId===sourceId)&&(!token||value.token===token)){value.bytes.fill(0);this.verified=null;}}
 async cancel(sourceId,token){if(typeof sourceId!=='string'||!sourceId)return false;this.clearVerified(sourceId,token);const job=this.active,matched=job?.sourceId===sourceId&&(!token||job.token===token),cancelled=await super.cancel(sourceId,token);if(matched&&(this.engine.active?.unsafe||this.engine.cleanupFailure))throw new PdfTagsError('Tag containment termination or cleanup was not observed. The service remains unavailable.');if(matched)await job.promise?.catch(()=>{});return cancelled;}
 async discard(sourceId,token){if(typeof sourceId!=='string'||!sourceId)return false;this.clearVerified(sourceId,token);await this.cancel(sourceId,token);return true;}
 async dispose(){this.clearVerified();return super.dispose();}
}
module.exports={PdfTagsService,PdfTagsError};

