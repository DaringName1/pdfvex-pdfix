'use strict';
const {MAX_BYTES,hash,validSecuritySource}=require('./pdf-security-validation.cjs');
const {validCertificateBundle,validCertificateReport}=require('./pdf-certificate-validation.cjs');
const fail=(message='Certificate signing data failed bounded source validation.')=>{throw new Error(message);};
function shape(value,keys){if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join(',')!==[...keys].sort().join(','))fail();}
function text(value,max=2000){if(typeof value!=='string'||value.length>max||!value.isWellFormed()||/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/.test(value))fail();return value;}
function digest(value){if(typeof value!=='string'||!/^[a-f0-9]{64}$/.test(value))fail();return value;}
function token(value){if(typeof value!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))fail();return value;}
function signedAttributes(contentSha256){digest(contentSha256);return Buffer.from('314b301806092a864886f70d010903310b06092a864886f70d010701302f06092a864886f70d01090431220420'+contentSha256,'hex');}
function selection(value){shape(value,['certificateId','reason','location']);digest(value.certificateId);text(value.reason,256);text(value.location,256);return {...value};}
function certificate(value,{internal=false}={}){
 shape(value,['id','subject','issuer','serial','validFrom','validTo','keyType','keyBits','provider','store','eligible','reason',...(internal?['certificateDer']:[])]);digest(value.id);for(const key of ['subject','issuer','serial','provider','reason'])text(value[key]);if(typeof value.eligible!=='boolean')fail();
 for(const key of ['validFrom','validTo'])if(typeof value[key]!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value[key])||!Number.isFinite(Date.parse(value[key])))fail();
 if(value.keyType!=='RSA PKCS#1 v1.5 / SHA-256'||!Number.isInteger(value.keyBits)||value.keyBits<2048||value.keyBits>8192||value.store!=='Windows CurrentUser/My')fail();if(internal)validCertificateBundle([value.certificateDer],value.id);return value;
}
function validInspection(value,sourceSha256,byteLength){shape(value,['version','sourceSha256','byteLength','eligible','reason','pageCount','scope']);if(value.version!==1||value.sourceSha256!==digest(sourceSha256)||value.byteLength!==byteLength||typeof value.eligible!=='boolean'||!Number.isInteger(value.pageCount)||value.pageCount<0||value.pageCount>10000)fail();text(value.reason);text(value.scope);return value;}
function validPreparation(result,sourceSha256,sourceBytes,certificateFingerprint){
 shape(result,['bytes','report']);const bytes=result.bytes,r=result.report;shape(r,['version','sourceSha256','sourceBytes','preparedSha256','preparedBytes','byteRange','signatureObjectRef','certificateFingerprint','signedAttributes','contentSha256','reason','location']);
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>MAX_BYTES||r.version!==1||r.sourceSha256!==digest(sourceSha256)||r.sourceBytes!==sourceBytes||sourceBytes<1||r.preparedBytes!==bytes.length||r.preparedBytes<=sourceBytes||r.preparedSha256!==hash(bytes)||r.certificateFingerprint!==digest(certificateFingerprint))fail();
 const range=r.byteRange;if(!Array.isArray(range)||range.length!==4||range.some(n=>!Number.isSafeInteger(n))||range[0]!==0||range[1]<=sourceBytes||range[2]-range[1]!==65538||range[3]<=0||range[2]+range[3]!==bytes.length)fail();
 const buffer=Buffer.from(bytes);if(buffer[range[1]]!==60||buffer[range[2]-1]!==62||!buffer.subarray(range[1]+1,range[2]-1).every(v=>v===48)||hash(buffer.subarray(0,sourceBytes))!==sourceSha256)fail();
 const content=hash(Buffer.concat([buffer.subarray(0,range[1]),buffer.subarray(range[2])]));if(r.contentSha256!==content||r.signedAttributes!==signedAttributes(content).toString('base64'))fail();
 if(typeof r.signatureObjectRef!=='string'||!/^\d{1,10} 0 R$/.test(r.signatureObjectRef))fail();text(r.reason,256);text(r.location,256);return result;
}
function finalOptions(value){shape(value,['preparation','certificateDer','signature']);const r=value.preparation;digest(r?.certificateFingerprint);validCertificateBundle([value.certificateDer],r.certificateFingerprint);if(typeof value.signature!=='string'||value.signature.length>1368||value.signature.length<344||Buffer.from(value.signature,'base64').toString('base64')!==value.signature)fail();return value;}
function validSignedResult(result,preparation){
 shape(result,['bytes','report']);const bytes=result.bytes,r=result.report;shape(r,['version','verified','sourceSha256','sourceBytes','sha256','outputBytes','certificateFingerprint','signatureObjectRef','byteRange','signatureInspection','scope']);
 if(!(bytes instanceof Uint8Array)||bytes.length!==preparation.preparedBytes||r.version!==1||r.verified!==true||r.sourceSha256!==preparation.sourceSha256||r.sourceBytes!==preparation.sourceBytes||r.sha256!==hash(bytes)||r.outputBytes!==bytes.length||r.certificateFingerprint!==preparation.certificateFingerprint||r.signatureObjectRef!==preparation.signatureObjectRef||JSON.stringify(r.byteRange)!==JSON.stringify(preparation.byteRange)||hash(bytes.subarray(0,r.sourceBytes))!==r.sourceSha256)fail();
 validCertificateReport(r.signatureInspection,r.sha256,bytes.length,{internal:true});const rows=r.signatureInspection.signatures;if(!r.signatureInspection.inventoryComplete||rows.length!==1||rows[0].integrity!=='verified'||rows[0].signer?.fingerprintSha256!==r.certificateFingerprint||rows[0].objectRef!==r.signatureObjectRef||rows[0].coverage!=='entire-current-file'||JSON.stringify(rows[0].byteRange)!==JSON.stringify(r.byteRange))fail('The newly signed PDF did not independently verify.');text(r.scope);return result;
}
module.exports={MAX_BYTES,hash,shape,text,digest,token,selection,certificate,signedAttributes,validInspection,validPreparation,finalOptions,validSignedResult,validSigningSource:validSecuritySource};
