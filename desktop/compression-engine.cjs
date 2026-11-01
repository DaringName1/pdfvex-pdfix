const fs=require('node:fs/promises'),path=require('node:path');
const {Worker}=require('node:worker_threads'),{createHash}=require('node:crypto');
const {NativeSandbox,sandboxExit,RUNTIME,MARKER}=require('./native-sandbox.cjs');
const MAX=100*1024*1024;
class CompressionError extends Error{constructor(code,message){super(message);this.code=code;}}
function settings(value){if(!value||!['lossless','jpeg'].includes(value.mode)||value.mode==='jpeg'&&(!Number.isInteger(value.quality)||value.quality<40||value.quality>95)||Object.keys(value).some(k=>!['mode','quality'].includes(k)))throw new CompressionError('SETTINGS','Choose lossless compression or JPEG quality from 40 to 95.');return {mode:value.mode,quality:value.mode==='jpeg'?value.quality:undefined};}
class CompressionEngine{
 constructor(directory,engineDirectory){this.directory=directory;this.engineDirectory=engineDirectory;this.sandbox=new NativeSandbox(engineDirectory);}
 async cleanupFolder(folder){
  let failed=!await this.sandbox.cleanup(folder);for(const name of ['input.pdf','output.pdf'])await fs.unlink(path.join(folder,name)).catch(error=>{if(error.code!=='ENOENT')failed=true;});
  if(!failed)await fs.unlink(path.join(folder,'.pdfix-job.json')).catch(error=>{if(error.code!=='ENOENT')failed=true;});
  if(!failed)await fs.rmdir(folder).catch(()=>{failed=true;});return !failed;
 }
 async init(){
  let entries;try{entries=await fs.readdir(this.directory,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return;throw new CompressionError('CLEANUP','Interrupted compression files could not be checked. Check application-folder access.');}
  if(entries.length>1000)throw new CompressionError('CLEANUP','Too many interrupted compression folders need review.');
  let failed=false;for(const entry of entries){if(!/^job-[a-zA-Z0-9]{6}$/.test(entry.name)||!entry.isDirectory()||entry.isSymbolicLink())continue;const folder=path.join(this.directory,entry.name),marker=path.join(folder,'.pdfix-job.json');try{
   const names=await fs.readdir(folder);if(!names.length){await fs.rmdir(folder);continue;}if(names.some(name=>!['input.pdf','output.pdf','.pdfix-job.json',RUNTIME,MARKER].includes(name)))continue;
   const stat=await fs.lstat(marker);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>512)continue;const data=JSON.parse(await fs.readFile(marker,'utf8'));if(data.owner!=='PDFix compression'||data.version!==1||typeof data.token!=='string'||!/^[0-9a-f-]{36}$/i.test(data.token))continue;
   if(!await this.cleanupFolder(folder))failed=true;
  }catch(error){if(error.code!=='ENOENT')failed=true;}}
  if(failed)throw new CompressionError('CLEANUP','Some interrupted compression temporary files could not be removed. Check application-folder access.');
 }
 async checkEngine(){
  await this.sandbox.verify();
  const manifest=JSON.parse(await fs.readFile(path.join(this.engineDirectory,'manifest.json'),'utf8'));
  if(manifest.version!=='12.4.2'||!Array.isArray(manifest.files)||!manifest.files.length)throw new Error('Invalid compression engine manifest.');
  for(const file of manifest.files){if(!/^[a-z0-9_.-]+\.(exe|dll)$/i.test(file.name))throw new Error('Invalid engine file.');const bytes=await fs.readFile(path.join(this.engineDirectory,'bin',file.name));if(createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw new Error('The compression engine checksum changed.');}
 }
 check(job){if(job.canceled)throw new CompressionError('CANCELED','Compression canceled. No copy was saved.');}
 cancel(token){if(this.active?.token!==token)return false;this.active.canceled=true;this.active.child?.kill();this.active.worker?.terminate();return true;}
 analyze(job,data){return new Promise((resolve,reject)=>{
  this.check(job);const worker=new Worker(path.join(__dirname,'compression-worker.cjs'),{workerData:data,resourceLimits:{maxOldGenerationSizeMb:192,maxYoungGenerationSizeMb:32,stackSizeMb:4}});job.worker=worker;let settled=false;
  const done=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);job.worker=null;worker.terminate();error?reject(error):resolve(value);};
  const timer=setTimeout(()=>done(new CompressionError('TIMEOUT','PDF verification took too long. Try a smaller document.')),120000);
  worker.once('message',reply=>done(reply.ok?null:new CompressionError('VERIFY',reply.message),reply.result));worker.once('error',()=>done(new CompressionError('VERIFY','This PDF exceeds the verification resources or could not be read.')));worker.once('exit',()=>done(new CompressionError(job.canceled?'CANCELED':'VERIFY',job.canceled?'Compression canceled. No copy was saved.':'PDF verification stopped unexpectedly.')));
 });}
 async run(job,input,output,options){
  this.check(job);const args=['--compress-streams=y','--decode-level=generalized','--recompress-flate','--compression-level=9','--object-streams=generate','--remove-unreferenced-resources=no'];
  if(options.mode==='jpeg')args.push('--optimize-images',`--jpeg-quality=${options.quality}`,'--keep-inline-images');args.push(input,output);
  const child=await this.sandbox.launch(job,args);job.child=child;
  return new Promise((resolve,reject)=>{
   let count=0,reason,done=false;
   const stop=error=>{reason=error;child.kill();};const onData=chunk=>{count+=chunk.length;if(count>65536)stop(new CompressionError('LIMIT','The compression engine returned too many diagnostics.'));};child.stdout.on('data',onData);child.stderr.on('data',onData);
   const timer=setTimeout(()=>stop(new CompressionError('TIMEOUT','Compression took too long. Try a smaller document.')),120000);
   const monitor=setInterval(()=>{fs.stat(output).then(stat=>{if(stat.size>MAX)stop(new CompressionError('LIMIT','The compressed output exceeds 100 MB.'));}).catch(()=>{});},100);
   const finish=error=>{if(done)return;done=true;clearTimeout(timer);clearInterval(monitor);job.child=null;error?reject(error):resolve();};
   child.once('error',()=>finish(new CompressionError('SANDBOX','The local Windows Security Sandbox could not start. Rebuild or repair PDFix.')));
   child.once('close',code=>finish(job.canceled?new CompressionError('CANCELED','Compression canceled. No copy was saved.'):reason||(code===0?null:new CompressionError(sandboxExit(code)?'SANDBOX':'ENGINE',sandboxExit(code)||(code===3?'The PDF needs repair or produced compression warnings. No copy was saved.':'This PDF could not be compressed. Obtain a fresh unrestricted copy.')))));
   if(job.canceled)child.kill();
  });
 }
 async compress(token,source,value){
  if(typeof token!=='string'||!/^[0-9a-f-]{36}$/i.test(token))throw new CompressionError('TOKEN','Invalid compression operation.');
  if(this.active)throw new CompressionError('BUSY','Another compression operation is still finishing.');
  const options=settings(value);if(!(source instanceof Uint8Array)||!source.length||source.length>MAX)throw new CompressionError('INPUT','Compression needs a PDF under 100 MB.');
  const bytes=Buffer.from(source),job={token,canceled:false};this.active=job;let output;
  try{
   try{await this.checkEngine();}catch(error){if(error.code==='SANDBOX')throw new CompressionError('SANDBOX',error.message);throw new CompressionError('ENGINE',error.message==='The compression engine checksum changed.'?error.message:'The bundled compression engine is unavailable. Rebuild or repair PDFix.');}this.check(job);
   await this.analyze(job,{source:bytes,lossy:options.mode==='jpeg'});this.check(job);
   await fs.mkdir(this.directory,{recursive:true});job.folder=await fs.mkdtemp(path.join(this.directory,'job-'));await fs.writeFile(path.join(job.folder,'.pdfix-job.json'),JSON.stringify({owner:'PDFix compression',version:1,token}),{flag:'wx'});this.check(job);
   const input=path.join(job.folder,'input.pdf'),destination=path.join(job.folder,'output.pdf');await fs.writeFile(input,bytes,{flag:'wx'});this.check(job);
   await this.run(job,input,destination,options);this.check(job);
   const handle=await fs.open(destination,'r');try{const stat=await handle.stat();if(!stat.isFile()||!stat.size||stat.size>MAX)throw new CompressionError('LIMIT','The compressed output exceeds the allowed size.');const data=Buffer.alloc(stat.size+1);let length=0;while(length<data.length){const part=await handle.read(data,length,data.length-length,length);if(!part.bytesRead)break;length+=part.bytesRead;}if(length!==stat.size)throw new CompressionError('CHANGED','The compressed output changed during verification.');output=data.subarray(0,length);}finally{await handle.close();}
   const verified=await this.analyze(job,{source:bytes,output,lossy:options.mode==='jpeg'});this.check(job);
   return {...verified,bytes:Uint8Array.from(output),originalSize:bytes.length,size:output.length,mode:options.mode,quality:options.quality};
  }finally{
   const cleanupFailed=job.folder&&!await this.cleanupFolder(job.folder);
   this.active=null;if(cleanupFailed)throw new CompressionError('CLEANUP','Compression temporary files could not be removed. Check application-folder access before retrying.');
  }
 }
}
module.exports={CompressionEngine,CompressionError,settings};
