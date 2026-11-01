const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {hash,canonicalJSON,validSource,validToken,xfdfBytes,validXfdfImportInspection,validXfdfImportDraft,validXfdfImportProposal,validXfdfImportResult}=require('./pdf-xfdf-import-validation.cjs');
class PdfXfdfImportService extends ContainedServiceContext{
 constructor(options){super('XFDF comment import','XFDF-import',options);}
 source(sourceId,source){const bytes=validSource(sourceId,source);if(source.fingerprint!==hash(bytes)){bytes.fill(0);throw new Error('The PDF source changed before its contained XFDF import.');}return bytes;}
 async inspect(sourceId,source,value){
  if(this.disposed)throw new Error('The XFDF import containment service has closed.');if(this.active)throw new Error('Finish or cancel the current XFDF import job first.');
  const options=validXfdfImportInspection(value),xml=xfdfBytes(options.xfdf),xfdfSha256=hash(xml);xml.fill(0);
  const bytes=this.source(sourceId,source),sourceSha256=hash(bytes);
  const report=await this._runContained(sourceId,null,'xfdf-import-inspect',bytes,options,value=>validXfdfImportProposal(value,sourceSha256,xfdfSha256));
  return validXfdfImportProposal(report,sourceSha256,xfdfSha256);
 }
 async build(sourceId,source,token,value){
  if(this.disposed)throw new Error('The XFDF import containment service has closed.');if(this.active)throw new Error('Finish or cancel the current XFDF import job first.');
  validToken(token);const draft=validXfdfImportDraft(value),xml=xfdfBytes(draft.xfdf),xfdfSha256=hash(xml);xml.fill(0);
  const bytes=this.source(sourceId,source),sourceSha256=hash(bytes),sourceBytes=bytes.length;this.verified=null;
  const result=await this._runContained(sourceId,token,'xfdf-import-build',bytes,{draft},value=>{validXfdfImportResult(value,draft,sourceSha256);if(value.report.sourceBytes!==sourceBytes||value.report.xfdfSha256!==xfdfSha256)throw new Error('The imported copy changed its original source/XML receipt.');});
  validXfdfImportResult(result,draft,sourceSha256);
  this.verified={sourceId,token,sourceSha256,xfdfSha256,proposalSha256:draft.proposalSha256,bytes:Buffer.from(result.bytes),report:structuredClone(result.report)};
  return {token,bytes:Uint8Array.from(result.bytes),report:structuredClone(result.report),receiptSha256:hash(Buffer.from(canonicalJSON(result.report)+'\n'))};
 }
 output(sourceId,source,token){
  if(this.disposed)throw new Error('The XFDF import containment service has closed.');validToken(token);
  const bytes=this.source(sourceId,source),sourceSha256=hash(bytes),value=this.verified;bytes.fill(0);
  if(!value||value.sourceId!==sourceId||value.token!==token||value.sourceSha256!==sourceSha256||value.report.xfdfSha256!==value.xfdfSha256||value.report.proposalSha256!==value.proposalSha256||value.report.sha256!==hash(value.bytes))throw new Error('Inspect, build and review a fresh exact-source/XML import before saving.');
  return {bytes:Buffer.from(value.bytes),report:structuredClone(value.report)};
 }
}
module.exports={PdfXfdfImportService};
