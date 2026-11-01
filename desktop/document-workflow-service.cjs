'use strict';
const {hash,validToken}=require('./pdf-page-order-validation.cjs');
const {PdfPageOrderService}=require('./pdf-page-order-service.cjs');
const {PdfDecorationService}=require('./pdf-decoration-service.cjs');
const {validWorkflowSteps,validWorkflowSource}=require('./document-workflow-validation.cjs');

class DocumentWorkflowService{
 constructor(options){this.options=options;this.operation=null;this.active=null;this.verified=null;this.generation=0;this.disposed=false;}
 clear(){if(this.verified?.bytes)this.verified.bytes.fill(0);this.verified=null;}
 assertSource(id,source){validWorkflowSource(id,source);const actual=hash(source.bytes);if(actual!==source.fingerprint)throw new Error('The selected original PDF changed. Reopen it before building the workflow.');return actual;}
 build(id,source,token,value){
  if(this.disposed)throw new Error('The workflow service is closed.');
  if(this.operation)throw new Error('Finish or cancel the current workflow first.');
  validToken(token);const steps=validWorkflowSteps(value),originalSha256=this.assertSource(id,source);
  this.clear();const generation=++this.generation,operation={id,token,promise:null};this.operation=operation;
  const work=this._build(id,source,token,steps,originalSha256,generation);
  operation.promise=work.finally(()=>{if(this.operation===operation&&!this.disposed)this.operation=null;});
  return operation.promise;
 }
 async _build(id,source,token,steps,originalSha256,generation){
  let current=Buffer.from(source.bytes);const receipts=[];
  try{
   for(let index=0;index<steps.length;index++){
    if(generation!==this.generation||this.disposed)throw new Error('Workflow cancelled. No copy was saved.');
    const step=steps[index],before=hash(current),stageSource={ext:'pdf',fingerprint:before,bytes:current};
    const service=step.kind==='reorder'?new PdfPageOrderService(this.options):new PdfDecorationService(this.options);
    this.active={service,id,token};let result;
    try{
     if(step.kind==='reorder'){
      const inspected=await service.inspect(id,stageSource);
      if(generation!==this.generation)throw new Error('Workflow cancelled. No copy was saved.');
      if(inspected.pageCount!==step.order.length)throw new Error('The reorder step must list every current physical page exactly once.');
      result=await service.build(id,stageSource,token,{inspectionSha256:inspected.inspectionSha256,order:step.order});
     }else result=await service.build(id,stageSource,token,step.draft);
     if(generation!==this.generation)throw new Error('Workflow cancelled. No copy was saved.');
     if(result.report.sourceSha256!==before||result.report.sha256!==hash(result.bytes))throw new Error('The workflow stage receipt did not match its exact input and output.');
     const next=Buffer.from(result.bytes);
     receipts.push({step:index+1,kind:step.kind,inputSha256:before,outputSha256:hash(next),report:structuredClone(result.report)});
     current.fill(0);current=next;
    }finally{
     if(result?.bytes)result.bytes.fill(0);
     if(service.verified?.bytes)service.verified.bytes.fill(0);
     try{await service.dispose();}
     catch(error){this.disposed=true;throw error;}
     if(this.active?.service===service)this.active=null;
    }
   }
   if(generation!==this.generation||this.disposed)throw new Error('Workflow cancelled. No copy was saved.');
   if(this.assertSource(id,source)!==originalSha256)throw new Error('The selected original PDF changed during the workflow.');
   const outputSha256=hash(current),receiptSha256=hash(Buffer.from(JSON.stringify(receipts)));
   this.verified={id,token,originalSha256,outputSha256,receiptSha256,bytes:current,receipts};current=null;
   return {token,bytes:Uint8Array.from(this.verified.bytes),originalSha256,outputSha256,receipts:structuredClone(receipts),report:this.report()};
  }finally{current?.fill(0);}
 }
 report(){const value=this.verified;if(!value)return null;return {version:1,sourceSha256:value.originalSha256,sha256:value.outputSha256,stepCount:value.receipts.length,receiptSha256:value.receiptSha256,receipts:structuredClone(value.receipts)};}
 output(id,source,token){
  if(this.disposed)throw new Error('The workflow service is closed.');
  validToken(token);const originalSha256=this.assertSource(id,source),result=this.verified;
  if(!result||result.id!==id||result.token!==token||result.originalSha256!==originalSha256||result.outputSha256!==hash(result.bytes)||result.receiptSha256!==hash(Buffer.from(JSON.stringify(result.receipts))))throw new Error('Build and review this exact-source workflow output again before saving.');
  let previous=originalSha256;
  for(const [index,row] of result.receipts.entries()){
   if(row.step!==index+1||!['reorder','bates'].includes(row.kind)||row.inputSha256!==previous||row.report?.sourceSha256!==previous||row.report?.sha256!==row.outputSha256)throw new Error('The workflow receipt chain changed. Build and review it again.');
   previous=row.outputSha256;
  }
  if(!result.receipts.length||previous!==result.outputSha256)throw new Error('The workflow receipt chain does not match its final output.');
  return {bytes:Buffer.from(result.bytes),sha256:result.outputSha256,receipts:structuredClone(result.receipts),report:this.report()};
 }
 async cancel(id,token){
  if(typeof id!=='string'||!id)return false;
  if(token!==undefined&&token!==null)validToken(token);
  const operation=this.operation;
  if(operation&&operation.id===id&&(!token||operation.token===token)){
   ++this.generation;this.clear();
   const service=this.active?.service;
   if(service){
    try{const observed=await service.cancel(id);if(observed===false&&service.active){this.disposed=true;throw new Error('Workflow containment cancellation was not observed. The service is closed.');}}
    catch(error){this.disposed=true;await operation.promise.catch(()=>{});throw error;}
   }
   try{await operation.promise;}catch(error){if(this.disposed)throw error;}
   return true;
  }
  if(this.verified?.id===id&&(!token||this.verified.token===token)){this.clear();return true;}
  return false;
 }
 async discard(id,token){return this.cancel(id,token);}
 async dispose(){
  this.disposed=true;++this.generation;this.clear();
  const operation=this.operation,service=this.active?.service;
  if(service)await service.cancel(this.active.id).catch(()=>{});
  await operation?.promise.catch(()=>{});
  if(this.active)throw new Error('Workflow containment did not finish cleanup. The service remains closed.');
 }
 async status(){return {family:'Editable document workflows',closed:this.disposed,active:!!this.operation,verified:!!this.verified,steps:['reorder','bates']};}
}
module.exports={DocumentWorkflowService};
