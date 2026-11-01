'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {NativeSandbox,sandboxExit,RUNTIME,MARKER}=require('./native-sandbox.cjs');
const {DocumentSandboxService}=require('./document-sandbox-service.cjs');
const V=require('./pdf-repair-validation.cjs');
const FILES=['input.pdf','output.pdf','.pdfix-job.json'],NAMES=[...FILES,RUNTIME,MARKER];
const failure=(code,message)=>Object.assign(new Error(message),{code});
async function noLinks(folder){let current=path.resolve(folder);while(true){const stat=await fs.lstat(current);if(!stat.isDirectory()||stat.isSymbolicLink())throw failure('PATH','Repair staging has an unsupported path.');const next=path.dirname(current);if(next===current)return;current=next;}}
class PdfRepairService{
 constructor({engineDirectory=path.resolve(__dirname,'../dist/native/qpdf'),runtimeDirectory=path.resolve(__dirname,'../dist/native/document-engine'),stagingDirectory=path.join(os.tmpdir(),'PDFix-repair')}={}){
  if(![engineDirectory,runtimeDirectory,stagingDirectory].every(v=>typeof v==='string'&&path.isAbsolute(v)))throw new Error('Repair requires app-owned absolute directories.');
  this.options={engineDirectory:path.resolve(engineDirectory),runtimeDirectory:path.resolve(runtimeDirectory),stagingDirectory:path.resolve(stagingDirectory)};this.directory=this.options.stagingDirectory;this.sandbox=new NativeSandbox(this.options.engineDirectory);this.validator=new DocumentSandboxService({runtimeDirectory:this.options.runtimeDirectory,stagingDirectory:this.directory+'-validation'});this.active=null;this.inspection=null;this.verified=null;this.disposed=false;this.initialized=null;
 }
 init(){return this.initialized??=(this.initialize().catch(error=>{this.disposed=true;throw error;}));}
 async initialize(){
  let entries;try{await noLinks(this.directory);entries=await fs.readdir(this.directory,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return;throw e;}if(entries.length>1000)throw failure('CLEANUP','Too many interrupted repair jobs require review.');
  for(const entry of entries){if(!/^job-[A-Za-z0-9]{6}$/.test(entry.name)||!entry.isDirectory()||entry.isSymbolicLink())continue;const folder=path.join(this.directory,entry.name);try{const names=await fs.readdir(folder);if(!names.length){await fs.rmdir(folder);continue;}if(names.some(n=>!NAMES.includes(n)))continue;const stat=await fs.lstat(path.join(folder,'.pdfix-job.json'));if(!stat.isFile()||stat.isSymbolicLink()||stat.size>512)continue;const marker=JSON.parse(await fs.readFile(path.join(folder,'.pdfix-job.json'),'utf8'));if(marker.owner!=='PDFix repair'||marker.version!==1||V.token(marker.token)!==marker.token)continue;if(!await this.cleanup(folder,marker.token))throw failure('CLEANUP','Interrupted repair staging could not be removed.');}catch(e){if(e.code!=='ENOENT')throw e;}}
 }
 check(job){if(this.disposed||job.canceled)throw failure('CANCELED','Repair canceled. No copy was saved.');}
 async cleanup(folder,token){
  try{if(path.dirname(path.resolve(folder))!==this.directory||!/^job-[A-Za-z0-9]{6}$/.test(path.basename(folder)))return false;await noLinks(folder);const names=await fs.readdir(folder);if(names.some(n=>!NAMES.includes(n)))return false;for(const name of names){if(name===RUNTIME)continue;const s=await fs.lstat(path.join(folder,name));if(!s.isFile()||s.isSymbolicLink())return false;}
   const marker=JSON.parse(await fs.readFile(path.join(folder,'.pdfix-job.json'),'utf8'));if(marker.owner!=='PDFix repair'||marker.version!==1||marker.token!==token)return false;
   if(!await this.sandbox.cleanup(folder))return false;for(const name of FILES)await fs.unlink(path.join(folder,name)).catch(e=>{if(e.code!=='ENOENT')throw e;});await fs.rmdir(folder);return true;
  }catch{return false;}
 }
 async command(job,args,{strict=false,output=false,query=false}={}){
  this.check(job);const child=await this.sandbox.launch(job,args);job.child=child;job.observed=false;
  let stopReason=null,stopTimer,diagnostics=0,stdout=[],stderr=[];
  const stop=reason=>{stopReason??=reason;child.kill();stopTimer??=setTimeout(()=>{job.unsafe=true;this.disposed=true;},5000);};job.stop=()=>stop(failure('CANCELED','Repair canceled. No copy was saved.'));
  const capture=list=>chunk=>{diagnostics+=chunk.length;if(diagnostics>65536)stop(failure('LIMIT','The PDF exceeded the 64 KiB repair diagnostic budget.'));else list.push(chunk);};child.stdout.on('data',capture(stdout));child.stderr.on('data',capture(stderr));for(const stream of [child.stdout,child.stderr])stream.on('error',()=>stop(failure('PIPE','Repair diagnostics could not be observed.')));
  const timer=setTimeout(()=>stop(failure('TIMEOUT','Repair exceeded its two-minute stage limit.')),120000);
  const monitor=output?setInterval(()=>fs.lstat(path.join(job.folder,'output.pdf')).then(s=>{if(!s.isFile()||s.isSymbolicLink()||s.size>V.MAX_BYTES)stop(failure('LIMIT','The rebuilt output exceeds the 100 MiB limit.'));}).catch(()=>{}),100):null;
  if(job.canceled)job.stop();let exit;
  try{
   // NativeSandbox records the close promise synchronously at spawn.
   if(!job.brokerExit)throw failure('SANDBOX','The pinned sandbox does not expose observed process termination.');
   exit=await Promise.race([job.brokerExit,new Promise((_,reject)=>{job.exitTimer=setTimeout(()=>{job.unsafe=true;this.disposed=true;reject(failure('SANDBOX','Repair broker termination was not observed. Repair stays closed and staging is retained.'));},126000);})]);
   job.observed=true;if(exit.launchError)throw failure('SANDBOX','The contained repair engine could not start.');this.check(job);if(stopReason)throw stopReason;const blocked=sandboxExit(exit.code);if(blocked)throw failure('SANDBOX',blocked);
   if(query&&exit.code!==0&&exit.code!==3||strict&&exit.code!==0||!query&&!strict&&![0,2,3].includes(exit.code))throw failure('VERIFY','The rebuilt PDF did not pass a strict qpdf reopen with recovery disabled.');
   const clean=value=>Buffer.concat(value).toString('utf8').replaceAll(job.folder,'[repair staging]').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u202a-\u202e\u2066-\u2069]/g,' ').slice(0,65536);
   return {code:exit.code,stdout:clean(stdout),stderr:clean(stderr)};
  }finally{clearTimeout(timer);clearInterval(monitor);clearTimeout(stopTimer);clearTimeout(job.exitTimer);job.stop=null;if(job.observed)job.child=null;}
 }
 async job(id,source,token,action){
  V.token(token);if(this.disposed||this.active)throw failure('BUSY',this.disposed?'Repair containment has closed.':'Finish or cancel the current repair job.');const bytes=V.validSource(id,source),job={sourceId:id,token,canceled:false,controller:new AbortController(),observed:true,unsafe:false,folder:null};this.active=job;
  job.deadline=setTimeout(()=>{job.canceled=true;job.controller.abort();job.stop?.();},360000);
  job.promise=(async()=>{try{await this.init();this.check(job);await fs.mkdir(this.directory,{recursive:true});await noLinks(this.directory);job.folder=await fs.mkdtemp(path.join(this.directory,'job-'));await fs.writeFile(path.join(job.folder,'.pdfix-job.json'),JSON.stringify({owner:'PDFix repair',version:1,token}),{flag:'wx'});await fs.writeFile(path.join(job.folder,'input.pdf'),bytes,{flag:'wx'});const result=await action(job,bytes);this.check(job);const stat=await fs.lstat(path.join(job.folder,'input.pdf'));if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==bytes.length||V.hash(await fs.readFile(path.join(job.folder,'input.pdf')))!==V.hash(bytes)){this.verified?.bytes.fill(0);this.verified=this.inspection=null;throw failure('CHANGED','Repair staging source changed. No output was released.');}return result;}finally{clearTimeout(job.deadline);bytes.fill(0);if(job.canceled){this.verified?.bytes.fill(0);this.verified=this.inspection=null;}if(job.child&&!job.observed){job.unsafe=true;this.disposed=true;}if(job.folder&&!job.unsafe&&!await this.cleanup(job.folder,token)){this.disposed=true;this.verified?.bytes.fill(0);this.verified=null;throw failure('CLEANUP','Repair staging cleanup failed. No output was released; repair stays closed.');}if(!job.unsafe&&this.active===job)this.active=null;}})();return job.promise;
 }
 async inspect(id,source,token){
  this.inspection=null;this.verified?.bytes.fill(0);this.verified=null;return this.job(id,source,token,async(job,bytes)=>{
   const check=await this.command(job,['--check',path.join(job.folder,'input.pdf')]);let baseline=null,reason=null;
   try{const encryption=await this.command(job,[path.join(job.folder,'input.pdf'),'--json=2','--json-key=encrypt'],{query:true});const data=JSON.parse(encryption.stdout);if(data?.encrypt?.encrypted!==false)throw new Error('Encrypted or permission-controlled PDFs are unavailable for repair. Obtain an owner-authorized clear copy.');baseline=await this.validator.run('repair-inspect',bytes,{},v=>V.inventory(v,V.hash(bytes),bytes.length),{signal:job.controller.signal});this.check(job);}catch(error){if(job.canceled||this.validator.closed||error.code==='SANDBOX')throw error;reason=String(error.message).slice(0,2000).replace(/review (editing|edit|comments)/gi,'repair');}
   if(check.code===2)reason='qpdf reported unrecoverable errors. This supported repair slice requires recoverable structure warnings and a complete independent baseline.';
   const body={version:1,sourceSha256:V.hash(bytes),sourceBytes:bytes.length,eligible:!!baseline&&check.code!==2,check,baseline,reason,scope:V.SCOPE,limits:'100 MiB source/output, 1–500 pages, 100,000 objects, 300,000 inventory visits; isolated 512 MiB process and 115-second native watchdog; 64 KiB diagnostics per invocation. Whole-file tools are not giant-file repair support.'};const report={...body,inspectionSha256:V.hash(JSON.stringify(body)),token};this.inspection={sourceId:id,token,sourceSha256:body.sourceSha256,report:structuredClone(report)};return report;
  });
 }
 async repair(id,source,token,value){
  const selection=V.selection(value),prior=this.inspection;if(!prior||prior.sourceId!==id||prior.token!==token||!prior.report.eligible||prior.report.inspectionSha256!==selection.inspectionSha256||source.fingerprint!==prior.sourceSha256)throw failure('STALE','Inspect and acknowledge a supported exact-source repair before rebuilding.');this.verified?.bytes.fill(0);this.verified=null;
  return this.job(id,source,token,async(job,bytes)=>{
   const input=path.join(job.folder,'input.pdf'),output=path.join(job.folder,'output.pdf');
   const build=await this.command(job,['--stream-data=preserve','--object-streams=preserve','--preserve-unreferenced','--remove-unreferenced-resources=no',input,output],{output:true});if(![0,3].includes(build.code))throw failure('VERIFY','qpdf could not rebuild this damaged structure. No copy was released.');
   const strict=await this.command(job,['--suppress-recovery','--check',output],{strict:true});
   const stat=await fs.lstat(output);if(!stat.isFile()||stat.isSymbolicLink()||stat.size<1||stat.size>V.MAX_BYTES)throw failure('LIMIT','Repair output failed its bounded file checks.');const owned=await fs.readFile(output);if(owned.length!==stat.size)throw failure('CHANGED','Repair output changed while being read.');const sha256=V.hash(owned);
   const reopened=await this.validator.run('repair-verify',owned,{baseline:prior.report.baseline},v=>{V.inventory(v,sha256,owned.length);if(!V.preserved(prior.report.baseline,v))throw failure('VERIFY','Repair output changed available baseline evidence.');},{signal:job.controller.signal});this.check(job);
   const report={version:1,verified:true,sourceSha256:prior.sourceSha256,sourceBytes:bytes.length,sha256,outputBytes:owned.length,pageCount:reopened.pageCount,inspectionSha256:selection.inspectionSha256,sourceCheck:prior.report.check,buildDiagnostics:build,strictCheck:strict,baseline:prior.report.baseline,reopened,scope:V.SCOPE,notices:['The output passed qpdf --suppress-recovery --check and a separate contained parser reopen.','Available current document graphs, disconnected objects, encoded stream payloads, page count and geometry match.','No missing bytes were restored or inferred. Original byte revisions, trailer identifiers, xref/object-stream containers and semantic/rendering correctness remain unverified.']};
   const seal=V.hash(JSON.stringify(report));this.verified={sourceId:id,token,sourceSha256:prior.sourceSha256,bytes:Buffer.from(owned),report:structuredClone(report),seal};return {token,bytes:Uint8Array.from(owned),report};
  });
 }
 output(id,source,token){V.token(token);const bytes=V.validSource(id,source),sha256=V.hash(bytes);bytes.fill(0);const v=this.verified;if(this.disposed||this.active||!v||v.sourceId!==id||v.token!==token||v.sourceSha256!==sha256||V.hash(v.bytes)!==v.report.sha256||V.hash(JSON.stringify(v.report))!==v.seal||!V.preserved(v.report.baseline,v.report.reopened)||v.report.strictCheck.code!==0)throw failure('STALE','Build and review a fresh source-bound repair copy before saving.');return {bytes:Buffer.from(v.bytes),report:structuredClone(v.report)};}
 async cancel(id,token){if(this.verified?.sourceId===id&&(!token||this.verified.token===token)){this.verified.bytes.fill(0);this.verified=null;}if(this.inspection?.sourceId===id&&(!token||this.inspection.token===token))this.inspection=null;const job=this.active;if(!job||job.sourceId!==id||token&&job.token!==token)return false;job.canceled=true;job.controller.abort();job.stop?.();await this.validator.cancel();try{await job.promise;}catch{}return !job.unsafe;}
 async discard(id,token){if(this.verified?.sourceId===id&&(!token||this.verified.token===token)){this.verified.bytes.fill(0);this.verified=null;}if(this.inspection?.sourceId===id&&(!token||this.inspection.token===token))this.inspection=null;await this.cancel(id,token);return true;}
 async dispose(){this.disposed=true;if(this.verified)this.verified.bytes.fill(0);this.verified=this.inspection=null;const job=this.active;if(job)await this.cancel(job.sourceId,job.token);await this.validator.dispose();if(job?.unsafe)throw failure('SANDBOX','Repair termination was not observed; service cannot be recreated safely.');}
 async status(){return {...await this.sandbox.status(),family:'Reviewed PDF structure repair',active:!!this.active,closed:this.disposed,validator:await this.validator.status(),sourceMiB:100,outputMiB:100,fallback:false,scope:V.SCOPE};}
}
module.exports={PdfRepairService};
