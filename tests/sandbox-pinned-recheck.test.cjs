// SHARED-PLAN 1.8: pinned engine files. A change-time-only move during reading gets one fully stable second read;
// anything else is refused, and the problem log names the moved fields (never paths).
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const {createHash}=require('node:crypto');
const {verifyPinnedFile,setSandboxReporter}=require('../desktop/native-sandbox.cjs');
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pdfix-pinned-'));t.after(()=>{setSandboxReporter(null);fs.rmSync(dir,{recursive:true,force:true});});
 const file=path.join(dir,'engine.dll'),bytes=Buffer.alloc(300*1024,7);fs.writeFileSync(file,bytes);const log=[];setSandboxReporter(d=>log.push(d));
 return {file,log,sha:createHash('sha256').update(bytes).digest('hex')};}
// Toggling the read-only attribute changes only the change time (Windows) / ctime (POSIX), not the bytes or mtime.
const touchMetadata=file=>{const ro=(fs.statSync(file).mode&0o200)===0;fs.chmodSync(file,ro?0o666:0o444);};
test('an unchanged file passes and a wrong hash is refused',async t=>{
 const {file,sha,log}=fixture(t);await verifyPinnedFile(file,1<<20,sha);
 await assert.rejects(verifyPinnedFile(file,1<<20,'0'.repeat(64)),e=>e.code==='SANDBOX');assert.match(log.at(-1),/bytes differ/);
});
test('change time moving once while reading: one stable re-read passes',async t=>{
 const {file,sha,log}=fixture(t);let calls=0;
 await verifyPinnedFile(file,1<<20,sha,()=>{calls++;if(calls===2){touchMetadata(file);}});
 assert.ok(log.some(l=>/recheck: change time moved/.test(l)),'the recheck is recorded');
});
test('change time moving on every read is refused and names the field',async t=>{
 const {file,sha,log}=fixture(t);let inLoop=0;
 await assert.rejects(verifyPinnedFile(file,1<<20,sha,()=>{if(++inLoop%2===0)touchMetadata(file);}),e=>e.code==='SANDBOX');
 assert.match(log.at(-1),/moved: .*ctimeMs/);assert.doesNotMatch(log.join('\n'),/engine\.dll|pdfix-pinned/,'no paths in the log');
});
test('bytes changing while reading are refused without a retry',async t=>{
 const {file,sha,log}=fixture(t);let calls=0;
 await assert.rejects(verifyPinnedFile(file,1<<20,sha,()=>{if(++calls===2)fs.writeFileSync(file,Buffer.alloc(300*1024,9));}),e=>e.code==='SANDBOX');
 assert.ok(!log.some(l=>/recheck/.test(l)),'no second read when the contents changed');assert.match(log.at(-1),/moved: .*mtimeMs|bytes differ/);
});
