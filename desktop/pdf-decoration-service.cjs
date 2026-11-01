const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {hash,validDecorationSource,validDecorationToken,validDecorationDraft,validDecorationResult}=require('./pdf-decoration-validation.cjs');
class PdfDecorationService extends ContainedServiceContext{
 constructor(options){super('PDF page decoration and Bates numbering','Decoration',options);}
 source(sourceId,source){if(this.disposed)throw new Error('The PDF decoration containment service has closed.');return validDecorationSource(sourceId,source);}
 async build(sourceId,source,token,draft){
  if(this.active)throw new Error('A decoration operation is already running or being canceled.');validDecorationToken(token);const plan=validDecorationDraft(draft),bytes=this.source(sourceId,source),sourceSha256=hash(bytes),byteLength=bytes.length;this.clearVerified();
  const result=await this._runContained(sourceId,token,'decoration-build',bytes,{draft:plan},value=>validDecorationResult(value,plan,sourceSha256,byteLength));
  validDecorationResult(result,plan,sourceSha256,byteLength);this.verified={sourceId,token,sourceSha256,bytes:Buffer.from(result.bytes),report:structuredClone(result.report)};
  return {token,bytes:Uint8Array.from(result.bytes),report:structuredClone(result.report)};
 }
 output(sourceId,source,token){
  validDecorationToken(token);const bytes=this.source(sourceId,source),sourceSha256=hash(bytes);bytes.fill(0);const value=this.verified;
  if(!value||value.sourceId!==sourceId||value.token!==token||value.sourceSha256!==sourceSha256||value.report.sha256!==hash(value.bytes))throw new Error('Build and review this decoration preview again before saving.');return {bytes:Buffer.from(value.bytes),report:structuredClone(value.report)};
 }
 clearVerified(sourceId,token){const value=this.verified;if(value&&(!sourceId||value.sourceId===sourceId)&&(!token||value.token===token)){value.bytes.fill(0);this.verified=null;}}
 async cancel(sourceId,token){if(typeof sourceId!=='string'||!sourceId)return false;this.clearVerified(sourceId,token);return super.cancel(sourceId,token);}
 async discard(sourceId,token){if(typeof sourceId!=='string'||!sourceId)return false;this.clearVerified(sourceId,token);return super.discard(sourceId,token);}
 async dispose(){this.clearVerified();return super.dispose();}
}
module.exports={PdfDecorationService};
