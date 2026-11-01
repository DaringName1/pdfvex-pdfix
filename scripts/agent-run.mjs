// One in-app check at a time when several agents share this folder.
// Usage: node scripts/agent-run.mjs <agent-name> -- <command ...>
// Example: node scripts/agent-run.mjs codex -- npx playwright test tests/desktop/pdf-reading.spec.js
// Takes tmp/app-run.lock for the whole command, waits while another agent's check or a build (tmp/build.lock) is
// running, and always releases the lock. Hidden test windows are forced (PDFIX_TEST_VISIBLE=0). A lock left by a
// process that no longer exists, or past its expiry, is taken over. The expiry is 60 minutes, or longer for a declared
// long check: node scripts/agent-run.mjs codex --minutes=90 -- <command> holds the lock for 90 + 10 minutes (at most 240).
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {readLock,removeStale,releaseOwn} from './agent-lock.mjs';
const split=process.argv.indexOf('--'),agent=(process.argv[2]??'').trim(),command=split>0?process.argv.slice(split+1):[];
const options=process.argv.slice(3,split>0?split:undefined),declared=options.find(arg=>/^--minutes=\d+$/.test(arg)),minutes=declared?Math.min(240,Number(declared.split('=')[1])):0;
if(options.some(arg=>!/^--minutes=\d+$/.test(arg))){console.error('Only --minutes=N may come before --.');process.exit(2);}
if(!/^[A-Za-z][A-Za-z0-9_-]{1,30}$/.test(agent)||!command.length){console.error('Usage: node scripts/agent-run.mjs <agent-name> -- <command ...>');process.exit(2);}
const lock=path.resolve('tmp/app-run.lock'),build=path.resolve('tmp/build.lock'),STALE_MS=60*60*1000,WAIT_MS=45*60*1000;
await fs.mkdir(path.dirname(lock),{recursive:true});
const alive=pid=>{try{process.kill(pid,0);return true;}catch(error){return error.code==='EPERM';}};
const holderOf=async file=>{try{return JSON.parse(await fs.readFile(file,'utf8'));}catch{return null;}};
const expiry=holder=>Number.isFinite(Date.parse(holder?.expiresAt))?Date.parse(holder.expiresAt):Date.parse(holder?.started)+STALE_MS;
const live=holder=>holder&&Number.isFinite(expiry(holder))&&Date.now()<expiry(holder)&&alive(holder.pid);
async function take(){
 const building=await holderOf(build);if(live(building))return {...building,what:'building'};
 try{const handle=await fs.open(lock,'wx');const now=Date.now();await handle.writeFile(JSON.stringify({agent,pid:process.pid,started:new Date(now).toISOString(),expiresAt:new Date(now+Math.max(STALE_MS,(minutes+10)*60000)).toISOString(),command:command.join(' ').slice(0,200)})+'\n');await handle.close();return null;}
 catch(error){if(error.code!=='EEXIST')throw error;}
 const {raw,holder,missing}=await readLock(lock);if(missing)return take();if(!live(holder)){await removeStale(lock,raw);if(holder||!(await fs.stat(lock).catch(()=>null)))return take();return {agent:'another agent',started:'just now',what:'starting a check'};}return {...holder,what:'running a check'};
}
// Generated test and build files are pruned before each check so they never pile up in Google Drive (owner, October 28).
await import('./clean-dev-space.mjs').then(m=>m.cleanDevSpace({quiet:true})).catch(error=>console.error('Space cleanup skipped: '+error.message));
const started=Date.now();let holder;
while((holder=await take())){
 if(Date.now()-started>WAIT_MS){console.error(`Not started: ${holder.agent} has been ${holder.what} since ${holder.started}.`);process.exit(3);}
 console.error(`Waiting: ${holder.agent} is ${holder.what} (since ${holder.started})…`);await new Promise(resolve=>setTimeout(resolve,5000));
}
const release=()=>releaseOwn(lock);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await release();process.exit(130);});
const code=await new Promise(resolve=>{const child=spawn(command.join(' '),{shell:true,stdio:'inherit',env:{...process.env,PDFIX_TEST_VISIBLE:'0'}});child.on('close',value=>resolve(value??1));child.on('error',()=>resolve(1));});
await release();process.exit(code);
