// Bundled only into the fixed contained child. Electron does not load these parsers.
const LIMITS=require('./document-limits.cjs');
const {importRtf,exportRtf}=require('../src/rtf-codec.js');
const {exportDocx,checkDocxArchive}=require('../src/document-codec.js');
const mammoth=require('mammoth');
const {rasterHeader}=require('./document-image-validation.cjs');
const {docxParagraphLayout}=require('./docx-paragraph-layout.cjs');
const {validRichRequest,validRtfImport,validRichOutput,validDocxImport}=require('./rich-document-validation.cjs');
function readRtf(bytes,options){if(Object.keys(options).length||bytes.length>LIMITS.WORD_IMPORT_BYTES)throw new Error('RTF import requires only the chosen source, up to 100 MB.');return validRtfImport(importRtf(bytes));}
async function writeRich(bytes,options,format){
 if(Object.keys(options).join(',')!=='draft')throw new Error('Rich export requires only the reviewed snapshot.');const draft=validRichRequest(options.draft);
 const output=format==='docx'?await exportDocx(draft.content,draft.layout):exportRtf(draft.content,draft.layout);validRichOutput(output,format);
 if(format==='docx')checkDocxArchive(output);else validRtfImport(importRtf(output));return output;
}
// The saved PDFix model is offered only when its recorded hash matches the body in this exact file.
function readDocxSnapshot(bytes){
 const {readArchive,xml}=require('./office-archive.cjs'),{createHash}=require('node:crypto'),{SNAPSHOT_PROPERTY,SHA_PROPERTY,SNAPSHOT_LIMIT}=require('./document-snapshot-model.cjs');
 const archive=readArchive(Buffer.from(bytes),{size:LIMITS.WORD_IMPORT_BYTES,expanded:LIMITS.DOCX_EXPANDED_BYTES,part:LIMITS.DOCX_PART_BYTES,names:new Set(['docProps/custom.xml','word/document.xml'])}),custom=archive.get('docProps/custom.xml'),body=archive.get('word/document.xml');if(!custom||!body||custom.length>6*SNAPSHOT_LIMIT)return null;
 const values=new Map();for(const property of Array.from(xml(custom).getElementsByTagName('property'))){const name=property.getAttribute('name');if([SNAPSHOT_PROPERTY,SHA_PROPERTY].includes(name)){if(values.has(name))return null;values.set(name,property.textContent);}}
 const text=values.get(SNAPSHOT_PROPERTY),sha=values.get(SHA_PROPERTY);if(typeof text!=='string'||text.length>SNAPSHOT_LIMIT||sha!==createHash('sha256').update(body).digest('hex'))return null;
 return JSON.parse(text);
}
async function readDocx(bytes,options){
 if(Object.keys(options).length)throw new Error('DOCX import accepts only the chosen immutable source.');checkDocxArchive(bytes);
 const assets=[],notes=[];let count=0,totalBytes=0,totalPixels=0,queue=Promise.resolve(),omitted=0;
 const convertImage=(image,messages)=>{const id=++count;if(id>LIMITS.IMAGE_COUNT){omitted++;return Promise.resolve([]);}const work=queue.then(async()=>{try{if(!['image/png','image/jpeg'].includes(image.contentType))throw new Error('Only embedded PNG/JPEG images are supported.');const imageBytes=Uint8Array.from(await image.readAsBuffer());if(imageBytes.length>LIMITS.IMAGE_SOURCE_BYTES)throw new Error('The embedded picture is larger than 40 MB.');const header=rasterHeader(imageBytes,image.contentType);if(totalBytes+imageBytes.length>LIMITS.IMPORT_IMAGE_TOTAL_BYTES||totalPixels+header.width*header.height>LIMITS.IMAGE_TOTAL_PIXELS*4)throw new Error('The embedded-image byte/pixel budget was reached.');totalBytes+=imageBytes.length;totalPixels+=header.width*header.height;assets.push({id,mime:image.contentType,alt:String(image.altText??'').replace(/[\x00-\x1f\x7f]/g,' ').slice(0,500),bytes:imageBytes});return mammoth.images.imgElement(()=>({src:'pdfix-import-asset-'+id}))(image,messages);}catch(error){omitted++;if(notes.length<20)notes.push('Inline image '+id+' omitted: '+String(error.message).slice(0,400));return [];}});queue=work.catch(()=>{});return work;};
 const result=await mammoth.convertToHtml({buffer:Buffer.from(bytes)},{externalFileAccess:false,includeEmbeddedStyleMap:false,convertImage,styleMap:['u => u']});
 const warnings=[...(omitted?[omitted+(omitted===1?' picture was':' pictures were')+' left out: PDFix edits up to 500 pictures in a document, each up to 40 MB and 60 megapixels. The original file still has them.']:[]),...notes,...result.messages.map(message=>String(message.message).slice(0,1000))];
 const imported={html:result.value,assets,warnings:warnings.length>100?[...warnings.slice(0,99),'Additional import notes omitted from this bounded report.']:warnings};
 // Paragraph layout the HTML import drops; an unreadable body only loses that layout.
 try{const {readArchive}=require('./office-archive.cjs'),paragraphs=docxParagraphLayout(readArchive(Buffer.from(bytes),{size:LIMITS.WORD_IMPORT_BYTES,expanded:LIMITS.DOCX_EXPANDED_BYTES,part:LIMITS.DOCX_PART_BYTES,names:new Set(['word/document.xml'])}).get('word/document.xml'));if(paragraphs.some(item=>Object.keys(item.attrs).length||item.runs))imported.paragraphs=paragraphs;}catch{}
 // An unusable saved model never blocks the ordinary import.
 let snapshot=null;try{snapshot=readDocxSnapshot(bytes);if(snapshot)validDocxImport({...imported,snapshot});}catch{snapshot=null;}
 return validDocxImport(snapshot?{...imported,snapshot}:imported);
}
module.exports={readRtf,writeRich,readDocx};
