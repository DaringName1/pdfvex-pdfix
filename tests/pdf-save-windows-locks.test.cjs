'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process'),{once}=require('node:events');
const {PDFDocument}=require('pdf-lib');
const {stageOutput,stageStreamOutput,publishOutput,digest}=require('../desktop/verified-output.cjs');
async function fixture(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-native-lock-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const doc=await PDFDocument.create();doc.addPage([210,297]);const bytes=Buffer.from(await doc.save()),source=path.join(root,'source.pdf');await fs.writeFile(source,bytes);return {root,source,bytes};
}
async function hold(file){
 const script="$ErrorActionPreference='Stop';$stream=[IO.File]::Open($env:PDFIX_AUDIT_LOCK_PATH,[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None);try{[Console]::WriteLine('LOCKED');[Console]::Out.Flush();[void][Console]::ReadLine()}finally{$stream.Dispose()}";
 const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,stdio:['pipe','pipe','pipe'],env:{...process.env,PDFIX_AUDIT_LOCK_PATH:file}});
 let text='',errors='';child.stdout.on('data',b=>text+=b);child.stderr.on('data',b=>errors+=b);
 const exited=once(child,'exit');let timer;
 try{await Promise.race([new Promise((resolve,reject)=>{const check=()=>{if(text.includes('LOCKED'))resolve();};child.stdout.on('data',check);child.once('error',reject);child.once('exit',()=>reject(Error('Lock holder exited: '+errors)));check();}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Native lock was not acknowledged: '+errors)),10000);})]);}
 catch(e){child.kill();await exited.catch(()=>{});throw e;}finally{clearTimeout(timer);}
 return async()=>{child.stdin.end('\n');let timeout;try{await Promise.race([exited,new Promise((_,reject)=>{timeout=setTimeout(()=>{child.kill();reject(Error('Native lock holder failed to release'));},10000);})]);}finally{clearTimeout(timeout);}assert.equal(child.exitCode,0,errors);};
}
const win={skip:process.platform!=='win32',timeout:30000};
test('real Windows exclusive destination lock preserves the existing PDF and cleans the new stage',win,async t=>{
 const {root,source,bytes}=await fixture(t),target=path.join(root,'existing.pdf');await fs.writeFile(target,bytes);const release=await hold(target);let result;
 try{const stage=await stageOutput(root,bytes);try{await publishOutput(stage,target);}catch(e){result=e;}assert.ok(result,'Locked existing target must not be overwritten');assert.match(result.code,/^(EXISTS|EACCES|EBUSY|EPERM|FILESYSTEM)$/);}
 finally{await release();}
 assert.deepEqual(await fs.readFile(source),bytes);assert.deepEqual(await fs.readFile(target),bytes);assert.equal((await PDFDocument.load(await fs.readFile(target))).getPageCount(),1);assert.deepEqual((await fs.readdir(root)).sort(),['existing.pdf','source.pdf']);
});
test('real Windows source lock refuses a retained-stream copy without publishing or leaving a stage',win,async t=>{
 const {root,source,bytes}=await fixture(t),release=await hold(source);let error;
 async function* chunks(){const handle=await fs.open(source,'r');try{yield await handle.readFile();}finally{await handle.close();}}
 try{await assert.rejects(stageStreamOutput(root,{size:bytes.length,sha256:digest(bytes),chunks:chunks()}),e=>{error=e;return ['EACCES','EBUSY','EPERM'].includes(e.code);});}finally{await release();}
 assert.ok(error);assert.deepEqual(await fs.readFile(source),bytes);assert.deepEqual(await fs.readdir(root),['source.pdf']);
});
test('real Windows staging lock reports retained owned artifact rather than pretending failed cleanup succeeded',win,async t=>{
 const {root,source,bytes}=await fixture(t),stage=await stageOutput(root,bytes),target=path.join(root,'copy.pdf'),release=await hold(stage.temporary);let error;
 try{await assert.rejects(publishOutput(stage,target),e=>{error=e;return e.code==='PARTIAL';});}finally{await release();}
 assert.match(error.message,/no success is assumed|not a completed copy/);assert.deepEqual(await fs.readFile(source),bytes);
 assert.deepEqual(await fs.readFile(stage.temporary),bytes);const names=await fs.readdir(root);assert.ok(names.includes(path.basename(stage.temporary)));
 // Windows may refuse linking the locked file, or allow linking and then block verification/cleanup.
 // Any final link is reported as failed, and must still be the complete original staged object.
 if(names.includes('copy.pdf')){assert.match(error.message,/copy\.pdf/);assert.deepEqual(await fs.readFile(target),bytes);assert.equal((await PDFDocument.load(await fs.readFile(target))).getPageCount(),1);}
});
