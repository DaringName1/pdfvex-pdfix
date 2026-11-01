import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function buildSpeechHelper(){
 if(process.platform!=='win32'||process.arch!=='x64')throw new Error('The local speech helper build requires Windows x64.');
 const source=path.join(root,'desktop/native/PDFix.Speech.cs'),directory=path.join(root,'dist/native/speech'),destination=path.join(directory,'PDFix.Speech.exe');
 const sourceSha256=hash(await fs.readFile(source)),{SOURCE_SHA256,POLICY}=createRequire(import.meta.url)('../desktop/local-speech-service.cjs');
 if(sourceSha256!==SOURCE_SHA256)throw new Error('PDFix.Speech.cs changed. Review and update the explicit service source SHA-256 pin before compiling.');
 const windowsRoot=process.env.SystemRoot||'C:\\Windows';
 const compiler=path.join(windowsRoot,'Microsoft.NET/Framework64/v4.0.30319/csc.exe');
 const speechAssembly=path.join(windowsRoot,'Microsoft.NET/assembly/GAC_MSIL/System.Speech/v4.0_4.0.0.0__31bf3856ad364e35/System.Speech.dll');
 await fs.access(speechAssembly);await fs.mkdir(directory,{recursive:true});
 await new Promise((resolve,reject)=>{
  const child=spawn(compiler,['/nologo','/target:exe','/platform:x64','/optimize+','/warnaserror+','/reference:System.Web.Extensions.dll','/reference:'+speechAssembly,'/out:'+destination,source],{windowsHide:true,shell:false,stdio:['ignore','pipe','pipe']});
  let output='',failure=null;const timer=setTimeout(()=>{failure=new Error('Speech helper compilation exceeded 30 seconds.');child.kill();},30000);
  const collect=part=>{output+=part.toString();if(output.length>65536){failure=new Error('Speech compiler output exceeds its limit.');child.kill();}};
  child.stdout.on('data',collect);child.stderr.on('data',collect);child.once('error',()=>{clearTimeout(timer);reject(new Error('The Windows Framework C# compiler is unavailable.'));});
  child.once('close',code=>{clearTimeout(timer);if(failure)reject(failure);else if(code!==0)reject(new Error('Speech helper compilation failed: '+output));else resolve();});
 });
 const bytes=await fs.readFile(destination);await fs.writeFile(path.join(directory,'manifest.json'),JSON.stringify({version:1,policy:POLICY,platform:'win32-x64',file:'PDFix.Speech.exe',bytes:bytes.length,sha256:hash(bytes),sourceSha256,notice:'NOTICE.txt'},null,2)+'\n');
 await fs.writeFile(path.join(directory,'NOTICE.txt'),'PDFix.Speech is PDFix application source compiled for Windows x64 using the installed Microsoft .NET Framework compiler. Windows System.Speech/SAPI and installed speech engines are operating-system/vendor components; no speech engine or voice is redistributed. The adapter uses installed voices and the default Windows audio device outside the document AppContainer. It accepts only bounded user-requested plain text, exact installed voice IDs and fixed playback controls, never document paths, SSML, URLs or shell commands. It implements no cloud speech API, account integration, network retrieval or voice download. A one-process job limits memory to 256 MiB and CPU time to 120 seconds; parent-liveness and 15-second heartbeat checks plus a two-hour lifetime bound protect orphan cleanup. Cancellation must observe process exit before audio ownership is released. Actual installed-voice/audio compatibility, pause/resume/progress timing and adversarial runtime acceptance remain pending; only compilation/source checks were requested.\n');
 return {directory,file:destination};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))process.stdout.write(JSON.stringify(await buildSpeechHelper())+'\n');
