'use strict';
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {hash,selection,validBookmarkSource,validBookmarkToken,validBookmarkInspection,validBookmarkResult}=require('./pdf-bookmark-validation.cjs');
class PdfBookmarkError extends Error{constructor(message){super(message);this.code='PDF_BOOKMARK';}}
class PdfBookmarkService extends ContainedServiceContext{
 constructor(options){super('PDF bookmark outline editing','Bookmark',options);}
 source(sourceId,source){if(this.disposed)throw new PdfBookmarkError('The PDF bookmark containment service has closed.');try{return validBookmarkSource(sourceId,source);}catch(error){throw new PdfBookmarkError(error.message);}}
 async inspect(sourceId,source){
  if(this.active)throw new PdfBookmarkError('A bookmark operation is already running or being canceled.');const bytes=this.source(sourceId,source),sourceSha256=hash(bytes);
  try{const report=await this._runContained(sourceId,null,'bookmark-inspect',bytes,{},value=>validBookmarkInspection(value,sourceSha256));return validBookmarkInspection(report,sourceSha256);}catch(error){throw new PdfBookmarkError(error.message);}
 }
 async build(sourceId,source,token,value){
  if(this.active)throw new PdfBookmarkError('A bookmark operation is already running or being canceled.');let selected;try{validBookmarkToken(token);selected=selection(value);}catch(error){throw new PdfBookmarkError(error.message);}const bytes=this.source(sourceId,source),sourceSha256=hash(bytes),byteLength=bytes.length;this.clearVerified();
  try{const result=await this._runContained(sourceId,token,'bookmark-build',bytes,{selection:selected},result=>validBookmarkResult(result,selected,sourceSha256,byteLength));validBookmarkResult(result,selected,sourceSha256,byteLength);this.verified={sourceId,token,sourceSha256,bytes:Buffer.from(result.bytes),report:structuredClone(result.report)};return {token,bytes:Uint8Array.from(result.bytes),report:structuredClone(result.report)};}catch(error){throw new PdfBookmarkError(error.message);}
 }
 output(sourceId,source,token){
  try{validBookmarkToken(token);}catch(error){throw new PdfBookmarkError(error.message);}const value=this.verified,bytes=this.source(sourceId,source),sourceSha256=hash(bytes);bytes.fill(0);
  if(!value||value.sourceId!==sourceId||value.token!==token||value.sourceSha256!==sourceSha256||value.report.sha256!==hash(value.bytes))throw new PdfBookmarkError('Build and review a fresh bookmark copy before saving.');return {bytes:Buffer.from(value.bytes),report:structuredClone(value.report)};
 }
 clearVerified(sourceId,token){const value=this.verified;if(value&&(!sourceId||value.sourceId===sourceId)&&(!token||value.token===token)){value.bytes.fill(0);this.verified=null;}}
 async cancel(sourceId,token){if(typeof sourceId!=='string'||!sourceId)return false;this.clearVerified(sourceId,token);return super.cancel(sourceId,token);}
 async discard(sourceId,token){if(typeof sourceId!=='string'||!sourceId)return false;this.clearVerified(sourceId,token);return super.discard(sourceId,token);}
 async dispose(){this.clearVerified();return super.dispose();}
}
module.exports={PdfBookmarkService,PdfBookmarkError};
