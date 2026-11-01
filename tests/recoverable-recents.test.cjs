// H1 (Oct 29): Home lists recent files that still have unsaved work kept for recovery, so that work is never hidden.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {FileStore}=require('../desktop/file-store.cjs');
test('recent files with unsaved work are listed with what kind of work, newest first; cleared work drops off',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-recoverable-'));
 try{const bytes=await fs.readFile('tests/fixtures/reading-sample.pdf'),a=path.join(root,'worksheet a.pdf'),b=path.join(root,'worksheet b.pdf'),c=path.join(root,'untouched.pdf');
  for(const file of [a,b,c])await fs.writeFile(file,bytes);
  const store=new FileStore(path.join(root,'profile'));await store.init();await store.open(c);
  assert.deepEqual(await store.recoverableRecents(),[]);const A=await store.open(a);
  await store.saveForm(A.id,{kind:'form',version:1,values:[{name:'Name',value:'Alex'}],overlays:[]});
  await new Promise(r=>setTimeout(r,30));const B=await store.open(b);
  await store.saveMarkup(B.id,{kind:'markup',version:1,marks:[{id:'pdfix-6af86a37-9a78-46f9-a983-e549f90c9379',kind:'note',page:0,color:'yellow',text:'Check this',rotation:0,fontSize:12,rect:[10,10,25,25]}]});
  await store.saveForm(B.id,{kind:'form',version:1,values:[],overlays:[]});
  let list=await store.recoverableRecents();
  assert.deepEqual(list.map(x=>[x.name,x.kinds]),[['worksheet b.pdf',['marks','form']],['worksheet a.pdf',['form']]]);
  assert.ok(list.every(x=>typeof x.id==='string'&&!('location' in x)&&!('path' in x)),'no file paths on the list');
  await store.clearForm((await store.open(a)).id);list=await store.recoverableRecents();assert.deepEqual(list.map(x=>x.name),['worksheet b.pdf']);
  assert.equal((await store.recoverableRecents(1)).length,1);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
