'use strict';
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const checks=require('./pdf-preflight-validation.cjs');
class PdfPreflightService extends ContainedServiceContext{
 constructor(options){super('PDF practical preflight inspection','Preflight',options);}
 async inspect(sourceId,source,profileId='practical-print-v1'){
  if(this.active)throw new Error('Finish or cancel the current preflight job first.');
  const selected=checks.profile(profileId),bytes=checks.validSecuritySource(sourceId,source),binding={sourceSha256:checks.hash(bytes),sourceBytes:bytes.length,profileId:selected.id};
  const report=await this._runContained(sourceId,null,'preflight-inspect',bytes,{profileId:selected.id},value=>checks.inventory(value,binding));return checks.inventory(report,binding);
 }
}
module.exports={PdfPreflightService};
