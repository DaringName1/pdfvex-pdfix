import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function buildCertificateTrustHelper(){
 if(process.platform!=='win32'||process.arch!=='x64')throw new Error('The certificate trust helper build requires Windows x64.');
 const source=path.join(root,'desktop/native/CertificateTrust.cs'),directory=path.join(root,'dist/native/certificate-trust'),destination=path.join(directory,'PDFix.CertificateTrust.exe');
 const sourceSha256=hash(await fs.readFile(source)),{SOURCE_SHA256}=createRequire(import.meta.url)('../desktop/certificate-trust-service.cjs');
 if(sourceSha256!==SOURCE_SHA256)throw new Error('CertificateTrust.cs changed. Review and update the explicit service source SHA-256 pin before compiling.');
 const compiler=path.join(process.env.SystemRoot||'C:\\Windows','Microsoft.NET/Framework64/v4.0.30319/csc.exe');await fs.mkdir(directory,{recursive:true});
 await new Promise((resolve,reject)=>{
  const child=spawn(compiler,['/nologo','/target:exe','/platform:x64','/optimize+','/warnaserror+','/reference:System.Web.Extensions.dll','/out:'+destination,source],{windowsHide:true,shell:false,stdio:['ignore','pipe','pipe']});
  let output='',failure=null;const timer=setTimeout(()=>{failure=new Error('Certificate trust helper compilation exceeded 30 seconds.');child.kill();},30000);
  const collect=part=>{output+=part.toString();if(output.length>65536){failure=new Error('Certificate compiler output exceeds its limit.');child.kill();}};
  child.stdout.on('data',collect);child.stderr.on('data',collect);child.once('error',()=>{clearTimeout(timer);reject(new Error('The Windows Framework C# compiler is unavailable.'));});
  child.once('close',code=>{clearTimeout(timer);if(failure)reject(failure);else if(code!==0)reject(new Error('Certificate trust helper compilation failed: '+output));else resolve();});
 });
 const bytes=await fs.readFile(destination);await fs.writeFile(path.join(directory,'manifest.json'),JSON.stringify({version:1,policy:'windows-offline-base-chain-v1',platform:'win32-x64',file:'PDFix.CertificateTrust.exe',bytes:bytes.length,sha256:hash(bytes),sourceSha256,notice:'NOTICE.txt'},null,2)+'\n');
 await fs.writeFile(path.join(directory,'NOTICE.txt'),'PDFix.CertificateTrust is PDFix application source compiled for Windows x64 using the installed Microsoft .NET Framework compiler. It reads Windows certificate stores with normal user access outside the document AppContainer. Input is a bounded source-bound CMS certificate bundle, never PDF bytes, document paths or executable commands. Windows Crypt32 performs offline base-chain validation with AIA and root auto-update disabled, URL retrieval restricted to cache, and revocation checks disabled. No certificate stores are written. A one-process job limits memory to 256 MiB and CPU time to 15 seconds; the application enforces a 30-second deadline and observed-exit cancellation. This does not establish revocation, trusted signing time, document-signing EKU/policy, Adobe/EU trust-list membership, legal identity or complete PAdES validation. Runtime interoperability and adversarial acceptance remain pending.\n');
 return {directory,file:destination};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))process.stdout.write(JSON.stringify(await buildCertificateTrustHelper())+'\n');
