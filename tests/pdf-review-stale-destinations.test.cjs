const {test}=require('node:test'),assert=require('node:assert/strict'),{PDFDocument,PDFName,PDFRef,PDFString,PDFArray,PDFDict}=require('pdf-lib');
const {inspectReview}=require('../desktop/pdf-review-codec.cjs'),{writeReviewEdits}=require('../desktop/pdf-review-edit-codec.cjs');
async function source(privateReference=false){const doc=await PDFDocument.create(),page=doc.addPage([400,600]);page.drawText('Drawing');const c=doc.context,link=c.register(c.obj({Type:'Annot',Subtype:'Link',Rect:[40,100,140,120],A:{S:'GoTo',D:[PDFRef.of(99999,0),'Fit']}})),note=c.obj({Type:'Annot',Subtype:'Text',Rect:[40,200,60,220],Contents:PDFString.of('Source note'),F:4});if(privateReference)note.set(PDFName.of('UnknownPrivate'),PDFRef.of(88888,0));page.node.addAnnot(link);page.node.addAnnot(c.register(note));return Buffer.from(await doc.save({useObjectStreams:false}));}
test('inactive stale destination does not block review and remains exact through a reply copy',async()=>{
 const bytes=await source(),inventory=await inspectReview(bytes,[1]);assert.match(inventory.warnings.join(' '),/destination arrays point to unavailable/);const parent=inventory.annotations.find(row=>row.subtype==='Text');const result=await writeReviewEdits(bytes,{version:1,inventorySha256:inventory.inventorySha256,pages:[1],changes:[{kind:'reply',parentKey:parent.key,contents:'Reviewed',author:'Reviewer',state:''}]});
 const before=await PDFDocument.load(bytes),after=await PDFDocument.load(result.bytes),link=doc=>doc.getPage(0).node.lookup(PDFName.of('Annots'),PDFArray).lookup(0,PDFDict);assert.equal(link(before).toString(),link(after).toString());assert.equal(after.context.lookup(PDFRef.of(99999,0)),undefined);assert.match(result.report.outputInventory.warnings.join(' '),/unavailable objects/);
});
test('other dangling private references still fail closed',async()=>{await assert.rejects(inspectReview(await source(true),[1]),/cannot be resolved/);});

test('indirect reference chains are not direct nesting; deep direct objects still refuse',async()=>{
 const {preservingPdf}=require('../desktop/pdf-review-edit-codec.cjs'),doc=await PDFDocument.create(),c=doc.context;doc.addPage();let next=c.register(c.obj({End:true}));
 for(let i=0;i<100;i++)next=c.register(c.obj({Next:next}));assert.doesNotThrow(()=>preservingPdf.graph(doc));
 let nested=c.obj({End:true});for(let i=0;i<82;i++)nested=c.obj({Nested:nested});c.register(nested);assert.throws(()=>preservingPdf.graph(doc),/direct-object nesting/);
});
