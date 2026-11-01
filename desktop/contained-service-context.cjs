const path=require('node:path'),os=require('node:os');
const {DocumentSandboxService}=require('./document-sandbox-service.cjs');
class ContainedServiceContext{
 constructor(label,key,{runtimeDirectory=path.resolve(__dirname,'../dist/native/document-engine'),stagingDirectory=path.join(os.tmpdir(),'PDFix-contained-'+key)}={}){
  this.label=label;this.options={runtimeDirectory,stagingDirectory};this.engine=new DocumentSandboxService(this.options);this.active=null;this.verified=null;this.generation=0;this.disposed=false;this.retired=false;
 }
 // An engine that closed because a stopped job outlasted its stop wait is replaced once that job's exit was observed and
 // its files cleaned (engine.recovered), so the tool works again without restarting PDFix. A tool closed on purpose
 // (dispose) stays closed.
 // Tools check "disposed" themselves before reaching _runContained, so the replacement happens whenever it is read.
 get disposed(){if(this._disposed&&!this.retired&&this.engine?.recovered){this.engine=new DocumentSandboxService(this.options);this._disposed=false;this.active=null;}return this._disposed;}
 set disposed(value){this._disposed=value;}
 renew(){return this.disposed;}
 async _runContained(sourceId,token,operation,bytes,options,validateResult){
  this.renew();
  if(this.disposed){bytes?.fill(0);throw new Error('The '+this.label+' containment service has closed.');}
  if(this.active){bytes?.fill(0);throw new Error('Finish or cancel the current '+this.label+' job first.');}
  const generation=++this.generation,controller=new AbortController(),job={sourceId,token,generation,controller,promise:null};this.active=job;
  job.promise=this.engine.run(operation,bytes,options,validateResult,{signal:controller.signal});
  let result;try{result=await job.promise;}finally{bytes.fill(0);if(this.engine.closed)this.disposed=true;if(!this.engine.active?.unsafe&&this.active===job)this.active=null;}
  if(this.disposed||generation!==this.generation)throw new Error(this.label+' canceled. No output was saved.');return result;
 }
 async _runContainedSourceFile(sourceId,token,operation,input,options,validateResult){
  this.renew();
  if(this.disposed)throw new Error('The '+this.label+' containment service has closed.');
  if(this.active)throw new Error('Finish or cancel the current '+this.label+' job first.');
  const generation=++this.generation,controller=new AbortController(),job={sourceId,token,generation,controller,promise:null};this.active=job;
  job.promise=this.engine.runSourceFile(operation,input,options,validateResult,{signal:controller.signal});
  let result;try{result=await job.promise;}finally{if(this.engine.closed)this.disposed=true;if(!this.engine.active?.unsafe&&this.active===job)this.active=null;}
  if(this.disposed||generation!==this.generation)throw new Error(this.label+' canceled. No output was saved.');return result;
 }
 async cancel(sourceId,token){
  const job=this.active;if(!job||job.sourceId!==sourceId||token&&job.token!==token)return false;
  this.generation++;job.controller.abort();await this.engine.cancel();return !this.engine.active?.unsafe;
 }
 async discard(sourceId,token){if(this.verified?.sourceId===sourceId&&(!token||this.verified.token===token))this.verified=null;await this.cancel(sourceId,token);return true;}
 async dispose(){this.retired=true;this.disposed=true;this.generation++;this.verified=null;this.active?.controller.abort();await this.engine.dispose();if(this.engine.cleanupFailure||this.engine.active?.unsafe)throw new Error(this.label+' containment termination/cleanup was not observed. This service stays closed.');}
 async status(){return {...await this.engine.status(),family:this.label};}
}
module.exports={ContainedServiceContext};
