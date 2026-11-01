const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {createHash}=require('node:crypto');
const {validSource}=require('./pdf-takeoff-validation.cjs');
const {validRecoveryReport}=require('./pdf-takeoff-recovery-validation.cjs');
class PdfTakeoffRecoveryService extends ContainedServiceContext{
 constructor(options){super('Takeoff recovery','Takeoff-recovery',options);}
 async inspect(sourceId,source){
  if(this.disposed)throw new Error('The PDF takeoff recovery containment service has closed.');if(this.active)throw new Error('A PDF takeoff recovery is already being prepared or canceled.');
  const bytes=validSource(sourceId,source),sourceSha256=createHash('sha256').update(bytes).digest('hex');
  const report=await this._runContained(sourceId,null,'takeoff-recovery',bytes,{name:source.name},value=>validRecoveryReport(value,sourceSha256));
  return validRecoveryReport(report,sourceSha256);
 }
}
module.exports={PdfTakeoffRecoveryService};
