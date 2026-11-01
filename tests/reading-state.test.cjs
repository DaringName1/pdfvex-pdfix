const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {FileStore}=require('../desktop/file-store.cjs');
test('reading metadata persists without altering originals, rejects invalid state, and resets for changed source bytes',async t=>{
  const root=await fs.mkdtemp(path.resolve('.test-data/reading-state-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const source=path.join(root,'source.pdf'),bytes=await fs.readFile('tests/fixtures/navigation-sample.pdf');await fs.writeFile(source,bytes);
  let store=new FileStore(path.join(root,'data'));await store.init();const file=await store.open(source);
  assert.deepEqual(store.reading(file.id),{page:1,bookmarks:[]});await store.saveReading(file.id,{page:3,bookmarks:[{page:2,title:'Maintenance'}]});assert.deepEqual(await fs.readFile(source),bytes);
  store=new FileStore(store.directory);await store.init();const reopened=await store.reopen(file.recentId);assert.deepEqual(store.reading(reopened.id),{page:3,bookmarks:[{page:2,title:'Maintenance'}]});
  // On-demand reading can exceed 500 pages. Metadata accepts safe integer
  // positions; the opened reader clamps them to its actual document length.
  await store.saveReading(reopened.id,{page:501,bookmarks:[{page:501,title:'Later sheet'}]});assert.equal(store.reading(reopened.id).page,501);
  for(const invalid of [{page:0,bookmarks:[]},{page:1.5,bookmarks:[]},{page:Number.MAX_SAFE_INTEGER+1,bookmarks:[]},{page:1,bookmarks:[{page:Number.MAX_SAFE_INTEGER+1,title:'Invalid'}]},{page:1,bookmarks:[{page:1,title:'x'.repeat(81)}]},{page:1,bookmarks:Array.from({length:101},()=>({page:1,title:'x'}))}])await assert.rejects(store.saveReading(reopened.id,invalid),e=>e.code==='STATE');
  await fs.appendFile(source,'\n% external update\n');const changed=await store.open(source);assert.deepEqual(store.reading(changed.id),{page:1,bookmarks:[]});await store.saveReading(changed.id,{page:2,bookmarks:[{page:1,title:'New source'}]});await store.clearRecents();await assert.rejects(store.saveReading(changed.id,{page:2,bookmarks:[]}),e=>e.code==='MISSING');assert.equal(store.list().length,0);
});
test('oversized or corrupted workspace metadata does not allocate an unbounded read or prevent startup',async t=>{
  const root=await fs.mkdtemp(path.resolve('.test-data/reading-corrupt-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  await fs.writeFile(path.join(root,'workspace.json'),Buffer.alloc(8*1024*1024+1,32));let store=new FileStore(root);await store.init();assert.deepEqual(store.list(),[]);assert.match(store.recoveryWarning,/could not be read/);
  await fs.writeFile(path.join(root,'workspace.json'),'{not JSON');store=new FileStore(root);await store.init();assert.deepEqual(store.list(),[]);assert.match(store.recoveryWarning,/documents are safe/);
});
