const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {stageOutput,stageStreamOutput,publishOutput,digest}=require('../desktop/verified-output.cjs');
const {PageWorkflows}=require('../desktop/page-workflows.cjs');
const {SheetSets}=require('../desktop/sheet-sets.cjs');
async function folder(t){const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-save-safety-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));return root;}
test('reviewed output is complete and reread before the final name appears',async t=>{
 const root=await folder(t),bytes=Buffer.from('%PDF-reviewed copy'),target=path.join(root,'copy.pdf');
 const stage=await stageOutput(root,bytes);assert.deepEqual(await fs.readdir(root),[path.basename(stage.temporary)]);
 assert.deepEqual(await fs.readFile(stage.temporary),bytes);const receipt=await publishOutput(stage,target);
 assert.equal(receipt.sha256,digest(bytes));assert.deepEqual(await fs.readFile(target),bytes);assert.deepEqual(await fs.readdir(root),['copy.pdf']);
});
test('a collision preserves the existing file and removes only the new stage',async t=>{
 const root=await folder(t),target=path.join(root,'original.pdf'),original=Buffer.from('original');await fs.writeFile(target,original);
 const stage=await stageOutput(root,Buffer.from('reviewed copy'));await assert.rejects(publishOutput(stage,target),{code:'EXISTS'});
 assert.deepEqual(await fs.readFile(target),original);assert.deepEqual(await fs.readdir(root),['original.pdf']);
});
test('cancellation after staging publishes nothing and removes its temporary file',async t=>{
 const root=await folder(t);let canceled=false;const stage=await stageOutput(root,Buffer.from('reviewed'),{check(){if(canceled)throw Error('Canceled');}});
 canceled=true;await assert.rejects(publishOutput(stage,path.join(root,'copy.pdf')),/Canceled/);assert.deepEqual(await fs.readdir(root),[]);
});
test('disk corruption after staging cannot leave a published bad copy',async t=>{
 const root=await folder(t),bytes=Buffer.from('reviewed copy'),stage=await stageOutput(root,bytes);
 await fs.writeFile(stage.temporary,Buffer.alloc(bytes.length,120));
 await assert.rejects(publishOutput(stage,path.join(root,'copy.pdf')),{code:'VERIFY'});assert.deepEqual(await fs.readdir(root),[]);
});
test('a canceled retained-source stream leaves neither output nor partial file',async t=>{
 const root=await folder(t),bytes=Buffer.from('firstsecond');let canceled=false;
 const chunks={async *[Symbol.asyncIterator](){yield bytes.subarray(0,5);canceled=true;yield bytes.subarray(5);}};
 await assert.rejects(stageStreamOutput(root,{size:bytes.length,sha256:digest(bytes),chunks},{check(){if(canceled)throw Error('Canceled');}}),/Canceled/);
 assert.deepEqual(await fs.readdir(root),[]);
});
for(const [name,filename,Type]of [['page workflows','page-workflows.json',PageWorkflows],['sheet sets','sheet-sets.json',SheetSets]]){
 test(name+' verifies staged disk bytes before replacing its library',async t=>{
  const root=await folder(t),file=path.join(root,filename),previous=Buffer.from('{ "version": 1, "items": [] }\n');await fs.writeFile(file,previous);
  const library=new Type(root,{});await library.init();const originalOpen=fs.open;let readAttempted=false,synced=false;
  fs.open=async function(target,...args){const handle=await originalOpen.call(this,target,...args);if(String(target).endsWith('.partial')){const sync=handle.sync.bind(handle);handle.sync=async()=>{await sync();synced=true;};handle.read=async()=>{readAttempted=true;throw Error('Simulated staged read failure');};}return handle;};
  try{await assert.rejects(library.persist([]),/could not be saved/);}finally{fs.open=originalOpen;}
  assert.equal(synced,true);assert.equal(readAttempted,true);assert.deepEqual(await fs.readFile(file),previous);assert.deepEqual(await fs.readdir(root),[filename]);
  await library.persist([]);assert.deepEqual(JSON.parse(await fs.readFile(file,'utf8')),{version:1,items:[]});assert.deepEqual(await fs.readdir(root),[filename]);
 });
}
