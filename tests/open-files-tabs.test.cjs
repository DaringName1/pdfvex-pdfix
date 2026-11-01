// S19 (Oct 29): in tabs mode, opening another file keeps earlier files open, so each tab can still save.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {FileStore}=require('../desktop/file-store.cjs');
test('tabs mode keeps up to 10 files open; single mode still keeps one',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-tabs-'));
 try{const bytes=await fs.readFile('tests/fixtures/reading-sample.pdf'),files=[];for(let i=0;i<12;i++){const file=path.join(root,`file ${i}.pdf`);await fs.writeFile(file,bytes);files.push(file);}
  const store=new FileStore(path.join(root,'profile'));await store.init();
  // Single mode (the default): opening B ends A, as before.
  let A=await store.open(files[0]);await store.open(files[1]);assert.throws(()=>store.source(A.id),/session ended/);
  assert.deepEqual(store.setOpenFilesMode('tabs'),{mode:'tabs',open:1,limit:10});
  A=await store.open(files[0]);const B=await store.open(files[1]);
  // Opening an already-open, unchanged file again keeps its one session (no duplicate id to release by mistake).
  const again=await store.open(files[0]);assert.equal(again.id,A.id);assert.ok(store.source(A.id));
  const copy=path.join(root,'A copy.pdf');await store.saveCopy(A.id,copy,bytes,'pdf');assert.deepEqual(await fs.readFile(copy),bytes,'the first tab still saves after a second file opens');
  await store.saveForm(B.id,{kind:'form',version:1,values:[{name:'Name',value:'Alex'}],overlays:[]});
  const opened=[A,B];for(let i=2;i<10;i++)opened.push(await store.open(files[i]));
  await assert.rejects(store.open(files[10]),e=>e.code==='TOO_MANY'&&/10 files open\. Close one of them/.test(e.message));
  assert.equal(await store.release(opened[2].id),true);const next=await store.open(files[10]);assert.ok(store.source(next.id));assert.ok(store.source(A.id),'earlier tabs are untouched');
  assert.throws(()=>store.source(opened[2].id),/session ended/,'a closed tab cannot save');
  assert.throws(()=>store.setOpenFilesMode('many'),/single or tabs/);
  store.setOpenFilesMode('single');await store.open(files[11]);assert.throws(()=>store.source(A.id),/session ended/,'back to one file in single mode');
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
