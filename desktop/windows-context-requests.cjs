'use strict';
const path=require('node:path');
const {randomUUID,createHash}=require('node:crypto');
const {FileError,MAX_BYTES,validateFile}=require('./file-store.cjs');
const {readChosenBoundedFile}=require('./chosen-bounded-file.cjs');
const CONTEXT_FLAG='--pdfix-context-v1';
const CONTEXT_ACTIONS=Object.freeze(['open','convert','compress','merge']);
const CONTEXT_MAX_FILES=10,CONTEXT_MAX_BYTES=96*1024*1024;
function parseWindowsContextArgv(argv,{defaultApp=false}={}){
 if(!Array.isArray(argv))return null;
 const args=argv.slice(defaultApp?2:1);
 if(!args.includes(CONTEXT_FLAG))return null;
 if(argv.length>16||args[0]!==CONTEXT_FLAG||!CONTEXT_ACTIONS.includes(args[1])||args[2]!=='--'||args.length<4||args.length>3+CONTEXT_MAX_FILES)throw new FileError('WINDOWS_CONTEXT','Windows supplied an unsupported PDF context request.');
 const paths=[];
 for(const value of args.slice(3)){
  // Only literal drive-absolute files. No relative paths, URLs, device/UNC paths,
  // alternate streams, wildcards, flags, or access inferred from a parent folder.
  if(typeof value!=='string'||value.length>4096||! /^[a-z]:\\/i.test(value)||/["\0\r\n*?<>|]/.test(value)||value.slice(2).includes(':')||path.win32.extname(value).toLowerCase()!=='.pdf')throw new FileError('WINDOWS_CONTEXT','Choose ordinary local PDF paths for the Windows context tools.');
  const normalized=path.win32.normalize(value);
  if(!paths.some(item=>item.toLowerCase()===normalized.toLowerCase()))paths.push(normalized);
 }
 return Object.freeze({action:args[1],paths:Object.freeze(paths)});
}
class WindowsContextRequests{
 constructor(){this.pending=[];this.busy=false;this.generation=0;this.warning='';}
 enqueue(argv,options){
  let parsed;
  try{parsed=parseWindowsContextArgv(argv,options);}catch(error){this.warning=error.message;return true;}
  if(!parsed)return false;
  const added=parsed.paths.filter(filename=>!this.pending.some(item=>item.action===parsed.action&&item.path.toLowerCase()===filename.toLowerCase()));
  if(this.pending.length+added.length>CONTEXT_MAX_FILES){this.warning='The Windows review queue holds at most 10 files. Review or dismiss existing requests, then select the remaining PDFs again.';return true;}
  for(const filename of added)this.pending.push(Object.freeze({id:randomUUID(),action:parsed.action,path:filename,name:path.win32.basename(filename)}));
  return true;
 }
 list(){return {version:1,requests:this.pending.map(item=>({id:item.id,action:item.action,name:item.name,location:item.path})),warning:this.warning};}
 dismiss(ids){if(!Array.isArray(ids)||ids.length>10||ids.some(id=>typeof id!=='string'))throw new FileError('WINDOWS_CONTEXT','Choose pending requests to dismiss.');if(this.busy)throw new FileError('BUSY','Finish reviewing the current Windows request.');const selected=new Set(ids);this.pending=this.pending.filter(item=>!selected.has(item.id));this.warning='';return this.list();}
 clear(){this.generation++;this.pending=[];this.warning='';}
 async review(action,ids,{store,dialog,window,check=()=>{}}){
  if(this.busy)throw new FileError('BUSY','Finish reviewing the current Windows request.');
  if(!CONTEXT_ACTIONS.includes(action)||!Array.isArray(ids)||!ids.length||ids.length>10||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'))throw new FileError('WINDOWS_CONTEXT','Choose the exact pending PDF requests.');
  if(action!=='merge'&&ids.length!==1||action==='merge'&&ids.length<2)throw new FileError('WINDOWS_CONTEXT',action==='merge'?'Select at least two requested PDFs to merge.':'Open, convert and compress review one PDF at a time.');
  const entries=ids.map(id=>this.pending.find(item=>item.id===id&&item.action===action));
  if(entries.some(item=>!item))throw new FileError('WINDOWS_CONTEXT','The selected request changed. Review the pending list again.');
  const generation=this.generation,files=[];
  const current=()=>{check();if(generation!==this.generation||entries.some(item=>!this.pending.includes(item)))throw new FileError('CANCELED','The Windows review session ended.');};
  this.busy=true;
  try{
   current();
   const labels={open:'Open PDF',convert:'Convert PDF pages to images',compress:'Compress PDF',merge:'Merge PDFs'};
   const confirmation=await dialog.showMessageBox(typeof window==='function'?window():window,{type:'question',title:'PDFix — review Windows request',message:labels[action],detail:entries.map((item,index)=>`${index+1}. ${item.path}`).join('\n')+'\n\nOnly these selected PDFs will be read as documents. No folder access is granted. The workspace will inspect and review any output before a new copy is saved. Conversion/compression/merge inputs must total at most 96 MiB and contain no linked paths. Open uses the normal bounded large-PDF reader.',buttons:['Continue to workspace','Cancel'],defaultId:1,cancelId:1,noLink:true});
   current();if(confirmation.response!==0)return {canceled:true};
   if(store.handles.size+entries.length>10)throw new FileError('TOO_LARGE','This session has too many retained files. Close unused sources before accepting the Windows request.');
   let total=0;
   for(const entry of entries){
    current();let selected;
    try{
     if(action==='open'){const file=await store.open(entry.path,{retain:true});files.push(file);current();file.sourceSha256=store.source(file.id).fingerprint;continue;}
     selected=await readChosenBoundedFile(entry.path,['pdf'],Math.min(CONTEXT_MAX_BYTES,MAX_BYTES));current();
     if((total+=selected.bytes.length)>CONTEXT_MAX_BYTES)throw new FileError('TOO_LARGE','Select PDF inputs totaling at most 96 MiB.');
     validateFile(selected.name,selected.bytes);
     const expectedHash=selected.sha256;selected.bytes.fill(0);selected=null;
     const file=await store.open(entry.path,{retain:true,maxBytes:CONTEXT_MAX_BYTES,expectedHash});files.push(file);current();
     const source=store.source(file.id);if(source.ext!=='pdf'||source.fileBacked||source.fingerprint!==expectedHash)throw new FileError('CHANGED','The Windows PDF source changed while opening.');
     file.sourceSha256=source.fingerprint;
    }finally{selected?.bytes.fill(0);}
   }
   current();const chosen=new Set(ids);this.pending=this.pending.filter(item=>!chosen.has(item.id));
   return {version:1,action,files,pending:this.list(),selectedFileOnly:true};
  }catch(error){for(const file of files)await store.release(file.id).catch(()=>{});throw error;}
  finally{this.busy=false;}
 }
}
/** Root calls after its existing combine-service idle/discard checks. This seeds
 * PdfCombineInputs with exact immutable FileStore snapshots, never path reads. */
function seedWindowsContextCombineInputs(inputs,store,ids){
 if(!Array.isArray(ids)||ids.length<2||ids.length>10||new Set(ids).size!==ids.length)throw new FileError('WINDOWS_CONTEXT','Choose two to ten reviewed PDF snapshots.');
 const entries=[];let total=0;
 try{
  for(const id of ids){const source=store.source(id);if(source.ext!=='pdf'||source.fileBacked||!Buffer.isBuffer(source.bytes)||(total+=source.bytes.length)>CONTEXT_MAX_BYTES)throw new FileError('WINDOWS_CONTEXT','The reviewed merge inputs are unavailable or too large.');const fingerprint=createHash('sha256').update(source.bytes).digest('hex');if(fingerprint!==source.fingerprint)throw new FileError('CHANGED','A reviewed source snapshot changed.');entries.push(Object.freeze({id:randomUUID(),name:source.name,path:source.path,bytes:Buffer.from(source.bytes),fingerprint}));}
  inputs.clear();inputs.sessionId=randomUUID();inputs.entries=new Map(entries.map(entry=>[entry.id,entry]));
  return {sessionId:inputs.sessionId,sources:entries.map(entry=>({id:entry.id,name:entry.name,size:entry.bytes.length,fingerprint:entry.fingerprint}))};
 }catch(error){for(const entry of entries)entry.bytes.fill(0);throw error;}
}
module.exports={CONTEXT_FLAG,CONTEXT_ACTIONS,CONTEXT_MAX_FILES,CONTEXT_MAX_BYTES,parseWindowsContextArgv,WindowsContextRequests,seedWindowsContextCombineInputs};
