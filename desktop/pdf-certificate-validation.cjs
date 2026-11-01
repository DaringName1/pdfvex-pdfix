const {MAX_BYTES,hash,validSecuritySource}=require('./pdf-security-validation.cjs');
const fail=()=>{throw new Error('The contained certificate report failed source or inert shape validation.');};
function shape(value,keys){if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join(',')!==[...keys].sort().join(','))fail();}
function text(value,max=2000){if(typeof value!=='string'||value.length>max||!value.isWellFormed()||/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/.test(value))fail();}
function date(value){text(value,30);if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)||!Number.isFinite(Date.parse(value)))fail();}
function one(value,choices){if(!choices.includes(value))fail();}
function validCertificateBundle(bundle,fingerprint){
 if(!Array.isArray(bundle)||bundle.length<1||bundle.length>32)fail();let size=0;const seen=new Set();
 for(const [index,encoded]of bundle.entries()){
  if(typeof encoded!=='string'||encoded.length<4||encoded.length>87384||encoded.length%4||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))fail();
  const bytes=Buffer.from(encoded,'base64');size+=bytes.length;if(bytes.length>65536||size>131072||bytes.toString('base64')!==encoded||bytes[0]!==48)fail();
  // Bounded DER outer framing only; native certificate parsing stays in helpers.
  let header=2,length=bytes[1];if(length&128){const count=length&127;if(count<1||count>3||bytes.length<2+count||bytes[2]===0)fail();header+=count;length=0;for(let i=2;i<header;i++)length=length*256+bytes[i];if(length<128)fail();}if(header+length!==bytes.length)fail();
  const digest=hash(bytes);if(index===0&&digest!==fingerprint||seen.has(digest))fail();seen.add(digest);
 }
 return bundle;
}
function validChainInspection(value,row){
 shape(value,['backend','checkedAt','signerFingerprintSha256','rootInWindowsStore','chainErrorStatus','policyError','keyUsage','elements']);
 if(value.backend!=='windows-offline-base-chain-v1'||value.signerFingerprintSha256!==row.signer?.fingerprintSha256||typeof value.rootInWindowsStore!=='boolean'||!Array.isArray(value.elements)||value.elements.length<1||value.elements.length>32)fail();date(value.checkedAt);one(value.keyUsage,['allowed','disallowed']);
 for(const key of ['chainErrorStatus','policyError'])if(!/^0x[0-9A-F]{8}$/.test(value[key]))fail();
 for(const [index,item]of value.elements.entries()){
  shape(item,['subject','issuer','fingerprintSha256','validFrom','validTo','errorStatus']);text(item.subject);text(item.issuer);date(item.validFrom);date(item.validTo);if(!/^[a-f0-9]{64}$/.test(item.fingerprintSha256)||!/^0x[0-9A-F]{8}$/.test(item.errorStatus)||index===0&&item.fingerprintSha256!==row.signer.fingerprintSha256)fail();
 }
 const trusted=value.rootInWindowsStore&&value.chainErrorStatus==='0x00000000'&&value.policyError==='0x00000000'&&value.keyUsage==='allowed'&&value.elements.every(item=>item.errorStatus==='0x00000000'&&Date.parse(item.validFrom)<=Date.parse(value.checkedAt)&&Date.parse(item.validTo)>=Date.parse(value.checkedAt));
 if(row.trust!==(trusted?'trusted-offline-chain':'untrusted-chain')||row.integrity!=='verified')fail();return value;
}
function validCertificateReport(report,sourceSha256,byteLength,{internal=false}={}){
 shape(report,['version','sourceSha256','byteLength','inspectedAt','inventoryComplete','signatures','limits','scope']);
 if(report.version!==1||report.sourceSha256!==sourceSha256||!/^[a-f0-9]{64}$/.test(sourceSha256)||report.byteLength!==byteLength||!Number.isSafeInteger(byteLength)||byteLength<1||byteLength>MAX_BYTES||typeof report.inventoryComplete!=='boolean'||!Array.isArray(report.signatures)||report.signatures.length>32||!Array.isArray(report.limits)||report.limits.length>10)fail();date(report.inspectedAt);text(report.scope);for(const note of report.limits)text(note);
 for(const [index,row]of report.signatures.entries()){
  shape(row,['index','objectRef','integrity','reason','byteRange','coverage','unsignedBytes','subFilter','messageDigest','signatureValue','digestAlgorithm','signatureAlgorithm','signer','certificateBundle','chainInspection','claimedSigningTime','unsignedAttributes','trust','trustedTime','revocation','modificationPolicy']);
  if(row.index!==index+1||typeof row.unsignedAttributes!=='boolean')fail();for(const key of ['objectRef','reason','subFilter','digestAlgorithm','signatureAlgorithm','claimedSigningTime'])text(row[key]);one(row.integrity,['verified','failed','unsupported']);one(row.messageDigest,['match','mismatch','not-present','not-checked']);one(row.signatureValue,['verified','failed','not-checked']);one(row.coverage,['unbound','entire-current-file','earlier-revision']);for(const key of ['trustedTime','revocation','modificationPolicy'])if(row[key]!=='not-checked')fail();one(row.trust,internal?['not-checked']:['not-checked','unavailable','trusted-offline-chain','untrusted-chain']);
  if(row.byteRange===null){if(row.coverage!=='unbound'||row.unsignedBytes!==null||row.integrity!=='unsupported')fail();}
  else {const r=row.byteRange;if(!Array.isArray(r)||r.length!==4||!r.every(Number.isSafeInteger)||r[0]!==0||r[1]<=0||r[2]<=r[1]||r[3]<=0||r[2]+r[3]>byteLength||row.unsignedBytes!==byteLength-r[2]-r[3]||row.coverage!==(row.unsignedBytes?'earlier-revision':'entire-current-file'))fail();}
  if(row.signer!==null){const signer=row.signer;shape(signer,['subject','issuer','serial','fingerprintSha256','validFrom','validTo','currentValidity']);for(const key of ['subject','issuer','serial'])text(signer[key]);if(!/^[a-f0-9]{64}$/.test(signer.fingerprintSha256))fail();date(signer.validFrom);date(signer.validTo);one(signer.currentValidity,['not-yet-valid','expired','within-validity-period']);}
  if(row.integrity==='verified'&&(row.signatureValue!=='verified'||!['match','not-present'].includes(row.messageDigest)||!row.signer||!row.byteRange))fail();
  if(row.integrity==='failed'&&(!row.signer||row.signatureValue!=='failed'&&row.messageDigest!=='mismatch'))fail();
  if(internal&&row.integrity==='verified')validCertificateBundle(row.certificateBundle,row.signer.fingerprintSha256);else if(row.certificateBundle!==null)fail();
  if(row.chainInspection!==null){if(internal)fail();validChainInspection(row.chainInspection,row);}else if(['trusted-offline-chain','untrusted-chain'].includes(row.trust))fail();
  if(row.trust!=='not-checked'&&row.integrity!=='verified')fail();
 }
 if(Buffer.byteLength(JSON.stringify(report))>(internal?6*1024*1024:1024*1024))fail();return report;
}
module.exports={MAX_BYTES,hash,validCertificateSource:validSecuritySource,validCertificateReport,validCertificateBundle,validChainInspection};
