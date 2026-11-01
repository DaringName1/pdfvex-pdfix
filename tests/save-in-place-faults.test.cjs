'use strict';
// V1 audit, area 4 (failure recovery), Claude's lane: saving a document over the file it was opened from (the
// editor's Save / Ctrl+S) must never damage the original. Each case checks the bytes on disk afterwards, that no
// temporary file is left beside the document, and that a plain message says what to do.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process'),{once}=require('node:events');
const {FileStore}=require('../desktop/file-store.cjs');
async function fixture(t,text='First version.'){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-in-place-fault-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const store=new FileStore(path.join(root,'metadata'));await store.init();const folder=path.join(root,'documents');await fs.mkdir(folder);
 const original=path.join(folder,'notes.txt');await fs.writeFile(original,text);return {root,folder,store,original,opened:await store.open(original)};
}
const leftovers=async folder=>(await fs.readdir(folder)).filter(name=>name!=='notes.txt');
// Holds a real Windows lock on a file from another process, the way Word (share: read) or a stricter program
// (share: none) does, until released.
async function hold(file,share){
 const script=`$ErrorActionPreference='Stop';$s=[IO.File]::Open($env:PDFIX_LOCK,[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::${share});try{[Console]::WriteLine('LOCKED');[Console]::Out.Flush();[void][Console]::ReadLine()}finally{$s.Dispose()}`;
 const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,stdio:['pipe','pipe','pipe'],env:{...process.env,PDFIX_LOCK:file}});
 let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);const exited=once(child,'exit');
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('lock not taken: '+err)),15000);const check=()=>{if(out.includes('LOCKED')){clearTimeout(timer);resolve();}};child.stdout.on('data',check);child.once('exit',()=>{clearTimeout(timer);reject(Error('lock holder exited: '+err));});check();});
 return async()=>{child.stdin.end('\n');await exited;};
}
const win={skip:process.platform!=='win32',timeout:60000};

test('a document open in another program that allows reading (like Word) is not replaced; saving works once it is closed',win,async t=>{
 const {folder,store,original,opened}=await fixture(t),release=await hold(original,'Read');
 try{await assert.rejects(store.saveInPlace(opened.id,Buffer.from('PDFix version.')),error=>error.code==='LOCKED'&&/open or locked in another program/.test(error.message));}
 finally{await release();}
 assert.equal(await fs.readFile(original,'utf8'),'First version.');assert.deepEqual(await leftovers(folder),[]);
 await store.saveInPlace(opened.id,Buffer.from('PDFix version.'));assert.equal(await fs.readFile(original,'utf8'),'PDFix version.');
});

test('a document locked so that even reading is refused says it is open elsewhere, not that it is missing',win,async t=>{
 const {folder,store,original,opened}=await fixture(t),release=await hold(original,'None');
 try{await assert.rejects(store.saveInPlace(opened.id,Buffer.from('PDFix version.')),error=>error.code==='LOCKED'&&/open or locked in another program/.test(error.message));}
 finally{await release();}
 assert.equal(await fs.readFile(original,'utf8'),'First version.');assert.deepEqual(await leftovers(folder),[]);
});

test('the disk filling up while the new version is written keeps the original and leaves no partial file',async t=>{
 const {folder,store,original,opened}=await fixture(t),open=fs.open;let injected=false;
 fs.open=async function(file,...args){const handle=await open.call(this,file,...args);if(String(file).endsWith('.partial'))handle.writeFile=async data=>{await handle.write(data.subarray(0,5));injected=true;throw Object.assign(Error('Disk full'),{code:'ENOSPC'});};return handle;};
 try{await assert.rejects(store.saveInPlace(opened.id,Buffer.from('A longer PDFix version.')));}finally{fs.open=open;}
 assert.equal(injected,true);assert.equal(await fs.readFile(original,'utf8'),'First version.');assert.deepEqual(await leftovers(folder),[]);
 await store.saveInPlace(opened.id,Buffer.from('Saved after space was freed.'));assert.equal(await fs.readFile(original,'utf8'),'Saved after space was freed.');
});

test('the folder disappearing (USB stick or network drive removed) refuses with a plain message',async t=>{
 const {folder,store,opened}=await fixture(t);await fs.rm(folder,{recursive:true,force:true});
 await assert.rejects(store.saveInPlace(opened.id,Buffer.from('PDFix version.')),error=>error.code==='MISSING'&&/no longer where it was opened/.test(error.message));
});

test('two saves of the same document at the same moment leave one complete version, never a mix',async t=>{
 const {folder,store,original,opened}=await fixture(t),a='A'.repeat(200000),b='B'.repeat(150000);
 const results=await Promise.allSettled([a,b].map(async text=>store.saveInPlace(opened.id,Buffer.from(text))));
 assert.ok(results.some(r=>r.status==='fulfilled'),'at least one save completes');const text=await fs.readFile(original,'utf8');assert.ok(text===a||text===b,'the file is exactly one of the two versions');
 for(const r of results)if(r.status==='rejected')assert.match(r.reason.message,/Finish the current|changed by another program/);assert.deepEqual(await leftovers(folder),[]);
});
