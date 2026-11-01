const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createHash}=require('node:crypto');
const {PDFDocument,PDFName,PDFArray,PDFDict,PDFRawStream,PDFString,decodePDFRawStream}=require('pdf-lib');
const {freeTextSource}=require('./helpers/review-freetext.cjs'),n=PDFName.of,hash=b=>createHash('sha256').update(b).digest('hex');
async function fixture({tags=true,widgets=true}={}){
 const doc=await PDFDocument.load(await freeTextSource(),{updateMetadata:false}),c=doc.context;doc.addPage([400,600]).drawLine({start:{x:40,y:100},end:{x:300,y:100},thickness:0});
 doc.setTitle('Retained route-audit title');await doc.attach(Buffer.from('Exact attachment payload'),'audit.txt');
 const field=doc.getForm().createTextField('Total');field.setText('42');if(widgets)field.addToPage(doc.getPage(0),{x:150,y:100,width:100,height:30});field.acroField.dict.set(n('AA'),c.obj({C:{S:'JavaScript',JS:PDFString.of('event.value = 42;')}}));doc.catalog.lookup(n('AcroForm'),PDFDict).set(n('CO'),c.obj([field.ref]));
 if(tags)doc.catalog.set(n('StructTreeRoot'),c.register(c.obj({Type:'StructTreeRoot',K:[],PrivateAudit:PDFString.of('Keep logical structure object')})));
 doc.catalog.set(n('Outlines'),c.register(c.obj({Type:'Outlines',Count:0})));
 return Buffer.from(await doc.save({useObjectStreams:false,updateFieldAppearances:false}));
}
function digest(value,fields=[]){const dict=value instanceof PDFRawStream?value.dict:value;if(dict instanceof PDFDict){const clone=dict.clone(dict.context);for(const key of fields)clone.delete(n(key));if(value instanceof PDFRawStream)clone.delete(n('Length'));return hash(Buffer.concat([Buffer.from(clone.toString()),value instanceof PDFRawStream?Buffer.from(value.contents):Buffer.alloc(0)]));}return hash(Buffer.from(value.toString()));}
async function verify(t,input,result,allowed=new Map(),changedStreams=new Set()){
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-route-audit-'));t.after(()=>fs.rm(folder,{recursive:true,force:true}));const source=path.join(folder,'original.pdf'),target=path.join(folder,'copy.pdf');await fs.writeFile(source,input);await fs.writeFile(target,result.bytes,{flag:'wx'});
 const before=await PDFDocument.load(await fs.readFile(source),{updateMetadata:false}),after=await PDFDocument.load(await fs.readFile(target),{updateMetadata:false});
 for(const [ref,value]of before.context.enumerateIndirectObjects()){const id=ref.toString(),saved=after.context.lookup(ref);assert.ok(saved,'Retained source object '+id);if(!changedStreams.has(id))assert.equal(digest(saved,allowed.get(id)),digest(value,allowed.get(id)),'Only approved source fields changed: '+id);}
 for(const key of ['AcroForm','Names','StructTreeRoot'])assert.equal(after.catalog.get(n(key))?.toString(),before.catalog.get(n(key))?.toString(),key);
 assert.equal(after.getForm().getTextField('Total').getText(),'42');assert.equal(after.getTitle(),before.getTitle());assert.deepEqual(await fs.readFile(source),input);
 assert.equal(after.catalog.lookup(n('AcroForm'),PDFDict).get(n('CO')).toString(),before.catalog.lookup(n('AcroForm'),PDFDict).get(n('CO')).toString());return {before,after};
}
test('preserving reorder retains attachment/tag/form-calculation/widget objects through disk readback',async t=>{
 const bytes=await fixture(),{inspectPageOrder,writePageOrder}=require('../desktop/pdf-page-order-codec.cjs'),inspection=await inspectPageOrder(bytes),result=await writePageOrder(bytes,{inspectionSha256:inspection.inspectionSha256,order:[2,1]}),doc=await PDFDocument.load(bytes),allowed=new Map([[doc.catalog.get(n('Pages')).toString(),['Kids','Count']]]);
 for(const page of doc.getPages())allowed.set(page.ref.toString(),['Parent']);const {before,after}=await verify(t,bytes,result,allowed);assert.deepEqual(after.getPages().map(p=>p.ref.toString()),before.getPages().map(p=>p.ref.toString()).reverse());
});
test('outline replacement retains attachments, tag tree, calculations and original objects',async t=>{
 const bytes=await fixture(),codec=require('../desktop/pdf-bookmark-codec.cjs'),inspection=await codec.inspect(bytes),result=await codec.write(bytes,{inventorySha256:inspection.inventorySha256,replaceExisting:true,nodes:[{title:'Second sheet',page:2,depth:0}]}),doc=await PDFDocument.load(bytes);
 const {after}=await verify(t,bytes,result,new Map([[doc.context.trailerInfo.Root.toString(),['Outlines']]]));assert.notEqual(after.catalog.get(n('Outlines')).toString(),doc.catalog.get(n('Outlines')).toString());
});
test('page-box copy changes only the selected box while retaining attachments/tags/form calculations',async t=>{
 const bytes=await fixture(),{inspectPageBoxes,writePageBoxes}=require('../desktop/pdf-page-box-codec.cjs'),inspection=await inspectPageBoxes(bytes),result=await writePageBoxes(bytes,{inspectionSha256:inspection.inspectionSha256,changes:[{page:1,boxes:{CropBox:[10,10,390,590]}}]}),doc=await PDFDocument.load(bytes);
 const {after}=await verify(t,bytes,result,new Map([[doc.getPage(0).ref.toString(),['CropBox']]]));assert.deepEqual(after.getPage(0).getCropBox(),{x:10,y:10,width:380,height:580});
});
test('print marks retain source annotations, attachment streams, tag objects and calculation actions',async t=>{
 const bytes=await fixture(),{buildPrintMarks}=require('../desktop/pdf-print-marks-codec.cjs'),result=await buildPrintMarks(bytes,{version:1,pages:[0],units:'pt',bleed:{top:2,right:2,bottom:2,left:2},offset:4,lineWidth:.5,color:'#000000',cropMarks:true,bleedMarks:false,registrationMarks:false,acknowledgeExpandedPageBoxes:true}),doc=await PDFDocument.load(bytes);
 const {after}=await verify(t,bytes,result,new Map([[doc.getPage(0).ref.toString(),['Contents','MediaBox','CropBox','TrimBox']]]));assert.ok(after.getPage(0).getWidth()>doc.getPage(0).getWidth());assert.equal(after.getPage(0).node.get(n('Annots')).toString(),doc.getPage(0).node.get(n('Annots')).toString());
});
test('thin-line repair retains all nonselected program objects, attachments/tags and calculations',async t=>{
 const bytes=await fixture(),{inspectThinLines,writeThinLines}=require('../desktop/pdf-thin-line-codec.cjs'),inspection=await inspectThinLines(bytes,{thresholdPt:.25}),stroke=inspection.strokes.find(s=>s.page===2&&s.repairable);assert.ok(stroke);
 const result=await writeThinLines(bytes,{version:1,inspectionSha256:inspection.inspectionSha256,thresholdPt:.25,changes:[{id:stroke.id,widthPt:.5}]}),{after}=await verify(t,bytes,result,new Map(),new Set([stroke.streamRef]));
 const ref=after.context.enumerateIndirectObjects().find(([r])=>r.toString()===stroke.streamRef)[1];assert.match(Buffer.from(decodePDFRawStream(ref).decode()).toString('latin1'),/0\.5 w/);const inspected=await inspectThinLines(result.bytes,{thresholdPt:.25});assert.equal(inspected.strokes.find(s=>s.id===stroke.id).minimumPt,.5);
});

for(const mode of ['pageNumbers','bates','header','footer','watermark','stamp'])test(mode+' copy preserves attachments/tags/calculations and existing page resources',async t=>{
 const bytes=await fixture(),item=(text,position)=>({enabled:false,text,size:10,color:'#193246',opacity:1,position}),draft={version:1,pages:[0],font:'Helvetica',marginMm:10,pageNumbers:{...item('Page {page} of {total}','bottom-center'),start:1},header:item('Audit header','top-center'),footer:item('Audit footer','bottom-left'),watermark:{...item('DRAFT','center'),angle:45},stamp:item('DRAFT','top-right')};
 if(mode==='bates')Object.assign(draft.pageNumbers,{enabled:true,mode:'bates',prefix:'AUD-',suffix:'',start:7,padding:4});else draft[mode].enabled=true;
 const result=await require('../desktop/pdf-decoration-codec.cjs').build(bytes,draft),doc=await PDFDocument.load(bytes),{before,after}=await verify(t,bytes,result,new Map([[doc.getPage(0).ref.toString(),['Contents','Resources']]]));
 const oldResources=before.getPage(0).node.Resources(),newResources=after.getPage(0).node.Resources();
 for(const [key,value]of oldResources.entries()){
  const old=before.context.lookup(value),saved=after.context.lookup(newResources.get(key));
  if(old instanceof PDFDict){assert.ok(saved instanceof PDFDict);for(const [sub,original]of old.entries())assert.equal(saved.get(sub)?.toString(),original.toString(),'Existing resource '+key+'/'+sub);}
  else assert.equal(saved.toString(),old.toString());
 }
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(result.bytes),isEvalSupported:false,standardFontDataUrl:path.resolve('node_modules/pdfjs-dist/standard_fonts').split(path.sep).join('/')+'/'});
 try{const document=await task.promise,text=(await(await document.getPage(1)).getTextContent()).items.map(x=>x.str).join(' ');assert.ok(text.includes(mode==='bates'?'AUD-0007':mode==='pageNumbers'?'Page 1 of 2':mode==='header'?'Audit header':mode==='footer'?'Audit footer':'DRAFT'));}finally{await task.destroy();}
});

test('takeoff PDF retains tagged/form/attachment objects and its exact independently recomputed quantity',async t=>{
 const bytes=await fixture(),entry={id:'takeoff-00000000-0000-4000-8000-000000000001',name:'Audit quantity',group:'Test',kind:'distance',page:1,label:'',box:[0,0,400,600],userUnit:1,points:[[50,50],[150,50]],calibration:{reference:[[50,50],[150,50]],length:100,unit:'mm',mmPerPoint:1},closed:false,quantity:{dimension:'length',value:100}},ledger={kind:'pdfix-takeoff-ledger',version:1,source:{sha256:hash(bytes),name:'original.pdf',pageCount:2},entries:[entry]},result=await require('../desktop/pdf-takeoff-codec.cjs').writeTakeoffs(bytes,{ledger,unit:'mm',author:'Audit reviewer'}),doc=await PDFDocument.load(bytes),{after}=await verify(t,bytes,result,new Map([[doc.getPage(0).ref.toString(),['Annots']]]));
 const note=after.getPage(0).node.lookup(n('Annots'),PDFArray).asArray().map(ref=>after.context.lookup(ref,PDFDict)).find(a=>a.has(n('PDFixData'))),saved=JSON.parse(note.get(n('PDFixData')).decodeText());assert.deepEqual(saved.entry,entry);assert.equal(saved.entry.quantity.value,Math.hypot(saved.entry.points[1][0]-saved.entry.points[0][0],saved.entry.points[1][1]-saved.entry.points[0][1])*saved.entry.calibration.mmPerPoint);
});

test('XFDF import appends a note without changing attachments/tag/form-calculation objects',async t=>{
 const bytes=await fixture(),{inspectXfdfImport,writeXfdfImport}=require('../desktop/pdf-xfdf-import-codec.cjs'),xml=Buffer.from('<xfdf xmlns="http://ns.adobe.com/xfdf/"><annots><text page="0" rect="50,300,70,320" name="audit-note"><contents>Imported audit note</contents></text></annots></xfdf>'),proposal=await inspectXfdfImport(bytes,xml),result=await writeXfdfImport(bytes,{xfdf:xml.toString('base64'),proposalSha256:proposal.proposalSha256,keys:[proposal.rows[0].key]}),doc=await PDFDocument.load(bytes),{after}=await verify(t,bytes,result,new Map([[doc.getPage(0).ref.toString(),['Annots']]]));
 const annotations=after.getPage(0).node.lookup(n('Annots'),PDFArray).asArray().map(ref=>after.context.lookup(ref,PDFDict));assert.ok(annotations.some(a=>a.get(n('Contents'))?.decodeText?.()==='Imported audit note'));
});

test('sheet artwork revision refuses tag-dependent sources and selected pages with form widgets',async()=>{
 const source=await fixture(),copy=Buffer.from(source),replacement=await PDFDocument.create();replacement.addPage([400,600]).drawText('Replacement artwork');const donor=await replacement.save(),{packRevisionSources}=require('../desktop/pdf-page-revision-validation.cjs'),{inspectPageRevision,writePageRevision}=require('../desktop/pdf-page-revision-codec.cjs');
 const taggedBundle=packRevisionSources(source,donor),taggedInspection=await inspectPageRevision(taggedBundle);assert.ok(taggedInspection.source.blockers.some(s=>/structur|tag/i.test(s)));await assert.rejects(writePageRevision(taggedBundle,{version:1,inspectionSha256:taggedInspection.inspectionSha256,mappings:[{sourcePage:1,replacementPage:1,sourceCommentRefs:[],sourceLinks:'omit',replacementComments:'omit',geometryReviewed:true}]}),/structur|tag/i);
 const formOnly=await PDFDocument.load(source,{updateMetadata:false});formOnly.catalog.delete(n('StructTreeRoot'));const bytes=await formOnly.save({useObjectStreams:false,updateFieldAppearances:false}),bundle=packRevisionSources(bytes,donor),inspection=await inspectPageRevision(bundle);assert.ok(inspection.source.pages[0].blockers.some(s=>/form widgets/i.test(s)));
 await assert.rejects(writePageRevision(bundle,{version:1,inspectionSha256:inspection.inspectionSha256,mappings:[{sourcePage:1,replacementPage:1,sourceCommentRefs:[],sourceLinks:'omit',replacementComments:'omit',geometryReviewed:true}]}),/widget|dependenc|cannot|block/i);assert.deepEqual(source,copy);
});

test('supported sheet replacement keeps comments, attachments, non-widget calculations and every unrelated object',async t=>{
 const source=await fixture({tags:false,widgets:false}),replacement=await PDFDocument.create();replacement.addPage([400,600]).drawText('Replacement audit artwork',{x:40,y:500});const donor=await replacement.save(),{packRevisionSources}=require('../desktop/pdf-page-revision-validation.cjs'),{inspectPageRevision,writePageRevision}=require('../desktop/pdf-page-revision-codec.cjs'),bundle=packRevisionSources(source,donor),inspection=await inspectPageRevision(bundle),doc=await PDFDocument.load(source),sourceRefs=inspection.source.pages[0].annotations.map(a=>a.objectRef);
 const result=await writePageRevision(bundle,{version:1,inspectionSha256:inspection.inspectionSha256,mappings:[{sourcePage:1,replacementPage:1,sourceCommentRefs:sourceRefs,sourceLinks:'retain',replacementComments:'omit',geometryReviewed:true}]}),{after}=await verify(t,source,result,new Map([[doc.getPage(0).ref.toString(),['Contents','Resources','MediaBox','CropBox','BleedBox','TrimBox','ArtBox','Rotate','Annots','Thumb']]]));
 assert.equal(after.getPage(0).node.get(n('Annots')).toString(),doc.getPage(0).node.get(n('Annots')).toString());assert.equal(after.getPage(0).getWidth(),400);assert.equal(after.getPage(0).getHeight(),600);
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(result.bytes),isEvalSupported:false,standardFontDataUrl:path.resolve('node_modules/pdfjs-dist/standard_fonts').split(path.sep).join('/')+'/'});
 try{const pdf=await task.promise,text=(await(await pdf.getPage(1)).getTextContent()).items.map(i=>i.str).join(' ');assert.ok(text.includes('Replacement audit artwork'));assert.ok(!text.includes('Original drawing artwork'));}finally{await task.destroy();}
});

test('flattened markup retains source forms/calculations/tags/attachment bytes and selectable added text',async t=>{
 const bytes=await fixture(),{markedPdf}=await import('../src/markup-output.js'),result=await markedPdf(bytes,[{id:'pdfix-00000000-0000-4000-8000-000000000002',kind:'text',page:0,color:'blue',text:'Audit flattened visible text',fontSize:12,rotation:0,rect:[40,200,350,240]}],true),doc=await PDFDocument.load(bytes),{after}=await verify(t,bytes,result,new Map([[doc.getPage(0).ref.toString(),['Contents','Resources']]]));
 assert.equal(after.getPage(0).node.get(n('Annots')).toString(),doc.getPage(0).node.get(n('Annots')).toString());
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(result.bytes),isEvalSupported:false,standardFontDataUrl:path.resolve('node_modules/pdfjs-dist/standard_fonts').split(path.sep).join('/')+'/'});
 try{const pdf=await task.promise,text=(await(await pdf.getPage(1)).getTextContent()).items.map(i=>i.str).join(' ');assert.ok(text.includes('Audit flattened visible text'));}finally{await task.destroy();}
});

test('contained lossless compression preserves actual attachment data, tags and calculation semantics on disk',async t=>{
 const bytes=await fixture(),original=Buffer.from(bytes),folder=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-compression-route-audit-'));t.after(()=>fs.rm(folder,{recursive:true,force:true}));
 const {CompressionEngine}=require('../desktop/compression-engine.cjs'),engine=new CompressionEngine(path.join(folder,'jobs'),path.resolve('dist/native/qpdf')),result=await engine.compress(require('node:crypto').randomUUID(),bytes,{mode:'lossless'}),target=path.join(folder,'copy.pdf');await fs.writeFile(target,result.bytes,{flag:'wx'});
 const saved=await fs.readFile(target),doc=await PDFDocument.load(saved,{updateMetadata:false}),form=doc.catalog.lookup(n('AcroForm'),PDFDict),field=doc.getForm().getTextField('Total');assert.equal(field.getText(),'42');assert.equal(form.lookup(n('CO'),PDFArray).get(0).toString(),field.ref.toString());assert.equal(field.acroField.dict.lookup(n('AA'),PDFDict).lookup(n('C'),PDFDict).get(n('JS')).decodeText(),'event.value = 42;');
 assert.equal(doc.catalog.lookup(n('StructTreeRoot'),PDFDict).get(n('PrivateAudit')).decodeText(),'Keep logical structure object');
 const fileSpec=doc.catalog.lookup(n('Names'),PDFDict).lookup(n('EmbeddedFiles'),PDFDict).lookup(n('Names'),PDFArray).lookup(1,PDFDict),stream=fileSpec.lookup(n('EF'),PDFDict).lookup(n('F'));assert.equal(Buffer.from(decodePDFRawStream(stream).decode()).toString(),'Exact attachment payload');assert.equal(doc.getTitle(),'Retained route-audit title');assert.deepEqual(bytes,original);
 const {verify:verifyCompression}=require('../desktop/compression-inspect.cjs');await verifyCompression(bytes,saved,false);
 for(const mutation of ['calculation order','tags']){const bad=await PDFDocument.load(saved,{updateMetadata:false});if(mutation==='calculation order')bad.catalog.lookup(n('AcroForm'),PDFDict).set(n('CO'),bad.context.obj([]));else bad.catalog.lookup(n('StructTreeRoot'),PDFDict).set(n('PrivateAudit'),PDFString.of('Unwanted change'));await assert.rejects(verifyCompression(bytes,await bad.save({updateFieldAppearances:false}),false),/changed/);}
 assert.deepEqual(await fs.readdir(path.join(folder,'jobs')),[]);
});

for(const kind of ['orphan signature','nested signature field','byte range','certification'])test(kind+' is refused by preserving page/review/markup/compression openers without source changes',async()=>{
 const doc=await PDFDocument.load(await fixture(),{updateMetadata:false}),c=doc.context;
 if(kind==='orphan signature')c.register(c.obj({Type:'Sig',ByteRange:[0,1,2,3]}));
 if(kind==='nested signature field')c.register(c.obj({Private:{FT:'Sig'}}));
 if(kind==='byte range')c.register(c.obj({Private:{ByteRange:[0,1,2,3]}}));
 if(kind==='certification')doc.catalog.set(n('Perms'),c.obj({DocMDP:c.register(c.obj({Type:'Sig'}))}));
 const bytes=Buffer.from(await doc.save({useObjectStreams:false,updateFieldAppearances:false})),original=Buffer.from(bytes),{inspectReview}=require('../desktop/pdf-review-codec.cjs'),{writeReviewEdits}=require('../desktop/pdf-review-edit-codec.cjs');
 const checks=[['tags',b=>require('../desktop/pdf-tags-codec.cjs').inspect(b)],['repair',b=>require('../desktop/pdf-repair-codec.cjs').inspect(b)],['cleanup',b=>require('../desktop/pdf-sanitize-codec.cjs').inspect(b)],['portfolio creation',b=>require('../desktop/pdf-portfolio-codec.cjs').build(b,{view:'D',entries:[],sources:[]})],['reorder',b=>require('../desktop/pdf-page-order-codec.cjs').inspectPageOrder(b)],['page boxes',b=>require('../desktop/pdf-page-box-codec.cjs').inspectPageBoxes(b)],['outline',b=>require('../desktop/pdf-bookmark-codec.cjs').inspect(b)],['thin lines',b=>require('../desktop/pdf-thin-line-codec.cjs').inspectThinLines(b)],['compression',b=>require('../desktop/compression-inspect.cjs').inspect(b)],['markup',async b=>(await import('../src/markup-output.js')).inspectMarkupPdf(b)],['XFDF import',b=>require('../desktop/pdf-xfdf-import-codec.cjs').inspectXfdfImport(b,Buffer.from('<xfdf xmlns="http://ns.adobe.com/xfdf/"><annots><text page="0" rect="50,300,70,320"><contents>Refused</contents></text></annots></xfdf>'))],['comment body',async b=>{const inventory=await inspectReview(b,[1]);return writeReviewEdits(b,{version:1,pages:[1],inventorySha256:inventory.inventorySha256,changes:[{kind:'comment',key:inventory.annotations.find(a=>a.subtype==='FreeText').key,contents:'Refused edit'}]});}]];
 for(const [name,run]of checks){await assert.rejects(run(bytes),error=>/signature|signed|certif|permission/i.test(error.message),name);assert.deepEqual(bytes,original,name+' source bytes');}
});

for(const state of ['', 'Accepted'])test('review reply '+(state||'without status')+' retains attachment/tag/widget/calculation objects through disk readback',async t=>{
 const bytes=await fixture(),original=Buffer.from(bytes),{inspectReview}=require('../desktop/pdf-review-codec.cjs'),{writeReviewEdits}=require('../desktop/pdf-review-edit-codec.cjs'),inventory=await inspectReview(bytes,[1]),parent=inventory.annotations.find(a=>a.subtype==='FreeText');
 const result=await writeReviewEdits(bytes,{version:1,inventorySha256:inventory.inventorySha256,pages:[1],changes:[{kind:'reply',parentKey:parent.key,contents:'Audit reply – Réponse 中文',author:'Audit reviewer',state}]}),source=await PDFDocument.load(bytes,{updateMetadata:false});
 const {before,after}=await verify(t,bytes,result,new Map([[source.getPage(0).ref.toString(),['Annots']]])),old=before.getPage(0).node.lookup(n('Annots'),PDFArray),saved=after.getPage(0).node.lookup(n('Annots'),PDFArray);
 assert.deepEqual(saved.asArray().slice(0,old.size()).map(String),old.asArray().map(String));assert.equal(saved.size(),old.size()+1);const reply=saved.lookup(saved.size()-1,PDFDict);
 assert.equal(reply.get(n('Contents')).decodeText(),'Audit reply – Réponse 中文');assert.equal(reply.get(n('T')).decodeText(),'Audit reviewer');assert.equal(reply.get(n('IRT')).toString(),parent.objectRef.split(':').slice(1).join(' ')+' R');
 assert.equal(reply.get(n('State'))?.decodeText(),state||undefined);assert.equal(reply.get(n('StateModel'))?.decodeText(),state?'Review':undefined);assert.deepEqual(bytes,original);
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(result.bytes),isEvalSupported:false,standardFontDataUrl:path.resolve('node_modules/pdfjs-dist/standard_fonts').split(path.sep).join('/')+'/'});try{const pdf=await task.promise,rows=await(await pdf.getPage(1)).getAnnotations(),row=rows.find(a=>a.contentsObj?.str==='Audit reply – Réponse 中文');assert.ok(row);assert.equal(row.state,state||null);assert.equal(row.stateModel,state?'Review':null);assert.equal(row.hasAppearance,true);}finally{await task.destroy();}
});


// Exercise every existing markup writer in editable and flattened modes against
// a source carrying real attachment, form calculation, widget and tag objects.
for(const kind of ['highlight','underline','note','text','ink','line','arrow','cloud','callout'])for(const flatten of [false,true])test(kind+' '+(flatten?'flattened':'editable')+' preserves the source graph and saved mark',async t=>{
 const bytes=await fixture(),{markedPdf}=await import('../src/markup-output.js'),doc=await PDFDocument.load(bytes),mark={id:'pdfix-00000000-0000-4000-8000-000000000099',kind,page:0,color:'blue',text:'Audit '+kind+' body',fontSize:12,rotation:0,rect:[40,200,350,280]};
 if(['highlight','underline'].includes(kind))mark.quads=[60,260,330,260,60,225,330,225];
 if(['line','arrow'].includes(kind))mark.path=[60,220,300,250];
 if(kind==='ink'){mark.path=[60,220,100,240,140,230];mark.inkWidth=3;mark.inkOpacity=.6;mark.inkPressure=[.2,1,.5];}
 if(kind==='callout'){mark.path=[60,220,140,240,180,240];mark.textRect=[180,220,330,270];}
 const result=await markedPdf(bytes,[mark],flatten),painted=flatten&&kind!=='note',allowed=new Map([[doc.getPage(0).ref.toString(),painted?['Contents','Resources']:['Annots','Contents']]]),{after}=await verify(t,bytes,result,allowed);
 if(!painted){const old=doc.getPage(0).node.lookup(n('Contents'),PDFArray).asArray(),saved=after.getPage(0).node.lookup(n('Contents'),PDFArray).asArray();assert.deepEqual(saved.slice(1,-1).map(String),old.map(String));for(const [ref,operator]of [[saved[0],'q'],[saved.at(-1),'Q']])assert.equal(Buffer.from(decodePDFRawStream(after.context.lookup(ref)).decode()).toString().trim(),operator);}
 const oldResources=doc.getPage(0).node.lookup(n('Resources'),PDFDict),newResources=after.getPage(0).node.lookup(n('Resources'),PDFDict);for(const [key,value]of oldResources.entries()){const old=doc.context.lookup(value),saved=newResources.lookup(key);if(old instanceof PDFDict){assert.ok(saved instanceof PDFDict);for(const [name,ref]of old.entries())assert.equal(saved.get(name)?.toString(),ref.toString());}else assert.equal(saved?.toString(),old.toString());}
 const oldAnnots=doc.getPage(0).node.lookup(n('Annots'),PDFArray),savedAnnots=after.getPage(0).node.lookup(n('Annots'),PDFArray);
 assert.equal(savedAnnots.size(),oldAnnots.size()+(painted?0:1));
 for(let i=0;i<oldAnnots.size();i++)assert.equal(savedAnnots.get(i).toString(),oldAnnots.get(i).toString());
 if(painted){const xobjects=after.getPage(0).node.lookup(n('Resources'),PDFDict).lookup(n('XObject'),PDFDict),forms=xobjects.entries().filter(([key])=>key.decodeText().startsWith('PDFixMarkup'));assert.equal(forms.length,1);const appearance=after.context.lookup(forms[0][1]);assert.ok(Buffer.from(decodePDFRawStream(appearance).decode()).length>0);const contents=after.getPage(0).node.lookup(n('Contents'),PDFArray),program=Array.from({length:contents.size()},(_,i)=>Buffer.from(decodePDFRawStream(contents.lookup(i)).decode()).toString('ascii')).join('\n');assert.ok(program.includes(forms[0][0].toString()+' Do'));}
 else{const added=savedAnnots.lookup(savedAnnots.size()-1,PDFDict),subtype={highlight:'Highlight',underline:'Underline',note:'Text',text:'FreeText',ink:'Ink',line:'Line',arrow:'Line',cloud:'Square',callout:'FreeText'}[kind];assert.equal(added.get(n('Subtype')).toString(),'/'+subtype);assert.equal(added.get(n('Contents')).decodeText(),mark.text);}
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(result.bytes),isEvalSupported:false,standardFontDataUrl:path.resolve('node_modules/pdfjs-dist/standard_fonts').split(path.sep).join('/')+'/'});
 try{const pdf=await task.promise,page=await pdf.getPage(1);if(!painted){const rows=await page.getAnnotations();assert.ok(rows.some(row=>row.contentsObj?.str===mark.text));}else if(['text','callout'].includes(kind)){const text=(await page.getTextContent()).items.map(i=>i.str).join(' ');assert.ok(text.includes(mark.text));}else assert.ok((await page.getOperatorList()).fnArray.length>0);}finally{await task.destroy();}
});


function assertRetainedPayloads(doc){
 assert.equal(doc.getPageCount(),2);const field=doc.getForm().getTextField('Total'),form=doc.catalog.lookup(n('AcroForm'),PDFDict);assert.equal(field.getText(),'42');assert.equal(form.lookup(n('CO'),PDFArray).get(0).toString(),field.ref.toString());assert.equal(field.acroField.dict.lookup(n('AA'),PDFDict).lookup(n('C'),PDFDict).get(n('JS')).decodeText(),'event.value = 42;');assert.equal(doc.catalog.lookup(n('StructTreeRoot'),PDFDict).get(n('PrivateAudit')).decodeText(),'Keep logical structure object');assert.equal(doc.catalog.lookup(n('Outlines'),PDFDict).get(n('Count')).asNumber(),0);
 const tree=doc.catalog.lookup(n('Names'),PDFDict).lookup(n('EmbeddedFiles'),PDFDict).lookup(n('Names'),PDFArray);let found=false;for(let i=0;i<tree.size();i+=2)if(tree.get(i).decodeText()==='audit.txt'){const stream=tree.lookup(i+1,PDFDict).lookup(n('EF'),PDFDict).lookup(n('F'));assert.equal(Buffer.from(decodePDFRawStream(stream).decode()).toString(),'Exact attachment payload');found=true;}assert.ok(found,'Original attachment must still be reachable');const notes=doc.getPage(0).node.lookup(n('Annots'),PDFArray);assert.equal(notes.size(),2);assert.ok(notes.lookup(0,PDFDict).has(n('AP')));
}

test('metadata-only cleanup retains annotations, attachments, logical tags and form calculations on disk',async t=>{
 const input=await fixture(),original=Buffer.from(input),{sanitize}=require('../desktop/pdf-sanitize-codec.cjs'),result=await sanitize(input,{metadata:true,attachments:false,annotations:false,forms:false,actions:false}),root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-selective-cleanup-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const file=path.join(root,'copy.pdf');await fs.writeFile(file,result.bytes,{flag:'wx'});const saved=await PDFDocument.load(await fs.readFile(file),{updateMetadata:false});assertRetainedPayloads(saved);assert.equal(saved.context.trailerInfo.Info,undefined);assert.equal(saved.getTitle(),undefined);assert.equal(result.report.removedEntries.attachments,0);assert.equal(result.report.removedEntries.forms,0);assert.deepEqual(input,original);
});

test('portfolio addition preserves every old object and original attachment/tag/form payloads on disk',async t=>{
 const input=await fixture(),original=Buffer.from(input),codec=require('../desktop/pdf-portfolio-codec.cjs'),inventory=await codec.inspect(input),old=inventory.entries.find(item=>item.name==='audit.txt');assert.ok(inventory.buildAllowed);assert.ok(old);const extra=await PDFDocument.create();extra.addPage([200,300]).drawText('Added file');const extraBytes=Buffer.from(await extra.save()),sourceId=require('node:crypto').randomUUID(),result=await codec.build(input,{view:'D',entries:[{kind:'existing',id:old.id,name:old.name,description:old.description||''},{kind:'opened',sourceId,name:'added.pdf',description:'Added audit file'}],sources:[{sourceId,sha256:hash(extraBytes),size:extraBytes.length,bytesBase64:extraBytes.toString('base64')}]});
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-portfolio-preservation-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const file=path.join(root,'copy.pdf');await fs.writeFile(file,result.bytes,{flag:'wx'});const before=await PDFDocument.load(input,{updateMetadata:false}),after=await PDFDocument.load(await fs.readFile(file),{updateMetadata:false});assertRetainedPayloads(after);assert.equal(after.getTitle(),before.getTitle());for(const [ref,value]of before.context.enumerateIndirectObjects()){const saved=after.context.lookup(ref);assert.ok(saved);assert.equal(digest(saved,ref.toString()===before.context.trailerInfo.Root.toString()?['Names','Collection']:[]),digest(value,ref.toString()===before.context.trailerInfo.Root.toString()?['Names','Collection']:[]));}const reopened=await codec.inspect(await fs.readFile(file));assert.equal(reopened.entries.length,2);assert.equal(reopened.entries.find(item=>item.name==='added.pdf').sha256,hash(extraBytes));assert.deepEqual(input,original);
});

test('native repair keeps attachment/tag/form semantics and invalidates discarded reviewed output',{skip:process.platform!=='win32'},async t=>{
 const input=await fixture(),original=Buffer.from(input),root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-repair-preservation-')),Service=require('../desktop/pdf-repair-service.cjs').PdfRepairService,service=new Service({stagingDirectory:path.join(root,'jobs')}),id='audit-source',token=require('node:crypto').randomUUID(),source={ext:'pdf',bytes:input,fingerprint:hash(input)};t.after(()=>fs.rm(root,{recursive:true,force:true}));
 try{const inspected=await service.inspect(id,source,token);assert.equal(inspected.eligible,true,inspected.reason);const options={inspectionSha256:inspected.inspectionSha256,acknowledgeUnverifiable:true};await assert.rejects(service.repair(id,{...source,fingerprint:'0'.repeat(64)},token,options),/Inspect|source|STALE/i);const result=await service.repair(id,source,token,options),file=path.join(root,'copy.pdf');await fs.writeFile(file,result.bytes,{flag:'wx'});const saved=await PDFDocument.load(await fs.readFile(file),{updateMetadata:false});assertRetainedPayloads(saved);assert.equal(saved.getTitle(),'Retained route-audit title');assert.equal(result.report.strictCheck.code,0);assert.deepEqual(Buffer.from(service.output(id,source,token).bytes),Buffer.from(result.bytes));await service.discard(id,token);assert.throws(()=>service.output(id,source,token),/fresh|review|verified/i);assert.deepEqual(input,original);}finally{await service.dispose();}
});
