const {createHash}=require('node:crypto');
const {validateLinkRequest,validateWebDestination,MAX_BYTES}=require('./pdf-link-validation.cjs');
const {PDFDocument,PDFDict,PDFArray,PDFRef,PDFName,PDFString,PDFHexString}=require('pdf-lib');
async function inspectLink(bytes,value){
  const request=validateLinkRequest(value);
  if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>MAX_BYTES||createHash('sha256').update(bytes).digest('hex')!==request.sourceSha256)throw new Error('The requested PDF snapshot no longer matches.');
  const doc=await PDFDocument.load(bytes,{ignoreEncryption:false,updateMetadata:false,throwOnInvalidObject:true,capNumbers:true});
  if(doc.isEncrypted||doc.context.trailerInfo.Encrypt)throw new Error('Review links from an owner-authorized decrypted copy of this PDF.');
  const pages=doc.getPages();if(pages.length>500||request.page>pages.length)throw new Error('The source page exceeds the reviewed PDF limits.');
  function resolve(value){const seen=new Set();for(let depth=0;value instanceof PDFRef;depth++){if(depth>=8||seen.has(value.tag))throw new Error('The link uses an unresolved PDF reference.');seen.add(value.tag);value=doc.context.lookup(value);if(!value)throw new Error('The link uses a missing PDF reference.');}return value;}
  const get=(dict,key)=>resolve(dict.get(PDFName.of(key)));
  const page=pages[request.page-1].node;
  if(page.has(PDFName.of('AA')))throw new Error('This page contains additional actions; external opening is blocked for this review.');
  const annotations=get(page,'Annots');if(!(annotations instanceof PDFArray)||annotations.size()>5000)throw new Error('The page has no supported annotation list or exceeds 5,000 annotations.');
  const match=/^([1-9]\d{0,9})R([1-9]\d{0,4})?$/.exec(request.annotationID),objectNumber=Number(match[1]),generationNumber=Number(match[2]||0);
  let reference=null;for(let index=0;index<annotations.size();index++){const value=annotations.get(index);if(value instanceof PDFRef&&value.objectNumber===objectNumber&&value.generationNumber===generationNumber){if(reference)throw new Error('The annotation reference appears more than once on the page.');reference=value;}}
  if(!reference)throw new Error('This link reference is not present on the requested source page.');
  const annotation=resolve(reference);
  if(!(annotation instanceof PDFDict)||get(annotation,'Subtype')!==PDFName.of('Link'))throw new Error('The selected source annotation is not a link.');
  for(const key of ['AA','Dest','FS','JS','Next','RichMediaContent'])if(annotation.has(PDFName.of(key)))throw new Error('This annotation contains an unsupported or additional action.');
  const action=get(annotation,'A');if(!(action instanceof PDFDict)||get(action,'S')!==PDFName.of('URI'))throw new Error('Only a direct URI action can open a browser. Launch, remote-file, attachment and script actions are blocked.');
  const allowed=new Set(['Type','S','URI']);for(const[key]of action.entries())if(!allowed.has(key.decodeText()))throw new Error('This link action contains unsupported or chained behavior.');
  const type=get(action,'Type');if(type&&type!==PDFName.of('Action'))throw new Error('This link action has an unsupported type.');
  const uri=get(action,'URI');if(!(uri instanceof PDFString)&&!(uri instanceof PDFHexString))throw new Error('This URI is not a supported PDF text string.');
  if(uri.asString().length>16384||uri.asBytes().length>8192)throw new Error('The original URI exceeds the link review limit.');
  const safe=validateWebDestination(uri.decodeText());
  return {...request,...safe,actionType:'URI'};
}
module.exports={inspectLink};
