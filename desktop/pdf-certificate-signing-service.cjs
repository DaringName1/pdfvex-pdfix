'use strict';
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {CertificateSigningProvider}=require('./certificate-signing-provider.cjs');
const {hash,token:validToken,selection,validSigningSource,validInspection,validPreparation,validSignedResult}=require('./pdf-certificate-signing-validation.cjs');
class PdfCertificateSigningService extends ContainedServiceContext{
 constructor(options){super('PDF certificate signing','CertificateSigning',options);this.provider=new CertificateSigningProvider(options);this.signing=null;}
 async inspect(sourceId,source){if(this.signing)throw new Error('Finish or cancel the signing operation first.');const bytes=validSigningSource(sourceId,source),sha256=hash(bytes),length=bytes.length;return this._runContained(sourceId,null,'certificate-sign-inspect',bytes,{},report=>validInspection(report,sha256,length));}
 async listCertificates(){if(this.disposed||this.signing)throw new Error('The certificate signing service is closed or busy.');return this.provider.list();}
 async sign(sourceId,source,operationToken,value){
  if(this.disposed||this.signing||this.active||this.provider.active)throw new Error('Finish or cancel the current certificate operation first.');validToken(operationToken);const chosen=selection(value),selected=this.provider.selected(chosen.certificateId),bytes=validSigningSource(sourceId,source),sourceSha256=hash(bytes),sourceBytes=bytes.length;this.clearVerified();
  let finish;const operation={sourceId,token:operationToken,controller:new AbortController(),done:new Promise(resolve=>{finish=resolve;})};this.signing=operation;let prepared=null;
  const current=()=>{if(operation.controller.signal.aborted||this.disposed)throw new Error('Certificate signing canceled. No saveable copy was released.');};
  try{
   prepared=await this._runContained(sourceId,operationToken,'certificate-sign-prepare',bytes,{certificateDer:selected.certificateDer,certificateFingerprint:selected.id,reason:chosen.reason,location:chosen.location},result=>{validPreparation(result,sourceSha256,sourceBytes,selected.id);if(result.report.reason!==chosen.reason||result.report.location!==chosen.location)throw new Error('The prepared signature differs from the reviewed signing details.');});current();
   const signature=await this.provider.sign(selected,prepared.report,{signal:operation.controller.signal});current();
   const range=prepared.report.byteRange,coveredSha256=hash(Buffer.concat([Buffer.from(prepared.bytes.subarray(0,range[1])),Buffer.from(prepared.bytes.subarray(range[2]))]));
   const result=await this._runContained(sourceId,operationToken,'certificate-sign-finalize',Buffer.from(prepared.bytes),{preparation:prepared.report,certificateDer:selected.certificateDer,signature},result=>{validSignedResult(result,prepared.report);if(hash(Buffer.concat([Buffer.from(result.bytes.subarray(0,range[1])),Buffer.from(result.bytes.subarray(range[2]))]))!==coveredSha256)throw new Error('Signed content changed after the Windows provider approved its digest.');});current();
   // DER bundles from the independent verifier stay inside the trusted boundary.
   const report=structuredClone(result.report);for(const row of report.signatureInspection.signatures)row.certificateBundle=null;
   this.verified={sourceId,token:operationToken,sourceSha256,bytes:Buffer.from(result.bytes),report};return {token:operationToken,bytes:Uint8Array.from(result.bytes),report:structuredClone(report)};
  }finally{bytes.fill(0);prepared?.bytes?.fill(0);if(!this.provider.active?.unsafe&&this.signing===operation)this.signing=null;finish();}
 }
 output(sourceId,source,operationToken){validToken(operationToken);const bytes=validSigningSource(sourceId,source),sourceSha256=hash(bytes);bytes.fill(0);const value=this.verified;if(!value||value.sourceId!==sourceId||value.token!==operationToken||value.sourceSha256!==sourceSha256||value.report.sha256!==hash(value.bytes))throw new Error('Sign and verify a fresh source copy before saving.');return {bytes:Buffer.from(value.bytes),report:structuredClone(value.report)};}
 clearVerified(sourceId,operationToken){const value=this.verified;if(value&&(!sourceId||value.sourceId===sourceId)&&(!operationToken||value.token===operationToken)){value.bytes.fill(0);this.verified=null;}}
 async cancel(sourceId,operationToken){this.clearVerified(sourceId,operationToken);const operation=this.signing;if(operation&&(operation.sourceId!==sourceId||operationToken&&operation.token!==operationToken))return false;operation?.controller.abort();await super.cancel(sourceId,operationToken);const stopped=await this.provider.cancel();if(operation)await operation.done;return stopped&&!this.engine.active?.unsafe;}
 async discard(sourceId,operationToken){this.clearVerified(sourceId,operationToken);if(!operationToken||this.signing?.sourceId===sourceId&&this.signing?.token===operationToken||this.active?.sourceId===sourceId&&this.active?.token===operationToken)return this.cancel(sourceId,operationToken);return true;}
 async dispose(){this.disposed=true;this.clearVerified();this.signing?.controller.abort();const results=await Promise.allSettled([super.dispose(),this.provider.dispose()]);if(this.signing)await this.signing.done;for(const result of results)if(result.status==='rejected')throw result.reason;}
}
module.exports={PdfCertificateSigningService};
