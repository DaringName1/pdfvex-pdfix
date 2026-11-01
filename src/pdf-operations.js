import { PDFDocument, PDFName, PDFArray, PDFDict, PDFRef, PDFRawStream, degrees } from 'pdf-lib';
import {visibleBox,pageGeometry} from './page-geometry.js';
import {validateGroups} from './page-ranges.js';
const MAX_BYTES=100*1024*1024, MAX_PAGES=500;
// Fresh-catalog page copies cannot preserve these document-level structures.
// Inspect every indirect object, including unused signature dictionaries, and
// bounded direct children before allowing either organize or split to rewrite.
function requireSafePageCopy(doc){
  const key=PDFName.of,objects=doc.context.enumerateIndirectObjects(),seen=new WeakSet();let visited=0;
  if(objects.length>100000)throw new Error('This PDF is too complex to safely copy its pages here.');
  if(doc.catalog.has(key('Perms')))throw new Error('This PDF declares signature or permission restrictions. Page editing is disabled to avoid invalidating them.');
  if(doc.catalog.has(key('StructTreeRoot')))throw new Error('This PDF has accessibility tags. Page copies cannot preserve them yet. The original has not been changed.');
  function scan(value,depth=0){
    if(depth>80||++visited>300000)throw new Error('This PDF is too complex to safely copy its pages here.');
    if(value instanceof PDFRef||!value||typeof value!=='object'||seen.has(value))return;
    seen.add(value);const dict=value instanceof PDFRawStream?value.dict:value;
    if(dict instanceof PDFDict){
      const name=field=>doc.context.lookup(dict.get(key(field)))?.toString();
      if(dict.has(key('ByteRange'))||dict.has(key('DocMDP'))||dict.has(key('UR3'))||name('Type')==='/Sig'||name('FT')==='/Sig')throw new Error('This PDF contains a digital signature or certification. Page editing is disabled to avoid invalidating it.');
      if(dict.has(key('EmbeddedFiles'))||dict.has(key('EF'))||name('Type')==='/EmbeddedFile')throw new Error('This PDF has attached files. Page copies cannot preserve them yet. The original has not been changed.');
      for(const [,child]of dict.entries())scan(child,depth+1);
    }else if(value instanceof PDFArray)for(const child of value.asArray())scan(child,depth+1);
  }
  for(const [,object]of objects)scan(object);
}
export async function inspectPdf(bytes){
  if(!bytes?.length || bytes.length>MAX_BYTES)throw new Error('Choose a non-empty PDF under 100 MB.');
  let doc;
  try{doc=await PDFDocument.load(bytes,{updateMetadata:false,throwOnInvalidObject:true});}
  catch(e){if(e.message?.includes('encrypted'))throw new Error('Page editing for password-protected PDFs is not supported yet. Read the file using its password; the original stays protected.');throw new Error('This PDF cannot be safely opened for page editing. It may be damaged or have the wrong file ending. Try getting a new copy.');}
  if(doc.isEncrypted)throw new Error('Encrypted PDFs cannot be edited in this build.');
  if(doc.getPageCount()>MAX_PAGES)throw new Error('Page operations support up to 500 pages.');
  if(doc.catalog.get(PDFName.of('AcroForm')))throw new Error('This PDF contains forms or signatures. Page editing is disabled to avoid losing or invalidating them.');
  requireSafePageCopy(doc);
  return {pages:doc.getPages().map((p,index)=>{const media=p.getMediaBox(),crop=p.getCropBox(),rotation=((p.getRotation().angle%360)+360)%360;const unit=doc.context.lookup(p.node.get(PDFName.of('UserUnit')));if(unit&&unit.asNumber?.()!==1)throw new Error('Page editing with nonstandard PDF user units is not supported yet.');visibleBox(media,crop);if(![0,90,180,270].includes(rotation))throw new Error('This page has an unsupported rotation.');return {index,rotation,width:p.getWidth(),height:p.getHeight(),media,crop};}),annotationPages:doc.getPages().filter(p=>{const value=p.node.get(PDFName.of('Annots'));if(!value)return false;const annotations=doc.context.lookup(value);return !(annotations instanceof PDFArray)||annotations.size()>0;}).length};
}
export async function splitPdf(sources,plan,groups,progress=()=>{}){
 validateGroups(groups,plan?.length);
 const organized=await organizePdf(sources,plan,progress),source=await PDFDocument.load(organized.bytes,{updateMetadata:false,throwOnInvalidObject:true}),parts=[];let size=0;
 for(let i=0;i<groups.length;i++){
  const doc=await PDFDocument.create();doc.setProducer('PDFix');doc.setCreator('PDFix local split workspace');const copied=await doc.copyPages(source,groups[i]);for(const page of copied)doc.addPage(page);const bytes=await doc.save();size+=bytes.length;if(size>MAX_BYTES)throw new Error('The split files exceed the combined 100 MB output limit. Use fewer parts or smaller inputs.');
  const verified=await PDFDocument.load(bytes,{updateMetadata:false,throwOnInvalidObject:true});if(verified.getPageCount()!==groups[i].length)throw new Error('A split file failed verification. Nothing was saved.');
  const geometry=groups[i].map(index=>organized.geometry[index]);verified.getPages().forEach((page,index)=>{const box=visibleBox(page.getMediaBox(),page.getCropBox()),rotation=page.getRotation().angle,dimensions=rotation%180?[box.height,box.width]:[box.width,box.height];if(Math.abs(dimensions[0]-geometry[index].width)>.01||Math.abs(dimensions[1]-geometry[index].height)>.01)throw new Error('A split page has unexpected geometry. Nothing was saved.');});
  parts.push({bytes,pageCount:groups[i].length,positions:[...groups[i]],geometry});progress({stage:'Verifying split files',current:i+1,total:groups.length});
 }
 return {parts,size,pageCount:groups.reduce((n,g)=>n+g.length,0)};
}
export async function organizePdf(sources,plan,progress=()=>{}){
  if(!Array.isArray(sources)||!sources.length||sources.length>10)throw new Error('Choose between 1 and 10 source PDFs.');
  if(sources.reduce((n,s)=>n+s.bytes.length,0)>MAX_BYTES)throw new Error('The combined inputs exceed the 100 MB session limit.');
  if(!Array.isArray(plan)||!plan.length||plan.length>MAX_PAGES)throw new Error('Keep between 1 and 500 pages in the output.');
  const docs=[],infos=[];let removedAnnotations=false;
  for(let i=0;i<sources.length;i++){
    const info=await inspectPdf(sources[i].bytes);infos.push(info);removedAnnotations ||= info.annotationPages>0;
    const doc=await PDFDocument.load(sources[i].bytes,{updateMetadata:false,throwOnInvalidObject:true});
    // Fresh catalog; no imported bookmarks, attachments, actions or metadata.
    for(const page of doc.getPages()){page.node.delete(PDFName.of('Annots'));page.node.delete(PDFName.of('AA'));}
    docs.push(doc);progress({stage:'Reading inputs',current:i+1,total:sources.length});
  }
  const result=await PDFDocument.create();result.setProducer('PDFix');result.setCreator('PDFix local page workspace');
  const geometry=[];
  for(let i=0;i<plan.length;i++){
    const row=plan[i],source=docs[row.source];
    if(!Number.isInteger(row.source)||!source||!Number.isInteger(row.index)||row.index<0||row.index>=source.getPageCount()||![0,90,180,270].includes(row.turn))throw new Error('A page selection or rotation is invalid. Reset the page list and try again.');
    const g=pageGeometry(infos[row.source].pages[row.index],row);geometry.push(g);
    if(g.paper){
      const original=source.getPage(row.index),page=result.addPage(g.paper),b=g.cropped;
      // Blank pages have no contents to embed. Keep them blank at the requested size.
      if(original.node.Contents()){
        const [copied]=await result.copyPages(source,[row.index]);const embedded=await result.embedPage(copied,{left:b.x,bottom:b.y,right:b.x+b.width,top:b.y+b.height});
        // Keep page transparency-group semantics when turning artwork into a Form XObject.
        const group=copied.node.get(PDFName.of('Group'));if(group){await embedded.embed();result.context.lookup(embedded.ref).dict.set(PDFName.of('Group'),group);}
        page.drawPage(embedded,{x:g.x+([180,270].includes(g.rotation)?g.width*g.scale:0),y:g.y+([90,180].includes(g.rotation)?g.height*g.scale:0),width:b.width*g.scale,height:b.height*g.scale,rotate:degrees(-g.rotation)});
      }
    }else{
      const [page]=await result.copyPages(source,[row.index]);page.setRotation(degrees(g.rotation));if(row.crop){const b=g.cropped;for(const name of ['setCropBox','setBleedBox','setTrimBox','setArtBox'])page[name](b.x,b.y,b.width,b.height);}result.addPage(page);
    }
    progress({stage:'Building copy',current:i+1,total:plan.length});
  }
  const bytes=await result.save();if(bytes.length>MAX_BYTES)throw new Error('The output exceeds the 100 MB save limit. Keep fewer pages.');
  const verified=await PDFDocument.load(bytes);if(verified.getPageCount()!==plan.length)throw new Error('Output verification failed. No copy was saved.');
  verified.getPages().forEach((page,index)=>{const g=geometry[index],box=visibleBox(page.getMediaBox(),page.getCropBox()),rotation=page.getRotation().angle,dimensions=rotation%180?[box.height,box.width]:[box.width,box.height];if(dimensions.some((n,i)=>Math.abs(n-g.viewport[i])>.01)||rotation!==(g.paper?0:g.rotation))throw new Error('Output page geometry verification failed. No copy was saved.');});
  return {bytes,pageCount:plan.length,removedAnnotations,geometry:geometry.map(g=>({width:g.viewport[0],height:g.viewport[1]}))};
}
