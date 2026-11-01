const {test}=require('node:test'),assert=require('node:assert/strict');
const operation=import('../src/pdf-image-operation.js');
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('canceled image work never dispatches a queued decoder',async()=>{
 const {PdfImageOperation}=await operation;let dispatched=0,canceled=0;const job=new PdfImageOperation({onCancel:()=>canceled++});job.cancel();job.cancel();
 await assert.rejects(job.wait(()=>{dispatched++;}),error=>error.code==='IMAGE_CANCELED');assert.equal(dispatched,0);assert.equal(canceled,1);
});
test('cancel promptly settles pending work and releases a late image bitmap once',async()=>{
 const {PdfImageOperation}=await operation,decoder=deferred(),job=new PdfImageOperation();let closed=0;
 const pending=job.wait(()=>decoder.promise,{discard:bitmap=>bitmap.close()});await tick();job.cancel();await assert.rejects(pending,error=>error.code==='IMAGE_CANCELED');
 decoder.resolve({close(){closed++;}});await tick();assert.equal(closed,1);
});
test('source changes cancel a hung image request without adopting its result',async()=>{
 const {PdfImageOperation}=await operation;let current=true,canceled=0;const worker=deferred(),job=new PdfImageOperation({current:()=>current,onCancel:()=>canceled++});
 const pending=job.wait(()=>worker.promise);await tick();current=false;
 await assert.rejects(pending,error=>error.code==='IMAGE_SOURCE_CHANGED');assert.equal(canceled,1);worker.reject(new Error('Late discarded worker error'));await tick();
});
test('image deadline stops waiting and consumes a late encoder failure',async()=>{
 const {PdfImageOperation}=await operation,encoder=deferred(),job=new PdfImageOperation({timeoutMs:15});
 const pending=job.wait(()=>encoder.promise);await assert.rejects(pending,error=>error.code==='IMAGE_TIMEOUT');encoder.reject(new Error('Late encoder failure'));await tick();
});
test('successful image work removes abort listeners and preserves worker errors',async()=>{
 const {PdfImageOperation}=await operation,job=new PdfImageOperation();let listeners=0;
 const signal=job.controller.signal,add=signal.addEventListener.bind(signal),remove=signal.removeEventListener.bind(signal);
 signal.addEventListener=(...args)=>{listeners++;return add(...args);};signal.removeEventListener=(...args)=>{listeners--;return remove(...args);};
 try{assert.equal(await job.wait(()=>42),42);assert.equal(listeners,0);await assert.rejects(job.wait(()=>{throw new Error('Unreadable image');}),/Unreadable image/);assert.equal(listeners,0);}finally{job.dispose();}
});
test('replacement work remains independent of a stopped previous operation',async()=>{
 const {PdfImageOperation}=await operation,oldWorker=deferred(),oldJob=new PdfImageOperation(),newJob=new PdfImageOperation();
 try{const pending=oldJob.wait(()=>oldWorker.promise);await tick();oldJob.cancel();await assert.rejects(pending);assert.equal(await newJob.wait(()=>99),99);oldWorker.resolve(1);await tick();assert.equal(await newJob.wait(()=>100),100);}finally{oldJob.dispose();newJob.dispose();}
 for(const timeoutMs of [0,Infinity,120001])assert.throws(()=>new PdfImageOperation({timeoutMs}),/limits/);
});
