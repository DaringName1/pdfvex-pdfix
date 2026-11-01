'use strict';
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {TIFF_LIMITS:L,hash,validTiffSource,validTiffToken,validTiffPage,validTiffSelection,validTiffInspection,validTiffPageResult}=require('./tiff-validation.cjs');
class TiffService extends ContainedServiceContext{
 constructor(options={}){super('TIFF','TIFF',options);this.inspected=null;this.pages=new Map();}
 _clear(){for(const page of this.pages.values())page.bytes.fill(0);this.pages.clear();this.inspected=null;}
 clear(){if(this.disposed)throw new Error('The TIFF containment service has closed.');if(this.active)throw new Error('Finish or cancel the current TIFF operation first.');this._clear();}
 async inspect(sourceId,source,token){
  validTiffToken(token);if(this.disposed)throw new Error('The TIFF containment service has closed.');if(this.active)throw new Error('Finish or cancel the current TIFF operation first.');const bytes=validTiffSource(sourceId,source),sourceSha256=hash(bytes);this.clear();
  const report=await this._runContained(sourceId,token,'tiff-inspect',bytes,{},value=>validTiffInspection(value,sourceSha256));validTiffInspection(report,sourceSha256);this.inspected={sourceId,token,sourceSha256,report:structuredClone(report)};return {token,report:structuredClone(report)};
 }
 bound(sourceId,source,token){validTiffToken(token);if(this.disposed)throw new Error('The TIFF containment service has closed.');const bytes=validTiffSource(sourceId,source),value=this.inspected;if(!value||value.sourceId!==sourceId||value.token!==token||value.sourceSha256!==hash(bytes)){bytes.fill(0);throw new Error('Inspect this exact TIFF source again before decoding or importing pages.');}return {bytes,value};}
 async page(sourceId,source,token,index){
  const {bytes,value}=this.bound(sourceId,source,token);try{validTiffPage(index,value.report.pageCount);if(!value.report.pages[index].supported)throw new Error(`TIFF page ${index+1}: ${value.report.pages[index].reason}`);}catch(error){bytes.fill(0);throw error;}
  const cached=this.pages.get(index);if(cached){bytes.fill(0);this.pages.delete(index);this.pages.set(index,cached);return {token,bytes:Uint8Array.from(cached.bytes),report:structuredClone(cached.report)};}
  const result=await this._runContained(sourceId,token,'tiff-page',bytes,{page:index},result=>validTiffPageResult(result,index,value.sourceSha256,value.report));if(this.inspected!==value)throw new Error('TIFF source inspection ended during decoding. No page was retained.');validTiffPageResult(result,index,value.sourceSha256,value.report);
  const record={bytes:Buffer.from(result.bytes),report:structuredClone(result.report)};this.pages.set(index,record);
  const over=()=>this.pages.size>L.importPages||[...this.pages.values()].reduce((sum,p)=>sum+p.bytes.length,0)>L.importBytes||[...this.pages.values()].reduce((sum,p)=>sum+p.report.width*p.report.height,0)>L.collectionPixels;
  while(over()){const oldest=this.pages.keys().next().value;this.pages.get(oldest).bytes.fill(0);this.pages.delete(oldest);}
  return {token,bytes:Uint8Array.from(record.bytes),report:structuredClone(record.report)};
 }
 output(sourceId,source,token,indices){
  const {bytes,value}=this.bound(sourceId,source,token);bytes.fill(0);const chosen=validTiffSelection(indices,value.report),records=chosen.map(index=>{const record=this.pages.get(index);if(!record)throw new Error(`Decode TIFF page ${index+1} again before importing the selected page copies.`);validTiffPageResult(record,index,value.sourceSha256,value.report);return record;});if(records.reduce((sum,p)=>sum+p.bytes.length,0)>L.importBytes||records.reduce((sum,p)=>sum+p.report.width*p.report.height,0)>L.collectionPixels)throw new Error('Selected TIFF page copies exceed 100 MiB or 64 million pixels.');return {token,sourceSha256:value.sourceSha256,pages:records.map(record=>({bytes:Buffer.from(record.bytes),report:structuredClone(record.report)}))};
 }
 async cancel(sourceId,token){if(this.disposed||this.engine.closed||this.engine.cleanupFailure){this._clear();throw new Error('The TIFF containment service has closed. Termination or cleanup must be resolved before leaving this operation.');}const job=this.active,matches=job?.sourceId===sourceId&&(!token||job.token===token);if(this.inspected?.sourceId===sourceId&&(!token||this.inspected.token===token))this._clear();const result=await super.cancel(sourceId,token);if(matches){try{await job.promise;}catch{}if(!result||this.engine.active?.unsafe||this.engine.cleanupFailure||this.engine.closed){this.disposed=true;this._clear();throw new Error('TIFF containment termination or cleanup was not observed. The service stays closed; no page copies can be imported.');}}return result;}
 async discard(sourceId,token){await this.cancel(sourceId,token);if(this.inspected?.sourceId===sourceId&&(!token||this.inspected.token===token))this._clear();return true;}
 async dispose(){this._clear();return super.dispose();}
 async status(){return {...await super.status(),limits:{...L},decodedPages:this.pages.size,supported:'TIFF 6 strips: grayscale/palette 1/4/8-bit, RGB 8-bit; none/PackBits/LZW/Deflate; bilevel CCITT MH/Group3/Group4'};}
}
module.exports={TiffService};
