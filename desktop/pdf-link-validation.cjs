const MAX_BYTES=100*1024*1024,MAX_URL=4096,REF=/^([1-9]\d{0,9})R([1-9]\d{0,4})?$/;
function validateWebDestination(value){
  if(typeof value!=='string'||!value.length||value.length>MAX_URL||value!==value.trim()||/[\p{Cc}\p{Cf}\p{Cs}]/u.test(value)||value.includes('\\')||/%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(value)||!/^https?:\/\//i.test(value))throw new Error('This link destination is not a permitted web address.');
  let parsed;try{parsed=new URL(value);}catch{throw new Error('This link destination is not a supported web address.');}
  if(!['http:','https:'].includes(parsed.protocol)||!parsed.hostname||parsed.username||parsed.password||parsed.href.length>MAX_URL)throw new Error('Only HTTP and HTTPS addresses without embedded credentials can be opened.');
  return {url:parsed.href,originalURL:value,host:parsed.host};
}
function validateLinkRequest(request){
  if(!request||typeof request!=='object'||Array.isArray(request)||Object.keys(request).length!==4||Object.keys(request).some(key=>!['sourceID','sourceSha256','page','annotationID'].includes(key))||typeof request.sourceID!=='string'||!/^[-0-9a-f]{36}$/i.test(request.sourceID)||typeof request.sourceSha256!=='string'||!/^[a-f0-9]{64}$/.test(request.sourceSha256)||!Number.isInteger(request.page)||request.page<1||request.page>500||typeof request.annotationID!=='string')throw new Error('Choose a link from the currently opened PDF page.');
  const ref=REF.exec(request.annotationID);if(!ref||Number(ref[1])>2147483647||Number(ref[2]||0)>65535)throw new Error('This annotation reference cannot be independently reviewed.');
  return {sourceID:request.sourceID,sourceSha256:request.sourceSha256,page:request.page,annotationID:request.annotationID};
}
function validLinkResult(value,request){
 if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join(",")!==["sourceID","sourceSha256","page","annotationID","url","originalURL","host","actionType"].sort().join(",")||["sourceID","sourceSha256","page","annotationID"].some(k=>value[k]!==request[k])||value.actionType!=="URI")throw new Error("The contained PDF destination does not match its source request.");
 const safe=validateWebDestination(value.originalURL);if(safe.url!==value.url||safe.host!==value.host)throw new Error("The contained web destination changed.");return {...request,...safe,actionType:"URI"};
}
module.exports={validateLinkRequest,validateWebDestination,validLinkResult,MAX_BYTES,MAX_URL};
