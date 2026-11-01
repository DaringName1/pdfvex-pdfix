'use strict';
const {parentPort,workerData}=require('node:worker_threads');
const DecodeStream=require('pdf-lib/cjs/core/streams/DecodeStream.js').default;
const originalEnsure=DecodeStream.prototype.ensureBuffer;let capacity=0;
DecodeStream.prototype.ensureBuffer=function(size){if(size>16*1024*1024)throw new Error('A compressed object stream exceeds 16 MB.');const result=originalEnsure.call(this,size),length=this.buffer?.length||0;capacity+=Math.max(0,length-(this.pdfixBookmarkCapacity||0));this.pdfixBookmarkCapacity=length;if(capacity>64*1024*1024)throw new Error('Compressed object streams exceed the 64 MB bookmark parsing budget.');return result;};
const {inspect,write}=require('./pdf-bookmark-codec.cjs');
(async()=>{try{const result=workerData.action==='inspect'?await inspect(workerData.bytes):workerData.action==='write'?await write(workerData.bytes,workerData.selection):(()=>{throw new Error('Unsupported bookmark operation.');})();parentPort.postMessage({ok:true,result});}catch(error){parentPort.postMessage({ok:false,message:String(error.message||'Bookmark editing failed.').replace(/[\x00-\x1f]/g,' ').slice(0,600)});}})();
