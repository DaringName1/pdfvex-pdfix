const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {hash,validCertificateSource,validCertificateReport}=require('./pdf-certificate-validation.cjs');
const {CertificateTrustService}=require('./certificate-trust-service.cjs');
class PdfCertificateService extends ContainedServiceContext{
 constructor(options){super('PDF certificate inspection','Certificates',options);this.trustEngine=new CertificateTrustService(options);this.inspection=null;}
 async inspect(sourceId,source){
  if(this.inspection||this.active)throw new Error('A certificate inspection is already running or being canceled.');
  if(this.disposed)throw new Error('The certificate inspection service has closed.');
  const bytes=validCertificateSource(sourceId,source),sourceSha256=hash(bytes),byteLength=bytes.length;
  let finish;const operation={sourceId,controller:new AbortController(),done:new Promise(resolve=>{finish=resolve;})};this.inspection=operation;
  try{
   const result=await this._runContained(sourceId,null,'certificate-inspect',bytes,{},value=>validCertificateReport(value,sourceSha256,byteLength,{internal:true}));
   if(operation.controller.signal.aborted||this.disposed)throw new Error('Certificate inspection canceled.');
   try{const chains=await this.trustEngine.inspect(result,{signal:operation.controller.signal});for(const chain of chains)Object.assign(result.signatures[chain.index-1],{trust:chain.trust,chainInspection:chain.chainInspection});}
   catch(error){
    if(operation.controller.signal.aborted||this.disposed||this.trustEngine.active?.unsafe)throw error;
    for(const row of result.signatures)if(row.integrity==='verified')row.trust='unavailable';
    result.limits.push('Offline Windows certificate-chain inspection was unavailable. Certificate trust has not been established.');
   }
   // Raw certificates belong to the native adapter boundary, never renderer IPC.
   for(const row of result.signatures){row.certificateBundle=null;if(row.integrity==='verified')row.reason='The signature mathematics and any signed content digest match the covered source bytes. Certificate-chain trust is reported separately; document modification policy remains unchecked.';}
   result.scope='Cryptographic integrity and offline Windows base-chain inspection at the current time only. Field visibility, allowed changes, document-signing EKU/policy, revocation, trusted signing time, Adobe/EU trust lists and complete PAdES validation are not established.';
   if(operation.controller.signal.aborted||this.disposed)throw new Error('Certificate inspection canceled.');
   return validCertificateReport(result,sourceSha256,byteLength);
  }finally{bytes.fill(0);if(!this.trustEngine.active?.unsafe&&this.inspection===operation)this.inspection=null;finish();}
 }
 async cancel(sourceId,token){const operation=this.inspection;if(!operation||operation.sourceId!==sourceId)return super.cancel(sourceId,token);operation.controller.abort();await super.cancel(sourceId,token);const stopped=await this.trustEngine.cancel();await operation.done;return stopped&&!this.engine.active?.unsafe;}
 async dispose(){this.disposed=true;this.inspection?.controller.abort();const results=await Promise.allSettled([super.dispose(),this.trustEngine.dispose()]);if(this.inspection)await this.inspection.done;for(const result of results)if(result.status==='rejected')throw result.reason;}
}
module.exports={PdfCertificateService};
