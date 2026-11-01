const fs=require('node:fs/promises'),{renameWithRetry}=require('./rename-retry.cjs'),path=require('node:path');
const {randomUUID}=require('node:crypto');
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {hash,validFormBuilderDraft,canonicalDraft,validFormBuilderSource,validFormBuilderToken,validFormBuilderInspection,validFormBuilderResult}=require('./form-builder-validation.cjs');
class FormBuilderService extends ContainedServiceContext{
 constructor(directory,options){super('PDF fillable field creation','FormBuilder',options);if(typeof directory!=='string'||!path.isAbsolute(directory))throw new Error('Form-building recipes need an app-owned absolute directory.');this.directory=path.join(directory,'form-builder-drafts');this.queue=Promise.resolve();this.info=null;}
 sourceBytes(sourceId,source){if(this.disposed)throw new Error('The form-builder containment service has closed.');return validFormBuilderSource(sourceId,source);}
 source(source){const bytes=this.sourceBytes(source?.fingerprint,source),fingerprint=hash(bytes);bytes.fill(0);return fingerprint;}
 async inspect(source){
  if(this.active)throw new Error('Another form-building operation is still finishing or being canceled.');const bytes=this.sourceBytes(source?.fingerprint,source),fingerprint=hash(bytes);this.info=null;
  const result=await this._runContained(fingerprint,null,'form-inspect',bytes,{},value=>validFormBuilderInspection(value,fingerprint));validFormBuilderInspection(result,fingerprint);this.info={fingerprint,value:structuredClone(result)};return {...structuredClone(result),fingerprint};
 }
 async cancelInspection(source){
  const fingerprint=this.source(source),job=this.active;
  if(!job||job.token!==null||job.sourceId!==fingerprint)return false;
  this.info=null;return super.cancel(fingerprint,null);
 }
 async create(sourceId,source,token,value){
  if(this.active)throw new Error('Another form-building operation is still finishing or being canceled.');validFormBuilderToken(token);const info=this.info?.fingerprint===source?.fingerprint?this.info.value:undefined,draft=canonicalDraft(value,info);if(!draft.fields.length)throw new Error('Add at least one reviewed field.');const bytes=this.sourceBytes(sourceId,source),fingerprint=hash(bytes),byteLength=bytes.length;this.clearVerified();
  const result=await this._runContained(sourceId,token,'form-create',bytes,{draft},value=>validFormBuilderResult(value,draft,fingerprint,byteLength,info));validFormBuilderResult(result,draft,fingerprint,byteLength,info);
  this.verified={sourceId,fingerprint,token,bytes:Buffer.from(result.bytes),pageCount:result.pageCount,expected:structuredClone(result.expected),sha256:result.sha256,report:structuredClone(result.report)};
  return {...result,bytes:Uint8Array.from(result.bytes),expected:structuredClone(result.expected),report:structuredClone(result.report),sourceFingerprint:fingerprint};
 }
 output(sourceId,source,token){validFormBuilderToken(token);const bytes=this.sourceBytes(sourceId,source),fingerprint=hash(bytes);bytes.fill(0);const value=this.verified;if(!value||value.sourceId!==sourceId||value.fingerprint!==fingerprint||value.token!==token||hash(value.bytes)!==value.sha256)throw new Error('Rebuild and review the source-bound fillable copy before saving.');return {bytes:Uint8Array.from(value.bytes),sha256:value.sha256};}
 clearVerified(token){const value=this.verified;if(value&&(!token||value.token===token)){value.bytes.fill(0);this.verified=null;}}
 async discard(token){validFormBuilderToken(token);const sealed=!!(this.verified?.token===token);this.clearVerified(token);const job=this.active;if(job?.token===token)return await super.cancel(job.sourceId,token);return sealed;}
 async cancel(sourceId,token){if(typeof sourceId!=='string'||!sourceId)return false;if(this.verified?.sourceId===sourceId&&(!token||this.verified.token===token))this.clearVerified(this.verified.token);return super.cancel(sourceId,token);}
 draftPath(source){return path.join(this.directory,this.source(source)+'.json');}
 async loadDraft(source){
  await this.queue.catch(()=>{});const target=this.draftPath(source);let stat;try{stat=await fs.lstat(target);}catch(error){if(error.code==='ENOENT')return null;throw new Error('The local form-building recipe could not be read.');}if(!stat.isFile()||stat.isSymbolicLink()||stat.size>128*1024)throw new Error('The saved form-building recipe is invalid.');
  const handle=await fs.open(target,'r');let saved;try{const current=await handle.stat();if(!current.isFile()||current.size>128*1024)throw new Error('The saved form-building recipe is invalid.');const buffer=Buffer.alloc(current.size+1);let size=0;while(size<buffer.length){const read=await handle.read(buffer,size,buffer.length-size,size);if(!read.bytesRead)break;size+=read.bytesRead;}if(size!==current.size)throw new Error('The saved recipe changed while reading.');saved=JSON.parse(buffer.subarray(0,size).toString('utf8'));}finally{await handle.close();}if(saved.version!==1||saved.fingerprint!==source.fingerprint)throw new Error('This recipe belongs to a different source snapshot.');validFormBuilderDraft(saved.draft,this.info?.fingerprint===source.fingerprint?this.info.value:undefined);return saved.draft;
 }
 saveDraft(source,draft){
  const target=this.draftPath(source);validFormBuilderDraft(draft,this.info?.fingerprint===source.fingerprint?this.info.value:undefined);const json=JSON.stringify({version:1,fingerprint:source.fingerprint,draft});if(Buffer.byteLength(json)>128*1024)throw new Error('The form-building recipe exceeds 128 KB.');
  const operation=this.queue.catch(()=>{}).then(async()=>{await fs.mkdir(this.directory,{recursive:true});const files=await fs.readdir(this.directory);if(files.filter(name=>/^[a-f0-9]{64}\.json$/.test(name)).length>=100&&!files.includes(path.basename(target)))throw new Error('Local form-building recovery reached 100 documents. Clear completed recipes before adding another.');const temporary=path.join(this.directory,randomUUID()+'.tmp');try{await fs.writeFile(temporary,json,{flag:'wx'});await renameWithRetry(temporary,target);}finally{await fs.unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;});}});this.queue=operation;return operation;
 }
 clearDraft(source){const target=this.draftPath(source),operation=this.queue.catch(()=>{}).then(()=>fs.unlink(target).catch(error=>{if(error.code!=='ENOENT')throw error;}));this.queue=operation;return operation;}
 async dispose(){this.clearVerified();this.info=null;let error;try{await super.dispose();}catch(failure){error=failure;}await this.queue.catch(()=>{});if(error)throw error;}
}
module.exports={FormBuilderService};
