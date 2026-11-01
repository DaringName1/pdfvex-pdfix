const fs=require('node:fs/promises'),path=require('node:path'),{createHash,randomUUID}=require('node:crypto');
const {NativeDocumentSandbox,SandboxError,sandboxExit,DOCUMENT_JOB_FILES,RUNTIME}=require('./native-sandbox.cjs');
const LIMITS=require('./document-limits.cjs');
const OPERATIONS=Object.freeze(['tiff-inspect','tiff-page','combine-inspect','combine-build','workflow-source-inspect','fdf-export','fdf-import-inspect','fdf-import-build','repair-inspect','repair-verify','form-fill-inspect','form-fill-build','preflight-inspect','accessibility-audit-inspect','geospatial-inspect','geospatial-query','certificate-sign-inspect','certificate-sign-prepare','certificate-sign-finalize','tags-inspect','tags-build','portfolio-inspect','portfolio-build','portfolio-select','certificate-inspect','review-inventory-file','review-inventory','review-edit','takeoff-write','takeoff-recovery','xfdf-export','workbook-read','workbook-write','presentation-read','presentation-write','email-message-read','document-table-grids','security-inspect','sanitize-inspect','sanitize-build','xfdf-import-inspect','xfdf-import-build','redaction-inspect','redaction-verify','page-order-inspect','page-order-build','page-revision-inspect','page-revision-build','page-box-inspect','page-box-build','signature-request-build','print-marks-build','thin-line-inspect','thin-line-build','rich-docx-read','rich-rtf-read','rich-docx-write','rich-rtf-write','link-resolve','attachment-inspect','attachment-select','table-xlsx-write','decoration-build','bookmark-inspect','bookmark-build','batch-pdf-text','form-inspect','form-create','document-output-inspect']);
const MAX_SOURCE=100*1024*1024,MAX_FILE_SOURCE=256*1024*1024,MAX_REQUEST=2*1024*1024,MAX_RESULT=32*1024*1024;
const FILE_SOURCE_OPERATIONS=new Set(['review-inventory-file']);
const MAX_IMPORT_REQUEST=12*1024*1024,IMPORT_OPERATIONS=new Set(['xfdf-import-inspect','xfdf-import-build','fdf-import-inspect','fdf-import-build']);
const MAX_PORTFOLIO_REQUEST=36*1024*1024;
const WORD=new Set(LIMITS.WORD_OPERATIONS);
const resultLimit=operation=>WORD.has(operation)?LIMITS.WORD_RESULT_BYTES:MAX_RESULT;
const requestLimit=operation=>WORD.has(operation)?LIMITS.WORD_REQUEST_BYTES:operation==='form-fill-build'?3*1024*1024:operation==='portfolio-build'?MAX_PORTFOLIO_REQUEST:IMPORT_OPERATIONS.has(operation)?MAX_IMPORT_REQUEST:MAX_REQUEST;
// Shared by every adopted family in this main process. Unsafe jobs keep their lease.
const CONTAINED_JOBS=new Set(),MAX_CONTAINED_JOBS=2;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const canceled=()=>Object.assign(new Error('This was canceled. No copy was saved, and your original is unchanged.'),{code:'CANCELED'});
const fail=message=>{throw new SandboxError(message);};
async function noLinks(directory){let current=path.resolve(directory);while(true){const stat=await fs.lstat(current);if(!stat.isDirectory()||stat.isSymbolicLink())fail('Document sandbox staging contains an unsupported path.');const next=path.dirname(current);if(next===current)return;current=next;}}
async function read(file,max,allowEmpty=false){const stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>max||(!allowEmpty&&!stat.size))fail('The isolated output failed its bounded file checks.');const bytes=await fs.readFile(file);if(bytes.length!==stat.size||bytes.length>max)fail('The isolated output changed while being read.');return bytes;}
function reviveResult(raw,operation){
 let nodes=0,embedded=0;
 const word=WORD.has(operation),pictureLimit=word?LIMITS.IMAGE_SOURCE_BYTES:8*1024*1024,embeddedLimit=word?LIMITS.WORD_EMBEDDED_BYTES:8*1024*1024;
 const maximumNodes=word?3000000:operation==='workbook-read'?1200000:operation==='presentation-read'||IMPORT_OPERATIONS.has(operation)?750000:300000;
 const value=JSON.parse(raw.toString('utf8'));
 function walk(item,depth){if(++nodes>maximumNodes||depth>100)fail('The isolated result exceeds its structural budget.');
  if(!item||typeof item!=='object'){if(typeof item==='number'&&!Number.isFinite(item))fail('The isolated result contains an invalid number.');return item;}
  if(item.wireType==='PDFix.ByteArray.v1'){
   if(Object.keys(item).length!==2||typeof item.base64!=='string'||item.base64.length>Math.ceil(pictureLimit/3)*4||item.base64.length%4||/[^A-Za-z0-9+/=]/.test(item.base64))fail('The isolated preview byte encoding is invalid.');
   const bytes=Buffer.from(item.base64,'base64');embedded+=bytes.length;if(embedded>embeddedLimit||bytes.toString('base64')!==item.base64)fail('The isolated preview exceeds its byte budget.');return Uint8Array.from(bytes);
  }
  if(Array.isArray(item))return item.map(v=>walk(v,depth+1));
  for(const key of Object.keys(item)){if(key==='__proto__'||key==='prototype'||key==='constructor')fail('The isolated result contains a protected object key.');item[key]=walk(item[key],depth+1);}return item;
 }
 return walk(value,0);
}
class DocumentSandboxService{
 constructor({runtimeDirectory,stagingDirectory}={}){
  if(typeof runtimeDirectory!=='string'||typeof stagingDirectory!=='string'||!path.isAbsolute(runtimeDirectory)||!path.isAbsolute(stagingDirectory))throw new Error('Document containment requires explicit app-owned runtime and staging directories.');
  this.runtimeDirectory=path.resolve(runtimeDirectory);this.stagingDirectory=path.resolve(stagingDirectory);this.sandbox=new NativeDocumentSandbox(this.runtimeDirectory);this.active=null;this.closed=false;this.cleanupFailure=false;
 }
 // validateResult is trusted main-process code, never a renderer-supplied function.
 // Existing operation-specific draft/result validators and source/token fences remain mandatory.
 async run(operation,bytes,options,validateResult,{signal}={}){
  return this._run(operation,bytes,null,options,validateResult,{signal});
 }
 // Source descriptors are main-process capabilities supplied by the retained
 // snapshot owner. Neither paths nor staging functions cross renderer IPC.
 async runSourceFile(operation,input,options,validateResult,{signal}={}){
  return this._run(operation,null,input,options,validateResult,{signal});
 }
 async _run(operation,bytes,input,options,validateResult,{signal}={}){
  if(this.closed||this.active)fail(this.closed?'The document containment service is closed.':'Another contained document job is still active.');
  const fileSource=input!==null;
  if(typeof validateResult!=='function'||!options||Object.getPrototypeOf(options)!==Object.prototype)fail('Unsupported contained document request.');
  if(fileSource){
   if(!FILE_SOURCE_OPERATIONS.has(operation)||!input||typeof input.stage!=='function'||typeof input.validate!=='function'||!Number.isSafeInteger(input.length)||input.length<1||input.length>MAX_FILE_SOURCE||typeof input.sha256!=='string'||!/^[a-f0-9]{64}$/.test(input.sha256))fail('Large-PDF comment inspection currently supports a source up to 256 MiB inside its fixed memory budget.');
   if(Object.keys(options).join(',')!=='pages')fail('File-backed comment inspection requires only physical page selection.');
  }else if(!OPERATIONS.includes(operation)||FILE_SOURCE_OPERATIONS.has(operation)||!(bytes instanceof Uint8Array)||bytes.length<1||bytes.length>MAX_SOURCE)fail('Unsupported contained document request.');
  if(operation==='document-table-grids'&&(bytes.length>LIMITS.WORD_IMPORT_BYTES||Object.keys(options).length))fail('DOCX table-grid inspection requires at most 100 MB and no operation/path options.');
  if(signal?.aborted)throw canceled();
  if(CONTAINED_JOBS.size>=MAX_CONTAINED_JOBS)fail('PDFix is still finishing two earlier document tasks. Wait a moment and try again; if this keeps happening, restart PDFix.');
  const lease=Symbol('PDFix contained job');CONTAINED_JOBS.add(lease);let owned,request,sourceSha256;
  try{if(fileSource){sourceSha256=input.sha256;}else{owned=Uint8Array.from(bytes);sourceSha256=hash(owned);}const encoded=JSON.stringify({version:1,operation,sourceLength:fileSource?input.length:owned.length,sourceSha256,options});request=Buffer.from(encoded,'utf8');const limit=requestLimit(operation);if(request.length>limit)fail('The contained document request exceeds the fixed '+(limit/1024/1024)+' MiB budget for this operation.');}catch(error){owned?.fill(0);CONTAINED_JOBS.delete(lease);throw error;}
  const job={id:randomUUID(),folder:null,sourceSha256,operation,input,canceled:false,child:null,observed:false,unsafe:false,promise:null,lease};this.active=job;
  const abort=()=>{job.canceled=true;if(job.stop)job.stop();else if(job.child&&!job.observed)job.child.kill();};signal?.addEventListener('abort',abort,{once:true});
  job.promise=this.execute(job,owned,request,validateResult,signal);
  try{return await job.promise;}finally{signal?.removeEventListener('abort',abort);owned?.fill(0);if(!job.unsafe&&!this.cleanupFailure)CONTAINED_JOBS.delete(lease);if(!job.unsafe&&this.active===job)this.active=null;if(job.unsafe&&!this.cleanupFailure)this.releaseAfterExit(job,lease);}
 }
 async execute(job,bytes,request,validateResult,signal){
  let result;
  try{
   // Do not stage document bytes until both fixed broker and runtime have passed pinned checks.
   await this.sandbox.verify();await this.sandbox.verifyRuntime();if(job.canceled)throw canceled();
   await fs.mkdir(this.stagingDirectory,{recursive:true});await noLinks(this.stagingDirectory);
   job.folder=await fs.mkdtemp(path.join(this.stagingDirectory,'job-'));await noLinks(job.folder);
   await fs.writeFile(path.join(job.folder,'.pdfix-document-job.json'),JSON.stringify({owner:'PDFix contained document job',version:1,id:job.id,sourceSha256:job.sourceSha256,operation:job.operation}),{flag:'wx'});
   if(job.input){
    await job.input.validate();if(job.canceled)throw canceled();
    await job.input.stage(path.join(job.folder,'input.bin'),{signal});
    const staged=await fs.lstat(path.join(job.folder,'input.bin'));
    if(!staged.isFile()||staged.isSymbolicLink()||staged.size!==job.input.length)fail('The file-backed isolated input does not match its source.');
   }else await fs.writeFile(path.join(job.folder,'input.bin'),bytes,{flag:'wx'});
   await fs.writeFile(path.join(job.folder,'request.json'),request,{flag:'wx'});
   for(const name of ['output.bin','result.json','error.json'])await fs.writeFile(path.join(job.folder,name),new Uint8Array(),{flag:'wx'});
   if(job.input)await job.input.validate();if(job.canceled)throw canceled();job.child=await this.sandbox.launch(job);if(job.canceled)job.child.kill();
   const exit=await this.closedChild(job);if(job.stopError)fail(job.stopError);if(job.canceled)throw canceled();
   if(exit!==0){if(process.env.CI)console.error('[document sandbox] '+job.operation+' exited with code '+exit+(job.diagnosticTail?String.fromCharCode(10)+job.diagnosticTail:''));const stopped=sandboxExit(exit);if(stopped)fail(stopped);let message='The isolated document engine could not complete this operation.';try{const error=JSON.parse((await read(path.join(job.folder,'error.json'),4096)).toString('utf8'));if(error.version===1&&typeof error.message==='string'&&error.message.length<=700)message=error.message.replace(/[\x00-\x1f]/g,' ');}catch{}throw new Error(message);}
   // Child has exited before its inert JSON or sealed bytes are consumed.
   await noLinks(job.folder);const output=await read(path.join(job.folder,'output.bin'),MAX_SOURCE,true),envelope=reviveResult(await read(path.join(job.folder,'result.json'),resultLimit(job.operation)),job.operation);
   if(envelope.version!==1||envelope.operation!==job.operation||envelope.sourceSha256!==job.sourceSha256||envelope.outputLength!==output.length||envelope.outputSha256!==hash(output)||!['value','bytes','record'].includes(envelope.kind)||job.input&&(output.length||envelope.kind!=='value'))fail('The isolated output does not match its immutable source request.');
   if(envelope.kind==='value'){if(output.length)fail('An isolated inventory unexpectedly returned a binary copy.');result=envelope.result;}
   else if(envelope.kind==='bytes'){if(envelope.result!==null||!output.length)fail('The isolated byte result has an invalid envelope.');result=Uint8Array.from(output);}
   else {if(!envelope.result||typeof envelope.result!=='object'||Array.isArray(envelope.result)||Object.hasOwn(envelope.result,'bytes')||!output.length)fail('The isolated copy receipt has an invalid envelope.');result={...envelope.result,bytes:Uint8Array.from(output)};}
   if(await validateResult(result,{operation:job.operation,sourceSha256:job.sourceSha256})===false)fail('The isolated result failed the operation-specific native validator.');
   if(job.input)await job.input.validate();
   if(job.canceled)throw canceled();
  }finally{
   // If broker termination is unobserved, keep the slot and files; do not race cleanup/reuse.
   if(job.child&&!job.observed){job.unsafe=true;this.closed=true;}
   if(job.folder&&!job.unsafe){const cleaned=await this.cleanup(job);if(!cleaned){this.closed=true;this.cleanupFailure=true;fail('Document sandbox cleanup failed. The service is closed and no output was released.');}}
  }
  return result;
 }
 // A stopped broker can outlast the 5-second wait on a slow PC. Its slot is kept so nothing races it; when its exit is
 // later observed and its staging folder is cleaned, the process-wide slot is returned so other document jobs
 // (Word files included) are not blocked until PDFix restarts. This service itself stays closed.
 releaseAfterExit(job,lease){Promise.resolve(job.brokerExit).then(async exit=>{if(!exit)return;job.observed=true;if(job.folder&&!await this.cleanup(job))return;CONTAINED_JOBS.delete(lease);if(!this.cleanupFailure)this.recovered=true;}).catch(()=>{});}
 closedChild(job){return new Promise((resolve,reject)=>{
  let done=false,diagnostics=0,stopTimer=null;
  const finish=(error,code)=>{if(done)return;done=true;job.stop=null;clearTimeout(timer);clearTimeout(stopTimer);error?reject(error):resolve(code);};
  const stop=()=>{if(done)return;job.canceled=true;job.child.kill();if(!stopTimer)stopTimer=setTimeout(()=>{job.unsafe=true;this.closed=true;finish(new SandboxError('Broker termination was not observed. Document containment stays closed.'));},5000);};
  const timer=setTimeout(()=>{job.stopError='The isolated document job exceeded its wall-clock limit. No copy was saved.';stop();},WORD.has(job.operation)?(LIMITS.WORD_JOB_SECONDS+10)*1000:125000);
  job.stop=stop;
  for(const stream of [job.child.stdout,job.child.stderr]){stream.on('data',part=>{diagnostics+=part.length;if(process.env.CI)job.diagnosticTail=((job.diagnosticTail||'')+part.toString()).slice(-3000);if(diagnostics>65536){job.stopError='The isolated document job exceeded its diagnostic output limit. No copy was saved.';stop();}});stream.on('error',()=>{job.stopError='An isolated document diagnostic pipe failed. No copy was saved.';stop();});}
  job.brokerExit.then(({code,launchError})=>{job.observed=true;finish(launchError?new SandboxError('The native document broker failed to launch. No unrestricted fallback was used.'):null,code);});
  if(job.canceled)stop();
 });}
 async cleanup(job){
  try{
   const folder=path.resolve(job.folder);if(path.dirname(folder)!==this.stagingDirectory||!/^job-[A-Za-z0-9]{6}$/.test(path.basename(folder)))return false;await noLinks(folder);
   const marker=JSON.parse((await read(path.join(folder,'.pdfix-document-job.json'),4096)).toString('utf8'));if(marker.owner!=='PDFix contained document job'||marker.version!==1||marker.id!==job.id||marker.sourceSha256!==job.sourceSha256||marker.operation!==job.operation)return false;
   const names=await fs.readdir(folder);if(names.some(name=>name!==RUNTIME&&!DOCUMENT_JOB_FILES.includes(name)))return false;
   for(const name of names){if(name===RUNTIME)continue;const stat=await fs.lstat(path.join(folder,name));if(!stat.isFile()||stat.isSymbolicLink())return false;}
   if(!await this.sandbox.cleanup(folder))return false;
   for(const name of DOCUMENT_JOB_FILES){try{await fs.unlink(path.join(folder,name));}catch(error){if(error.code!=='ENOENT')return false;}}
   await fs.rmdir(folder);return true;
  }catch{return false;}
 }
 async cancel(){const job=this.active;if(!job)return false;job.canceled=true;if(job.stop)job.stop();else if(job.child&&!job.observed)job.child.kill();try{await job.promise;}catch{}return !job.unsafe;}
 async dispose(){this.closed=true;if(!await this.cancel()&&this.active?.unsafe)fail('Broker termination is unobserved; this containment service cannot be recreated safely.');if(this.cleanupFailure)fail('Document containment cleanup failed; this service cannot be recreated safely.');}
 async status(){return {...await this.sandbox.status(),active:Boolean(this.active),closed:this.closed,cleanupFailure:this.cleanupFailure,operations:[...OPERATIONS],processWideJobs:CONTAINED_JOBS.size,processWideJobLimit:MAX_CONTAINED_JOBS,fileSourceMiB:256,fileSourceOperations:[...FILE_SOURCE_OPERATIONS],resultMiB:32,requestMiB:2,xfdfImportRequestMiB:12,portfolioBuildRequestMiB:36,formFillBuildRequestMiB:3};}
}
// The process-wide job set is exported for tests only.
module.exports={DocumentSandboxService,OPERATIONS,containedJobsForTests:CONTAINED_JOBS};
