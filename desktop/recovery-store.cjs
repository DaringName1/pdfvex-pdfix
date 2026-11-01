const fs=require('node:fs/promises'),{renameWithRetry}=require('./rename-retry.cjs');
const path=require('node:path');
const {randomUUID,createHash}=require('node:crypto');
const {validMarkupDraft}=require('./markup-validation.cjs');
const {validFormDraft}=require('./form-validation.cjs');
const {validRedactionDraft}=require('./redaction-validation.cjs');
const {validSignatureRequestRecovery}=require('./signature-request-validation.cjs');
const {validPageRecipe}=require('./page-plan-validation.cjs');
const {validContentDraft}=require('./content-validation.cjs');
const {validDocumentLayout}=require('./document-layout-validation.cjs');
const {validateDocumentTables}=require('./document-table-validation.cjs');
const {validateDocumentImages}=require('./document-image-validation.cjs');
const {validPresentationDraft}=require('./presentation-validation.cjs');
const {validWorkbookDraft}=require('./workbook-validation.cjs');
const {validImagePages}=require('./image-pages-validation.cjs');
const LIMITS=require('./document-limits.cjs');
const DRAFT_LIMIT=LIMITS.DOCUMENT_BYTES,HISTORY_LIMIT=LIMITS.HISTORY_BYTES,TOTAL_LIMIT=LIMITS.RECOVERY_TOTAL_BYTES,VERSION_LIMIT=20,MAX_PINNED=3;
// Drops the oldest versions until the history fits, keeping pinned ones (kept unsaved work) as long as an unpinned
// older version can go instead. The newest version is never the one dropped while an older one exists.
function prune(versions){const sizes=versions.map(v=>Buffer.byteLength(JSON.stringify(v))+1);let bytes=sizes.reduce((sum,size)=>sum+size,32);
  while(versions.length>VERSION_LIMIT||bytes>HISTORY_LIMIT){const unpinned=versions.findIndex(v=>!v.pinned),at=unpinned>=0&&unpinned<versions.length-1?unpinned:0;bytes-=sizes.splice(at,1)[0];versions.splice(at,1);}
  return versions;}
const managed=/^(draft|versions)-[a-f0-9]{64}\.json$/;
const temporary=/^(recovery|draft)-[a-f0-9-]{36}\.tmp$/;
class RecoveryError extends Error{constructor(code,message){super(message);this.code=code;}}
function serialize(value,limit){let json;try{json=JSON.stringify(value);}catch{throw new RecoveryError('DRAFT','This recovery content cannot be stored. Export a copy instead.');}if(!json||Buffer.byteLength(json)>limit)throw new RecoveryError('DRAFT','Recovery content exceeds its size limit. Export a copy to keep your work.');return json;}
function validDraft(draft){
  if(!draft||!['rich','source','markup','form','image','redaction','pages','pdf-content','image-pages','workbook','presentation','signature-request'].includes(draft.kind)||draft.kind==='source'&&typeof draft.text!=='string'||draft.kind==='rich'&&(!draft.content||draft.content.type!=='doc'))throw new RecoveryError('DRAFT','This recovery content is unsupported. Export a copy instead.');
  if(['rich','source'].includes(draft.kind)&&draft.layout!==undefined)try{validDocumentLayout(draft.layout);}catch{throw new RecoveryError('DRAFT','The document page setup is invalid.');}
  if(draft.kind==='presentation')try{validPresentationDraft(draft);}catch(error){throw new RecoveryError('DRAFT',error.message);}
  if(draft.kind==='workbook')try{validWorkbookDraft(draft);}catch(error){throw new RecoveryError('DRAFT',error.message);}
  if(draft.kind==='image-pages')try{validImagePages(draft);}catch{throw new RecoveryError('DRAFT','This image page collection is invalid.');}
  if(draft.kind==='pdf-content')try{validContentDraft(draft);}catch{throw new RecoveryError('DRAFT','PDF content recovery exceeds its 2 MB limit or contains invalid additions. Save a reviewed copy to keep larger images.');}
  if(draft.kind==='pages')try{validPageRecipe(draft);}catch{throw new RecoveryError('DRAFT','This page arrangement is invalid.');}
  if(draft.kind==='redaction')try{validRedactionDraft(draft);}catch{throw new RecoveryError('DRAFT','This redaction recovery plan is invalid.');}
  if(draft.kind==='signature-request')try{validSignatureRequestRecovery(draft);}catch{throw new RecoveryError('DRAFT','This signing request recovery is invalid.');}
  if(draft.kind==='markup')try{validMarkupDraft(draft);}catch{throw new RecoveryError('DRAFT','This markup recovery content is unsupported. Export a copy instead.');}
  if(draft.kind==='image'){const s=draft.settings;if(draft.version!==1||!s||![0,90,180,270].includes(s.rotation)||!['a4','letter','image'].includes(s.paper)||!['auto','portrait','landscape'].includes(s.orientation)||!Number.isFinite(s.margin)||s.margin<0||s.margin>50)throw new RecoveryError('DRAFT','Choose supported image page settings and margins.');}
  if(draft.kind==='form')try{validFormDraft(draft);}catch{throw new RecoveryError('DRAFT','This form recovery content is unsupported. Export a copy instead.');}
  if(draft.kind==='rich'){try{validateDocumentTables(draft.content);validateDocumentImages(draft.content);}catch(error){throw new RecoveryError('DRAFT',error.message);}let count=0;const visit=(node,depth)=>{if(depth>64||++count>LIMITS.DOCUMENT_NODES||!node||typeof node.type!=='string')throw new RecoveryError('DRAFT','This document is too complex for recovery. Export a copy instead.');if(node.content!==undefined){if(!Array.isArray(node.content))throw new RecoveryError('DRAFT','Recovery content is invalid.');node.content.forEach(child=>visit(child,depth+1));}};visit(draft.content,0);}
  serialize(draft,DRAFT_LIMIT);return draft;
}
class RecoveryStore{
  constructor(directory){this.directory=directory;this.queue=Promise.resolve();}
  file(prefix,identity){return path.join(this.directory,`${prefix}-${identity.key}.json`);}
  enqueue(action){const operation=this.queue.catch(()=>{}).then(action);this.queue=operation;return operation;}
  async init(){for(const entry of await fs.readdir(this.directory,{withFileTypes:true}))if(entry.isFile()&&temporary.test(entry.name))await fs.rm(path.join(this.directory,entry.name),{force:true});}
  async read(file,limit){
    const handle=await fs.open(file,'r');try{const stat=await handle.stat();if(!stat.isFile()||stat.size>limit)throw new Error('Recovery size limit');const buffer=Buffer.alloc(stat.size+1);let length=0;while(length<buffer.length){const chunk=await handle.read(buffer,length,buffer.length-length,length);if(!chunk.bytesRead)break;length+=chunk.bytesRead;}if(length>stat.size)throw new Error('Recovery changed while reading');return JSON.parse(buffer.subarray(0,length).toString('utf8'));}finally{await handle.close();}
  }
  async write(file,value,limit){
    const json=serialize(value,limit),prefix=path.basename(file).split('-')[0];let total=0,count=0,oldSize=0;
    for(const entry of await fs.readdir(this.directory,{withFileTypes:true})){if(!entry.isFile()||!managed.test(entry.name)||!entry.name.startsWith(prefix+'-'))continue;const stat=await fs.stat(path.join(this.directory,entry.name));total+=stat.size;count++;if(entry.name===path.basename(file))oldSize=stat.size;}
    if(total-oldSize+Buffer.byteLength(json)>TOTAL_LIMIT||!oldSize&&count>=100)throw new RecoveryError('RECOVERY_FULL','Local recovery storage is full. Export your work, then clear recovery data in Settings.');
    const temp=path.join(this.directory,`recovery-${randomUUID()}.tmp`);let handle;
    try{handle=await fs.open(temp,'wx');await handle.writeFile(json,'utf8');await handle.sync();await handle.close();handle=null;await renameWithRetry(temp,file);}
    catch{throw new RecoveryError('RECOVERY_WRITE','Recovery data could not be saved. Check disk space and folder permissions, or export a copy before leaving.');}
    finally{if(handle)await handle.close().catch(()=>{});await fs.rm(temp,{force:true}).catch(()=>{});}
  }
  async history(identity){
    try{const value=await this.read(this.file('versions',identity),HISTORY_LIMIT);if(value.version!==1||!Array.isArray(value.versions)||value.versions.length>VERSION_LIMIT)throw new Error('Invalid history');for(const version of value.versions){if(typeof version.id!=='string'||typeof version.fingerprint!=='string'||typeof version.label!=='string'||!Number.isFinite(Date.parse(version.createdAt)))throw new Error('Invalid version');validDraft(version.draft);}return value.versions;}
    catch(error){if(error.code==='ENOENT')return [];throw new RecoveryError('HISTORY','Version history could not be read. Export current work before clearing recovery data.');}
  }
  async load(identity){await this.queue.catch(()=>{});try{const value=await this.read(this.file('draft',identity),DRAFT_LIMIT+512);return value.fingerprint===identity.fingerprint?validDraft(value.draft):null;}catch(error){if(error.code==='ENOENT')return null;throw new RecoveryError('RECOVERY_READ','The recovery draft could not be read. The original is safe; check version history for another copy.');}}
  // A draft made on an earlier state of the file (it changed since, for example by a sync or another program) is never
  // applied to the newer file. It becomes a pinned entry in this file's Version history instead, where it can be looked
  // at and restored on purpose; pinned entries are not pushed out by newer automatic versions. Returns {kind} or null.
  keepStale(identity,label){return this.enqueue(async()=>{
    let value;try{value=await this.read(this.file('draft',identity),DRAFT_LIMIT+512);}catch(error){if(error.code==='ENOENT')return null;throw new RecoveryError('RECOVERY_READ','The recovery draft could not be read. The original is safe; check version history for another copy.');}
    if(value.fingerprint===identity.fingerprint)return null;const draft=validDraft(value.draft);
    const versions=await this.history(identity),hash=createHash('sha256').update(serialize(draft,DRAFT_LIMIT)).digest('hex');
    if(!versions.some(v=>v.pinned&&v.hash===hash&&v.fingerprint===identity.fingerprint)){
      versions.push({id:randomUUID(),fingerprint:identity.fingerprint,createdAt:new Date().toISOString(),label:String(label).slice(0,80),hash,draft,pinned:true});
      const pinned=versions.filter(v=>v.pinned);while(pinned.length>MAX_PINNED)versions.splice(versions.indexOf(pinned.shift()),1);
      prune(versions);await this.write(this.file('versions',identity),{version:1,versions},HISTORY_LIMIT);
    }
    await fs.rm(this.file('draft',identity),{force:true});return {kind:draft.kind};
  });}
  async checkpointNow(identity,draft,label='Saved version',automatic=false){
    validDraft(draft);const versions=await this.history(identity),hash=createHash('sha256').update(serialize(draft,DRAFT_LIMIT)).digest('hex');const latest=[...versions].reverse().find(v=>v.fingerprint===identity.fingerprint);
    if(latest?.hash===hash)return latest.id;
    if(automatic&&latest&&Date.now()-Date.parse(latest.createdAt)<60000)return null;
    const version={id:randomUUID(),fingerprint:identity.fingerprint,createdAt:new Date().toISOString(),label:String(label).trim().slice(0,80)||'Saved version',hash,draft};
    versions.push(version);prune(versions);
    await this.write(this.file('versions',identity),{version:1,versions},HISTORY_LIMIT);return version.id;
  }
  checkpoint(identity,draft,label){return this.enqueue(()=>this.checkpointNow(identity,draft,label));}
  save(identity,draft){validDraft(draft);const snapshot=JSON.parse(serialize(draft,DRAFT_LIMIT));return this.enqueue(async()=>{await this.write(this.file('draft',identity),{fingerprint:identity.fingerprint,draft:snapshot},DRAFT_LIMIT+512);let versionWarning=null;try{await this.checkpointNow(identity,snapshot,'Automatic version',true);}catch(error){versionWarning=error.message;}return {versionWarning};});}
  async list(identity){await this.queue.catch(()=>{});return (await this.history(identity)).filter(v=>v.fingerprint===identity.fingerprint).reverse().map(v=>({id:v.id,createdAt:v.createdAt,label:v.label,kind:v.draft.kind,size:Buffer.byteLength(JSON.stringify(v.draft))}));}
  // Versions made before the file changed somewhere else (X11). They are listed separately and only ever read, never
  // restored into the changed file, because they belong to different file contents.
  async listEarlier(identity){await this.queue.catch(()=>{});return (await this.history(identity)).filter(v=>v.fingerprint!==identity.fingerprint).reverse().map(v=>({id:v.id,createdAt:v.createdAt,label:v.label,kind:v.draft.kind,size:Buffer.byteLength(JSON.stringify(v.draft)),earlier:true}));}
  async getEarlier(identity,versionId){await this.queue.catch(()=>{});const version=(await this.history(identity)).find(v=>v.id===versionId&&v.fingerprint!==identity.fingerprint);if(!version)throw new RecoveryError('VERSION','This earlier version is no longer kept.');return version.draft;}
  async get(identity,versionId){await this.queue.catch(()=>{});const version=(await this.history(identity)).find(v=>v.id===versionId&&v.fingerprint===identity.fingerprint);if(!version)throw new RecoveryError('VERSION','This version does not match the current source. Reopen the matching document.');return version.draft;}
  restore(identity,versionId,current){validDraft(current);const snapshot=JSON.parse(serialize(current,DRAFT_LIMIT));return this.enqueue(async()=>{const version=(await this.history(identity)).find(v=>v.id===versionId&&v.fingerprint===identity.fingerprint);if(!version||version.draft.kind!==snapshot.kind)throw new RecoveryError('VERSION','This version does not match the current editing mode/source.');await this.checkpointNow(identity,snapshot,'Before restoring an earlier version');await this.write(this.file('draft',identity),{fingerprint:identity.fingerprint,draft:version.draft},DRAFT_LIMIT+512);return version.draft;});}
  clearDraft(identity){return this.enqueue(()=>fs.rm(this.file('draft',identity),{force:true}));}
  // Removes one document's draft and its versions, for discarding an unsaved new document.
  discard(identity){return this.enqueue(async()=>{await fs.rm(this.file('draft',identity),{force:true});await fs.rm(this.file('versions',identity),{force:true});});}
  info(){return this.enqueue(async()=>{let drafts=0,histories=0,temporaryFiles=0,bytes=0;for(const entry of await fs.readdir(this.directory,{withFileTypes:true})){if(!entry.isFile()||!managed.test(entry.name)&&!temporary.test(entry.name))continue;bytes+=(await fs.stat(path.join(this.directory,entry.name))).size;if(entry.name.startsWith('versions-'))histories++;else if(entry.name.endsWith('.tmp'))temporaryFiles++;else drafts++;}return {drafts,histories,temporaryFiles,bytes,versionsPerDocument:VERSION_LIMIT,historyBytesPerDocument:HISTORY_LIMIT,totalBytesPerKind:TOTAL_LIMIT};});}
  clearAll(){return this.enqueue(async()=>{let removed=0;for(const entry of await fs.readdir(this.directory,{withFileTypes:true})){if(entry.isFile()&&(managed.test(entry.name)||temporary.test(entry.name))){await fs.rm(path.join(this.directory,entry.name),{force:true});removed++;}}return {removed};});}
}
module.exports={RecoveryStore,RecoveryError};
