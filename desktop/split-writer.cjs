const fs=require('node:fs/promises');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {stageOutput,publishOutput,discardStage,unlinkOwned,digest}=require('./verified-output.cjs');
const MAX_BYTES=100*1024*1024;
const error=(code,message)=>Object.assign(new Error(message),{code});
function splitFolderName(name){
 if(typeof name!=='string'||!name||name.length>80||name!==name.trim()||/^[.]/.test(name)||/[. ]$/.test(name)||/[<>:"/\\|?*\x00-\x1f]/.test(name)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name))throw error('FOLDER','Choose a folder name of 1–80 characters without path separators or Windows reserved names.');return name;
}
function splitParts(parts){
 if(!Array.isArray(parts)||parts.length<2||parts.length>500)throw error('OUTPUT','Choose between 2 and 500 split PDFs.');let size=0,pages=0;
 for(const p of parts){if(!p||!(p.bytes instanceof Uint8Array)||!p.bytes.length||!Number.isInteger(p.pageCount)||p.pageCount<1||p.pageCount>500)throw error('OUTPUT','Each split PDF needs bounded bytes and a valid page count.');size+=p.bytes.length;pages+=p.pageCount;if(size>MAX_BYTES||pages>500)throw error('OUTPUT','Split outputs support a combined 100 MB and 500 pages.');if(!Buffer.from(p.bytes.buffer,p.bytes.byteOffset,Math.min(p.bytes.length,1024)).includes(Buffer.from('%PDF-')))throw error('OUTPUT','A split output is not a PDF. Rebuild the previews.');}return {size,pages};
}
async function writeSplit(directory,name,parts,{check=()=>{},sourceSha256=null}={}){
 splitFolderName(name);splitParts(parts);const snapshots=parts.map(part=>({bytes:Buffer.from(part.bytes),pageCount:part.pageCount}));
 if(typeof directory!=='string'||!path.isAbsolute(directory))throw error('PATH','Choose the destination with the folder picker.');let parent;try{parent=await fs.realpath(directory);if(!(await fs.stat(parent)).isDirectory())throw new Error();}catch{throw error('PATH','That output folder is unavailable. Choose another folder.');}
 const target=path.resolve(parent,name),staging=path.join(parent,'.pdfix-split-'+randomUUID()+'.partial');if(path.dirname(target).toLowerCase()!==parent.toLowerCase())throw error('PATH','Choose a folder name within the selected destination.');
 const stages=[],published=[],files=[];let created=false,targetIdentity,stageIdentity;
 const cleanup=async()=>{let good=true;for(const item of published)good=(await unlinkOwned(item.path,item.stage.identity))&&good;for(const stage of stages)good=(await discardStage(stage))&&good;if(created)try{const stat=await fs.lstat(target);if(stat.isDirectory()&&!stat.isSymbolicLink()&&stat.ino===targetIdentity.ino&&stat.dev===targetIdentity.dev)await fs.rmdir(target);else good=false;}catch(e){if(e.code!=='ENOENT')good=false;}try{const stat=await fs.lstat(staging);if(stat.isDirectory()&&!stat.isSymbolicLink()&&stat.ino===stageIdentity.ino&&stat.dev===stageIdentity.dev)await fs.rmdir(staging);else good=false;}catch(e){if(e.code!=='ENOENT')good=false;}return good;};
 try{check();await fs.mkdir(staging,{mode:0o700});stageIdentity=await fs.lstat(staging);
  for(let i=0;i<snapshots.length;i++){check();const part=snapshots[i],filename='part-'+String(i+1).padStart(3,'0')+'.pdf',sha256=digest(part.bytes);stages.push(await stageOutput(staging,part.bytes,{expectedHash:sha256,check}));files.push({name:filename,size:part.bytes.length,pageCount:part.pageCount,sha256});}
  const receiptName='PDFix-split-complete.json',receipt=Buffer.from(JSON.stringify({version:1,kind:'PDFix.SplitPublication.v1',sourceSha256,files,notice:'All part bytes matched reviewed staged hashes at publication. Structural/visual/signature acceptance is separate.'},null,2)+'\n');stages.push(await stageOutput(staging,receipt,{check}));
  check();await fs.mkdir(target);created=true;targetIdentity=await fs.lstat(target);
  for(let i=0;i<stages.length;i++){check();const destination=path.join(target,i<files.length?files[i].name:receiptName);await publishOutput(stages[i],destination);published.push({path:destination,stage:stages[i]});}
  // Completion receipt is published last. A crash cannot expose a partial PDF,
  // but a folder lacking that receipt is an incomplete multi-file publication.
  let cleanupWarning;try{await fs.rmdir(staging);}catch{cleanupWarning='Verified copies saved; temporary staging links remain at '+staging+'.';}
  return {name,location:target,count:files.length,files,completionFile:receiptName,...(cleanupWarning?{cleanupWarning}:{})};
 }catch(cause){if(!await cleanup())throw error('PARTIAL','Split saving failed. Review '+target+' and '+staging+' before sharing. Originals are unchanged; unowned replacements were not deleted.');if(cause.code==='EEXIST')throw error('EXISTS','That split folder or filename exists. Choose a new name.');throw error(cause.code||'WRITE',cause.message||'Split saving failed; verified staging copies were removed.');}
}
module.exports={splitFolderName,splitParts,writeSplit};
