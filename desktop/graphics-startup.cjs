// Startup-only receipt channel from the fixed Windows launcher. No renderer API.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
// Windows can spell the same temp folder two ways: the launcher may get C:\Users\PDFIXT~1\... (a short 8.3 name,
// common when the account name has a space) while Node gets the long form, or the other way round. Both are accepted
// only when they name the very same file; any other difference is still refused.
function sameFileUnderShortName(given,expected){
 if(process.platform!=='win32'||![given,expected].some(p=>p.split(/[\\/]/).some(part=>/~[0-9]/.test(part))))return false;
 if(path.basename(given)!=='state')return false;
 try{const a=fs.statSync(given,{bigint:true}),b=fs.statSync(expected,{bigint:true});return a.dev===b.dev&&a.ino===b.ino;}catch{return false;}
}
function install({app},env=process.env){
 const token=env.PDFIX_GRAPHICS_TOKEN,mode=env.PDFIX_GRAPHICS_MODE;
 if(!token&&!mode&&!env.PDFIX_GRAPHICS_STATE)return {markInteractive(){}};
 if(!/^[a-f0-9]{32}$/.test(token||'')||!['normal','software'].includes(mode))throw Error('Invalid graphics startup session.');
 const expected=path.join(os.tmpdir(),'pdfix-graphics-startup-'+token,'state');
 const given=path.resolve(env.PDFIX_GRAPHICS_STATE||'');
 if(given!==expected&&!sameFileUnderShortName(given,expected))throw Error('Invalid graphics startup receipt location.');
 const directory=fs.lstatSync(path.dirname(expected)),before=fs.lstatSync(expected);
 if(!directory.isDirectory()||directory.isSymbolicLink()||!before.isFile()||before.isSymbolicLink()||before.nlink!==1||before.size>160)throw Error('Invalid graphics startup receipt.');
 const initial=token+':starting:'+mode;
 if(fs.readFileSync(expected,'utf8')!==initial)throw Error('Graphics startup receipt does not match this launch.');
 if(mode==='software')app.disableHardwareAcceleration();
 let marked=false;
 function markInteractive(){
  if(marked)return;
  const fd=fs.openSync(expected,'r+');
  try{const stat=fs.fstatSync(fd);if(stat.ino!==before.ino||stat.dev!==before.dev||stat.nlink!==1||stat.size!==Buffer.byteLength(initial)||fs.readFileSync(fd,'utf8')!==initial)throw Error('Graphics startup receipt changed.');
   const value=Buffer.from(token+':interactive:'+mode);fs.writeSync(fd,value,0,value.length,0);fs.ftruncateSync(fd,value.length);fs.fsyncSync(fd);marked=true;
  }finally{fs.closeSync(fd);}
 }
 // A loaded or shown interface can have edits. Permanently fence out retry first.
 app.on('browser-window-created',(_event,win)=>{win.webContents.once('did-finish-load',markInteractive);win.once('show',markInteractive);});
 return {markInteractive};
}
module.exports={install};
