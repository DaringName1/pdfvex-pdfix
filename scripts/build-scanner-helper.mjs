import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function buildScannerHelper(){
 if(process.platform!=='win32'||process.arch!=='x64')throw new Error('The scanner helper build requires Windows x64.');
 const source=path.join(root,'desktop/native/ScannerCapture.cs'),directory=path.join(root,'dist/native/scanner'),destination=path.join(directory,'PDFix.Scanner.exe');
 const compiler=path.join(process.env.SystemRoot||'C:\\Windows','Microsoft.NET/Framework64/v4.0.30319/csc.exe');await fs.mkdir(directory,{recursive:true});
 await new Promise((resolve,reject)=>{
  const child=spawn(compiler,['/nologo','/target:exe','/platform:x64','/optimize+','/warnaserror+','/reference:Microsoft.CSharp.dll','/reference:System.Web.Extensions.dll','/out:'+destination,source],{windowsHide:true,shell:false,stdio:['ignore','pipe','pipe']});
  let output='',failure=null;const timer=setTimeout(()=>{failure=new Error('Scanner helper compilation exceeded 30 seconds.');child.kill();},30000);
  const collect=part=>{output+=part.toString();if(output.length>65536){failure=new Error('Scanner compiler output exceeds its limit.');child.kill();}};
  child.stdout.on('data',collect);child.stderr.on('data',collect);child.once('error',()=>{clearTimeout(timer);reject(new Error('The Windows Framework C# compiler is unavailable.'));});
  child.once('close',code=>{clearTimeout(timer);if(failure)reject(failure);else if(code!==0)reject(new Error('Scanner helper compilation failed: '+output));else resolve();});
 });
 const bytes=await fs.readFile(destination);await fs.writeFile(path.join(directory,'manifest.json'),JSON.stringify({version:1,policy:'wia-trusted-device-adapter-v1',platform:'win32-x64',file:'PDFix.Scanner.exe',bytes:bytes.length,sha256:hash(bytes),sourceSha256:hash(await fs.readFile(source)),notice:'NOTICE.txt'},null,2)+'\n');
 await fs.writeFile(path.join(directory,'NOTICE.txt'),'PDFix.Scanner is PDFix application source compiled for Windows x64 using the installed Microsoft .NET Framework compiler. No third-party scanner SDK is redistributed. Windows Image Acquisition, the .NET runtime and scanner drivers are operating-system/vendor components installed separately. The helper needs normal user device access and runs outside the document AppContainer. WIA transfer and normalization use Windows/vendor codecs; the helper has a 768 MiB process memory limit, one-process job limit and an app-controlled deadline. Physical-device, driver and cancellation acceptance remain pending.\n');
 return {directory,file:destination};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))process.stdout.write(JSON.stringify(await buildScannerHelper())+'\n');
