const test=require('node:test'),assert=require('node:assert/strict');
const {PDFDocument,PDFName,PDFString,PDFNumber}=require('pdf-lib');
const {inspectPageRevision,writePageRevision}=require('../desktop/pdf-page-revision-codec.cjs');
const {packRevisionSources}=require('../desktop/pdf-page-revision-validation.cjs');
async function fixture({width=400,flags=4}={}){
 const doc=await PDFDocument.create(),page=doc.addPage([width,600]);page.drawText('Sheet');
 const parent=doc.context.register(doc.context.obj({Type:'Annot',Subtype:'Text',Rect:[20,20,40,40],P:page.ref,NM:PDFString.of('parent'),Contents:PDFString.of('keep'),F:flags}));
 const reply=doc.context.register(doc.context.obj({Type:'Annot',Subtype:'Text',Rect:[50,20,70,40],P:page.ref,NM:PDFString.of('reply'),Contents:PDFString.of('response'),IRT:parent,RT:'R',F:4}));page.node.set(PDFName.of('Annots'),doc.context.obj([parent,reply]));
 return Buffer.from(await doc.save({useObjectStreams:false}));
}
async function prepared(source,replacement){const bundle=packRevisionSources(source,replacement),inspection=await inspectPageRevision(bundle);return {bundle,inspection,draft:{version:1,inspectionSha256:inspection.inspectionSha256,mappings:[{sourcePage:1,replacementPage:1,sourceCommentRefs:inspection.source.pages[0].annotations.map(a=>a.objectRef),sourceLinks:'omit',replacementComments:'omit',geometryReviewed:true}]}};}
test('sheet carry refuses geometry mismatch while explicit omission permits the replacement',async()=>{
 const source=await fixture(),replacement=await fixture({width:420}),{bundle,draft}=await prepared(source,replacement);
 await assert.rejects(writePageRevision(bundle,draft),/exactly matching/);
 draft.mappings[0].sourceCommentRefs=[];const result=await writePageRevision(bundle,draft);const output=await PDFDocument.load(result.bytes);assert.equal(output.getPage(0).getWidth(),420);assert.equal(output.getPage(0).node.lookup(PDFName.of('Annots')).size(),0);
});

test('reviewed artwork alignment fits different geometry while source comments and objects stay exact',async()=>{
 const source=await fixture(),replacementDoc=await PDFDocument.create();replacementDoc.addPage([800,600]).drawText('Replacement drawing',{x:100,y:200,size:20});
 const {bundle,draft}=await prepared(source,await replacementDoc.save({useObjectStreams:false}));draft.mappings[0].alignment={mode:'fit-original',scale:1,shiftX:10,shiftY:-5};
 const result=await writePageRevision(bundle,draft),before=await PDFDocument.load(source),after=await PDFDocument.load(result.bytes);assert.equal(after.getPage(0).getWidth(),400);assert.equal(after.getPage(0).getHeight(),600);
 const pageRef=before.getPage(0).ref.toString();for(const [ref,object]of before.context.enumerateIndirectObjects())if(ref.toString()!==pageRef)assert.equal(after.context.lookup(ref).toString(),object.toString(),ref.toString());
 const old=before.getPage(0).node.lookup(PDFName.of('Annots')),retained=after.getPage(0).node.lookup(PDFName.of('Annots'));assert.equal(retained.toString(),old.toString());
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(result.bytes),isEvalSupported:false});
 try{const doc=await task.promise,content=await(await doc.getPage(1)).getTextContent(),text=content.items.find(item=>item.str==='Replacement drawing');assert.ok(text);assert.ok(Math.abs(text.transform[4]-60)<.01);assert.ok(Math.abs(text.transform[5]-245)<.01);assert.equal(content.items.some(item=>item.str==='Sheet'),false);}finally{await task.destroy();}
});

test('artwork alignment refuses imported untransformed comments, bad values and invisible placement',async()=>{
 const source=await fixture(),replacement=await fixture({width:800});
 for(const mode of ['comments','scale','offset','invisible','rotation','null']){
  const pair=await prepared(source,replacement),row=pair.draft.mappings[0];row.alignment={mode:'fit-original',scale:1,shiftX:0,shiftY:0};
  if(mode==='comments')row.replacementComments='include';if(mode==='scale')row.alignment.scale=Infinity;if(mode==='offset')row.alignment.shiftY=14401;if(mode==='invisible')row.alignment.shiftX=14000;if(mode==='null')row.alignment=null;
  if(mode==='rotation'){const pdf=await PDFDocument.load(replacement);pdf.getPage(0).node.set(PDFName.of('Rotate'),PDFNumber.of(90));const next=await prepared(source,await pdf.save());pair.bundle=next.bundle;pair.draft.inspectionSha256=next.draft.inspectionSha256;}
  await assert.rejects(writePageRevision(pair.bundle,pair.draft),/align|rotation/i,mode);
 }
});
test('sheet carry refuses broken reply groups and protected comments',async()=>{
 const source=await fixture(),replacement=await fixture(),a=await prepared(source,replacement);a.draft.mappings[0].sourceCommentRefs.pop();await assert.rejects(writePageRevision(a.bundle,a.draft),/complete popup\/reply group/);
 const locked=await prepared(await fixture({flags:4|128}),replacement);assert.equal(locked.inspection.source.pages[0].annotations[0].supported,false);await assert.rejects(writePageRevision(locked.bundle,locked.draft),/Locked\/read-only/);
});
test('sheet revision refuses changed sources after inspection and duplicate physical mappings',async()=>{
 const source=await fixture(),replacement=await fixture(),a=await prepared(source,replacement);const changed=await PDFDocument.load(source);changed.getPage(0).node.set(PDFName.of('Rotate'),PDFNumber.of(90));await assert.rejects(writePageRevision(packRevisionSources(await changed.save(),replacement),a.draft),/changed/);
 a.draft.mappings.push({...a.draft.mappings[0]});await assert.rejects(writePageRevision(a.bundle,a.draft),/unique replacement/);
});
