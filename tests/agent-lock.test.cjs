// The shared test and build locks: one agent never removes a lock another agent holds (PDFIX_PRIORITY_TASKS P2-14).
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
let readLock,removeStale,releaseOwn,UNREADABLE_GRACE_MS;
test.before(async()=>({readLock,removeStale,releaseOwn,UNREADABLE_GRACE_MS}=await import('../scripts/agent-lock.mjs')));
const temp=async()=>path.join(await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-lock-')),'app-run.lock');
const exists=file=>fs.stat(file).then(()=>true,()=>false);
test('releasing removes only a lock this process owns',async()=>{
  const file=await temp();await fs.writeFile(file,JSON.stringify({agent:'codex',pid:process.pid+1}));
  await releaseOwn(file);assert.equal(await exists(file),true,'another agent\'s lock is kept');
  await fs.writeFile(file,JSON.stringify({agent:'claude',pid:process.pid}));await releaseOwn(file);assert.equal(await exists(file),false);
  await releaseOwn(file);// already gone: no error
});
test('a stale lock is removed only if nobody has replaced it since it was judged stale',async()=>{
  const file=await temp(),stale=JSON.stringify({agent:'codex',pid:999999,started:'2026-10-01T00:00:00Z'});await fs.writeFile(file,stale);
  const seen=(await readLock(file)).raw;await fs.writeFile(file,JSON.stringify({agent:'claude',pid:process.pid}));
  await removeStale(file,seen);assert.equal(await exists(file),true,'the newer lock survives');
  await fs.writeFile(file,stale);await removeStale(file,(await readLock(file)).raw);assert.equal(await exists(file),false);
});
test('a lock that cannot be read yet is left alone while it may still be being written',async()=>{
  const file=await temp();await fs.writeFile(file,'');const seen=await readLock(file);assert.equal(seen.holder,null);assert.equal(seen.missing,false);
  await removeStale(file,seen.raw);assert.equal(await exists(file),true);
  const old=new Date(Date.now()-UNREADABLE_GRACE_MS-1000);await fs.utimes(file,old,old);await removeStale(file,seen.raw);assert.equal(await exists(file),false,'an old unreadable lock is cleared');
  assert.equal((await readLock(file)).missing,true);
});
