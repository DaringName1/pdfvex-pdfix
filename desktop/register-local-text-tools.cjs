'use strict';
const path=require('node:path');
const {FileError}=require('./file-store.cjs');
const {LocalSpeechService}=require('./local-speech-service.cjs');
const {LocalSpellingService}=require('./local-spelling-service.cjs');
const {VirtualPrinterService}=require('./virtual-printer-service.cjs');

// Text-only adapters: no remote providers, renderer paths or PDF decoding.
function registerLocalTextTools({register,getWindow,userData,store,dialog,saveLease,isAvailable}){
 const spellingOptions={dictionaryPath:path.join(userData,'local-spelling','dictionary.json')};
 let speech=new LocalSpeechService(),spelling=new LocalSpellingService(spellingOptions),printer=new VirtualPrinterService(),generation=0,restarting=null,closed=false;
 const owner=()=>getWindow().webContents.id;
 const run=async action=>{try{if(closed)throw new Error('The local text tools are closed.');if(restarting)await restarting;return await action();}catch(error){throw new FileError('LOCAL_TOOL',error.message);}};
 register('speech-voices',()=>run(()=>speech.voices(owner())));
 register('speech-start',value=>run(()=>{const win=getWindow(),id=owner(),epoch=generation;return speech.start(id,value,event=>{if(!closed&&epoch===generation&&isAvailable()&&!win.isDestroyed()&&!win.webContents.isDestroyed())win.webContents.send('pdfix:speech-event',event);});}));
 register('speech-control',value=>run(()=>speech.control(owner(),value)));
 register('speech-release',()=>run(()=>speech.disposeOwner(owner())));
 register('local-spelling-languages',()=>run(()=>spelling.languages()));
 register('local-spelling-check',value=>run(()=>spelling.check(value)));
 register('local-spelling-dictionary',()=>run(()=>spelling.dictionary()));
 register('local-spelling-update-dictionary',value=>run(async()=>{saveLease(1);try{return await spelling.updateDictionary(value);}finally{saveLease(-1);}}));
 register('local-spelling-cancel',()=>run(()=>spelling.cancel()));
 register('virtual-printer-status',()=>run(()=>printer.status()));
 register('virtual-printer-manage',value=>run(async()=>{saveLease(1);try{return await printer.manage(value);}finally{saveLease(-1);}}));
 register('pick-virtual-printer-output',()=>run(async()=>{saveLease(1);const epoch=generation;try{const result=await dialog.showOpenDialog(getWindow(),{title:'Choose a printed PDF to review in PDFix',properties:['openFile'],filters:[{name:'PDF documents',extensions:['pdf']}]});if(result.canceled||epoch!==generation||!isAvailable())return null;const filename=result.filePaths[0];if(path.extname(filename).toLowerCase()!=='.pdf')throw new Error('Choose a printed PDF file.');return await store.open(filename);}finally{saveLease(-1);}}));
 const reset=()=>{generation++;if(restarting)return restarting;const prior=[speech,spelling,printer];const task=Promise.all(prior.map(tool=>tool.dispose())).then(()=>{if(!closed){speech=new LocalSpeechService();spelling=new LocalSpellingService(spellingOptions);printer=new VirtualPrinterService();}}).catch(error=>{closed=true;throw error;}).finally(()=>{if(restarting===task)restarting=null;});restarting=task;return task;};
 return {disposeOwner:reset,async dispose(){closed=true;generation++;if(restarting)await restarting;await Promise.all([speech.dispose(),spelling.dispose(),printer.dispose()]);}};
}
module.exports={registerLocalTextTools};
