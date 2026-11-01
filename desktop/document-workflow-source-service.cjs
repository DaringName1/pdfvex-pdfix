const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {validWorkflowSource}=require('./document-workflow-validation.cjs');
const {hash}=require('./pdf-page-order-validation.cjs');
class DocumentWorkflowSourceService extends ContainedServiceContext{
 constructor(options){super('Workflow source identity inspection','Workflow-source',options);}
 async inspect(id,source){validWorkflowSource(id,source);const bytes=Buffer.from(source.bytes),sha256=hash(bytes);if(sha256!==source.fingerprint){bytes.fill(0);throw new Error('The workflow source changed. Reopen it before editing definitions.');}
 const check=value=>{if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join(',')!=='pageCount,sourceSha256'||value.sourceSha256!==sha256||!Number.isInteger(value.pageCount)||value.pageCount<1||value.pageCount>500)throw new Error('The native workflow source identity is invalid.');return value;};
 const result=await this._runContained(id,null,'workflow-source-inspect',bytes,{},check);return check(result);}
}
module.exports={DocumentWorkflowSourceService};
