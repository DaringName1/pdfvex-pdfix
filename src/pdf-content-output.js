import {layoutRichText,richFontName} from './pdf-content-rich-layout.js';
import {inspectPdfMetadata,writePdfMetadata} from './pdf-metadata.js';
import {PDFDocument,PDFName,PDFDict,PDFArray,PDFNumber,PDFRawStream,StandardFonts,rgb,pushGraphicsState,popGraphicsState,concatTransformationMatrix} from 'pdf-lib';
import {validateContent,contentPng,wrapContentText,CONTENT_FONTS} from './pdf-content-model.js';
import {originalText,replaceOriginalText,originalTextResources} from './pdf-original-text.js';
import {originalImages,replaceOriginalImages,originalImagePreview} from './pdf-original-images.js';
import {originalFontProof} from './pdf-original-font-proof.js';
import {imageDigest,verifyImagesOnPaths,createFormEditSession,sealFormEditSession} from './pdf-original-image-path.js';
const n=PDFName.of,MAX=100*1024*1024;
async function load(bytes){
  if(!bytes?.length||bytes.length>MAX)throw new Error('Choose a PDF under 100 MB.');let doc;try{doc=await PDFDocument.load(bytes,{updateMetadata:false,throwOnInvalidObject:true});}catch{throw new Error('This PDF cannot be edited here. Open an authorized unprotected copy, or obtain a fresh file.');}
  if(doc.isEncrypted||doc.getPageCount()>500||doc.catalog.get(n('Perms')))throw new Error('Protected/certified PDFs and more than 500 pages cannot be edited here.');
  const objects=doc.context.enumerateIndirectObjects();if(objects.length>100000)throw new Error('This PDF exceeds the supported object count.');
  for(const [,object]of objects)if(object instanceof PDFDict&&(object.get(n('ByteRange'))||String(doc.context.lookup(object.get(n('Type'))))==='/Sig'||String(doc.context.lookup(object.get(n('FT'))))==='/Sig'&&object.get(n('V'))))throw new Error('A digitally signed PDF needs an unsigned original for editing.');
  if(doc.catalog.lookupMaybe(n('AcroForm'),PDFDict)?.get(n('XFA')))throw new Error('Dynamic XFA forms need a regular PDF copy.');return doc;
}
function pagesOf(doc){return doc.getPages().map(page=>{
  const media=page.getMediaBox(),crop=page.getCropBox(),l=Math.max(media.x,crop.x),b=Math.max(media.y,crop.y),r=Math.min(media.x+media.width,crop.x+crop.width),t=Math.min(media.y+media.height,crop.y+crop.height),rotation=((page.getRotation().angle%360)+360)%360,unit=page.node.getInheritableAttribute(n('UserUnit'));
  if(unit&&doc.context.lookup(unit,PDFNumber).asNumber()!==1)throw new Error('Pages with a custom PDF user unit are not edited in this workspace yet.');
  if(![l,b,r,t].every(Number.isFinite)||r<=l||t<=b||r-l>14400||t-b>14400||![0,90,180,270].includes(rotation))throw new Error('A page has unsupported geometry.');
  return {box:[l,b,r,t],rotation,width:rotation%180?t-b:r-l,height:rotation%180?r-l:t-b};
});}
const transform=p=>{const [l,b,r,t]=p.box;return p.rotation===90?[0,1,-1,0,r,b]:p.rotation===180?[-1,0,0,-1,r,t]:p.rotation===270?[0,-1,1,0,l,t]:[1,0,0,1,l,b];};
function isolateAdditionPages(doc,objects){
  for(const index of new Set(objects.map(item=>item.page))){const page=doc.getPage(index),source=page.node.Resources(),resources=source?source.clone(doc.context):doc.context.obj({});for(const key of ['Font','XObject','ExtGState']){const dictionary=resources.lookupMaybe(n(key),PDFDict);if(dictionary)resources.set(n(key),dictionary.clone(doc.context));}page.node.set(n('Resources'),resources);const contents=page.node.Contents();if(contents instanceof PDFArray)page.node.set(n('Contents'),contents.clone(doc.context));const annotations=page.node.Annots();if(annotations instanceof PDFArray)page.node.set(n('Annots'),annotations.clone(doc.context));}
}
export async function inspectContentPdf(bytes){const doc=await load(bytes),sourceSha256=await imageDigest(bytes),text=await originalText(doc,sourceSha256),images=await originalImages(doc,sourceSha256);return {sourceSha256,metadata:inspectPdfMetadata(doc),pages:pagesOf(doc),pageCount:doc.getPageCount(),originalText:text.candidates.map(({id,page,text,font,size,encoding,sourceFont,formPath})=>({id,page,text,font,size,encoding,formPath,...(encoding==='source-unicode'?{glyphCount:sourceFont.observed.size,provenGlyphCount:sourceFont.expansion?.characters??0,additionalGlyphCount:[...(sourceFont.expansion?.proven?.keys?.()??[])].filter(character=>!sourceFont.observed.has(character)).length,glyphExpansionScope:sourceFont.expansion?.scope??null}:{})})),originalImages:images.images.map(({id,page,name,width,height,path,nested})=>({id,page,name,width,height,path,nested})),imageLimited:images.limited,textLimited:text.limited};}
export async function previewOriginalImage(bytes,id){return originalImagePreview(await load(bytes),id,await imageDigest(bytes));}
export async function contentPdf(bytes,draft,progress=()=>{}){
  const doc=await load(bytes),pages=pagesOf(doc);validateContent(draft,pages);const sourceSha256=draft.imageReplacements?.length||draft.replacements?.length?await imageDigest(bytes):null,originals=draft.imageReplacements?.length?(await originalImages(doc,sourceSha256)).images:[],fonts=new Map(),images=new Map(),inspection=draft.replacements?.length?await originalText(doc,sourceSha256):null,fontProofs=[],proved=new Set(),proofCache=new WeakMap();isolateAdditionPages(doc,draft.objects);let needsForms=!!draft.imageReplacements?.length;
  if(inspection){const candidates=new Map(inspection.candidates.map(item=>[item.id,item]));for(const edit of draft.replacements){const candidate=candidates.get(edit.id);if(!candidate)throw new Error('A source text run is no longer available.');if(candidate.formPath.length)needsForms=true;const key=JSON.stringify([candidate.page,candidate.formPath,candidate.fontResource]);if(proved.has(key))continue;proved.add(key);const font=originalTextResources(doc,candidate.page,candidate.formPath)?.lookupMaybe(n('Font'),PDFDict)?.lookupMaybe(n(candidate.fontResource),PDFDict);if(!font)throw new Error('A source text font is unavailable.');if(!proofCache.has(font))proofCache.set(font,await originalFontProof(doc,font));fontProofs.push({page:candidate.page,formPath:[...candidate.formPath],resource:candidate.fontResource,sha256:proofCache.get(font)});}}
  const formSession=needsForms?await createFormEditSession(doc):null,expected=inspection?await replaceOriginalText(doc,draft.replacements,inspection,formSession):[];
  for(const asset of draft.assets){const image=await doc.embedPng(contentPng(asset.data));images.set(asset.id,image);}
  if(draft.imageReplacements?.length){const imageChanges=await replaceOriginalImages(doc,draft.imageReplacements,originals,images,formSession);expected.push(...imageChanges.expected);}
  for(let index=0;index<draft.objects.length;index++){
    const item=draft.objects[index],info=pages[item.page],page=doc.getPage(item.page),x=item.left/100*info.width,width=item.width/100*info.width,height=item.height/100*info.height,y=info.height-item.top/100*info.height-height;
    page.pushOperators(pushGraphicsState(),concatTransformationMatrix(...transform(info)));
    if(item.type==='text'&&item.richText){
      for(const paragraph of item.richText)for(const run of paragraph.runs){const name=richFontName(run,item);if(!fonts.has(name))fonts.set(name,await doc.embedFont(name));}
      const layout=layoutRichText(item.richText,item,width,height,fonts),color=hex=>rgb(...[1,3,5].map(offset=>parseInt(hex.slice(offset,offset+2),16)/255));
      for(const line of layout.lines)for(const token of line.tokens){const baseline=y+height-token.y+(token.script==='super'?token.originalSize*.3:token.script==='sub'?-token.originalSize*.15:0),px=x+token.x;if(token.highlight)page.drawRectangle({x:px,y:baseline-token.size*.2,width:token.width,height:token.size*1.2,color:color(token.highlight)});page.drawText(token.text,{font:fonts.get(token.fontName),size:token.size,color:color(token.color),x:px,y:baseline});for(const [flag,offset]of [[token.underline,-.12],[token.strike,.3]])if(flag)page.drawLine({start:{x:px,y:baseline+token.size*offset},end:{x:px+token.width,y:baseline+token.size*offset},thickness:Math.max(.4,token.size/18),color:color(token.color)});}
      for(const paragraph of item.richText)for(const run of paragraph.runs)if(run.text.trim())expected.push({page:item.page,text:run.text.replace(/\s+/g,' ').trim()});
    }else if(item.type==='text'){
      if(!fonts.has(item.font))fonts.set(item.font,await doc.embedFont(CONTENT_FONTS[item.font]));const font=fonts.get(item.font);let lines;
      try{lines=wrapContentText(item.text,width,font,item.size);}catch(error){if(error.message.includes('WinAnsi'))throw new Error('This font supports Western text. Other scripts need an image or the document editor for now.');throw error;}
      if(lines.length*item.size*1.2>height+.001)throw new Error(`Text on page ${item.page+1} does not fit. Enlarge the box or reduce the font size.`);
      const color=rgb(...[1,3,5].map(offset=>parseInt(item.color.slice(offset,offset+2),16)/255));for(let line=0;line<lines.length;line++)if(lines[line])page.drawText(lines[line],{font,size:item.size,color,x,y:y+height-item.size-line*item.size*1.2});
      expected.push({page:item.page,text:lines.join(' ')});
    }else{const image=images.get(item.asset),scale=Math.min(width/image.width,height/image.height);page.drawImage(image,{x:x+(width-image.width*scale)/2,y:y+(height-image.height*scale)/2,width:image.width*scale,height:image.height*scale});expected.push({page:item.page,image:{ref:image.ref.toString(),width:image.width,height:image.height}});}
    page.pushOperators(popGraphicsState());progress({stage:'Adding page content',current:index+1,total:draft.objects.length});
  }
  writePdfMetadata(doc,draft.metadata??{});
  const imagePlan=formSession?await sealFormEditSession(formSession):null;
  const output=await doc.save({updateFieldAppearances:false});if(output.length>MAX)throw new Error('The edited PDF exceeds the 100 MB save limit.');const reopened=await load(output),actual=pagesOf(reopened);
  const metadata=inspectPdfMetadata(reopened);for(const [key,value]of Object.entries(draft.metadata??{}))if(metadata.values[key]!==value||metadata.unavailable.includes(key))throw new Error('An edited document property could not be reopened.');
  if(JSON.stringify(actual)!==JSON.stringify(pages))throw new Error('The edited copy changed page dimensions unexpectedly.');
  for(const proof of fontProofs){const font=originalTextResources(reopened,proof.page,proof.formPath)?.lookupMaybe(n('Font'),PDFDict)?.lookupMaybe(n(proof.resource),PDFDict);if(!font||await originalFontProof(reopened,font)!==proof.sha256)throw new Error('The original source font or glyph mappings changed while saving. No edited copy was approved.');}
  if(imagePlan)await verifyImagesOnPaths(reopened,imagePlan);
  for(const item of expected){if(!item.image||item.resourcePath)continue;const page=reopened.getPage(item.page),resources=page.node.Resources(),objects=resources.lookupMaybe(n('XObject'),PDFDict);const found=objects?.entries().some(([,ref])=>{if(ref.toString()!==item.image.ref)return false;const stream=reopened.context.lookup(ref,PDFRawStream);return stream.dict.lookup(n('Width'),PDFNumber).asNumber()===item.image.width&&stream.dict.lookup(n('Height'),PDFNumber).asNumber()===item.image.height;});if(!found)throw new Error('An added image could not be reopened in the copy.');}
  return {bytes:output,pageCount:pages.length,pages,expected,metadata:draft.metadata??{}};
}
