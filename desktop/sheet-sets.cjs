"use strict";
const fs=require('node:fs/promises');
const path=require('node:path');
const {createHash,randomUUID}=require('node:crypto');
const {stageOutput,discardStage}=require('./verified-output.cjs');
const MAX_ITEMS=20,MAX_ITEM_BYTES=128*1024,MAX_LIBRARY_BYTES=MAX_ITEMS*(MAX_ITEM_BYTES+1024)+4096,MAX_SOURCE_BYTES=100*1024*1024;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i,HASH=/^[a-f0-9]{64}$/;
const clone=value=>structuredClone(value),fingerprint=bytes=>createHash('sha256').update(bytes).digest('hex'),canonical=value=>path.resolve(value).toLowerCase(),nameKey=value=>value.normalize('NFKC').toLowerCase();
class SheetSetError extends Error{constructor(code,message){super(message);this.code=code;}}
function fail(code,message){throw new SheetSetError(code,message);}
function fields(value,names){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype&&Object.keys(value).length===names.length&&names.every(name=>Object.hasOwn(value,name));}
function label(value,max,required=false){return typeof value==='string'&&value.length<=max&&(!required||!!value.trim())&&!/[\x00-\x1f\x7f]/.test(value);}
function setName(value){if(!label(value,80,true))fail('SHEET_SET_NAME','Use a sheet-set name of 1–80 characters without control characters.');return value.trim();}
function sourceDescriptor(value){
 if(!fields(value,['path','name','fingerprint','size'])||typeof value.path!=='string'||value.path.length>32767||value.path.includes('\0')||!path.isAbsolute(value.path)||path.extname(value.path).toLowerCase()!=='.pdf'||typeof value.name!=='string'||!value.name||value.name.length>32767||value.name.includes('\0')||typeof value.fingerprint!=='string'||!HASH.test(value.fingerprint)||!Number.isInteger(value.size)||value.size<1||value.size>MAX_SOURCE_BYTES)fail('SHEET_SET_SOURCE','A saved source identity is unsupported.');return value;
}
function sheets(value,sources){
 if(!Array.isArray(value)||!value.length||value.length>500)fail('SHEET_SET_PLAN','Keep 1–500 ordered sheet references in a set.');
 return value.map(sheet=>{if(!fields(sheet,['source','index','title','revision'])||!Number.isInteger(sheet.source)||sheet.source<0||sheet.source>=sources.length||!Number.isInteger(sheet.index)||sheet.index<0||sheet.index>=sources[sheet.source].declaredPageCount||!label(sheet.title,200)||!label(sheet.revision,80))fail('SHEET_SET_PLAN','Sheet references need an opened source, a declared physical page, title up to 200 characters and revision up to 80 characters.');return {source:sheet.source,index:sheet.index,title:sheet.title,revision:sheet.revision};});
}
function validItem(item){
 if(!fields(item,['id','name','createdAt','sources','sheets'])||typeof item.id!=='string'||!UUID.test(item.id)||item.name!==setName(item.name)||typeof item.createdAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(item.createdAt)||!Number.isFinite(Date.parse(item.createdAt))||!Array.isArray(item.sources)||!item.sources.length||item.sources.length>10)fail('SHEET_SET_STORAGE','A saved sheet-set record is invalid.');
 let total=0;const identities=new Set();for(const source of item.sources){if(!fields(source,['descriptor','declaredPageCount'])||!Number.isInteger(source.declaredPageCount)||source.declaredPageCount<1||source.declaredPageCount>500)fail('SHEET_SET_STORAGE','A saved sheet-set source declaration is invalid.');const descriptor=sourceDescriptor(source.descriptor),identity=canonical(descriptor.path)+'\0'+descriptor.fingerprint;if(identities.has(identity))fail('SHEET_SET_STORAGE','A saved sheet set repeats the same original source snapshot.');identities.add(identity);total+=descriptor.size;}
 if(total>MAX_SOURCE_BYTES)fail('SHEET_SET_LIMIT','The sheet set exceeds 100 MB of original source snapshots.');sheets(item.sheets,item.sources);if(Buffer.byteLength(JSON.stringify(item),'utf8')>MAX_ITEM_BYTES)fail('SHEET_SET_LIMIT','A named sheet set exceeds its 128 KB metadata limit.');return item;
}
class SheetSets{
 constructor(directory,store){this.directory=directory;this.store=store;this.items=[];this.loaded=false;this.loading=null;this.pending=Promise.resolve();this.loadedDigest=null;this.restoring=false;}
 serial(action){const operation=this.pending.then(action);this.pending=operation.catch(()=>{});return operation;}
 file(){return path.join(this.directory,'sheet-sets.json');}
 async readDisk(){
  const file=this.file();let handle;
  try{
   const stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>MAX_LIBRARY_BYTES)throw new Error('Unsupported library file.');handle=await fs.open(file,'r');const opened=await handle.stat();if(!opened.isFile()||opened.size>MAX_LIBRARY_BYTES||opened.ino!==stat.ino||opened.dev!==stat.dev)throw new Error('Unsupported opened library file.');
   const buffer=Buffer.alloc(opened.size+1);let length=0;while(length<buffer.length){const result=await handle.read(buffer,length,buffer.length-length,length);if(!result.bytesRead)break;length+=result.bytesRead;}if(length!==opened.size)throw new Error('The library changed while reading.');
   const bytes=buffer.subarray(0,length),value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(!fields(value,['version','items'])||value.version!==1||!Array.isArray(value.items)||value.items.length>MAX_ITEMS)throw new Error('Unsupported library schema.');value.items.forEach(validItem);if(new Set(value.items.map(item=>item.id)).size!==value.items.length||new Set(value.items.map(item=>nameKey(item.name))).size!==value.items.length)throw new Error('Duplicate saved set identity.');return {items:value.items,digest:fingerprint(bytes)};
  }catch(error){if(error.code==='ENOENT')return null;fail('SHEET_SET_STORAGE','Saved sheet sets could not be read safely. Existing data was kept; repair the local library before changing it.');}
  finally{if(handle)await handle.close().catch(()=>{});}
 }
 async init(){
  if(this.loaded)return;if(this.loading)return this.loading;this.loading=(async()=>{try{await fs.mkdir(this.directory,{recursive:true});}catch{fail('SHEET_SET_STORAGE','The local sheet-set library folder is unavailable. Existing data was kept.');}const loaded=await this.readDisk();this.items=loaded?.items??[];this.loadedDigest=loaded?.digest??null;this.loaded=true;})();try{await this.loading;}finally{this.loading=null;}
 }
 metadata(item){return {id:item.id,name:item.name,createdAt:item.createdAt,sheetCount:item.sheets.length,sourceCount:item.sources.length,sourceBytes:item.sources.reduce((sum,source)=>sum+source.descriptor.size,0),sources:item.sources.map(source=>({name:source.descriptor.name,size:source.descriptor.size,fingerprint:source.descriptor.fingerprint,declaredPageCount:source.declaredPageCount})),notice:'Page counts and sheet references are saved declarations. Reopen and inspect each exact original PDF before using its physical pages.'};}
 async list(){await this.init();return this.items.map(item=>this.metadata(item));}
 async persist(items){
  const current=await this.readDisk();if((current?.digest??null)!==this.loadedDigest)fail('SHEET_SET_STORAGE','The saved library changed outside this session. Existing data was kept; reopen PDFix before changing sheet sets.');
  const data=Buffer.from(JSON.stringify({version:1,items}),'utf8');if(data.length>MAX_LIBRARY_BYTES)fail('SHEET_SET_LIMIT','Saved sheet-set storage exceeds its metadata limit.');let stage;
  try{stage=await stageOutput(this.directory,data);await fs.rename(stage.temporary,this.file());stage=null;this.loadedDigest=fingerprint(data);}
  catch(error){fail('SHEET_SET_STORAGE',error.code==='PARTIAL'?error.message:'The sheet-set change could not be saved. Existing saved sets were kept.');}
  finally{if(stage&&!await discardStage(stage))fail('SHEET_SET_STORAGE','The sheet-set change failed and its temporary copy could not be removed. Existing saved sets were kept.');}
 }
 async save(name,value){return this.serial(async()=>{
  await this.init();name=setName(name);if(this.items.length>=MAX_ITEMS)fail('SHEET_SET_LIMIT','Save up to 20 named sheet sets. Remove one before adding another.');if(this.items.some(item=>nameKey(item.name)===nameKey(name)))fail('SHEET_SET_EXISTS','A sheet set already has this name. Choose another name; existing sets are never overwritten.');
  if(!fields(value,['sources','sheets'])||!Array.isArray(value.sources)||!value.sources.length||value.sources.length>10||new Set(value.sources.map(source=>source?.id)).size!==value.sources.length)fail('SHEET_SET_SOURCE','Save the current set with 1–10 distinct explicitly opened PDF source snapshots.');
  const sources=value.sources.map(entry=>{if(!fields(entry,['id','pageCount'])||typeof entry.id!=='string'||!entry.id||entry.id.length>256||!Number.isInteger(entry.pageCount)||entry.pageCount<1||entry.pageCount>500)fail('SHEET_SET_SOURCE','Each source needs its opened native ID and declared page count from 1 to 500.');let source;try{source=this.store.source(entry.id);}catch{fail('SHEET_SET_SOURCE','A sheet-set source session ended. Reopen its PDF before saving this set.');}if(source.ext!=='pdf'||!(source.bytes instanceof Uint8Array)||!source.bytes.length||source.bytes.length>MAX_SOURCE_BYTES||fingerprint(source.bytes)!==source.fingerprint)fail('SHEET_SET_SOURCE','A sheet-set source snapshot is unsupported or changed.');const descriptor=sourceDescriptor(this.store.pages.descriptor(source));return {descriptor:clone(descriptor),declaredPageCount:entry.pageCount};});
  const item={id:randomUUID(),name,createdAt:new Date().toISOString(),sources,sheets:sheets(value.sheets,sources)};validItem(item);const items=[item,...this.items];await this.persist(items);this.items=items;return this.items.map(item=>this.metadata(item));
 });}
 async remove(id){return this.serial(async()=>{await this.init();if(typeof id!=='string'||!UUID.test(id)||!this.items.some(item=>item.id===id))fail('SHEET_SET_MISSING','This saved sheet set is unavailable.');const items=this.items.filter(item=>item.id!==id);await this.persist(items);this.items=items;return this.items.map(item=>this.metadata(item));});}
 async load(id,chooseSource){if(this.restoring)fail('SHEET_SET_BUSY','Finish or cancel the current sheet-set source selection first.');this.restoring=true;try{return await this.restore(id,chooseSource);}finally{this.restoring=false;}}
 async restore(id,chooseSource){
  await this.init();const saved=typeof id==='string'&&this.items.find(item=>item.id===id);if(!saved)fail('SHEET_SET_MISSING','This saved sheet set is unavailable.');if(typeof chooseSource!=='function')fail('SHEET_SET_PICKER','Use the native file picker for each exact original PDF.');const item=clone(saved),session=[...this.store.handles],sources=[];
  const unchanged=()=>{if(this.store.handles.size!==session.length||session.some(([sourceId,source])=>this.store.handles.get(sourceId)!==source)||this.items.find(current=>current.id===item.id)!==saved)fail('SHEET_SET_CHANGED','The source session or saved set changed during selection. The current set was kept.');};
  // Remembered descriptor paths are never used for reads. Every exact original
  // requires a fresh native choice, including files already open in this session.
  for(let index=0;index<item.sources.length;index++){unchanged();const required=item.sources[index],descriptor=required.descriptor,selected=await chooseSource({index,name:descriptor.name,size:descriptor.size,fingerprint:descriptor.fingerprint,declaredPageCount:required.declaredPageCount});unchanged();if(!selected)return {cancelled:true};if(typeof selected!=='string'||!path.isAbsolute(selected))fail('SHEET_SET_PICKER','Choose each exact original PDF using the native file picker.');let source;try{source=await this.store.pages.read({...descriptor,path:selected});}catch{fail('SHEET_SET_CHANGED',descriptor.name+' is unavailable or does not match the exact saved snapshot. The current set was kept.');}if(source.ext!=='pdf'||source.bytes.length!==descriptor.size||source.fingerprint!==descriptor.fingerprint||fingerprint(source.bytes)!==descriptor.fingerprint)fail('SHEET_SET_CHANGED','A selected sheet-set source does not match its exact saved identity.');sources.push(source);unchanged();}
  const additions=[],files=sources.map((source,index)=>{const existing=[...this.store.handles,...additions].find(([,handle])=>canonical(handle.path)===canonical(source.path)&&handle.fingerprint===source.fingerprint&&handle.bytes.length===source.bytes.length);if(existing&&fingerprint(existing[1].bytes)!==source.fingerprint)fail('SHEET_SET_CHANGED','A current source snapshot changed. Reopen it before loading the set.');const sourceId=existing?.[0]??randomUUID(),opened=existing?.[1]??source;if(!existing)additions.push([sourceId,source]);return {id:sourceId,name:opened.name,ext:opened.ext,size:opened.bytes.length,location:opened.path,bytes:Uint8Array.from(opened.bytes),declaredPageCount:item.sources[index].declaredPageCount};});
  if(this.store.handles.size+additions.length>10||[...this.store.handles.values(),...additions.map(([,source])=>source)].reduce((sum,source)=>sum+source.bytes.length,0)>MAX_SOURCE_BYTES)fail('SHEET_SET_LIMIT','Reopen the original PDF to load this set within the session limit of 10 source files and 100 MB.');
  unchanged();for(const [sourceId,source]of additions)this.store.handles.set(sourceId,source);
  return {files,sheets:clone(item.sheets),set:{id:item.id,name:item.name,createdAt:item.createdAt},notice:'Exact saved originals were selected and fingerprinted. Verify their actual PDF page counts and sheet references before adopting this set. No PDFs were merged, annotations transferred or output copies created.'};
 }
}
module.exports={SheetSets,SheetSetError,MAX_ITEMS,MAX_ITEM_BYTES,MAX_LIBRARY_BYTES,MAX_SOURCE_BYTES};
