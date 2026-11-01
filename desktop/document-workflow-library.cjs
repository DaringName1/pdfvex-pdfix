'use strict';
const fs=require('node:fs/promises'),{renameWithRetry}=require('./rename-retry.cjs');
const path=require('node:path');
const crypto=require('node:crypto');
const {validWorkflowSteps}=require('./document-workflow-validation.cjs');

const HASH=/^[a-f0-9]{64}$/;
const MAX_BYTES=128*1024;
const MAX_ITEMS=20;
function pageCount(value){if(!Number.isInteger(value)||value<1||value>500)throw new Error('Open a PDF with 1–500 pages.');return value;}
function checkedSteps(steps,count){
 count=pageCount(count);validWorkflowSteps(steps);
 for(const step of steps){
  const pages=step.kind==='reorder'?step.order:step.pages;
  if(step.kind==='reorder'&&pages.length!==count)throw new Error(`The page order must contain all ${count} pages.`);
  if(pages.some(n=>n>count))throw new Error(`This workflow refers to pages outside the ${count}-page source.`);
 }
 const copy=JSON.parse(JSON.stringify(steps));
 if(Buffer.byteLength(JSON.stringify(copy))>32*1024)throw new Error('Workflow settings are too large to store.');
 return copy;
}
function validHash(value){if(typeof value!=='string'||!HASH.test(value))throw new Error('The PDF source identity is invalid.');return value;}
function validName(value){const name=typeof value==='string'?value.trim():'';if(!name||name.length>80||/[\x00-\x1f\x7f]/.test(name))throw new Error('Enter a workflow name of 1–80 printable characters.');return name;}
function validId(value){if(typeof value!=='string'||!HASH.test(value))throw new Error('The workflow identifier is invalid.');return value;}
const empty=()=>({version:1,definitions:[],drafts:[]});

class DocumentWorkflowLibrary{
 constructor(userDataFolder){
  if(typeof userDataFolder!=='string'||!path.isAbsolute(userDataFolder))throw new Error('A trusted user data folder is required.');
  this.folder=userDataFolder;this.file=path.join(userDataFolder,'document-workflow-library.json');this.queue=Promise.resolve();
 }
 async read(){
  let bytes,handle;try{const before=await fs.lstat(this.file);if(!before.isFile()||before.isSymbolicLink()||before.size>MAX_BYTES)throw new Error('The workflow library exceeds its regular-file boundary.');handle=await fs.open(this.file,'r');const opened=await handle.stat();if(opened.dev!==before.dev||opened.ino!==before.ino||opened.size!==before.size||opened.mtimeMs!==before.mtimeMs)throw new Error('The workflow library changed before reading.');const buffer=Buffer.alloc(opened.size+1);let length=0;while(length<buffer.length){const read=await handle.read(buffer,length,buffer.length-length,length);if(!read.bytesRead)break;length+=read.bytesRead;}const after=await handle.stat();if(length!==opened.size||after.size!==opened.size||after.mtimeMs!==opened.mtimeMs||after.ctimeMs!==opened.ctimeMs)throw new Error('The workflow library changed while reading.');bytes=buffer.subarray(0,length);}catch(error){if(error.code==='ENOENT')return empty();throw error;}finally{await handle?.close();}
  let value;try{value=JSON.parse(bytes.toString('utf8'));}catch{throw new Error('The workflow library could not be read. Stored workflows were left untouched.');}
  if(!value||value.version!==1||!Array.isArray(value.definitions)||!Array.isArray(value.drafts)||value.definitions.length>MAX_ITEMS||value.drafts.length>MAX_ITEMS)throw new Error('The workflow library has an unsupported format. Stored workflows were left untouched.');
  for(const row of value.definitions){validId(row.id);validName(row.name);checkedSteps(row.steps,row.pageCount);}
  for(const row of value.drafts){validHash(row.sourceSha256);checkedSteps(row.steps,row.pageCount);}
  return value;
 }
 async write(value){
  const bytes=Buffer.from(JSON.stringify(value));if(bytes.length>MAX_BYTES)throw new Error('The workflow library exceeds its size limit.');
  await fs.mkdir(this.folder,{recursive:true});const temp=path.join(this.folder,`.document-workflow-library-${crypto.randomUUID()}.tmp`);
  try{await fs.writeFile(temp,bytes,{flag:'wx',mode:0o600});await renameWithRetry(temp,this.file);}finally{await fs.rm(temp,{force:true}).catch(()=>{});}
 }
 serial(action){const work=this.queue.then(action);this.queue=work.catch(()=>{});return work;}
 listDefinitions(){return this.serial(async()=>{const data=await this.read();return data.definitions.map(({id,name,pageCount,updatedAt})=>({id,name,pageCount,updatedAt}));});}
 saveDefinition(name,count,steps){return this.serial(async()=>{
  name=validName(name);count=pageCount(count);steps=checkedSteps(steps,count);const data=await this.read();
  if(data.definitions.length>=MAX_ITEMS)throw new Error(`The library holds at most ${MAX_ITEMS} named workflows. Delete one explicitly before saving another.`);
  const row={id:crypto.randomBytes(32).toString('hex'),name,pageCount:count,steps,updatedAt:new Date().toISOString()};data.definitions.push(row);await this.write(data);return {id:row.id,name,pageCount:count,updatedAt:row.updatedAt};
 });}
 loadDefinition(id,count){return this.serial(async()=>{
  id=validId(id);count=pageCount(count);const row=(await this.read()).definitions.find(item=>item.id===id);if(!row)throw new Error('This saved workflow no longer exists.');
  if(row.pageCount!==count)throw new Error(`“${row.name}” was saved for ${row.pageCount} pages; this PDF has ${count}. Choose a matching source before loading it.`);
  return {id:row.id,name:row.name,pageCount:row.pageCount,steps:checkedSteps(row.steps,count)};
 });}
 removeDefinition(id){return this.serial(async()=>{id=validId(id);const data=await this.read(),index=data.definitions.findIndex(row=>row.id===id);if(index<0)throw new Error('This saved workflow no longer exists.');data.definitions.splice(index,1);await this.write(data);return true;});}
 saveDraft(sourceSha256,count,steps){return this.serial(async()=>{
  sourceSha256=validHash(sourceSha256);count=pageCount(count);steps=checkedSteps(steps,count);const data=await this.read();
  const index=data.drafts.findIndex(row=>row.sourceSha256===sourceSha256);const row={sourceSha256,pageCount:count,steps,updatedAt:new Date().toISOString()};
  if(index>=0)data.drafts[index]=row;else{if(data.drafts.length>=MAX_ITEMS)throw new Error(`Draft recovery holds at most ${MAX_ITEMS} sources. Clear a draft explicitly before saving another.`);data.drafts.push(row);}
  await this.write(data);return {sourceSha256,pageCount:count,updatedAt:row.updatedAt};
 });}
 readDraft(sourceSha256,count){return this.serial(async()=>{
  sourceSha256=validHash(sourceSha256);count=pageCount(count);const row=(await this.read()).drafts.find(item=>item.sourceSha256===sourceSha256);
  if(!row)return null;if(row.pageCount!==count)throw new Error('The recovered draft page count does not match this PDF.');
  return {sourceSha256,pageCount:count,steps:checkedSteps(row.steps,count),updatedAt:row.updatedAt};
 });}
 clearDraft(sourceSha256){return this.serial(async()=>{sourceSha256=validHash(sourceSha256);const data=await this.read(),index=data.drafts.findIndex(row=>row.sourceSha256===sourceSha256);if(index<0)return false;data.drafts.splice(index,1);await this.write(data);return true;});}
}
module.exports={DocumentWorkflowLibrary};
