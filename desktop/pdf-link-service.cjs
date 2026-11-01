const {ContainedServiceContext}=require('./contained-service-context.cjs');
const {createHash}=require('node:crypto');
const {validateLinkRequest,validateWebDestination,validLinkResult,MAX_BYTES,MAX_URL}=require('./pdf-link-validation.cjs');
class PdfLinkService extends ContainedServiceContext{
 constructor(options){super('PDF web destination inspection','Links',options);}
 async resolve(value,source){
  const request=validateLinkRequest(value);
  if(source?.ext!=='pdf'||!(source.bytes instanceof Uint8Array)||!source.bytes.length||source.bytes.length>MAX_BYTES||source.fingerprint!==request.sourceSha256)throw new Error('The opened PDF snapshot changed. Reopen its links before reviewing a destination.');
  const bytes=Uint8Array.from(source.bytes);if(createHash('sha256').update(bytes).digest('hex')!==request.sourceSha256){bytes.fill(0);throw new Error('The original PDF link source changed before containment.');}
  const result=await this._runContained(request.sourceID,null,'link-resolve',bytes,{request},v=>validLinkResult(v,request));return validLinkResult(result,request);
 }
}
module.exports={PdfLinkService,validateLinkRequest,validateWebDestination,MAX_BYTES,MAX_URL};
