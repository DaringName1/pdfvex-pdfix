import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function buildSpellingHelper(){
 if(process.platform!=='win32'||process.arch!=='x64')throw new Error('The local spelling helper build requires Windows x64.');
 const source=path.join(root,'desktop/native/LocalSpelling.cs'),directory=path.join(root,'dist/native/local-spelling'),destination=path.join(directory,'PDFix.LocalSpelling.exe');
 const sourceSha256=hash(await fs.readFile(source)),{SOURCE_SHA256}=createRequire(import.meta.url)('../desktop/local-spelling-service.cjs');
 if(sourceSha256!==SOURCE_SHA256)throw new Error('LocalSpelling.cs changed. Review and update its explicit service source SHA-256 pin before compiling.');
 const compiler=path.join(process.env.SystemRoot||'C:\\Windows','Microsoft.NET/Framework64/v4.0.30319/csc.exe');await fs.mkdir(directory,{recursive:true});
 await new Promise((resolve,reject)=>{
  const child=spawn(compiler,['/nologo','/target:exe','/platform:x64','/optimize+','/warnaserror+','/reference:System.Web.Extensions.dll','/out:'+destination,source],{windowsHide:true,shell:false,stdio:['ignore','pipe','pipe']});
  let output='',failure=null;const timer=setTimeout(()=>{failure=new Error('Local spelling compilation exceeded 30 seconds.');child.kill();},30000);
  const collect=part=>{output+=part.toString();if(output.length>65536){failure=new Error('The compiler output exceeded its limit.');child.kill();}};
  child.stdout.on('data',collect);child.stderr.on('data',collect);child.once('error',()=>{clearTimeout(timer);reject(new Error('The installed Windows Framework C# compiler is unavailable.'));});
  child.once('close',code=>{clearTimeout(timer);if(failure)reject(failure);else if(code!==0)reject(new Error('Local spelling helper compilation failed: '+output));else resolve();});
 });
 const bytes=await fs.readFile(destination);await fs.writeFile(path.join(directory,'manifest.json'),JSON.stringify({version:1,policy:'windows-local-spelling-v1',platform:'win32-x64',file:'PDFix.LocalSpelling.exe',bytes:bytes.length,sha256:hash(bytes),sourceSha256,notice:'NOTICE.txt'},null,2)+'\n');
 await fs.writeFile(path.join(directory,'NOTICE.txt'),'PDFix.LocalSpelling is PDFix application source compiled using the installed Microsoft .NET Framework compiler. Windows Spell Checking API and installed language providers supply local spelling dictionaries and suggestions. No third-party dictionary, service subscription, download or network API is used or bundled. The adapter accepts bounded text and a language tag; it accepts no document path or executable command. It exposes language listing, Check and Suggest only, with no Windows dictionary mutation or registration. PDFix personal words are stored separately by the application. The helper runs with normal user access outside the document AppContainer because it needs installed Windows providers, with a 256 MiB, one-process, 10-second CPU job, 15-second app deadline, observed-exit cancellation and actual-parent process-handle monitoring. Native/provider interoperability, dictionary and UI acceptance remain pending; compilation does not establish runtime acceptance.\n');
 return {directory,file:destination};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))process.stdout.write(JSON.stringify(await buildSpellingHelper())+'\n');
