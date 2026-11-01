'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {createHash,randomUUID}=require('node:crypto');
const {validatePagedNavigation,validatePagedPageLinks}=require('./paged-pdf-navigation.cjs');
const {NativeSandbox,sandboxExit,RUNTIME,MARKER}=require('./native-sandbox.cjs');
const OWNER='PDFix paged reader',OWN_MARKER='.pdfix-job.json',MAX_OUTPUT=32*1024*1024;
const UUID='[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',CACHE_LIMIT=48*1024*1024;
const LEAVES=['input.pdf','output.pdf',OWN_MARKER],NAMES=[...LEAVES,RUNTIME,MARKER];
const fail=(code,message)=>Object.assign(new Error(message),{code});
const canceled=()=>fail('CANCELED','Paged PDF request canceled.');
const SANDBOX_STAGES=Object.freeze({preflight:'checking the private staging folder',parent:'checking the PDFix process',input:'checking staged input',profile:'creating the Windows AppContainer',desktop:'preparing the private hidden desktop',desktopcleanup:'releasing private desktop permissions',permissions:'setting private file permissions',job:'setting memory and process limits',pipes:'creating private engine pipes',attributes:'setting Windows isolation attributes',environment:'preparing Windows startup settings',loader:'setting the private library search directory',launch:'starting the contained engine',containment:'verifying the engine isolation',execution:'running the contained engine',cleanup:'removing the Windows AppContainer'});
function sandboxFailure(code,diagnostics){
 if(![125,126].includes(code))return sandboxExit(code);
 const matches=[...diagnostics.matchAll(/^PDFIX_SANDBOX:([a-z]+):(-?[0-9]{1,11})\r?$/gm)],entry=matches.at(-1);
 if(entry&&Object.hasOwn(SANDBOX_STAGES,entry[1])){
  const stage=entry[1],number=Number(entry[2]),unsigned=number>>>0;
  const advice=stage==='launch'&&unsigned===203?'Windows could not find a startup environment setting. This is a PDFix launch-configuration problem; it does not show that the PDF is too large or that antivirus blocked it. Update PDFix and reopen it.':stage==='permissions'||stage==='preflight'?'Use a local NTFS temporary folder; cloud redirects, locked files or security software can prevent private staging.':stage==='launch'?'Windows may have blocked the packaged engine or a runtime dependency. Repair the local PDFix build and check Windows protection history.':stage==='cleanup'?'Close and reopen PDFix so its owned temporary session can be cleaned up.':'Close and reopen PDFix. If this repeats, retain this stage and Windows code for repair.';
  return `Windows Security Sandbox failed while ${SANDBOX_STAGES[stage]} (stage ${stage}, Windows code ${number}, 0x${unsigned.toString(16).padStart(8,'0')}). ${advice} The original PDF is unchanged; no unrestricted engine was run.`;
 }
 return sandboxExit(code);
}
async function noLinks(folder){let current=path.resolve(folder);for(;;){const s=await fs.lstat(current);if(!s.isDirectory()||s.isSymbolicLink())throw fail('PATH','Paged PDF staging path is unsupported.');const parent=path.dirname(current);if(parent===current)return;current=parent;}}
class PagedPdfService{
 constructor({engineDirectory=path.resolve(__dirname,'../dist/native/qpdf'),stagingDirectory=path.join(os.tmpdir(),'PDFix-paged')}={}){
  if(![engineDirectory,stagingDirectory].every(v=>typeof v==='string'&&path.isAbsolute(v)))throw fail('PATH','Paged PDF requires app-owned absolute directories.');
  this.options={engineDirectory:path.resolve(engineDirectory),stagingDirectory:path.resolve(stagingDirectory)};this.directory=this.options.stagingDirectory;this.sandbox=new NativeSandbox(this.options.engineDirectory);this.sessions=new Map();this.tail=Promise.resolve();this.disposed=false;this.active=null;this.initialized=null;this.pendingPageRequests=0;this.cache=new Map();this.cacheBytes=0;
 }
 init(){return this.initialized??=this.initialize();}
 async initialize(){
  await fs.mkdir(this.directory,{recursive:true});await noLinks(this.directory);
  // Windows TEMP may use an 8.3 alias (for example RUNNER~1). The contained
  // helper binds opened files to its pinned job directory.
  // Resolve aliases in the broker, where ancestor lookup is permitted, before
  // staging; retain the no-reparse checks on both spellings.
  this.directory=await fs.realpath(this.directory);await noLinks(this.directory);
  const entries=await fs.readdir(this.directory,{withFileTypes:true});if(entries.length>1000)throw fail('CLEANUP','Too many interrupted page-reading folders require cleanup.');
  for(const entry of entries){if(!entry.isDirectory()||entry.isSymbolicLink()||!/^job-[A-Za-z0-9]{6}$/.test(entry.name))continue;
   const folder=path.join(this.directory,entry.name),markerFile=path.join(folder,OWN_MARKER);let marker;
   try{const stat=await fs.lstat(markerFile);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>512)continue;marker=JSON.parse(await fs.readFile(markerFile,'utf8'));}catch{continue;}
   if(marker.owner!==OWNER||marker.version!==1||! /^[0-9a-f-]{36}$/i.test(marker.token||''))continue;
   if(!await this.cleanup({job:{folder,token:marker.token,unsafe:false,observed:true}}))throw fail('CLEANUP','An owned interrupted page-reading folder could not be removed. It was retained for safe cleanup.');
  }
 }
 serial(action){const result=this.tail.then(action);this.tail=result.catch(()=>{});return result;}
 check(session,generation){if(this.disposed||session.released||session.job.canceled||generation!==undefined&&generation!==session.generation)throw canceled();}
 async guard(session){this.check(session);if(await session.capability.validate()===false)throw fail('CHANGED','The PDF source changed. Reopen the source.');const s=await fs.lstat(path.join(session.job.folder,'input.pdf'));if(!s.isFile()||s.isSymbolicLink()||s.size!==session.capability.length||session.inputStat&&['size','dev','ino','mtimeMs'].some(key=>s[key]!==session.inputStat[key]))throw fail('CHANGED','Paged PDF staging source changed.');}
 diagnostics(session){return {sessionPID:session.helperPID??null,parserStarts:session.parserStarts||0,pagesPrepared:session.pagesPrepared||0,cacheHits:session.cacheHits||0,parserPrivateMiB:session.privateBytes?Math.round(session.privateBytes/1048576):null};}
 info(session){return {pageCount:session.pageCount,sourceSha256:session.capability.sha256,permissions:null,encrypted:false,mode:'paged',navigation:session.navigation??null,diagnostics:this.diagnostics(session)};}
 async open(id,source){
  if(this.disposed)throw canceled();if(typeof id!=='string'||!id||typeof source?.pagedInput!=='function')throw fail('SOURCE','A disk-backed PDF source is required.');
  const existing=this.sessions.get(id);if(existing){if(existing.source!==source)throw fail('STALE','The paged PDF source does not match.');await existing.ready;await this.guard(existing);return this.info(existing);}
  const session={source,released:false,generation:0,token:null,pendingPageRequests:0,job:{folder:null,token:randomUUID(),canceled:false,controller:new AbortController(),observed:true,unsafe:false}};this.sessions.set(id,session);
  session.ready=this.serial(async()=>{try{
   this.check(session);await this.init();this.check(session);session.capability=await source.pagedInput();const cap=session.capability;
   if(!cap||!Number.isSafeInteger(cap.length)||cap.length<1||!/^[a-f0-9]{64}$/.test(cap.sha256)||typeof cap.validate!=='function'||typeof cap.stage!=='function')throw fail('SOURCE','Invalid disk-backed PDF capability.');
   if(await cap.validate()===false)throw fail('CHANGED','The PDF source changed.');this.check(session);
   await fs.mkdir(this.directory,{recursive:true});await noLinks(this.directory);session.job.folder=await fs.mkdtemp(path.join(this.directory,'job-'));
   await fs.writeFile(path.join(session.job.folder,OWN_MARKER),JSON.stringify({owner:OWNER,version:1,token:session.job.token}),{flag:'wx'});
   await cap.stage(path.join(session.job.folder,'input.pdf'),{signal:session.job.controller.signal});session.inputStat=await fs.lstat(path.join(session.job.folder,'input.pdf'));await this.guard(session);
   await this.startSession(session);if(process.env.PDFIX_PAGED_NAVIGATION!=='0')try{session.navigation=await this.readNavigation(session);}catch(error){if(session.job.unsafe||['CHANGED','CANCELED','SANDBOX','CLEANUP'].includes(error.code))throw error;session.navigation=null;await this.startSession(session);}await this.guard(session);
  }catch(error){session.released=true;await this.stopSession(session,error);if(!session.job.unsafe&&!await this.cleanup(session))this.disposed=true;if(this.sessions.get(id)===session)this.sessions.delete(id);throw error;}});
  await session.ready;return this.info(session);
 }
 engineFailure(exit,diagnostics=''){
  if(exit.launchError)return fail('SANDBOX','Windows could not start the packaged sandbox broker. Repair the local PDFix build or check Windows protection history. The original PDF is unchanged.');
  if(exit.code===124)return fail('PDF_PAGE_BUDGET','This PDF or page exceeded the contained parser budget (512 MiB memory, 115 seconds, or 32 MiB prepared page). The original is unchanged. Try another page.');
  const blocked=sandboxFailure(exit.code,diagnostics);if(blocked)return fail('SANDBOX',blocked);
  const nativeCode=exit.code>>>0;
  if([0xc0000017,0xc000009a,0xc000012d].includes(nativeCode))return fail('PDF_PAGE_BUDGET','Windows could not provide enough memory for this PDF page. Close other applications or try another page. The original PDF is unchanged.');
  const loaderReasons={0xc0000135:'a required library could not be found or accessed',0xc000007b:'a library has an incompatible executable format',0xc0000142:'a runtime library failed to initialize'};
  if(Object.hasOwn(loaderReasons,nativeCode))return fail('SANDBOX',`The contained PDF engine could not load: ${loaderReasons[nativeCode]} (Windows loader 0x${nativeCode.toString(16)}). The packaged library search path is restricted to the private runtime and Windows system directory. Retain this code for repair; the original PDF is unchanged.`);
  return fail('VERIFY',`The contained PDF session ended before completing its request (exit ${exit.code}). The original PDF is unchanged.`);
 }
 helperFailure(code){
  if(code==='ENCRYPTED')return fail('ENCRYPTED','Encrypted or permission-controlled PDFs require an owner-authorized clear copy.');
  if(['OUTPUT_LIMIT','MEMORY'].includes(code))return fail('PDF_PAGE_BUDGET','This page exceeded the contained parser budget (512 MiB memory or 32 MiB prepared page). The original PDF is unchanged. Try another page.');
  if(code==='SOURCE_CHANGED')return fail('CHANGED','The staged PDF source changed. Reopen the source.');
  if(code==='INVALID_PAGE')return fail('PAGE','Invalid PDF page number.');
  if(['LOADER','DLL_INIT'].includes(code))return fail('SANDBOX',`The contained PDF helper could not initialize its private runtime (${code}). Repair the local PDFix build. The original PDF is unchanged.`);
  if(code==='PROTOCOL')return fail('PIPE','The contained PDF session protocol failed. Reopen the source.');
  return fail('VERIFY',`The contained PDF helper could not prepare this PDF or page (${code}). It may be damaged or unsupported. The original PDF is unchanged.`);
 }
 async activity(session,token,action){
  let complete;const completion=new Promise(resolve=>{complete=resolve;});session.job.commandDone=completion;session.job.requestToken=token;this.active=session;
  session.job.stop=()=>{void this.stopSession(session,canceled());};
  try{return await action();}finally{if(session.job.commandDone===completion){session.job.commandDone=null;session.job.stop=null;}if(this.active===session)this.active=null;complete();}
 }
 waitResponse(session,kind,token,page){
  const p=session.protocol;if(!p||p.exited||p.waiter)throw fail('PIPE','The contained PDF session is unavailable.');
  const promise=new Promise((resolve,reject)=>{p.waiter={kind,token,page,resolve,reject};});
  // Request deadlines apply to OPEN or PAGE, never to the lifetime of the helper.
  p.requestTimer=setTimeout(()=>{void this.stopSession(session,fail('TIMEOUT','Paged PDF preparation reached its time limit.'));},kind==='NAV'?20000:120000);
  return promise;
 }
 settleResponse(session,error,value){
  const p=session.protocol,waiter=p?.waiter;if(!waiter)return;clearTimeout(p.requestTimer);p.requestTimer=null;p.waiter=null;
  if(error)waiter.reject(error);else waiter.resolve(value);
 }
 protocolData(session,chunk){
  const p=session.protocol;if(p.exited||p.stopping)return;
  p.stdoutBytes+=chunk.length;
  if(p.stdoutBytes>65536||[...chunk].some(byte=>byte!==10&&byte!==13&&(byte<32||byte>126))){void this.stopSession(session,fail('PIPE','Paged PDF returned invalid or excessive session diagnostics.'));return;}
  p.buffer+=chunk.toString('ascii');
  for(;;){const end=p.buffer.indexOf('\n');if(end<0){if(p.buffer.length>192)void this.stopSession(session,fail('PIPE','Paged PDF returned an overlong session response.'));return;}
   if(end>192){void this.stopSession(session,fail('PIPE','Paged PDF returned an overlong session response.'));return;}
   const line=p.buffer.slice(0,end).replace(/\r$/,'');p.buffer=p.buffer.slice(end+1);const w=p.waiter;let match;
   if((match=/^PDFIX_PAGED:READY:([1-9][0-9]{0,15}):([1-9][0-9]{0,9})$/.exec(line))&&w?.kind==='OPEN'){
    const count=Number(match[1]),pid=Number(match[2]);if(!Number.isSafeInteger(count)||!Number.isSafeInteger(pid)||session.pageCount&&session.pageCount!==count){void this.stopSession(session,fail('VERIFY','The PDF page count changed between contained sessions.'));return;}
    session.pageCount=count;session.helperPID=pid;session.parserStarts=(session.parserStarts||0)+1;this.settleResponse(session,null,{pageCount:count});
   }else if((match=new RegExp(`^PDFIX_PAGED:PAGE:(${UUID}):([1-9][0-9]{0,15}):([1-9][0-9]{0,8}):([0-9]{1,16})$`).exec(line))&&w?.kind==='PAGE'&&match[1]===w.token&&Number(match[2])===w.page){
    const outputBytes=Number(match[3]),memory=Number(match[4]);if(outputBytes>MAX_OUTPUT||!Number.isSafeInteger(memory)){void this.stopSession(session,fail('LIMIT','This page exceeds the contained output or memory limit.'));return;}
    ++p.pagesProcessed;session.pagesPrepared=(session.pagesPrepared||0)+1;session.privateBytes=memory;this.settleResponse(session,null,{outputBytes,memory});
   }else if((match=new RegExp(`^PDFIX_PAGED:NAV:(${UUID}):([1-9][0-9]{0,7}):([0-9]{1,16})$`).exec(line))&&w?.kind==='NAV'&&match[1]===w.token){
    const outputBytes=Number(match[2]),memory=Number(match[3]);if(outputBytes>2*1024*1024||!Number.isSafeInteger(memory)){void this.stopSession(session,fail('LIMIT','Navigation metadata exceeded its boundary.'));return;}session.privateBytes=memory;this.settleResponse(session,null,{outputBytes,memory});
   }else if((match=new RegExp(`^PDFIX_PAGED:ERROR:(OPEN|${UUID}):(LOADER|DLL_INIT|ENCRYPTED|PARSE|OUTPUT_LIMIT|PROTOCOL|MEMORY|SOURCE_CHANGED|INVALID_PAGE|OUTPUT)$`).exec(line))&&w&&(w.kind==='OPEN'?match[1]==='OPEN':match[1]===w.token)){
    void this.stopSession(session,this.helperFailure(match[2]));return;
   }else{void this.stopSession(session,fail('PIPE','Paged PDF returned an unexpected session response.'));return;}
  }
 }
 writeSession(session,line){
  const p=session.protocol;if(!p?.child||p.exited||p.stopping)throw fail('PIPE','The contained PDF session is unavailable.');
  p.child.stdin.write(line,error=>{if(error)void this.stopSession(session,fail('PIPE','The contained PDF request pipe failed.'));});
 }
 async startSession(session,generation,requestToken=null){
  await this.guard(session);this.check(session,generation);
  if(session.protocol&&!session.protocol.exited){if(session.protocol.stopping)await session.protocol.exitPromise;else return;}
  if(session.job.unsafe)throw fail('SANDBOX','PDF broker termination was not observed; staging is retained.');
  return this.activity(session,requestToken,async()=>{
   const job=session.job,p={child:null,exited:false,stopping:false,closing:false,buffer:'',stdoutBytes:0,stderrBytes:0,errors:[],pagesProcessed:0};session.protocol=p;
   const ready=this.waitResponse(session,'OPEN');ready.catch(()=>{});
   try{
    job.brokerExit=null;const child=await this.sandbox.launchPagedSession(job,()=>{this.check(session,generation);if(p.stopping)throw p.stopReason;});p.child=child;job.child=child;job.observed=false;
    if(!job.brokerExit)throw fail('SANDBOX','Paged PDF sandbox termination cannot be observed.');
    p.exitPromise=Promise.resolve(job.brokerExit).then(exit=>{
     p.exited=true;p.exit=exit;job.observed=true;job.child=null;session.helperPID=null;clearTimeout(p.stopTimer);
     if(process.env.CI&&(exit.code!==0||p.stopReason)){
      const lines=Buffer.concat(p.errors).toString('utf8').split(/\r?\n/).filter(line=>/^PDFIX_PAGED_(?:(?:API|REJECT|HOST):[A-Z_]{1,40}:-?[0-9]{1,11}|FILE:(?:INPUT|OUTPUT):[0-9]{1,10}:[0-9]{1,10})$/.test(line)).slice(0,2);
      if(lines.length)console.error('[PDFix paged native] '+lines.join(' '));
     }
     this.settleResponse(session,p.stopReason||this.engineFailure(exit,Buffer.concat(p.errors).toString('utf8')));return exit;
    },()=>{p.exited=true;job.unsafe=true;this.disposed=true;this.settleResponse(session,fail('SANDBOX','PDF broker termination could not be observed; staging is retained.'));return null;});
    child.stdout.on('data',chunk=>this.protocolData(session,chunk));child.stderr.on('data',chunk=>{p.stderrBytes+=chunk.length;if(p.stderrBytes>65536)void this.stopSession(session,fail('LIMIT','Paged PDF diagnostics exceeded 64 KiB.'));else p.errors.push(chunk);});
    for(const stream of [child.stdout,child.stderr,child.stdin])stream.on('error',()=>{void this.stopSession(session,fail('PIPE','The contained PDF session pipe failed.'));});
    this.check(session,generation);this.writeSession(session,'PDFix.Paged.Session.v1\n');await ready;this.check(session,generation);
   }catch(error){await this.stopSession(session,error);throw error;}
  });
 }
 async readNavigation(session,page=0,requestToken=null){
  const token=requestToken??randomUUID();return this.activity(session,token,async()=>{const response=this.waitResponse(session,'NAV',token);response.catch(()=>{});try{this.writeSession(session,`NAV:${token}:${page}\n`);const result=await response;await this.guard(session);const output=path.join(session.job.folder,'output.pdf'),before=await fs.lstat(output);if(!before.isFile()||before.isSymbolicLink()||before.size!==result.outputBytes||before.size>2*1024*1024)throw fail('VERIFY','Invalid navigation metadata slot.');const handle=await fs.open(output,'r');let bytes;try{const stat=await handle.stat();const same=(a,b)=>['size','dev','ino','mtimeMs','ctimeMs'].every(k=>a[k]===b[k]);if(!same(before,stat))throw fail('CHANGED','Navigation slot changed.');bytes=await handle.readFile();if(bytes.length!==stat.size||!same(stat,await handle.stat())||!same(stat,await fs.lstat(output)))throw fail('CHANGED','Navigation slot changed.');}finally{await handle.close();}await this.guard(session);const decoded=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));return page?validatePagedPageLinks(decoded,session.pageCount,page):validatePagedNavigation(decoded,session.pageCount);}catch(error){await this.stopSession(session,error);throw error;}});
 }

 async stopSession(session,reason){
  const p=session.protocol;if(!p||p.exited)return;const job=session.job;p.stopping=true;p.stopReason??=reason||canceled();
  if(!p.child){this.settleResponse(session,p.stopReason);if(!job.observed){job.unsafe=true;this.disposed=true;}return;}
  if(!p.exitPromise){job.unsafe=true;this.disposed=true;try{p.child.kill();}catch{}this.settleResponse(session,fail('SANDBOX','PDF broker termination cannot be observed; staging is retained.'));return;}
  if(!p.stopPromise){
   try{p.child.kill();}catch{job.unsafe=true;this.disposed=true;}
   p.stopPromise=Promise.race([p.exitPromise,new Promise(resolve=>{p.stopTimer=setTimeout(()=>{if(p.exited)return;job.unsafe=true;this.disposed=true;this.settleResponse(session,fail('SANDBOX','PDF broker termination was not observed; staging is retained.'));resolve();},6000);})]);
  }
  await p.stopPromise;
 }
 async closeSession(session){
  const p=session.protocol;if(!p||p.exited)return;if(p.waiter||p.stopping){await this.stopSession(session);return;}
  p.closing=true;let timer;
  try{this.writeSession(session,'CLOSE\n');await Promise.race([p.exitPromise,new Promise(resolve=>{timer=setTimeout(resolve,6000);})]);if(!p.exited)await this.stopSession(session,fail('SANDBOX','The contained PDF session did not close promptly.'));}catch(error){await this.stopSession(session,error);}finally{clearTimeout(timer);}
  if(session.job.unsafe)throw fail('SANDBOX','PDF broker termination was not observed; staging is retained.');
  if(p.exit&&!p.stopReason&&![0,3].includes(p.exit.code))throw this.engineFailure(p.exit,Buffer.concat(p.errors).toString('utf8'));
 }
 clearCache(session){for(const [key,item] of this.cache)if(item.session===session){this.cacheBytes-=item.weight??item.bytes.byteLength;this.cache.delete(key);}}
 cachePage(session,page,bytes,sha256,navigation=null){
  const key=`${session.job.token}:${page}`;const weight=bytes.byteLength+(navigation?Buffer.byteLength(JSON.stringify(navigation),'utf8'):0);this.cache.set(key,{session,page,bytes,sha256,navigation,weight});this.cacheBytes+=weight;
  while(this.cacheBytes>CACHE_LIMIT||[...this.cache.values()].filter(item=>item.session===session).length>4){const [oldKey,item]=this.cache.entries().next().value;this.cacheBytes-=item.bytes.byteLength;this.cache.delete(oldKey);}
 }
 pageResult(session,page,bytes,sha256,navigation=null){return {page,pageLinks:navigation?.links??[],pageLinksTruncated:navigation?.truncated??!!session.linkMetadataUnavailable,bytes:Uint8Array.from(bytes),sha256,sourceSha256:session.capability.sha256,pageCount:session.pageCount,diagnostics:this.diagnostics(session)};}
 async page(id,source,page,requestToken){
  if(typeof requestToken!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestToken))throw fail('TOKEN','Invalid page request token.');
  requestToken=requestToken.toLowerCase();
  const session=this.sessions.get(id);if(!session||session.source!==source||session.released)throw fail('STALE','Open this exact source in paged mode first.');
  if(!Number.isSafeInteger(page)||page<1)throw fail('PAGE','Invalid PDF page number.');
  if(this.pendingPageRequests>=16||session.pendingPageRequests>=3)throw fail('BUSY','PDF page preparation is busy. Wait for the current page or cancel loading before navigating again.');
  ++this.pendingPageRequests;++session.pendingPageRequests;
  const generation=++session.generation;session.token=requestToken;
  try{return await this.serial(async()=>{
   await session.ready;this.check(session,generation);session.job.requestToken=requestToken;if(!Number.isInteger(page)||page<1||page>session.pageCount)throw fail('PAGE','Invalid PDF page number.');await this.guard(session);this.check(session,generation);
   const cacheKey=`${session.job.token}:${page}`,cached=this.cache.get(cacheKey);
   if(cached){this.cache.delete(cacheKey);this.cache.set(cacheKey,cached);session.cacheHits=(session.cacheHits||0)+1;return this.pageResult(session,page,cached.bytes,cached.sha256,cached.navigation);}
   await this.startSession(session,generation,requestToken);this.check(session,generation);
   let navigation=null;
   if(process.env.PDFIX_PAGED_NAVIGATION!=='0'&&!session.linkMetadataUnavailable)try{navigation=await this.readNavigation(session,page,requestToken);this.check(session,generation);}catch(error){if(session.job.unsafe||['CHANGED','CANCELED','SANDBOX','CLEANUP'].includes(error.code))throw error;this.check(session,generation);session.linkMetadataUnavailable=true;await this.startSession(session,generation,requestToken);}
   return this.activity(session,requestToken,async()=>{
    const response=this.waitResponse(session,'PAGE',requestToken,page);response.catch(()=>{});
    try{
     this.writeSession(session,`PAGE:${requestToken}:${page}\n`);const result=await response;this.check(session,generation);await this.guard(session);
     const output=path.join(session.job.folder,'output.pdf'),before=await fs.lstat(output);
     if(!before.isFile()||before.isSymbolicLink()||before.size<1||before.size>MAX_OUTPUT||before.size!==result.outputBytes)throw fail('LIMIT','The prepared PDF page has an invalid or excessive output size.');
     const same=(a,b)=>['size','dev','ino','mtimeMs','ctimeMs'].every(key=>a[key]===b[key]);
     const handle=await fs.open(output,'r');let bytes;
     try{const stat=await handle.stat();if(!same(stat,before))throw fail('CHANGED','Page output changed.');bytes=Buffer.alloc(stat.size);let position=0;
      while(position<bytes.length){this.check(session,generation);const read=await handle.read(bytes,position,bytes.length-position,position);if(!read.bytesRead)throw fail('CHANGED','Page output changed.');position+=read.bytesRead;}
      const after=await fs.lstat(output);if(after.isSymbolicLink()||!same(stat,after)||!same(stat,await handle.stat()))throw fail('CHANGED','Page output changed.');
     }finally{await handle.close();}
     await this.guard(session);this.check(session,generation);const sha256=createHash('sha256').update(bytes).digest('hex');this.cachePage(session,page,bytes,sha256,navigation);
     // The helper owns output.pdf throughout the session; only it truncates the slot.
     if(result.memory>384*1024*1024||session.protocol.pagesProcessed>=64)await this.closeSession(session);
     this.check(session,generation);return this.pageResult(session,page,bytes,sha256,navigation);
    }catch(error){await this.stopSession(session,error);throw error;}
   });
  });}finally{--this.pendingPageRequests;--session.pendingPageRequests;}
 }
 async cancel(id,token){if(typeof token==='string')token=token.toLowerCase();const session=this.sessions.get(id);if(!session)return false;const queuedMatch=!token||session.token===token,activeMatch=!!session.job.commandDone&&(!token||session.job.requestToken===token);if(!queuedMatch&&!activeMatch)return false;if(queuedMatch)++session.generation;
  if(!token&&!session.pageCount){session.job.canceled=true;session.job.controller.abort();}
  if(activeMatch){const completion=session.job.commandDone;session.job.stop?.();let timer;
   try{if(completion)await Promise.race([completion,new Promise(resolve=>{timer=setTimeout(()=>{session.job.unsafe=true;this.disposed=true;resolve();},6000);})]);}finally{clearTimeout(timer);}
  }
  return !session.job.unsafe;
 }
 async cleanup(session){const job=session.job;if(!job.folder)return true;try{
  if(job.unsafe||job.child||!job.observed||path.dirname(path.resolve(job.folder))!==this.directory||!/^job-[A-Za-z0-9]{6}$/.test(path.basename(job.folder)))return false;await noLinks(job.folder);
  const names=await fs.readdir(job.folder);if(names.some(n=>!NAMES.includes(n)))return false;for(const name of names){if(name===RUNTIME)continue;const s=await fs.lstat(path.join(job.folder,name));if(!s.isFile()||s.isSymbolicLink())return false;}
  const marker=JSON.parse(await fs.readFile(path.join(job.folder,OWN_MARKER),'utf8'));if(marker.owner!==OWNER||marker.version!==1||marker.token!==job.token)return false;
  if(!await this.sandbox.cleanup(job.folder))return false;for(const name of LEAVES)await fs.unlink(path.join(job.folder,name)).catch(e=>{if(e.code!=='ENOENT')throw e;});await fs.rmdir(job.folder);job.folder=null;return true;
 }catch{return false;}}
 release(id){const session=this.sessions.get(id);if(!session)return Promise.resolve();if(session.releasePromise)return session.releasePromise;session.released=true;++session.generation;session.job.canceled=true;session.job.controller.abort();session.job.stop?.();session.releasePromise=(async()=>{await this.tail;
  await this.closeSession(session);this.clearCache(session);if(!await this.cleanup(session)){this.disposed=true;throw fail('CLEANUP','Paged PDF staging cleanup failed; the reader stays closed.');}if(this.sessions.get(id)===session)this.sessions.delete(id);
 })();return session.releasePromise;}
 async dispose(){this.disposed=true;const results=await Promise.allSettled([...this.sessions.keys()].map(id=>this.release(id)));const error=results.find(r=>r.status==='rejected');if(error)throw error.reason;}
}
module.exports={PagedPdfService};
