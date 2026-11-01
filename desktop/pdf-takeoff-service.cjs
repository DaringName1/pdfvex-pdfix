const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {hash,validTakeoffDraft,validSource,validToken,validTakeoffResult}=require('./pdf-takeoff-validation.cjs');
class PdfTakeoffService extends ContainedServiceContext{
 constructor(options){super('Takeoff writing','Takeoff-write',options);}
 async build(sourceId,source,token,value){
  if(this.disposed)throw new Error('The takeoff writing containment service has closed.');if(this.active)throw new Error('Finish or cancel the current takeoff writing build first.');
  validToken(token);const draft=structuredClone(validTakeoffDraft(value)),bytes=validSource(sourceId,source),sourceSha256=hash(bytes);this.verified=null;
  // The fixed AppContainer engine is the only path; never fall back to a worker.
  const result=await this._runContained(sourceId,token,'takeoff-write',bytes,{draft},value=>validTakeoffResult(value,draft,sourceSha256));
  validTakeoffResult(result,draft,sourceSha256);
  this.verified={sourceId,token,sourceSha256,bytes:Buffer.from(result.bytes),report:structuredClone(result.report)};
  return {token,bytes:Uint8Array.from(result.bytes),report:structuredClone(result.report)};
 }
 output(sourceId,source,token){
  if(this.disposed)throw new Error('The takeoff service has closed.');validToken(token);
  const current=validSource(sourceId,source),value=this.verified;
  if(!value||value.sourceId!==sourceId||value.token!==token||value.sourceSha256!==hash(current)||value.report.sha256!==hash(value.bytes))throw new Error('Build and review a fresh source-bound review copy before saving.');
  return {bytes:Buffer.from(value.bytes),report:structuredClone(value.report)};
 }
}
module.exports={PdfTakeoffService};
