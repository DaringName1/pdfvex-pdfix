import {canonical,sha,pageOrderInspection,pageOrderResult} from './pdf-page-order-model.js';

// Only a permutation qualifies. No destructive operation silently falls back
// from the preserving route to the fresh-page copier.
export function preservingPermutation(sources,plan){
 if(sources.length!==1||!sources[0].file.id||plan.length!==sources[0].info.pages.length)return null;
 const seen=new Set();
 for(const row of plan){if(row.source!==0||row.turn||row.crop&&Object.values(row.crop).some(Boolean)||row.resize||!Number.isInteger(row.index)||row.index<0||row.index>=plan.length||seen.has(row.index))return null;seen.add(row.index);}
 return plan.map(row=>row.index+1);
}

export class PagePreservingCopy{
 constructor(workspace){this.w=workspace;this.pending=Promise.resolve();}
 invalidate(){if(!this.token)return;this.token=null;this.pending=this.pending.then(()=>window.pdfix.cancelPdfPageOrder(this.w.file.id)).catch(error=>{this.cancelError=error;});}
 async build(order){
  await this.pending;if(this.cancelError)throw this.cancelError;
  const w=this.w,file=w.sources[0].file,doc=await w.thumbnails.document(0);
  const inspection=await pageOrderInspection(await window.pdfix.inspectPdfPageOrder(file.id),await sha(file.bytes),doc.numPages);
  this.token=crypto.randomUUID();
  const result=await window.pdfix.buildPdfPageOrder(file.id,this.token,{inspectionSha256:inspection.inspectionSha256,order});
  await pageOrderResult(result,{inspection,order,token:this.token,sourceBytes:file.bytes.length});
  if(w.closed)throw new Error('Page arrangement closed. Nothing was saved.');
  const geometry=[];for(const number of order){const page=await doc.getPage(number),v=page.getViewport({scale:1});geometry.push({width:v.width,height:v.height});}return {...result,pageCount:order.length,preserving:true,order,geometry};
 }
 async verify(output,reader){
  const source=await this.w.thumbnails.document(0),annotation=row=>({id:row.id,subtype:row.subtype,contents:row.contentsObj?.str??null,title:row.titleObj?.str??null,rect:row.rect??null,flags:row.annotationFlags,fieldName:row.fieldName??null,fieldValue:row.fieldValue??null,dest:row.dest??null,url:row.url??null});
  for(let i=0;i<output.order.length;i++){
   const before=await source.getPage(output.order[i]),after=await reader.doc.getPage(i+1),a=before.getViewport({scale:1}),b=after.getViewport({scale:1});
   if(canonical([a.width,a.height,a.viewBox])!==canonical([b.width,b.height,b.viewBox]))throw new Error('Reordered page size did not match. Nothing was saved.');
   const notes=await before.getAnnotations({intent:'any'}),saved=await after.getAnnotations({intent:'any'});
   if(canonical(notes.map(annotation))!==canonical(saved.map(annotation)))throw new Error('Reordered comments, links or fields did not match. Nothing was saved.');
  }
  if(canonical(await source.getOutline())!==canonical(await reader.doc.getOutline()))throw new Error('Reordered bookmarks did not match. Nothing was saved.');
 }
 async save(){return window.pdfix.savePdfPageOrder(this.w.file.id,this.token);}
 dispose(){this.invalidate();}
}
