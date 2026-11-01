export function pdfJob(input,onProgress=()=>{}){
  const worker=new Worker(new URL('./pdf-job.worker.js',import.meta.url),{type:'module'});
  let rejectJob;
  const timer=setTimeout(()=>{worker.terminate();rejectJob(new Error('The PDF operation exceeded its two-minute limit. Try a smaller document.'));},120000);
  const promise=new Promise((resolve,reject)=>{
    rejectJob=reject;
    worker.onmessage=({data})=>{if(data.kind==='progress'){onProgress(data.progress);return;}clearTimeout(timer);worker.terminate();if(data.kind==='result')resolve(data.value);else reject(new Error(data.message));};
    worker.onerror=()=>{clearTimeout(timer);worker.terminate();reject(new Error('The PDF worker could not complete this operation. Try reopening the file.'));};worker.postMessage(input);
  });
  return {promise,cancel(){clearTimeout(timer);worker.terminate();rejectJob(new Error('Operation canceled. No copy was saved.'));}};
}
