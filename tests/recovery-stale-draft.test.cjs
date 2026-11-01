// Unsaved work from before PDFix closed, when the file changed before it was reopened (a sync, another program).
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const path=require('node:path');const os=require('node:os');
const {FileStore}=require('../desktop/file-store.cjs');
const LABEL='Unsaved work from before PDFix closed';
async function crashThenChange(t,{name='notes.txt',draft={kind:'source',text:'UNSAVED WORK typed before the crash'}}={}){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-stale-draft-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const data=path.join(root,'data'),source=path.join(root,name);await fs.writeFile(source,'Version on disk before the crash.');
  const before=new FileStore(data);await before.init();const opened=await before.open(source);await before.saveDraft(opened.id,draft);
  // PDFix "closes" without saving; the file then changes elsewhere, and a new PDFix start reopens it.
  await fs.writeFile(source,'Version synced from another computer.');
  const after=new FileStore(data);await after.init();return {root,source,draft,store:after,file:await after.open(source)};
}
test('the old draft is not applied to the changed file; the person is told and it is kept in Version history',async t=>{
  const {store,file,source,draft}=await crashThenChange(t);
  await assert.rejects(store.loadDraft(file.id),error=>error.code==='STALE_DRAFT'&&error.message.includes(LABEL));
  const versions=await store.versions(file.id),kept=versions.find(v=>v.label===LABEL);
  assert.ok(kept,'the unsaved work is listed in Version history for the file as it is now');
  assert.deepEqual(await store.loadVersion(file.id,kept.id),draft,'and it can be opened exactly');
  assert.equal(await fs.readFile(source,'utf8'),'Version synced from another computer.','the changed file itself is untouched');
  assert.equal(await store.loadDraft(file.id),null,'the message is shown once; the next open starts clean');
});
test('the kept work is not pushed out by later versions',async t=>{
  const {store,file}=await crashThenChange(t);await store.loadDraft(file.id).catch(()=>{});
  for(let i=0;i<25;i++)await store.checkpoint(file.id,{kind:'source',text:'later edit '+i},'Saved version '+i);
  const versions=await store.versions(file.id);
  assert.ok(versions.some(v=>v.label===LABEL),'still there after 25 newer versions');
  assert.ok(versions.length<=20,'history still respects its size');
  assert.ok(versions.some(v=>v.label==='Saved version 24'),'the newest version is kept');
});
test('restoring the kept work keeps the current work as a version first',async t=>{
  const {store,file,draft}=await crashThenChange(t);await store.loadDraft(file.id).catch(()=>{});
  const kept=(await store.versions(file.id)).find(v=>v.label===LABEL),current={kind:'source',text:'what I typed after reopening'};
  assert.deepEqual(await store.restoreVersion(file.id,kept.id,current),draft);
  assert.ok((await store.versions(file.id)).some(v=>v.label==='Before restoring an earlier version'));
});
test('an unchanged file still gets its draft back as before',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-stale-draft-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const source=path.join(root,'notes.txt');await fs.writeFile(source,'Same file.');
  const first=new FileStore(path.join(root,'data'));await first.init();const draft={kind:'source',text:'unsaved'};await first.saveDraft((await first.open(source)).id,draft);
  const second=new FileStore(path.join(root,'data'));await second.init();assert.deepEqual(await second.loadDraft((await second.open(source)).id),draft);
});
test('versions made before the file changed are listed separately and can be read, never restored into the changed file (X11)',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-earlier-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const data=path.join(root,'data'),source=path.join(root,'notes.txt');await fs.writeFile(source,'First contents.');
  const before=new FileStore(data);await before.init();const first=await before.open(source);const old={kind:'source',text:'Version from before the change'};
  await before.checkpoint(first.id,old,'Morning version');
  await fs.writeFile(source,'Contents changed in another program.');
  const store=new FileStore(data);await store.init();const file=await store.open(source);
  assert.equal((await store.versions(file.id)).some(v=>v.label==='Morning version'),false,'not mixed in with the current versions');
  const earlier=await store.earlierVersions(file.id),kept=earlier.find(v=>v.label==='Morning version');
  assert.ok(kept&&kept.earlier,'listed as a version from before the file changed');
  assert.deepEqual(await store.loadEarlierVersion(file.id,kept.id),old,'and it can be read exactly');
  await assert.rejects(store.restoreVersion(file.id,kept.id,{kind:'source',text:'current'}),error=>error.code==='VERSION','it can never be restored over the changed file');
  await assert.rejects(store.loadEarlierVersion(file.id,'no-such-id'),error=>error.code==='VERSION');
  assert.equal(await fs.readFile(source,'utf8'),'Contents changed in another program.');
});
test('one newest-first history list labels edit versions, earlier versions and saved-file backups (X15)',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-history-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const data=path.join(root,'data'),source=path.join(root,'notes.txt');await fs.writeFile(source,'First contents.');
  const before=new FileStore(data);await before.init();const first=await before.open(source);await before.checkpoint(first.id,{kind:'source',text:'old'},'Morning version');
  await fs.writeFile(source,'Changed elsewhere.');
  const store=new FileStore(data);await store.init();const file=await store.open(source);
  await new Promise(r=>setTimeout(r,20));await store.checkpoint(file.id,{kind:'source',text:'new'},'Afternoon version');
  const list=await store.documentHistory(file.id);
  assert.deepEqual(list.map(e=>[e.type,e.label]),[['version','Afternoon version'],['earlier','Morning version']]);
  assert.equal(list[1].readOnly,true);
  for(let i=1;i<list.length;i++)assert.ok(list[i-1].at>=list[i].at,'newest first');
});
