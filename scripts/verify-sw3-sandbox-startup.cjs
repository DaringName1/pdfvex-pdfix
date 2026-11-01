'use strict';
// Fixed SW3 diagnostic, using the existing AppContainer broker only.
const fs=require('node:fs/promises'),path=require('node:path');
const {randomUUID}=require('node:crypto');
const {FileStore}=require('../desktop/file-store.cjs');
const {NativeSandbox}=require('../desktop/native-sandbox.cjs');
async function main(){
 const root=path.resolve(__dirname,'..'),directory=path.join(root,'tmp','sw3-startup-'+randomUUID());await fs.mkdir(directory,{recursive:true});
 const store=new FileStore(path.join(directory,'source')),sandbox=new NativeSandbox(path.join(root,'dist/native/qpdf'));
 const report={directory,at:new Date().toISOString(),contained:true},job={folder:null,token:randomUUID(),canceled:false};
 try{
  await store.init();const opened=await store.open('C:\\Users\\andre\\Downloads\\SW3.pdf for cal where i live.pdf'),source=store.source(opened.id);report.sourceSha256=opened.sourceSha256;
  job.folder=await fs.mkdtemp(path.join(directory,'job-'));await fs.writeFile(path.join(job.folder,'.pdfix-job.json'),JSON.stringify({owner:'PDFix paged reader',version:1,token:job.token}),{flag:'wx'});
  await source.pagedInput().stage(path.join(job.folder,'input.pdf'));
  const start=Date.now(),child=await sandbox.launchPaged(job,[path.join(job.folder,'input.pdf'),'--json=2','--json-key=encrypt'],()=>{});let output='',diagnostics='',overflow=false;
  child.stdout.on('data',part=>{output+=part;if(output.length>65536){overflow=true;child.kill();}});child.stderr.on('data',part=>{diagnostics+=part;if(diagnostics.length>65536){overflow=true;child.kill();}});
  const exit=await job.brokerExit;report.ms=Date.now()-start;report.exit=exit;report.windowsHex=(exit.code>>>0).toString(16);report.diagnostics=diagnostics.slice(-16000);report.pass=!overflow&&!exit.launchError&&[0,3].includes(exit.code);
  if(report.pass){const json=JSON.parse(output);report.encrypted=json.encrypt?.encrypted;}
 }catch(error){report.pass=false;report.error={code:error.code||error.name,message:error.message};}
 finally{
  if(job.folder){try{report.sandboxCleanup=await sandbox.cleanup(job.folder);if(report.sandboxCleanup){for(const leaf of ['input.pdf','output.pdf','.pdfix-job.json'])await fs.unlink(path.join(job.folder,leaf)).catch(error=>{if(error.code!=='ENOENT')throw error;});await fs.rmdir(job.folder);}}catch(error){report.cleanupError=error.message;}}
  await store.dispose().catch(error=>{report.sourceCleanupError=error.message;report.cleanupCause=error.cause?{code:error.cause.code,message:error.cause.message}:null;});await fs.writeFile(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }
 process.exitCode=report.pass?0:1;
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
