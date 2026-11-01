// When watched folders can't start (for example PDFix itself is in a synced or linked folder), the screen says so in
// plain words and what to do; the technical cause is kept for the problem report without file paths (X10).
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
const {WatchedFolderManager}=require('../desktop/watched-folder-manager.cjs');const {scrubPaths}=require('../desktop/plain-message.cjs');
test('a startup failure shows a plain message and keeps the technical cause separately',{skip:process.platform!=='win32'},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-watch-start-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const manager=new WatchedFolderManager({directory:root,safeStorage:{isEncryptionAvailable:()=>true}});
  manager.storage.init=async()=>{throw new Error('Linked or reparse path refused at C:\\Users\\someone\\OneDrive\\PDFix\\data');};
  const status=await manager.init();
  assert.equal(status.available,false);
  assert.match(status.error,/cannot start on this PC/);assert.match(status.error,/Install PDFix/);
  assert.doesNotMatch(status.error,/reparse|someone/,'no technical words or paths on screen');
  assert.match(manager.startupProblem,/reparse/);
  const reported=scrubPaths(manager.startupProblem);assert.doesNotMatch(reported,/someone|OneDrive/);assert.match(reported,/<path>/);
});
