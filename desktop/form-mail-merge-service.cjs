'use strict';
// This parent only parses bounded inert CSV. PDF inspection/build/reopen stays contained.
const {randomUUID}=require('node:crypto');
const {FormFillService}=require('./form-fill-service.cjs');
const {hash,validFormFillSource,validFormFillToken,validFormFillDraft}=require('./form-fill-validation.cjs');
const {parseMailMergeCsv,validateMailMergeRequest,mailMergeDraft}=require('./form-mail-merge-model.cjs');
class FormMailMergeService{
 constructor(options){this.fill=new FormFillService(options);this.session=null;this.preview=null;this.active=null;this.batchState=null;this.disposed=false;}
 source(id,source){if(this.disposed)throw new Error('CSV mail merge has closed.');const bytes=validFormFillSource(id,source),sha=hash(bytes);bytes.fill(0);return sha;}
 bound(id,source){const sha=this.source(id,source);if(!this.session||this.session.sourceId!==id||this.session.sourceSha256!==sha)throw new Error('Import CSV for this exact opened PDF again.');return this.session;}
 begin(sourceId,token,action){validFormFillToken(token);if(this.disposed||this.active)throw new Error('Finish or cancel the active CSV mail-merge operation first.');const job={sourceId,token,canceled:false,promise:null};this.active=job;job.promise=(async()=>{try{return await action(job);}finally{if(this.active===job)this.active=null;}})();return job.promise;}
 async loadCsv(id,source,token,name,bytes){
  validFormFillToken(token);const sourceSha256=this.source(id,source);if(typeof name!=='string'||!name||name.length>255||/[\\/\x00-\x1f\u202a-\u202e\u2066-\u2069]/.test(name))throw new Error('Use the native selected CSV filename.');
  const parsed=parseMailMergeCsv(bytes),csvSha256=hash(bytes);
  return this.begin(id,token,async job=>{this.preview=null;this.session=null;this.batchState=null;this.fill.clearVerified();const info=await this.fill.inspect(id,source,token);if(job.canceled)throw new Error('CSV import canceled.');this.session={token,sourceId:id,sourceSha256,csvSha256,name,...parsed,info};return {token,sourceSha256,csvSha256,name,headers:[...parsed.headers],rows:structuredClone(parsed.rows),fields:structuredClone(info.fields),pageCount:info.pageCount};});
 }
 async previewRow(id,source,token,request){
  const session=this.bound(id,source),review=validateMailMergeRequest(request,session,session.info);
  return this.begin(id,token,async job=>{
   this.preview=null;this.fill.clearVerified();const queue=review.rows.filter(row=>row.selected).map(row=>{try{const draft=validFormFillDraft(mailMergeDraft(row,review.mappings,session.info),session.info);return {id:row.id,filename:row.filename,draft,error:null};}catch(error){return {id:row.id,filename:row.filename,draft:null,error:error.message};}});
   const row=queue.find(row=>row.id===review.previewRow);if(row.error)throw new Error('Preview row '+row.id+': '+row.error);
   const output=await this.fill.build(id,source,token,row.draft);if(job.canceled)throw new Error('CSV preview canceled.');this.bound(id,source);
   this.preview={sourceId:id,token,csvToken:session.token,sourceSha256:session.sourceSha256,csvSha256:session.csvSha256,reviewSha256:hash(Buffer.from(JSON.stringify(review))),queue,previewRow:row.id,previewSha256:output.report.sha256};
   return {...output,queue:{count:queue.length,rows:queue.map(({id,filename,error})=>({id,filename,error})),previewRow:row.id,reviewSha256:this.preview.reviewSha256,csvSha256:session.csvSha256}};
  });
 }
 // Alias matches the renderer/native IPC API and keeps the stored preview private.
 async buildPreview(id,source,token,request){return this.previewRow(id,source,token,request);}
 async batch(id,source,token,approval,saveRow){
  const session=this.bound(id,source),review=this.preview;
  if(!approval||Object.getPrototypeOf(approval)!==Object.prototype||Object.keys(approval).sort().join(',')!=='approved,previewToken'||approval.approved!==true||!review||approval.previewToken!==review.token||review.sourceId!==id||review.sourceSha256!==session.sourceSha256||review.csvToken!==session.token||review.csvSha256!==session.csvSha256||typeof saveRow!=='function')throw new Error('Build and review an actual row, then approve that exact CSV queue before saving.');
  return this.begin(id,token,async job=>{
   this.preview=null;this.fill.clearVerified();const state={token,running:true,canceled:false,total:review.queue.length,completed:0,results:review.queue.map(row=>({rowId:row.id,filename:row.filename,status:'pending'})),reviewSha256:review.reviewSha256,sourceSha256:review.sourceSha256,csvSha256:review.csvSha256};this.batchState={sourceId:id,state};
   try{for(const row of review.queue){
    const result=state.results.find(value=>value.rowId===row.id);if(job.canceled)break;
    if(row.error){result.status='error';result.error=row.error;state.completed++;continue;}
    result.status='building';let output;
    try{
     this.bound(id,source);const rowToken=randomUUID();output=await this.fill.build(id,source,rowToken,row.draft);if(job.canceled){result.status='canceled';break;}this.bound(id,source);
     // Only independently reopened source-bound bytes reach the native exclusive saver.
     const checked=this.fill.output(id,source,rowToken);try{result.status='saving';const receipt=await saveRow(checked,{rowId:row.id,filename:row.filename});if(!receipt||typeof receipt.name!=='string'||!receipt.name)throw new Error('The native saver did not return a completed save receipt.');result.status='saved';result.receipt={...structuredClone(receipt),sha256:checked.report.sha256,outputBytes:checked.bytes.length};}finally{checked.bytes.fill(0);}
    }catch(error){if(job.canceled){result.status='canceled';break;}result.status='error';result.error=error.message;if(this.fill.engine.active?.unsafe||this.fill.engine.cleanupFailure||this.fill.disposed)throw error;}
    finally{output?.bytes?.fill(0);this.fill.clearVerified();}
    state.completed++;
   }}catch(error){state.error=error.message;throw error;}finally{state.running=false;state.canceled=job.canceled;for(const result of state.results)if(result.status==='pending'||result.status==='building')result.status=job.canceled?'canceled':'not-run';}
   return structuredClone(state);
  });
 }
 progress(id,token){validFormFillToken(token);if(this.batchState?.sourceId!==id||this.batchState.state.token!==token)return null;return structuredClone(this.batchState.state);}
 async cancel(id,token){if(token)validFormFillToken(token);const job=this.active;if(job?.sourceId!==id||token&&job.token!==token)return false;job.canceled=true;this.preview=null;await this.fill.cancel(id,this.fill.active?.token);await job.promise.catch(()=>{});if(this.fill.engine.active?.unsafe||this.fill.engine.cleanupFailure)throw new Error('Mail-merge containment cleanup is unresolved. Keep this workspace open.');return true;}
 async discard(id,token){if(token)validFormFillToken(token);await this.cancel(id,token);if(this.preview?.sourceId===id&&(!token||this.preview.token===token))this.preview=null;if(this.session?.sourceId===id&&(!token||this.session.token===token)){this.session=null;this.preview=null;this.batchState=null;this.fill.inspection=null;}this.fill.clearVerified(id);return true;}
 async dispose(){this.disposed=true;if(this.active){this.active.canceled=true;await this.fill.cancel(this.active.sourceId,this.fill.active?.token);await this.active?.promise?.catch(()=>{});}this.session=null;this.preview=null;this.batchState=null;await this.fill.dispose();}
 async status(){return {...await this.fill.status(),family:'CSV mail merge',active:!!this.active};}
}
module.exports={FormMailMergeService};
