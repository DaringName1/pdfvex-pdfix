'use strict';
const {randomUUID}=require('node:crypto');
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const checks=require('./pdf-geospatial-validation.cjs');
class PdfGeospatialService extends ContainedServiceContext{
 constructor(options){super('PDF geospatial inspection','Geospatial',options);this.inventory=null;}
 async inspect(sourceId,source){if(this.active)throw new Error('Finish or cancel the current geospatial job first.');this.inventory=null;const bytes=checks.validSecuritySource(sourceId,source),binding={sourceSha256:checks.hash(bytes),sourceBytes:bytes.length};const report=await this._runContained(sourceId,null,'geospatial-inspect',bytes,{},value=>checks.inventory(value,binding));checks.inventory(report,binding);const inventoryToken=randomUUID();this.inventory={sourceId,inventoryToken,...binding,report:structuredClone(report)};return {...report,inventoryToken};}
 async query(sourceId,source,inventoryToken,value){if(this.active)throw new Error('Finish or cancel the current geospatial job first.');const selected=checks.draft(value),bytes=checks.validSecuritySource(sourceId,source);let binding;try{const inventory=this.inventory;if(!inventory||inventory.sourceId!==sourceId||inventory.inventoryToken!==inventoryToken||inventory.sourceSha256!==checks.hash(bytes)||inventory.sourceBytes!==bytes.length)throw new Error('Inspect the exact opened PDF and select its registered viewport again.');const viewport=inventory.report.viewports.find(v=>v.id===selected.viewportId);checks.resultFor(viewport,selected,inventory.sourceSha256,inventory.sourceBytes);binding={viewport,value:selected,sourceSha256:inventory.sourceSha256,sourceBytes:inventory.sourceBytes};}catch(error){bytes.fill(0);throw error;}const report=await this._runContained(sourceId,null,'geospatial-query',bytes,selected,value=>checks.result(value,binding));return checks.result(report,binding);}
 async discard(sourceId,token){if(this.inventory?.sourceId===sourceId)this.inventory=null;return super.discard(sourceId,token);}
 async dispose(){this.inventory=null;return super.dispose();}
}
module.exports={PdfGeospatialService};
