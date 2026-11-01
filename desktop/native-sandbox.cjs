const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process'),{createHash,randomUUID}=require('node:crypto');
const LIMITS=require('./document-limits.cjs');
const RUNTIME_FILES=Object.freeze(['concrt140.dll','msvcp140_1.dll','msvcp140_2.dll','msvcp140_atomic_wait.dll','msvcp140_codecvt_ids.dll','msvcp140.dll','qpdf.exe','qpdf30.dll','vcruntime140_1.dll','vcruntime140.dll']);
const RUNTIME='_sandbox-runtime',MARKER='.pdfix-sandbox.json',PROFILE=/^PDFix\.Job\.[a-f0-9]{32}$/;
const SESSION_FILE='PDFix.PagedSession.exe',SESSION_RUNTIME_FILES=Object.freeze([...RUNTIME_FILES,SESSION_FILE]);
class SandboxError extends Error{constructor(message){super(message);this.code='SANDBOX';}}
// Every refusal shows the person the same plain message; the private problem log also records which check refused
// (its line here), so an occasional refusal can be diagnosed without exposing paths or file names.
// PDFIX_SANDBOX_TRACE=1 also prints the refusing check to the console, to catch the rare local refusal (SHARED-PLAN 1.8).
const trace=detail=>{if(process.env.PDFIX_SANDBOX_TRACE==='1')try{process.stderr.write('PDFix sandbox trace: '+detail+'\n');}catch{}};
let reportRefusal=trace;
function setSandboxReporter(report){reportRefusal=typeof report==='function'?detail=>{trace(detail);report(detail);}:trace;}
const failure=detail=>{const error=new SandboxError('The Windows Security Sandbox could not start. No unrestricted PDF engine was run. Rebuild or repair PDFix.');try{const line=/native-sandbox\.cjs:(\d+)/.exec(String(error.stack).split('\n').slice(2).join('\n'))?.[1];reportRefusal('sandbox refused at native-sandbox.cjs:'+(line??'?')+(detail?' ('+detail+')':''));}catch{}return error;};
async function plainFile(file,max){const stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>max||!stat.size)throw failure();return fs.readFile(file);}
// SHARED-PLAN 1.8: a rare local refusal where a file's details moved while it was read. The problem log now names
// which detail moved (field names only). When the bytes still match and only the change time moved (Windows can
// update it for metadata such as security or sync attributes), one complete second read must be fully stable.
const PINNED_KEYS=['size','dev','ino','mtimeMs','ctimeMs'];
const movedKeys=(a,b)=>PINNED_KEYS.filter(key=>a[key]!==b[key]);
async function verifyPinnedFile(file,max,expected,checkActive=()=>{}){
 try{await pinnedPass(file,max,expected,checkActive,true);}
 catch(error){if(!error.pinnedRetry)throw error;reportRefusal('sandbox recheck: change time moved during reading; reading again');await new Promise(done=>setTimeout(done,50));await pinnedPass(file,max,expected,checkActive,false);}
}
async function pinnedPass(file,max,expected,checkActive,mayRetry){
 checkActive();
 const before=await fs.lstat(file);
 if(!before.isFile()||before.isSymbolicLink()||before.size<1||before.size>max)throw failure();
 const handle=await fs.open(file,'r'),buffer=Buffer.alloc(128*1024),hash=createHash('sha256');
 const moved=(keys,matches)=>{if(!keys.length)return;if(mayRetry&&matches&&keys.every(key=>key==='ctimeMs'))throw Object.assign(new Error('retry'),{pinnedRetry:true});throw failure('moved: '+keys.join(',')+(matches?'':', bytes differ'));};
 try{
  moved(movedKeys(before,await handle.stat()),true);
  let position=0;
  while(position<before.size){checkActive();const {bytesRead}=await handle.read(buffer,0,Math.min(buffer.length,before.size-position),position);if(!bytesRead)throw failure();hash.update(buffer.subarray(0,bytesRead));position+=bytesRead;}
  const after=await fs.lstat(file);if(after.isSymbolicLink())throw failure('became a link');
  const matches=hash.digest('hex')===expected;
  moved([...new Set([...movedKeys(before,after),...movedKeys(before,await handle.stat())])],matches);
  if(!matches)throw failure('bytes differ');checkActive();
 }finally{buffer.fill(0);await handle.close();}
}
async function noLinks(folder){let current=path.resolve(folder);while(true){const stat=await fs.lstat(current);if(!stat.isDirectory()||stat.isSymbolicLink())throw failure();const next=path.dirname(current);if(next===current)return;current=next;}}
function environment(folder){
 const systemRoot=process.env.SystemRoot||'C:\\Windows',userProfile=process.env.USERPROFILE||os.homedir();
 // Windows AppContainer startup resolves OS profile locations in the broker's
 // environment. Keep this explicit allowlist; never inherit secrets or PATH.
 return {SystemRoot:systemRoot,WINDIR:systemRoot,SystemDrive:path.parse(systemRoot).root.replace(/[\\/]$/,''),USERPROFILE:userProfile,LOCALAPPDATA:process.env.LOCALAPPDATA||path.join(userProfile,'AppData','Local'),APPDATA:process.env.APPDATA||path.join(userProfile,'AppData','Roaming'),ProgramData:process.env.ProgramData||path.join(path.parse(systemRoot).root,'ProgramData'),TEMP:folder,TMP:folder,OPENSSL_CONF:'NUL'};
}
class NativeSandbox{
 constructor(engineDirectory){this.engineDirectory=engineDirectory;this.directory=path.join(path.dirname(engineDirectory),'sandbox');this.latest=null;}
 async verify(){
  try{
   if(process.platform!=='win32'||process.arch!=='x64')throw failure();await noLinks(this.directory);
   const manifest=JSON.parse((await plainFile(path.join(this.directory,'manifest.json'),4096)).toString('utf8'));
   if(manifest.version!==1||manifest.policy!=='appcontainer-job-v1'||manifest.platform!=='win32-x64'||manifest.file!=='PDFix.Sandbox.exe'||!/^[a-f0-9]{64}$/.test(manifest.sha256))throw failure();
   const exe=path.join(this.directory,manifest.file),bytes=await plainFile(exe,4*1024*1024);
   if(createHash('sha256').update(bytes).digest('hex')!==manifest.sha256)throw failure();return exe;
  }catch{throw failure();}
 }
 async prepare(job,checkActive=()=>{},session=false){
  checkActive();
  if(!job.folder||!/^job-[a-zA-Z0-9]{6}$/.test(path.basename(job.folder)))throw failure();await noLinks(job.folder);
  const runtime=path.join(job.folder,RUNTIME);
  if(!job.sandbox){
   const profile='PDFix.Job.'+randomUUID().replaceAll('-','');
   await fs.writeFile(path.join(job.folder,MARKER),JSON.stringify({owner:'PDFix native sandbox',version:1,profile}),{flag:'wx'});
   job.sandbox={profile};await fs.mkdir(runtime);
  }
  await noLinks(runtime);
  const names=await fs.readdir(runtime);if(names.some(name=>!(session?SESSION_RUNTIME_FILES:RUNTIME_FILES).includes(name)))throw failure();
  await noLinks(this.engineDirectory);await noLinks(path.join(this.engineDirectory,'bin'));
  const manifest=JSON.parse((await plainFile(path.join(this.engineDirectory,'manifest.json'),8192)).toString('utf8'));
  if(manifest.version!=='12.4.2'||manifest.platform!=='win32-x64'||!Array.isArray(manifest.files)||manifest.files.length!==RUNTIME_FILES.length||new Set(manifest.files.map(f=>f.name)).size!==RUNTIME_FILES.length)throw failure();
  // Recheck staged DLLs before every invocation, including successive password-verification jobs.
  for(const name of RUNTIME_FILES){
   checkActive();
   const entry=manifest.files.find(file=>file.name===name);if(!entry||!/^[a-f0-9]{64}$/.test(entry.sha256))throw failure();
   const source=path.join(this.engineDirectory,'bin',name);
   await verifyPinnedFile(source,64*1024*1024,entry.sha256,checkActive);
   const destination=path.join(runtime,name);
   try{await verifyPinnedFile(destination,64*1024*1024,entry.sha256,checkActive);}
   catch(error){if(error.code!=='ENOENT')throw error;checkActive();await fs.copyFile(source,destination,require('node:fs').constants.COPYFILE_EXCL);await verifyPinnedFile(destination,64*1024*1024,entry.sha256,checkActive);}
  }
 }
 async launch(job,args){
  try{
   const exe=await this.verify();await this.prepare(job);
   if(job.canceled)throw Object.assign(new Error('Operation canceled. No copy was saved.'),{code:'CANCELED'});
   if(!Array.isArray(args)||args.some(arg=>typeof arg!=='string'||/[\r\n\0]/.test(arg))||Buffer.byteLength(args.join('\n')+'\n')>16384)throw failure();
   const child=spawn(exe,[job.folder,job.sandbox.profile,String(process.pid)],{cwd:job.folder,windowsHide:true,shell:false,env:environment(job.folder),stdio:['pipe','pipe','pipe']});
   job.brokerExit=new Promise(resolve=>{let launchError=false;child.once('error',()=>{launchError=true;});child.once('close',code=>resolve({code,launchError}));});
   child.stdin.on('error',()=>{});child.stdin.end(args.join('\n')+'\n','utf8');
   child.once('error',()=>{this.latest='blocked';});
   child.once('close',code=>{this.latest=code===0?'completed':code===125||code===126?'blocked':'stopped';});return child;
  }catch(error){this.latest='blocked';if(error.code==='CANCELED')throw error;throw failure();}
 }
 async launchPaged(job,args,checkActive=()=>{}){
  try{
   checkActive();const exe=await this.verify();checkActive();await this.prepare(job,checkActive);checkActive();
   if(job.canceled)throw Object.assign(new Error('Operation canceled. No copy was saved.'),{code:'CANCELED'});
   if(!Array.isArray(args)||args.some(arg=>typeof arg!=='string'||/[\r\n\0]/.test(arg))||Buffer.byteLength(args.join('\n')+'\n')>16384)throw failure();
   const child=spawn(exe,['--paged',job.folder,job.sandbox.profile,String(process.pid)],{cwd:job.folder,windowsHide:true,shell:false,env:environment(job.folder),stdio:['pipe','pipe','pipe']});
   job.brokerExit=new Promise(resolve=>{let launchError=false;child.once('error',()=>{launchError=true;});child.once('close',code=>resolve({code,launchError}));});
   child.stdin.on('error',()=>{});child.stdin.end(args.join('\n')+'\n','utf8');
   child.once('error',()=>{this.latest='blocked';});
   child.once('close',code=>{this.latest=code===0?'completed':code===125||code===126?'blocked':'stopped';});return child;
  }catch(error){this.latest='blocked';if(error.code==='CANCELED')throw error;throw failure();}
 }
 async launchPagedSession(job,checkActive=()=>{}){
  job.observed=true;
  try{
   checkActive();const exe=await this.verify();checkActive();await this.prepare(job,checkActive,true);checkActive();
   const directory=path.join(path.dirname(this.engineDirectory),'paged-session');await noLinks(directory);
   const manifest=JSON.parse((await plainFile(path.join(directory,'manifest.json'),4096)).toString('utf8'));
   if(manifest.version!==1||manifest.policy!=='appcontainer-paged-session-v1'||manifest.platform!=='win32-x64'||manifest.file!==SESSION_FILE||!/^[a-f0-9]{64}$/.test(manifest.sha256))throw failure();
   const source=path.join(directory,SESSION_FILE),destination=path.join(job.folder,RUNTIME,SESSION_FILE);
   await verifyPinnedFile(source,4*1024*1024,manifest.sha256,checkActive);
   try{await verifyPinnedFile(destination,4*1024*1024,manifest.sha256,checkActive);}catch(error){if(error.code!=='ENOENT')throw error;checkActive();await fs.copyFile(source,destination,require('node:fs').constants.COPYFILE_EXCL);await verifyPinnedFile(destination,4*1024*1024,manifest.sha256,checkActive);}
   checkActive();
   const child=spawn(exe,['--paged-session',job.folder,job.sandbox.profile,String(process.pid)],{cwd:job.folder,windowsHide:true,shell:false,env:environment(job.folder),stdio:['pipe','pipe','pipe']});
   job.observed=false;job.brokerExit=new Promise(resolve=>{let launchError=false;child.once('error',()=>{launchError=true;});child.once('close',code=>resolve({code,launchError}));});
   child.stdin.on('error',()=>{});child.once('error',()=>{this.latest='blocked';});child.once('close',code=>{this.latest=code===0?'completed':[125,126].includes(code)?'blocked':'stopped';});return child;
  }catch(error){this.latest='blocked';if(error.code==='CANCELED')throw error;throw error instanceof SandboxError?error:failure();}
 }
 async cleanup(folder){
  try{
   await noLinks(folder);
   const marker=path.join(folder,MARKER);let profile;
   try{const data=JSON.parse((await plainFile(marker,512)).toString('utf8'));if(data.owner!=='PDFix native sandbox'||data.version!==1||!PROFILE.test(data.profile))return false;profile=data.profile;}
   catch(error){if(error.code!=='ENOENT')return false;}
   if(profile){
    const exe=await this.verify();await new Promise((resolve,reject)=>{
     const child=spawn(exe,['--cleanup',profile],{windowsHide:true,shell:false,env:environment(folder),stdio:'ignore'});let settled=false;
     const done=error=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve();};
     const timer=setTimeout(()=>{child.kill();done(failure());},10000);
     child.once('error',()=>done(failure()));child.once('close',code=>done(code===0?null:failure()));
    });
   }
   const runtime=path.join(folder,RUNTIME);
   try{
    const stat=await fs.lstat(runtime);if(!stat.isDirectory()||stat.isSymbolicLink())return false;
    const names=await fs.readdir(runtime);if(names.some(name=>!SESSION_RUNTIME_FILES.includes(name)))return false;
    for(const name of names){const file=path.join(runtime,name),entry=await fs.lstat(file);if(!entry.isFile()||entry.isSymbolicLink())return false;}
    for(const name of names)await fs.unlink(path.join(runtime,name));await fs.rmdir(runtime);
   }catch(error){if(error.code!=='ENOENT')return false;}
   if(profile)await fs.unlink(marker);return true;
  }catch{return false;}
 }
 async status(){let ready=false;try{await this.verify();ready=true;}catch{}return {packaged:ready,policy:'Windows AppContainer + Job Object',network:'No network capabilities requested',memoryMiB:512,processLimit:1,seconds:115,latest:this.latest,tokenChecks:'Exact per-job AppContainer SID and zero capability SIDs required before execution',temporaryFiles:'Known staging files only; 100 MiB per PDF; watchdog, not disk quota',parentDeath:'Monitored concurrently with stdin forwarding',verification:'Runtime isolation and security review pending'};}
}
function sandboxExit(code){return code===125||code===126?'The Windows Security Sandbox stopped this job. No unrestricted fallback was used. Rebuild or repair PDFix.':code===124?'The isolated PDF job reached a resource limit or was interrupted. No copy was saved.':null;}
const DOCUMENT_RUNTIME_FILES=Object.freeze(['node.exe','engine.cjs','engine-manifest.json','openssl.cnf']);
const DOCUMENT_JOB_FILES=Object.freeze(['input.bin','request.json','output.bin','result.json','error.json','.pdfix-document-job.json',MARKER]);
// Settings can ask all families about the same package at once. This cache is
// status-only; verify()/verifyRuntime()/prepare()/launch() never consult it.
const DOCUMENT_STATUS_CACHE=new Map(),DOCUMENT_STATUS_TTL_MS=2500;
async function documentStatusSnapshot(sandbox){
 const files=[['broker-manifest',path.join(sandbox.directory,'manifest.json')],['broker',path.join(sandbox.directory,'PDFix.Sandbox.exe')],['engine-manifest',path.join(sandbox.engineDirectory,'engine-manifest.json')],['node-runtime',path.join(sandbox.engineDirectory,'node.exe')],['engine-code',path.join(sandbox.engineDirectory,'engine.cjs')]];
 return Promise.all(files.map(async([name,file])=>{try{const stat=await fs.lstat(file);return {name,exists:true,plain:stat.isFile()&&!stat.isSymbolicLink(),bytes:stat.size,mtimeMs:stat.mtimeMs,ctimeMs:stat.ctimeMs,dev:stat.dev,ino:stat.ino};}catch{return {name,exists:false};}}));
}
async function documentPackageStatus(sandbox){
 const key=path.resolve(sandbox.directory).toLowerCase()+'|'+path.resolve(sandbox.engineDirectory).toLowerCase(),previous=DOCUMENT_STATUS_CACHE.get(key);
 if(previous?.pending)return previous.promise;
 if(previous&&Date.now()<previous.expires){
  const current=await documentStatusSnapshot(sandbox);
  if(DOCUMENT_STATUS_CACHE.get(key)===previous&&JSON.stringify(current)===JSON.stringify(previous.snapshot))return structuredClone(previous.value);
 }
 // Another family may have begun the refresh while our cheap stat check awaited.
 const existing=DOCUMENT_STATUS_CACHE.get(key);if(existing?.pending)return existing.promise;
 const entry={pending:true,promise:null,snapshot:null,value:null,expires:0};DOCUMENT_STATUS_CACHE.set(key,entry);
 entry.promise=(async()=>{
  const before=await documentStatusSnapshot(sandbox);let packaged=false;
  try{await sandbox.verify();await sandbox.verifyRuntime();packaged=true;}catch{}
  const after=await documentStatusSnapshot(sandbox);if(JSON.stringify(before)!==JSON.stringify(after))packaged=false;
  const value={packaged,packageStatusCheckedAt:new Date().toISOString(),packageStatusCacheMs:DOCUMENT_STATUS_TTL_MS,packageStatusSnapshot:after};
  entry.pending=false;entry.snapshot=after;entry.value=value;entry.expires=Date.now()+DOCUMENT_STATUS_TTL_MS;
  // Keep cache size bounded if trusted configuration uses multiple installation paths.
  if(DOCUMENT_STATUS_CACHE.size>8)for(const [oldKey,oldEntry]of DOCUMENT_STATUS_CACHE){if(oldKey!==key&&!oldEntry.pending){DOCUMENT_STATUS_CACHE.delete(oldKey);if(DOCUMENT_STATUS_CACHE.size<=8)break;}}
  return structuredClone(value);
 })();return entry.promise;
}
class NativeDocumentSandbox extends NativeSandbox{
 constructor(engineDirectory){super(engineDirectory);}
 async verifyRuntime(){
  try{
   await noLinks(this.engineDirectory);const manifestBytes=await plainFile(path.join(this.engineDirectory,'engine-manifest.json'),8192),manifest=JSON.parse(manifestBytes.toString('utf8'));
   if(manifest.version!==1||manifest.policy!=='appcontainer-document-v1'||manifest.platform!=='win32-x64'||!Array.isArray(manifest.files)||manifest.files.length!==2||new Set(manifest.files.map(f=>f.name)).size!==2)throw failure();
   for(const name of ['node.exe','engine.cjs']){
    const entry=manifest.files.find(file=>file.name===name),maximum=(name==='node.exe'?128:32)*1024*1024;
    if(!entry||!/^[a-f0-9]{64}$/.test(entry.sha256)||!Number.isSafeInteger(entry.bytes)||entry.bytes<1||entry.bytes>maximum)throw failure();
    const bytes=await plainFile(path.join(this.engineDirectory,name),maximum);if(bytes.length!==entry.bytes||createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw failure();
   }
   return {manifest,manifestBytes};
  }catch{throw new SandboxError('The packaged document engine is missing or failed its pinned hash checks. No unrestricted document engine was run.');}
 }
 async prepare(job){
  if(!job.folder||!/^job-[a-zA-Z0-9]{6}$/.test(path.basename(job.folder))||job.sandbox)throw failure();await noLinks(job.folder);
  const {manifest,manifestBytes}=await this.verifyRuntime(),profile='PDFix.Job.'+randomUUID().replaceAll('-','');
  await fs.writeFile(path.join(job.folder,MARKER),JSON.stringify({owner:'PDFix native sandbox',version:1,profile}),{flag:'wx'});job.sandbox={profile};
  const runtime=path.join(job.folder,RUNTIME);await fs.mkdir(runtime);
  for(const name of ['node.exe','engine.cjs']){
   const entry=manifest.files.find(file=>file.name===name),bytes=await plainFile(path.join(this.engineDirectory,name),(name==='node.exe'?128:32)*1024*1024);
   if(bytes.length!==entry.bytes||createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw failure();
   await fs.writeFile(path.join(runtime,name),bytes,{flag:'wx'});
  }
  await fs.writeFile(path.join(runtime,'engine-manifest.json'),manifestBytes,{flag:'wx'});
  // Empty OpenSSL configuration for the engine (see SandboxLauncher ChildEnvironment).
  await fs.writeFile(path.join(runtime,'openssl.cnf'),new Uint8Array(),{flag:'wx'});
  const names=await fs.readdir(job.folder);if(names.length!==DOCUMENT_JOB_FILES.length+1||names.some(name=>name!==RUNTIME&&!DOCUMENT_JOB_FILES.includes(name)))throw failure();
  for(const name of DOCUMENT_JOB_FILES){const stat=await fs.lstat(path.join(job.folder,name));if(!stat.isFile()||stat.isSymbolicLink())throw failure();}
 }
 async launch(job){
  try{
   const exe=await this.verify();await this.prepare(job);
   if(job.canceled)throw Object.assign(new Error('Operation canceled. No copy was saved.'),{code:'CANCELED'});
   const child=spawn(exe,[LIMITS.WORD_OPERATIONS.includes(job.operation)?'--document-word':'--document',job.folder,job.sandbox.profile,String(process.pid)],{cwd:job.folder,windowsHide:true,shell:false,env:environment(job.folder),stdio:['pipe','pipe','pipe']});
   // Subscribe before returning through an async boundary: even immediate spawn failure/close must be observed.
   job.brokerExit=new Promise(resolve=>{let launchError=false;child.once('error',()=>{launchError=true;});child.once('close',code=>resolve({code,launchError}));});
   child.stdin.on('error',()=>{});child.stdin.end('PDFix.Document.Engine.v1\n','utf8');
   child.once('error',()=>{this.latest='blocked';});child.once('close',code=>{this.latest=code===0?'completed':code===125||code===126?'blocked':'stopped';});return child;
  }catch(error){this.latest='blocked';if(error.code==='CANCELED')throw error;throw error instanceof SandboxError?error:failure();}
 }
 async cleanup(folder){
  try{
   await noLinks(folder);const marker=path.join(folder,MARKER);let profile;
   try{const data=JSON.parse((await plainFile(marker,512)).toString('utf8'));if(data.owner!=='PDFix native sandbox'||data.version!==1||!PROFILE.test(data.profile))return false;profile=data.profile;}catch(error){if(error.code!=='ENOENT')return false;}
   if(profile){const exe=await this.verify();await new Promise((resolve,reject)=>{const child=spawn(exe,['--cleanup',profile],{windowsHide:true,shell:false,env:environment(folder),stdio:'ignore'});let done=false;const timer=setTimeout(()=>{child.kill();finish(failure());},10000);function finish(error){if(done)return;done=true;clearTimeout(timer);error?reject(error):resolve();}child.once('error',()=>finish(failure()));child.once('close',code=>finish(code===0?null:failure()));});}
   const runtime=path.join(folder,RUNTIME);try{await noLinks(runtime);const names=await fs.readdir(runtime);if(names.some(name=>!DOCUMENT_RUNTIME_FILES.includes(name)))return false;for(const name of names){const stat=await fs.lstat(path.join(runtime,name));if(!stat.isFile()||stat.isSymbolicLink())return false;}for(const name of names)await fs.unlink(path.join(runtime,name));await fs.rmdir(runtime);}catch(error){if(error.code!=='ENOENT')return false;}
   if(profile)await fs.unlink(marker);return true;
  }catch{return false;}
 }
 async status(){return {...await documentPackageStatus(this),policy:'Windows AppContainer + Job Object; fixed document engine',network:'Zero capability SIDs required',input:'Read-only input, request and runtime; only precreated output files writable',memoryMiB:512,nodeHeapMiB:256,processLimit:1,seconds:115,latest:this.latest,fallback:false,verification:'Runtime isolation, packaged-engine adoption and security review pending'};}
}
module.exports={verifyPinnedFile,setSandboxReporter,NativeSandbox,NativeDocumentSandbox,SandboxError,sandboxExit,RUNTIME,MARKER,RUNTIME_FILES,DOCUMENT_RUNTIME_FILES,DOCUMENT_JOB_FILES};
