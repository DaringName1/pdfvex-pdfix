'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),{FileError}=require('./file-store.cjs');
const LIMIT=5*1024*1024,PNG=Buffer.from([137,80,78,71,13,10,26,10]);
// Pictures a Markdown file refers to, for its formatted conversion: relative paths inside the Markdown file's own
// folder only (links resolved), PNG or JPEG by content, up to 5 MB. Web addresses are never fetched.
async function readMarkdownImage(markdownPath,target){
 if(typeof target!=='string'||!target||target.length>1000||target.includes('\0')||/^[a-z][a-z0-9+.-]*:/i.test(target)||/^[\\/]/.test(target))throw new FileError('PATH','Only pictures in the Markdown file\'s folder are placed.');
 let relative;try{relative=decodeURIComponent(target.split(/[?#]/)[0]);}catch{throw new FileError('PATH','The picture path is not valid.');}
 // Decoding can reveal a drive, network or absolute path that the raw text hid (%5C%5Cserver, C%3A).
 if(!relative||relative.includes('\0')||/^[a-z]:/i.test(relative)||/^[\\/]/.test(relative))throw new FileError('PATH','Only pictures in the Markdown file\'s folder are placed.');
 const folder=await fs.realpath(path.dirname(markdownPath)),inside=file=>{const rel=path.relative(folder,file);return !!rel&&rel.split(/[\\/]/)[0]!=='..'&&!path.isAbsolute(rel);};
 if(!inside(path.resolve(folder,relative)))throw new FileError('PATH','Only pictures in the Markdown file\'s folder are placed.');
 let real;try{real=await fs.realpath(path.resolve(folder,relative));}catch{throw new FileError('MISSING','Picture not found: '+relative.slice(0,200));}
 if(!inside(real)||!['png','jpg','jpeg'].includes(path.extname(real).slice(1).toLowerCase()))throw new FileError('FORMAT','Only PNG and JPEG pictures in the Markdown file\'s folder are placed.');
 // Read through one handle with a hard cap, so a file swapped or grown after the check is never read past 5 MB.
 const handle=await fs.open(real,'r');let bytes;
 try{const stat=await handle.stat();if(!stat.isFile()||stat.size>LIMIT)throw new FileError('SIZE','Pictures up to 5 MB are placed.');
  const buffer=Buffer.alloc(LIMIT+1);let length=0;for(;;){const {bytesRead}=await handle.read(buffer,length,buffer.length-length,length);if(!bytesRead)break;length+=bytesRead;if(length>LIMIT)throw new FileError('SIZE','Pictures up to 5 MB are placed.');}
  bytes=buffer.subarray(0,length);}finally{await handle.close();}
 const png=bytes.subarray(0,8).equals(PNG),jpeg=bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
 if(!png&&!jpeg)throw new FileError('FORMAT','The picture is not a PNG or JPEG file.');return {bytes:new Uint8Array(bytes),mime:png?'image/png':'image/jpeg'};
}
module.exports={readMarkdownImage,MARKDOWN_IMAGE_LIMIT:LIMIT};
