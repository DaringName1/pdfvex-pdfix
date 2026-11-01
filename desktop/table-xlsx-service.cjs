const {createHash}=require('node:crypto');
const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {validTableXlsxDraft,validTableXlsxResult}=require('./table-xlsx-validation.cjs');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
class TableXlsxService extends ContainedServiceContext{
 constructor(options){super('Table XLSX export','TableXlsx',options);}
 async build(sourceId,source,value){
  if(typeof sourceId!=='string'||!sourceId||sourceId.length>100||source?.ext!=='pdf'||!(source.bytes instanceof Uint8Array)||!source.bytes.length||source.bytes.length>100*1024*1024||hash(source.bytes)!==source.fingerprint)throw new Error('Reopen the exact PDF source before exporting its reviewed table.');
  const draft=validTableXlsxDraft(value,source.fingerprint),result=await this._runContained(sourceId,null,'table-xlsx-write',Uint8Array.from(source.bytes),{draft},output=>validTableXlsxResult(output,draft));
  if(hash(source.bytes)!==source.fingerprint)throw new Error('The PDF source changed during table XLSX export.');return result;
 }
}
module.exports={TableXlsxService};
