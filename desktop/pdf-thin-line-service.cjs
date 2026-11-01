'use strict';
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const c=require('./pdf-thin-line-validation.cjs');
class PdfThinLineService extends ContainedServiceContext{
 constructor(options){super('PDF thin-line inspection and repair','ThinLine',options);}
 async inspect(sourceId,source,thresholdPt=.25){const threshold=c.threshold(thresholdPt),bytes=c.validSecuritySource(sourceId,source),sha=c.hash(bytes);return this._runContained(sourceId,null,'thin-line-inspect',bytes,{thresholdPt:threshold},value=>c.validInspection(value,sha,threshold));}
 async build(sourceId,source,token,value){c.validToken(token);const draft=c.validDraft(value),bytes=c.validSecuritySource(sourceId,source),sha=c.hash(bytes),length=bytes.length;this.clearVerified();const result=await this._runContained(sourceId,token,'thin-line-build',bytes,{draft},value=>c.validResult(value,draft,sha,length));c.validResult(result,draft,sha,length);this.verified={sourceId,token,sourceSha256:sha,bytes:Buffer.from(result.bytes),report:structuredClone(result.report)};return {token,bytes:Uint8Array.from(result.bytes),report:structuredClone(result.report)};}
 output(sourceId,source,token){if(this.disposed)throw new Error('The thin-line service has closed.');c.validToken(token);const sourceBytes=c.validSecuritySource(sourceId,source),sha=c.hash(sourceBytes);sourceBytes.fill(0);const v=this.verified;if(!v||v.sourceId!==sourceId||v.token!==token||v.sourceSha256!==sha||v.report.sha256!==c.hash(v.bytes))throw new Error('Prepare and review a fresh thin-line copy before saving.');return {bytes:Buffer.from(v.bytes),report:structuredClone(v.report)};}
 clearVerified(sourceId,token){const v=this.verified;if(v&&(!sourceId||v.sourceId===sourceId)&&(!token||v.token===token)){v.bytes.fill(0);this.verified=null;}}
 async cancel(sourceId,token){this.clearVerified(sourceId,token);return super.cancel(sourceId,token);}
 async discard(sourceId,token){this.clearVerified(sourceId,token);return super.discard(sourceId,token);}
 async dispose(){this.clearVerified();return super.dispose();}
}
module.exports={PdfThinLineService};
