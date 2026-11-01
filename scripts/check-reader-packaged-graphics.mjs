// Exact packaged launcher bytes; simulated native child on a non-input desktop.
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
const exec=promisify(execFile),hash=b=>createHash('sha256').update(b).digest('hex');
const packageRoot=path.resolve(process.argv.find(a=>a.startsWith('--package='))?.slice(10)||'');
if(!process.argv.some(a=>a.startsWith('--package=')))throw Error('Choose the integrator-supplied --package= folder.');
const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-packaged-graphics-')),report={root,packageRoot,scope:'Exact packaged launcher bytes, generated native crash fixtures and real retry dialogs on a private non-input desktop; actual Electron startup is a separate check.',checks:[]};
const manifestBytes=await fs.readFile(path.join(packageRoot,'package-manifest.json')),manifest=JSON.parse(manifestBytes),checksums=JSON.parse(await fs.readFile(path.join(packageRoot,'package-checksums.json'),'utf8')),complete=JSON.parse(await fs.readFile(path.join(packageRoot,'PACKAGE-COMPLETE.json'),'utf8'));
if(hash(manifestBytes)!==checksums.manifestSha256||complete.manifestSha256!==checksums.manifestSha256||manifest.launch!=='PDFix.exe')throw Error('Incomplete or altered package manifest.');
const binary=await fs.readFile(path.join(packageRoot,'app/PDFix.exe')),declared=manifest.files.find(f=>f.path==='PDFix.exe');
if(hash(binary)!==declared?.sha256||binary.length!==declared?.bytes||hash(binary)!==manifest.native.graphicsStartup.sha256)throw Error('Packaged launcher hash mismatch.');
report.screenshotLimit='Private-desktop PrintWindow captures were black when personally inspected; not visual evidence. Real native control labels/choices and exit receipts are checked.';report.launcherSha256=hash(binary);report.manifestSha256=hash(manifestBytes);
const compiler=path.join(process.env.SystemRoot||'C:/Windows','Microsoft.NET/Framework64/v4.0.30319/csc.exe'),controller=path.join(root,'private-desktop.exe'),child=path.join(root,'fixture.exe');
await exec(compiler,['/nologo','/target:exe','/platform:x64','/warnaserror+','/reference:System.Web.Extensions.dll','/out:'+child,path.resolve('tests/helpers/graphics-package-child.cs')],{windowsHide:true,timeout:30000});
await exec(compiler,['/nologo','/target:exe','/platform:x64','/warnaserror+','/reference:System.Web.Extensions.dll','/reference:System.Drawing.dll','/out:'+controller,path.resolve('tests/helpers/graphics-package-desktop.cs')],{windowsHide:true,timeout:30000});
for(const [scenario,attempts,dialogs,mode]of [['normal',1,0,'normal'],['arguments',1,0,'normal'],['retry',2,1,'software'],['decline',1,1,null],['both-fail',2,2,null],['after-save',1,0,'normal'],['other',1,0,null],['invalid',1,0,null]]){
 const directory=path.join(root,scenario),profile=path.join(directory,'profile');await fs.mkdir(path.join(directory,'runtime'),{recursive:true});await fs.copyFile(path.join(packageRoot,'app/PDFix.exe'),path.join(directory,'PDFix.exe'));await fs.copyFile(child,path.join(directory,'runtime/PDFix.exe'));
 try{const {stdout}=await exec(controller,[path.join(directory,'PDFix.exe'),scenario,directory],{windowsHide:true,timeout:50000,env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0',PDFIX_PACKAGE_CASE:scenario,PDFIX_PACKAGE_CASE_ROOT:directory}}),ui=JSON.parse(stdout),receipt=JSON.parse(await fs.readFile(path.join(profile,'graphics-startup-last.json'),'utf8')),children=(await fs.readFile(path.join(directory,'attempts.jsonl'),'utf8')).trim().split('\n').map(s=>JSON.parse(s));
 const expectedArgs=['','space value','quote"value','C:\\path with space\\','x\\"y','--editor','C:\\a b\\drawing.pdf'];
 const pass=ui.privateDesktop&&ui.desktopClosed&&ui.dialogs.length===dialogs&&ui.dialogs.every(d=>d.privateDesktop)&&receipt.attempts.length===attempts&&receipt.successfulMode===mode&&!!receipt.finishedAt&&children.length===attempts&&children.every(c=>JSON.stringify(c.args)===JSON.stringify(expectedArgs))&&ui.exit===(mode&&scenario!=='after-save'?0:37)&&(!dialogs||receipt.decision===(scenario==='decline'?'declined':'accepted'));
 report.checks.push({scenario,pass,ui,receipt,children});if(!pass)throw Error('Packaged graphics scenario failed: '+scenario);
 }catch(error){report.error=error.stack;break;}
}
report.originalLauncherUnchanged=hash(await fs.readFile(path.join(packageRoot,'app/PDFix.exe')))===report.launcherSha256;report.pass=report.checks.length===8&&report.checks.every(c=>c.pass)&&report.originalLauncherUnchanged&&!report.error;
await fs.writeFile(path.join(root,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exitCode=report.pass?0:1;
