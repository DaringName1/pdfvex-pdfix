const {randomUUID}=require('node:crypto');
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {validSecuritySource}=require('./pdf-security-validation.cjs');
const {hash,validAttachmentInventory,validAttachmentSelection}=require('./pdf-attachment-validation.cjs');
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
class PdfAttachmentService extends ContainedServiceContext{
 constructor(options){super('PDF attachment inspection','Attachments',options);this.inventory=null;this.selected=null;}
 clearSelection(){this.selected?.bytes.fill(0);this.selected=null;}
 async inspect(sourceId,source){
  this.inventory=null;this.clearSelection();const bytes=validSecuritySource(sourceId,source),binding={sourceSha256:hash(bytes),sourceBytes:bytes.length};
  const report=await this._runContained(sourceId,null,'attachment-inspect',bytes,{},v=>validAttachmentInventory(v,binding));validAttachmentInventory(report,binding);
  const inventoryToken=randomUUID();this.inventory={sourceId,inventoryToken,...binding,attachments:structuredClone(report.attachments)};return {...report,inventoryToken};
 }
 async select(sourceId,source,inventoryToken,attachmentId,token){
  if(typeof token!=='string'||!UUID.test(token)||typeof attachmentId!=='string'||!/^[a-f0-9]{64}$/.test(attachmentId))throw new Error('Invalid attachment review token.');
  const bytes=validSecuritySource(sourceId,source),list=this.inventory,item=list?.attachments.find(value=>value.id===attachmentId);
  if(!list||list.sourceId!==sourceId||list.inventoryToken!==inventoryToken||list.sourceSha256!==hash(bytes)||!item?.available){bytes.fill(0);throw new Error('Inspect this source and choose an available embedded file before exporting.');}
  if(!item.actualBytes){bytes.fill(0);throw new Error('The selected attachment has no bytes to export.');}
  this.clearSelection();const binding={sourceSha256:list.sourceSha256,item};
  const result=await this._runContained(sourceId,token,'attachment-select',bytes,{attachmentId},v=>validAttachmentSelection(v,binding));validAttachmentSelection(result,binding);
  this.selected={sourceId,token,sourceSha256:list.sourceSha256,bytes:Buffer.from(result.bytes),report:structuredClone(result.report)};result.bytes.fill(0);return {token,report:structuredClone(this.selected.report)};
 }
 output(sourceId,source,token){const bytes=validSecuritySource(sourceId,source);try{const selected=this.selected;if(!selected||selected.sourceId!==sourceId||selected.token!==token||selected.sourceSha256!==hash(bytes)||hash(selected.bytes)!==selected.report.attachment.sha256)throw new Error('Choose and review this embedded file again before saving.');return {bytes:Buffer.from(selected.bytes),report:structuredClone(selected.report)};}finally{bytes.fill(0);}}
 async cancel(sourceId,token){if(this.selected?.sourceId===sourceId&&(!token||this.selected.token===token))this.clearSelection();return super.cancel(sourceId,token);}
 async discard(sourceId,token){if(this.selected?.sourceId===sourceId&&(!token||this.selected.token===token))this.clearSelection();return super.discard(sourceId,token);}
 async dispose(){this.inventory=null;this.clearSelection();return super.dispose();}
}
module.exports={PdfAttachmentService};
