const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {createHash}=require('node:crypto');
const {reviewSource,reviewFileSource,reviewPages,validReviewReport}=require('./pdf-review-validation.cjs');
class PdfReviewService extends ContainedServiceContext{
 constructor(options){super('Review inventory','Review-inventory',options);}
 async inspect(sourceId,source,pages=null){
  if(this.disposed)throw new Error('The PDF review containment service has closed.');if(this.active)throw new Error('A PDF review inventory is already being prepared or canceled.');
  if(source?.fileBacked){
   const input=reviewFileSource(sourceId,source),selectedPages=reviewPages(pages),sourceSha256=input.sha256;
   const report=await this._runContainedSourceFile(sourceId,null,'review-inventory-file',input,{pages:selectedPages},async value=>{await input.validate();return validReviewReport(value,{sourceSha256,pages:selectedPages});});
   await input.validate();return validReviewReport(report,{sourceSha256,pages:selectedPages});
  }
  const bytes=reviewSource(sourceId,source),selectedPages=reviewPages(pages),sourceSha256=createHash('sha256').update(bytes).digest('hex');
  const report=await this._runContained(sourceId,null,'review-inventory',bytes,{pages:selectedPages},value=>validReviewReport(value,{sourceSha256,pages:selectedPages}));
  return validReviewReport(report,{sourceSha256,pages:selectedPages});
 }
}
module.exports={PdfReviewService};
