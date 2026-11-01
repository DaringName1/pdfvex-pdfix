const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {hash,canonicalJSON,validSource,validToken,packRevisionSources,validRevisionDraft,validRevisionInspection,validRevisionResult}=require('./pdf-page-revision-validation.cjs');
class PdfPageRevisionService extends ContainedServiceContext{
 constructor(options){super('Reviewed PDF sheet revision','Page-revision',options);}
 sources(sourceId,source,replacementId,replacement){
  const a=validSource(sourceId,source),b=validSource(replacementId,replacement);try{if(sourceId===replacementId||source.fingerprint!==hash(a)||replacement.fingerprint!==hash(b)||hash(a)===hash(b))throw new Error('Choose a different exact original/replacement PDF pair before reviewing a revision.');return {bytes:packRevisionSources(a,b),sourceSha256:hash(a),replacementSha256:hash(b),sourceBytes:a.length,replacementBytes:b.length};}finally{a.fill(0);b.fill(0);}
 }
 async inspect(sourceId,source,replacementId,replacement){
  if(this.disposed||this.active)throw new Error('Finish or cancel the current contained sheet revision first.');const pair=this.sources(sourceId,source,replacementId,replacement);return this._runContained(sourceId,null,'page-revision-inspect',pair.bytes,{},value=>validRevisionInspection(value,pair.sourceSha256,pair.replacementSha256));
 }
 async build(sourceId,source,replacementId,replacement,token,value){
  if(this.disposed||this.active)throw new Error('Finish or cancel the current contained sheet revision first.');validToken(token);const draft=validRevisionDraft(value),pair=this.sources(sourceId,source,replacementId,replacement);this.verified=null;
  // The same pair is independently inspected inside containment immediately before writing.
  const inspection=await this._runContained(sourceId,token,'page-revision-inspect',pair.bytes,{},value=>validRevisionInspection(value,pair.sourceSha256,pair.replacementSha256));
  if(inspection.inspectionSha256!==draft.inspectionSha256)throw new Error('The exact revision source inspection changed. Review it again.');
  const current=this.sources(sourceId,source,replacementId,replacement);
  const result=await this._runContained(sourceId,token,'page-revision-build',current.bytes,{draft},value=>{validRevisionResult(value,draft,inspection);if(value.report.sourceBytes!==pair.sourceBytes||value.report.replacementBytes!==pair.replacementBytes)throw new Error('A revision source byte length changed.');});
  const receiptSha256=hash(Buffer.from(canonicalJSON(result.report)+'\n'));this.verified={sourceId,replacementId,token,sourceSha256:pair.sourceSha256,replacementSha256:pair.replacementSha256,bytes:Buffer.from(result.bytes),report:structuredClone(result.report),receiptSha256};return {token,bytes:Uint8Array.from(result.bytes),report:structuredClone(result.report),receiptSha256};
 }
 output(sourceId,source,replacementId,replacement,token){
  if(this.disposed)throw new Error('The contained sheet revision service has closed.');validToken(token);const pair=this.sources(sourceId,source,replacementId,replacement),v=this.verified;pair.bytes.fill(0);
  if(!v||v.sourceId!==sourceId||v.replacementId!==replacementId||v.token!==token||v.sourceSha256!==pair.sourceSha256||v.replacementSha256!==pair.replacementSha256||v.report.sourceSha256!==pair.sourceSha256||v.report.replacementSha256!==pair.replacementSha256||v.report.sha256!==hash(v.bytes)||v.receiptSha256!==hash(Buffer.from(canonicalJSON(v.report)+'\n')))throw new Error('Prepare and review a fresh copy for this exact original/replacement pair before saving.');return {bytes:Buffer.from(v.bytes),report:structuredClone(v.report)};
 }
}
module.exports={PdfPageRevisionService};
