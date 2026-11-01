// Makes the friendly tester package (what testers and the GitHub release get) from a finished Windows package:
//   releases/PDFix-<label>/  with  PDFix/ (the package), Install PDFix.cmd, Uninstall PDFix.cmd, READ ME FIRST.txt
//   releases/PDFix-<label>.zip  and  releases/PDFix-<label>.zip.sha256.txt
// Usage: node scripts/make-tester-package.mjs --package releases/PDFix-<build>-win-x64 --label beta-1
// "Install PDFix" refuses to run from inside the zip (Windows then extracts only that one file to a temporary folder)
// and says to use "Extract All" first.
import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=name=>{const i=process.argv.indexOf(name);return i>0?process.argv[i+1]:null;};
const CRLF=text=>text.replace(/\r?\n/g,'\r\n');

export const INSTALL_CMD=CRLF(`@echo off
title Install PDFix
setlocal
set "HERE=%~dp0"
rem Run from inside the zip (or any temporary folder): the PDFix folder is missing or this file sits under %TEMP%.
if not exist "%HERE%PDFix\\Install-PDFix.ps1" goto :extract
call set "REST=%%HERE:%TEMP%=%%"
if /i not "%REST%"=="%HERE%" goto :extract
echo Installing PDFix for this Windows user. This takes a few minutes...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%HERE%PDFix\\Install-PDFix.ps1" -DesktopShortcut
if errorlevel 1 (
  echo.
  echo Something went wrong. Take a photo of this window and send it to the person who gave you PDFix.
) else (
  echo.
  echo Done. Open PDFix from the PDFix icon on your desktop or the Start menu.
)
echo.
pause
exit /b
:extract
echo.
echo PDFix can't be installed from inside the zip file.
echo.
echo  1. Close this window.
echo  2. Right-click the zip file and choose "Extract All", then "Extract".
echo  3. In the folder that opens, double-click "Install PDFix".
echo.
pause
exit /b 1
`);

export const UNINSTALL_CMD=CRLF(`@echo off
title Uninstall PDFix
echo This removes the PDFix program. Your documents are kept.
choice /m "Remove PDFix now"
if errorlevel 2 goto :eof
for /d %%B in ("%LOCALAPPDATA%\\Programs\\PDFix\\*") do if exist "%%B\\Uninstall-PDFix.ps1" powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%%B\\Uninstall-PDFix.ps1"
echo.
echo Done. Your settings stay in %APPDATA%\\pdfix-document-workspace in case you install PDFix again.
pause
`);

export const README=CRLF(`PDFix - how to install
======================

1. If you have a zip file: right-click it and choose "Extract All", then "Extract".
   (Installing from inside the zip does not work.)

2. In the extracted folder, double-click "Install PDFix".

3. If a blue box says "Windows protected your PC":
   click "More info", then click "Run anyway".
   (This shows because PDFix is new and not signed yet.)

4. Wait until the window says "Done", then press any key to close it.

5. Open PDFix from the new PDFix icon on your desktop
   (or type PDFix in the Start menu).

Opening a PDF: in PDFix click "Open a file", or drag the PDF onto the PDFix window.
PDFix never changes your original file unless you choose to save over it.

An older PDFix already on this computer is fine. The new one installs next to it.
If a PDFix icon was already on the desktop, the new icon has a longer name
with a date in it. Use that one. You can delete the old icon.

To remove PDFix later: double-click "Uninstall PDFix". Your documents are kept.

Keep the "PDFix" folder next to these files. Do not move things out of it.

Problems? Take a photo of the screen and send it to the person who gave you PDFix.
`);

async function main(){
 const pkg=arg('--package'),label=arg('--label');
 if(!pkg||!label||!/^[A-Za-z0-9][A-Za-z0-9.-]{0,40}$/.test(label)){console.error('Usage: node scripts/make-tester-package.mjs --package releases/PDFix-<build>-win-x64 --label beta-1');process.exit(2);}
 const source=path.resolve(root,pkg);
 for(const required of ['PACKAGE-COMPLETE.json','Install-PDFix.ps1','Uninstall-PDFix.ps1','package-manifest.json'])await fs.access(path.join(source,required)).catch(()=>{throw new Error('Not a finished PDFix package (missing '+required+'): '+source);});
 const out=path.join(root,'releases','PDFix-'+label),zip=out+'.zip';
 for(const existing of [out,zip])if(await fs.access(existing).then(()=>true,()=>false))throw new Error('Already exists, choose a new label: '+existing);
 await fs.mkdir(out);await fs.cp(source,path.join(out,'PDFix'),{recursive:true,errorOnExist:true,force:false});
 await fs.writeFile(path.join(out,'Install PDFix.cmd'),INSTALL_CMD,{flag:'wx'});
 await fs.writeFile(path.join(out,'Uninstall PDFix.cmd'),UNINSTALL_CMD,{flag:'wx'});
 await fs.writeFile(path.join(out,'READ ME FIRST.txt'),README,{flag:'wx'});
 // Windows' own tar writes a standard zip that Explorer's "Extract All" opens.
 const tar=spawnSync(path.join(process.env.SystemRoot||'C:\\Windows','System32','tar.exe'),['-a','-c','-f',zip,'-C',path.dirname(out),path.basename(out)],{stdio:'inherit'});
 if(tar.status!==0)throw new Error('Making the zip failed.');
 const hash=createHash('sha256').update(await fs.readFile(zip)).digest('hex');
 await fs.writeFile(zip+'.sha256.txt',hash+'  '+path.basename(zip)+'\r\n',{flag:'wx'});
 console.log(JSON.stringify({folder:path.relative(root,out),zip:path.relative(root,zip),sha256:hash},null,1));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exit(1);});
