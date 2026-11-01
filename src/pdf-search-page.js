const canceled=()=>Object.assign(new Error('PDF search canceled.'),{code:'CANCELED'});

// Stop waiting without destroying the viewer's shared PDF.js document. A text
// request already dispatched to its worker may finish there; its result is not
// adopted by a canceled, superseded or timed-out search.
export function searchPageContent(doc,pageNumber,{signal,timeoutMs=20_000}={}){
  if(signal?.aborted)return Promise.reject(canceled());
  if(!Number.isInteger(pageNumber)||pageNumber<1||!Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>120_000)return Promise.reject(new Error('PDF search reading limits are invalid.'));
  return new Promise((resolve,reject)=>{
    let settled=false,timer;
    const finish=(error,value)=>{
      if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);
      error?reject(error):resolve(value);
    };
    const abort=()=>finish(canceled());
    signal?.addEventListener('abort',abort,{once:true});
    timer=setTimeout(()=>finish(Object.assign(new Error(`Selectable text on page ${pageNumber} did not finish within ${timeoutMs/1000} seconds. Try a smaller PDF or stop and retry the search.`),{code:'PDF_SEARCH_TIMEOUT'})),timeoutMs);
    Promise.resolve().then(async()=>{
      if(settled||signal?.aborted)throw canceled();
      const page=await doc.getPage(pageNumber);
      if(settled||signal?.aborted)throw canceled();
      return page.getTextContent();
    }).then(value=>finish(null,value),error=>finish(error));
  });
}
