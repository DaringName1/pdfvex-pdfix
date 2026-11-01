'use strict';
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {hash,validFormFillSource,validFormFillToken,validFormFillInspection,validFormFillDraft,validFormFillResult}=require('./form-fill-validation.cjs');
class FormFillService extends ContainedServiceContext{
 constructor(options){super('PDF fill and sign','FormFill',options);this.inspection=null;}
 source(sourceId,source){if(this.disposed)throw new Error('The fill-and-sign containment service has closed.');return validFormFillSource(sourceId,source);}
 async inspect(sourceId,source,token){
  if(this.active)throw new Error('A fill-and-sign operation is still running or being canceled.');validFormFillToken(token);const bytes=this.source(sourceId,source),sourceSha256=hash(bytes);this.inspection=null;this.clearVerified();
  const result=await this._runContained(sourceId,token,'form-fill-inspect',bytes,{},value=>validFormFillInspection(value,sourceSha256));validFormFillInspection(result,sourceSha256);this.inspection={sourceId,sourceSha256,value:structuredClone(result)};return {token,...structuredClone(result)};
 }
 async build(sourceId,source,token,value){
  if(this.active)throw new Error('A fill-and-sign operation is still running or being canceled.');validFormFillToken(token);const bytes=this.source(sourceId,source),sourceSha256=hash(bytes),originalBytes=bytes.length,info=this.inspection?.sourceId===sourceId&&this.inspection.sourceSha256===sourceSha256?this.inspection.value:null;
  let draft;try{if(!info)throw new Error('Inspect this exact source in fill and sign before building a copy.');draft=validFormFillDraft(value,info);}catch(error){bytes.fill(0);throw error;}this.clearVerified();
  const result=await this._runContained(sourceId,token,'form-fill-build',bytes,{draft},value=>validFormFillResult(value,draft,sourceSha256,originalBytes,info));validFormFillResult(result,draft,sourceSha256,originalBytes,info);
  this.verified={sourceId,token,sourceSha256,bytes:Buffer.from(result.bytes),report:structuredClone(result.report)};return {token,bytes:Uint8Array.from(result.bytes),report:structuredClone(result.report)};
 }
 output(sourceId,source,token){
  validFormFillToken(token);const bytes=this.source(sourceId,source),sourceSha256=hash(bytes);bytes.fill(0);const value=this.verified;if(!value||value.sourceId!==sourceId||value.token!==token||value.sourceSha256!==sourceSha256||value.report.sha256!==hash(value.bytes))throw new Error('Build and review the exact source-bound filled copy again before saving.');return {bytes:Buffer.from(value.bytes),report:structuredClone(value.report)};
 }
 clearVerified(sourceId,token){const value=this.verified;if(value&&(!sourceId||value.sourceId===sourceId)&&(!token||value.token===token)){value.bytes.fill(0);this.verified=null;}}
 async cancel(sourceId,token){if(typeof sourceId!=='string'||!sourceId)return false;if(token)validFormFillToken(token);this.clearVerified(sourceId,token);const result=await super.cancel(sourceId,token);if(this.engine.active?.unsafe||this.engine.cleanupFailure)throw new Error('Fill-and-sign process exit or staging cleanup was not observed. Keep this workspace open until containment is resolved.');return result;}
 async discard(sourceId,token){if(typeof sourceId!=='string'||!sourceId)return false;if(token)validFormFillToken(token);this.clearVerified(sourceId,token);return super.discard(sourceId,token);}
 async dispose(){this.clearVerified();this.inspection=null;return super.dispose();}
}
module.exports={FormFillService};
