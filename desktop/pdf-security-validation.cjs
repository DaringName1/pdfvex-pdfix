const {createHash}=require('node:crypto');
const MAX_BYTES=100*1024*1024;
const COUNT_KEYS=['javascript','additionalActions','openActions','actions','linkActions','embeddedStreams','attachmentSpecs','optionalLayers','formFields','signatureFields','signatureDictionaries','xmpStreams','multimedia','invalidObjects'];
const FLAG_KEYS=['xfa','acroForm','optionalContent','embeddedFileNameTree','informationMetadata','tagged'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=message=>{throw new Error(message||'The contained PDF security report failed its inert source/shape validation.');};
function shape(value,keys){if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join(',')!==[...keys].sort().join(','))fail();}
function text(value,max){if(typeof value!=='string'||value.length>max||!value.isWellFormed()||/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/.test(value))fail();}
function validSecuritySource(id,source){
 if(typeof id!=='string'||!id||id.length>100||/[\x00-\x1f]/.test(id)||source?.ext!=='pdf'||!(source.bytes instanceof Uint8Array)||!source.bytes.length||source.bytes.length>MAX_BYTES)fail('Choose an opened PDF under 100 MiB for its security report.');
 const bytes=Uint8Array.from(source.bytes);if(source.fingerprint!==hash(bytes)){bytes.fill(0);fail('The PDF source changed before its contained security inspection.');}return bytes;
}
function validSecurityReport(report,{sourceSha256,byteLength}){
 shape(report,['version','sha256','inspectedAt','byteLength','complete','encrypted','counts','flags','actionTypes','attachments','limits','signatureValidity','scope','boundaries']);
 if(report.version!==1||report.sha256!==sourceSha256||!/^[a-f0-9]{64}$/.test(sourceSha256)||report.byteLength!==byteLength||!Number.isInteger(byteLength)||byteLength<1||byteLength>MAX_BYTES||typeof report.complete!=='boolean'||typeof report.encrypted!=='boolean'||report.signatureValidity!=='unable to verify')fail();
 if(typeof report.inspectedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(report.inspectedAt)||!Number.isFinite(Date.parse(report.inspectedAt)))fail();
 shape(report.counts,COUNT_KEYS);for(const value of Object.values(report.counts))if(!Number.isInteger(value)||value<0||value>200000)fail();
 shape(report.flags,FLAG_KEYS);for(const value of Object.values(report.flags))if(typeof value!=='boolean')fail();
 if(report.counts.signatureFields>report.counts.formFields||report.counts.linkActions>report.counts.actions||!Array.isArray(report.actionTypes)||report.actionTypes.length>100||!Array.isArray(report.attachments)||report.attachments.length>100||report.attachments.length>report.counts.attachmentSpecs||!Array.isArray(report.limits)||report.limits.length>30)fail();
 const names=new Set();let actions=0;for(const row of report.actionTypes){shape(row,['type','count']);text(row.type,320);if(!row.type||names.has(row.type)||!Number.isInteger(row.count)||row.count<1||row.count>200000)fail();names.add(row.type);actions+=row.count;}if(actions>report.counts.actions)fail();
 for(const attachment of report.attachments){shape(attachment,['name','description','type','declaredBytes']);text(attachment.name,320);text(attachment.description,320);text(attachment.type,320);if(attachment.declaredBytes!==null&&(!Number.isSafeInteger(attachment.declaredBytes)||attachment.declaredBytes<0))fail();}
 for(const note of report.limits)text(note,1000);text(report.scope,10000);text(report.boundaries,10000);
 if(report.complete!==(report.limits.length===0)||report.encrypted&&report.complete||report.counts.invalidObjects&&report.complete||Buffer.byteLength(JSON.stringify(report))>256*1024)fail();return report;
}
module.exports={MAX_BYTES,hash,validSecuritySource,validSecurityReport};
