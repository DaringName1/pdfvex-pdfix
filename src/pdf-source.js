import {PDFDataRangeTransport} from 'pdfjs-dist';

export const PDF_RANGE_CHUNK_SIZE=262144;
export const LARGE_PDF_TOOL_MESSAGE='This tool requires the complete PDF source and is available only for PDFs up to 100 MiB. Large-PDF reading supports page navigation, available text selection and page notes; document-wide features depend on the reading mode.';
const MiB=1024*1024,MAX_SOURCE_BYTES=1024*MiB,MAX_IPC_BYTES=MiB,MAX_CONCURRENT_READS=4;
const yieldToReader=()=>new Promise(resolve=>setTimeout(resolve,0));

export function isRangePdfSource(file){return !!file?.rangeSource;}
export function pdfSourceCapabilities(file){const rangeLoading=isRangePdfSource(file);return {rangeLoading,pagedReading:!!file?.pagedSource,wholeFileTools:!rangeLoading&&!file?.largeFile&&!file?.pagedSource};}

// PDF.js 6 consumes one complete buffer for each requestDataRange(begin,end).
// Delivering individual IPC chunks with onDataRange would finish its range
// reader prematurely. Assemble only the requested range, then deliver at begin.
class NativePdfRangeTransport extends PDFDataRangeTransport {
  constructor(file,{readRange,onError}){
    const length=file.rangeSource.length;
    if(!file.id||!Number.isSafeInteger(length)||length<=0||length>MAX_SOURCE_BYTES||file.size!==length||file.rangeSource.chunkSize!==PDF_RANGE_CHUNK_SIZE)throw new Error('The large PDF source descriptor is invalid. Reopen the PDF.');
    if(typeof readRange!=='function')throw new Error('Large PDF range reading is unavailable. Reopen the PDF in the desktop app.');
    super(length,new Uint8Array(0),true);
    // Bound distinct queued metadata, not repeated reader requests. Normal
    // PDF.js requests cover chunk-aligned spans; duplicates use a count only.
    this.maxQueuedRanges=4*Math.ceil(length/PDF_RANGE_CHUNK_SIZE);
    const assemblyMiB=file.readingProfile?.rangeAssemblyMiB,cacheMiB=file.readingProfile?.rangeCacheMiB;
    this.maxRangeBytes=([64,128,256].includes(assemblyMiB)?assemblyMiB:64)*MiB;
    this.maxCacheBytes=([2,4,8].includes(cacheMiB)?cacheMiB:4)*MiB;
    this.cache=[];this.cacheBytes=0;this.lastByBegin=new Map();
    const concurrentReads=file.readingProfile?.concurrentReads;
    this.concurrentReads=Number.isInteger(concurrentReads)&&concurrentReads>=1&&concurrentReads<=MAX_CONCURRENT_READS?concurrentReads:MAX_CONCURRENT_READS;
    this.sourceID=file.id;this.readRange=readRange;this.onError=onError;this.queue=[];this.active=false;this.aborted=false;this.generation=0;
  }
  requestDataRange(begin,end){
    if(this.aborted)return;
    if(!Number.isSafeInteger(begin)||!Number.isSafeInteger(end)||begin<0||end<=begin||end>this.length){this.fail(new Error('The PDF reader requested an invalid source range.'));return;}
    if(end-begin>this.maxRangeBytes){this.fail(new Error(`This PDF needs one complete ${Math.ceil((end-begin)/MiB)} MiB source range, exceeding this session's ${this.maxRangeBytes/MiB} MiB assembly budget. Split oversized page resources or reopen with more available memory.`));return;}
    const previous=this.lastByBegin.get(begin);
    if(previous?.end===end){previous.count++;return;}
    if(this.queue.length>=this.maxQueuedRanges){this.fail(new Error('The PDF reader requested too many distinct queued source ranges. Reopen the PDF.'));return;}
    const request={begin,end,count:1};
    this.queue.push(request);this.lastByBegin.set(begin,request);
    if(!this.active)void this.drain();
  }
  takeBatch(){
    const first=this.queue.shift(),batch={begin:first.begin,end:first.end,requests:[first]};
    if(first.end-first.begin>MAX_IPC_BYTES)return batch;
    const remaining=[],blockedBegins=new Set();
    for(const request of this.queue){
      const begin=Math.min(batch.begin,request.begin),end=Math.max(batch.end,request.end);
      // Merge only touching small requests, never gaps. Keep
      // every original reader and preserve arrival order for a shared begin:
      // PDF.js routes its complete response by begin alone, not by range ID.
      if(!blockedBegins.has(request.begin)&&request.begin<=batch.end&&request.end>=batch.begin&&end-begin<=MAX_IPC_BYTES){
        batch.begin=begin;batch.end=end;batch.requests.push(request);
      }else{remaining.push(request);blockedBegins.add(request.begin);}
    }
    this.queue=remaining;
    return batch;
  }
  includeCoveredRequests(batch){
    const remaining=[],blockedBegins=new Set();
    for(const request of this.queue){
      if(!blockedBegins.has(request.begin)&&request.begin>=batch.begin&&request.end<=batch.end){batch.requests.push(request);}
      else{remaining.push(request);blockedBegins.add(request.begin);}
    }
    this.queue=remaining;
  }
  cachedRange(begin,end){
    const index=this.cache.findIndex(entry=>entry.begin<=begin&&entry.end>=end);
    if(index<0)return null;
    const [entry]=this.cache.splice(index,1);this.cache.push(entry);
    return entry.bytes.subarray(begin-entry.begin,end-entry.begin);
  }
  rememberRange(begin,end,bytes){
    // Never retain a transferable response buffer. Only small IPC chunks are
    // copied into this LRU; PDF.js owns assembled/delivered buffers separately.
    const copy=bytes.slice();
    while(this.cache.length>=32||this.cacheBytes+copy.byteLength>this.maxCacheBytes){this.cacheBytes-=this.cache.shift().bytes.byteLength;}
    this.cache.push({begin,end,bytes:copy});this.cacheBytes+=copy.byteLength;
  }
  async drain(){
    this.active=true;
    const generation=this.generation;
    try{
      // Backpressure: only this batch allocates bytes or starts native reads.
      // One original range uses the session assembly budget; small merged
      // ranges use <=1 MiB. Recently read IPC chunks have a separate bounded LRU.
      // There are at most four 1 MiB native responses in flight. PDF.js owns
      // delivered buffers and its own source/decoded caches separately.
      while(!this.aborted&&generation===this.generation&&this.queue.length){
        const batch=this.takeBatch(),{begin,end}=batch,bytes=new Uint8Array(end-begin);
        // Removed entries remain eligible for duplicates until delivery. A
        // later range with the same begin replaces them to preserve routing.
        let offset=begin;
        const read=async()=>{
          while(!this.aborted&&generation===this.generation&&offset<end){
            const start=offset,stop=Math.min(end,start+MAX_IPC_BYTES);offset=stop;
            const cached=this.cachedRange(start,stop);
            const chunk=cached||await this.readRange(this.sourceID,start,stop);
            if(this.aborted||generation!==this.generation)return;
            if(!(chunk instanceof Uint8Array)||chunk.byteLength!==stop-start)throw new Error('The PDF source returned an incomplete range. Reopen the PDF.');
            bytes.set(chunk,start-begin);
            if(!cached)this.rememberRange(start,stop,chunk);
            await yieldToReader();
          }
        };
        await Promise.all(Array.from({length:Math.min(this.concurrentReads,Math.ceil(bytes.length/MAX_IPC_BYTES))},read));
        if(this.aborted||generation!==this.generation)return;
        // Requests arriving while the batch was being read can reuse its
        // bytes. Slices give each reader an exact independent transferable
        // buffer; a single original range keeps its direct response buffer.
        this.includeCoveredRequests(batch);
        let delivered=0;
        for(const request of batch.requests){
          if(this.aborted||generation!==this.generation)return;
          // Delete before callbacks so reentrant/new requests are queued. Each
          // duplicate is still a distinct PDF.js reader needing its own buffer.
          if(this.lastByBegin.get(request.begin)===request)this.lastByBegin.delete(request.begin);
          for(let i=0;i<request.count;i++){
            if(this.aborted||generation!==this.generation)return;
            const response=batch.requests.length===1&&request.count===1?bytes:bytes.slice(request.begin-begin,request.end-begin);
            const responseLength=response.byteLength;
            this.onDataRange(request.begin,response);
            if(++delivered%8===0||responseLength>MAX_IPC_BYTES)await yieldToReader();
          }
        }
        await yieldToReader();
      }
    }catch(error){if(!this.aborted&&generation===this.generation)this.fail(error);}
    finally{this.active=false;}
  }
  fail(error){
    if(this.aborted)return;
    this.abort();
    // Native promise failures never escape requestDataRange's fire-and-forget
    // contract. The reader destroys its loading task to reject PDF.js waiters.
    try{Promise.resolve(this.onError?.(error instanceof Error?error:new Error(String(error)))).catch(()=>{});}catch{}
  }
  abort(){this.aborted=true;this.generation++;this.queue.length=0;this.lastByBegin.clear();this.cache.length=0;this.cacheBytes=0;}
}

export function createPdfSource(file,{readRange,onError}={}){
  if(!isRangePdfSource(file))return {documentOptions:{data:new Uint8Array(file.bytes)},abort(){}};
  const range=new NativePdfRangeTransport(file,{readRange,onError});
  return {documentOptions:{range,length:range.length,rangeChunkSize:PDF_RANGE_CHUNK_SIZE,disableAutoFetch:true,disableStream:true},abort:()=>range.abort()};
}
