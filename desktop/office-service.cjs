const {createHash,randomUUID}=require('node:crypto');
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {validWorkbookDraft}=require('./workbook-validation.cjs');
const {validPresentationDraft}=require('./presentation-validation.cjs');
const {validWorkbookModel,validPresentationModel,validOfficeCopy}=require('./office-model-validation.cjs');
const actions=Object.freeze({read:'workbook-read',write:'workbook-write','read-presentation':'presentation-read','write-presentation':'presentation-write'});
class OfficeService extends ContainedServiceContext{
 constructor(options){super('Office document processing','Office',options);}
 async run(action,bytes,draft,context={}){
  if(this.disposed)throw new Error('The Office containment service has closed.');if(this.active)throw new Error('Finish or cancel the current Office document job first.');
  if(!Object.hasOwn(actions,action)||!(bytes instanceof Uint8Array)||bytes.length<22||bytes.length>10*1024*1024)throw new Error('Choose an Office document within the 10 MiB input budget.');
  const sourceSha256=createHash('sha256').update(bytes).digest('hex');
  if(context.sourceSha256!==undefined&&context.sourceSha256!==sourceSha256)throw new Error('The Office source changed before its contained job.');
  const sourceId=context.sourceId??'office:'+randomUUID();if(typeof sourceId!=='string'||!sourceId||sourceId.length>100||/[\x00-\x1f]/.test(sourceId))throw new Error('Invalid Office source identity.');
  const options={};if(action==='write')options.draft=structuredClone(validWorkbookDraft(draft));else if(action==='write-presentation')options.draft=structuredClone(validPresentationDraft(draft));
  const validator=action==='read'?validWorkbookModel:action==='read-presentation'?validPresentationModel:validOfficeCopy;
  // ZIP/XML import, writing and output reopening occur only in the fixed contained child.
  // Parent checks inert shapes and bounds; it never invokes an unrestricted Office codec.
  return this._runContained(sourceId,null,actions[action],Uint8Array.from(bytes),options,validator);
 }
}
let officeService=new OfficeService(),restart=null;
async function officeJob(action,bytes,draft,context){if(restart)await restart;return officeService.run(action,bytes,draft,context);}
async function cancelOfficeJob(sourceId){return officeService.cancel(sourceId??officeService.active?.sourceId);}
async function disposeOfficeService(){await officeService.dispose();}
function restartOfficeService(){if(restart)return restart;const old=officeService;restart=old.dispose().then(()=>{if(officeService===old)officeService=new OfficeService(old.options);}).finally(()=>{restart=null;});return restart;}
async function officeStatus(){return officeService.status();}
module.exports={officeJob,OfficeService,cancelOfficeJob,disposeOfficeService,restartOfficeService,officeStatus};
