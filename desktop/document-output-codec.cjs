// Child-only PDF parsing. Main-process document export imports the inert validator instead.
const {PDFDocument}=require('pdf-lib');
const {hash,validDocumentOutputBytes,validDocumentOutputInspection}=require('./document-output-validation.cjs');
async function inspectDocumentOutput(bytes){
 validDocumentOutputBytes(bytes);const sourceSha256=hash(bytes),byteLength=bytes.length;
 const doc=await PDFDocument.load(bytes,{ignoreEncryption:false,updateMetadata:false,throwOnInvalidObject:true});
 const pageCount=doc.getPageCount();if(!Number.isInteger(pageCount)||pageCount<1||pageCount>500)throw new Error('Use a document that produces 1 to 500 pages.');
 const pages=doc.getPages().map((page,index)=>({page:index+1,mediaBox:page.getMediaBox()}));
 return validDocumentOutputInspection({version:1,sourceSha256,byteLength,pageCount,pages},sourceSha256,byteLength);
}
module.exports={inspectDocumentOutput};
