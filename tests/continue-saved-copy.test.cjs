// "Continue with saved copy": the next tool opens exactly the file just saved, by token, never by a page-given path.
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const path=require('node:path');const os=require('node:os');
const {FileStore}=require('../desktop/file-store.cjs');
async function fixture(t){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-continue-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const store=new FileStore(path.join(root,'data'));await store.init();const source=path.join(root,'notes.txt');await fs.writeFile(source,'Original.');
  return {root,store,source,opened:await store.open(source)};
}
test('a saved copy can be continued with, and it is the saved bytes',async t=>{
  const {root,store,source,opened}=await fixture(t);const out=path.join(root,'copy.txt');
  const saved=await store.saveCopy(opened.id,out,Buffer.from('Edited copy.'),'txt');
  assert.match(saved.continueToken,/^[0-9a-f-]{36}$/);
  const next=await store.openSavedCopy(saved.continueToken);
  assert.equal(path.resolve(store.source(next.id).path),path.resolve(out),'the next tool works on the saved copy, not the original');
  assert.equal(await fs.readFile(source,'utf8'),'Original.');
});
test('wrong, old or replaced tokens are refused; a copy changed elsewhere is refused',async t=>{
  const {root,store,opened}=await fixture(t);
  await assert.rejects(store.openSavedCopy('not-a-token'),e=>e.code==='MISSING');
  await assert.rejects(store.openSavedCopy(undefined),e=>e.code==='MISSING','nothing to continue with before any save');
  const first=await store.saveCopy(opened.id,path.join(root,'one.txt'),Buffer.from('One.'),'txt');
  const second=await store.saveCopy(opened.id,path.join(root,'two.txt'),Buffer.from('Two.'),'txt');
  await assert.rejects(store.openSavedCopy(first.continueToken),e=>e.code==='MISSING','only the newest copy');
  await fs.writeFile(path.join(root,'two.txt'),'Changed by another program.');
  await assert.rejects(store.openSavedCopy(second.continueToken),'the saved bytes changed, so it is not opened');
});
test('a failed save gives nothing to continue with',async t=>{
  const {root,store,opened}=await fixture(t);const existing=path.join(root,'taken.txt');await fs.writeFile(existing,'Someone else.');
  await assert.rejects(store.saveCopy(opened.id,existing,Buffer.from('Mine.'),'txt'));
  assert.equal(store.lastSaved,undefined);assert.equal(await fs.readFile(existing,'utf8'),'Someone else.');
});
test('Show in folder uses the same token and only a copy still as saved',async t=>{
  const {root,store,opened}=await fixture(t);const out=path.join(root,'shown.txt');
  await assert.rejects(store.savedCopyToReveal('not-a-token'),e=>e.code==='MISSING');
  const saved=await store.saveCopy(opened.id,out,Buffer.from('Shown copy.'),'txt');
  assert.equal(path.resolve(await store.savedCopyToReveal(saved.continueToken)),path.resolve(out),'the main process supplies the location');
  const next=await store.openSavedCopy(saved.continueToken);assert.ok(next.id,'revealing does not use up Continue');
  await fs.writeFile(out,'Replaced by another program, longer.');
  await assert.rejects(store.savedCopyToReveal(saved.continueToken),e=>e.code==='CHANGED');
  await fs.rm(out);
  await assert.rejects(store.savedCopyToReveal(saved.continueToken),e=>e.code==='MISSING','a moved or deleted copy is not shown');
});
