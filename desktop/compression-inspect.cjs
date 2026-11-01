const {createHash}=require('node:crypto');
const {PDFDocument,PDFName,PDFDict,PDFArray,PDFRef,PDFRawStream,PDFNumber,PDFString,PDFHexString,decodePDFRawStream}=require('pdf-lib');
const DecodeStream=require('pdf-lib/cjs/core/streams/DecodeStream.js').default;
const MAX=100*1024*1024,n=PDFName.of;
const ensure=DecodeStream.prototype.ensureBuffer;
// Includes streams decoded by PDFDocument.load, before our graph walk starts.
DecodeStream.prototype.ensureBuffer=function(size){if(size>64*1024*1024)throw new Error('An expanded PDF stream exceeds the compression limit.');return ensure.call(this,size);};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
// A name compares by what it means, not how its escapes are spelled: qpdf writes "#2f" where the source had "#2F"
// (the same "/"), and pdf-lib keeps a lower-case escape literally, re-escaping its "#" as "#23". Without this, any
// PDF with an attachment typed "text/plain" was refused by password protection although nothing changed.
function canonicalName(name){return String(name).replace(/#23([0-9a-fA-F]{2})/g,'#$1').replace(/#([0-9a-fA-F]{2})/g,(_,hex)=>String.fromCharCode(parseInt(hex,16)));}
async function inspect(bytes,lossy=false,passwordDeclaration=false){
 if(!bytes?.length||bytes.length>MAX)throw new Error('Compression needs a PDF under 100 MB.');
 const doc=await PDFDocument.load(bytes,{ignoreEncryption:true,throwOnInvalidObject:true,updateMetadata:false});
 // AES-256 revision 6 adds this exact PDF 1.7 extension declaration. Compare
 // content without that declaration only for the password writer; retain all
 // other extension entries and never alter the source or serialized output.
 if(passwordDeclaration){const extensions=doc.catalog.lookupMaybe(n('Extensions'),PDFDict),adbe=extensions?.lookupMaybe(n('ADBE'),PDFDict);if(adbe&&adbe.keys().length===2&&String(adbe.get(n('BaseVersion')))==='/1.7'&&adbe.lookupMaybe(n('ExtensionLevel'),PDFNumber)?.asNumber()===8){extensions.delete(n('ADBE'));if(!extensions.keys().length)doc.catalog.delete(n('Extensions'));}}
 if(doc.isEncrypted)throw new Error('Encrypted PDFs cannot be compressed here. Use an owner-authorized unrestricted copy.');
 const objects=doc.context.enumerateIndirectObjects();if(objects.length>100000||doc.getPageCount()>500)throw new Error('Compression supports up to 500 pages and 100,000 PDF objects.');
 if(doc.catalog.get(n('Perms')))throw new Error('Certified or permission-controlled PDFs cannot be compressed here.');
 const scanned=new Set();let visited=0;
 function safety(value,depth=0){
  if(depth>100||++visited>1000000)throw new Error('This PDF structure exceeds the compression limit.');
  if(value instanceof PDFRef)return; // All indirect objects are scanned separately, including orphaned objects.
  if(!value||scanned.has(value))return;scanned.add(value);
  const dict=value instanceof PDFRawStream?value.dict:value;
  if(dict instanceof PDFDict){
   if(dict.get(n('ByteRange'))||String(doc.context.lookup(dict.get(n('Type'))))==='/Sig'||String(doc.context.lookup(dict.get(n('FT'))))==='/Sig')throw new Error('PDFs with digital signatures or certificate signature fields cannot be compressed here.');
   if(dict.get(n('XFA')))throw new Error('XFA forms cannot be compressed in this build.');
   if(String(dict.get(n('Subtype')))==='/Image'){
    const w=dict.lookupMaybe(n('Width'),PDFNumber)?.asNumber(),h=dict.lookupMaybe(n('Height'),PDFNumber)?.asNumber();
    if(!Number.isInteger(w)||!Number.isInteger(h)||w<=0||h<=0||w>8192||h>8192||w*h>16000000)throw new Error('A PDF image exceeds the 16-million-pixel compression limit.');
   }
   for(const [,item]of dict.entries())safety(item,depth+1);
  }else if(value instanceof PDFArray)for(const item of value.asArray())safety(item,depth+1);
 }
 for(const [,value]of objects)safety(value);
 const refs=new Map(),queue=[],imageHashes=[];let expanded=0,nodes=0;
 function streamHash(stream){
  const filter=stream.dict.lookup(n('Filter')),filters=filter instanceof PDFArray?filter.asArray().map(v=>String(doc.context.lookup(v))):filter?[String(filter)]:[],supported=new Set(['/FlateDecode','/LZWDecode','/ASCII85Decode','/ASCIIHexDecode','/RunLengthDecode']);
  if(filters.some(f=>!supported.has(f)))return {raw:hash(stream.contents),filter:encode(stream.dict.get(n('Filter'))),params:encode(stream.dict.get(n('DecodeParms')))};
  const decoded=decodePDFRawStream(stream);
  const digest=createHash('sha256');while(true){const chunk=decoded.getBytes(65536);if(!chunk.length)break;expanded+=chunk.length;if(expanded>MAX)throw new Error('Expanded PDF content exceeds the 100 MB verification limit.');digest.update(chunk);}return {decoded:digest.digest('hex'),params:encode(stream.dict.get(n('DecodeParms')))};
 }
 function encode(value,depth=0){
  if(depth>100||++nodes>1000000)throw new Error('This PDF structure exceeds the verification limit.');
  if(value===undefined)return null;
  if(value instanceof PDFRef){const key=String(value);if(!refs.has(key)){refs.set(key,queue.length);queue.push(value);}return {ref:refs.get(key)};}
  if(value instanceof PDFRawStream){
   const image=String(value.dict.get(n('Subtype')))==='/Image',body=streamHash(value);
   if(image)imageHashes.push(hash(Buffer.from(JSON.stringify(body))));
   return {stream:lossy&&image?'review-image-pixels':body,dict:encodeDict(value.dict,new Set(['Length','Filter','DecodeParms']),depth+1)};
  }
  if(value instanceof PDFDict)return encodeDict(value,new Set(),depth+1);
  if(value instanceof PDFArray)return value.asArray().map(item=>encode(item,depth+1));
  if(value instanceof PDFString||value instanceof PDFHexString)return {string:Buffer.from(value.asBytes()).toString('hex')};
  if(value instanceof PDFNumber)return {number:value.asNumber()};
  if(value instanceof PDFName)return canonicalName(value);
  return String(value);
 }
 function encodeDict(dict,omit,depth){return dict.entries().filter(([key])=>!omit.has(key.decodeText())).sort(([a],[b])=>a.decodeText().localeCompare(b.decodeText(),'en')).map(([key,value])=>[key.decodeText(),encode(value,depth)]);}
 const digest=createHash('sha256');digest.update(JSON.stringify([encode(doc.context.trailerInfo.Root),encode(doc.context.trailerInfo.Info)]));
 for(let i=0;i<queue.length;i++){const value=doc.context.lookup(queue[i]);if(!value)throw new Error('The PDF contains an unresolved object reference.');digest.update(JSON.stringify(encode(value)));}
 const geometry=doc.getPages().map(p=>({media:p.getMediaBox(),crop:p.getCropBox(),rotation:p.getRotation().angle}));
 if(JSON.stringify(geometry).length>200000||geometry.some(g=>Object.values(g.media).concat(Object.values(g.crop),g.rotation).some(v=>!Number.isFinite(v))))throw new Error('A PDF page has invalid geometry.');
 return {graph:digest.digest('hex'),geometry,pageCount:geometry.length,imageHashes};
}
async function verify(source,output,lossy,passwordDeclaration=false){const before=await inspect(source,lossy,passwordDeclaration),after=await inspect(output,lossy,passwordDeclaration);if(before.graph!==after.graph||JSON.stringify(before.geometry)!==JSON.stringify(after.geometry))throw new Error('Compression changed a document structure or non-image content. No copy was saved.');return {pageCount:before.pageCount,geometry:before.geometry,changedImages:after.imageHashes.filter((v,i)=>v!==before.imageHashes[i]).length};}
module.exports={inspect,verify};
