const path=require('node:path'),{randomUUID}=require('node:crypto'),{assetValue}=require('./form-validation.cjs');
class SignatureError extends Error{constructor(message){super(message);this.code='SIGNATURES';}}
class SignatureStore{
 constructor(directory,recovery){this.file=path.join(directory,'signatures.json');this.recovery=recovery;this.queue=Promise.resolve();}
 async read(){try{const value=await this.recovery.read(this.file,8*1024*1024);if(value.version!==1||!Array.isArray(value.items)||value.items.length>10)throw new Error();const ids=new Set();return value.items.map(item=>{if(!/^[a-f0-9-]{36}$/.test(item.id)||ids.has(item.id)||typeof item.name!=='string'||!item.name||item.name.length>80)throw new Error();ids.add(item.id);return {id:item.id,name:item.name,asset:assetValue(item.asset)};});}catch(e){if(e.code==='ENOENT')return [];throw new SignatureError('Saved signatures could not be read. Use a new signature, or delete saved signatures to reset the library.');}}
 async list(){await this.queue.catch(()=>{});return this.read();}
 mutate(action){const op=this.queue.catch(()=>{}).then(async()=>{const items=await action();if(Buffer.byteLength(JSON.stringify(items))>8*1024*1024)throw new SignatureError('Saved signatures exceed 8 MB. Delete an unused signature first.');await this.recovery.write(this.file,{version:1,items},8*1024*1024);return items;});this.queue=op;return op;}
 async save(name,asset){let valid;try{valid=assetValue(asset);}catch(e){throw new SignatureError(e.message);}if(typeof name!=='string'||!name.trim()||name.length>80)throw new SignatureError('Name the signature with up to 80 characters.');const snapshot=structuredClone(valid);return this.mutate(async()=>{const items=await this.read();if(items.length>=10)throw new SignatureError('Keep up to 10 saved signatures. Delete an unused one first.');return [...items,{id:randomUUID(),name:name.trim(),asset:snapshot}];});}
 async remove(id){if(typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id))throw new SignatureError('Choose a saved signature to delete.');return this.mutate(async()=>{const items=await this.read();return items.filter(item=>item.id!==id);});}
 clear(){return this.mutate(async()=>[]);}
}
module.exports={SignatureStore,SignatureError};
