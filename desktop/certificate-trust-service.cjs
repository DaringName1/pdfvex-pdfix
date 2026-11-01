'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),{spawn}=require('node:child_process');
const {hash,validCertificateBundle,validChainInspection}=require('./pdf-certificate-validation.cjs');
// Updated deliberately when the reviewed fixed native adapter changes. A
// replaced manifest cannot authorize a different native source implementation.
const SOURCE_SHA256='3ae1f24662f99cf76f9d073f5bde4e52a190c0dc9d98707e2dfa134a789d7c96';
const POLICY='windows-offline-base-chain-v1',MAX_OUTPUT=1024*1024;
const fail=message=>{throw new Error(message);};
async function readRegular(filename,maximum){
 let current=path.resolve(filename);while(true){const stat=await fs.lstat(current);if(stat.isSymbolicLink())fail('Linked certificate trust helper paths are unsupported.');const parent=path.dirname(current);if(parent===current)break;current=parent;}
 const stat=await fs.lstat(filename);if(!stat.isFile()||stat.size<1||stat.size>maximum)fail('The certificate trust helper file exceeds its bounds.');const bytes=await fs.readFile(filename);if(bytes.length!==stat.size||bytes.length>maximum)fail('The certificate trust helper changed during verification.');return bytes;
}
class CertificateTrustService{
 constructor({trustHelperPath=path.resolve(__dirname,'../dist/native/certificate-trust/PDFix.CertificateTrust.exe')}={}){
  if(typeof trustHelperPath!=='string'||!path.isAbsolute(trustHelperPath)||path.basename(trustHelperPath)!=='PDFix.CertificateTrust.exe')fail('Certificate trust requires the fixed application helper path.');
  this.helperPath=trustHelperPath;this.active=null;this.closed=false;
 }
 async helper(){
  if(process.platform!=='win32'||process.arch!=='x64')fail('Offline Windows certificate trust requires Windows x64.');
  const manifest=JSON.parse((await readRegular(path.join(path.dirname(this.helperPath),'manifest.json'),8192)).toString('utf8'));
  if(!manifest||Object.keys(manifest).sort().join(',')!==['version','policy','platform','file','bytes','sha256','sourceSha256','notice'].sort().join(',')||manifest.version!==1||manifest.policy!==POLICY||manifest.platform!=='win32-x64'||manifest.file!=='PDFix.CertificateTrust.exe'||manifest.notice!=='NOTICE.txt'||manifest.sourceSha256!==SOURCE_SHA256||!Number.isSafeInteger(manifest.bytes)||manifest.bytes<1||manifest.bytes>8*1024*1024||!/^[a-f0-9]{64}$/.test(manifest.sha256))fail('The offline certificate trust helper manifest failed its source pin.');
  const bytes=await readRegular(this.helperPath,8*1024*1024);if(bytes.length!==manifest.bytes||hash(bytes)!==manifest.sha256||bytes.toString('ascii',0,2)!=='MZ')fail('The offline certificate trust helper failed its executable SHA-256 pin.');
  return this.helperPath;
 }
 async inspect(report,{signal}={}){
  if(this.active||this.closed)fail('The offline certificate trust service is busy or closed.');
  const signatures=report.signatures.filter(row=>row.integrity==='verified').map(row=>({index:row.index,signerFingerprintSha256:row.signer.fingerprintSha256,certificates:validCertificateBundle(row.certificateBundle,row.signer.fingerprintSha256)}));
  if(!signatures.length)return [];
  const request=Buffer.from(JSON.stringify({version:1,operation:'inspect-offline-v1',sourceSha256:report.sourceSha256,signatures}));if(request.length>6*1024*1024)fail('The offline certificate trust request exceeds its byte limit.');
  const job={child:null,observed:false,unsafe:false,canceled:false,stop:null,done:null};let finish;job.done=new Promise(resolve=>{finish=resolve;});this.active=job;
  const abort=()=>{job.canceled=true;job.stop?.('Offline certificate inspection canceled.');};signal?.addEventListener('abort',abort,{once:true});
  try{
   const executable=await this.helper();if(signal?.aborted||job.canceled)fail('Offline certificate inspection canceled.');
   const output=await new Promise((resolve,reject)=>{
    let total=0,chunks=[],failure=null,settled=false,stopTimer=null;
    const finishChild=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);clearTimeout(stopTimer);job.stop=null;error?reject(error):resolve(value);};
    const child=spawn(executable,['inspect-offline-v1'],{cwd:path.dirname(executable),shell:false,windowsHide:true,stdio:['pipe','pipe','pipe'],env:{SystemRoot:process.env.SystemRoot,windir:process.env.windir}});job.child=child;
    const stop=message=>{failure=failure||new Error(message);child.kill();if(!stopTimer)stopTimer=setTimeout(()=>{job.unsafe=true;this.closed=true;finishChild(new Error('Certificate helper termination was not observed. This service remains closed.'));},5000);};job.stop=stop;
    const timer=setTimeout(()=>stop('Offline certificate inspection exceeded its 30-second limit.'),30000);
    child.stdout.on('data',part=>{total+=part.length;if(total>MAX_OUTPUT){stop('The offline certificate result exceeded its byte limit.');return;}chunks.push(part);});
    child.stdout.on('error',()=>stop('The offline certificate result pipe failed.'));child.stderr.on('data',()=>stop('The offline certificate helper could not complete inspection.'));child.stderr.on('error',()=>stop('The offline certificate diagnostic pipe failed.'));
    child.stdin.on('error',()=>stop('The offline certificate input pipe failed.'));
    child.once('error',()=>{if(!child.pid){job.observed=true;finishChild(new Error('The offline certificate helper could not start.'));}else stop('The offline certificate helper failed.');});
    child.once('close',code=>{job.observed=true;if(code!==0&&!failure)failure=new Error('The offline certificate helper failed.');finishChild(failure,failure?null:Buffer.concat(chunks,total));});
    child.stdin.end(request);if(job.canceled||signal?.aborted)abort();
   });
   if(job.canceled||signal?.aborted)fail('Offline certificate inspection canceled.');
   const envelope=JSON.parse(output.toString('utf8'));
   if(!envelope||Object.keys(envelope).sort().join(',')!==['version','operation','sourceSha256','requestSha256','results'].sort().join(',')||envelope.version!==1||envelope.operation!=='inspect-offline-v1'||envelope.sourceSha256!==report.sourceSha256||envelope.requestSha256!==hash(request)||!Array.isArray(envelope.results)||envelope.results.length!==signatures.length)fail('The offline certificate result failed request binding.');
   for(const [index,result]of envelope.results.entries()){
    if(!result||Object.keys(result).sort().join(',')!=='chainInspection,index,trust'||result.index!==signatures[index].index)fail('The offline certificate result has an invalid signer identity.');
    validChainInspection(result.chainInspection,{...report.signatures[result.index-1],trust:result.trust});
   }
   return envelope.results;
  }finally{signal?.removeEventListener('abort',abort);request.fill(0);if(job.child&&!job.observed){job.unsafe=true;this.closed=true;}if(!job.unsafe&&this.active===job)this.active=null;finish();}
 }
 async cancel(){const job=this.active;if(!job)return true;job.canceled=true;job.stop?.('Offline certificate inspection canceled.');await job.done;return !job.unsafe;}
 async dispose(){this.closed=true;if(!await this.cancel())fail('Certificate helper termination was not observed. This service remains closed.');}
}
module.exports={CertificateTrustService,SOURCE_SHA256};
