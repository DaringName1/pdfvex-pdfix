const {createHash}=require('node:crypto');
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {validEmailMessageReport}=require('./email-message-validation.cjs');
class EmailMessageService extends ContainedServiceContext{
 constructor(options){super('Email message processing','Email-message',options);}
 async read(id,source){
  if(typeof id!=='string'||!id||id.length>100||/[\x00-\x1f]/.test(id)||!source||source.ext!=='eml'||!(source.bytes instanceof Uint8Array)||!source.bytes.length||source.bytes.length>10*1024*1024)throw new Error('Choose an immutable EML message up to 10 MiB.');
  const bytes=Uint8Array.from(source.bytes),fingerprint=createHash('sha256').update(bytes).digest('hex');if(fingerprint!==source.fingerprint){bytes.fill(0);throw new Error('The email snapshot changed before containment.');}
  return this._runContained(id,null,'email-message-read',bytes,{},value=>validEmailMessageReport(value,fingerprint));
 }
}
let service=new EmailMessageService(),restart=null;
async function readEmailMessage(id,source){if(restart)await restart;return service.read(id,source);}
async function cancelEmailMessage(id){return service.cancel(id??service.active?.sourceId);}
async function disposeEmailMessageService(){return service.dispose();}
function restartEmailMessageService(){if(restart)return restart;const old=service;restart=old.dispose().then(()=>{if(service===old)service=new EmailMessageService(old.options);}).finally(()=>{restart=null;});return restart;}
async function emailMessageStatus(){return service.status();}
module.exports={readEmailMessage,cancelEmailMessage,disposeEmailMessageService,restartEmailMessageService,emailMessageStatus};
