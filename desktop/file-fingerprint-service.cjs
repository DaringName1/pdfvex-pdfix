'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const {createHash,randomUUID}=require('node:crypto');
const {regularChosenPath}=require('./chosen-bounded-file.cjs');
const {FileError}=require('./file-store.cjs');
function expectedHash(value){if(typeof value!=='string'||value.length>128||!/^\s*[a-f0-9]{64}\s*$/i.test(value))throw new FileError('HASH','Enter exactly 64 hexadecimal SHA-256 characters.');return value.trim().toLowerCase();}
class FileFingerprintService{
 constructor(){this.active=null;this.receipt=null;this.comparison=null;this.generation=0;}
 async calculate(selected){
  if(this.active)throw new FileError('BUSY','Finish or cancel the current fingerprint first.');
  const generation=++this.generation,job={token:randomUUID(),completed:0,total:0,canceled:false,startedAt:Date.now()};this.active=job;this.receipt=null;this.comparison=null;
  let handle,buffer;
  try{
   const checked=await regularChosenPath(selected),before=checked.stat;
   if(!Number.isSafeInteger(before.size))throw new FileError('HASH','This file’s size cannot be represented safely.');
   job.total=before.size;handle=await fs.open(checked.path,'r');const opened=await handle.stat();
   if(opened.ino!==before.ino||opened.dev!==before.dev||opened.nlink!==1||opened.size!==before.size||opened.mtimeMs!==before.mtimeMs||opened.ctimeMs!==before.ctimeMs)throw new FileError('CHANGED','This file changed before hashing started.');
   buffer=Buffer.alloc(1024*1024);const digest=createHash('sha256');
   while(job.completed<job.total){
    if(job.canceled||generation!==this.generation)throw new FileError('CANCELED','Fingerprint calculation canceled.');
    const read=await handle.read(buffer,0,Math.min(buffer.length,job.total-job.completed),job.completed);if(!read.bytesRead)throw new FileError('CHANGED','This file changed during hashing.');
    digest.update(buffer.subarray(0,read.bytesRead));job.completed+=read.bytesRead;
   }
   const extra=await handle.read(buffer,0,1,job.completed),after=await handle.stat(),named=await regularChosenPath(checked.path);
   if(job.canceled||generation!==this.generation)throw new FileError('CANCELED','Fingerprint calculation canceled.');
   if(extra.bytesRead||after.size!==before.size||after.mtimeMs!==before.mtimeMs||after.ctimeMs!==before.ctimeMs||named.stat.ino!==before.ino||named.stat.dev!==before.dev||named.stat.nlink!==1)throw new FileError('CHANGED','This file changed during hashing. Recalculate its fingerprint.');
   this.receipt={version:1,algorithm:'SHA-256',name:path.basename(checked.path),size:before.size,sha256:digest.digest('hex'),checkedAt:new Date().toISOString(),scope:'Exact bytes read from one stable selected file; this is not signer authentication or a guarantee of future unchanged content.'};
   return structuredClone(this.receipt);
  }catch(error){throw error instanceof FileError?error:new FileError('HASH','The selected file could not be read. Check its availability and permissions.');}
  finally{buffer?.fill(0);await handle?.close();if(this.active===job)this.active=null;}
 }
 progress(){const job=this.active;return job?{running:true,completed:job.completed,total:job.total,canceled:job.canceled}:{running:false};}
 cancel(){if(!this.active)return false;this.active.canceled=true;return true;}
 clear(){this.cancel();this.generation++;this.receipt=null;this.comparison=null;}
 compare(value){if(!this.receipt)throw new FileError('HASH','Calculate a selected file’s fingerprint first.');const expected=expectedHash(value);this.comparison={expected,actual:this.receipt.sha256,match:expected===this.receipt.sha256};return structuredClone(this.comparison);}
 export(){if(!this.receipt)throw new FileError('HASH','Calculate a selected file’s fingerprint first.');return Buffer.from(JSON.stringify({...this.receipt,...(this.comparison?{comparison:this.comparison}:{})},null,2)+'\n');}
}
module.exports={FileFingerprintService,expectedHash};
