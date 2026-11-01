const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { FileStore, validateFile, MAX_BYTES } = require('../desktop/file-store.cjs');
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pdfix-safety-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const store = new FileStore(path.join(root, 'metadata')); await store.init();
  const original = path.join(root, 'notes.txt'); await fs.writeFile(original, 'Original notes — never overwrite.');
  return { root, store, original };
}
test('metadata save failure preserves the current file handle, original safety and visible recent state',async t=>{
  const {root,store,original}=await fixture(t),first=await store.open(original),previous=store.list();
  const other=path.join(root,'another.txt');await fs.writeFile(other,'Another source');const rename=fs.rename;
  fs.rename=async(from,to)=>{if(to===path.join(store.directory,'workspace.json'))throw Object.assign(new Error('Simulated metadata storage failure'),{code:'EACCES'});return rename(from,to);};
  try{
    await assert.rejects(store.open(other));assert.equal(store.source(first.id).name,'notes.txt');assert.deepEqual(store.list(),previous);
    await assert.rejects(store.favorite(first.recentId));assert.deepEqual(store.list(),previous);
    await assert.rejects(store.forget(first.recentId));assert.deepEqual(store.list(),previous);
    await assert.rejects(store.clearRecents());assert.deepEqual(store.list(),previous);
    const output=path.join(root,'rescue.txt');await store.saveCopy(first.id,output,Buffer.from('Kept edits'),'txt');assert.equal(await fs.readFile(output,'utf8'),'Kept edits');assert.match(await fs.readFile(original,'utf8'),/Original notes/);
  }finally{fs.rename=rename;}
  assert.deepEqual((await fs.readdir(store.directory)).filter(name=>name.endsWith('.tmp')),[]);
});
test('read, reopen, favorite, persistence and forgetting never change source bytes', async t => {
  const {store, original}=await fixture(t); const source=await fs.readFile(original);
  const file=await store.open(original); assert.equal(file.name,'notes.txt');assert.deepEqual(Buffer.from(file.bytes),source);
  await store.favorite(file.recentId); const loaded=new FileStore(store.directory);await loaded.init();assert.equal(loaded.list()[0].favorite,true);
  const reopened=await loaded.reopen(file.recentId);assert.notEqual(reopened.id,file.id);
  await loaded.forget(file.recentId);assert.deepEqual(loaded.list(),[]);assert.deepEqual(await fs.readFile(original),source);
});
test('copies are exclusive; original, existing destinations and hard links are safe', async t => {
  const {store,original,root}=await fixture(t);const file=await store.open(original);const initial=await fs.readFile(original);
  await assert.rejects(store.saveCopy(file.id,original,Buffer.from('Changed')),e=>e.code==='ORIGINAL');
  const output=path.join(root,'notes-copy.txt');await store.saveCopy(file.id,output);assert.deepEqual(await fs.readFile(output),initial);
  await assert.rejects(store.saveCopy(file.id,output,Buffer.from('Changed')),e=>e.code==='EXISTS');
  const alias=path.join(root,'alias.txt');await fs.link(original,alias);await assert.rejects(store.saveCopy(file.id,alias,Buffer.from('Changed')),e=>e.code==='EXISTS');
  assert.deepEqual(await fs.readFile(original),initial);assert.deepEqual(await fs.readFile(output),initial);
});
test('all previously opened originals remain protected and session handles expire', async t => {
  const {store,original,root}=await fixture(t);const first=await store.open(original);const other=path.join(root,'other.txt');await fs.writeFile(other,'Other source');const second=await store.open(other);
  await assert.rejects(store.saveCopy(first.id,path.join(root,'first-copy.txt')),e=>e.code==='MISSING');
  await assert.rejects(store.saveCopy(second.id,original,Buffer.from('Changed')),e=>e.code==='ORIGINAL');
});
test('empty, unsupported, mismatched, oversized and stale inputs have actionable errors', async t => {
  const {root,store}=await fixture(t);
  assert.throws(()=>validateFile('script.html',Buffer.from('<script/>')),e=>e.code==='UNSUPPORTED');
  assert.throws(()=>validateFile('fake.pdf',Buffer.from('wrong bytes')),e=>e.code==='DAMAGED');
  assert.throws(()=>validateFile('empty.txt',Buffer.alloc(0)),e=>e.code==='EMPTY');
  const huge=path.join(root,'huge.txt');const handle=await fs.open(huge,'w');await handle.truncate(MAX_BYTES+1);await handle.close();
  await assert.rejects(store.open(huge),e=>e.code==='TOO_LARGE');
  await assert.rejects(store.open(root),e=>e.code==='NOT_FILE');
  const missing=path.join(root,'missing.txt');await fs.writeFile(missing,'some content');const file=await store.open(missing);await fs.unlink(missing);await assert.rejects(store.reopen(file.recentId),e=>e.code==='READ');
});
test('extension changes do not masquerade as conversions; corrupt history is recoverable', async t => {
  const {root,store,original}=await fixture(t);const file=await store.open(original);
  await assert.rejects(store.saveCopy(file.id,path.join(root,'copy.pdf')),e=>e.code==='FORMAT');
  await fs.writeFile(path.join(store.directory,'workspace.json'),'{damaged');const recovered=new FileStore(store.directory);await recovered.init();assert.deepEqual(recovered.list(),[]);assert.match(recovered.recoveryWarning,/documents are safe/);
});
test('edited exports and fingerprint-bound recovery preserve sources and reject overwrites',async t=>{
  const {root,store,original}=await fixture(t);const file=await store.open(original);const draft={kind:'source',text:'Recovered edited text'};await store.saveDraft(file.id,draft);assert.deepEqual(await store.loadDraft(file.id),draft);
  const output=path.join(root,'edited.md');await store.saveCopy(file.id,output,Buffer.from('# Edited'),'md');assert.equal(await fs.readFile(output,'utf8'),'# Edited');await assert.rejects(store.saveCopy(file.id,original,Buffer.from('Replace'),'txt'),e=>e.code==='ORIGINAL');
  await fs.writeFile(original,'Changed outside PDFix');const changed=await store.open(original);await assert.rejects(store.loadDraft(changed.id),e=>e.code==='STALE_DRAFT');assert.ok((await store.versions(changed.id)).some(v=>v.label==='Unsaved work from before PDFix closed'),'the old draft is kept in Version history, not applied');assert.equal(await store.loadDraft(changed.id),null);assert.equal(await fs.readFile(original,'utf8'),'Changed outside PDFix');
  await store.saveDraft(null,{kind:'rich',content:{type:'doc'}});assert.equal((await store.loadDraft(null)).kind,'rich');await store.clearDraft(null);assert.equal(await store.loadDraft(null),null);
});
