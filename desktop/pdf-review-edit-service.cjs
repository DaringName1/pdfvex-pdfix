const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {hash,validReviewEditDraft,validSource,validToken,validReviewEditResult}=require('./pdf-review-edit-validation.cjs');
class PdfReviewEditService extends ContainedServiceContext{
 constructor(options){super('Review editing','Review-edit',options);}
 async build(sourceId,source,token,value){
  if(this.disposed)throw new Error('The review editing containment service has closed.');if(this.active)throw new Error('Finish or cancel the current review editing build first.');
  validToken(token);const draft=structuredClone(validReviewEditDraft(value)),bytes=validSource(sourceId,source),sourceSha256=hash(bytes);this.verified=null;
  // The fixed AppContainer engine is the only path; never fall back to a worker.
  const result=await this._runContained(sourceId,token,'review-edit',bytes,{draft},value=>validReviewEditResult(value,draft,sourceSha256));
  validReviewEditResult(result,draft,sourceSha256);
  this.verified={sourceId,token,sourceSha256,bytes:Buffer.from(result.bytes),report:structuredClone(result.report)};
  return {token,bytes:Uint8Array.from(result.bytes),report:structuredClone(result.report)};
 }
 output(sourceId,source,token){
  if(this.disposed)throw new Error('The review edit service has closed.');validToken(token);
  const current=validSource(sourceId,source),value=this.verified;
  if(!value||value.sourceId!==sourceId||value.token!==token||value.sourceSha256!==hash(current)||value.report.sha256!==hash(value.bytes))throw new Error('Build and review a fresh source-bound review copy before saving.');
  return {bytes:Buffer.from(value.bytes),report:structuredClone(value.report)};
 }
}
module.exports={PdfReviewEditService};
