const fs=require('node:fs/promises'),path=require('node:path');
const {spawn}=require('node:child_process');
const {FileError}=require('./file-store.cjs');
const same=(a,b)=>['dev','ino','size','mtimeMs','ctimeMs'].every(key=>a[key]===b[key]);
const key=value=>process.platform==='win32'?path.resolve(value).toLowerCase():path.resolve(value);
// Windows may give the same folder a short 8.3 name (C:\\Users\\PDFIXT~1 for an account name with a space, as in TEMP). Two
// paths that differ only where one uses such a short name are the same folder; links are refused separately above.
const shortNamesOnly=(given,real)=>{if(process.platform!=='win32')return false;const a=path.resolve(given).split(/[\\/]+/),b=path.resolve(real).split(/[\\/]+/);return a.length===b.length&&a.every((part,i)=>part.toLowerCase()===b[i].toLowerCase()||/~\d+(\.[^.]*)?$/.test(part));};
const unsafe=()=>new FileError('SEARCH_SCOPE','Linked, reparse, offline or cloud-placeholder paths are excluded from folder search. Choose an ordinary local folder.');
// Node's lstat does not expose every Windows reparse tag. A fixed, non-parser
// broker checks GetFileAttributes, including cloud recall flags, without loading
// document content. User paths travel only as JSON stdin, never as script text.
const SCRIPT=`$ErrorActionPreference='Stop'; while($null -ne ($line=[Console]::ReadLine())) { try { $r=ConvertFrom-Json -InputObject $line; $items=@(); foreach($p in $r.paths) { try { $drive=New-Object IO.DriveInfo ([IO.Path]::GetPathRoot([string]$p)); if($drive.DriveType -eq [IO.DriveType]::Network) { $items+=-1 } else { $items+=([int][IO.File]::GetAttributes([string]$p)) } } catch { $items+=-1 } }; [Console]::WriteLine((ConvertTo-Json -Compress -InputObject @{attributes=$items})) } catch { [Console]::WriteLine('{"error":true}') } }`;
class PathAttributes{
 constructor(){this.queue=Promise.resolve();this.closed=false;}
 async read(paths){
  if(process.platform!=='win32')return null;
  const task=this.queue.catch(()=>{}).then(()=>this.request(paths));this.queue=task;return task;
 }
 request(paths){
  if(this.closed)throw new FileError('CANCELED','Folder grant was revoked.');
  if(!this.child){
   const systemRoot=process.env.SystemRoot||'C:\\Windows';
   this.child=spawn(path.join(systemRoot,'System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoLogo','-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(SCRIPT,'utf16le').toString('base64')],{windowsHide:true,stdio:['pipe','pipe','ignore']});
   this.output='';this.child.stdout.setEncoding('utf8');this.child.stdout.on('data',value=>{this.output+=value;if(this.output.length>65536){this.fail();return;}const end=this.output.indexOf('\n');if(end>=0){const line=this.output.slice(0,end).trim();this.output=this.output.slice(end+1);const waiting=this.waiting;this.waiting=null;try{waiting?.resolve(JSON.parse(line));}catch{waiting?.reject(unsafe());}}});
   this.child.on('error',()=>this.fail());this.child.on('exit',()=>this.fail());this.child.stdin.on('error',()=>this.fail());
  }
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>this.fail(),10000);
   this.waiting={resolve:value=>{clearTimeout(timer);if(value.error||!Array.isArray(value.attributes)||value.attributes.length!==paths.length)reject(unsafe());else resolve(value.attributes);},reject:error=>{clearTimeout(timer);reject(error);}};
   this.child.stdin.write(JSON.stringify({paths})+'\n',error=>{if(error)this.fail();});
  });
 }
 fail(){const waiting=this.waiting;this.waiting=null;waiting?.reject(unsafe());this.child?.kill();this.child=null;this.closed=true;}
 close(){this.fail();}
}
class SearchFolderGrant{
 constructor(root,recursive){this.root=path.resolve(root);this.recursive=recursive;this.attributes=new PathAttributes();this.revoked=false;}
 contains(filename){const relative=path.relative(this.root,path.resolve(filename));return relative===''||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative));}
 check(){if(this.revoked)throw new FileError('CANCELED','Folder search grant was revoked.');}
 async inspect(filename,{directory=false,expected}={}){
  this.check();if(!this.contains(filename)){const real=await fs.realpath(filename).catch(()=>null);if(!(real&&shortNamesOnly(filename,real)&&this.contains(real)))throw unsafe();}
  const paths=[];let current=path.resolve(filename);
  for(;;){paths.push(current);const parent=path.dirname(current);if(parent===current)break;current=parent;}
  const attributes=await this.attributes.read(paths);this.check();
  if(attributes?.some(value=>value<0||(value&(0x400|0x1000|0x40000|0x400000))))throw unsafe();
  for(let index=paths.length-1;index>=0;index--){const stat=await fs.lstat(paths[index]);if(stat.isSymbolicLink()||(index>0&&!stat.isDirectory()))throw unsafe();}
  const stat=await fs.lstat(filename),real=await fs.realpath(filename);
  if(stat.isSymbolicLink()||(key(real)!==key(filename)&&!shortNamesOnly(filename,real))||!this.contains(real)||(directory?!stat.isDirectory():!stat.isFile())||(!directory&&stat.nlink!==1))throw unsafe();
  if(this.rootStat){const rootNow=await fs.lstat(this.root);if(rootNow.dev!==this.rootStat.dev||rootNow.ino!==this.rootStat.ino)throw new FileError('CHANGED','The granted folder was replaced. Choose it again.');}
  if(expected&&!same(stat,expected))throw new FileError('CHANGED','This PDF changed after folder discovery. Choose the folder again.');
  this.check();return stat;
 }
 async init(){const real=await fs.realpath(this.root).catch(()=>null);if(real&&key(real)!==key(this.root)&&shortNamesOnly(this.root,real))this.root=path.resolve(real);this.rootStat=await this.inspect(this.root,{directory:true});return this;}
 revoke(){this.revoked=true;this.attributes.close();}
}
module.exports={SearchFolderGrant,same};
