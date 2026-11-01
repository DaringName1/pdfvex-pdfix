const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {hash,validSource,validToken,canonicalJSON,validPageOrderDraft,validPageOrderInspection,validPageOrderResult}=require('./pdf-page-order-validation.cjs');
class PdfPageOrderService extends ContainedServiceContext{
 constructor(options){super('Preserving PDF page reorder','Page-order',options);}
 source(sourceId,source){const bytes=validSource(sourceId,source);if(source.fingerprint!==hash(bytes)){bytes.fill(0);throw new Error('The PDF source changed before its contained page reorder.');}return bytes;}
 async inspect(sourceId,source){
  if(this.disposed)throw new Error('The page-order containment service has closed.');if(this.active)throw new Error('Finish or cancel the current page-order job first.');
  const bytes=this.source(sourceId,source),sourceSha256=hash(bytes);
  const report=await this._runContained(sourceId,null,'page-order-inspect',bytes,{},value=>validPageOrderInspection(value,sourceSha256));
  return validPageOrderInspection(report,sourceSha256);
 }
 async build(sourceId,source,token,value){
  if(this.disposed)throw new Error('The page-order containment service has closed.');if(this.active)throw new Error('Finish or cancel the current page-order job first.');
  validToken(token);const draft=validPageOrderDraft(value),bytes=this.source(sourceId,source),sourceSha256=hash(bytes),sourceBytes=bytes.length;this.verified=null;
  const result=await this._runContained(sourceId,token,'page-order-build',bytes,{draft},value=>{validPageOrderResult(value,draft,sourceSha256);if(value.report.sourceBytes!==sourceBytes)throw new Error('The page-order receipt changed its exact original byte length.');});
  validPageOrderResult(result,draft,sourceSha256);
  this.verified={sourceId,token,sourceSha256,inspectionSha256:draft.inspectionSha256,selectionSha256:hash(Buffer.from(canonicalJSON(draft.order))),bytes:Buffer.from(result.bytes),report:structuredClone(result.report),receiptSha256:hash(Buffer.from(canonicalJSON(result.report)+'\n'))};
  return {token,bytes:Uint8Array.from(result.bytes),report:structuredClone(result.report),receiptSha256:this.verified.receiptSha256};
 }
 output(sourceId,source,token){
  if(this.disposed)throw new Error('The page-order containment service has closed.');validToken(token);
  const bytes=this.source(sourceId,source),sourceSha256=hash(bytes),value=this.verified;bytes.fill(0);
  if(!value||value.sourceId!==sourceId||value.token!==token||value.sourceSha256!==sourceSha256||value.report.sourceSha256!==sourceSha256||value.report.inspectionSha256!==value.inspectionSha256||value.report.selectionSha256!==value.selectionSha256||value.report.sha256!==hash(value.bytes)||value.receiptSha256!==hash(Buffer.from(canonicalJSON(value.report)+'\n')))throw new Error('Build and review a fresh exact-source page-order copy before saving.');
  return {bytes:Buffer.from(value.bytes),report:structuredClone(value.report)};
 }
}
module.exports={PdfPageOrderService};
