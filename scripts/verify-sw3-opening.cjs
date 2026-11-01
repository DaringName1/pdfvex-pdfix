'use strict';
// Focused, explicitly requested real-file check. All source parsing uses PDFix's
// contained service. This harness never starts qpdf outside that service.
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {performance}=require('node:perf_hooks');
const {randomUUID,createHash}=require('node:crypto');
const {createReadStream}=require('node:fs');
const {FileStore}=require('../desktop/file-store.cjs');
const {PagedPdfService}=require('../desktop/paged-pdf-service.cjs');
const {getReadingCapacity}=require('../desktop/reading-capacity.cjs');
async function main(){
 const root=path.resolve(__dirname,'..'),sourceFile='C:\\Users\\andre\\Downloads\\SW3.pdf for cal where i live.pdf';
 const label=process.argv[2]||'current',directory=path.join(root,'tmp','sw3-'+label+'-'+randomUUID());await fs.mkdir(directory,{recursive:true});
 const runtimeDirectory=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-SW3-'));
 const store=new FileStore(path.join(runtimeDirectory,'source')),service=new PagedPdfService({engineDirectory:path.join(root,'dist/native/qpdf'),stagingDirectory:path.join(runtimeDirectory,'parser')});
 store.readingProfile=bytes=>getReadingCapacity({pdfBytes:bytes});store.onReleaseSource=id=>service.release(id);
 const report={label,at:new Date().toISOString(),sourceFile,directory,runtimeDirectory,pages:[],originalUnchanged:false};
 const initial=await fs.stat(sourceFile);let opened;
 const stop=service.stopSession.bind(service);service.stopSession=async(session,error)=>{await stop(session,error);report.helperDiagnostics=Buffer.concat(session.protocol?.errors||[]).toString('utf8');};
 try{
  await store.init();const start=performance.now();opened=await store.open(sourceFile);report.sourceSha256=opened.sourceSha256;report.sourceBytes=opened.size;report.snapshotMs=Math.round(performance.now()-start);
  const source=store.source(opened.id),parserStart=performance.now();const metadata=await service.open(opened.id,source);report.parserOpenMs=Math.round(performance.now()-parserStart);report.metadata=metadata;
  const pages=[1,Math.ceil(metadata.pageCount/2),metadata.pageCount,1];
  for(const page of pages){const began=performance.now(),result=await service.page(opened.id,source,page,randomUUID());report.pages.push({page,ms:Math.round(performance.now()-began),bytes:result.bytes.byteLength,sha256:result.sha256,diagnostics:result.diagnostics||null});await fs.writeFile(path.join(directory,'page-'+page+'.pdf'),result.bytes);result.bytes.fill(0);}
  const token=randomUUID(),request=service.page(opened.id,source,351,token).then(()=>({completed:true}),error=>({code:error.code}));
  for(let attempt=0;attempt<200&&!service.active;attempt++)await new Promise(resolve=>setTimeout(resolve,5));
  report.cancelAccepted=await service.cancel(opened.id,token);report.canceledRequest=await request;
  if(!report.cancelAccepted||report.canceledRequest.code!=='CANCELED')throw new Error('The active page request was not canceled.');
  const recovered=await service.page(opened.id,source,352,randomUUID());report.afterCancel=recovered.diagnostics;recovered.bytes.fill(0);
  await service.release(opened.id);report.reopened=await service.open(opened.id,source);const reopened=await service.page(opened.id,source,1,randomUUID());report.reopenedPageHash=reopened.sha256;report.reopenedPageBytes=reopened.bytes.byteLength;reopened.bytes.fill(0);
  // Fresh qpdf outputs generate a new document ID; byte hashes across parser
  // lifetimes need not match. The independent rendering check covers fidelity.
  report.pass=true;
 }catch(error){report.pass=false;report.error={code:error.code||error.name,message:error.message};}
 finally{
  const large=store.largePdfs;if(large.root){const marker=await large.readOwner(large.root);report.markerCheck={readable:!!marker,matchingId:marker?.owner.id===large.owner.id,files:large.owner.files.length,differences:marker?['size','dev','ino','mtimeMs','ctimeMs'].filter(k=>marker.stat[k]!==large.ownerStat[k]):[]};}
  try{if(opened)await service.release(opened.id);await service.dispose();await store.dispose();report.cleanupObserved=true;}catch(error){report.cleanupObserved=false;report.cleanupError=error.message;report.cleanupCause=error.cause?{code:error.cause.code,message:error.cause.message}:null;}
  const after=await fs.stat(sourceFile),hash=createHash('sha256');for await(const chunk of createReadStream(sourceFile,{highWaterMark:256*1024}))hash.update(chunk);report.finalSourceSha256=hash.digest('hex');report.originalUnchanged=report.finalSourceSha256===report.sourceSha256&&['size','dev','ino','mtimeMs','ctimeMs'].every(key=>initial[key]===after[key]);
  await fs.writeFile(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }
 process.exitCode=report.pass&&report.cleanupObserved&&report.originalUnchanged?0:1;
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
