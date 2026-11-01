import {pdfSearchText} from './pdf-search-model.js';

const canceled=()=>Object.assign(new Error('Large PDF search stopped.'),{code:'CANCELED'});
// Read exactly one extracted page in a disposable text worker. The source PDF
// never enters this worker and the visible viewer's page/worker is untouched.
export async function extractedPageSearchText(result,metadata,number,pdfjs,options,{signal,current=()=>true}={}){
  const check=()=>{if(signal?.aborted||!current())throw canceled();};
  check();
  if(result?.page!==number||result.pageCount!==metadata.pageCount||result.sourceSha256!==metadata.sourceSha256||!(result.bytes instanceof Uint8Array)||!result.bytes.length||result.bytes.length>32*1024*1024||!/^[a-f0-9]{64}$/.test(result.sha256))throw new Error('The search page failed its bounded source identity check.');
  const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',result.bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
  if(digest!==result.sha256)throw new Error('The extracted search page failed its integrity check.');
  check();let task,timer;
  const abort=()=>{void task?.destroy().catch(()=>{});};
  signal?.addEventListener('abort',abort,{once:true});
  try{
    task=pdfjs.getDocument({...options,data:result.bytes});check();
    const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{abort();reject(new Error('Search text preparation exceeded 20 seconds on this page. Stop or retry with a smaller PDF.'));},20000);});
    return await Promise.race([(async()=>{const doc=await task.promise;check();if(doc.numPages!==1)throw new Error('The extracted search PDF must contain exactly one page.');const page=await doc.getPage(1);check();const content=await page.getTextContent();check();return pdfSearchText(content);})(),timeout]);
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);if(task)await task.destroy();}
}
