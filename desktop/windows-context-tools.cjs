'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const {spawn}=require('node:child_process');
const {FileError}=require('./file-store.cjs');
const OWNER='com.pdfix.documentworkspace.context.v1.934a66f2';
const BASE='HKEY_CURRENT_USER\\Software\\Classes\\SystemFileAssociations\\.pdf\\shell';
const VERBS=Object.freeze([{action:'open',suffix:'Open',label:'Open in PDFix'},{action:'convert',suffix:'Convert',label:'Convert PDF pages in PDFix'},{action:'compress',suffix:'Compress',label:'Compress in PDFix'},{action:'merge',suffix:'Merge',label:'Merge selected PDFs in PDFix'}]);
const equal=(a,b)=>a.toLowerCase()===b.toLowerCase();
function executablePath(value){if(typeof value!=='string'||value.length>4096||!path.win32.isAbsolute(value)||! /^[a-z]:\\/i.test(value)||/[^\x20-\x7e]|["%]/.test(value)||path.win32.basename(value).toLowerCase()!=='pdfix.exe')throw new FileError('WINDOWS_CONTEXT','Use the running packaged PDFix.exe in its complete application folder. This registry adapter requires an ASCII package path without percent signs.');return path.win32.normalize(value);}
function contextEntries(executable){const exe=executablePath(executable);return VERBS.map(verb=>{const key=BASE+'\\PDFix.Context.v1.'+verb.suffix;return {action:verb.action,key,values:[{key,name:'PDFixOwner',value:OWNER},{key,name:'PDFixExecutable',value:exe},{key,name:'MUIVerb',value:verb.label},{key,name:'Icon',value:`"${exe}",0`},{key,name:'MultiSelectModel',value:'Document'},{key:key+'\\command',name:'',value:`"${exe}" --pdfix-context-v1 ${verb.action} -- "%1"`}]};});}
async function regular(filename){const real=await fs.realpath(filename);if(!equal(real,path.resolve(filename)))throw new FileError('WINDOWS_CONTEXT','Linked application paths are not supported.');for(let current=filename;;current=path.dirname(current)){const stat=await fs.lstat(current);if(stat.isSymbolicLink())throw new FileError('WINDOWS_CONTEXT','Linked application paths are not supported.');if(path.dirname(current)===current)break;}const stat=await fs.lstat(filename);if(!stat.isFile()||stat.nlink!==1)throw new FileError('WINDOWS_CONTEXT','The application file is not a regular unaliased file.');return stat;}
async function boundedJson(filename,maximum){const before=await regular(filename);if(before.size<1||before.size>maximum)throw new FileError('WINDOWS_CONTEXT','The packaged application metadata is unavailable.');const bytes=await fs.readFile(filename),after=await regular(filename);if(before.size!==bytes.length||before.ino!==after.ino||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs)throw new FileError('CHANGED','The application metadata changed.');try{return JSON.parse(bytes.toString('utf8'));}catch{throw new FileError('WINDOWS_CONTEXT','The packaged application metadata is invalid.');}}
async function packagedIdentity({isPackaged,executable,resourcesPath,appPath}){
 if(process.platform!=='win32'||isPackaged!==true)throw new FileError('WINDOWS_CONTEXT','Install the complete Windows PDFix package before adding its right-click tools.');
 const exe=executablePath(executable),resources=path.resolve(path.dirname(exe),'resources'),payload=path.join(resources,'app');
 if(!equal(path.resolve(resourcesPath),resources)||!equal(path.resolve(appPath),payload))throw new FileError('WINDOWS_CONTEXT','The running application and its packaged resources must belong to the same PDFix folder.');
 const stat=await regular(exe);if(stat.size<1024||stat.size>512*1024*1024)throw new FileError('WINDOWS_CONTEXT','The packaged Windows executable is invalid.');
 const handle=await fs.open(exe,'r');try{const head=Buffer.alloc(2);if((await handle.read(head,0,2,0)).bytesRead!==2||head.toString('ascii')!=='MZ')throw new FileError('WINDOWS_CONTEXT','The packaged executable has no Windows PE header.');}finally{await handle.close();}
 const metadata=await boundedJson(path.join(payload,'package.json'),64*1024);
 if(metadata.name!=='pdfix-document-workspace'||metadata.productName!=='PDFix'||metadata.main!=='desktop/main.cjs'||typeof metadata.version!=='string'||!/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i.test(metadata.version))throw new FileError('WINDOWS_CONTEXT','The packaged application identity does not match PDFix.');
 await regular(path.join(payload,'desktop','main.cjs'));await regular(path.join(payload,'dist','index.html'));
 return {executable:exe,version:metadata.version};
}
function parseRegistry(output){
 const records=[];let key=null;
 for(const line of output.split(/\r?\n/)){
  if(!line.trim())continue;
  if(line.startsWith('HKEY_CURRENT_USER\\')){key=line.trim();continue;}
  const matched=line.match(/^\s+(.+?)\s{2,}(REG_[A-Z0-9_]+)\s{2,}(.*)$/);
  if(!key||!matched)throw new FileError('WINDOWS_CONTEXT','Windows returned an unsupported registry response.');
  records.push({key,name:matched[1],type:matched[2],value:matched[3]});
 }
 return records;
}
function nativeReg(executable,args){
 return new Promise((resolve,reject)=>{
  let settled=false,output='',errors='';
  const child=spawn(executable,args,{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']});
  const fail=error=>{if(settled)return;settled=true;clearTimeout(timer);child.kill();reject(error);};
  const timer=setTimeout(()=>fail(new FileError('WINDOWS_CONTEXT','Windows registry access timed out.')),10000);
  child.stdout.on('data',bytes=>{output+=bytes.toString();if(output.length>65536)fail(new FileError('WINDOWS_CONTEXT','The context menu registry response is too large.'));});
  child.stderr.on('data',bytes=>{errors+=bytes.toString();if(errors.length>8192)fail(new FileError('WINDOWS_CONTEXT','Windows registry access failed.'));});
  child.on('error',()=>fail(new FileError('WINDOWS_CONTEXT','Windows registry access is unavailable.')));
  child.on('close',code=>{if(settled)return;settled=true;clearTimeout(timer);resolve({code,output});});
 });
}
class WindowsContextTools{
 constructor(identity){this.identity=Object.freeze({...identity});this.busy=false;}
 async systemReg(){const root=process.env.SystemRoot;if(typeof root!=='string'||! /^[a-z]:\\[a-z0-9 _.-]+$/i.test(root))throw new FileError('WINDOWS_CONTEXT','The Windows system directory is unavailable.');const exe=path.join(root,'System32','reg.exe');await regular(exe);return exe;}
 async absent(key,reg){
  const separator=key.lastIndexOf('\\');if(separator<0)throw new FileError('WINDOWS_CONTEXT','Windows could not inspect the current-user registry.');
  const parent=key.slice(0,separator),result=await nativeReg(reg,['query',parent]);
  if(result.code===1)return await this.absent(parent,reg);
  if(result.code!==0)throw new FileError('WINDOWS_CONTEXT','Windows could not inspect the PDFix context menu.');
  if(result.output.split(/\r?\n/).some(line=>equal(line.trim(),key)))throw new FileError('WINDOWS_CONTEXT','A PDFix context key exists but cannot be read. Its integration was preserved.');
  return true;
 }
 async query(key,reg){const result=await nativeReg(reg,['query',key,'/s']);if(result.code===1){await this.absent(key,reg);return null;}if(result.code!==0)throw new FileError('WINDOWS_CONTEXT','Windows could not inspect the PDFix context menu.');return parseRegistry(result.output);}
 async inspect(reg){
  const result=[];
  for(const verb of contextEntries(this.identity.executable)){
   const records=await this.query(verb.key,reg);
   if(records===null){result.push({...verb,state:'absent'});continue;}
   const own=records.find(item=>equal(item.key,verb.key)&&item.name==='PDFixOwner');
   if(!own||own.type!=='REG_SZ'||own.value!==OWNER){result.push({...verb,state:'conflict'});continue;}
   const saved=records.find(item=>equal(item.key,verb.key)&&item.name==='PDFixExecutable');let expected;
   try{expected=contextEntries(saved?.value??this.identity.executable).find(item=>item.action===verb.action);}catch{result.push({...verb,state:'conflict'});continue;}
   // /ve identifies the real unnamed value even on localized Windows. Named
   // command values must not be mistaken for the unnamed shell command.
   const defaultResult=await nativeReg(reg,['query',verb.key+'\\command','/ve']);
   if(defaultResult.code===0){const unnamed=parseRegistry(defaultResult.output);if(unnamed.length!==1)throw new FileError('WINDOWS_CONTEXT','The context command registry response is invalid.');for(const item of records)if(equal(item.key,unnamed[0].key)&&item.name===unnamed[0].name&&item.type===unnamed[0].type&&item.value===unnamed[0].value)item.name='';}
   const seen=new Set();
   const unexpected=records.some(item=>{const id=(item.key+'\0'+item.name).toLowerCase(),duplicate=seen.has(id);seen.add(id);return duplicate||!expected.values.some(value=>equal(value.key,item.key)&&equal(value.name,item.name)&&item.type==='REG_SZ'&&item.value===value.value);});
   // Unknown child keys are not represented by value records. Verify key lines too.
   const raw=await nativeReg(reg,['query',verb.key,'/s']);
   const unexpectedKey=raw.code!==0||raw.output.split(/\r?\n/).filter(line=>line.startsWith('HKEY_CURRENT_USER\\')).some(key=>!equal(key.trim(),verb.key)&&!equal(key.trim(),verb.key+'\\command'));
   result.push({...verb,records,state:unexpected||unexpectedKey?'conflict':records.length===expected.values.length&&saved?.value===this.identity.executable?'installed':'partial'});
  }
  return result;
 }
 async status(){
  if(process.platform!=='win32')return {platform:'unsupported',available:false,installed:false,state:'unsupported',message:'Right-click PDF tools are available in the Windows desktop package.'};
  try{const packaged=await packagedIdentity(this.identity),reg=await this.systemReg(),entries=await this.inspect(reg),conflicts=entries.filter(item=>item.state==='conflict').map(item=>item.action),state=conflicts.length?'conflict':entries.every(item=>item.state==='installed')?'installed':entries.every(item=>item.state==='absent')?'absent':'partial';return {platform:'win32',available:true,installed:state==='installed',state,executable:packaged.executable,version:packaged.version,conflicts,verbs:entries.map(item=>({action:item.action,state:item.state})),message:state==='conflict'?'A PDFix context key contains unrelated or changed entries. They will be preserved.':state==='installed'?'All four PDF-only right-click tools are installed for your Windows account.':state==='partial'?'Some owned tools are missing or refer to another package location. Install to repair them.':'Optional PDF-only right-click tools are not installed.'};}
  catch(error){return {platform:'win32',available:false,installed:false,state:'unavailable',message:error instanceof FileError?error.message:'The Windows context menu status is unavailable.'};}
 }
 async change(mode){
  if(this.busy)throw new FileError('BUSY','Finish the current Windows context menu change.');this.busy=true;
  try{
   await packagedIdentity(this.identity);const reg=await this.systemReg(),entries=await this.inspect(reg);
   if(entries.some(item=>item.state==='conflict'))throw new FileError('WINDOWS_CONTEXT','A PDFix context key contains unrelated or modified data. No context keys were changed.');
   for(const verb of entries){
    if(mode==='install'){
     for(const item of verb.values){const args=['add',item.key,...(item.name?['/v',item.name]:['/ve']),'/t','REG_SZ','/d',item.value,'/f'];if((await nativeReg(reg,args)).code!==0)throw new FileError('WINDOWS_CONTEXT','Windows could not finish installing the optional tools. Refresh status to inspect any partial installation.');}
    }else if(mode==='remove'&&verb.state!=='absent'){
     // Reinspect immediately before deleting ONLY this exact versioned own key.
     const live=(await this.inspect(reg)).find(item=>item.action===verb.action);
     if(live.state==='conflict')throw new FileError('WINDOWS_CONTEXT','A context key changed during removal. The changed integration was preserved.');
     if(live.state!=='absent'&&(await nativeReg(reg,['delete',verb.key,'/f'])).code!==0)throw new FileError('WINDOWS_CONTEXT','Windows could not finish removing the owned tools. Refresh status to inspect remaining entries.');
    }
   }
   return await this.status();
  }finally{this.busy=false;}
 }
 install(){return this.change('install');}
 remove(){return this.change('remove');}
}
module.exports={WindowsContextTools,contextEntries,packagedIdentity};
