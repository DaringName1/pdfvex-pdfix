'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const {createHash}=require('node:crypto');
const {FileError}=require('./file-store.cjs');
async function sameFileUnderShortName(requested,real){
 if(process.platform!=='win32'||!requested.split(/[\\/]/).some(part=>/~[0-9]/.test(part)))return false;
 const [a,b]=await Promise.all([fs.stat(requested,{bigint:true}),fs.stat(real,{bigint:true})]);return a.dev===b.dev&&a.ino===b.ino;
}
async function regularChosenPath(selected,extensions){
 if(typeof selected!=='string'||selected.length>4096||!path.isAbsolute(selected)||/[\0\r\n]/.test(selected))throw new FileError('INPUT','Choose a local file with the native picker.');
 const requested=path.resolve(selected),real=await fs.realpath(requested);
 for(let current=requested;;current=path.dirname(current)){
  const item=await fs.lstat(current);if(item.isSymbolicLink())throw new FileError('INPUT','Linked files or parent folders are not supported.');
  if(path.dirname(current)===current)break;
 }
 // A Windows short (8.3) name such as C:\Users\PDFIXT~1 is not a link: it is accepted only when no part of the path is a
 // link (checked above) and both spellings name the very same file. Any other difference is still refused.
 if(real.toLowerCase()!==requested.toLowerCase()&&!await sameFileUnderShortName(requested,real))throw new FileError('INPUT','Linked paths are not supported for this operation. Choose the actual file.');
 const stat=await fs.lstat(real);
 if(!stat.isFile()||stat.nlink!==1)throw new FileError('INPUT','Choose a regular file with no hard-link aliases.');
 if(extensions&&!extensions.includes(path.extname(real).slice(1).toLowerCase()))throw new FileError('FORMAT','Choose the requested file type.');
 return {path:real,stat};
}
async function readChosenBoundedFile(selected,extensions,maximum){
 const checked=await regularChosenPath(selected,extensions);let handle,allocation;
 try{
  handle=await fs.open(checked.path,'r');const before=await handle.stat();
  if(before.dev!==checked.stat.dev||before.ino!==checked.stat.ino||before.nlink!==1||!Number.isSafeInteger(before.size)||!before.size||before.size>maximum)throw new FileError('INPUT','This file is empty, changed, or exceeds this operation’s input limit.');
  allocation=Buffer.alloc(before.size+1);let offset=0;
  while(offset<allocation.length){const read=await handle.read(allocation,offset,allocation.length-offset,offset);if(!read.bytesRead)break;offset+=read.bytesRead;}
  const after=await handle.stat(),named=await fs.lstat(checked.path);
  if(offset!==before.size||after.nlink!==1||named.dev!==before.dev||named.ino!==before.ino||after.size!==before.size||after.mtimeMs!==before.mtimeMs||after.ctimeMs!==before.ctimeMs)throw new FileError('CHANGED','The chosen file changed while being read. Choose it again.');
  const bytes=Buffer.from(allocation.subarray(0,offset));return {name:path.basename(checked.path),path:checked.path,bytes,sha256:createHash('sha256').update(bytes).digest('hex')};
 }finally{allocation?.fill(0);await handle?.close();}
}
module.exports={regularChosenPath,readChosenBoundedFile};
