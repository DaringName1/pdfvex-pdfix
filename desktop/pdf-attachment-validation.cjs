const {createHash}=require('node:crypto');
const SOURCE_MAX=100*1024*1024,ATTACHMENT_MAX=10*1024*1024,TOTAL_MAX=25*1024*1024;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=()=>{throw new Error('The contained attachment result failed its source, metadata or byte checks.');};
function shape(value,required,optional=[]){if(!value||Object.getPrototypeOf(value)!==Object.prototype||required.some(k=>!Object.hasOwn(value,k))||Object.keys(value).some(k=>!required.includes(k)&&!optional.includes(k)))fail();}
function text(value,max){if(typeof value!=='string'||value.length>max||!value.isWellFormed()||/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/.test(value))fail();}
function integer(value,min,max){if(!Number.isSafeInteger(value)||value<min||value>max)fail();}
function attachment(value){
 shape(value,['number','declaredName','description','declaredType','declaredBytes','actualBytes','sha256','available','reason','defaultName','id'],['sizeMatchesDeclaration']);
 integer(value.number,1,100);text(value.declaredName,24576);text(value.description,24576);text(value.declaredType,1024);
 if(!/^[a-f0-9]{64}$/.test(value.id)||value.defaultName!=='attachment-'+String(value.number).padStart(2,'0')+'.bin'||typeof value.available!=='boolean')fail();
 if(value.declaredBytes!==null)integer(value.declaredBytes,0,Number.MAX_SAFE_INTEGER);
 if(value.reason!==null)text(value.reason,500);
 if(value.available){integer(value.actualBytes,0,ATTACHMENT_MAX);if(!/^[a-f0-9]{64}$/.test(value.sha256)||value.reason!==null||value.sizeMatchesDeclaration!==(value.declaredBytes===null?null:value.declaredBytes===value.actualBytes))fail();}
 else {if(value.actualBytes!==null)integer(value.actualBytes,0,ATTACHMENT_MAX);if(value.sha256!==null&&!/^[a-f0-9]{64}$/.test(value.sha256)||typeof value.reason!=='string')fail();}
 return value;
}
function common(report,sourceSha256){if(report.version!==1||report.sourceSha256!==sourceSha256||typeof report.signaturePresent!=='boolean'||report.signatureValidity!=='unable to verify')fail();text(report.scope,2000);}
function validAttachmentInventory(report,{sourceSha256,sourceBytes}){
 shape(report,['version','sourceSha256','sourceBytes','attachmentCount','decodedBytes','decodingWorkBytes','signaturePresent','signatureValidity','attachments','scope','limits']);common(report,sourceSha256);
 if(report.sourceBytes!==sourceBytes||!Array.isArray(report.attachments)||report.attachments.length>100||report.attachmentCount!==report.attachments.length)fail();integer(report.decodedBytes,0,TOTAL_MAX);integer(report.decodingWorkBytes,report.decodedBytes,TOTAL_MAX);
 const ids=new Set();let total=0;for(const [index,item]of report.attachments.entries()){attachment(item);if(item.number!==index+1||ids.has(item.id))fail();ids.add(item.id);if(item.available)total+=item.actualBytes;}if(total!==report.decodedBytes)fail();
 if(!Array.isArray(report.limits)||report.limits.length>10)fail();for(const note of report.limits)text(note,1000);if(Buffer.byteLength(JSON.stringify(report))>8*1024*1024)fail();return report;
}
function validAttachmentSelection(result,{sourceSha256,item}){
 shape(result,['bytes','report']);const {report,bytes}=result;shape(report,['version','sourceSha256','signaturePresent','signatureValidity','attachment','scope']);common(report,sourceSha256);attachment(report.attachment);
 if(!report.attachment.available||report.attachment.id!==item.id||report.attachment.number!==item.number||report.attachment.sha256!==item.sha256||report.attachment.actualBytes!==item.actualBytes||JSON.stringify(report.attachment)!==JSON.stringify(item)||!(bytes instanceof Uint8Array)||bytes.length!==item.actualBytes||bytes.length>ATTACHMENT_MAX||hash(bytes)!==item.sha256)fail();return result;
}
module.exports={SOURCE_MAX,ATTACHMENT_MAX,hash,validAttachmentInventory,validAttachmentSelection};
