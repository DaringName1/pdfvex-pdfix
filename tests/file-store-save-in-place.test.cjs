const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs/promises');const path=require('node:path');const os=require('node:os');
const {FileStore}=require('../desktop/file-store.cjs');
async function fixture(t,name='notes.txt',text='First version.'){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-in-place-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const store=new FileStore(path.join(root,'metadata'));await store.init();const original=path.join(root,name);await fs.writeFile(original,text);
  return {root,store,original,opened:await store.open(original)};
}
const backups=async store=>{const root=path.join(store.directory,'backups');const folders=await fs.readdir(root).catch(()=>[]);return (await Promise.all(folders.map(async folder=>(await fs.readdir(path.join(root,folder))).map(item=>path.join(root,folder,item))))).flat();};
test('saving in place replaces the opened file, keeps the previous bytes as a backup and can save again',async t=>{
  const {store,original,opened}=await fixture(t);
  const first=await store.saveInPlace(opened.id,Buffer.from('Second version.'));assert.equal(await fs.readFile(original,'utf8'),'Second version.');assert.equal(first.location,store.source(opened.id).path);
  assert.equal(await fs.readFile(first.backup,'utf8'),'First version.');
  await store.saveInPlace(opened.id,Buffer.from('Third version.'));assert.equal(await fs.readFile(original,'utf8'),'Third version.');
  const kept=(await backups(store)).map(file=>file.replace(/\\/g,'/'));assert.equal(kept.length,2);
  assert.deepEqual((await Promise.all(kept.map(file=>fs.readFile(file,'utf8')))).sort(),['First version.','Second version.']);
  assert.deepEqual((await fs.readdir(path.dirname(original))).filter(item=>item.endsWith('.partial')),[],'no temporary file is left beside the document');
});
test('a file changed by another program since opening is not overwritten',async t=>{
  const {store,original,opened}=await fixture(t);await fs.writeFile(original,'Edited elsewhere.');
  await assert.rejects(store.saveInPlace(opened.id,Buffer.from('PDFix version.')),error=>error.code==='CHANGED');assert.equal(await fs.readFile(original,'utf8'),'Edited elsewhere.');assert.equal((await backups(store)).length,0);
});
test('a missing file, PDFs and empty output are refused',async t=>{
  const {store,original,opened}=await fixture(t);
  await assert.rejects(store.saveInPlace(opened.id,new Uint8Array()),error=>error.code==='OUTPUT');
  await fs.rm(original);await assert.rejects(store.saveInPlace(opened.id,Buffer.from('x')),error=>error.code==='MISSING');
  const pdf=await fixture(t,'drawing.pdf',await fs.readFile('tests/fixtures/reading-sample.pdf'));await assert.rejects(pdf.store.saveInPlace(pdf.opened.id,Buffer.from('%PDF-1.7')),error=>error.code==='FORMAT');
});
test('only the five most recent backups are kept for a file',async t=>{
  const {store,opened}=await fixture(t);for(let i=0;i<7;i++){await store.saveInPlace(opened.id,Buffer.from('Version '+i));await new Promise(resolve=>setTimeout(resolve,5));}
  const kept=await backups(store);assert.equal(kept.length,5);assert.ok(!(await Promise.all(kept.map(file=>fs.readFile(file,'utf8')))).includes('First version.'));
});
test('backups are listed newest first and read back only by their listed names',async t=>{
  const {store,opened}=await fixture(t);await store.saveInPlace(opened.id,Buffer.from('Second version.'));await new Promise(resolve=>setTimeout(resolve,5));await store.saveInPlace(opened.id,Buffer.from('Third version.'));
  const list=await store.listBackups(opened.id);assert.equal(list.length,2);assert.ok(list[0].name>list[1].name);
  assert.equal((await store.readBackup(opened.id,list[1].name)).toString(),'First version.');assert.equal((await store.readBackup(opened.id,list[0].name)).toString(),'Second version.');
  for(const name of ['../notes.txt','..\notes.txt','workspace.json',list[0].name.replace('.txt','.docx'),'']) await assert.rejects(store.readBackup(opened.id,name),error=>error.code==='MISSING',name);
});
test('each new document key has its own recovery draft, separate from the shared one',async t=>{
  const {store}=await fixture(t),a='new:11111111-2222-4333-8444-555555555555',b='new:66666666-7777-4888-9999-aaaaaaaaaaaa',draft=text=>({kind:'rich',content:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text}]}]},layout:require('../desktop/document-layout-validation.cjs').defaultDocumentLayout()});
  await store.saveDraft(a,draft('first'));await store.saveDraft(b,draft('second'));await store.saveDraft(null,draft('shared'));
  const text=async id=>JSON.stringify((await store.loadDraft(id))?.content??null);assert.match(await text(a),/first/);assert.match(await text(b),/second/);assert.match(await text(null),/shared/);
  await store.clearDraft(a);assert.equal(await store.loadDraft(a),null);assert.match(await text(b),/second/);
  for(const bad of ['new:x','new:../../etc','new:11111111-2222-4333-8444-55555555555Z'])assert.throws(()=>store.draftIdentity(bad),error=>error.code==='DRAFT',bad);
});
test('discarding an unsaved new document removes its draft and versions only',async t=>{
  const {store,opened}=await fixture(t),key='new:11111111-2222-4333-8444-555555555555',other='new:66666666-7777-4888-9999-aaaaaaaaaaaa',draft={kind:'rich',content:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'x'}]}]},layout:require('../desktop/document-layout-validation.cjs').defaultDocumentLayout()};
  await store.saveDraft(key,draft);await store.checkpoint(key,draft,'Kept');await store.saveDraft(other,draft);assert.equal((await store.versions(key)).length,1);
  await store.discardNewDocument(key);assert.equal(await store.loadDraft(key),null);assert.equal((await store.versions(key)).length,0);assert.ok(await store.loadDraft(other));
  await assert.rejects(store.discardNewDocument(opened.id),error=>error.code==='DRAFT');
});
