const {parentPort,workerData}=require('node:worker_threads');
const DecodeStream=require('pdf-lib/cjs/core/streams/DecodeStream.js').default;
const ensure=DecodeStream.prototype.ensureBuffer;let capacityTotal=0;
DecodeStream.prototype.ensureBuffer=function(size){
 if(!Number.isSafeInteger(size)||size<0||size>16*1024*1024)throw new Error('A compressed review object stream exceeds 16 MB.');
 const result=ensure.call(this,size),capacity=this.buffer?.length||0;
 if(capacity>16*1024*1024)throw new Error('A compressed review object stream exceeds its 16 MB allocation limit.');
 capacityTotal+=Math.max(0,capacity-(this.pdfixCapacity||0));this.pdfixCapacity=capacity;
 if(capacityTotal>64*1024*1024)throw new Error('Compressed PDF review structures exceed the 64 MB decoding budget.');
 return result;
};
const {inspectReview}=require('./pdf-review-codec.cjs');
(async()=>{try{parentPort.postMessage({ok:true,result:await inspectReview(workerData.bytes,workerData.pages)});}catch(error){parentPort.postMessage({ok:false,message:String(error.message||'Review inventory failed.').replace(/[\x00-\x1f]/g,' ').slice(0,700)});}})();
