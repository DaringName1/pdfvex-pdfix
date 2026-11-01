const fs=require('node:fs/promises');
const path=require('node:path');
const {createHash,randomUUID}=require('node:crypto');
const {validPageRecipe}=require('./page-plan-validation.cjs');
const LIMIT=100*1024*1024;
const canonical=p=>path.resolve(p).toLowerCase();
class PageRecipes{
  constructor(store,ErrorClass,validateFile,options={}){this.store=store;this.ErrorClass=ErrorClass;this.validateFile=validateFile;this.kind=options.kind??'pages';this.types=options.types??['pdf'];this.fields=options.fields??['plan','split'];this.validate=options.validate??validPageRecipe;this.sourceBytes=options.sourceBytes??LIMIT;}
  error(code,message){return new this.ErrorClass(code,message);}
  identity(id){const source=this.store.source(id);if(!this.types.includes(source.ext))throw this.error('FORMAT','Choose a supported original file for this page collection.');return {key:createHash('sha256').update(canonical(source.path)+'\0'+this.kind).digest('hex'),fingerprint:source.fingerprint};}
  descriptor(source){return {path:source.path,name:source.name,fingerprint:source.fingerprint,size:source.bytes.length};}
  async save(id,value){
    if(!value||Object.keys(value).some(k=>!['sourceIds',...this.fields].includes(k))||!Array.isArray(value.sourceIds)||!value.sourceIds.length||value.sourceIds.length>10||value.sourceIds[0]!==id)throw this.error('DRAFT','Choose the opened sources for this page collection.');
    const draft={kind:this.kind,version:1,sources:value.sourceIds.map(sourceId=>this.descriptor(this.store.source(sourceId))),...Object.fromEntries(this.fields.map(field=>[field,value[field]??null]))};
    try{this.validate(draft);}catch{throw this.error('DRAFT','This page collection cannot be saved in recovery.');}
    return this.store.recovery.save(this.identity(id),draft);
  }
  async read(descriptor){
    const real=await fs.realpath(descriptor.path),handle=await fs.open(real,'r');let bytes;
    try{const stat=await handle.stat();if(!stat.isFile()||stat.size!==descriptor.size||stat.size>this.sourceBytes)throw this.error('CHANGED','The source file changed.');const buffer=Buffer.alloc(stat.size+1);let length=0;while(length<buffer.length){const chunk=await handle.read(buffer,length,buffer.length-length,length);if(!chunk.bytesRead)break;length+=chunk.bytesRead;}bytes=buffer.subarray(0,length);if(length!==stat.size||createHash('sha256').update(bytes).digest('hex')!==descriptor.fingerprint)throw this.error('CHANGED','The source file changed.');}finally{await handle.close();}
    const name=path.basename(real),ext=this.validateFile?this.validateFile(name,bytes):path.extname(name).slice(1).toLowerCase();if(!this.types.includes(ext)||ext==='pdf'&&!bytes.subarray(0,1024).toString('latin1').includes('%PDF-'))throw this.error('FORMAT','The recovered source has an unsupported format.');
    return {path:real,name,ext,bytes,fingerprint:descriptor.fingerprint};
  }
  async load(id){
    const identity=this.identity(id),draft=await this.store.recovery.load(identity);if(!draft)return null;
    if(draft.kind!==this.kind)throw this.error('DRAFT','This recovery entry is not the expected page collection.');
    const root=this.store.source(id);if(canonical(draft.sources[0].path)!==canonical(root.path)||draft.sources[0].fingerprint!==root.fingerprint)throw this.error('DRAFT','This collection belongs to a different original file.');
    const sources=[root],issues=[];
    // Read and fingerprint every additional source before changing any live handles.
    for(let index=1;index<draft.sources.length;index++){try{sources[index]=await this.read(draft.sources[index]);}catch(error){issues.push({index,name:draft.sources[index].name,reason:error.code==='CHANGED'?'changed':'unavailable'});}}
    if(issues.length)return {issues};
    if(this.store.source(id)!==root)throw this.error('MISSING','The source session ended during recovery.');
    const additions=[],files=sources.map((source,index)=>{
      const existing=index===0?[id,root]:[...this.store.handles].find(([,h])=>canonical(h.path)===canonical(source.path)&&h.fingerprint===source.fingerprint);
      const sourceId=existing?.[0]??randomUUID();if(!existing)additions.push([sourceId,source]);
      return {id:sourceId,name:source.name,ext:source.ext,size:source.bytes.length,location:source.path,bytes:Uint8Array.from(source.bytes)};
    });
    if(this.store.handles.size+additions.length>10||[...this.store.handles.values(),...additions.map(([,s])=>s)].reduce((n,s)=>n+s.bytes.length,0)>LIMIT)throw this.error('TOO_LARGE','Reopen the original file to restore this collection within the 10-file / 100 MB session limit.');
    for(const [sourceId,source]of additions)this.store.handles.set(sourceId,source);
    return {files,...Object.fromEntries(this.fields.map(field=>[field,draft[field]])),issues:[]};
  }
  async relink(id,index,filePath){
    const identity=this.identity(id),draft=await this.store.recovery.load(identity);
    if(!draft||draft.kind!==this.kind||!Number.isInteger(index)||index<1||index>=draft.sources.length)throw this.error('DRAFT','Choose a missing source in this collection.');
    const source=await this.read({...draft.sources[index],path:filePath});
    if(this.identity(id).fingerprint!==identity.fingerprint)throw this.error('MISSING','The source session ended during recovery.');
    draft.sources[index]=this.descriptor(source);await this.store.recovery.save(identity,draft);return true;
  }
  clear(id){return this.store.recovery.clearDraft(this.identity(id));}
}
module.exports={PageRecipes};
