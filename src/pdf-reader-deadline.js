export class PdfReadTimeoutError extends Error{
 constructor(){super('This PDF took too long to display. Close this PDF and try another file. Your original is unchanged.');}
}
export async function boundedPdfRead(operation,loadingTask,milliseconds=60000,isPaused=()=>false){
 let timer;
 try{return await Promise.race([operation,new Promise((_,reject)=>{const expire=()=>{
   if(isPaused()){timer=setTimeout(expire,milliseconds);return;}
   // Terminate the real worker directly: a stuck worker cannot acknowledge
   // PDF.js's normal Terminate message. Never wait on it on the UI thread.
   reject(new PdfReadTimeoutError());
   try{loadingTask?._worker?.destroy();}catch{}
   Promise.resolve().then(()=>loadingTask?.destroy()).catch(()=>{});
 };timer=setTimeout(expire,milliseconds);})]);}finally{clearTimeout(timer);}
}
