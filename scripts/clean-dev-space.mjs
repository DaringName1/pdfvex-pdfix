// Keeps generated test and build files from piling up in this Google Drive folder (owner, October 28, 2026: the
// folder had grown to over 200 GB). Runs automatically at the start of every agent-run check, at most every 6 hours,
// and can be run by hand: node scripts/clean-dev-space.mjs [--dry-run]
//
// Removes only generated files, and only when nothing has changed in them for a while:
//   .test-data/<folder>                     older than 24 hours (per-test profiles and fixtures)
//   <system temp>/pdfix-test-runtimes/<dir> older than 24 hours (app snapshots left by a crashed test)
//   tmp/<folder>                            older than 2 days (clean copies, package and review folders)
//   tmp/*.tgz|*.tar|*.zip over 50 MB        older than 2 days
//   releases/PDFix-<version>-<stamp>-win-x64 all but the newest 2 package folders
// Never removes: source, docs, samples, node_modules, Setup .exe installers (Codex owns those), the desktop-shortcut
// backups in tmp, or anything changed in the last 3 hours. Links (junctions) inside a folder are removed as links,
// never followed, so the shared node_modules they point to is never touched.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const HOUR=60*60*1000;
const isLink=stat=>stat.isSymbolicLink();

// Remove every link up to a few levels down without stepping into it, then the folder itself.
async function removeTree(target){
 const stat=await fs.lstat(target);
 if(isLink(stat)){await fs.rm(target,{force:true});return;}
 if(!stat.isDirectory()){await fs.rm(target,{force:true,maxRetries:3});return;}
 const walk=async(dir,depth)=>{let entries;try{entries=await fs.readdir(dir,{withFileTypes:true});}catch{return;}
  for(const entry of entries){const full=path.join(dir,entry.name);if(entry.isSymbolicLink()){await fs.rm(full,{force:true}).catch(()=>fs.rmdir(full));}else if(entry.isDirectory()&&depth<6)await walk(full,depth+1);}};
 await walk(target,0);
 await fs.rm(target,{recursive:true,force:true,maxRetries:3});
}

async function list(dir){try{return await fs.readdir(dir,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return [];throw error;}}
async function sizeOf(target,depth=0){let total=0;let stat;try{stat=await fs.lstat(target);}catch{return 0;}if(isLink(stat))return 0;if(!stat.isDirectory())return stat.size;
 for(const entry of await list(target))total+=await sizeOf(path.join(target,entry.name),depth+1);return total;}

export async function planCleanup({root=process.cwd(),now=Date.now(),temp=os.tmpdir()}={}){
 const recent=3*HOUR,plan=[];
 const old=async(full,age)=>{const stat=await fs.lstat(full).catch(()=>null);return !!stat&&now-stat.mtimeMs>Math.max(age,recent);};
 const add=(full,why)=>plan.push({path:full,why});
 for(const entry of await list(path.join(root,'.test-data')))if(entry.isDirectory()||entry.isSymbolicLink()){const full=path.join(root,'.test-data',entry.name);if(await old(full,24*HOUR))add(full,'test folder older than 24 hours');}
 const runtimes=path.join(temp,'pdfix-test-runtimes');
 for(const entry of await list(runtimes))if(/^reader-runtime-[A-Za-z0-9]{6}$/.test(entry.name)){const full=path.join(runtimes,entry.name);if(await old(full,24*HOUR))add(full,'leftover app snapshot older than 24 hours');}
 for(const entry of await list(path.join(root,'tmp'))){const full=path.join(root,'tmp',entry.name);
  if(/^desktop-shortcut-backup/i.test(entry.name)||/\.lock$/i.test(entry.name))continue;
  if(entry.isDirectory()){if(await old(full,48*HOUR))add(full,'tmp folder older than 2 days');continue;}
  if(entry.isFile()&&/\.(tgz|tar|zip)$/i.test(entry.name)){const stat=await fs.stat(full);if(stat.size>50*1024*1024&&await old(full,48*HOUR))add(full,'large tmp archive older than 2 days');}}
 const packages=[];for(const entry of await list(path.join(root,'releases')))if(entry.isDirectory()&&/^PDFix-\d+\.\d+\.\d+-\d{8}T\d+-[0-9a-f]{8}-win-x64$/.test(entry.name))packages.push(entry.name);
 packages.sort();for(const name of packages.slice(0,-2)){const full=path.join(root,'releases',name);if(await old(full,0))add(full,'older release package (newest 2 kept)');}
 // Belt and braces: everything planned must sit directly inside one of the generated folders.
 const homes=[path.join(root,'.test-data'),path.join(root,'tmp'),path.join(root,'releases'),runtimes].map(p=>path.resolve(p));
 for(const item of plan)if(!homes.includes(path.dirname(path.resolve(item.path))))throw new Error('Refusing to clean outside the generated folders: '+item.path);
 return plan;
}

export async function cleanDevSpace({root=process.cwd(),dryRun=false,force=false,quiet=false,now=Date.now(),temp=os.tmpdir()}={}){
 const stamp=path.join(root,'tmp','.last-space-clean');
 if(!force&&!dryRun){const last=await fs.stat(stamp).catch(()=>null);if(last&&now-last.mtimeMs<6*HOUR)return {skipped:true,removed:0,bytes:0};}
 const plan=await planCleanup({root,now,temp});let removed=0,bytes=0;const failed=[];
 for(const item of plan){const size=await sizeOf(item.path);if(dryRun){bytes+=size;removed++;continue;}
  try{await removeTree(item.path);removed++;bytes+=size;}catch(error){failed.push(item.path+': '+error.code);}}
 if(!dryRun){await fs.mkdir(path.dirname(stamp),{recursive:true});await fs.writeFile(stamp,new Date(now).toISOString()+'\n');}
 if(!quiet||removed||failed.length)console.error(`Space cleanup${dryRun?' (dry run)':''}: ${removed} item(s), ${(bytes/1024**3).toFixed(1)} GB${failed.length?`; could not remove ${failed.length}: ${failed.slice(0,3).join('; ')}`:''}.`);
 return {skipped:false,removed,bytes,failed,plan};
}

if(import.meta.url===pathToFileURL(process.argv[1]??'').href){
 const dryRun=process.argv.includes('--dry-run');
 const result=await cleanDevSpace({dryRun,force:true});
 if(dryRun)for(const item of result.plan)console.log(item.why+': '+path.relative(process.cwd(),item.path));
}
