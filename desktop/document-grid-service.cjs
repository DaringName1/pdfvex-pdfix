const {createHash}=require('node:crypto');
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {validDocumentGridReport}=require('./document-grid-validation.cjs');
const LIMITS=require('./document-limits.cjs');
class DocumentGridService extends ContainedServiceContext{
 constructor(options){super('DOCX table grid import','Document-grid',options);}
 async inspect(id,source){
  if(this.disposed)throw new Error('The document grid containment service has closed.');if(this.active)throw new Error('Finish or cancel the current document table-grid job first.');
  if(typeof id!=='string'||!id||id.length>100||/[\x00-\x1f]/.test(id)||!source||source.ext!=='docx'||!(source.bytes instanceof Uint8Array)||source.bytes.length<22||source.bytes.length>LIMITS.WORD_IMPORT_BYTES||typeof source.fingerprint!=='string'||!/^[a-f0-9]{64}$/.test(source.fingerprint))throw new Error('Choose an opened DOCX within the 10 MiB table-grid import budget.');
  const bytes=Uint8Array.from(source.bytes),sourceSha256=createHash('sha256').update(bytes).digest('hex');
  if(sourceSha256!==source.fingerprint){bytes.fill(0);throw new Error('The DOCX source changed before its contained table-grid inspection.');}
  const report=await this._runContained(id,null,'document-table-grids',bytes,{},value=>validDocumentGridReport(value,sourceSha256));
  return validDocumentGridReport(report,sourceSha256);
 }
}
let service=new DocumentGridService(),restart=null;
async function inspectDocumentTableGrids(id,source){if(restart)await restart;return service.inspect(id,source);}
async function cancelDocumentTableGrids(id){return service.cancel(id??service.active?.sourceId);}
async function disposeDocumentTableGrids(){await service.dispose();}
function restartDocumentTableGrids(){if(restart)return restart;const old=service;restart=old.dispose().then(()=>{if(service===old)service=new DocumentGridService(old.options);}).finally(()=>{restart=null;});return restart;}
async function documentTableGridStatus(){return service.status();}
module.exports={DocumentGridService,inspectDocumentTableGrids,cancelDocumentTableGrids,disposeDocumentTableGrids,restartDocumentTableGrids,documentTableGridStatus};
