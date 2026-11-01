const {parentPort,workerData}=require('node:worker_threads');
const DecodeStream=require('pdf-lib/cjs/core/streams/DecodeStream.js').default,ensure=DecodeStream.prototype.ensureBuffer;let totalCapacity=0;
DecodeStream.prototype.ensureBuffer=function(size){if(size>16*1024*1024)throw new Error('A PDF object stream exceeds 16 MB.');const result=ensure.call(this,size),capacity=this.buffer?.length||0;totalCapacity+=Math.max(0,capacity-(this.pdfixCapacity||0));this.pdfixCapacity=capacity;if(totalCapacity>64*1024*1024)throw new Error('PDF object stream decoding exceeds 64 MB.');return result;};
const {inventory}=require('./pdf-attachment-codec.cjs');
(async()=>{try{const result=await inventory(workerData.bytes,workerData.attachmentId);parentPort.postMessage({ok:true,result});}catch(error){parentPort.postMessage({ok:false,message:String(error.message||'Attachment inventory failed.').replace(/[\x00-\x1f]/g,' ').slice(0,600)});}})();
