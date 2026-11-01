// Spare-PC robot, October 29: PDFix ended a few seconds after its first start, before Windows had saved the key
// that protects the watched-folder settings. On the next start the settings could not be decrypted and watched
// folders stayed off for good, showing "Install PDFix". Now: no settings file is written until there is something
// to keep, and a file that can't be decrypted is set aside (never deleted) with a plain notice.
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
const {WatchedFolderManager}=require('../desktop/watched-folder-manager.cjs');
const reversible={isEncryptionAvailable:()=>true,encryptString:text=>Buffer.from(Buffer.from(text,'utf8').toString('base64').split('').reverse().join(''),'latin1'),decryptString:bytes=>Buffer.from(Buffer.from(bytes).toString('latin1').split('').reverse().join(''),'base64').toString('utf8')};
const lostKey={...reversible,decryptString:()=>{throw new Error('Error while decrypting the ciphertext provided to safeStorage.decryptString.');}};
async function profile(t){const root=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-watch-key-')));t.after(()=>fs.rm(root,{recursive:true,force:true}));return root;}
const listing=root=>fs.readdir(path.join(root,'watched-folders')).then(names=>names.sort());

test('a first start with no folders writes no settings file',{skip:process.platform!=='win32'},async t=>{
  const root=await profile(t);const manager=new WatchedFolderManager({directory:root,safeStorage:reversible});
  const status=await manager.init();t.after(()=>manager.dispose());
  assert.equal(status.available,true);assert.equal(status.notice,'');assert.deepEqual(await listing(root),[]);
});

test('settings Windows can no longer decrypt are set aside and watched folders still start',{skip:process.platform!=='win32'},async t=>{
  const root=await profile(t);await fs.mkdir(path.join(root,'watched-folders'));
  const old=reversible.encryptString(JSON.stringify({kind:'PDFix.WatchedFolders.v1',grants:[],jobs:[]}));
  await fs.writeFile(path.join(root,'watched-folders','consent-and-receipts.enc'),old);
  const manager=new WatchedFolderManager({directory:root,safeStorage:lostKey});
  const status=await manager.init();t.after(()=>manager.dispose());
  assert.equal(status.available,true,'watched folders are not switched off');
  assert.equal(status.error,'');assert.match(status.notice,/could not be read/);assert.match(status.notice,/Choose your folders again/);
  assert.doesNotMatch(status.notice,/decrypt|ciphertext|Install PDFix/,'plain words, no misleading install advice');
  assert.match(manager.startupProblem,/decrypt/,'the technical cause goes to the problem report');
  const names=await listing(root);assert.equal(names.length,1);assert.match(names[0],/^consent-and-receipts\.unreadable-.+\.enc$/);
  assert.deepEqual(await fs.readFile(path.join(root,'watched-folders',names[0])),old,'the unreadable file is kept byte for byte');
});

test('a settings file that is damaged in other ways still keeps watched folders off',{skip:process.platform!=='win32'},async t=>{
  const root=await profile(t);await fs.mkdir(path.join(root,'watched-folders'));
  await fs.writeFile(path.join(root,'watched-folders','consent-and-receipts.enc'),reversible.encryptString('{"kind":"something else"}'));
  const manager=new WatchedFolderManager({directory:root,safeStorage:reversible});
  const status=await manager.init();t.after(()=>manager.dispose());
  assert.equal(status.available,false);assert.deepEqual(await listing(root),['consent-and-receipts.enc'],'nothing is moved or replaced');
});
