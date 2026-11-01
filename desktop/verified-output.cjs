'use strict';
const fs=require('node:fs/promises'),{renameWithRetry}=require('./rename-retry.cjs'),path=require('node:path'),{randomUUID,createHash}=require('node:crypto');
const fail=(code,message)=>Object.assign(new Error(message),{code});
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const same=(a,b)=>a&&b&&a.dev===b.dev&&a.ino===b.ino&&a.birthtimeMs===b.birthtimeMs;
async function verifyHandle(handle,size,expected,check=()=>{}){
 const before=await handle.stat();if(!before.isFile()||before.size!==size)throw fail('VERIFY','The staged output size changed.');
 const hash=createHash('sha256'),buffer=Buffer.alloc(Math.min(256*1024,size));let offset=0;
 while(offset<size){check();const {bytesRead}=await handle.read(buffer,0,Math.min(buffer.length,size-offset),offset);if(!bytesRead)throw fail('VERIFY','The saved output ended before all reviewed bytes were read.');hash.update(buffer.subarray(0,bytesRead));offset+=bytesRead;}
 const extra=await handle.read(buffer,0,1,offset),after=await handle.stat();
 check();if(extra.bytesRead||after.size!==size||before.mtimeMs!==after.mtimeMs||hash.digest('hex')!==expected)throw fail('VERIFY','Saved output bytes did not match the reviewed output.');return after;
}
async function stageStreamOutput(directory,input,{check=()=>{},progress=()=>{}}={}){
 if(!input||!Number.isSafeInteger(input.size)||input.size<1||!/^[a-f0-9]{64}$/.test(input.sha256)||typeof input.chunks?.[Symbol.asyncIterator]!=='function')throw fail('OUTPUT','Choose a retained source snapshot for streaming copy.');
 const temporary=path.join(directory,`.pdfix-${randomUUID()}.partial`);let handle,identity;
 try{
  check();handle=await fs.open(temporary,'wx+',0o600);identity=await handle.stat();const hash=createHash('sha256');let offset=0;
  for await(const chunk of input.chunks){check();if(!(chunk instanceof Uint8Array)||!chunk.length||chunk.length>1024*1024||offset+chunk.length>input.size)throw fail('VERIFY','The retained copy stream changed size.');hash.update(chunk);let written=0;while(written<chunk.length){check();const result=await handle.write(chunk,written,chunk.length-written,offset+written);if(!result.bytesWritten)throw fail('WRITE','The output stopped accepting source bytes.');written+=result.bytesWritten;}offset+=chunk.length;progress(offset,input.size);}
  if(offset!==input.size||hash.digest('hex')!==input.sha256)throw fail('VERIFY','The copy stream did not match the original snapshot.');check();await handle.sync();identity=await verifyHandle(handle,input.size,input.sha256,check);await handle.close();handle=null;check();return {temporary,identity,size:input.size,hash:input.sha256,check};
 }catch(error){await handle?.close().catch(()=>{});if(identity&&!await unlinkOwned(temporary,identity))throw fail('PARTIAL',`Saving failed. A temporary output could not be removed at ${temporary}. It is not a completed copy.`);throw error;}
}
async function unlinkOwned(filename,identity){try{const stat=await fs.lstat(filename);if(!stat.isFile()||stat.isSymbolicLink()||!same(stat,identity))return false;await fs.unlink(filename);return true;}catch(error){return error.code==='ENOENT';}}
// No rename-overwrite or direct-write fallback: unsupported destination filesystems
// must fail safely. A final filename only becomes visible after staged verification.
async function stageOutput(directory,bytes,{expectedHash,check=()=>{}}={}){
 if(!Buffer.isBuffer(bytes)&&!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>100*1024*1024)throw fail('OUTPUT','Choose a nonempty reviewed output.');
 const hash=expectedHash??digest(bytes);if(!/^[a-f0-9]{64}$/.test(hash)||digest(bytes)!==hash)throw fail('VERIFY','Reviewed output bytes changed before saving.');
 const temporary=path.join(directory,`.pdfix-${randomUUID()}.partial`);let handle,identity;
 try{check();handle=await fs.open(temporary,'wx+',0o600);identity=await handle.stat();await handle.writeFile(bytes);await handle.sync();identity=await verifyHandle(handle,bytes.length,hash);check();await handle.close();handle=null;return {temporary,identity,size:bytes.length,hash,check};}
 catch(error){await handle?.close().catch(()=>{});if(identity&&!await unlinkOwned(temporary,identity))throw fail('PARTIAL',`Saving failed. A temporary output could not be removed at ${temporary}. It is not a completed copy.`);throw error;}
}
// Drives without hard links (FAT32/exFAT USB sticks and SD cards, some network and cloud drives) get an exclusive
// copy instead: Windows refuses it when the name already exists, so nothing is ever overwritten, and the copy is
// re-read and checked byte for byte like a linked one.
const NO_HARD_LINK=new Set(['ENOTSUP','EOPNOTSUPP','EXDEV','ENOSYS','EPERM','EISDIR','EINVAL']);
async function publishOutput(stage,destination,{link=fs.link,copyFile=fs.copyFile}={}){
 let published=null,copied=null;
 try{stage.check();const current=await fs.lstat(stage.temporary);if(!same(current,stage.identity)||current.isSymbolicLink()||!current.isFile()||current.size!==stage.size)throw fail('VERIFY','The verified staged file identity changed.');
  try{await link(stage.temporary,destination);published='link';}
  catch(error){if(!NO_HARD_LINK.has(error.code))throw error;await copyFile(stage.temporary,destination,require('node:fs').constants.COPYFILE_EXCL);published='copy';copied=await fs.lstat(destination);}
  stage.check();const handle=await fs.open(destination,'r');try{const stat=await handle.stat();if(published==='link'?!same(stat,stage.identity):!same(stat,copied)||stat.size!==stage.size)throw fail('VERIFY','The published output identity changed.');await verifyHandle(handle,stage.size,stage.hash,stage.check);}finally{await handle.close();}stage.check();
  const cleaned=await unlinkOwned(stage.temporary,stage.identity);return {size:stage.size,sha256:stage.hash,...(published==='copy'?{publishedBy:'exclusive-copy'}:{}),...(!cleaned?{cleanupWarning:`The completed copy is valid, but a temporary file remains at ${stage.temporary}.`}:{})};
 }catch(error){let removed=true;if(published==='link')removed=await unlinkOwned(destination,stage.identity);else if(published==='copy')removed=await unlinkOwned(destination,copied);const stagedRemoved=await unlinkOwned(stage.temporary,stage.identity);if(!removed||!stagedRemoved)throw fail('PARTIAL',`Output publication failed. Review ${destination} and ${stage.temporary}; no success is assumed and another process's replacement is not deleted.`);if(error.code==='EEXIST')throw fail('EXISTS','That filename already exists. Choose a new name; existing files are never overwritten.');if(NO_HARD_LINK.has(error.code))throw fail('FILESYSTEM','PDFix could not save a checked copy in this folder. Save it to your Documents folder first, then copy it here.');throw error;}
}
async function discardStage(stage){return unlinkOwned(stage.temporary,stage.identity);}
// Save in place only: replaces an existing file with a staged, verified output in one rename, after checking the file
// still holds the bytes it was opened with. Copies keep using publishOutput, which never overwrites.
async function replaceOutput(stage,destination,expectedCurrentHash){
 try{
  stage.check();const current=await fs.lstat(stage.temporary);if(!same(current,stage.identity)||current.isSymbolicLink()||!current.isFile()||current.size!==stage.size)throw fail('VERIFY','The verified staged file identity changed.');
  const target=await fs.lstat(destination).catch(()=>null);if(!target||!target.isFile()||target.isSymbolicLink())throw fail('MISSING','This file is no longer where it was opened from. Save a copy instead.');
  if(digest(await fs.readFile(destination))!==expectedCurrentHash)throw fail('CHANGED','This file was changed by another program since it was opened. Save a copy instead, or reopen it.');
  try{await renameWithRetry(stage.temporary,destination);}catch(error){throw fail(['EBUSY','EPERM','EACCES'].includes(error.code)?'LOCKED':'WRITE',['EBUSY','EPERM','EACCES'].includes(error.code)?'The file is open or locked in another program. Close it there, or save a copy.':'The file could not be replaced. Save a copy instead.');}
  const handle=await fs.open(destination,'r');try{await verifyHandle(handle,stage.size,stage.hash,stage.check);}finally{await handle.close();}
  return {size:stage.size,sha256:stage.hash};
 }catch(error){await unlinkOwned(stage.temporary,stage.identity);throw error;}
}
module.exports={stageOutput,stageStreamOutput,publishOutput,replaceOutput,discardStage,verifyHandle,unlinkOwned,digest};
