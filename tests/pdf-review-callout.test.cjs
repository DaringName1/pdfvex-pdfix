const {test}=require('node:test'),assert=require('node:assert/strict');
const {PDFDocument,PDFName,PDFArray,PDFDict,PDFString}=require('pdf-lib');
const {inspectReview}=require('../desktop/pdf-review-codec.cjs');
const {writeReviewEdits}=require('../desktop/pdf-review-edit-codec.cjs');
const {calloutSource}=require('./helpers/review-callout.cjs');
const k=PDFName.of,note=doc=>doc.getPage(0).node.lookup(k('Annots'),PDFArray).lookup(0,PDFDict);
async function edit(bytes,text='Updated drawing callout'){
 const report=await inspectReview(bytes,[1]);return writeReviewEdits(bytes,{version:1,inventorySha256:report.inventorySha256,pages:[1],changes:[{kind:'comment',key:report.annotations[0].key,contents:text}]});
}
for(const spec of [{points:2,ending:'None',rotation:0},{points:3,ending:'OpenArrow',rotation:90},{points:3,ending:'ClosedArrow',rotation:270}])test('standard callout text preserves geometry and original objects '+JSON.stringify(spec),async()=>{
 const bytes=await calloutSource(spec),original=Buffer.from(bytes),result=await edit(bytes),before=await PDFDocument.load(bytes),after=await PDFDocument.load(result.bytes);
 const originalRef=before.getPage(0).node.lookup(k('Annots'),PDFArray).get(0).toString(),a=note(before),b=note(after);
 for(const [ref,object]of before.context.enumerateIndirectObjects())if(ref.toString()!==originalRef)assert.equal(after.context.lookup(ref).toString(),object.toString(),ref.toString());
 for(const [key,value]of a.entries())if(!['Contents','M','AP'].includes(key.decodeText()))assert.equal(b.get(key).toString(),value.toString(),key.toString());
 assert.equal(b.get(k('Contents')).decodeText(),'Updated drawing callout');
 const stream=b.lookup(k('AP'),PDFDict).lookup(k('N')),commands=Buffer.from(stream.contents).toString('ascii');
 assert.match(commands,/80 20 190 60 re f/);assert.match(commands,/20 10 m/);assert.match(commands,spec.points===2?/80 35 l/:/50 35 l\n80 35 l/);
 assert.match(commands,/1 0 0 1 84 64 Tm/);assert.deepEqual(bytes,original);
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(result.bytes),isEvalSupported:false});
 try{const pdf=await task.promise,[row]=await(await pdf.getPage(1)).getAnnotations();assert.equal(row.contentsObj.str,'Updated drawing callout');assert.equal(row.textContent.join(''),'Updated drawing callout');assert.equal(row.hasAppearance,true);}finally{await task.destroy();}
});
test('unsafe or unsupported callout geometry refuses without altering source bytes',async t=>{
 const variants={
  missingIntent:(d,c)=>d.delete(k('IT')),
  missingInsets:(d,c)=>d.delete(k('RD')),
  badInsetCount:(d,c)=>d.set(k('RD'),c.obj([1,2,3])),
  negativeInset:(d,c)=>d.set(k('RD'),c.obj([-1,20,10,20])),
  tinyBox:(d,c)=>d.set(k('RD'),c.obj([260,20,10,20])),
  badLineCount:(d,c)=>d.set(k('CL'),c.obj([60,340,120])),
  outside:(d,c)=>d.set(k('CL'),c.obj([0,0,120,365])),
  emptySegment:(d,c)=>d.set(k('CL'),c.obj([60,340,60,340,120,365])),
  wrongAttachment:(d,c)=>d.set(k('CL'),c.obj([60,340,90,365,140,365])),
  tipInsideBox:(d,c)=>d.set(k('CL'),c.obj([150,365,120,365])),
  hairlineBorder:(d,c)=>d.set(k('BS'),c.obj({W:0,S:'S'})),
  unsupportedEnding:(d,c)=>d.set(k('LE'),k('Diamond')),
  clippedArrow:(d,c)=>d.set(k('CL'),c.obj([40.1,330.1,120,365])),
  coloredText:(d,c)=>d.set(k('DA'),PDFString.of('/Helv 12 Tf 1 0 0 rg')),
  borderEffect:(d,c)=>d.set(k('BE'),c.obj({S:'C',I:1})),
  richText:(d,c)=>d.set(k('RC'),PDFString.of('<body>Original free text</body>')),
  locked:(d,c)=>d.set(k('F'),c.obj(132))
 };
 for(const [name,mutate]of Object.entries(variants))await t.test(name,async()=>{
  const doc=await PDFDocument.load(await calloutSource());mutate(note(doc),doc.context);const bytes=Buffer.from(await doc.save({useObjectStreams:false})),original=Buffer.from(bytes);
  await assert.rejects(edit(bytes),/FreeText appearance|rich-text|lock/i);assert.deepEqual(bytes,original);
 });
});
test('callout overflow is measured against inset text box, not the full rectangle',async()=>{
 const bytes=await calloutSource();await assert.rejects(edit(bytes,'Replacement words '.repeat(80)),/does not fit/);
});
