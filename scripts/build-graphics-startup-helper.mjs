import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function buildGraphicsStartupHelper(){
 if(process.platform!=='win32'||process.arch!=='x64')throw Error('Graphics startup helper requires Windows x64.');
 const source=path.join(root,'desktop/native/GraphicsStartup.cs'),before=await fs.readFile(source),directory=path.join(root,'dist/native/graphics-startup'),file='PDFix.exe';
 const icon=path.join(root,'public/brand/pdfix.ico'),iconBytes=await fs.readFile(icon);
 if(iconBytes.length<22||iconBytes.length>1024*1024||iconBytes.readUInt32LE(0)!==65536||iconBytes.readUInt16LE(4)<1)throw Error('The PDFix Windows icon is invalid.');
 await fs.mkdir(directory,{recursive:true});
 const compiler=path.join(process.env.SystemRoot||'C:\\Windows','Microsoft.NET/Framework64/v4.0.30319/csc.exe');
 await new Promise((resolve,reject)=>{
  const child=spawn(compiler,['/nologo','/target:winexe','/platform:x64','/optimize+','/warnaserror+','/win32icon:'+icon,'/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll','/reference:System.Web.Extensions.dll','/out:'+path.join(directory,file),source],{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']});
  let output='',failure;const timer=setTimeout(()=>{failure=Error('Graphics helper compilation timed out.');child.kill();},30000);
  for(const stream of [child.stdout,child.stderr])stream.on('data',value=>{output+=value.toString();if(output.length>65536){failure=Error('Graphics compiler output exceeds its limit.');child.kill();}});
  child.once('error',error=>{failure=error;});child.once('close',code=>{clearTimeout(timer);failure?reject(failure):code!==0?reject(Error(output)):resolve();});
 });
 if(hash(before)!==hash(await fs.readFile(source)))throw Error('Graphics helper source changed during compilation.');
 if(hash(iconBytes)!==hash(await fs.readFile(icon)))throw Error('PDFix icon changed during compilation.');
 const bytes=await fs.readFile(path.join(directory,file));
 await fs.writeFile(path.join(directory,'manifest.json'),JSON.stringify({version:1,policy:'explicit-once-before-interactive-graphics-retry-v1',platform:'win32-x64',file,bytes:bytes.length,sha256:hash(bytes),sourceSha256:hash(before),iconSha256:hash(iconBytes)},null,2)+'\n');
 return {directory,file:path.join(directory,file)};
}
