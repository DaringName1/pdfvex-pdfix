const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {WatchedFolderStorage}=require('../desktop/watched-folder-storage.cjs');
// A stand-in for Electron's safeStorage: reversible, and visibly not plain JSON on disk.
const safeStorage={isEncryptionAvailable:()=>true,encryptString:text=>Buffer.from(Buffer.from(text,'utf8').toString('base64').split('').reverse().join(''),'latin1'),decryptString:bytes=>Buffer.from(Buffer.from(bytes).toString('latin1').split('').reverse().join(''),'base64').toString('utf8')};
async function storage(t){// Some machines report the temp folder in short 8.3 form, which folder checks rightly treat as an alias.
  const root=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-watch-')));t.after(()=>fs.rm(root,{recursive:true,force:true}));return {root,store:await new WatchedFolderStorage(root,safeStorage).init()};}
test('consent and receipts round-trip encrypted, and a missing library reads as none',async t=>{
  const {root,store}=await storage(t);assert.equal(await store.read(),null);
  const state={version:1,grants:[{id:'grant-1',note:'Ünïcode receipt'}],jobs:[]};await store.write(state);
  assert.deepEqual(await store.read(),state);
  const raw=await fs.readFile(path.join(root,'watched-folders','consent-and-receipts.enc'));assert.equal(raw.includes(Buffer.from('grant-1')),false,'nothing is stored as plain text');
  await store.close();
});
test('without OS-protected storage the library refuses to start',async t=>{
  // Some machines report the temp folder in short 8.3 form, which folder checks rightly treat as an alias.
  const root=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-watch-')));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  await assert.rejects(new WatchedFolderStorage(root,{isEncryptionAvailable:()=>false}).init(),/OS-protected consent storage is unavailable/);
});
