// Lock-file helpers shared by scripts/agent-run.mjs and scripts/agent-build.mjs.
// A lock is only ever removed by the process that wrote it, or, when its owner is gone, only if it still holds exactly
// the same owner that was judged stale. That stops one agent removing a lock another agent has just taken.
import fs from 'node:fs/promises';
// A lock file that cannot be read yet may be in the middle of being written; it only counts as abandoned after this.
export const UNREADABLE_GRACE_MS=10000;
export async function readLock(file){let raw;try{raw=await fs.readFile(file,'utf8');}catch(error){return {raw:null,holder:null,missing:error.code==='ENOENT'};}try{return {raw,holder:JSON.parse(raw)};}catch{return {raw:null,holder:null,missing:false};}}
// Removes a stale lock only if it is unchanged since it was judged stale.
export async function removeStale(file,seenRaw){
  let now;try{now=await fs.readFile(file,'utf8');}catch{return;}
  if(seenRaw===null||now!==seenRaw){
    // Unreadable or half-written: leave it while it might be another agent writing it right now.
    if(seenRaw!==null)return;const stat=await fs.stat(file).catch(()=>null);if(!stat||Date.now()-stat.mtimeMs<UNREADABLE_GRACE_MS)return;
    try{JSON.parse(now);return;}catch{}
  }
  await fs.rm(file,{force:true});
}
// Removes the lock only while it still belongs to this process.
export async function releaseOwn(file,pid=process.pid){const {holder}=await readLock(file);if(holder?.pid===pid)await fs.rm(file,{force:true}).catch(()=>{});}
