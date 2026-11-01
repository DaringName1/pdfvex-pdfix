const path=require('node:path'),{createHash}=require('node:crypto');
const {BatchCompression}=require('./batch-compression.cjs');
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {FileError}=require('./file-store.cjs');
const {validBatchTextResult}=require('./batch-pdf-text-validation.cjs');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function outputName(name,ext){if(typeof name!=='string'||!name.length||name.length>180||/[<>:"/\\|?*\x00-\x1f]/.test(name)||/[. ]$/.test(name)||name==='.'||name==='..'||/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(name)||path.extname(name).toLowerCase()!=='.'+ext||path.basename(name)!==name)throw new FileError('NAME','Choose a single valid output filename with the selected extension.');return name;}
class BatchTextService extends ContainedServiceContext{
 constructor(options){super('Batch PDF text extraction','BatchText',options);}
 async extract(jobToken,bytes){const expected=hash(bytes);return this._runContained(jobToken,null,'batch-pdf-text',Uint8Array.from(bytes),{},value=>validBatchTextResult(value,expected));}
}
class BatchDocumentActions extends BatchCompression{
 constructor(options){const text=new BatchTextService(options);super({cancel:token=>text.cancel(token,null)});this.text=text;this.options={...text.options};}
 async build(token,id,jobToken,value){
  this.check(token);this.idle();if(!UUID.test(jobToken)||!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join(',')!=='action,name'||!['copy','text'].includes(value.action))throw new FileError('BATCH','Choose a supported source-bound batch action.');
  const source=this.sources.source(token,id),record=this.records.get(id);if(!record||record.status==='saved')throw new FileError('BATCH','Choose an unsaved queue item.');const ext=value.action==='copy'?'pdf':'txt',name=outputName(value.name,ext);this.sources.keepAlive(token);this.clearOutput();const version=++this.version,job={id,token:jobToken,version,promise:null};this.active=job;record.status='processing';delete record.error;
  job.promise=(async()=>{await this.sources.assertCurrent(token,id);if(version!==this.version)throw new FileError('CANCELED','Batch processing stopped.');const result=value.action==='copy'?{bytes:Uint8Array.from(source.bytes)}:await this.text.extract(jobToken,source.bytes);if(version!==this.version)throw new FileError('CANCELED','Batch processing stopped. No copy was saved.');this.check(token);this.sources.source(token,id);
   const bytes=Buffer.from(result.bytes);if(!bytes.length||bytes.length>(value.action==='copy'?100:2)*1024*1024||value.action==='copy'&&hash(bytes)!==source.sha256)throw new FileError('VERIFY','The batch output does not match its bounded source-bound action.');const report={action:value.action,name,ext,sourceSha256:source.sha256,sha256:hash(bytes),size:bytes.length,originalSize:source.size,pageCount:result.pageCount??null,scope:value.action==='copy'?'Bit-identical PDF copy. Encryption, signatures, attachments and all original content remain unchanged; this does not establish their safety or validity.':result.scope,notices:result.notices??[]};this.verified={id,token,jobToken,bytes,report};record.status='review';Object.assign(record,{action:value.action,proposedName:name,outputSha256:report.sha256});this.sources.keepAlive(token);return {...report,jobToken,text:value.action==='text'?bytes.toString('utf8'):null};
  })();try{return await job.promise;}catch(error){record.status=version===this.version?'failed':'canceled';record.error=String(error.message).slice(0,700);throw error;}finally{if(this.active===job)this.active=null;}
 }
 async save(store,token,id,jobToken,review){
  this.check(token);this.idle();const output=this.output(token,id,jobToken);if(!review||Object.getPrototypeOf(review)!==Object.prototype||Object.keys(review).join(',')!=='sha256'||review.sha256!==output.report.sha256)throw new FileError('REVIEW','Prepare this output again before saving.');this.saving=true;
  this.savePending=(async()=>{await this.sources.assertCurrent(token,id);const folder=await this.prepareFolder();await this.sources.assertCurrent(token,id);const desired=outputName(output.report.name,output.report.ext),base=desired.slice(0,-(output.report.ext.length+1));let saved;
   for(let n=1;n<=99;n++){const name=base+(n===1?'':` (${n})`)+'.'+output.report.ext,destination=path.join(folder,name);if(path.dirname(destination).toLowerCase()!==folder.toLowerCase()||this.sources.session.sources.some(source=>source.path.toLowerCase()===destination.toLowerCase()))throw new FileError('PATH','The output must be a new copy in the chosen batch folder.');try{saved=await store.saveCopy(null,destination,output.bytes,output.report.ext,output.report.sha256);break;}catch(error){if(!['EXISTS','ORIGINAL'].includes(error.code))throw error;}}
   if(!saved)throw new FileError('EXISTS','All 99 keep-both names are occupied.');let warning=null;try{await this.sources.assertCurrent(token,id);}catch{warning='The original changed or became unavailable during saving. This saved output still matches the previously chosen immutable snapshot; choose the original again before further actions.';}
   const record=this.records.get(id);Object.assign(record,{status:'saved',action:output.report.action,saved:{...saved,sha256:output.report.sha256},warning});delete record.error;this.clearOutput();this.sources.keepAlive(token);return {...saved,sha256:record.saved.sha256,warning};
  })();try{return await this.savePending;}catch(error){const record=this.records.get(id);if(record?.status==='review')record.error=String(error.message).slice(0,700);throw error;}finally{this.saving=false;this.savePending=null;}
 }
 report(token){return {...super.report(token),kind:'PDFix.BatchDocumentActions.v1',scope:'Explicit source-sealed new copies and narrowly supported literal PDF text. Originals are never renamed or overwritten.'};}
 async status(){return this.text.status();}
 async dispose(){await super.dispose();await this.text.dispose();}
}
module.exports={BatchDocumentActions,BatchTextService,outputName};
