const {parentPort,workerData}=require('node:worker_threads');
const {inspect,verify}=require('./compression-inspect.cjs');
(async()=>{try{const result=workerData.output?await verify(workerData.source,workerData.output,workerData.lossy,workerData.passwordDeclaration):await inspect(workerData.source,workerData.lossy,workerData.passwordDeclaration);parentPort.postMessage({ok:true,result});}catch(error){parentPort.postMessage({ok:false,message:error.message});}})();
