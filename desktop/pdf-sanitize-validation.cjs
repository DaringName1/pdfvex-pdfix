const {createHash}=require('node:crypto');
const {validSecuritySource,MAX_BYTES}=require('./pdf-security-validation.cjs');
const CATEGORIES=Object.freeze(['metadata','attachments','annotations','forms','actions']);
const COUNT_KEYS=[...CATEGORIES,'layers','multimedia'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=message=>{throw new Error(message||'The contained PDF cleanup result failed its inert source/shape validation.');};
function shape(value,keys){if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join(',')!==[...keys].sort().join(','))fail();}
function text(value,max=10000){if(typeof value!=='string'||value.length>max||!value.isWellFormed()||/[\x00-\x1f\x7f]/.test(value))fail();}
function counts(value,keys=COUNT_KEYS){shape(value,keys);for(const count of Object.values(value))if(!Number.isInteger(count)||count<0||count>1000000)fail();}
function choices(value){shape(value,CATEGORIES);for(const category of CATEGORIES)if(typeof value[category]!=='boolean')fail('Choose supported cleanup categories.');if(!CATEGORIES.some(name=>value[name]))fail('Select at least one cleanup category.');return Object.fromEntries(CATEGORIES.map(name=>[name,value[name]]));}
function validSanitizeSource(id,source){return validSecuritySource(id,source);}
function validSanitizeToken(token){if(typeof token!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token))fail('Invalid cleanup operation token.');return token;}
function validSanitizeInspection(report,sourceSha256,byteLength){
 shape(report,['version','sha256','byteLength','pageCount','counts','categories','scope','limits']);
 if(report.version!==1||report.sha256!==sourceSha256||!/^[a-f0-9]{64}$/.test(sourceSha256)||report.byteLength!==byteLength||!Number.isInteger(byteLength)||byteLength<1||byteLength>MAX_BYTES||!Number.isInteger(report.pageCount)||report.pageCount<1||report.pageCount>500||!Array.isArray(report.categories)||JSON.stringify(report.categories)!==JSON.stringify(CATEGORIES)||!Array.isArray(report.limits)||report.limits.length>30)fail();
 counts(report.counts);text(report.scope);for(const note of report.limits)text(note,1000);if(Buffer.byteLength(JSON.stringify(report))>64*1024)fail();return report;
}
function validSanitizeResult(result,selected,sourceSha256,byteLength){
 shape(result,['bytes','report']);if(!(result.bytes instanceof Uint8Array)||!result.bytes.length||result.bytes.length>MAX_BYTES||!Buffer.from(result.bytes.buffer,result.bytes.byteOffset,Math.min(1024,result.bytes.length)).includes(Buffer.from('%PDF-')))fail();
 const report=result.report;shape(report,['version','selected','before','after','removedEntries','prunedObjects','pageCount','sourceSha256','sha256','originalBytes','outputBytes','verified','scope']);
 if(report.version!==1||report.sourceSha256!==sourceSha256||!/^[a-f0-9]{64}$/.test(sourceSha256)||report.sha256!==hash(result.bytes)||report.originalBytes!==byteLength||report.outputBytes!==result.bytes.length||report.verified!==true||!Number.isInteger(report.prunedObjects)||report.prunedObjects<0||report.prunedObjects>100000||!Number.isInteger(report.pageCount)||report.pageCount<1||report.pageCount>500)fail();
 const actual=choices(report.selected);if(JSON.stringify(actual)!==JSON.stringify(choices(selected)))fail();counts(report.before);counts(report.after);counts(report.removedEntries,CATEGORIES);
 for(const category of CATEGORIES){if(actual[category]&&report.after[category]!==0||!actual[category]&&report.removedEntries[category]!==0)fail();}
 text(report.scope);if(Buffer.byteLength(JSON.stringify(report))>64*1024)fail();return result;
}
module.exports={MAX_BYTES,CATEGORIES,hash,choices,validSanitizeSource,validSanitizeToken,validSanitizeInspection,validSanitizeResult};
