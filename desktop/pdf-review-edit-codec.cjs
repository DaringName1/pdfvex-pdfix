const {danglingDestination}=require('./pdf-preserved-destinations.cjs');
const {EncryptedPDFError,PDFDocument,PDFDict,PDFArray,PDFRef,PDFName,PDFHexString,PDFString,PDFNumber,PDFRawStream,PDFInvalidObject}=require('pdf-lib');
const PDFWriter=require('pdf-lib/cjs/core/writers/PDFWriter.js').default;
const {createHash,randomUUID}=require('node:crypto');
const {inspectReview}=require('./pdf-review-codec.cjs');
const {canonicalJSON,validReviewReport}=require('./pdf-review-validation.cjs');
const {MAX_BYTES,hash,validReviewEditDraft,validReviewEditResult}=require('./pdf-review-edit-validation.cjs');
const {buildFreeTextAppearance}=require('./pdf-review-freetext.cjs');
const key=PDFName.of,COMMENT_TYPES=new Set(['Text','FreeText','Highlight','Underline','Squiggly','StrikeOut','Ink','Square','Circle','Polygon','PolyLine','Line','Stamp','Caret']);
function fail(message){throw new Error(message);}
function refKey(ref){if(!(ref instanceof PDFRef))fail('A review target is not an indirect PDF object.');return 'ref:'+ref.objectNumber+':'+ref.generationNumber;}
function refFromKey(value){const [,object,generation]=value.split(':');return PDFRef.of(Number(object),Number(generation));}
function graph(doc){
 const context=doc.context,objects=context.enumerateIndirectObjects();if(objects.length>100000)fail('The PDF exceeds the 100,000-object review editing limit.');
 const stack=objects.map(([,value])=>({value,depth:0})),seen=new WeakSet(),refs=new Set();let nodes=0;
 const resolve=value=>{if(!(value instanceof PDFRef))return value;const found=context.lookup(value);if(!found)fail('An unresolved source reference cannot be preserved by this review edit.');return found;};
 const get=(dict,name)=>resolve(dict.get(key(name))),name=value=>value instanceof PDFName?value.decodeText():'';
 while(stack.length){let {value,depth}=stack.pop();if(++nodes>300000)fail('The PDF exceeds the 300,000-node review editing traversal limit.');if(value instanceof PDFRef){const id=value.toString();if(refs.has(id))continue;refs.add(id);value=resolve(value);depth=0;}if(!value||typeof value!=='object'||seen.has(value))continue;if(depth>80)fail('The PDF exceeds the 80-level direct-object nesting limit.');seen.add(value);
  if(value instanceof PDFInvalidObject)fail('Malformed source objects cannot be preserved safely.');
  if(value instanceof PDFNumber&&(!Number.isFinite(value.asNumber())||Math.abs(value.asNumber())>1e15))fail('An unsupported source number cannot be rewritten safely.');
  if(value instanceof PDFRawStream){stack.push({value:value.dict,depth:depth+1});continue;}
  if(value instanceof PDFDict){if(value.has(key('ByteRange'))||name(get(value,'Type'))==='Sig'||name(get(value,'FT'))==='Sig'||value.has(key('DocMDP'))||value.has(key('UR3')))fail('Signature-bearing or certified PDFs cannot have review comments edited here. Certificate validity is not checked.');if(value.has(key('XFA')))fail('XFA PDFs cannot have review comments edited here.');for(const [,child]of value.entries())stack.push({value:child,depth:depth+1});}
  else if(value instanceof PDFArray){if(value.size()>100000)fail('An oversized source array cannot be preserved safely.');const first=danglingDestination(value,context)?1:0;for(let i=first;i<value.size();i++)stack.push({value:value.get(i),depth:depth+1});}
 }
 return {resolve,get,name};
}
async function load(bytes){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>MAX_BYTES)fail('Choose a PDF under 100 MB.');
 let doc;try{doc=await PDFDocument.load(bytes,{updateMetadata:false,throwOnInvalidObject:true,capNumbers:false});}catch(error){if(error instanceof EncryptedPDFError||error?.message===new EncryptedPDFError().message)fail('This password-protected PDF cannot be edited here. Use an authorized unprotected copy.');throw error;}
 if(doc.isEncrypted||doc.context.trailerInfo.Encrypt)fail('This password-protected PDF cannot be edited here. Use an authorized unprotected copy.');
 if(doc.catalog.has(key('Perms')))fail('This PDF declares permission or certification constraints. Review editing is unavailable.');
 if(doc.getPageCount()<1||doc.getPageCount()>500)fail('Use a PDF with 1–500 physical pages.');return doc;
}
function fingerprint(value,excluded=[]){
 const digest=createHash('sha256');
 if(value instanceof PDFRawStream){const dict=value.dict.clone(value.dict.context);for(const field of excluded)dict.delete(key(field));digest.update(dict.toString());digest.update(value.contents);}
 else if(value instanceof PDFDict){const dict=value.clone(value.context);for(const field of excluded)dict.delete(key(field));digest.update(dict.toString());}
 else digest.update(value.toString());return digest.digest('hex');
}
function geometry(doc){return doc.getPages().map(page=>({media:page.getMediaBox(),crop:page.getCropBox(),bleed:page.getBleedBox(),trim:page.getTrimBox(),art:page.getArtBox(),rotation:page.getRotation().angle,userUnit:page.node.getInheritableAttribute(key('UserUnit'))?.toString()||'1'}));}
function trailer(doc){return ['Root','Info','Encrypt','ID'].map(field=>[field,doc.context.trailerInfo[field]?.toString()??null]);}
function noteRectangle(page,parent,g){
 const media=page.getMediaBox(),crop=page.getCropBox();for(const box of [media,crop])if(!['x','y','width','height'].every(field=>Number.isFinite(box[field]))||box.width<=0||box.height<=0||box.width>14400||box.height>14400||Math.abs(box.x)>1e6||Math.abs(box.y)>1e6)fail('The reply page has unsupported source geometry.');
 const unit=page.node.getInheritableAttribute(key('UserUnit')),resolved=unit?g.resolve(unit):null,rotation=((page.getRotation().angle%360)+360)%360;
 if(resolved&&(!(resolved instanceof PDFNumber)||resolved.asNumber()!==1)||![0,90,180,270].includes(rotation))fail('Replies require UserUnit 1 and right-angle page rotation. This source geometry needs another reviewed workflow.');
 const left=Math.max(media.x,crop.x),bottom=Math.max(media.y,crop.y),right=Math.min(media.x+media.width,crop.x+crop.width),top=Math.min(media.y+media.height,crop.y+crop.height);
 if(right-left<20||top-bottom<20||!parent.rect)fail('The parent comment needs a visible source rectangle on a page with room for its reply note.');
 const pleft=Math.max(left,parent.rect[0]),pbottom=Math.max(bottom,parent.rect[1]),pright=Math.min(right,parent.rect[2]),ptop=Math.min(top,parent.rect[3]);
 if(pright<=pleft||ptop<=pbottom)fail('The parent comment is outside the visible page box. Reply placement is unavailable.');
 const x=Math.max(left+2,Math.min((pleft+pright)/2-8,right-18)),y=Math.max(bottom+2,Math.min((pbottom+ptop)/2-8,top-18));return [x,y,x+16,y+16];
}
const NOTE_APPEARANCE=Buffer.from('q\n0.98 0.82 0.24 rg\n0.12 0.2 0.28 RG\n0.8 w\n1 4 m 1 14 l 15 14 l 15 4 l 8 4 l 4 1 l 4 4 l h B\n1 w\n4 11 m 12 11 l S\n4 8 m 10 8 l S\nQ\n','ascii');
function timestamp(){return 'D:'+new Date().toISOString().slice(0,19).replace(/[-T:]/g,'')+"+00'00'";}
function literal(dict,field,g){const value=g.get(dict,field);if(value===undefined)return '';if(!(value instanceof PDFString||value instanceof PDFHexString))fail('A review field is not literal PDF text.');return value.decodeText();}
async function writeReviewEdits(bytes,value){
 const draft=validReviewEditDraft(value),sourceSha256=hash(bytes),beforeInventory=await inspectReview(bytes,draft.pages);validReviewReport(beforeInventory,{sourceSha256,pages:draft.pages});
 if(beforeInventory.inventorySha256!==draft.inventorySha256)fail('The source review inventory changed. Inspect and review it again before building an edited copy.');
 const doc=await load(bytes),g=graph(doc),context=doc.context,pages=doc.getPages(),rows=new Map(beforeInventory.annotations.map(row=>[row.key,row]));
 if(beforeInventory.sourceAnnotationCount+draft.changes.filter(change=>change.kind==='reply').length>10000)fail('The edited copy would exceed 10,000 source annotations.');
 const targets=draft.changes.map(change=>{
  const id=change.kind==='comment'?change.key:change.parentKey,row=rows.get(id);
  if(!row||!row.objectRef||row.objectRef!==id||row.sharedOccurrences!==1)fail('Review editing requires a unique indirect annotation within the exact inspected source pages.');
  const ref=refFromKey(id),dict=g.resolve(ref);if(!(dict instanceof PDFDict)||dict.has(key('Type'))&&g.name(g.get(dict,'Type'))!=='Annot'||row.subtype!==g.name(g.get(dict,'Subtype')))fail('The exact source annotation target could not be verified.');
  if(change.kind==='comment'){
   if(!COMMENT_TYPES.has(row.subtype)||row.hasRichText&&!row.richTextEditable||dict.has(key('PDFixData'))||row.replyType==='Group')fail('This comment uses unsupported, rich-text, grouped or PDFix-managed content. Use the owning PDFix workspace; takeoffs can be recovered into the takeoff ledger.');
   if(row.readOnly||row.locked||row.lockedContents)fail('The source comment has read-only or lock flags. Its contents will not be changed.');
  }else if(!COMMENT_TYPES.has(row.subtype)&&row.subtype!=='FreeText'||row.readOnly)fail('This source annotation is not an eligible review reply parent. Read-only annotations and interactive fields/links/files are not reply targets.');
  return {change,row,ref,dict};
 });
 // PDFWriter updates raw stream Length. Normalize only that field before the
 // retained-object manifest; no stream payload or other stream field is changed.
 let normalizedStreamLengths=0;for(const [,object]of context.enumerateIndirectObjects())if(object instanceof PDFRawStream){if(object.dict.get(key('Length'))?.toString()!==String(object.contents.length))normalizedStreamLengths++;object.updateDict();}
 const originalObjects=context.enumerateIndirectObjects(),originalRefs=new Set(originalObjects.map(([ref])=>ref.toString())),modifiedRefs=new Set(targets.filter(target=>target.change.kind==='comment').map(target=>target.ref.toString())),replyPages=new Set(targets.filter(target=>target.change.kind==='reply').map(target=>target.row.page)),pageRefMap=new Map(pages.map((page,index)=>[page.ref.toString(),index+1]));
 const freeTextRefs=new Set(targets.filter(target=>target.change.kind==='comment'&&target.row.subtype==='FreeText').map(target=>target.ref.toString()));
 const richTextRefs=new Set(targets.filter(target=>target.change.kind==='comment'&&target.row.subtype==='FreeText'&&target.row.hasRichText).map(target=>target.ref.toString()));
 const manifest=new Map(originalObjects.map(([ref,object])=>{const excluded=[...(modifiedRefs.has(ref.toString())?['Contents','M']:[]),...(freeTextRefs.has(ref.toString())?['AP']:[]),...(richTextRefs.has(ref.toString())?['RC']:[]),...(replyPages.has(pageRefMap.get(ref.toString()))?['Annots']:[])];return [ref.toString(),{full:fingerprint(object),unchanged:fingerprint(object,excluded),excluded}];}));
 const geometryBefore=canonicalJSON(geometry(doc)),trailerBefore=canonicalJSON(trailer(doc)),originalPageAnnots=new Map(),appendedRefs=new Map(),changes=[],changedPages=new Set(),createdRefs=new Set(),createdAppearanceRefs=new Set(),createdFontRefs=new Set();
 for(const physical of replyPages){const page=pages[physical-1],array=g.get(page.node,'Annots');if(!(array instanceof PDFArray))fail('The parent page annotation array is unavailable.');originalPageAnnots.set(physical,Array.from({length:array.size()},(_,index)=>fingerprint(array.get(index))));const copy=array.clone(context);page.node.set(key('Annots'),copy);appendedRefs.set(physical,[]);}
 const now=timestamp(),usedNames=new Set();let decodedNameBytes=0;
 // A generated UUID must also be distinct from any retained source NM, across
 // all physical pages. Bound this standard-field inventory separately; private
 // field values are never decoded and an oversized NM prevents this edit.
 for(const page of pages){const array=g.get(page.node,'Annots');if(!array)continue;if(!(array instanceof PDFArray))fail('A source annotation array is malformed.');for(let i=0;i<array.size();i++){const annotation=g.resolve(array.get(i));if(!(annotation instanceof PDFDict))fail('A retained annotation dictionary is malformed.');const nm=g.get(annotation,'NM');if(nm!==undefined){if(!(nm instanceof PDFString||nm instanceof PDFHexString)||nm.sizeInBytes()>4096*12+4)fail('A retained source NM identifier exceeds the supported literal-field boundary.');const name=nm.decodeText();if(name.length>4096)fail('A retained source NM identifier exceeds 4,096 characters.');decodedNameBytes+=Buffer.byteLength(name,'utf8');if(decodedNameBytes>8*1024*1024)fail('The retained source annotation-name inventory exceeds 8 MB.');usedNames.add(name);}}}
 for(const target of targets){const {change,row,ref,dict}=target;changedPages.add(row.page);
  if(change.kind==='comment'){
   dict.set(key('Contents'),PDFHexString.fromText(change.contents));dict.set(key('M'),PDFHexString.fromText(now));
   const appearance=row.subtype==='FreeText'?await buildFreeTextAppearance(doc,dict,row,change.contents,g):null;
   if(appearance){createdAppearanceRefs.add(appearance.appearanceRef);for(const fontRef of appearance.fontRefs||[appearance.fontRef])createdFontRefs.add(fontRef);}
   changes.push({kind:'comment',key:change.key,ref:ref.toString(),outputKey:row.key,objectRef:row.objectRef,page:row.page,contents:change.contents,modified:now,...appearance});
  }else{
   const rect=noteRectangle(pages[row.page-1],row,g);let nm;for(let attempt=0;attempt<5;attempt++){const candidate='PDFix-'+randomUUID();if(!usedNames.has(candidate)){nm=candidate;usedNames.add(nm);break;}}if(!nm)fail('A unique reply identity could not be allocated.');
   const appearance=context.stream(NOTE_APPEARANCE,{Type:key('XObject'),Subtype:key('Form'),FormType:1,BBox:[0,0,16,16],Matrix:[1,0,0,1,0,0],Resources:{}});appearance.updateDict();const appearanceRef=context.register(appearance);createdAppearanceRefs.add(appearanceRef.toString());
   const note=context.obj({Type:key('Annot'),Subtype:key('Text'),Rect:context.obj(rect),P:pages[row.page-1].ref,Contents:PDFHexString.fromText(change.contents),T:PDFHexString.fromText(change.author),NM:PDFHexString.fromText(nm),M:PDFHexString.fromText(now),CreationDate:PDFHexString.fromText(now),IRT:ref,RT:key('R'),Name:key('Comment'),F:PDFNumber.of(4),Open:false,AP:context.obj({N:appearanceRef})});
   if(change.state){note.set(key('StateModel'),PDFString.of('Review'));note.set(key('State'),PDFString.of(change.state));}
   const noteRef=context.register(note);createdRefs.add(noteRef.toString());g.get(pages[row.page-1].node,'Annots').push(noteRef);appendedRefs.get(row.page).push(noteRef.toString());
   changes.push({kind:'reply',parentKey:change.parentKey,parentRef:ref.toString(),ref:noteRef.toString(),outputKey:refKey(noteRef),objectRef:refKey(noteRef),page:row.page,contents:change.contents,author:change.author,state:change.state,stateModel:change.state?'Review':'',nm,created:now,modified:now,rect,replyType:'R',appearanceRef:appearanceRef.toString(),appearanceSha256:hash(NOTE_APPEARANCE)});
  }
 }
 // Prove the construction changed only the declared dictionary fields and
 // selected page Annots pointers. Shared original arrays remain untouched.
 for(const [ref,object]of context.enumerateIndirectObjects())if(originalRefs.has(ref.toString())){const before=manifest.get(ref.toString());if(fingerprint(object,before.excluded)!==before.unchanged)fail('An undeclared source object changed while building the review copy.');}
 const expectedObjects=new Map(context.enumerateIndirectObjects().map(([ref,object])=>[ref.toString(),fingerprint(object)]));
 const writer=PDFWriter.forContext(context,100),sizing=await writer.computeBufferSize();if(sizing.size>MAX_BYTES)fail('The review edit copy exceeds 100 MB.');const output=await writer.serializeToBuffer();
 const reopened=await load(output),afterGraph=graph(reopened),afterObjects=new Map(reopened.context.enumerateIndirectObjects().map(([ref,object])=>[ref.toString(),object]));
 if(afterObjects.size!==expectedObjects.size||canonicalJSON(geometry(reopened))!==geometryBefore||canonicalJSON(trailer(reopened))!==trailerBefore)fail('The reopened review copy changed its retained-object count, page geometry or original trailer references.');
 for(const [ref,expected]of expectedObjects){const actual=afterObjects.get(ref);if(!actual||fingerprint(actual)!==expected)fail('A retained source object, stream or declared review object changed during independent reopening.');}
 for(const physical of replyPages){const array=afterGraph.get(reopened.getPage(physical-1).node,'Annots'),original=originalPageAnnots.get(physical),added=appendedRefs.get(physical);if(!(array instanceof PDFArray)||array.size()!==original.length+added.length)fail('The reopened review copy changed a page annotation array unexpectedly.');for(let i=0;i<original.length;i++)if(fingerprint(array.get(i))!==original[i])fail('An existing page annotation entry changed.');for(let i=0;i<added.length;i++)if(array.get(original.length+i)?.toString()!==added[i])fail('An added reply is not appended in its exact declared source page.');}
 for(const change of changes){const dict=afterObjects.get(change.ref);if(!(dict instanceof PDFDict)||literal(dict,'Contents',afterGraph)!==change.contents||literal(dict,'M',afterGraph)!==change.modified)fail('An exact reopened review comment field changed.');if(change.kind==='comment'&&change.appearanceRef){const ap=afterGraph.get(dict,'AP'),normal=ap instanceof PDFDict?afterGraph.get(ap,'N'):null;if(!(normal instanceof PDFRawStream)||ap.get(key('N'))?.toString()!==change.appearanceRef||hash(normal.contents)!==change.appearanceSha256||!(afterObjects.get(change.fontRef) instanceof PDFDict))fail('The reopened FreeText appearance or standard font changed.');}if(change.kind==='reply'){
  const ap=afterGraph.get(dict,'AP'),normal=ap instanceof PDFDict?afterGraph.get(ap,'N'):null;if(!(normal instanceof PDFRawStream)||ap.get(key('N'))?.toString()!==change.appearanceRef||hash(normal.contents)!==change.appearanceSha256||afterGraph.name(afterGraph.get(normal.dict,'Subtype'))!=='Form'||afterGraph.get(normal.dict,'BBox')?.toString()!==context.obj([0,0,16,16]).toString()||!(afterGraph.get(normal.dict,'Resources') instanceof PDFDict)||afterGraph.get(normal.dict,'Resources').entries().length)fail('The reopened reply note appearance does not match its exact bounded vector icon.');
  if(afterGraph.name(afterGraph.get(dict,'Subtype'))!=='Text'||dict.get(key('IRT'))?.toString()!==change.parentRef||afterGraph.name(afterGraph.get(dict,'RT'))!=='R'||literal(dict,'T',afterGraph)!==change.author||literal(dict,'NM',afterGraph)!==change.nm||literal(dict,'CreationDate',afterGraph)!==change.created||literal(dict,'State',afterGraph)!==change.state||literal(dict,'StateModel',afterGraph)!==change.stateModel||dict.get(key('P'))?.toString()!==reopened.getPage(change.page-1).ref.toString()||dict.has(key('A'))||dict.has(key('AA'))||dict.has(key('RC')))fail('An exact reopened reply/history record changed its declared identity, parent, author, status or page.');
 }}
 const outputInventory=await inspectReview(output,draft.pages),report={version:1,verified:true,sourceSha256,sha256:hash(output),inventorySha256:draft.inventorySha256,pageCount:pages.length,changedPages:[...changedPages].sort((a,b)=>a-b),changes,outputInventory,retainedObjects:originalObjects.length,normalizedStreamLengths,sourceBytes:bytes.length,outputBytes:output.length,preservation:{modifiedAnnotationRefs:[...modifiedRefs],appendedPageRefs:[...replyPages].map(physical=>pages[physical-1].ref.toString()),addedAnnotationRefs:[...createdRefs],addedAppearanceRefs:[...createdAppearanceRefs],addedFontRefs:[...createdFontRefs],allowedAnnotationFields:freeTextRefs.size?['Contents','M','AP',...(richTextRefs.size?['RC']:[])]:['Contents','M'],streamNormalization:'Only raw stream Length fields are normalized to their unchanged encoded payload length.'},scope:'Preserving review edit copy: independently reopened exact literal Contents/M updates or new Unicode Text reply/history annotations. All original objects, encoded stream payloads, unknown/private fields, metadata, attachments, actions, outlines, page geometry and existing annotation arrays/threads remain; selected page Annots arrays are copied and appended. New reply icons have explicit font-free vector Form XObject normal appearances. Reply icons use source parent bounds, visible crop/media intersection, UserUnit 1 and right-angle rotations. Existing appearance objects are retained. Eligible plain FreeText normal appearances are explicitly rebuilt with their declared standard font, size, alignment and color; unsupported custom decorations are not reproduced, and locked/unsupported-font or overflowing text boxes are refused. A supported rich paragraph keeps its exact formatting structure, including standard-font mixed styles, colors, sizes and underline. Replacement within one style is mapped to the original text parts; ambiguous cross-style replacement, unsupported styles and mismatched plain/rich text are refused. Standard callouts with explicit insets, solid borders, black text and supported bounded leader lines are rebuilt while their source geometry is retained. Added status values are source history entries, not inferred current workflow status. Signed, certified, encrypted, XFA, malformed and unsupported sources/targets are refused. This is not sanitation, signature validation or proprietary Bluebeam fidelity verification.'};
 return validReviewEditResult({bytes:output,report},draft,sourceSha256);
}
module.exports={writeReviewEdits,preservingPdf:{load,graph,fingerprint,geometry,trailer,timestamp,literal,refKey}};
