const fs=require('node:fs/promises'),path=require('node:path');
const {randomUUID,createHash}=require('node:crypto');
const {validateFile,FileError}=require('./file-store.cjs');
const {SearchFolderGrant,same}=require('./search-folder-grant.cjs');
const TYPES=new Set(['pdf','docx','rtf','txt','md','markdown','csv','json','xml','yaml','yml']);
const TOTAL=100*1024*1024,UUID=/^[a-f0-9-]{36}$/i;
class SearchSources{
 constructor(){this.generation=0;this.session=null;this.busy=false;}
 clear(token){if(token&&this.session?.token!==token)return false;this.generation++;clearTimeout(this.timer);this.timer=null;this.session?.grant?.revoke();if(this.session)this.session.canceled=true;for(const source of this.session?.sources??[])source.bytes?.fill(0);this.session=null;return true;}
 async selectFolder(selected,options){
  if(this.busy||this.session?.reading)throw new FileError('BUSY','Finish the current search selection or PDF read first.');
  if(typeof selected!=='string'||!path.isAbsolute(selected)||!options||typeof options.recursive!=='boolean'||options.purpose!=='search'||options.persistence!=='session'||!Array.isArray(options.fileTypes)||options.fileTypes.length!==1||options.fileTypes[0]!=='pdf')throw new FileError('SEARCH_SCOPE','Review PDF-only search scope and recursion before choosing a local folder. Folder grants last only for this search session.');
  this.clear();const version=this.generation,grant=new SearchFolderGrant(selected,options.recursive);this.busy=true;
  try{await grant.init();if(version!==this.generation)throw new FileError('CANCELED','Folder selection canceled.');const token=randomUUID(),session={token,kind:'folder',grant,sources:[],errors:[],canceled:false,scope:{name:path.basename(grant.root)||grant.root,location:grant.root,recursive:options.recursive,purpose:'search',persistence:'session',fileTypes:['pdf']},progress:{stage:'enumerating',visited:0,folders:0,pdfs:0,skipped:0,limited:false}};this.session=session;this.keepAlive(token);session.enumeration=this.enumerate(session).catch(error=>{if(this.session!==session)return;session.errors.push({name:session.scope.name,message:error instanceof FileError?error.message:'Folder enumeration failed; discovered files remain available.'});session.progress.stage='partial';});return this.folderStatus(token);
  }catch(error){grant.revoke();throw error instanceof FileError?error:new FileError('SEARCH_SCOPE','This folder could not be granted. Choose an ordinary readable local folder.');}finally{this.busy=false;}
 }
 folderSession(token){if(typeof token!=='string'||!UUID.test(token)||this.session?.token!==token||this.session.kind!=='folder')throw new FileError('SEARCH','The folder search grant expired. Choose the folder again.');return this.session;}
 folderStatus(token){const session=this.folderSession(token);return {token,kind:'folder',scope:{...session.scope},sources:session.sources.map(({id,name,ext,size,sha256})=>({id,name,ext,size,sha256})),errors:session.errors.map(error=>({...error})),progress:{...session.progress}};}
 async cancelFolder(token){const session=this.folderSession(token);session.canceled=true;await session.enumeration;return this.folderStatus(token);}
 async enumerate(session){
  const queue=[{filename:session.grant.root,depth:0}],started=Date.now(),progress=session.progress;
  const current=()=>this.session===session&&!session.canceled;
  const error=(name,message)=>{progress.skipped++;if(session.errors.length<500)session.errors.push({name:name.slice(0,512),message});};
  const limit=()=>{progress.limited=true;session.errors.push({name:session.scope.name,message:'Partial folder discovery: reached 1,000 PDFs, 20,000 entries, 2,000 folders, 32 levels or two minutes. Narrow the selected scope to search omitted content.'});};
  while(queue.length&&current()){
   if(progress.folders>=2000||Date.now()-started>120000){limit();break;}
   const item=queue.shift();let directory;
   try{await session.grant.inspect(item.filename,{directory:true});if(!current())break;directory=await fs.opendir(item.filename);progress.folders++;
    for await(const entry of directory){
     if(!current())break;if(progress.visited>=20000||session.sources.length>=1000||Date.now()-started>120000){limit();break;}progress.visited++;
     const filename=path.join(item.filename,entry.name),name=path.relative(session.grant.root,filename);
     if(entry.isSymbolicLink()){error(name,'Linked folder or file skipped.');continue;}
     if(entry.isDirectory()){
      if(!session.scope.recursive)continue;
      if(item.depth>=32||queue.length+progress.folders>=2000){error(name,'Subfolder skipped at the directory/depth limit.');progress.limited=true;continue;}
      try{await session.grant.inspect(filename,{directory:true});if(current())queue.push({filename,depth:item.depth+1});}catch(e){if(current())error(name,e instanceof FileError?e.message:'Subfolder could not be read.');}continue;
     }
     if(!entry.name.toLowerCase().endsWith('.pdf'))continue;
     try{const stat=await session.grant.inspect(filename);if(!Number.isSafeInteger(stat.size)||stat.size<1||stat.size>TOTAL)throw new FileError('SEARCH','PDF skipped: selectable-text search supports nonempty PDFs up to 100 MB each.');if(!current())break;session.sources.push({id:randomUUID(),name,ext:'pdf',size:stat.size,path:filename,discovered:stat});progress.pdfs=session.sources.length;}catch(e){if(current())error(name,e instanceof FileError?e.message:'PDF could not be inspected.');}
    }
   }catch(e){if(current())error(path.relative(session.grant.root,item.filename)||session.scope.name,e instanceof FileError?e.message:'Folder could not be enumerated.');}
   if(progress.limited)break;
  }
  if(this.session===session)progress.stage=session.canceled?'canceled':progress.limited?'partial':'complete';
 }
 release(token,id){if(this.session?.token!==token)return false;const source=this.session.sources.find(value=>value.id===id);if(!source)return false;if(this.session.kind==='folder'){source.readGeneration=(source.readGeneration||0)+1;source.bytes?.fill(0);delete source.bytes;}return true;}
 async folderBytes(token,id){
  const session=this.folderSession(token),source=this.source(token,id);if(session.reading)throw new FileError('BUSY','Search folder PDFs sequentially.');session.reading=true;let handle,allocation,snapshot,readGeneration;
  const current=()=>{if(this.session!==session||readGeneration!==undefined&&source.readGeneration!==readGeneration)throw new FileError('CANCELED','Folder PDF read was canceled or its grant was revoked.');session.grant.check();};
  try{
   current();for(const other of session.sources)this.release(token,other.id);readGeneration=source.readGeneration;
   const expected=await session.grant.inspect(source.path,{expected:source.discovered});current();handle=await fs.open(source.path,'r');const before=await handle.stat();if(!same(expected,before)||before.nlink!==1)throw new FileError('CHANGED','This PDF changed before its snapshot was read. Choose the folder again.');
   allocation=Buffer.alloc(before.size+1);let length=0;while(length<allocation.length){current();const read=await handle.read(allocation,length,Math.min(256*1024,allocation.length-length),length);if(!read.bytesRead)break;length+=read.bytesRead;}
   if(length!==before.size||!same(before,await handle.stat()))throw new FileError('CHANGED','This PDF changed during its snapshot read. Choose the folder again.');await session.grant.inspect(source.path,{expected:before});current();
   snapshot=Buffer.from(allocation.subarray(0,length));validateFile(source.name,snapshot);const sha256=createHash('sha256').update(snapshot).digest('hex');if(source.sha256&&source.sha256!==sha256)throw new FileError('CHANGED','This PDF changed since its earlier search. Choose the folder again.');current();source.bytes=snapshot;source.sha256=sha256;this.keepAlive(token);return {id:source.id,name:source.name,ext:'pdf',size:snapshot.length,sha256,bytes:Uint8Array.from(snapshot)};
  }catch(error){snapshot?.fill(0);throw error instanceof FileError?error:new FileError('SEARCH','This folder PDF could not be read. It may have moved or become unavailable.');}finally{allocation?.fill(0);await handle?.close().catch(()=>{});session.reading=false;}
 }
 async select(paths){
  if(this.busy)throw new FileError('BUSY','Finish choosing the current search files first.');if(!Array.isArray(paths)||!paths.length||paths.length>10||paths.some(p=>typeof p!=='string'||!path.isAbsolute(p)))throw new FileError('SEARCH','Choose 1–10 files with the native picker.');
  this.clear();const version=this.generation;this.busy=true;const sources=[],errors=[],seen=new Set();let total=0;
  try{for(const selected of paths){let handle;try{
    const real=await fs.realpath(selected),canonical=real.toLowerCase();if(seen.has(canonical)){errors.push({name:path.basename(real),message:'Duplicate selection skipped.'});continue;}seen.add(canonical);
    const name=path.basename(real),ext=path.extname(name).slice(1).toLowerCase();if(!TYPES.has(ext))throw new FileError('SEARCH','Choose PDF, DOCX, RTF or UTF-8 text/data files.');
    handle=await fs.open(real,'r');const before=await handle.stat(),maximum=ext==='pdf'?TOTAL:['docx','rtf'].includes(ext)?10*1024*1024:2*1024*1024;
    if(!before.isFile()||!Number.isSafeInteger(before.size)||!before.size||before.size>maximum||before.size+total>TOTAL)throw new FileError('SEARCH','Chosen files exceed the per-format or combined 100 MB search limit.');
    const allocation=Buffer.alloc(before.size+1);let length=0;while(length<allocation.length){const read=await handle.read(allocation,length,allocation.length-length,length);if(!read.bytesRead)break;length+=read.bytesRead;}
    const after=await handle.stat();if(length!==before.size||after.size!==before.size||after.mtimeMs!==before.mtimeMs||after.ctimeMs!==before.ctimeMs)throw new FileError('CHANGED','This file changed while being selected. Choose it again.');
    const bytes=Buffer.from(allocation.subarray(0,length));validateFile(name,bytes);const source={id:randomUUID(),name,ext,path:real,bytes,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};sources.push(source);total+=bytes.length;
   }catch(error){errors.push({name:path.basename(selected).slice(0,512),message:error instanceof FileError?error.message:'This chosen file could not be read. Check its permissions or choose it again.'});}finally{await handle?.close().catch(()=>{});}if(version!==this.generation)throw new FileError('CANCELED','Search selection canceled.');}
   if(!sources.length)throw new FileError('SEARCH',errors[0]?.message||'No searchable source was selected.');
   const token=randomUUID();this.session={token,sources};this.timer=setTimeout(()=>this.clear(token),30*60*1000);this.timer.unref();
   return {token,sources:sources.map(({id,name,ext,size,sha256})=>({id,name,ext,size,sha256})),errors};
  }catch(error){for(const source of sources)source.bytes.fill(0);throw error;}finally{this.busy=false;}
 }
 source(token,id){if(typeof token!=='string'||typeof id!=='string'||!UUID.test(token)||!UUID.test(id)||this.session?.token!==token)throw new FileError('SEARCH','The search snapshot expired. Choose these files again.');const source=this.session.sources.find(s=>s.id===id);if(!source||source.bytes&&createHash('sha256').update(source.bytes).digest('hex')!==source.sha256)throw new FileError('CHANGED','The selected search snapshot changed. Choose its source again.');return source;}
 bytes(token,id){if(this.session?.token===token&&this.session.kind==='folder')return this.folderBytes(token,id);const source=this.source(token,id);return {id:source.id,name:source.name,ext:source.ext,sha256:source.sha256,bytes:Uint8Array.from(source.bytes)};}
 keepAlive(token){if(this.session?.token!==token)throw new FileError('SEARCH','The chosen snapshots expired. Choose the files again.');clearTimeout(this.timer);this.timer=setTimeout(()=>this.clear(token),30*60*1000);this.timer.unref();}
 async assertCurrent(token,id){
  const source=this.source(token,id),session=this.session,grant=session.kind==='folder'?session.grant:null;let handle;const buffer=Buffer.alloc(256*1024);
  try{
   const expected=grant?await grant.inspect(source.path,{expected:source.discovered}):null;
   handle=await fs.open(source.path,'r');const before=await handle.stat();if(!before.isFile()||before.size!==source.size||expected&&!same(before,expected))throw new FileError('CHANGED','The chosen original changed. Choose it again before opening a result.');
   const hash=createHash('sha256');let offset=0;
   while(offset<source.size){if(this.session!==session)throw new FileError('CANCELED','The search grant was revoked.');const part=await handle.read(buffer,0,Math.min(buffer.length,source.size-offset),offset);if(!part.bytesRead)break;hash.update(buffer.subarray(0,part.bytesRead));offset+=part.bytesRead;}
   const extra=await handle.read(buffer,0,1,offset),after=await handle.stat();if(offset!==source.size||extra.bytesRead||!same(before,after)||hash.digest('hex')!==source.sha256)throw new FileError('CHANGED','The chosen original changed. Choose it again before opening a result.');if(grant)await grant.inspect(source.path,{expected:before});this.source(token,id);return true;
  }catch(error){throw error instanceof FileError?error:new FileError('CHANGED','The chosen original could not be checked. Choose it again before opening a result.');}finally{buffer.fill(0);await handle?.close().catch(()=>{});}
 }
 async open(store,token,id){const source=this.source(token,id);if(this.session.kind==='folder'){if(!source.sha256)throw new FileError('SEARCH','Search this PDF before opening its result.');await this.session.grant.inspect(source.path,{expected:source.discovered});await this.assertCurrent(token,id);}return store.open(source.path,{expectedHash:source.sha256});}
}
module.exports={SearchSources};
