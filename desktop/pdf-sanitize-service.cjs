const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {hash,choices,validSanitizeSource,validSanitizeToken,validSanitizeInspection,validSanitizeResult}=require('./pdf-sanitize-validation.cjs');
class PdfSanitizeService extends ContainedServiceContext{
 constructor(options){super('PDF structural cleanup','Sanitize',options);}
 validate(sourceId,source){if(this.disposed)throw new Error('The PDF cleanup containment service has closed.');return validSanitizeSource(sourceId,source);}
 async inspect(sourceId,source){
  if(this.active)throw new Error('A PDF cleanup operation is already running or being canceled.');
  const bytes=this.validate(sourceId,source),sourceSha256=hash(bytes),byteLength=bytes.length;
  const report=await this._runContained(sourceId,null,'sanitize-inspect',bytes,{},value=>validSanitizeInspection(value,sourceSha256,byteLength));
  return validSanitizeInspection(report,sourceSha256,byteLength);
 }
 async build(sourceId,source,token,selection){
  if(this.active)throw new Error('A PDF cleanup operation is already running or being canceled.');
  validSanitizeToken(token);const selected=choices(selection),bytes=this.validate(sourceId,source),sourceSha256=hash(bytes),byteLength=bytes.length;this.verified=null;
  const result=await this._runContained(sourceId,token,'sanitize-build',bytes,{selection:selected},value=>validSanitizeResult(value,selected,sourceSha256,byteLength));
  validSanitizeResult(result,selected,sourceSha256,byteLength);
  this.verified={sourceId,token,sourceSha256,bytes:Buffer.from(result.bytes),report:structuredClone(result.report)};
  return {token,bytes:Uint8Array.from(result.bytes),report:structuredClone(result.report)};
 }
 output(sourceId,source,token){
  validSanitizeToken(token);const value=this.verified,bytes=this.validate(sourceId,source);const sourceSha256=hash(bytes);bytes.fill(0);
  if(!value||value.sourceId!==sourceId||value.token!==token||value.sourceSha256!==sourceSha256||value.report.sha256!==hash(value.bytes))throw new Error('Build and review a new source-bound cleanup preview before saving.');
  return {bytes:Buffer.from(value.bytes),report:structuredClone(value.report)};
 }
}
module.exports={PdfSanitizeService};
