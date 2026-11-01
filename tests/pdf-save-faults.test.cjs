const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {fork}=require('node:child_process');
const {once}=require('node:events');
const {PDFDocument}=require('pdf-lib');
const {stageOutput,publishOutput,digest}=require('../desktop/verified-output.cjs');
async function setup(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-audit-save-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const doc=await PDFDocument.create();doc.addPage([200,300]);
 const bytes=Buffer.from(await doc.save()),original=path.join(root,'original.pdf');await fs.writeFile(original,bytes);
 return {root,bytes,original};
}
test('injected disk-full after a partial write keeps original bytes and removes the owned stage',async t=>{
 const {root,bytes,original}=await setup(t),open=fs.open;let injected=false;
 fs.open=async function(file,...args){const handle=await open.call(this,file,...args);
  if(String(file).endsWith('.partial'))handle.writeFile=async data=>{await handle.write(data.subarray(0,17));injected=true;throw Object.assign(Error('Disk full'),{code:'ENOSPC'});};return handle;};
 try{await assert.rejects(stageOutput(root,bytes),{code:'ENOSPC'});}finally{fs.open=open;}
 assert.equal(injected,true);assert.deepEqual(await fs.readFile(original),bytes);assert.deepEqual(await fs.readdir(root),['original.pdf']);
});
test('injected locked publication refuses without leaving a copy or damaging the original',async t=>{
 const {root,bytes,original}=await setup(t),stage=await stageOutput(root,bytes),link=fs.link;
 fs.link=async()=>{throw Object.assign(Error('Sharing violation'),{code:'EBUSY'});};
 try{await assert.rejects(publishOutput(stage,path.join(root,'copy.pdf')),{code:'EBUSY'});}finally{fs.link=link;}
 assert.deepEqual(await fs.readFile(original),bytes);assert.deepEqual(await fs.readdir(root),['original.pdf']);
});
test('destination folder disappearing before publication preserves source and cleans stage',async t=>{
 const {root,bytes,original}=await setup(t),destination=path.join(root,'removed');await fs.mkdir(destination);
 const stage=await stageOutput(root,bytes);await fs.rmdir(destination);
 await assert.rejects(publishOutput(stage,path.join(destination,'copy.pdf')),{code:'ENOENT'});
 assert.deepEqual(await fs.readFile(original),bytes);assert.deepEqual(await fs.readdir(root),['original.pdf']);
});
test('cancellation just after publication removes only this operation’s two links',async t=>{
 const {root,bytes,original}=await setup(t);let canceled=false;
 const stage=await stageOutput(root,bytes,{check(){if(canceled)throw Error('Canceled');}}),link=fs.link;
 fs.link=async function(...args){await link.apply(this,args);canceled=true;};
 try{await assert.rejects(publishOutput(stage,path.join(root,'copy.pdf')),/Canceled/);}finally{fs.link=link;}
 assert.deepEqual(await fs.readFile(original),bytes);assert.deepEqual(await fs.readdir(root),['original.pdf']);
});
test('two concurrent copy publications produce one complete independently reopened file',async t=>{
 const {root,bytes,original}=await setup(t),secondDoc=await PDFDocument.create();secondDoc.addPage([400,500]);secondDoc.addPage();
 const second=Buffer.from(await secondDoc.save()),stages=await Promise.all([stageOutput(root,bytes),stageOutput(root,second)]),target=path.join(root,'copy.pdf');
 const results=await Promise.allSettled(stages.map(stage=>publishOutput(stage,target)));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.code,'EXISTS');
 const saved=await fs.readFile(target),winner=results.findIndex(r=>r.status==='fulfilled');assert.equal(digest(saved),digest(winner===0?bytes:second));
 assert.equal((await PDFDocument.load(saved)).getPageCount(),winner===0?1:2);assert.deepEqual(await fs.readFile(original),bytes);
 assert.deepEqual((await fs.readdir(root)).sort(),['copy.pdf','original.pdf']);
});
test('real child termination during staging leaves only an identifiable incomplete stage, never a final copy',async t=>{
 const {root,bytes,original}=await setup(t),childFile=path.join(root,'writer.cjs');
 await fs.writeFile(childFile,`const fs=require('node:fs/promises');const open=fs.open;
 fs.open=async function(file,...args){const h=await open.call(this,file,...args);h.writeFile=async b=>{await h.write(b.subarray(0,17));await h.sync();process.send({partial:file});await new Promise(()=>{});};return h;};
 require(${JSON.stringify(path.resolve('desktop/verified-output.cjs'))}).stageOutput(process.argv[2],Buffer.from(process.argv[3],'base64')).catch(e=>{console.error(e);process.exit(1)});`);
 const child=fork(childFile,[root,bytes.toString('base64')],{stdio:['ignore','pipe','pipe','ipc'],windowsHide:true});
 t.after(()=>{if(child.exitCode===null)child.kill();});
 const timer=setTimeout(()=>child.kill(),10000),exited=once(child,'exit');let message;
 try{[message]=await once(child,'message');child.kill();await exited;}finally{clearTimeout(timer);}
 assert.match(path.basename(message.partial),/^\.pdfix-[a-f0-9-]+\.partial$/);assert.equal((await fs.stat(message.partial)).size,17);
 assert.deepEqual(await fs.readFile(original),bytes);await assert.rejects(fs.access(path.join(root,'copy.pdf')),{code:'ENOENT'});
 // This is process-death evidence, not a promise that power loss cleans stages
 // or that the app recovers a drawing draft. Those are separate audit items.
});
