const fs=require('node:fs/promises');
const path=require('node:path');
const {FileError}=require('./file-store.cjs');
const MAX_JSON_BYTES=2*1024*1024;
async function readChosenJson(filePath,label='saved JSON'){
  if(typeof filePath!=='string'||path.extname(filePath).toLowerCase()!=='.json')throw new FileError('FORMAT','Choose a '+label+' JSON file.');
  const handle=await fs.open(filePath,'r');
  try{
    const before=await handle.stat();
    if(!before.isFile()||!before.size||before.size>MAX_JSON_BYTES)throw new FileError('TOO_LARGE','Choose a '+label+' between 1 byte and 2 MB.');
    const buffer=Buffer.alloc(before.size+1);let length=0;
    while(length<buffer.length){const chunk=await handle.read(buffer,length,buffer.length-length,length);if(!chunk.bytesRead)break;length+=chunk.bytesRead;}
    const after=await handle.stat();
    if(length!==before.size||after.size!==before.size||after.mtimeMs!==before.mtimeMs||after.ctimeMs!==before.ctimeMs)throw new FileError('CHANGED','The '+label+' changed while reading. Choose it again.');
    const bytes=buffer.subarray(0,length);
    try{new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new FileError('FORMAT','The '+label+' must contain valid UTF-8 text.');}
    return {name:path.basename(filePath).slice(0,200),bytes:Uint8Array.from(bytes)};
  }finally{await handle.close();}
}
module.exports={readChosenJson,MAX_JSON_BYTES};
