const {test}=require('node:test'),assert=require('node:assert/strict');
const {PDFDocument,PDFName,PDFArray,PDFDict}=require('pdf-lib');
const {inspectReview}=require('../desktop/pdf-review-codec.cjs');
const {writeReviewEdits}=require('../desktop/pdf-review-edit-codec.cjs');
const {freeTextSource}=require('./helpers/review-freetext.cjs');
const annotations=doc=>doc.getPage(0).node.lookup(PDFName.of('Annots'),PDFArray);
test('FreeText replies preserve original dictionary, appearance bytes/resources and rich text',async t=>{
  for(const variant of [{flags:4},{flags:4+128+512},{flags:4,rich:true}])await t.test(JSON.stringify(variant),async()=>{
    const bytes=await freeTextSource(variant),original=Buffer.from(bytes),inventory=await inspectReview(bytes,[1]),row=inventory.annotations[0];
    const recipe={version:1,inventorySha256:inventory.inventorySha256,pages:[1],changes:[{kind:'reply',parentKey:row.key,contents:'Réponse 中文',author:'Réviewer',state:'Accepted'}]};
    if(variant.rich||variant.flags!==4)await assert.rejects(writeReviewEdits(bytes,{...recipe,changes:[{kind:'comment',key:row.key,contents:'A replacement body'}]}),/unsupported|rich-text|grouped|lock/i);
    const result=await writeReviewEdits(bytes,recipe),before=await PDFDocument.load(bytes),after=await PDFDocument.load(result.bytes),parent=annotations(before).lookup(0,PDFDict),retained=annotations(after).lookup(0,PDFDict);
    assert.equal(parent.toString(),retained.toString());
    const a=parent.lookup(PDFName.of('AP'),PDFDict).lookup(PDFName.of('N')),b=retained.lookup(PDFName.of('AP'),PDFDict).lookup(PDFName.of('N'));
    assert.equal(a.dict.toString(),b.dict.toString());assert.deepEqual(Buffer.from(a.contents),Buffer.from(b.contents));
    const font=stream=>stream.dict.lookup(PDFName.of('Resources'),PDFDict).lookup(PDFName.of('Font'),PDFDict).lookup(PDFName.of('Helv'),PDFDict).toString();
    assert.equal(font(a),font(b));assert.equal(annotations(after).size(),2);
    const reply=annotations(after).lookup(1,PDFDict);assert.equal(reply.get(PDFName.of('IRT')).toString(),annotations(before).get(0).toString());
    assert.equal(reply.get(PDFName.of('Contents')).decodeText(),'Réponse 中文');assert.deepEqual(bytes,original);
  });
});
test('read-only FreeText refuses additive replies before creating a copy',async()=>{
  const bytes=await freeTextSource({flags:4+64}),inventory=await inspectReview(bytes,[1]);
  await assert.rejects(writeReviewEdits(bytes,{version:1,inventorySha256:inventory.inventorySha256,pages:[1],changes:[{kind:'reply',parentKey:inventory.annotations[0].key,contents:'Refused',author:'Reviewer',state:''}]}),/read-only/i);
});
test('plain FreeText body gets a real new appearance while every original indirect object is retained',async()=>{
  const bytes=await freeTextSource(),inventory=await inspectReview(bytes,[1]),out=await writeReviewEdits(bytes,{version:1,inventorySha256:inventory.inventorySha256,pages:[1],changes:[{kind:'comment',key:inventory.annotations[0].key,contents:'Updated drawing note'}]});
  const before=await PDFDocument.load(bytes),after=await PDFDocument.load(out.bytes),parent=annotations(before).lookup(0,PDFDict),edited=annotations(after).lookup(0,PDFDict);
  assert.equal(edited.get(PDFName.of('Contents')).decodeText(),'Updated drawing note');assert.equal(edited.get(PDFName.of('PrivateFixture')).decodeText(),'Retain private parent data');
  for(const [ref,object]of before.context.enumerateIndirectObjects())if(ref.toString()!==annotations(before).get(0).toString())assert.equal(after.context.lookup(ref).toString(),object.toString(),ref.toString());
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(out.bytes),isEvalSupported:false});
  try{const doc=await task.promise,[row]=await(await doc.getPage(1)).getAnnotations();assert.equal(row.contentsObj.str,'Updated drawing note');assert.equal(row.textContent.join(''),'Updated drawing note');assert.equal(row.hasAppearance,true);}finally{await task.destroy();}
  assert.notEqual(edited.lookup(PDFName.of('AP'),PDFDict).get(PDFName.of('N')).toString(),parent.lookup(PDFName.of('AP'),PDFDict).get(PDFName.of('N')).toString());
});
test('FreeText body refuses overflowing text, unsupported glyphs, callouts and custom fonts',async()=>{
  for(const mode of ['overflow','glyph','callout','font']){
    let bytes=await freeTextSource();const pdf=await PDFDocument.load(bytes),note=annotations(pdf).lookup(0,PDFDict);
    if(mode==='callout')note.set(PDFName.of('CL'),pdf.context.obj([0,0,10,10]));
    if(mode==='font')note.set(PDFName.of('DA'),pdf.context.obj('/UnknownFont 12 Tf 0 g'));
    bytes=Buffer.from(await pdf.save({useObjectStreams:false}));const inventory=await inspectReview(bytes,[1]);
    await assert.rejects(writeReviewEdits(bytes,{version:1,inventorySha256:inventory.inventorySha256,pages:[1],changes:[{kind:'comment',key:inventory.annotations[0].key,contents:mode==='glyph'?'中文':mode==='overflow'?'too much text '.repeat(100):'Changed'}]}),/FreeText appearance/);
  }
});

test('plain centered and right-aligned appearance uses its actual unkerned Tj advances',async()=>{for(const alignment of [1,2]){const pdf=await PDFDocument.load(await freeTextSource()),n=annotations(pdf).lookup(0,PDFDict);n.set(PDFName.of('Q'),pdf.context.obj(alignment));const bytes=Buffer.from(await pdf.save({useObjectStreams:false})),inventory=await inspectReview(bytes,[1]),out=await writeReviewEdits(bytes,{version:1,inventorySha256:inventory.inventorySha256,pages:[1],changes:[{kind:'comment',key:inventory.annotations[0].key,contents:'AVAV'}]}),saved=await PDFDocument.load(out.bytes),stream=annotations(saved).lookup(0,PDFDict).lookup(PDFName.of('AP'),PDFDict).lookup(PDFName.of('N')),commands=Buffer.from(stream.contents).toString('ascii');assert.match(commands,/0 Tc\n0 Tw\n100 Tz\n0 Ts\n0 Tr/);assert.match(commands,alignment===1?/1 0 0 1 93\.992 /:/1 0 0 1 183\.984 /);}});
