const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {execFile}=require('node:child_process'),{promisify}=require('node:util');const exec=promisify(execFile);
test('native launcher retries only a confirmed pre-interactive graphics exit and only once',{skip:process.platform!=='win32',timeout:60000},async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-graphics-policy-')),binary=path.join(root,'harness.exe');
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const compiler=path.join(process.env.SystemRoot||'C:\\Windows','Microsoft.NET/Framework64/v4.0.30319/csc.exe');
 await exec(compiler,['/nologo','/target:exe','/platform:x64','/warnaserror+','/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll','/reference:System.Web.Extensions.dll','/main:GraphicsHarness','/out:'+binary,path.resolve('desktop/native/GraphicsStartup.cs'),path.resolve('tests/helpers/graphics-startup-harness.cs')],{windowsHide:true,timeout:30000});
 for(const [scenario,asks,attempts,successfulMode]of [['normal',0,1,'normal'],['arguments',0,1,'normal'],['retry',1,2,'software'],['both-fail',1,2,null],['decline',1,1,null],['after-save',0,1,'normal'],['other',0,1,null],['invalid',0,1,null]]){
  const {stdout}=await exec(binary,[scenario],{windowsHide:true,timeout:10000}),r=JSON.parse(stdout);
  assert.equal(r.asks,asks,scenario);assert.equal(r.receipt.attempts.length,attempts,scenario);assert.equal(r.receipt.successfulMode,successfulMode,scenario);assert.ok(r.receipt.finishedAt,scenario);
  if(scenario==='both-fail')assert.equal(r.failures,1);if(scenario==='decline')assert.equal(r.receipt.decision,'declined');
  if(scenario==='after-save')assert.equal(r.receipt.attempts[0].confirmedGraphicsFailure,true);
 }
});
