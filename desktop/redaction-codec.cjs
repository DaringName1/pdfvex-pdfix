// Required only by the bundled fixed AppContainer child, never by Electron main.
const {inflateSync}=require('node:zlib');
const {PDFName}=require('pdf-lib');
const {inspectRedactionSource,verifyRedactedPdf}=require('../src/redaction-output.js');
const {hash,digest,validInspection,validVerificationOptions,validResult}=require('./redaction-contained-validation.cjs');
async function inspect(bytes){const info=await inspectRedactionSource(bytes);return validInspection({version:1,sourceSha256:hash(bytes),sourceBytes:bytes.length,...info},hash(bytes),bytes.length);}
async function verify(bytes,options){
 const {inspection,draft}=validVerificationOptions(options);
 const checked=await verifyRedactedPdf(bytes,inspection.pages,draft,(image,length)=>{if(String(image.dict.get(PDFName.of('Filter')))!=='/FlateDecode')throw new Error('Unexpected clean-image encoding.');const rgb=inflateSync(image.contents,{maxOutputLength:length+1});if(rgb.length!==length)throw new Error('Unexpected sanitized image length.');return rgb;});
 const report={version:1,verified:true,sourceSha256:inspection.sourceSha256,sourceBytes:inspection.sourceBytes,inspectionSha256:digest(inspection),draftSha256:digest(draft),sha256:hash(bytes),outputBytes:bytes.length,...checked};
 return validResult(report,inspection,draft,hash(bytes),bytes.length);
}
module.exports={inspect,verify};
