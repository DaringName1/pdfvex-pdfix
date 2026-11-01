// Prepares a fresh-install test of a PDFix tester zip in Windows Sandbox (a clean, throwaway Windows that is wiped
// when its window closes).
// Usage: node scripts/make-sandbox-test.mjs --zip releases/<tester zip> [--out <folder>] [--network]
// Writes <out>\PDFix-fresh-install.wsb, <out>\in\ (the zip, read-only inside the sandbox), <out>\results\ (the one
// folder the sandbox can write to, for screenshots and notes) and <out>\CHECKLIST.txt. Double-click the .wsb to start.
// Inside the sandbox the zip is copied to Downloads and marked as downloaded from the internet, so Windows treats it
// like a real download. Networking is off unless --network is given, which also proves PDFix works offline.
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';
const arg=name=>{const i=process.argv.indexOf(name);return i>0?process.argv[i+1]:undefined;};
const zip=arg('--zip'),out=path.resolve(arg('--out')||path.join(os.homedir(),'PDFix-Sandbox-Test')),network=process.argv.includes('--network');
if(!zip||!/\.zip$/i.test(zip)){console.error('Usage: node scripts/make-sandbox-test.mjs --zip <tester zip> [--out <folder>] [--network]');process.exit(2);}
if(/[\\/]My Drive[\\/]|[\\/]OneDrive|[\\/]Dropbox/i.test(out)){console.error('Choose a folder that is not synced to the cloud for --out.');process.exit(2);}
const xml=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
await fs.mkdir(path.join(out,'in'),{recursive:true});await fs.mkdir(path.join(out,'results'),{recursive:true});
for(const name of await fs.readdir(path.join(out,'in')))await fs.rm(path.join(out,'in',name),{force:true});
const bytes=await fs.readFile(zip),name=path.basename(zip),sha256=createHash('sha256').update(bytes).digest('hex');await fs.writeFile(path.join(out,'in',name),bytes);
const sandboxIn='C:\\Users\\WDAGUtilityAccount\\Desktop\\PDFix-in',sandboxResults='C:\\Users\\WDAGUtilityAccount\\Desktop\\PDFix-results';
// Runs once at sign-in inside the sandbox: copy the zip to Downloads, mark it as an internet download, open Downloads.
const setup=[`$zip = Join-Path '${sandboxIn}' '${name}'`,`$dest = Join-Path $env:USERPROFILE 'Downloads\\${name}'`,'Copy-Item $zip $dest -Force',
  "Set-Content -Path $dest -Stream Zone.Identifier -Value \"[ZoneTransfer]`r`nZoneId=3`r`nHostUrl=https://github.com/\"",
  `(Get-FileHash $dest -Algorithm SHA256).Hash | Out-File (Join-Path '${sandboxResults}' 'sha256-inside-sandbox.txt')`,
  'Start-Process explorer.exe (Join-Path $env:USERPROFILE Downloads)',''].join('\r\n');
await fs.writeFile(path.join(out,'in','sandbox-setup.ps1'),setup);
const wsb=`<Configuration>
  <Networking>${network?'Enable':'Disable'}</Networking>
  <ClipboardRedirection>Disable</ClipboardRedirection>
  <PrinterRedirection>Disable</PrinterRedirection>
  <AudioInput>Disable</AudioInput>
  <VideoInput>Disable</VideoInput>
  <MemoryInMB>6144</MemoryInMB>
  <MappedFolders>
    <MappedFolder><HostFolder>${xml(path.join(out,'in'))}</HostFolder><SandboxFolder>${sandboxIn}</SandboxFolder><ReadOnly>true</ReadOnly></MappedFolder>
    <MappedFolder><HostFolder>${xml(path.join(out,'results'))}</HostFolder><SandboxFolder>${sandboxResults}</SandboxFolder><ReadOnly>false</ReadOnly></MappedFolder>
  </MappedFolders>
  <LogonCommand><Command>powershell.exe -NoProfile -ExecutionPolicy Bypass -File ${sandboxIn}\\sandbox-setup.ps1</Command></LogonCommand>
</Configuration>
`;
await fs.writeFile(path.join(out,'PDFix-fresh-install.wsb'),wsb);
await fs.writeFile(path.join(out,'CHECKLIST.txt'),`PDFix fresh-install test in Windows Sandbox
Zip: ${name}
SHA-256 (on this PC): ${sha256}
Networking inside the sandbox: ${network?'on':'off (also proves PDFix works offline)'}

Start: double-click PDFix-fresh-install.wsb. Downloads opens with the zip in it, as if just downloaded.
Write what you see in results\\NOTES.txt inside the sandbox (Desktop\\PDFix-results); screenshots go there too.
Everything else is wiped when the sandbox window closes.

 1. The SHA-256 in Desktop\\PDFix-results\\sha256-inside-sandbox.txt matches the one above.
 2. Double-click the zip and try "Install PDFix" from inside it: it should say to Extract All first.
 3. Right-click the zip > Extract All > Extract. Open the extracted folder.
 4. Open "READ ME FIRST" and follow it exactly as a new person would. Note anything unclear.
 5. Run "Install PDFix". Note every Windows warning (SmartScreen, "Windows protected your PC") and what you clicked.
 6. PDFix starts from the Start menu and the desktop shortcut.
 7. First start: no errors, no account asked for, nothing online needed.
 8. Make a new document, type a line, save a Word copy and a PDF copy to Documents. Both open again in PDFix.
 9. Open a PDF (the saved one), add a note, Save a copy, then "Continue with this copy".
10. Close PDFix, open it again: recent files show; nothing lost.
11. Run "Uninstall PDFix": PDFix and its shortcuts are gone; your saved documents are still in Documents.
12. Time from opening the zip to the first saved file: ____ minutes.
`);
console.log(JSON.stringify({out,wsb:path.join(out,'PDFix-fresh-install.wsb'),zip:name,sha256,network},null,1));
