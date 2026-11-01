'use strict';
// This module is bundled into the fixed AppContainer child only. Electron must
// import the inert validation/service modules, never this parser/writer.
const {inspectFormPdf,filledPdf}=require('../src/form-output.js');
const {hash,FORM_FILL_SCOPE,validFormFillInspection,validFormFillDraft,validFormFillResult,overlayReceipt,expectedFields}=require('./form-fill-validation.cjs');
async function inspect(bytes){return validFormFillInspection({...await inspectFormPdf(bytes),sourceSha256:hash(bytes)},hash(bytes));}
async function build(bytes,value){
 const info=await inspect(bytes),draft=validFormFillDraft(value,info),output=await filledPdf(bytes,draft,()=>{},hash);
 const expected=expectedFields(draft,info);if(JSON.stringify(output.expected.map(({name,type,value})=>({name,type,value})))!==JSON.stringify(expected))throw new Error('Changed fields differ from the reviewed source-bound draft.');
 if(JSON.stringify(output.tabOrders)!==JSON.stringify(draft.tabOrders))throw new Error('Saved keyboard order differs from the reviewed source-bound draft.');
 const result={bytes:output.bytes,report:{version:1,verified:true,sourceSha256:hash(bytes),sha256:hash(output.bytes),originalBytes:bytes.length,outputBytes:output.bytes.length,pageCount:info.pageCount,fieldCount:info.fields.length,draftSha256:hash(Buffer.from(JSON.stringify(draft))),expected,tabOrders:output.tabOrders,overlays:draft.overlays.map(overlayReceipt),checks:{reopened:true,fields:true,originalArtwork:true,untouchedFields:true,annotations:true,overlayStreams:true,calculations:true,tabOrder:true},scope:FORM_FILL_SCOPE}};
 return validFormFillResult(result,draft,hash(bytes),bytes.length,info);
}
module.exports={inspect,build};
