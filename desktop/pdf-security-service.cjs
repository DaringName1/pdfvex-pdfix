const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {MAX_BYTES,hash,validSecuritySource,validSecurityReport}=require('./pdf-security-validation.cjs');
class PdfSecurityService extends ContainedServiceContext{
 constructor(options){super('PDF structural security report','Security',options);}
 async inspect(sourceId,source){
  if(this.disposed)throw new Error('The PDF security containment service has closed.');if(this.active)throw new Error('A PDF security report is already being prepared or canceled.');
  const bytes=validSecuritySource(sourceId,source),sourceSha256=hash(bytes),byteLength=bytes.length;
  const report=await this._runContained(sourceId,null,'security-inspect',bytes,{},value=>validSecurityReport(value,{sourceSha256,byteLength}));
  return validSecurityReport(report,{sourceSha256,byteLength});
 }
}
module.exports={PdfSecurityService,MAX_BYTES};
