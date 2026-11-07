'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),{spawn}=require('node:child_process');
const {FileError}=require('./file-store.cjs');
const SCRIPT=`$ErrorActionPreference='Stop'; [Console]::InputEncoding=New-Object System.Text.UTF8Encoding $false; while($null -ne ($line=[Console]::ReadLine())) { try { $r=ConvertFrom-Json -InputObject $line; $p=[string]$r.path; $a=[int][IO.File]::GetAttributes($p); $d=New-Object IO.DriveInfo ([IO.Path]::GetPathRoot($p)); [Console]::WriteLine((ConvertTo-Json -Compress -InputObject @{attributes=$a;network=($d.DriveType -eq [IO.DriveType]::Network)})) } catch { [Console]::WriteLine('{"error":true}') } }`;
function chosenPath(value){if(typeof value!=='string'||value.length>4096||!path.isAbsolute(value)||/[\x00\r\n]/.test(value))throw new FileError('PATH','Choose a file with the native picker.');return path.resolve(value);}
function storageFailure(error){const code=String(error?.code||'');if(['EBUSY','ETXTBSY','EACCES','EPERM'].includes(code))return 'The file is locked or permission was denied. Close another editor, check file permissions and try again.';if(['ENOENT','ENOTDIR'].includes(code))return 'The source moved or is no longer synchronized at this location. Choose it again.';return 'Storage metadata is unavailable. Make the file available offline in its synchronization app and try again.';}
class FileAvailability{
 constructor(){this.queue=Promise.resolve();this.closed=false;}
 read(filename){const task=this.queue.catch(()=>{}).then(()=>this.request(filename));this.queue=task;return task;}
 request(filename){
  if(this.closed)throw new FileError('CANCELED','The storage inspection service has closed.');
  if(!this.child){
   this.child=spawn(path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoLogo','-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(SCRIPT,'utf16le').toString('base64')],{windowsHide:true,stdio:['pipe','pipe','ignore']});
   const child=this.child;this.output='';child.stdout.setEncoding('utf8');child.stdout.on('data',chunk=>{if(this.child!==child)return;this.output+=chunk;if(this.output.length>65536)return this.fail();const end=this.output.indexOf('\n');if(end<0)return;const line=this.output.slice(0,end).trim();this.output=this.output.slice(end+1);const wait=this.waiting;this.waiting=null;try{const value=JSON.parse(line);if(value.error||!Number.isInteger(value.attributes)||value.attributes<0||typeof value.network!=='boolean')throw new Error();wait?.resolve(value);}catch{wait?.reject(new FileError('STORAGE','Storage attributes could not be inspected. Make this file available offline and try again.'));}});
   child.on('error',()=>{if(this.child===child)this.fail();});child.on('exit',()=>{if(this.child===child)this.fail();});child.stdin.on('error',()=>{if(this.child===child)this.fail();});
  }
  return new Promise((resolve,reject)=>{const timer=setTimeout(()=>this.fail(),10000);this.waiting={resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}};this.child.stdin.write(JSON.stringify({path:filename})+'\n',error=>{if(error)this.fail();});});
 }
 fail(){const wait=this.waiting;this.waiting=null;const child=this.child;this.child=null;child?.kill();wait?.reject(new FileError('STORAGE','Storage inspection stopped. Make the file available offline and try again.'));}
 async inspect(selected){
  const filename=chosenPath(selected);let stat,attributes=0,network=false;
  // A file that is simply gone gets its own message; the storage wording is for files that exist but are not available offline.
  try{stat=await fs.lstat(filename);if(process.platform==='win32')({attributes,network}=await this.read(filename));}catch(error){if(error?.code==='ENOENT')throw new FileError('MISSING','This file is no longer where it was opened from. It may have been moved, renamed or deleted. Open it from its new place, or remove it from the list with Forget (×).');if(error instanceof FileError)throw error;throw new FileError('STORAGE',storageFailure(error));}
  if(!stat.isFile()&&!stat.isSymbolicLink())throw new FileError('NOT_FILE','Choose a file rather than a folder.');
  const offline=!!(attributes&0x1000),recallOnOpen=!!(attributes&0x40000),recallOnDataAccess=!!(attributes&0x400000),unPinned=!!(attributes&0x100000),pinned=!!(attributes&0x80000);
  return {name:path.basename(filename),location:filename,size:stat.size,attributes,network,offline,recallOnOpen,recallOnDataAccess,downloadRequired:offline||recallOnOpen||recallOnDataAccess,pinned,unPinned,reparse:!!(attributes&0x400),linkedPath:stat.isSymbolicLink(),hardLinkAliases:stat.nlink>1,identity:{dev:stat.dev,ino:stat.ino,size:stat.size,mtimeMs:stat.mtimeMs,ctimeMs:stat.ctimeMs},scope:'Only this selected file. Windows and the installed storage provider control downloading and synchronization; PDFix stages an immutable local copy for PDF reading.'};
 }
 async dispose(){this.closed=true;this.fail();await this.queue.catch(()=>{});}
}
module.exports={FileAvailability,storageFailure};
