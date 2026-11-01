'use strict';
const path=require('node:path');
const {AiService,AiError}=require('./ai-service.cjs');
/** Call after app.whenReady; register must enforce the existing trusted main-frame IPC boundary. */
async function registerAi({folder,safeStorage,source,register,dialog,window}){
  const service=new AiService(path.join(folder,'ai-connections'),safeStorage,source);let startupError=null;try{await service.init();}catch(error){startupError=error;}
  const aiRegister=(name,callback)=>register(name,(...args)=>{if(startupError)throw startupError;return callback(...args);});
  const review=async value=>{
    const c=value.connection;
    const detail=value.type==='discovery'?`Endpoint: ${c.endpoint}/models\nNo credential is sent. No question, document text or file names are sent. This checks local model discovery only.\nA local server can still forward requests elsewhere; review its configuration.`:
      `Endpoint: ${c.endpoint}/chat/completions\nModel: ${c.model}\nNo credential is sent.\nRequest size: ${value.bytes} bytes\n\nQuestion:\n${value.question}\n\n${value.snippets.map(s=>`[${s.id}] ${s.name} — ${s.location}\n${s.text}`).join('\n\n')||'No document excerpts selected.'}\n\nAssistant instructions:\n${value.payload.messages[0].content}\n\nThe local server may retain or forward this content or use its own server tools. PDFix supplies no tools and makes no file changes. Cancellation cannot recall data already sent.`;
    const result=await dialog.showMessageBox(typeof window==='function'?window():window,{type:'question',title:'PDFix — review AI transfer',message:value.type==='discovery'?'Contact this exact endpoint to discover models?':'Send this reviewed question and these excerpts?',detail,buttons:[value.type==='discovery'?'Discover models':'Send once','Cancel'],defaultId:1,cancelId:1,noLink:true,signal:value.signal});return result.response===0;
  };
  aiRegister('ai-connections',()=>service.list());
  aiRegister('ai-save-connection',value=>service.save(value));
  aiRegister('ai-remove-connection',id=>service.remove(id));
  aiRegister('ai-discover',id=>service.discover(id,review));
  aiRegister('ai-prepare',value=>service.prepare(value));
  aiRegister('ai-discard',token=>service.discard(token));
  aiRegister('ai-send',token=>service.send(token,review));
  aiRegister('ai-cancel',token=>service.cancel(token));
  aiRegister('ai-clear-history',()=>service.clearHistory());
  return service;
}
module.exports={registerAi,AiError};
