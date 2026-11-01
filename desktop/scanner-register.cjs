'use strict';
const path=require('node:path');
const fs=require('node:fs/promises');
const {randomUUID,createHash}=require('node:crypto');
const {ScannerService}=require('./scanner-service.cjs');
const {FileError}=require('./file-store.cjs');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

function registerScanner({root,register,store,dialog,getWindow,isAvailable,saveLease}){
 const service=new ScannerService({root});
 let generation=0,disposed=false,importing=null,cleanup=null,initError=null;
 const ready=service.init().catch(error=>{initError=error;});
 const owner=()=>getWindow().webContents.id;
 const current=stamp=>{if(disposed||generation!==stamp||!isAvailable())throw new FileError('SCANNER','The scanner session ended. Open Scan again.');};
 const usable=async()=>{if(cleanup)await cleanup;await ready;if(initError)throw initError;current(generation);};
 const wrapped=job=>async(...args)=>{try{return await job(...args);}catch(error){throw error instanceof FileError?error:new FileError('SCANNER',error.message);}};
 const ids=value=>{if(!Array.isArray(value)||!value.length||value.length>10||new Set(value).size!==value.length||value.some(id=>typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id)))throw new FileError('SCANNER','Choose distinct captures from this scanner session.');return value;};
 register('scanner-devices',wrapped(async()=>{await usable();if(importing)throw new Error('Let scan import finish before refreshing devices.');const stamp=generation,result=await service.listDevices(owner());current(stamp);return result;}));
 register('scanner-capture',wrapped(async options=>{await usable();if(importing)throw new Error('Let scan import finish before acquiring more pages.');const stamp=generation,result=await service.capture(owner(),options);current(stamp);return result;}));
 register('scanner-cancel',wrapped(async()=>service.cancel(owner())));
 register('scanner-discard',wrapped(async value=>{await usable();if(importing)throw new Error('Let scan import finish before discarding captures.');for(const id of ids(value))service.owned(owner(),id);for(const id of value)await service.releaseCapture(owner(),id);return {discarded:true};}));
 register('scanner-import',wrapped(async value=>{
  await usable();ids(value);if(importing||service.active)throw new Error('Finish the current scanner operation before importing pages.');
  const stamp=generation,captureOwner=owner(),sources=[],receipts=[],warnings=[];let destination,opened=[];
  for(const id of value)service.owned(captureOwner,id);
  let finish;const operation={done:new Promise(resolve=>{finish=resolve;})};importing=operation;saveLease(1);
  try{
   let size=0,pixels=0;
   for(const id of value){const pages=await service.takeCapture(captureOwner,id);sources.push(...pages);current(stamp);}
   for(const page of sources){size+=page.bytes.length;pixels+=page.width*page.height;}
   if(!sources.length||sources.length>10||size>100*1024*1024||pixels>64_000_000)throw new Error('Captured scans exceed the 10-page, 100 MiB or 64-million-pixel collection limit.');
   const chosen=await dialog.showOpenDialog(getWindow(),{title:'Choose a folder for saved scan images',properties:['openDirectory']});current(stamp);
   if(chosen.canceled)return null;
   const parent=await fs.realpath(chosen.filePaths[0]);if(!(await fs.lstat(parent)).isDirectory())throw new Error('Choose an available scan-image folder.');current(stamp);
   // A unique new folder and exclusive writes keep previous documents and captures intact.
   destination=path.join(parent,'PDFix scans '+new Date().toISOString().replace(/[:.]/g,'-')+' '+randomUUID().slice(0,8));
   await fs.mkdir(destination);current(stamp);
   for(let index=0;index<sources.length;index++){
    const page=sources[index];current(stamp);
    const receipt=await store.saveCopy(null,path.join(destination,`scan-${String(index+1).padStart(3,'0')}.png`),page.bytes,'png',digest(page.bytes));
    receipts.push(receipt);current(stamp);
   }
   // Durable PNG copies are complete before switching the current document session.
   for(let index=0;index<receipts.length;index++){
    current(stamp);
    try{opened.push(await store.open(receipts[index].location,{retain:index>0,maxBytes:32*1024*1024,expectedHash:digest(sources[index].bytes)}));}
    catch(error){if(!opened.length)throw error;warnings.push(`${opened.length} of ${receipts.length} saved scans opened for page review. Scan ${index+1} could not be opened: ${error.message}. All remaining PNG copies are in ${destination}.`);break;}
   }
   current(stamp);
   for(const id of value){try{await service.releaseCapture(captureOwner,id);}catch(error){warnings.push('The imported images are saved, but temporary scanner cleanup needs attention: '+error.message);}}
   return {...opened[0],capturedImages:opened.slice(1),savedScanImages:receipts,scannerWarnings:warnings};
  }catch(error){
   const suffix=receipts.length?` ${receipts.length} verified PNG ${receipts.length===1?'copy remains':'copies remain'} in ${destination}. Original documents and remaining captures are preserved.`:'';
   throw new FileError('SCANNER',error.message+suffix);
  }finally{for(const page of sources)page.bytes.fill(0);if(importing===operation)importing=null;finish();saveLease(-1);}
 }));
 const disposeOwner=()=>{
  generation++;
  if(cleanup)return cleanup;
  const captureOwner=owner();
  cleanup=(async()=>{await ready;await service.cancel(captureOwner);if(importing)await importing.done;await service.disposeOwner(captureOwner);})().catch(error=>{initError=error;throw error;}).finally(()=>{cleanup=null;});
  return cleanup;
 };
 return {
  service,
  status:()=>({backend:'Windows WIA',platform:'win32-x64',deviceAdapterContained:false,decoder:'sandboxed renderer workers',captureLimit:10,byteLimit:100*1024*1024,pixelLimit:64_000_000,active:!!service.active,importing:!!importing,available:!disposed&&!initError,runtimeAcceptance:'pending'}),
  disposeOwner,
  async dispose(){disposed=true;await disposeOwner();await service.dispose();}
 };
}
module.exports={registerScanner};
