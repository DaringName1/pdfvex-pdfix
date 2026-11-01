import {LARGE_PDF_TOOL_MESSAGE} from './pdf-source.js';
import {extractedPageSearchText} from './pdf-search-paged.js';

export const PAGED_PDF_UNAVAILABLE='Unavailable during on-demand page reading. Open a smaller PDF to use document-wide features.';
const canceled=()=>Object.assign(new Error('Page request canceled.'),{name:'RenderingCancelledException'});

// Every worker receives only an independently extracted page, never the source PDF.
export async function openPagedPdfDocument(file,pdfjs,options,api=window.pdfix){
  const metadata=await api.openPagedPdf(file.id);
  if(!metadata||!Number.isSafeInteger(metadata.pageCount)||metadata.pageCount<1||metadata.mode!=='paged'||metadata.encrypted!==false||metadata.permissions!==null||!/^[a-f0-9]{64}$/.test(metadata.sourceSha256)||file.sourceSha256&&metadata.sourceSha256!==file.sourceSha256){
    await api.releasePagedPdf(file.id).catch(()=>{});throw new Error('Invalid or unsupported on-demand PDF source metadata.');
  }
  let closed=false,generation=0,active=null,loadingTask=null,destroyPromise=null,tail=Promise.resolve(),searchAbort=null;
  const pages=new Map(),pending=new Map();
  const trim=async(keep)=>{
    for(const [number,entry] of pages){
      if(number===keep)continue;
      if(entry.page.cleanup()){pages.delete(number);await entry.task.destroy();}
    }
  };
  const doc={
    numPages:metadata.pageCount,mode:'paged',sourceSha256:metadata.sourceSha256,
    getPermissions:async()=>metadata.permissions,
    nativeLinkReadingAvailable:!!metadata.navigation,pageLabelsAvailable:Array.isArray(metadata.navigation?.labels),navigationAvailable:!!metadata.navigation,navigationTruncated:!!metadata.navigation?.truncated,
    getOutline:async()=>metadata.navigation?.outline.map(function item(row){return {...row,dest:row.dest?.map((v,i)=>i===1?{name:v}:v)??null,items:row.items.map(item)};})??null,getPageLabels:async()=>metadata.navigation?.labels??null,
    getMetadata:async()=>({info:{PDFFormatVersion:'',Title:file.name||'',PagedSource:true,SourceSHA256:metadata.sourceSha256},metadata:null,contentDispositionFilename:file.name||null,contentLength:file.size||null}),
    getData:async()=>{throw new Error(LARGE_PDF_TOOL_MESSAGE);},
    getDestination:async()=>{throw new Error(PAGED_PDF_UNAVAILABLE);},
    getPageIndex:async()=>{throw new Error(PAGED_PDF_UNAVAILABLE);},
    getOptionalContentConfig:async()=>{throw new Error(PAGED_PDF_UNAVAILABLE);},
    async getPage(number){
      if(closed)throw canceled();
      if(!Number.isInteger(number)||number<1||number>doc.numPages)throw new Error('Page number is outside this PDF.');
      searchAbort?.abort();
      if(pages.has(number)){if(pending.size){generation++;if(active)void api.cancelPagedPdf(file.id,active).catch(()=>{});}return pages.get(number).proxy;}
      const existing=pending.get(number);
      if(existing?.generation===generation)return existing.request;
      const requestGeneration=++generation;
      if(active)void api.cancelPagedPdf(file.id,active).catch(()=>{});
      if(pending.size>=2){
        // Supersede old work, but retain the newest navigation intent. Waiting
        // here does not add another native request or page worker to the queue.
        await tail.catch(()=>{});
        if(closed||requestGeneration!==generation)throw canceled();
        return doc.getPage(number);
      }
      const request=tail.catch(()=>{}).then(async()=>{
        if(closed||requestGeneration!==generation)throw canceled();
        await trim(number);
        if(closed||requestGeneration!==generation)throw canceled();
        // Never accumulate workers while an earlier page is still rendering.
        if(pages.size>=2)throw new Error('The previous page is still in use. Try navigating again when rendering finishes.');
        const token=crypto.randomUUID();active=token;let task;doc.onPageLoading?.(number,true);
        try{
          const result=await api.readPagedPdf(file.id,number,token);
          if(closed||requestGeneration!==generation)throw canceled();
          if(!result||result.page!==number||result.sourceSha256!==metadata.sourceSha256||result.pageCount!==doc.numPages)throw new Error('The on-demand PDF source changed. Reopen the file.');
          if(!(result.bytes instanceof Uint8Array)||!result.bytes.byteLength||result.bytes.byteLength>32*1024*1024||!/^[a-f0-9]{64}$/.test(result.sha256))throw new Error('The extracted PDF page exceeded its bounded data contract.');
          const bytes=result.bytes;
          const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(value=>value.toString(16).padStart(2,'0')).join('');
          if(digest!==result.sha256)throw new Error('The extracted PDF page failed its integrity check.');
          if(closed||requestGeneration!==generation)throw canceled();
          task=pdfjs.getDocument({...options,data:bytes});loadingTask=task;
          const onePage=await task.promise;
          if(closed||requestGeneration!==generation){await task.destroy();throw canceled();}
          if(onePage.numPages!==1)throw new Error('The extracted PDF did not contain exactly one page.');
          const page=await onePage.getPage(1);
          if(closed||requestGeneration!==generation)throw canceled();
          const proxy=new Proxy(page,{get(target,key){
            if(key==='pageNumber')return number;
            // Extracted references cannot safely resolve to original page destinations.
            if(key==='nativeLinksTruncated')return !!result.pageLinksTruncated;
            if(key==='getAnnotations')return async(args)=>[...(await target.getAnnotations(args)).filter(item=>item.subtype!=='Link'),...(result.pageLinks??[]).map(link=>({...link,annotationType:2,dest:link.dest.map((value,index)=>index===1?{name:value}:value)}))];
            const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
          }});
          pages.set(number,{page,proxy,task});if(loadingTask===task)loadingTask=null;task=null;await trim(number);if(closed||requestGeneration!==generation)throw canceled();return proxy;
        }catch(error){if(closed||requestGeneration!==generation)throw canceled();throw error;}
        finally{if(active===token)active=null;if(loadingTask===task)loadingTask=null;if(task)await task.destroy().catch(()=>{});doc.onPageLoading?.(number,false);}
      });
      pending.set(number,{request,generation:requestGeneration});tail=request;
      try{return await request;}finally{if(pending.get(number)?.request===request)pending.delete(number);}
    },
    async getSearchText(number,{signal}={}){
      if(closed||signal?.aborted)throw canceled();
      if(!Number.isInteger(number)||number<1||number>doc.numPages)throw new Error('Search page is outside this PDF.');
      const requestGeneration=generation,controller=new AbortController();searchAbort=controller;
      const stop=()=>controller.abort();signal?.addEventListener('abort',stop,{once:true});
      const current=()=>!closed&&generation===requestGeneration&&!controller.signal.aborted;
      const request=tail.catch(()=>{}).then(async()=>{
        if(!current())throw canceled();
        const token=crypto.randomUUID();active=token;
        const abort=()=>{void api.cancelPagedPdf(file.id,token).catch(()=>{});};
        controller.signal.addEventListener('abort',abort,{once:true});
        try{
          const result=await api.readPagedPdf(file.id,number,token);
          return await extractedPageSearchText(result,metadata,number,pdfjs,options,{signal:controller.signal,current});
        }finally{controller.signal.removeEventListener('abort',abort);if(active===token)active=null;}
      });
      tail=request;try{return await request;}finally{signal?.removeEventListener('abort',stop);if(searchAbort===controller)searchAbort=null;}
    },
    async cleanup(){await trim(-1);},
    async releaseUnused(current){await trim(current);},
    async cancelCurrent(){generation++;const task=loadingTask;if(task)void task.destroy().catch(()=>{});if(active&&await api.cancelPagedPdf(file.id,active)===false)throw new Error('The native page engine could not confirm termination. Close and reopen the PDF workspace; private staging is retained for safe cleanup.');return true;},
    destroy(){
      if(destroyPromise)return destroyPromise;closed=true;generation++;searchAbort?.abort();
      const task=loadingTask;if(task)void task.destroy().catch(()=>{});
      destroyPromise=(async()=>{
        if(active)await api.cancelPagedPdf(file.id,active).catch(()=>{});
        await tail.catch(()=>{});
        await Promise.allSettled([...pages.values()].map(entry=>entry.task.destroy()));pages.clear();pending.clear();loadingTask=null;
        await api.releasePagedPdf(file.id);
      })();return destroyPromise;
    }
  };
  return doc;
}
