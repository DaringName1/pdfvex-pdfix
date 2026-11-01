const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {hash,digest,validToken,validSource,validBytes,validInspection,validPlan,validResult}=require('./redaction-contained-validation.cjs');
const {validRedactionDraft}=require('./redaction-validation.cjs');
class RedactionError extends Error{constructor(code,message){super(message);this.code=code;}}
class RedactionService extends ContainedServiceContext{
 constructor(options){super('Clean-image PDF redaction','Redaction',options);this.transaction=null;}
 async cancel(token){const job=this.transaction;if(!job||job.token!==token)return false;job.canceled=true;return super.cancel(job.sourceId,token);}
 async discard(token){if(this.verified?.token===token)this.verified=null;await this.cancel(token);return true;}
 async dispose(){if(this.transaction)this.transaction.canceled=true;await super.dispose();}
 async status(){return {...await super.status(),active:Boolean(this.transaction||this.active)};}
 async verify(sourceId,source,token,bytes,draft){
  if(this.disposed)throw new RedactionError('VERIFY','The redaction containment service has closed.');
  if(this.transaction||this.active)throw new RedactionError('BUSY','Another redaction verification is still finishing.');
  validToken(token);validRedactionDraft(draft);const ownedDraft=structuredClone(draft);this.verified=null;
  let sourceBytes,candidate;
  const job={sourceId,token,canceled:false};this.transaction=job;
  try{
   sourceBytes=validSource(sourceId,source);candidate=validBytes(bytes);const originalLength=sourceBytes.length,outputLength=candidate.length,sourceSha256=hash(sourceBytes),outputSha256=hash(candidate);
   const inspection=await this._runContained(sourceId,token,'redaction-inspect',sourceBytes,{},value=>validInspection(value,sourceSha256,originalLength));
   validInspection(inspection,sourceSha256,originalLength);const plan=validPlan(ownedDraft,inspection.pages);
   if(job.canceled||this.disposed)throw new RedactionError('CANCELED','Redaction canceled. No copy was saved.');
   const result=await this._runContained(sourceId,token,'redaction-verify',candidate,{inspection,draft:plan.draft},value=>validResult(value,inspection,plan.draft,outputSha256,outputLength));
   validResult(result,inspection,plan.draft,outputSha256,outputLength);
   if(job.canceled||this.disposed)throw new RedactionError('CANCELED','Redaction canceled. No copy was saved.');
   // The adapter clears its verification input copy; retain a detached exact preview copy.
   const sealed=validBytes(bytes);if(hash(sealed)!==outputSha256){sealed.fill(0);throw new RedactionError('VERIFY','The clean-image preview changed during verification.');}
   this.verified={sourceId,token,sourceSha256,bytes:Buffer.from(sealed),result:structuredClone(result),resultSha256:digest(result)};sealed.fill(0);
   return structuredClone(result);
  }finally{sourceBytes?.fill(0);candidate?.fill(0);if(this.transaction===job)this.transaction=null;}
 }
 output(sourceId,source,token){
  if(this.disposed)throw new RedactionError('VERIFY','The redaction containment service has closed.');validToken(token);
  const original=validSource(sourceId,source),sourceSha256=hash(original),sealed=this.verified;original.fill(0);
  if(!sealed||sealed.sourceId!==sourceId||sealed.token!==token||sealed.sourceSha256!==sourceSha256||sealed.result.sourceSha256!==sourceSha256||sealed.result.sha256!==hash(sealed.bytes)||sealed.resultSha256!==digest(sealed.result))throw new RedactionError('VERIFY','Rebuild and verify this exact-source redacted preview before saving.');
  return Buffer.from(sealed.bytes);
 }
}
module.exports={RedactionService,RedactionError};
