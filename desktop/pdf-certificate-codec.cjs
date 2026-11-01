// Runs only in the fixed contained document engine. No URLs, stores or files are opened.
const {PDFDocument,PDFDict,PDFArray,PDFName,PDFRef,PDFNumber,PDFHexString,PDFRawStream}=require('pdf-lib');
const {createHash,createVerify,X509Certificate,constants,timingSafeEqual}=require('node:crypto');
const {MAX_BYTES,hash,validCertificateReport}=require('./pdf-certificate-validation.cjs');
const MAX_CMS=2*1024*1024,MAX_SIGNATURES=32;
const clean=value=>String(value??'').replace(/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/g,' ').slice(0,2000);
function refuse(message){throw new Error(message);}
function need(value,message){if(!value)refuse(message);}
const OID={data:'1.2.840.113549.1.7.1',signedData:'1.2.840.113549.1.7.2',contentType:'1.2.840.113549.1.9.3',messageDigest:'1.2.840.113549.1.9.4',signingTime:'1.2.840.113549.1.9.5',signingCertificateV2:'1.2.840.113549.1.9.16.2.47'};
const DIGEST={'2.16.840.1.101.3.4.2.1':'sha256','2.16.840.1.101.3.4.2.2':'sha384','2.16.840.1.101.3.4.2.3':'sha512'};
const SIG={'1.2.840.113549.1.1.1':['rsa',null],'1.2.840.113549.1.1.11':['rsa','sha256'],'1.2.840.113549.1.1.12':['rsa','sha384'],'1.2.840.113549.1.1.13':['rsa','sha512'],'1.2.840.10045.4.3.2':['ec','sha256'],'1.2.840.10045.4.3.3':['ec','sha384'],'1.2.840.10045.4.3.4':['ec','sha512']};

// Deliberately bounded DER subset: BER indefinite lengths and high tag numbers
// are unsupported. In particular signedAttrs are NEVER reserialized or sorted.
function der(buffer){
 let nodes=0;
 function read(start,limit,depth){
  need(++nodes<=40000&&depth<=40&&start+2<=limit,'CMS exceeds the DER bounds or is truncated.');
  let p=start,tag=buffer[p++],length=buffer[p++];need((tag&31)!==31,'High-tag-number ASN.1 is unsupported.');
  if(length&128){const n=length&127;need(n>0&&n<=4&&p+n<=limit&&buffer[p]!==0,'Indefinite or nonminimal DER length is unsupported.');length=0;for(let i=0;i<n;i++)length=length*256+buffer[p++];need(length>=128,'Nonminimal DER length.');}
  const end=p+length;need(end<=limit,'CMS length exceeds its container.');const node={tag,start,body:p,end,raw:buffer.subarray(start,end),bytes:buffer.subarray(p,end),children:[]};
  if(tag&32){while(p<end){const child=read(p,end,depth+1);node.children.push(child);p=child.end;}if(tag===49)ordered(node.children);}
  else if(tag===2){need(length>0&&!(length>1&&buffer[p]===0&&!(buffer[p+1]&128))&&!(length>1&&buffer[p]===255&&(buffer[p+1]&128)),'Noncanonical DER integer.');}
  else if(tag===5)need(length===0,'Noncanonical DER NULL.');
  else if(tag===1)need(length===1&&(buffer[p]===0||buffer[p]===255),'Noncanonical DER boolean.');
  else if(tag===3)need(length>0&&buffer[p]<=7&&(length>1||buffer[p]===0)&&(!buffer[p]||!(buffer[end-1]&((1<<buffer[p])-1))),'Noncanonical DER bit string.');
  return node;
 }
 return read(0,buffer.length,0);
}
function ordered(nodes){for(let i=1;i<nodes.length;i++)need(Buffer.compare(nodes[i-1].raw,nodes[i].raw)<=0,'Noncanonical DER SET ordering.');}
function tagged(node,tag){need(node?.tag===tag,'Unexpected CMS DER type.');return node;}
function seq(node,min,max=min){const children=tagged(node,48).children;need(children.length>=min&&children.length<=max,'Unsupported CMS sequence shape.');return children;}
function oid(node){tagged(node,6);need(node.bytes.length>0&&node.bytes.length<=100,'Invalid CMS OID.');const components=[];let n=0,first=true;for(const byte of node.bytes){need(!(first&&byte===128),'Noncanonical OID.');n=n*128+(byte&127);need(Number.isSafeInteger(n),'OID exceeds bounds.');first=false;if(!(byte&128)){components.push(n);n=0;first=true;}}need(first,'Truncated OID.');const head=components.shift();return [head<40?0:head<80?1:2,head<40?head:head<80?head-40:head-80,...components].join('.');}
function integer(node){tagged(node,2);need(node.bytes.length<=4&&!(node.bytes[0]&128),'Unsupported CMS integer.');let n=0;for(const b of node.bytes)n=n*256+b;return n;}
function algorithm(node){const a=seq(node,1,2);const id=oid(a[0]);if(a[1])tagged(a[1],5);return id;}
function same(a,b){return a.length===b.length&&timingSafeEqual(a,b);}
function certificate(node){
 need(node.raw.length<=64*1024,'A CMS certificate exceeds the offline chain inspection limit.');const cert=new X509Certificate(tagged(node,48).raw),tbs=seq(node,3)[0],fields=seq(tbs,6,10),offset=fields[0].tag===160?1:0;
 const serial=tagged(fields[offset],2).raw,issuer=tagged(fields[offset+2],48).raw;
 let ski=null;const extensionContainer=fields.find(x=>x.tag===163);
 if(extensionContainer){need(extensionContainer.children.length===1,'Malformed certificate extensions.');for(const extension of tagged(extensionContainer.children[0],48).children){const parts=seq(extension,2,3);if(oid(parts[0])==='2.5.29.14'){need(!ski,'Duplicate certificate key identifier.');const content=tagged(parts.at(-1),4).bytes,nested=der(content);need(nested.end===content.length,'Trailing certificate key identifier data.');ski=tagged(nested,4).bytes;}}}
 return {cert,serial,issuer,ski};
}
function attrs(node){
 tagged(node,160);ordered(node.children);const result=new Map();need(node.children.length<=32,'Too many signed CMS attributes.');
 for(const entry of node.children){const pair=seq(entry,2),name=oid(pair[0]),values=tagged(pair[1],49).children;need(values.length===1&&!result.has(name),'Duplicate or multi-valued signed CMS attribute.');need(Object.values(OID).includes(name)&&![OID.data,OID.signedData].includes(name),'A signed CMS attribute has unsupported semantics.');result.set(name,values[0]);}
 need(result.has(OID.contentType)&&result.has(OID.messageDigest),'CMS signed attributes omit content-type or message-digest.');return result;
}
function checkEss(node,signer){
 const top=seq(node,1,2);need(top.length===1,'ESS certificate policies are unsupported.');const certIds=tagged(top[0],48).children;need(certIds.length===1,'Multiple ESS certificate bindings are unsupported.');const fields=seq(certIds[0],1,3);let index=0,digest='sha256';if(fields[0].tag===48){digest=DIGEST[algorithm(fields[index++])];need(digest,'Unsupported ESS certificate hash.');}const expected=tagged(fields[index++],4).bytes;need(same(createHash(digest).update(signer.cert.raw).digest(),expected),'ESS signing-certificate digest does not match the signer.');if(fields[index]){const issuerSerial=seq(fields[index++],2),names=tagged(issuerSerial[0],48).children;need(names.length===1&&names[0].tag===164&&names[0].children.length===1,'Unsupported ESS issuer name binding.');need(same(names[0].children[0].raw,signer.issuer)&&same(tagged(issuerSerial[1],2).raw,signer.serial),'ESS issuer/serial binding does not match.');}need(index===fields.length,'Unexpected ESS fields.');
}
function verifyCms(cms,chunks,subFilter){
 const root=der(cms);need(root.end===cms.length,'CMS has trailing nonpadding bytes.');const info=seq(root,2);need(oid(info[0])===OID.signedData,'PDF Contents is not CMS SignedData.');const explicit=tagged(info[1],160);need(explicit.children.length===1,'Ambiguous SignedData wrapper.');const signed=seq(explicit.children[0],4,6);need([1,3].includes(integer(signed[0])),'Unsupported CMS SignedData version.');
 const digestIds=tagged(signed[1],49).children.map(algorithm);need(digestIds.length>=1&&digestIds.length<=8&&new Set(digestIds).size===digestIds.length,'Ambiguous CMS digest algorithm set.');const content=seq(signed[2],1);need(oid(content[0])===OID.data,'Only detached id-data CMS is supported.');
 let index=3;const certSet=signed[index]?.tag===160?signed[index++]:null;need(certSet&&certSet.children.length>0&&certSet.children.length<=32,'CMS must include a bounded signer certificate set.');const certificates=certSet.children.map(certificate);if(signed[index]?.tag===161)index++;const signers=tagged(signed[index++],49).children;need(index===signed.length&&signers.length===1,'Exactly one CMS signer is supported per PDF signature.');
 const signerInfo=seq(signers[0],5,7);let cursor=0;const version=integer(signerInfo[cursor++]),sid=signerInfo[cursor++];let matching;
 if(sid.tag===48){need(version===1,'Issuer/serial SignerInfo must use version 1.');const pair=seq(sid,2);matching=certificates.filter(c=>same(c.issuer,tagged(pair[0],48).raw)&&same(c.serial,tagged(pair[1],2).raw));}
 else {need(sid.tag===128&&version===3,'Unsupported CMS signer identifier.');matching=certificates.filter(c=>c.ski&&same(c.ski,sid.bytes));}
 need(matching.length===1,'Missing or ambiguous signer certificate binding.');const signer=matching[0],digestOid=algorithm(signerInfo[cursor++]),digest=DIGEST[digestOid];need(digest&&digestIds.includes(digestOid),'Unsupported or unlisted CMS digest algorithm (SHA-256/384/512 only).');
 const signedAttrs=signerInfo[cursor]?.tag===160?signerInfo[cursor++]:null,signatureOid=algorithm(signerInfo[cursor++]),signature=tagged(signerInfo[cursor++],4).bytes,signatureAlgorithm=SIG[signatureOid];need(signatureAlgorithm,'Unsupported signature algorithm (RSA PKCS#1 v1.5 or ECDSA required).');need(!signatureAlgorithm[1]||signatureAlgorithm[1]===digest,'CMS signature and digest algorithms disagree.');
 if(signatureAlgorithm[0]==='ec')need(seq(signerInfo[cursor-2],1,2).length===1,'ECDSA algorithm parameters must be absent.');
 const unsigned=signerInfo[cursor]?.tag===161?signerInfo[cursor++]:null;need(cursor===signerInfo.length,'Unsupported trailing CMS signer fields.');need(signer.cert.publicKey.asymmetricKeyType===signatureAlgorithm[0],'Signer key type differs from the CMS signature algorithm.');
 const details=signer.cert.publicKey.asymmetricKeyDetails||{};if(signatureAlgorithm[0]==='rsa')need(details.modulusLength>=2048&&details.modulusLength<=8192,'Unsupported RSA key size (2048–8192 bits required).');else need(['prime256v1','secp384r1','secp521r1'].includes(details.namedCurve),'Unsupported ECDSA curve.');
 const contentHash=createHash(digest);for(const chunk of chunks)contentHash.update(chunk);const actualDigest=contentHash.digest();let messageDigest='not-present',claimedSigningTime='Not supplied',input=chunks;
 if(signedAttrs){const values=attrs(signedAttrs);need(oid(values.get(OID.contentType))===OID.data,'Signed content-type does not match id-data.');messageDigest=same(tagged(values.get(OID.messageDigest),4).bytes,actualDigest)?'match':'mismatch';
  // RFC 5652 section 5.4: IMPLICIT [0] is replaced by the DER SET tag.
  const exact=Buffer.from(signedAttrs.raw);exact[0]=49;input=[exact];
  const time=values.get(OID.signingTime);if(time){need((time.tag===23&&/^\d{12}Z$/.test(time.bytes.toString('ascii')))||(time.tag===24&&/^\d{14}Z$/.test(time.bytes.toString('ascii'))),'Unsupported CMS signing-time encoding.');claimedSigningTime=clean(time.bytes.toString('ascii'))+' (signer claim; not a trusted timestamp)';}
  if(values.has(OID.signingCertificateV2))checkEss(values.get(OID.signingCertificateV2),signer);
  if(subFilter==='ETSI.CAdES.detached')need(values.has(OID.signingCertificateV2),'CAdES signingCertificateV2 binding is required by this verifier.');
 }else need(subFilter!=='ETSI.CAdES.detached','CAdES requires signed certificate attributes.');
 const verifier=createVerify(digest);for(const chunk of input)verifier.update(chunk);verifier.end();const verified=verifier.verify({key:signer.cert.publicKey,...(signatureAlgorithm[0]==='rsa'?{padding:constants.RSA_PKCS1_PADDING}:{dsaEncoding:'der'})},signature);
 const now=Date.now(),from=Date.parse(signer.cert.validFrom),to=Date.parse(signer.cert.validTo);need(Number.isFinite(from)&&Number.isFinite(to),'Unparseable signer certificate validity dates.');
 const integrity=verified&&messageDigest!=='mismatch'?'verified':'failed';
 // Only export the actual CMS-bound signer after verification, first in the
 // bundle. Supplied issuers remain untrusted chain-building candidates.
 const orderedCertificates=[signer,...certificates.filter(c=>c!==signer)];need(orderedCertificates.reduce((sum,c)=>sum+c.cert.raw.length,0)<=128*1024,'CMS certificate bundle exceeds the offline chain inspection limit.');
 return {integrity,certificateBundle:integrity==='verified'?orderedCertificates.map(c=>c.cert.raw.toString('base64')):null,messageDigest,signatureValue:verified?'verified':'failed',digestAlgorithm:digest,signatureAlgorithm:signatureAlgorithm[0]==='rsa'?'RSA PKCS#1 v1.5':'ECDSA',signer:{subject:clean(signer.cert.subject),issuer:clean(signer.cert.issuer),serial:clean(signer.cert.serialNumber),fingerprintSha256:hash(signer.cert.raw),validFrom:new Date(from).toISOString(),validTo:new Date(to).toISOString(),currentValidity:now<from?'not-yet-valid':now>to?'expired':'within-validity-period'},claimedSigningTime,unsignedAttributes:!!unsigned};
}

// A lexical walk binds the excluded bytes to an actual direct /Contents hex
// token, never a regexp hit in a string/comment/stream. Indirect stream lengths
// and duplicate signature object definitions fail closed in this first slice.
function rawObjects(bytes){
 const s=bytes.toString('latin1'),objects=new Map();let p=0,budget=0;
 const whitespace=c=>c!==undefined&&/[\x00\t\n\f\r ]/.test(c),delimiter=c=>c===undefined||whitespace(c)||'()<>[]{}/%'.includes(c);
 function skip(){while(p<s.length){if(whitespace(s[p]))p++;else if(s[p]==='%'){while(p<s.length&&!/[\r\n]/.test(s[p]))p++;}else break;}}
 function token(){skip();need(++budget<=2000000,'PDF lexical inspection exceeds its token budget.');const start=p;if(p>=s.length)return null;const c=s[p++];
  if(c==='<'&&s[p]==='<'){p++;return {type:'dict',start,end:p};}if(c==='>'&&s[p]==='>'){p++;return {type:'enddict',start,end:p};}
  if(c==='('){let depth=1;while(p<s.length&&depth){const ch=s[p++];if(ch==='\\'){if(s[p]==='\r'&&s[p+1]==='\n')p+=2;else p++;}else if(ch==='(')depth++;else if(ch===')')depth--;need(depth<=80,'PDF string nesting exceeds bounds.');}need(!depth&&p<=s.length,'Unterminated PDF string.');return {type:'string',start,end:p};}
  if(c==='<'){while(p<s.length&&s[p]!=='>'){need(/[0-9a-fA-F\x00\t\n\f\r ]/.test(s[p]),'Invalid PDF hex string.');p++;}need(s[p++]==='>','Unterminated PDF hex string.');return {type:'hex',start,end:p};}
  if(c==='/'){while(!delimiter(s[p]))p++;const raw=s.slice(start+1,p);need(!/#(?![0-9a-fA-F]{2})/.test(raw),'Malformed PDF name escape.');return {type:'name',value:raw.replace(/#([0-9a-fA-F]{2})/g,(_,h)=>String.fromCharCode(parseInt(h,16))),start,end:p};}
  if('[]'.includes(c))return {type:c,start,end:p};need(!')>{}'.includes(c),'Unexpected PDF delimiter.');while(!delimiter(s[p]))p++;const value=s.slice(start,p);return {type:/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value)?'number':'word',value,start,end:p};
 }
 function value(depth=0){need(depth<=80,'PDF object nesting exceeds bounds.');const t=token();need(t,'Truncated PDF object.');if(t.type==='dict'){t.value=new Map();while(true){const name=token();need(name,'Truncated PDF dictionary.');if(name.type==='enddict'){t.end=name.end;break;}need(name.type==='name'&&!t.value.has(name.value),'Duplicate or malformed PDF dictionary key.');t.value.set(name.value,value(depth+1));}}
  else if(t.type==='['){t.value=[];while(true){const before=p,next=token();need(next,'Truncated PDF array.');if(next.type===']'){t.end=next.end;break;}p=before;t.value.push(value(depth+1));need(t.value.length<=100000,'PDF array exceeds bounds.');}}
  else if(t.type==='number'){const before=p,second=token(),third=second?.type==='number'?token():null;if(third?.value==='R'){t.type='ref';t.value=t.value+' '+second.value+' R';t.end=third.end;}else p=before;}
  else need(['name','hex','string'].includes(t.type)||t.type==='word'&&['true','false','null'].includes(t.value),'Unsupported PDF value.');return t;
 }
 while(p<s.length){const first=token();if(!first)break;if(first.type==='number'){const save=p,second=token(),third=second?.type==='number'?token():null;if(third?.value==='obj'){
    need(/^\d+$/.test(first.value)&&/^\d+$/.test(second.value),'Invalid PDF indirect object identity.');const id=Number(first.value)+' '+Number(second.value)+' R',obj=value(),next=token();let ending=next;
    if(next?.value==='stream'){need(obj.type==='dict','Stream does not follow a dictionary.');const length=obj.value.get('Length');need(length?.type==='number'&&/^\d+$/.test(length.value),'Indirect/noninteger stream lengths are unsupported for signature source binding.');if(s[p]==='\r'&&s[p+1]==='\n')p+=2;else if(s[p]==='\n')p++;else refuse('Unsupported PDF stream delimiter.');const size=Number(length.value);need(Number.isSafeInteger(size)&&size>=0&&p+size<=s.length,'Stream length exceeds PDF source.');p+=size;need(token()?.value==='endstream','Stream length does not bind to endstream.');ending=token();}
    need(ending?.value==='endobj','Indirect PDF object is not terminated.');const entries=objects.get(id)||[];entries.push({value:obj,start:first.start,end:ending.end});objects.set(id,entries);need(objects.size<=100000,'PDF object count exceeds bounds.');
   }else p=save;
  }else if(first.type==='dict'){p=first.start;value();}else need(first.type!=='word'||!['obj','stream','endstream','endobj'].includes(first.value),'Unbound PDF object or stream marker.');
 }
 return objects;
}
function inventory(doc){const found=[],seen=new WeakSet(),owners=new WeakMap();for(const [ref,obj]of doc.context.enumerateIndirectObjects())if(obj&&typeof obj==='object')owners.set(obj,ref.toString());let count=0;
 const walk=(obj,depth)=>{need(++count<=300000&&depth<=80,'PDF signature inventory exceeds graph bounds.');if(obj instanceof PDFRef){obj=doc.context.lookup(obj);need(obj,'Unresolved PDF reference.');}if(!obj||typeof obj!=='object'||seen.has(obj))return;seen.add(obj);if(obj instanceof PDFRawStream){walk(obj.dict,depth+1);return;}if(obj instanceof PDFDict){if(obj.has(PDFName.of('ByteRange'))||obj.get(PDFName.of('Type'))===PDFName.of('Sig')){found.push({dict:obj,ref:owners.get(obj)||null});need(found.length<=MAX_SIGNATURES,'More than 32 signature dictionaries are unsupported.');}for(const [,v]of obj.entries())walk(v,depth+1);}else if(obj instanceof PDFArray)for(const v of obj.asArray())walk(v,depth+1);};
 // Inventory all parsed objects, including orphan signatures; do not claim that
 // an integrity result proves a signature field is active or visible.
 for(const [,obj]of doc.context.enumerateIndirectObjects())walk(obj,0);return found;
}
function bind(bytes,raw,entry){
 need(entry.ref,'Direct or compressed signature dictionaries cannot be source-bound by this verifier.');const matches=raw.get(entry.ref);need(matches?.length===1,'Signature object is compressed, missing, or has ambiguous repeated definitions.');const object=matches[0],dict=object.value;need(dict.type==='dict','Signature does not bind to a raw dictionary.');const range=dict.value.get('ByteRange'),contents=dict.value.get('Contents'),subFilter=dict.value.get('SubFilter');need(range?.type==='['&&range.value.length===4&&range.value.every(n=>n.type==='number'&&/^\d+$/.test(n.value)),'ByteRange must contain exactly four nonnegative direct integers.');const r=range.value.map(n=>Number(n.value));need(r.every(Number.isSafeInteger)&&r[0]===0&&r[1]>0&&r[2]>r[1]&&r[3]>0&&r[2]+r[3]<=bytes.length,'ByteRange is out of bounds, overlapping or incomplete.');need(contents?.type==='hex'&&contents.start===r[1]&&contents.end===r[2],'ByteRange exclusion is not exactly this signature Contents token.');need(object.end<=r[2]+r[3]&&range.end<=r[2]+r[3],'Signature dictionary is outside its signed revision.');const parsedRange=entry.dict.get(PDFName.of('ByteRange')),parsedContents=entry.dict.get(PDFName.of('Contents')),parsedSub=entry.dict.get(PDFName.of('SubFilter'));need(parsedRange instanceof PDFArray&&parsedRange.size()===4&&parsedRange.asArray().every((n,i)=>n instanceof PDFNumber&&n.asNumber()===r[i]),'Raw ByteRange differs from the loaded signature dictionary.');need(subFilter?.type==='name'&&parsedSub instanceof PDFName&&parsedSub.decodeText()===subFilter.value,'Raw signature subfilter differs from the loaded dictionary.');need(['adbe.pkcs7.detached','ETSI.CAdES.detached'].includes(subFilter.value),'Only detached PKCS#7 and CAdES subfilters are supported.');const hex=bytes.subarray(contents.start+1,contents.end-1).toString('ascii').replace(/[\x00\t\n\f\r ]/g,'');need(hex.length%2===0&&hex.length>0&&hex.length<=MAX_CMS*2,'Signature Contents exceeds bounds or has odd hex length.');const padded=Buffer.from(hex,'hex');need(parsedContents instanceof PDFHexString&&same(Buffer.from(parsedContents.asBytes()),padded),'Raw Contents differs from the loaded signature dictionary.');const node=der(padded);need(padded.subarray(node.end).every(b=>b===0),'Signature Contents has nonzero trailing bytes.');const signedEnd=r[2]+r[3];need(/%%EOF[\x00\t\n\f\r ]*$/.test(bytes.subarray(Math.max(0,signedEnd-1024),signedEnd).toString('latin1')),'Signed byte range does not end at a PDF revision EOF.');return {cms:padded.subarray(0,node.end),chunks:[bytes.subarray(0,r[1]),bytes.subarray(r[2],signedEnd)],byteRange:r,coverage:signedEnd===bytes.length?'entire-current-file':'earlier-revision',unsignedBytes:bytes.length-signedEnd,subFilter:subFilter.value};
}
async function inspect(source){
 const bytes=Buffer.from(source);need(bytes.length>0&&bytes.length<=MAX_BYTES,'Choose a PDF under 100 MiB.');const report={version:1,sourceSha256:hash(bytes),byteLength:bytes.length,inspectedAt:new Date().toISOString(),inventoryComplete:false,signatures:[],limits:[],scope:'Cryptographic integrity of source-bound detached signatures only. Field visibility, permitted changes, certificate trust, trusted signing time, revocation and PAdES policy are not established.'};
 try{const doc=await PDFDocument.load(bytes,{ignoreEncryption:true,updateMetadata:false,throwOnInvalidObject:true});need(!doc.isEncrypted,'Encrypted PDF signatures are unsupported.');const entries=inventory(doc);let raw=null,rawError=null;try{raw=rawObjects(bytes);}catch(error){rawError=clean(error.message);report.limits.push(rawError);}for(let i=0;i<entries.length;i++){
   const row={index:i+1,objectRef:entries[i].ref||'direct dictionary',integrity:'unsupported',reason:'',byteRange:null,coverage:'unbound',unsignedBytes:null,subFilter:'',messageDigest:'not-checked',signatureValue:'not-checked',digestAlgorithm:'',signatureAlgorithm:'',signer:null,certificateBundle:null,chainInspection:null,claimedSigningTime:'Not established',unsignedAttributes:false,trust:'not-checked',trustedTime:'not-checked',revocation:'not-checked',modificationPolicy:'not-checked'};
   try{need(raw,!rawError?'Source binding is unavailable.':rawError);const bound=bind(bytes,raw,entries[i]);Object.assign(row,{byteRange:bound.byteRange,coverage:bound.coverage,unsignedBytes:bound.unsignedBytes,subFilter:bound.subFilter});Object.assign(row,verifyCms(bound.cms,bound.chunks,bound.subFilter));row.reason=row.integrity==='verified'?'The signature mathematics and any signed content digest match the covered source bytes. Trust and document modification policy remain unverified.':'The signature value or signed message digest does not match the covered source bytes.';}catch(error){row.reason=clean(error.message);}
   report.signatures.push(row);
  }report.inventoryComplete=!!raw;
 }catch(error){report.limits.push(clean(error.message));}
 return validCertificateReport(report,report.sourceSha256,bytes.length,{internal:true});
}
module.exports={inspect};
