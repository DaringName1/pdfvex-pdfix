'use strict';
const fs=require('node:fs/promises'),{renameWithRetry}=require('./rename-retry.cjs'),path=require('node:path'),{spawn}=require('node:child_process'),{createHash,randomUUID}=require('node:crypto');
const SOURCE_SHA256='26555c3a8f6d4cefc5864f5e8ad265d774ac2bb023cb635720c8553e3743a39c';
const POLICY='windows-local-spelling-v1',MAX_TEXT=100000,MAX_OUTPUT=1024*1024,MAX_DICTIONARY=2*1024*1024;
const hash=value=>createHash('sha256').update(value).digest('hex');
const fail=message=>{throw new Error(message);};
const keys=(value,expected)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===expected.slice().sort().join(',');
const validTag=value=>typeof value==='string'&&value.length<=64&&/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(value);
const validText=(value,max,empty=true)=>typeof value==='string'&&(empty||value.length>0)&&value.length<=max&&!/\u0000|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value);
const wordKey=value=>value.normalize('NFC').toLowerCase();
function words(value){
 if(!Array.isArray(value)||value.length>10000)fail('A personal dictionary supports at most 10,000 words per language.');
 const seen=new Set();return value.map(word=>{if(!validText(word,128,false)||/[\s\x00-\x1f\x7f]/u.test(word))fail('Personal dictionary words must be single words of at most 128 characters.');const key=wordKey(word);if(seen.has(key))fail('Personal dictionary words must be unique.');seen.add(key);return word.normalize('NFC');});
}
async function noLinks(filename,{allowMissing=false}={}){
 let current=path.resolve(filename);while(true){try{if((await fs.lstat(current)).isSymbolicLink())fail('Linked local spelling paths are unsupported.');}catch(error){if(error.code!=='ENOENT'||!allowMissing)throw error;}const parent=path.dirname(current);if(parent===current)break;current=parent;}
}
async function readRegular(filename,maximum){await noLinks(filename);const stat=await fs.lstat(filename);if(!stat.isFile()||stat.size<1||stat.size>maximum)fail('A local spelling file exceeds its bounds.');const bytes=await fs.readFile(filename);if(bytes.length!==stat.size||bytes.length>maximum)fail('A local spelling file changed during verification.');return bytes;}
function dictionaryValue(value){
 if(!keys(value,['version','languages'])||value.version!==1||!value.languages||typeof value.languages!=='object'||Array.isArray(value.languages)||Object.keys(value.languages).length>64)fail('The personal spelling dictionary is invalid.');
 const languages=Object.create(null);let total=0;for(const [tag,list]of Object.entries(value.languages)){if(!validTag(tag))fail('The personal dictionary language is invalid.');languages[tag]=words(list);total+=languages[tag].length;}if(total>20000)fail('The personal dictionary supports at most 20,000 words in total.');return {version:1,languages};
}
class LocalSpellingService{
 constructor({helperPath=path.resolve(__dirname,'../dist/native/local-spelling/PDFix.LocalSpelling.exe'),dictionaryPath}={}){
  if(!path.isAbsolute(helperPath)||path.basename(helperPath)!=='PDFix.LocalSpelling.exe')fail('Local spelling requires the fixed application helper.');
  if(typeof dictionaryPath!=='string'||!path.isAbsolute(dictionaryPath))fail('The personal dictionary needs an application-owned storage path.');
  this.helperPath=helperPath;this.dictionaryPath=dictionaryPath;this.active=null;this.closed=false;this.dictionaryWrites=Promise.resolve();this.cancelEpoch=0;
 }
 async helper(){
  if(process.platform!=='win32'||process.arch!=='x64')fail('Free local spell checking requires Windows x64 and an installed Windows language dictionary.');
  let manifest;try{manifest=JSON.parse((await readRegular(path.join(path.dirname(this.helperPath),'manifest.json'),8192)).toString('utf8'));}catch(error){if(error.code==='ENOENT')fail('The local Windows spelling helper has not been built. Build the supplied helper with the installed .NET compiler.');throw error;}
  if(!keys(manifest,['version','policy','platform','file','bytes','sha256','sourceSha256','notice'])||manifest.version!==1||manifest.policy!==POLICY||manifest.platform!=='win32-x64'||manifest.file!=='PDFix.LocalSpelling.exe'||manifest.notice!=='NOTICE.txt'||manifest.sourceSha256!==SOURCE_SHA256||!Number.isSafeInteger(manifest.bytes)||manifest.bytes<1||manifest.bytes>8*1024*1024||!/^[a-f0-9]{64}$/.test(manifest.sha256))fail('The local spelling helper manifest failed its source pin.');
  const bytes=await readRegular(this.helperPath,8*1024*1024);if(bytes.length!==manifest.bytes||hash(bytes)!==manifest.sha256||bytes.toString('ascii',0,2)!=='MZ')fail('The local spelling executable failed its SHA-256 pin.');return this.helperPath;
 }
 async dictionary(){
  await this.dictionaryWrites;try{return dictionaryValue(JSON.parse((await readRegular(this.dictionaryPath,MAX_DICTIONARY)).toString('utf8')));}catch(error){if(error.code==='ENOENT')return {version:1,languages:{}};throw error;}
 }
 async updateDictionary(input){
  if(!keys(input,['language','words'])||!validTag(input.language))fail('Choose a valid personal dictionary language.');const list=words(input.words);
  const operation=this.dictionaryWrites.then(async()=>{
   if(this.closed)fail('Local spelling is closed.');let value;try{value=dictionaryValue(JSON.parse((await readRegular(this.dictionaryPath,MAX_DICTIONARY)).toString('utf8')));}catch(error){if(error.code!=='ENOENT')throw error;value={version:1,languages:{}};}
   if(list.length)value.languages[input.language]=list;else delete value.languages[input.language];value=dictionaryValue(value);const encoded=Buffer.from(JSON.stringify(value,null,2)+'\n');if(encoded.length>MAX_DICTIONARY)fail('The personal dictionary exceeds its storage limit.');
   await noLinks(this.dictionaryPath,{allowMissing:true});await fs.mkdir(path.dirname(this.dictionaryPath),{recursive:true});await noLinks(path.dirname(this.dictionaryPath));
   const temporary=this.dictionaryPath+'.'+randomUUID()+'.tmp';let handle;
   try{handle=await fs.open(temporary,'wx',0o600);await handle.writeFile(encoded);await handle.sync();await handle.close();handle=null;await noLinks(this.dictionaryPath,{allowMissing:true});await renameWithRetry(temporary,this.dictionaryPath);}finally{await handle?.close();await fs.unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;});encoded.fill(0);}
   return value;
  });this.dictionaryWrites=operation.catch(()=>{});return operation;
 }
 async invoke(input,{signal}={}){
  if(this.active||this.closed)fail('Local spelling is busy or closed.');const request=Buffer.from(JSON.stringify(input));if(request.length>800000)fail('The local spelling request exceeds its byte limit.');
  const job={child:null,observed:false,unsafe:false,canceled:false,stop:null,done:null};let done;job.done=new Promise(resolve=>{done=resolve;});this.active=job;
  const abort=()=>{job.canceled=true;job.stop?.('Local spelling canceled.');};signal?.addEventListener('abort',abort,{once:true});
  try{
   const executable=await this.helper();if(signal?.aborted||job.canceled)fail('Local spelling canceled.');
   const {output,code}=await new Promise((resolve,reject)=>{
    let size=0,chunks=[],failure=null,settled=false,stopTimer=null;
    const finish=(error,result)=>{if(settled)return;settled=true;clearTimeout(timer);clearTimeout(stopTimer);job.stop=null;error?reject(error):resolve(result);};
    const child=spawn(executable,['local-spelling-v1',String(process.pid)],{cwd:path.dirname(executable),shell:false,windowsHide:true,stdio:['pipe','pipe','pipe'],env:{SystemRoot:process.env.SystemRoot,windir:process.env.windir}});job.child=child;
    const stop=message=>{failure??=new Error(message);child.kill();if(!stopTimer)stopTimer=setTimeout(()=>{job.unsafe=true;this.closed=true;finish(new Error('Spelling helper termination was not observed. Local spelling remains closed.'));},5000);};job.stop=stop;
    const timer=setTimeout(()=>stop('Local spell checking exceeded its 15-second limit. Try a smaller text selection.'),15000);
    child.stdout.on('data',part=>{if(failure)return;if(size+part.length>MAX_OUTPUT){stop('The local spelling result exceeded its byte limit.');return;}size+=part.length;chunks.push(part);});
    child.stdout.on('error',()=>stop('The local spelling result pipe failed.'));child.stderr.on('data',()=>stop('The local spelling helper diagnostic pipe reported a failure.'));child.stderr.on('error',()=>stop('The local spelling diagnostic pipe failed.'));child.stdin.on('error',()=>stop('The local spelling input pipe failed.'));
    child.once('error',()=>{if(!child.pid){job.observed=true;finish(new Error('The local Windows spelling helper could not start.'));}else stop('The local spelling helper failed.');});
    child.once('close',code=>{job.observed=true;finish(failure,{code,output:Buffer.concat(chunks,size)});});child.stdin.end(request);if(signal?.aborted||job.canceled)abort();
   });
   if(signal?.aborted||job.canceled)fail('Local spelling canceled.');let envelope;try{envelope=JSON.parse(output.toString('utf8'));}catch{fail('The local spelling helper returned invalid JSON.');}
   if(!envelope||envelope.version!==1||envelope.requestSha256!==hash(request)||typeof envelope.ok!=='boolean')fail('The local spelling result failed request binding.');
   if(!envelope.ok){if(!keys(envelope,['version','requestSha256','ok','error'])||code!==1||!validText(envelope.error,400,false))fail('The local spelling helper returned an invalid error.');fail(envelope.error);}
   if(code!==0||!keys(envelope,['version','requestSha256','ok','result']))fail('The local spelling helper failed.');return envelope.result;
  }finally{signal?.removeEventListener('abort',abort);request.fill(0);if(job.child&&!job.observed){job.unsafe=true;this.closed=true;}if(!job.unsafe&&this.active===job)this.active=null;done();}
 }
 async languages(options){
  const result=await this.invoke({version:1,operation:'languages'},options);
  if(!keys(result,['languages','provider','notice'])||result.provider!=='windows-local'||!validText(result.notice,400,false)||!Array.isArray(result.languages)||result.languages.length>256)fail('Windows returned an invalid language list.');const seen=new Set();
  for(const row of result.languages){if(!keys(row,['tag','label'])||!validTag(row.tag)||!validText(row.label,200,false)||seen.has(row.tag))fail('Windows returned an invalid language.');seen.add(row.tag);}return result;
 }
 async check(input,options){
  if(!keys(input,input?.ignoreWords===undefined?['text','language','revision']:['text','language','revision','ignoreWords'])||!validText(input.text,MAX_TEXT)||!validTag(input.language)||!(Number.isSafeInteger(input.revision)||validText(input.revision,200,false)))fail('Local spelling needs bounded text, an installed language and a source revision.');
  const epoch=this.cancelEpoch,ignored=words(input.ignoreWords||[]),dictionary=await this.dictionary();if(epoch!==this.cancelEpoch||options?.signal?.aborted)fail('Local spelling canceled.');const accepted=new Set([...(dictionary.languages[input.language]||[]),...ignored].map(wordKey));
  const result=await this.invoke({version:1,operation:'check',language:input.language,text:input.text},options);
  if(!keys(result,['language','findings','truncated','provider'])||result.language!==input.language||result.provider!=='windows-local'||typeof result.truncated!=='boolean'||!Array.isArray(result.findings)||result.findings.length>400)fail('Windows returned an invalid spelling result.');let previousEnd=0;
  for(const row of result.findings){if(!keys(row,['start','length','word','action','suggestions'])||!Number.isSafeInteger(row.start)||!Number.isSafeInteger(row.length)||row.start<previousEnd||row.length<1||row.length>128||row.start+row.length>input.text.length||input.text.slice(row.start,row.start+row.length)!==row.word||!['suggest','replace','delete'].includes(row.action)||!Array.isArray(row.suggestions)||row.suggestions.length>8||row.suggestions.some(suggestion=>!validText(suggestion,128)))fail('Windows returned an invalid source-bound spelling finding.');previousEnd=row.start+row.length;}
  return {...result,revision:input.revision,findings:result.findings.filter(row=>!accepted.has(wordKey(row.word)))};
 }
 async cancel(){this.cancelEpoch++;const job=this.active;if(!job)return true;job.canceled=true;job.stop?.('Local spelling canceled.');await job.done;return !job.unsafe;}
 async dispose(){this.closed=true;await this.dictionaryWrites;if(!await this.cancel())fail('Spelling helper termination was not observed.');}
}
module.exports={LocalSpellingService,SOURCE_SHA256,MAX_TEXT};
