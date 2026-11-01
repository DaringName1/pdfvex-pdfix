const failure=(message,code)=>Object.assign(new Error(message),{code});

// A pending encoder/worker may finish after cancellation. Its result is ignored,
// and resource results (such as ImageBitmap) are explicitly discarded.
export class PdfImageOperation{
 constructor({current=()=>true,timeoutMs=120000,onCancel=()=>{}}={}){
  if(typeof current!=='function'||typeof onCancel!=='function'||!Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>120000)throw new Error('Image export operation limits are invalid.');
  this.current=current;this.onCancel=onCancel;this.controller=new AbortController();
  this.timer=setTimeout(()=>this.cancel(failure('Image export exceeded two minutes. Choose fewer pages or a lower resolution.','IMAGE_TIMEOUT')),timeoutMs);
 }
 check(){if(!this.controller.signal.aborted&&!this.current())this.cancel(failure('The PDF source changed. Build image previews again.','IMAGE_SOURCE_CHANGED'));if(this.controller.signal.aborted)throw this.controller.signal.reason;}
 cancel(reason=failure('Image export canceled. No copies were saved.','IMAGE_CANCELED')){if(this.controller.signal.aborted)return;clearTimeout(this.timer);this.controller.abort(reason);this.onCancel();}
 wait(work,{discard=()=>{}}={}){
  return new Promise((resolve,reject)=>{
   let settled=false,poll;
   const signal=this.controller.signal,finish=(error,value)=>{if(settled)return;settled=true;clearInterval(poll);signal.removeEventListener('abort',abort);error?reject(error):resolve(value);},abort=()=>finish(signal.reason);
   try{this.check();}catch(error){finish(error);return;}
   signal.addEventListener('abort',abort,{once:true});
   poll=setInterval(()=>{try{this.check();}catch(error){finish(error);}},25);
   Promise.resolve().then(()=>{this.check();return work();}).then(value=>{
    try{this.check();}catch(error){discard(value);finish(error);return;}
    if(settled){discard(value);return;}finish(null,value);
   },error=>finish(error)).catch(error=>finish(error));
  });
 }
 dispose(){this.cancel();}
}
