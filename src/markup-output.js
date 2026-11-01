import {inkOutline} from './markup-pressure.js';
import {PDFDocument,PDFName,PDFDict,PDFArray,PDFRef,PDFStream,PDFHexString,PDFNumber,StandardFonts,pushGraphicsState,popGraphicsState,setGraphicsState,setFillingRgbColor,setStrokingRgbColor,setLineWidth,setLineCap,moveTo,lineTo,appendBezierCurve,closePath,fill,stroke,rectangle,beginText,endText,setFontAndSize,setTextMatrix,showText,concatTransformationMatrix,translate,drawObject} from 'pdf-lib';
import {validateMarks,inkStyle,highlightOpacity,MARKUP_COLORS,markupArrowHead,markupCloudPath} from './markup-model.js';
const name=PDFName.of,MAX_BYTES=100*1024*1024;
const subtypes={highlight:'Highlight',underline:'Underline',note:'Text',text:'FreeText',ink:'Ink',line:'Line',arrow:'Line',cloud:'Square',callout:'FreeText'};
const str=(dict,key)=>{const value=dict.context.lookup(dict.get(name(key)));return value&&typeof value.decodeText==='function'?value.decodeText():'';};
const nums=(dict,key)=>{const value=dict.lookupMaybe(name(key),PDFArray);return value?[...value.asArray()].map(n=>dict.context.lookup(n,PDFNumber).asNumber()):null;};
const same=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((n,i)=>Math.abs(n-b[i])<.001);
async function load(bytes){
  if(!bytes?.length||bytes.length>MAX_BYTES)throw new Error('Markup needs a non-empty PDF under 100 MB.');
  let doc;try{doc=await PDFDocument.load(bytes,{updateMetadata:false,throwOnInvalidObject:true});}catch{throw new Error('Markup cannot open this PDF safely. Protected PDFs need an owner-authorized unrestricted copy; damaged PDFs need repair.');}
  if(doc.isEncrypted)throw new Error('Markup writing for encrypted PDFs is not supported yet.');
  if(doc.getPageCount()>500)throw new Error('Markup supports up to 500 PDF pages.');
  if(doc.catalog.get(name('Perms')))throw new Error('This PDF has document certification or permission controls. Markup is disabled to avoid invalidating them.');
  const objects=doc.context.enumerateIndirectObjects();if(objects.length>100000)throw new Error('This PDF has too many objects for safe markup editing.');
  const seen=new WeakSet();let visited=0;
  function signatureSafety(value,depth=0){
    if(depth>80||++visited>300000)throw new Error('This PDF is too complex for safe markup editing.');
    if(value instanceof PDFRef||!value||typeof value!=='object'||seen.has(value))return;seen.add(value);
    const dict=value instanceof PDFStream?value.dict:value;
    if(dict instanceof PDFDict){
      if(dict.has(name('ByteRange'))||dict.has(name('DocMDP'))||dict.has(name('UR3'))||String(doc.context.lookup(dict.get(name('Type'))))==='/Sig'||String(doc.context.lookup(dict.get(name('FT'))))==='/Sig')throw new Error('This PDF has a signature or signature field. Markup is disabled to avoid invalidating it.');
      for(const [,child]of dict.entries())signatureSafety(child,depth+1);
    }else if(value instanceof PDFArray)for(const child of value.asArray())signatureSafety(child,depth+1);
  }
  for(const [,object]of objects)signatureSafety(object);
  const form=doc.catalog.lookupMaybe(name('AcroForm'),PDFDict);if(form?.get(name('XFA')))throw new Error('Dynamic XFA forms are unsupported for markup. Obtain a regular PDF copy first.');
  return doc;
}
function pageInfo(doc){return doc.getPages().map(page=>{
  const crop=page.getCropBox(),media=page.getMediaBox(),box=[Math.max(crop.x,media.x),Math.max(crop.y,media.y),Math.min(crop.x+crop.width,media.x+media.width),Math.min(crop.y+crop.height,media.y+media.height)];
  if(!box.every(Number.isFinite)||box[2]<=box[0]||box[3]<=box[1])throw new Error('A visible page boundary is invalid.');return {box,rotation:((page.getRotation().angle%360)+360)%360};
});}
async function appearanceDigest(stream,record){const dictionary=stream.dict.clone(stream.dict.context);dictionary.delete(name('Length'));const prefix=new TextEncoder().encode(dictionary.toString()+'\n'+JSON.stringify(record)+'\n'),contents=stream.getContents(),input=new Uint8Array(prefix.length+contents.length);input.set(prefix);input.set(contents,prefix.length);return [...new Uint8Array(await crypto.subtle.digest('SHA-256',input))].map(value=>value.toString(16).padStart(2,'0')).join('');}
async function entries(doc,pages){
  const managed=[],seen=new Set();let foreign=0;
  const allPages=doc.getPages();for(let index=0;index<allPages.length;index++){const page=allPages[index];
    const annots=page.node.lookupMaybe(name('Annots'),PDFArray);if(!annots)continue;
    if(annots.size()>2000)throw new Error('This page has too many annotations for safe markup editing.');
    for(const ref of annots.asArray()){
      const dict=doc.context.lookup(ref,PDFDict);let record=null,apRef=null;
      try{
        const raw=str(dict,'PDFixData');if(raw&&raw.length<=65536&&dict.lookupMaybe(name('PDFixVersion'),PDFNumber)?.asNumber()===1){
          const candidate=JSON.parse(raw);if(candidate.page!==index)throw new Error('page');record=validateMarks([candidate],pages)[0];
          if(!(ref instanceof PDFRef)||str(dict,'NM')!==record.id||String(doc.context.lookup(dict.get(name('Subtype'))))!=='/'+subtypes[record.kind]||str(dict,'Contents')!==record.text||!same(nums(dict,'Rect'),record.rect)||!same(nums(dict,'C'),MARKUP_COLORS[record.color]))throw new Error('changed');
          if(record.kind==='highlight'&&(dict.lookupMaybe(name('CA'),PDFNumber)?.asNumber()??1)!==highlightOpacity(record))throw new Error('changed highlighter opacity');
          if(record.kind==='ink'){
            const strokes=dict.lookupMaybe(name('InkList'),PDFArray),stroke=strokes?.size()===1?strokes.lookup(0,PDFArray):null;
            const path=stroke?.asArray().map(value=>doc.context.lookup(value,PDFNumber).asNumber());
            if(!same(path,record.path)||dict.lookupMaybe(name('BS'),PDFDict)?.lookupMaybe(name('W'),PDFNumber)?.asNumber()!==inkStyle(record).width||(dict.lookupMaybe(name('CA'),PDFNumber)?.asNumber()??1)!==inkStyle(record).opacity)throw new Error('changed ink');
          }
          if(['highlight','underline'].includes(record.kind)&&!same(nums(dict,'QuadPoints'),record.quads))throw new Error('changed');if(['line','arrow'].includes(record.kind)&&(!same(nums(dict,'L'),record.path)||dict.lookup(name('LE'),PDFArray).asArray().map(String).join(',')!==(record.kind==='arrow'?'/None,/OpenArrow':'/None,/None')))throw new Error('changed endpoints');if(record.kind==='cloud'){const be=dict.lookup(name('BE'),PDFDict),inset=markupCloudPath(record.rect).inset;if(String(be.get(name('S')))!=='/C'||be.lookup(name('I'),PDFNumber).asNumber()!==1.5||!same(nums(dict,'RD'),[inset,inset,inset,inset]))throw new Error('changed cloud');}if(record.kind==='callout'&&(!same(nums(dict,'CL'),record.path)||String(dict.get(name('IT')))!=='/FreeTextCallout'||String(dict.get(name('LE')))!=='/OpenArrow'||!same(nums(dict,'RD'),calloutInsets(record))))throw new Error('changed callout');
          const flags=dict.lookupMaybe(name('F'),PDFNumber)?.asNumber()||0;if(flags&(64|128|512))throw new Error('locked');
          const ap=dict.lookupMaybe(name('AP'),PDFDict);apRef=ap?.get(name('N'));const stream=doc.context.lookup(apRef,PDFStream);if(!(apRef instanceof PDFRef)||str(stream.dict,'PDFixOwner')!==record.id)throw new Error('appearance');const digest=str(dict,'PDFixAppearanceDigest');if(record.inkPressure&&!digest)throw new Error('pressure appearance provenance missing');if(digest&&(!/^[a-f0-9]{64}$/.test(digest)||await appearanceDigest(stream,record)!==digest))throw new Error('changed appearance');
        }
      }catch{record=null;}
      if(record){if(seen.has(record.id))throw new Error('Duplicate PDFix annotation identities need repair before editing.');seen.add(record.id);managed.push({record,ref,apRef,page:index});}else foreign++;
    }
  }
  validateMarks(managed.map(entry=>entry.record),pages);return {managed,foreign};
}
function referencedObjects(doc){
  const refs=new Set(),seen=new WeakSet();let count=0;
  const visit=(object,depth)=>{
    if(object instanceof PDFRef){refs.add(object.toString());return;}
    if(!object||typeof object!=='object'||seen.has(object))return;seen.add(object);
    if(depth>64||++count>200000)throw new Error('This PDF is too complex for safe annotation replacement.');
    if(object instanceof PDFArray)object.asArray().forEach(value=>visit(value,depth+1));
    else if(object instanceof PDFDict)object.entries().forEach(([,value])=>visit(value,depth+1));
    else if(object instanceof PDFStream)visit(object.dict,depth+1);
  };
  for(const [,object]of doc.context.enumerateIndirectObjects())visit(object,0);return refs;
}
function stripManaged(doc,managed){
  const ids=new Set(managed.map(entry=>entry.ref.toString()));
  for(const page of doc.getPages()){
    const annots=page.node.lookupMaybe(name('Annots'),PDFArray);if(annots)page.node.set(name('Annots'),doc.context.obj(annots.asArray().filter(ref=>!ids.has(ref.toString()))));
  }
  const references=referencedObjects(doc);
  if(managed.some(entry=>references.has(entry.ref.toString())))throw new Error('Existing replies or shared references point to a PDFix markup. Editing it here could lose review structure; use a fuller annotation editor.');
  for(const entry of managed)doc.context.delete(entry.ref);
  const remaining=referencedObjects(doc);for(const entry of managed)if(!remaining.has(entry.apRef.toString()))doc.context.delete(entry.apRef);
}
export async function inspectMarkupPdf(bytes){
  const doc=await load(bytes),pages=pageInfo(doc),info=await entries(doc,pages);stripManaged(doc,info.managed);
  const baseline=await doc.save({updateFieldAppearances:false});
  return {bytes:baseline,pages,marks:info.managed.map(entry=>entry.record),foreign:info.foreign,pageCount:pages.length};
}
function textLines(text,font,size,width,height){
  if(!text.trim())throw new Error('Add text to every text box before previewing.');
  const lines=[];
  for(const paragraph of text.split(/\r\n?|\n/)){
    let line='';for(const word of paragraph.split(/\s+/).filter(Boolean)){
      if(font.widthOfTextAtSize(word,size)>width)throw new Error('A word does not fit its text box. Make the box wider or reduce the font size.');
      const next=line?line+' '+word:word;if(font.widthOfTextAtSize(next,size)>width){lines.push(line);line=word;}else line=next;
    }lines.push(line);
  }
  if(lines.length*size*1.25>height)throw new Error('Text does not fit its box. Make it taller or reduce the font size.');return lines;
}
const calloutInsets=mark=>[mark.textRect[0]-mark.rect[0],mark.rect[3]-mark.textRect[3],mark.rect[2]-mark.textRect[2],mark.textRect[1]-mark.rect[1]];
function appearance(doc,mark,font){
  const ctx=doc.context,[left,bottom,right,top]=mark.rect,w=right-left,h=top-bottom,c=MARKUP_COLORS[mark.color];
  const operators=[pushGraphicsState()],resources={};
  if(mark.kind==='highlight'){
    resources.ExtGState={GS0:{Type:'ExtGState',ca:highlightOpacity(mark),CA:highlightOpacity(mark),BM:'Multiply'}};operators.push(setGraphicsState('GS0'),setFillingRgbColor(...c));
    for(let i=0;i<mark.quads.length;i+=8){const q=mark.quads.slice(i,i+8);operators.push(moveTo(q[0]-left,q[1]-bottom),lineTo(q[2]-left,q[3]-bottom),lineTo(q[6]-left,q[7]-bottom),lineTo(q[4]-left,q[5]-bottom),closePath(),fill());}
  }else if(mark.kind==='underline'){
    operators.push(setStrokingRgbColor(...c),setLineWidth(1.5),setLineCap(1));for(let i=0;i<mark.quads.length;i+=8)operators.push(moveTo(mark.quads[i+4]-left,mark.quads[i+5]-bottom),lineTo(mark.quads[i+6]-left,mark.quads[i+7]-bottom),stroke());
  }else if(['ink','line','arrow','callout'].includes(mark.kind)){
    if(mark.kind==='ink'){const style=inkStyle(mark);resources.ExtGState={GSInk:{Type:'ExtGState',ca:style.opacity,CA:style.opacity}};operators.push(setGraphicsState('GSInk'));}
    const outline=mark.kind==='ink'?inkOutline(mark):null;if(outline){operators.push(setFillingRgbColor(...c),moveTo(outline[0]-left,outline[1]-bottom));for(let i=2;i<outline.length;i+=2)operators.push(lineTo(outline[i]-left,outline[i+1]-bottom));operators.push(closePath(),fill());}
    else operators.push(setStrokingRgbColor(...c),setLineWidth(mark.kind==='ink'?inkStyle(mark).width:2),setLineCap(1),moveTo(mark.path[0]-left,mark.path[1]-bottom));if(!outline)for(let i=2;i<mark.path.length;i+=2)operators.push(lineTo(mark.path[i]-left,mark.path[i+1]-bottom));if(!outline)operators.push(stroke());if(['arrow','callout'].includes(mark.kind)){const head=markupArrowHead(mark.path,mark.kind==='callout');operators.push(moveTo(head[0]-left,head[1]-bottom),lineTo(head[2]-left,head[3]-bottom),lineTo(head[4]-left,head[5]-bottom),stroke());}if(mark.kind==='callout')drawTextAppearance(mark.textRect);
  }else if(mark.kind==='cloud'){const cloud=markupCloudPath(mark.rect);operators.push(setStrokingRgbColor(...c),setLineWidth(2),setLineCap(1),moveTo(cloud.start[0]-left,cloud.start[1]-bottom));for(const curve of cloud.curves)operators.push(appendBezierCurve(...curve.map((value,index)=>value-(index%2?bottom:left))));operators.push(closePath(),stroke());
  }else if(mark.kind==='note'){
    operators.push(setFillingRgbColor(...c),rectangle(1,1,Math.max(.1,w-2),Math.max(.1,h-2)),fill(),setStrokingRgbColor(.1,.2,.25),setLineWidth(1),rectangle(1,1,Math.max(.1,w-2),Math.max(.1,h-2)),stroke(),moveTo(w*.25,h*.7),lineTo(w*.75,h*.7),moveTo(w*.25,h*.45),lineTo(w*.65,h*.45),stroke());
  }else drawTextAppearance(mark.rect);
  function drawTextAppearance(box){
    const width=box[2]-box[0],height=box[3]-box[1],x=box[0]-left,y=box[1]-bottom,vertical=mark.rotation===90||mark.rotation===270,tw=vertical?height:width,th=vertical?width:height;
    let lines;try{lines=textLines(mark.text,font,mark.fontSize,tw-8,th-8);}catch(error){if(error.message.includes('WinAnsi'))throw new Error('Text boxes and callouts currently use a Western font. Use a note for other scripts.');throw error;}
    resources.Font={F0:font.ref};operators.push(pushGraphicsState(),translate(x,y),setFillingRgbColor(1,1,1),rectangle(0,0,width,height),fill());if(mark.kind==='callout')operators.push(setStrokingRgbColor(...c),setLineWidth(1.5),rectangle(.75,.75,width-1.5,height-1.5),stroke());
    const matrix=mark.rotation===90?[0,1,-1,0,width,0]:mark.rotation===180?[-1,0,0,-1,width,height]:mark.rotation===270?[0,-1,1,0,0,height]:[1,0,0,1,0,0];
    operators.push(concatTransformationMatrix(...matrix),beginText(),setFillingRgbColor(...c),setFontAndSize('F0',mark.fontSize));for(let i=0;i<lines.length;i++)operators.push(setTextMatrix(1,0,0,1,4,th-4-mark.fontSize-i*mark.fontSize*1.25),showText(font.encodeText(lines[i])));operators.push(endText(),popGraphicsState());
  }
  operators.push(popGraphicsState());
  return ctx.register(ctx.formXObject(operators,{BBox:[0,0,w,h],Resources:resources,PDFixOwner:PDFHexString.fromText(mark.id)}));
}
export async function markedPdf(bytes,marks,flatten=false,progress=()=>{}){
  if(typeof flatten!=='boolean')throw new Error('Choose an explicit annotation output mode.');
  const doc=await load(bytes),pages=pageInfo(doc),records=validateMarks(marks,pages),source=await entries(doc,pages);stripManaged(doc,source.managed);
  const font=records.some(mark=>['text','callout'].includes(mark.kind))?await doc.embedFont(StandardFonts.Helvetica):null,expected=[],appearances=[];
  for(let i=0;i<records.length;i++){
    const mark=records[i],page=doc.getPage(mark.page),ap=appearance(doc,mark,font);appearances.push({ref:ap,owner:mark.id,bytes:Uint8Array.from(doc.context.lookup(ap,PDFStream).getContents())});
    if(flatten&&mark.kind!=='note'){const key=page.node.newXObject('PDFixMarkup',ap);page.pushOperators(pushGraphicsState(),translate(mark.rect[0],mark.rect[1]),drawObject(key),popGraphicsState());}
    else{
      const ctx=doc.context,dict=ctx.obj({Type:'Annot',Subtype:subtypes[mark.kind],Rect:mark.rect,P:page.ref,NM:PDFHexString.fromText(mark.id),Contents:PDFHexString.fromText(mark.text),T:PDFHexString.fromText('PDFix'),F:4,C:MARKUP_COLORS[mark.color],AP:{N:ap},PDFixVersion:1,PDFixData:PDFHexString.fromText(JSON.stringify(mark))});
      dict.set(name('PDFixAppearanceDigest'),PDFHexString.fromText(await appearanceDigest(ctx.lookup(ap,PDFStream),mark)));
      if(['highlight','underline'].includes(mark.kind)){dict.set(name('QuadPoints'),ctx.obj(mark.quads));dict.set(name('CA'),PDFNumber.of(mark.kind==='highlight'?highlightOpacity(mark):1));}
      if(mark.kind==='ink'){dict.set(name('InkList'),ctx.obj([mark.path]));dict.set(name('BS'),ctx.obj({W:inkStyle(mark).width}));dict.set(name('CA'),PDFNumber.of(inkStyle(mark).opacity));}
      if(mark.kind==='note'){dict.set(name('Name'),name('Note'));dict.set(name('Open'),ctx.obj(false));}
      if(['line','arrow'].includes(mark.kind)){dict.set(name('L'),ctx.obj(mark.path));dict.set(name('LE'),ctx.obj(['None',mark.kind==='arrow'?'OpenArrow':'None']));dict.set(name('BS'),ctx.obj({W:2,S:'S'}));}
      if(mark.kind==='cloud'){const inset=markupCloudPath(mark.rect).inset;dict.set(name('BE'),ctx.obj({S:'C',I:1.5}));dict.set(name('BS'),ctx.obj({W:2,S:'S'}));dict.set(name('RD'),ctx.obj([inset,inset,inset,inset]));}
      if(mark.kind==='callout'){dict.set(name('IT'),name('FreeTextCallout'));dict.set(name('CL'),ctx.obj(mark.path));dict.set(name('LE'),name('OpenArrow'));dict.set(name('RD'),ctx.obj(calloutInsets(mark)));dict.set(name('BS'),ctx.obj({W:2,S:'S'}));}
      if(['text','callout'].includes(mark.kind)){dict.set(name('DA'),PDFHexString.fromText(`/F0 ${mark.fontSize} Tf ${MARKUP_COLORS[mark.color].join(' ')} rg`));dict.set(name('Q'),PDFNumber.of(0));dict.set(name('Rotate'),PDFNumber.of(mark.rotation));}
      const annotationRef=ctx.register(dict);page.node.addAnnot(annotationRef);expected.push({id:`${annotationRef.objectNumber}R${annotationRef.generationNumber||''}`,page:mark.page,subtype:subtypes[mark.kind],text:mark.text,rect:mark.rect,kind:mark.kind,path:mark.path,...(mark.kind==='ink'?{inkWidth:inkStyle(mark).width,inkOpacity:inkStyle(mark).opacity}:mark.kind==='highlight'?{highlightOpacity:highlightOpacity(mark)}:{})});
    }
    progress({stage:'Building markup copy',current:i+1,total:records.length});
  }
  const output=await doc.save({updateFieldAppearances:false});if(output.length>MAX_BYTES)throw new Error('The markup output exceeds the 100 MB save limit.');
  const reopened=await PDFDocument.load(output,{updateMetadata:false,throwOnInvalidObject:true});if(reopened.getPageCount()!==pages.length)throw new Error('Markup output page-count verification failed.');
  const actual=await entries(reopened,pages);if(actual.foreign!==source.foreign||actual.managed.length!==expected.length)throw new Error('The reopened annotation count or foreign-mark count changed.');for(const {ref,owner,bytes:before}of appearances){const stream=reopened.context.lookup(ref,PDFStream),after=stream.getContents();if(str(stream.dict,'PDFixOwner')!==owner||before.length!==after.length||before.some((value,index)=>value!==after[index]))throw new Error('A generated markup appearance changed on reopening.');}
  return {bytes:output,pageCount:pages.length,expected,foreign:source.foreign,flattened:flatten?records.filter(mark=>mark.kind!=='note').length:0};
}
