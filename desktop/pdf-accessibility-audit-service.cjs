'use strict';
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {hash,validAuditSource,validAuditToken,validAuditReport}=require('./pdf-accessibility-audit-validation.cjs');
class PdfAccessibilityAuditService extends ContainedServiceContext{
 constructor(options){super('PDF accessibility audit','AccessibilityAudit',options);}
 async inspect(sourceId,source,token){
  validAuditToken(token);if(this.active)throw new Error('Finish or cancel the current PDF accessibility audit first.');
  const bytes=validAuditSource(sourceId,source),binding={sourceSha256:hash(bytes),sourceBytes:bytes.length};
  const report=await this._runContained(sourceId,token,'accessibility-audit-inspect',bytes,{},value=>validAuditReport(value,binding));
  return structuredClone(validAuditReport(report,binding));
 }
 async cancel(sourceId,token){validAuditToken(token);return super.cancel(sourceId,token);}
 async discard(sourceId,token){validAuditToken(token);return super.discard(sourceId,token);}
}
module.exports={PdfAccessibilityAuditService};
