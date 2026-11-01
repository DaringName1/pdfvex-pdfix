// Hidden by default. The explicit visible acceptance option shows two drawings
// and the real native prompt briefly, then closes them, using only generated files.
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {spawn,execFile} from 'node:child_process';import {promisify} from 'node:util';import {createRequire} from 'node:module';import {PDFDocument} from 'pdf-lib';
import {readerRuntime} from '../tests/helpers/reader-runtime.mjs';
const require=createRequire(import.meta.url),root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-graphics-check-')),visible=process.env.PDFIX_GRAPHICS_VISIBLE_CHECK==='1',report={root,visible,checks:[]};
const runtime=await readerRuntime(),electronDist=path.dirname(require('electron')),host=path.join(root,'runtime');
await fs.cp(electronDist,host,{recursive:true});await fs.rename(path.join(host,'electron.exe'),path.join(host,'PDFix.exe'));await fs.copyFile(path.resolve('dist/native/graphics-startup/PDFix.exe'),path.join(root,'PDFix.exe'));
const pdf=await PDFDocument.create();pdf.addPage([612,792]).drawText('PDFix graphics check - generated drawing',{x:45,y:700,size:18});const source=path.join(root,'drawing.pdf');await fs.writeFile(source,await pdf.save());
const compiler=path.join(process.env.SystemRoot||'C:\\Windows','Microsoft.NET/Framework64/v4.0.30319/csc.exe'),harness=path.join(root,'harness.exe');
await promisify(execFile)(compiler,['/nologo','/target:exe','/platform:x64','/warnaserror+','/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll','/reference:System.Web.Extensions.dll','/main:GraphicsAppHarness','/out:'+harness,path.resolve('desktop/native/GraphicsStartup.cs'),path.resolve('tests/helpers/graphics-startup-app-harness.cs')],{windowsHide:true,timeout:30000});
for(const retry of [false,true]){
 const name=retry?'software-retry':'normal',receipt=path.join(root,name+'.json'),screenshot=path.join(root,name+'.png'),launcherReport=path.join(root,name+'-launcher.json'),profile=path.join(root,name+'-profile'),main=path.join(root,name+'.cjs');
 const options={retry,visible,pdf:source,report:receipt,screenshot};
 await fs.writeFile(main,`if(require(${JSON.stringify(path.resolve('tests/helpers/reader-graphics-app.cjs'))})(${JSON.stringify(options)}))require(${JSON.stringify(path.join(runtime,'desktop/main.cjs'))});`);
 const env={...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'1'};delete env.ELECTRON_RUN_AS_NODE;
 const child=spawn(retry?harness:path.join(root,'PDFix.exe'),retry?[path.join(host,'PDFix.exe'),main,launcherReport]:[main],{env,windowsHide:true,stdio:['ignore','pipe','pipe']});let stderr='',timer;
 child.stderr.on('data',b=>{stderr=(stderr+String(b)).slice(-8192);});child.stdout.resume();
 const exit=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>resolve(code));timer=setTimeout(()=>{child.kill();reject(Error('Native graphics check did not close.'));},90000);}).finally(()=>clearTimeout(timer));
 const app=JSON.parse(await fs.readFile(receipt,'utf8')),launch=JSON.parse(await fs.readFile(retry?launcherReport:path.join(profile,'graphics-startup-last.json'),'utf8')),guard=retry?launch.receipt:launch;
 const pass=exit===0&&app.pass&&app.mode===(retry?'software':'normal')&&app.marker.endsWith(':interactive:'+app.mode)&&guard.successfulMode===app.mode&&guard.attempts.length===(retry?2:1)&&(!retry||launch.asks===1&&app.hardwareAcceleration===false)&&app.windowVisible===visible;
 report.checks.push({name,pass,exit,app,guard,screenshot,stderr});if(!pass)break;
}
if(visible&&report.checks.every(c=>c.pass)){report.prompts=[];for(const action of ['prompt','prompt-close']){const render=path.join(root,action+'.png');await promisify(execFile)(harness,[action,render],{windowsHide:true,timeout:15000});report.prompts.push({render,visible:true,action,buttonActivatedByTestTimer:true});}}
report.pass=report.checks.length===2&&report.checks.every(c=>c.pass);await fs.writeFile(path.join(root,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exitCode=report.pass?0:1;
