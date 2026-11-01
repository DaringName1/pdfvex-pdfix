const fs=require('node:fs/promises'),path=require('node:path'),{createHash,randomUUID}=require('node:crypto');
const MAX_FILE=10*1024*1024,MAX_TOTAL=25*1024*1024,MAX_FILES=100;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const same=(a,b)=>a.isFile()&&b.isFile()&&a.dev===b.dev&&a.ino===b.ino&&a.size===b.size&&a.mtimeMs===b.mtimeMs&&a.ctimeMs===b.ctimeMs;
class PortfolioInputs{
 constructor(){this.entries=new Map();this.generation=0;}
 async pick(owner,filePath,checkActive){
  if(typeof owner!=='string'||!owner||typeof filePath!=='string'||!path.isAbsolute(filePath)||typeof checkActive!=='function')throw new Error('Choose a file for the current portfolio.');
  const generation=this.generation;const live=()=>{checkActive();if(generation!==this.generation)throw new Error('The portfolio input session ended. Choose its files again.');};
  live();const real=await fs.realpath(filePath),before=await fs.lstat(real);
  if(!before.isFile()||before.isSymbolicLink()||before.size<1||before.size>MAX_FILE)throw new Error('Choose a regular nonempty portfolio file up to 10 MiB.');
  if(this.entries.size>=MAX_FILES||[...this.entries.values()].reduce((n,entry)=>n+entry.bytes.length,0)+before.size>MAX_TOTAL)throw new Error('Selected portfolio files exceed the 100-file / 25 MiB input budget. Close a portfolio to release its selected files.');
  let handle,bytes=Buffer.alloc(before.size);try{
   handle=await fs.open(real,'r');const opened=await handle.stat();if(!same(before,opened))throw new Error('The selected portfolio file changed before reading.');
   let offset=0;while(offset<bytes.length){live();const chunk=await handle.read(bytes,offset,Math.min(256*1024,bytes.length-offset),offset);if(!chunk.bytesRead)throw new Error('The selected portfolio file ended unexpectedly.');offset+=chunk.bytesRead;}
   const extra=Buffer.alloc(1);if((await handle.read(extra,0,1,bytes.length)).bytesRead||!same(opened,await handle.stat())||!same(opened,await fs.lstat(real)))throw new Error('The selected portfolio file changed while reading.');live();
   // Concurrent native pickers cannot commit more than the shared input budget.
   if(this.entries.size>=MAX_FILES||[...this.entries.values()].reduce((n,entry)=>n+entry.bytes.length,0)+bytes.length>MAX_TOTAL)throw new Error('The selected portfolio files exceed their shared input budget.');
   await handle.close();handle=null;live();
   const id=randomUUID(),entry=Object.freeze({id,owner,bytes,name:path.basename(real),ext:path.extname(real).slice(1).toLowerCase(),sha256:digest(bytes)});this.entries.set(id,entry);bytes=null;
   return {id,name:entry.name,ext:entry.ext,size:entry.bytes.length,sha256:entry.sha256};
  }finally{bytes?.fill(0);await handle?.close();}
 }
 resolve(owner,ids){
  if(!Array.isArray(ids)||ids.length>MAX_FILES||new Set(ids).size!==ids.length)throw new Error('Choose distinct retained portfolio inputs.');
  return ids.map(id=>{const entry=this.entries.get(id);if(!entry||entry.owner!==owner)throw new Error('A selected portfolio file is no longer retained. Choose it again.');return entry;});
 }
 current(owner,entries){return entries.every(entry=>entry.owner===owner&&this.entries.get(entry.id)===entry);}
 clear(owner){this.generation++;for(const [id,entry]of this.entries)if(owner===undefined||entry.owner===owner){entry.bytes.fill(0);this.entries.delete(id);}return true;}
}
module.exports={PortfolioInputs};
