import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';

// Explicitly reviewed source pin: no compiler invocation after unnoticed edits.
const SOURCE_SHA256='8b07156e45ec675a431cedbf352b651ff5b9490d454c046b26670f3c571b6c95';
export async function buildPagedSessionEngine(){
  if(process.platform!=='win32'||process.arch!=='x64')throw new Error('The PDFix paged session engine build requires Windows x64.');
  const source=path.resolve('desktop/native/PagedSessionEngine.cs'),directory=path.resolve('dist/native/paged-session');
  const sourceBytes=await fs.readFile(source);
  if(createHash('sha256').update(sourceBytes).digest('hex')!==SOURCE_SHA256)throw new Error('PagedSessionEngine.cs changed. Review and update its explicit source SHA-256 pin before compiling.');
  const compiler=path.join(process.env.SystemRoot||'C:\\Windows','Microsoft.NET/Framework64/v4.0.30319/csc.exe');
  await fs.mkdir(directory,{recursive:true});
  const destination=path.join(directory,'PDFix.PagedSession.exe');
  await new Promise((resolve,reject)=>{
    const child=spawn(compiler,['/nologo','/target:exe','/platform:x64','/optimize+','/warnaserror+','/out:'+destination,source],{windowsHide:true,shell:false,stdio:['ignore','pipe','pipe']});
    let output='',done=false;
    const finish=error=>{if(done)return;done=true;clearTimeout(timer);error?reject(error):resolve();};
    const timer=setTimeout(()=>{child.kill();finish(new Error('Paged session engine compilation exceeded 30 seconds.'));},30000);
    const collect=part=>{output+=part.toString();if(output.length>65536){child.kill();finish(new Error('Paged session engine compiler returned too much output.'));}};
    child.stdout.on('data',collect);child.stderr.on('data',collect);
    child.once('error',()=>finish(new Error('The Windows Framework C# compiler is unavailable.')));
    child.once('close',code=>finish(code===0?null:new Error('Paged session engine compilation failed: '+output)));
  });
  const bytes=await fs.readFile(destination);
  if(createHash('sha256').update(await fs.readFile(source)).digest('hex')!==SOURCE_SHA256)throw new Error('PagedSessionEngine.cs changed during compilation.');
  await fs.writeFile(path.join(directory,'manifest.json'),JSON.stringify({version:1,policy:'appcontainer-paged-session-v1',platform:'win32-x64',file:'PDFix.PagedSession.exe',sha256:createHash('sha256').update(bytes).digest('hex'),sourceSha256:SOURCE_SHA256},null,2)+'\n');
}
