const {createHash}=require('node:crypto');
const MAX_BYTES=100*1024*1024,HASH=/^[a-f0-9]{64}$/;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=()=>{throw new Error('The document PDF failed its exact-output page inspection.');};
const exact=(value,fields)=>value&&Object.getPrototypeOf(value)===Object.prototype&&Object.keys(value).sort().join(',')===[...fields].sort().join(',');
function validDocumentOutputBytes(bytes){if(!(bytes instanceof Uint8Array)||bytes.length<1||bytes.length>MAX_BYTES)fail();return bytes;}
// This validator handles only inert child JSON; it never opens or parses a PDF.
function validDocumentOutputInspection(value,sourceSha256,byteLength){
 if(typeof sourceSha256!=='string'||!HASH.test(sourceSha256)||!Number.isInteger(byteLength)||byteLength<1||byteLength>MAX_BYTES||!exact(value,['version','sourceSha256','byteLength','pageCount','pages'])||value.version!==1||value.sourceSha256!==sourceSha256||value.byteLength!==byteLength||!Number.isInteger(value.pageCount)||value.pageCount<1||value.pageCount>500||!Array.isArray(value.pages)||value.pages.length!==value.pageCount)fail();
 for(let index=0;index<value.pages.length;index++){
  const page=value.pages[index],box=page?.mediaBox;
  if(!exact(page,['page','mediaBox'])||page.page!==index+1||!exact(box,['x','y','width','height'])||![box.x,box.y,box.width,box.height].every(number=>typeof number==='number'&&Number.isFinite(number))||Math.abs(box.x)>1e7||Math.abs(box.y)>1e7||box.width<100||box.height<100||box.width>2000||box.height>2000)fail();
 }
 return value;
}
module.exports={MAX_BYTES,hash,validDocumentOutputBytes,validDocumentOutputInspection};
