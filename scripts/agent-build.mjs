// One build at a time when several agents share this folder.
// Usage: node scripts/agent-build.mjs <agent-name>
// Takes tmp/build.lock, runs "npm run build", retries once if the build reports that source files changed while it
// ran, and always releases the lock. If another agent holds the lock it waits up to three minutes.
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {readLock,removeStale,releaseOwn} from './agent-lock.mjs';
const agent=(process.argv[2]??'').trim();
if(!/^[A-Za-z][A-Za-z0-9_-]{1,30}$/.test(agent)){console.error('Usage: node scripts/agent-build.mjs <agent-name>   (for example: claude or codex)');process.exit(2);}
const lock=path.resolve('tmp/build.lock'),STALE_MS=10*60*1000,WAIT_MS=3*60*1000;
await fs.mkdir(path.dirname(lock),{recursive:true});
const alive=pid=>{try{process.kill(pid,0);return true;}catch(error){return error.code==='EPERM';}};
async function take(){
 // A build replaces dist, so it waits while another agent's in-app check (scripts/agent-run.mjs) is running.
 try{const run=JSON.parse(await fs.readFile(path.resolve('tmp/app-run.lock'),'utf8'));const until=Number.isFinite(Date.parse(run.expiresAt))?Date.parse(run.expiresAt):Date.parse(run.started)+60*60*1000;if(run.agent!==agent&&Date.now()<until&&alive(run.pid))return {...run,started:run.started};}catch{}
 try{const handle=await fs.open(lock,'wx');await handle.writeFile(JSON.stringify({agent,pid:process.pid,started:new Date().toISOString()})+'\n');await handle.close();return null;}
 catch(error){if(error.code!=='EEXIST')throw error;}
 const {raw,holder,missing}=await readLock(lock);if(missing)return take();
 const age=holder?Date.now()-Date.parse(holder.started):Infinity;
 // A lock left by a crashed or killed build is taken over rather than blocking everyone.
 if(!holder||!Number.isFinite(age)||age>STALE_MS||!alive(holder.pid)){await removeStale(lock,raw);if(holder||!(await fs.stat(lock).catch(()=>null)))return take();return {agent:'another agent',started:'just now'};}
 return holder;
}
const started=Date.now(),WAIT_TOTAL=45*60*1000;let holder;
while((holder=await take())){
 if(Date.now()-started>(holder?.command?WAIT_TOTAL:WAIT_MS)){console.error(`Build not started: ${holder.agent} has held the build lock since ${holder.started}. Try again shortly.`);process.exit(3);}
 console.error(`Waiting: ${holder.agent} is building (since ${holder.started})…`);await new Promise(resolve=>setTimeout(resolve,2000));
}
const release=()=>releaseOwn(lock);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await release();process.exit(130);});
const build=()=>new Promise(resolve=>{let output='';const child=spawn('npm run build',{shell:true,stdio:['ignore','pipe','pipe']});for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{output+=chunk;process.stderr.write(chunk);});child.on('close',code=>resolve({code:code??1,output}));child.on('error',error=>resolve({code:1,output:String(error)}));});
let result;
try{
 result=await build();
 if(result.code!==0&&/Source changed during compilation/.test(result.output)){console.error('\nSource files changed while building (another agent saved). Building once more in five seconds…\n');await new Promise(resolve=>setTimeout(resolve,5000));result=await build();}
}finally{await release();}
console.error(result.code===0?`\nBuild finished for ${agent}.`:`\nBuild failed for ${agent} (exit ${result.code}).`);
process.exit(result.code);
