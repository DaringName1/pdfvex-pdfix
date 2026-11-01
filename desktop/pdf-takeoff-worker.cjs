const {parentPort,workerData}=require('node:worker_threads');
const DecodeStream=require('pdf-lib/cjs/core/streams/DecodeStream.js').default;
const ensure=DecodeStream.prototype.ensureBuffer;let capacity=0;
DecodeStream.prototype.ensureBuffer=function(size){
 if(!Number.isSafeInteger(size)||size<0||size>16*1024*1024)throw new Error('A takeoff object stream exceeds 16 MB.');
 const result=ensure.call(this,size),length=this.buffer?.length||0;
 if(length>16*1024*1024)throw new Error('A takeoff object stream exceeds its allocation limit.');
 capacity+=Math.max(0,length-(this.pdfixTakeoffCapacity||0));this.pdfixTakeoffCapacity=length;
 if(capacity>64*1024*1024)throw new Error('Takeoff writing exceeds its aggregate 64 MB compressed-object decoding budget.');return result;
};
const {writeTakeoffs}=require('./pdf-takeoff-codec.cjs');
(async()=>{try{const result=await writeTakeoffs(workerData.bytes,workerData.draft);parentPort.postMessage({ok:true,result},[result.bytes.buffer]);}catch(error){parentPort.postMessage({ok:false,message:String(error.message||'Takeoff writing failed.').replace(/[\x00-\x1f]/g,' ').slice(0,700)});}})();
