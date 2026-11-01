'use strict';
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {hash,validPrintMarksSource,validPrintMarksToken,validPrintMarksDraft,validPrintMarksResult}=require('./pdf-print-marks-validation.cjs');
class PdfPrintMarksService extends ContainedServiceContext{
 constructor(options){super('PDF print production marks','PrintMarks',options);}
 source(id,source){if(this.disposed)throw new Error('The print-marks containment service has closed.');return validPrintMarksSource(id,source);}
 async build(sourceId,source,token,draft){
  if(this.active)throw new Error('A print-mark operation is already running or being canceled.');validPrintMarksToken(token);const plan=validPrintMarksDraft(draft),bytes=this.source(sourceId,source),sourceSha256=hash(bytes),byteLength=bytes.length;this.clearVerified();
  const result=await this._runContained(sourceId,token,'print-marks-build',bytes,{draft:plan},value=>validPrintMarksResult(value,plan,sourceSha256,byteLength));validPrintMarksResult(result,plan,sourceSha256,byteLength);
  this.verified={sourceId,token,sourceSha256,bytes:Buffer.from(result.bytes),report:structuredClone(result.report)};return {token,bytes:Uint8Array.from(result.bytes),report:structuredClone(result.report)};
 }
 output(sourceId,source,token){validPrintMarksToken(token);const bytes=this.source(sourceId,source),sourceSha256=hash(bytes);bytes.fill(0);const value=this.verified;if(!value||value.sourceId!==sourceId||value.token!==token||value.sourceSha256!==sourceSha256||value.report.sha256!==hash(value.bytes))throw new Error('Build and review this print-mark preview again before saving.');return {bytes:Buffer.from(value.bytes),report:structuredClone(value.report)};}
 clearVerified(sourceId,token){const value=this.verified;if(value&&(!sourceId||value.sourceId===sourceId)&&(!token||value.token===token)){value.bytes.fill(0);this.verified=null;}}
 async cancel(sourceId,token){if(typeof sourceId!=='string'||!sourceId)return false;this.clearVerified(sourceId,token);return super.cancel(sourceId,token);}
 async discard(sourceId,token){if(typeof sourceId!=='string'||!sourceId)return false;this.clearVerified(sourceId,token);return super.discard(sourceId,token);}
 async dispose(){this.clearVerified();return super.dispose();}
}
module.exports={PdfPrintMarksService};
