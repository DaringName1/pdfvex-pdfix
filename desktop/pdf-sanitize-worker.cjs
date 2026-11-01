const {parentPort,workerData}=require('node:worker_threads');
const DecodeStream=require('pdf-lib/cjs/core/streams/DecodeStream.js').default;
const originalEnsure=DecodeStream.prototype.ensureBuffer;let decodedCapacity=0;
DecodeStream.prototype.ensureBuffer=function(size){if(size>16*1024*1024)throw new Error('A compressed object stream exceeds 16 MB.');const result=originalEnsure.call(this,size),capacity=this.buffer?.length||0;decodedCapacity+=Math.max(0,capacity-(this.pdfixCountedCapacity||0));this.pdfixCountedCapacity=capacity;if(decodedCapacity>64*1024*1024)throw new Error('Compressed object streams exceed the 64 MB decoding budget.');return result;};
const {inspect,sanitize}=require('./pdf-sanitize-codec.cjs');
(async()=>{try{const result=workerData.action==='inspect'?await inspect(workerData.bytes):workerData.action==='sanitize'?await sanitize(workerData.bytes,workerData.selection):(()=>{throw new Error('Unknown cleanup operation.');})();parentPort.postMessage({ok:true,result});}catch(error){parentPort.postMessage({ok:false,message:String(error.message||'PDF cleanup failed.').replace(/[\x00-\x1f]/g,' ').slice(0,600)});}})();
