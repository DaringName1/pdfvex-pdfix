'use strict';
const path=require('node:path'),{randomUUID,createHash}=require('node:crypto');
const {PdfRepairService}=require('./pdf-repair-service.cjs');
// Reuse the existing pinned qpdf AppContainer, watchdog, observed-exit and
// cleanup contract. This check never rewrites or repairs the reviewed bytes.
class PdfOutputCheckService extends PdfRepairService{
 async verify({id,bytes,sha256}){
  const hash=createHash('sha256').update(bytes).digest('hex');if(hash!==sha256)throw new Error('The PDF output changed before independent checking.');
  const sourceId=id||randomUUID(),source={ext:'pdf',bytes,fingerprint:hash};
  return this.job(sourceId,source,randomUUID(),async(job)=>{const input=path.join(job.folder,'input.pdf');await this.command(job,['--suppress-recovery','--check',input],{strict:true});const pages=await this.command(job,[input,'--show-npages'],{query:true});if(pages.code!==0||!/^\s*[1-9]\d{0,2}\s*$/.test(pages.stdout)||Number(pages.stdout.trim())>500)throw new Error('The PDF output page count could not be independently checked.');return {version:1,sha256:hash,pageCount:Number(pages.stdout.trim()),scope:'qpdf structural check with recovery disabled; visual, signature and redaction semantics are separate'};});
 }
}
module.exports={PdfOutputCheckService};
