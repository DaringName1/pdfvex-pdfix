import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
const SOURCE_SHA256='77bf19c281ecc17f93b5565684cac20c91fb410a7eff97b63ed41af4d5987fad';
export async function buildNativeSandbox(){
  if(process.platform!=='win32'||process.arch!=='x64')throw new Error('The PDFix native sandbox build requires Windows x64.');
  const source=path.resolve('desktop/native/SandboxLauncher.cs'),directory=path.resolve('dist/native/sandbox');
  const sourceBytes=await fs.readFile(source);
  if(createHash('sha256').update(sourceBytes).digest('hex')!==SOURCE_SHA256)throw new Error('SandboxLauncher.cs changed. Review and update its explicit source SHA-256 pin before compiling.');
  const compiler=path.join(process.env.SystemRoot||'C:\\Windows','Microsoft.NET/Framework64/v4.0.30319/csc.exe');
  await fs.mkdir(directory,{recursive:true});
  const destination=path.join(directory,'PDFix.Sandbox.exe');
  // Reuse only the reviewed source and matching local build, so renderer-only
  // test builds do not overwrite a broker another isolated check is using.
  if(process.env.PDFIX_FORCE_NATIVE_BUILD!=='1')try{
    const manifestFile=path.join(directory,'manifest.json'),[file,metadata]=await Promise.all([fs.lstat(destination),fs.lstat(manifestFile)]);
    if(file.isFile()&&!file.isSymbolicLink()&&file.size>0&&file.size<=4*1024*1024&&metadata.isFile()&&!metadata.isSymbolicLink()&&metadata.size<=4096){
      const [bytes,text]=await Promise.all([fs.readFile(destination),fs.readFile(manifestFile,'utf8')]),manifest=JSON.parse(text);
      if(manifest.version===1&&manifest.policy==='appcontainer-job-v1'&&manifest.platform==='win32-x64'&&manifest.file==='PDFix.Sandbox.exe'&&manifest.sourceSha256===SOURCE_SHA256&&bytes.toString('ascii',0,2)==='MZ'&&createHash('sha256').update(bytes).digest('hex')===manifest.sha256)return;
    }
  }catch{} // Missing, stale or changed artifacts require normal compilation.
  await new Promise((resolve,reject)=>{
    const child=spawn(compiler,['/nologo','/target:exe','/platform:x64','/optimize+','/warnaserror+','/out:'+destination,source],{windowsHide:true,shell:false,stdio:['ignore','pipe','pipe']});
    let output='',done=false;
    const timer=setTimeout(()=>{child.kill();finish(new Error('Native sandbox compilation exceeded 30 seconds.'));},30000);
    const finish=error=>{if(done)return;done=true;clearTimeout(timer);error?reject(error):resolve();};
    const collect=part=>{output+=part.toString();if(output.length>65536){child.kill();finish(new Error('Native sandbox compiler returned too much output.'));}};
    child.stdout.on('data',collect);child.stderr.on('data',collect);
    child.once('error',()=>finish(new Error('The Windows Framework C# compiler is unavailable.')));
    child.once('close',code=>finish(code===0?null:new Error('Native sandbox compilation failed: '+output)));
  });
  const bytes=await fs.readFile(destination);
  if(createHash('sha256').update(await fs.readFile(source)).digest('hex')!==SOURCE_SHA256)throw new Error('SandboxLauncher.cs changed during compilation.');
  await fs.writeFile(path.join(directory,'manifest.json'),JSON.stringify({version:1,policy:'appcontainer-job-v1',platform:'win32-x64',file:'PDFix.Sandbox.exe',sha256:createHash('sha256').update(bytes).digest('hex'),sourceSha256:createHash('sha256').update(sourceBytes).digest('hex')},null,2)+'\n');
}
