// Brief locks by antivirus/Windows Search must not turn a save into an error (CODE-SCAN-2026-10-25 #1).
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const {spawn}=require('node:child_process');
const {renameWithRetry}=require('../desktop/rename-retry.cjs');
const err=code=>Object.assign(new Error(code),{code});
test('a brief lock is waited out; a lasting lock and other errors are still reported',async()=>{
  let calls=0;await renameWithRetry('a','b',{waits:[1,1,1],rename:async()=>{if(++calls<3)throw err('EPERM');}});assert.equal(calls,3,'third try succeeds');
  calls=0;await assert.rejects(renameWithRetry('a','b',{waits:[1,1],rename:async()=>{calls++;throw err('EBUSY');}}),e=>e.code==='EBUSY');assert.equal(calls,3,'gives up after the waits');
  calls=0;await assert.rejects(renameWithRetry('a','b',{waits:[1,1],rename:async()=>{calls++;throw err('ENOSPC');}}),e=>e.code==='ENOSPC');assert.equal(calls,1,'a full disk is not retried');
});
test('Windows: replacing a file another program holds open for a moment succeeds',{skip:process.platform!=='win32'},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-rename-retry-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const target=path.join(root,'workspace.json'),temporary=path.join(root,'next.tmp');await fs.writeFile(target,'old');await fs.writeFile(temporary,'new');
  // Another process opens the file without delete sharing (as a scanner does) and lets go after about 0.8 s.
  const holder=spawn('powershell.exe',['-NoProfile','-Command',`$f=[IO.File]::Open('${target}','Open','Read','Read');[Console]::Out.WriteLine('held');Start-Sleep -Milliseconds 800;$f.Close()`],{stdio:['ignore','pipe','ignore']}),exited=new Promise(resolve=>holder.on('exit',resolve));
  await new Promise((resolve,reject)=>{holder.stdout.on('data',d=>{if(String(d).includes('held'))resolve();});holder.on('error',reject);});
  await assert.rejects(fs.rename(temporary,target),e=>['EPERM','EACCES','EBUSY'].includes(e.code),'a plain rename fails while the file is held');
  await renameWithRetry(temporary,target,{waits:[100,150,200,300,400]});
  assert.equal(await fs.readFile(target,'utf8'),'new');await exited;
});
