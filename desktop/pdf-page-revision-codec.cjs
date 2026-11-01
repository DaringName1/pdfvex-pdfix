const {PDFDict,PDFArray,PDFRef,PDFName,PDFNumber,PDFRawStream,PDFContentStream,PDFString,PDFHexString}=require('pdf-lib');
const PDFWriter=require('pdf-lib/cjs/core/writers/PDFWriter.js').default;
const PDFObjectCopier=require('pdf-lib/cjs/core/PDFObjectCopier.js').default;
const {preservingPdf:P}=require('./pdf-review-edit-codec.cjs');
const {inspectPageOrder}=require('./pdf-page-order-codec.cjs');
const {hash,canonicalJSON,unpackRevisionSources,validRevisionDraft,validRevisionInspection,validRevisionResult}=require('./pdf-page-revision-validation.cjs');
const key=PDFName.of,fail=text=>{throw new Error(text);};
const COMMENT_TYPES=new Set(['Text','FreeText','Highlight','Underline','Squiggly','StrikeOut','Ink','Square','Circle','Polygon','PolyLine','Line','Stamp','Caret','Popup']);
const FIELDS=['Contents','Resources','MediaBox','CropBox','BleedBox','TrimBox','ArtBox','Rotate','Annots','Thumb'];
const NOTICES=[
 'Choose every original/replacement physical page explicitly. Replacement mappings are unique, never inferred from printed sheet labels. Unmapped original pages remain unchanged.',
 'Choose individual source comments, source links and whether to include replacement comments. Known popup/reply relationships must be retained together. Omitted annotations and old artwork remain in the retained PDF object graph; omission is not redaction or permanent deletion.',
 'Retained source comments keep exact object identity, author, NM, appearance stream bytes, unknown/private data and thread/state data. Stream Length fields are normalized for serialization before the object preservation baseline. Coordinates do not change. Carry-forward requires all five page boxes, rotation and UserUnit to match exactly and explicit geometry review.',
 'Replacement artwork/resources and included comments are copied into the original page identity. Imported indirect identities are remapped; original replacement NM/author/private/appearance data is retained. Replacement links, forms, bookmarks, catalog metadata and other document-level features are excluded.',
 'Protected PDFs, locked/read-only comments, shared/direct annotations, structural/optional-content documents, ambiguous threads and unsupported page dependencies are refused. Optional reviewed fit/scale/offset alignment transforms only replacement artwork into the unchanged original sheet geometry; replacement comments must be omitted and rotations must match. Source comment coordinates/private appearances are never transformed. Proprietary semantic interpretation remains unavailable. Review actual original, replacement and output artwork before saving a new copy.'
];
function text(dict,field,g){const value=g.get(dict,field);return value instanceof PDFString||value instanceof PDFHexString?value.decodeText().slice(0,1200):'';}
function annotations(doc,g){
 const seen=new Set();return doc.getPages().map(page=>{
  const array=g.get(page.node,'Annots');if(array!==undefined&&!(array instanceof PDFArray))fail('A selected PDF has a malformed annotation array.');const rows=[];
  for(let i=0;i<(array?.size()??0);i++){
   const ref=array.get(i);if(!(ref instanceof PDFRef)||seen.has(ref.toString())||seen.size>=10000)fail('Sheet revision requires at most 10,000 unique indirect annotations; shared/direct annotations are refused.');seen.add(ref.toString());const dict=g.resolve(ref);if(!(dict instanceof PDFDict))fail('A selected annotation is not a dictionary.');const subtype=g.name(g.get(dict,'Subtype')),p=dict.get(key('P'));if(p!==undefined&&(!(p instanceof PDFRef)||p.toString()!==page.ref.toString()))fail('An annotation points to a different physical page.');
   const flags=g.get(dict,'F');if(flags!==undefined&&(!(flags instanceof PDFNumber)||!Number.isSafeInteger(flags.asNumber())||flags.asNumber()<0))fail('An annotation has unsupported permission flags.');const protectedComment=!!((flags?.asNumber()??0)&(64|128|512)),rectObject=g.get(dict,'Rect');let rect=null;if(rectObject instanceof PDFArray&&rectObject.size()===4&&rectObject.asArray().every(v=>g.resolve(v) instanceof PDFNumber))rect=rectObject.asArray().map(v=>g.resolve(v).asNumber());
   const relatedRefs=[];let relationInvalid=false;for(const field of ['IRT','Popup',...(subtype==='Popup'?['Parent']:[])]){const related=dict.get(key(field));if(related!==undefined){if(!(related instanceof PDFRef))relationInvalid=true;else relatedRefs.push(P.refKey(related));}}
   const supported=(COMMENT_TYPES.has(subtype)||subtype==='Link')&&!protectedComment&&!relationInvalid&&rect!==null&&rect.every(Number.isFinite)&&rect[2]>=rect[0]&&rect[3]>=rect[1];
   rows.push({objectRef:P.refKey(ref),subtype,name:text(dict,'NM',g),author:text(dict,'T',g),contents:text(dict,'Contents',g),fingerprintSha256:P.fingerprint(dict),relatedRefs,supported,reason:supported?'':protectedComment?'Locked/read-only/locked-content annotation':relationInvalid?'Direct or malformed popup/reply relationship':!COMMENT_TYPES.has(subtype)&&subtype!=='Link'?'Unsupported annotation subtype: '+subtype:'Missing or malformed annotation rectangle',rect});
  }
  const local=new Set(rows.map(row=>row.objectRef));for(const row of rows)if(row.relatedRefs.some(ref=>!local.has(ref))){row.supported=false;row.reason='Reply/popup relationship leaves this physical page or has a missing target.';}return rows;
 });
}
async function state(bytes){
 // Existing page-tree inspection also proves unique physical identities and supported reference destinations.
 const order=await inspectPageOrder(bytes),doc=await P.load(bytes),g=P.graph(doc),inventory=annotations(doc,g),blockers=[];
 for(const field of ['StructTreeRoot','OCProperties'])if(doc.catalog.has(key(field)))blockers.push(field==='StructTreeRoot'?'Tagged structure requires a separate reviewed content/structure remapping workflow.':'Optional-content layers require a separate catalog/resource merge workflow.');
 const pages=doc.getPages().map((page,index)=>{const blockers=[];for(const field of ['PieceInfo','VP','Measure','AA','StructParents'])if(page.node.has(key(field)))blockers.push('Page dependency /'+field+' requires a separate preserving adapter.');if(inventory[index].some(row=>row.subtype==='Widget'))blockers.push('A physical page with form widgets cannot be revised in this artwork/comment workflow.');return {physicalPage:index+1,objectRef:P.refKey(page.ref),geometry:order.pages[index].geometry,annotations:inventory[index],blockers};});
 return {doc,g,report:{pageCount:pages.length,pages,blockers}};
}
async function inspectPageRevision(bundle){
 const {source,replacement}=unpackRevisionSources(bundle),a=await state(source),b=await state(replacement),body={version:1,sourceSha256:hash(source),replacementSha256:hash(replacement),source:a.report,replacement:b.report,notices:NOTICES};
 return validRevisionInspection({...body,inspectionSha256:hash(Buffer.from(canonicalJSON(body)))},body.sourceSha256,body.replacementSha256);
}
function selection(row,inspection){
 const original=inspection.source.pages[row.sourcePage-1],replacement=inspection.replacement.pages[row.replacementPage-1];if(!original||!replacement)fail('A physical page mapping is outside its inspected PDF.');
 const blockers=[...inspection.source.blockers,...inspection.replacement.blockers,...original.blockers,...replacement.blockers];if(blockers.length)fail('Sheet revision refused: '+blockers.join(' '));
 const refs=new Set(row.sourceCommentRefs),retained=original.annotations.filter(a=>a.subtype==='Link'?row.sourceLinks==='retain':refs.has(a.objectRef));
 if(refs.size!==original.annotations.filter(a=>a.subtype!=='Link'&&refs.has(a.objectRef)).length)fail('The selected source comment identities differ from this physical page inventory.');
 for(const a of retained){if(!a.supported)fail('Cannot retain '+a.objectRef+': '+a.reason);for(const related of a.relatedRefs)if(!retained.some(a=>a.objectRef===related))fail('Retain or omit the complete popup/reply group for '+a.objectRef+'.');}
 // Reverse relationships also prevent carrying a parent while silently discarding its replies/popups.
 for(const a of original.annotations)if(!retained.includes(a)&&a.relatedRefs.some(ref=>retained.some(a=>a.objectRef===ref)))fail('Retain or omit the complete popup/reply group for '+a.objectRef+'.');
 if(row.alignment){if(row.replacementComments!=='omit')fail('Aligned replacement artwork requires explicitly omitting replacement comments; their coordinates are not transformed.');if(original.geometry.rotation!==replacement.geometry.rotation||original.geometry.userUnit!=='1'||replacement.geometry.userUnit!=='1')fail('Artwork alignment requires matching page rotation and UserUnit 1.');}
 else if(retained.length&&canonicalJSON(original.geometry)!==canonicalJSON(replacement.geometry))fail('Retained source comments/links need exactly matching Media/Crop/Bleed/Trim/Art boxes, rotation and UserUnit. Choose reviewed artwork alignment or explicitly omit them.');
 const imported=row.replacementComments==='include'?replacement.annotations.filter(a=>a.subtype!=='Link'):[];
 for(const a of imported)if(!a.supported||a.relatedRefs.some(ref=>!imported.some(a=>a.objectRef===ref)))fail('Replacement comment '+a.objectRef+' cannot be included: '+(a.reason||'incomplete popup/reply group'));
 return {original,replacement,retained,imported};
}
const refFrom=value=>{const [,object,generation]=value.split(':');return PDFRef.of(Number(object),Number(generation));};
function manifest(context){return context.enumerateIndirectObjects().map(([ref,object])=>[ref.toString(),P.fingerprint(object)]);}
async function writePageRevision(bundle,value){
 const draft=validRevisionDraft(value),inspection=await inspectPageRevision(bundle);if(inspection.inspectionSha256!==draft.inspectionSha256)fail('The inspected original/replacement PDFs changed. Inspect them again.');
 const choices=draft.mappings.map(row=>selection(row,inspection)),{source,replacement}=unpackRevisionSources(bundle),a=await state(source),b=await state(replacement),doc=a.doc,context=doc.context;
 // Stream lengths are a serialization field, normalized before the preservation baseline.
 for(const [,object]of context.enumerateIndirectObjects())if(object instanceof PDFRawStream)object.updateDict();
 const originalManifest=manifest(context),sourceMap=new Map(originalManifest),trailer=canonicalJSON(P.trailer(doc)),allowed=new Map(),before=new Map(),copier=PDFObjectCopier.for(b.doc.context,context),importedCommentRefs=[];
 // Seed page identities before copying any resources/comments so their /P pointers resolve to active original pages.
 for(const row of draft.mappings)copier.traversedObjects.set(b.doc.getPage(row.replacementPage-1).ref,doc.getPage(row.sourcePage-1).ref);
 // Avoid annotation /NM ambiguity among active retained and imported comments.
 const activeNames=new Set();for(const p of inspection.source.pages){const choice=choices.find(c=>c.original.physicalPage===p.physicalPage);for(const ann of choice?choice.retained:p.annotations)if(ann.name){if(activeNames.has(ann.name))fail('Existing duplicate annotation NM identities require explicit cleanup before revision.');activeNames.add(ann.name);}}
 for(const choice of choices)for(const ann of choice.imported)if(ann.name){if(activeNames.has(ann.name))fail('An included replacement comment duplicates an active source /NM identity. Omit replacement comments or choose another revision.');activeNames.add(ann.name);}
 for(let i=0;i<draft.mappings.length;i++){
  const row=draft.mappings[i],choice=choices[i],target=doc.getPage(row.sourcePage-1),fresh=b.doc.getPage(row.replacementPage-1);
  const fields=row.alignment?['Contents','Resources','Annots','Thumb']:FIELDS;allowed.set(target.ref.toString(),fields);before.set(target.ref.toString(),P.fingerprint(target.node,fields));
  if(row.alignment){
   const original=choice.original.geometry.crop,replacement=choice.replacement.geometry.crop,scale=Math.min(original.width/replacement.width,original.height/replacement.height)*row.alignment.scale,tx=original.x+(original.width-replacement.width*scale)/2+row.alignment.shiftX-replacement.x*scale,ty=original.y+(original.height-replacement.height*scale)/2+row.alignment.shiftY-replacement.y*scale;
   if(![scale,tx,ty].every(Number.isFinite)||scale<.001||scale>1000||tx+replacement.x*scale>=original.x+original.width||ty+replacement.y*scale>=original.y+original.height||tx+(replacement.x+replacement.width)*scale<=original.x||ty+(replacement.y+replacement.height)*scale<=original.y)fail('The reviewed alignment leaves no replacement artwork in the original crop box or exceeds its scale bound.');
   const embedded=await doc.embedPage(fresh,{left:replacement.x,bottom:replacement.y,right:replacement.x+replacement.width,top:replacement.y+replacement.height},[1,0,0,1,0,0]);await doc.flush();
   const resources=a.g.resolve(target.node.getInheritableAttribute(key('Resources'))),copy=resources instanceof PDFDict?resources.clone(context):context.obj({}),oldX=a.g.get(copy,'XObject'),xobjects=oldX instanceof PDFDict?oldX.clone(context):context.obj({});let name='PDFixRevision'+row.sourcePage;for(let suffix=0;xobjects.has(key(name));suffix++){if(suffix>=1000)fail('Too many source XObject names for reviewed alignment.');name='PDFixRevision'+row.sourcePage+'_'+suffix;}xobjects.set(key(name),embedded.ref);copy.set(key('XObject'),xobjects);target.node.set(key('Resources'),copy);
   const fixed=v=>Number(v.toFixed(8)).toString(),content=Buffer.from(`q\n${[original.x,original.y,original.width,original.height].map(fixed).join(' ')} re W n\n${[scale,0,0,scale,tx,ty].map(fixed).join(' ')} cm\n/${name} Do\nQ\n`,'ascii');target.node.set(key('Contents'),context.register(context.stream(content)));target.node.delete(key('Thumb'));
  }else{
  for(const field of ['Contents','Resources']){const data=field==='Resources'?fresh.node.getInheritableAttribute(key(field)):fresh.node.get(key(field));if(data!==undefined)target.node.set(key(field),copier.copy(data));else if(field==='Resources')target.node.set(key(field),context.obj({}));else target.node.delete(key(field));}
  for(const [field,box]of [['MediaBox','media'],['CropBox','crop'],['BleedBox','bleed'],['TrimBox','trim'],['ArtBox','art']]){const q=choice.replacement.geometry[box];target.node.set(key(field),context.obj([q.x,q.y,q.x+q.width,q.y+q.height]));}
  target.node.set(key('Rotate'),PDFNumber.of(choice.replacement.geometry.rotation));target.node.delete(key('Thumb'));
  }
  const annots=context.obj(choice.retained.map(ann=>refFrom(ann.objectRef)));
  for(const ann of choice.imported){const copied=copier.copy(refFrom(ann.objectRef));if(!(copied instanceof PDFRef))fail('A replacement comment lost its indirect identity.');annots.push(copied);importedCommentRefs.push(P.refKey(copied));}
  target.node.set(key('Annots'),annots);
 }
 // Page embedding may allocate generated q/Q content streams. Canonicalize
 // only those new streams to the exact encoded representation we reopen.
 for(const [ref,object]of context.enumerateIndirectObjects())if(!sourceMap.has(ref.toString())&&object instanceof PDFContentStream){object.updateDict();context.assign(ref,PDFRawStream.of(object.dict.clone(context),object.getContents()));}
 if(context.enumerateIndirectObjects().length>100000)fail('The revised copy exceeds the 100,000-object preservation budget.');
 for(const [ref,object]of context.enumerateIndirectObjects())if(sourceMap.has(ref.toString())){const expected=allowed.has(ref.toString())?before.get(ref.toString()):sourceMap.get(ref.toString());if(P.fingerprint(object,allowed.get(ref.toString())??[])!==expected)fail('An undeclared original object changed during sheet revision.');}
 for(const [,object]of context.enumerateIndirectObjects())if(object instanceof PDFRawStream)object.updateDict();
 const expected=manifest(context),expectedMap=new Map(expected),writer=PDFWriter.forContext(context,100),size=await writer.computeBufferSize();if(size.size>100*1024*1024)fail('The revised copy exceeds 100 MiB.');const output=await writer.serializeToBuffer(),after=await P.load(output),afterG=P.graph(after),actual=manifest(after.context);
 if(actual.length!==expected.length||actual.some(([ref,fingerprint])=>expectedMap.get(ref)!==fingerprint)||canonicalJSON(P.trailer(after))!==trailer||after.getPageCount()!==inspection.source.pageCount)fail('The reopened revision changed a declared object, retained object or PDF trailer'+(actual.find(([ref,fingerprint])=>expectedMap.get(ref)!==fingerprint)?.[0]?' at '+actual.find(([ref,fingerprint])=>expectedMap.get(ref)!==fingerprint)[0]:'')+'.');
 const shapes=P.geometry(after),pages=after.getPages().map((page,index)=>{const row=draft.mappings.find(row=>row.sourcePage===index+1),geometry=row&&!row.alignment?inspection.replacement.pages[row.replacementPage-1].geometry:inspection.source.pages[index].geometry;if(P.refKey(page.ref)!==inspection.source.pages[index].objectRef||canonicalJSON(shapes[index])!==canonicalJSON(geometry))fail('A revised page identity or inspected geometry changed after reopening.');const array=afterG.get(page.node,'Annots');return {physicalPage:index+1,objectRef:P.refKey(page.ref),geometry:shapes[index],annotationRefs:array?array.asArray().map(P.refKey):[]};});
 const report={version:1,verified:true,sourceSha256:inspection.sourceSha256,replacementSha256:inspection.replacementSha256,inspectionSha256:inspection.inspectionSha256,selectionSha256:hash(Buffer.from(canonicalJSON(draft))),sha256:hash(output),sourceBytes:source.length,replacementBytes:replacement.length,outputBytes:output.length,pageCount:pages.length,mappings:draft.mappings,pages,preservation:{originalObjectCount:originalManifest.length,outputObjectCount:expected.length,sourceManifestSha256:hash(Buffer.from(canonicalJSON(originalManifest))),outputManifestSha256:hash(Buffer.from(canonicalJSON(expected))),modifiedPageRefs:draft.mappings.map(row=>inspection.source.pages[row.sourcePage-1].objectRef),retainedSourceCommentRefs:draft.mappings.flatMap(row=>row.sourceCommentRefs),importedCommentRefs},notices:NOTICES,scope:'Reviewed physical artwork replacement in exact original page identities. Only declared original page Contents/Resources, five boxes, Rotate, Annots and obsolete Thumb may change. All other original object dictionaries/streams retain their exact baseline fingerprints. Retained comments are exact original objects with no coordinate or appearance transforms. Replacement resources/artwork/comments are graph-copied with indirect-reference remapping. Entire constructed graph, page order/identity/geometry and original trailer are proved after native reopen. Omitted content remains retained; document-level donor features are not merged. Optional reviewed artwork-only fit/scale/offset alignment preserves original geometry and comments; arbitrary annotation transforms and real Revu round-trip acceptance are not established.'};
 return validRevisionResult({bytes:output,report},draft,inspection);
}
module.exports={inspectPageRevision,writePageRevision};
