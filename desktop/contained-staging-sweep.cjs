// Removes isolated document-job folders that a killed or crashed PDFix left in TEMP (PDFix-contained-*\job-XXXXXX).
// Normal runs clean their own job folder; this only handles jobs whose PDFix never got the chance.
// TEMP is shared by every running PDFix copy, so a folder is removed only when it is clearly old: every job is stopped by
// the watchdog within about two minutes, and a folder untouched for two hours cannot belong to a live job.
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {NativeDocumentSandbox,DOCUMENT_JOB_FILES,RUNTIME}=require('./native-sandbox.cjs');
const STAGING=/^PDFix-contained-[A-Za-z0-9-]{1,64}$/,JOB=/^job-[A-Za-z0-9]{6}$/,JOB_MARKER='.pdfix-document-job.json';
const MIN_AGE_MS=2*60*60*1000,MAX_ENTRIES=1000;

const plainDirectory=async folder=>{const stat=await fs.lstat(folder);return stat.isDirectory()&&!stat.isSymbolicLink();};

// Returns the newest change time inside a job folder, or null when the folder holds anything a PDFix job never writes.
async function jobAge(folder){
 const names=await fs.readdir(folder);let newest=(await fs.lstat(folder)).mtimeMs;
 if(names.some(name=>name!==RUNTIME&&!DOCUMENT_JOB_FILES.includes(name)))return null;
 for(const name of names){
  const stat=await fs.lstat(path.join(folder,name));if(stat.isSymbolicLink())return null;
  if(name===RUNTIME?!stat.isDirectory():!stat.isFile())return null;newest=Math.max(newest,stat.mtimeMs);
  if(name===RUNTIME){for(const inner of await fs.readdir(path.join(folder,RUNTIME))){const file=await fs.lstat(path.join(folder,RUNTIME,inner));if(file.isSymbolicLink()||!file.isFile())return null;newest=Math.max(newest,file.mtimeMs);}}
 }
 if(names.length){
  // A folder with job files must carry the job marker PDFix writes first; anything else is not ours to remove.
  // The one exception is a folder holding only the copied engine runtime (no document data), left by an interrupted cleanup;
  // the sandbox cleanup still checks every runtime file name before deleting.
  if(names.length===1&&names[0]===RUNTIME)return {newest,empty:false};
  if(!names.includes(JOB_MARKER))return null;
  const marker=path.join(folder,JOB_MARKER),stat=await fs.lstat(marker);if(stat.size>4096)return null;
  const data=JSON.parse(await fs.readFile(marker,'utf8'));
  if(data?.owner!=='PDFix contained document job'||data.version!==1||typeof data.id!=='string'||typeof data.operation!=='string')return null;
 }
 return {newest,empty:!names.length};
}

async function removeJob(folder,sandbox){
 // The sandbox cleanup also deletes the job's Windows AppContainer profile and its copied engine runtime.
 if(!await sandbox.cleanup(folder))return false;
 for(const name of DOCUMENT_JOB_FILES){try{await fs.unlink(path.join(folder,name));}catch(error){if(error.code!=='ENOENT')return false;}}
 await fs.rmdir(folder);return true;
}

async function sweepContainedStaging({tempDirectory=os.tmpdir(),runtimeDirectory,sandbox,minAgeMs=MIN_AGE_MS,now=Date.now()}={}){
 const result={removed:0,kept:0,failed:0,bytes:0};
 if(!sandbox){if(typeof runtimeDirectory!=='string'||!path.isAbsolute(runtimeDirectory))throw new Error('The leftover-job sweep needs the app-owned document runtime directory.');sandbox=new NativeDocumentSandbox(path.resolve(runtimeDirectory));}
 const temp=path.resolve(tempDirectory);if(!await plainDirectory(temp))return result;
 const staging=(await fs.readdir(temp,{withFileTypes:true})).filter(entry=>STAGING.test(entry.name)&&entry.isDirectory()&&!entry.isSymbolicLink()).slice(0,MAX_ENTRIES);
 for(const entry of staging){
  const root=path.join(temp,entry.name);let jobs;
  try{if(!await plainDirectory(root))continue;jobs=(await fs.readdir(root,{withFileTypes:true})).slice(0,MAX_ENTRIES);}catch{result.failed++;continue;}
  for(const job of jobs){
   if(!JOB.test(job.name)||!job.isDirectory()||job.isSymbolicLink()){result.kept++;continue;}
   const folder=path.join(root,job.name);
   try{
    const age=await jobAge(folder);
    if(!age||now-age.newest<minAgeMs){result.kept++;continue;}
    let size=0;if(!age.empty)for(const name of await fs.readdir(folder))if(name!==RUNTIME)size+=(await fs.lstat(path.join(folder,name))).size;
    if(await removeJob(folder,sandbox)){result.removed++;result.bytes+=size;}else result.failed++;
   }catch(error){if(error.code!=='ENOENT')result.failed++;}
  }
  // An emptied staging folder is recreated by the next job that needs it.
  await fs.rmdir(root).catch(()=>{});
 }
 return result;
}

module.exports={sweepContainedStaging,MIN_AGE_MS};
