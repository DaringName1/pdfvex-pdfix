const {parentPort,workerData}=require('node:worker_threads');
const DecodeStream=require('pdf-lib/cjs/core/streams/DecodeStream.js').default;
const ensure=DecodeStream.prototype.ensureBuffer;let capacity=0;
DecodeStream.prototype.ensureBuffer=function(size){
 if(!Number.isSafeInteger(size)||size<0||size>16*1024*1024)throw new Error('An XFDF source object stream exceeds 16 MB.');
 const result=ensure.call(this,size),length=this.buffer?.length||0;
 if(length>16*1024*1024)throw new Error('An XFDF source object stream exceeds its allocation limit.');
 capacity+=Math.max(0,length-(this.pdfixXfdfCapacity||0));this.pdfixXfdfCapacity=length;
 if(capacity>64*1024*1024)throw new Error('XFDF source parsing exceeds its aggregate 64 MB decoding budget.');return result;
};
const {writeXfdf}=require('./pdf-xfdf-codec.cjs');
(async()=>{try{const result=await writeXfdf(workerData.bytes,workerData.draft);parentPort.postMessage({ok:true,result},[result.bytes.buffer]);}catch(error){parentPort.postMessage({ok:false,message:String(error.message||'XFDF export failed.').replace(/[\x00-\x1f]/g,' ').slice(0,700)});}})();
