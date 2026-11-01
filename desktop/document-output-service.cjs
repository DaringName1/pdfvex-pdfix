const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {hash,validDocumentOutputBytes,validDocumentOutputInspection}=require('./document-output-validation.cjs');
class DocumentOutputService extends ContainedServiceContext{
 constructor(options){super('Document PDF output inspection','Document-output',options);}
 async inspect(sourceId,token,value){
  validDocumentOutputBytes(value);const bytes=Uint8Array.from(value),sourceSha256=hash(bytes),byteLength=bytes.length;
  const result=await this._runContained(sourceId,token,'document-output-inspect',bytes,{},report=>validDocumentOutputInspection(report,sourceSha256,byteLength));
  return validDocumentOutputInspection(result,sourceSha256,byteLength);
 }
}
module.exports={DocumentOutputService};
