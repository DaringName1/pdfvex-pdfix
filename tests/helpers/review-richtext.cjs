const {PDFDocument,PDFName,PDFString,PDFArray,PDFDict}=require('pdf-lib');
const {freeTextSource}=require('./review-freetext.cjs');
const richXml='<body xmlns="http://www.w3.org/1999/xhtml"><p style="font-family:Helvetica;font-size:12pt;color:#000000"><span>Original free text</span></p></body>';
async function richTextSource({unsupported=false}={}){const doc=await PDFDocument.load(await freeTextSource()),note=doc.getPage(0).node.lookup(PDFName.of('Annots'),PDFArray).lookup(0,PDFDict);note.set(PDFName.of('C'),doc.context.obj([1,1,0]));note.set(PDFName.of('RC'),PDFString.of(unsupported?richXml.replace('12pt','12pt;letter-spacing:1pt'):richXml));return Buffer.from(await doc.save({useObjectStreams:false}));}
module.exports={richTextSource,richXml};
