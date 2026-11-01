const {test}=require('node:test'),assert=require('node:assert/strict');
const {PDFDocument,PDFName,PDFString,PDFNumber}=require('pdf-lib');
const {pdfStructure,compareStructure}=require('./helpers/pdf-structure.cjs'),{richPdf:rich}=require('./helpers/rich-pdf.cjs');
const k=n=>PDFName.of(n);

test('the inventory finds pages, comments, fields with calculations, bookmarks, attachments and tags',async()=>{
 const s=await pdfStructure(await rich());
 assert.equal(s.pages.length,2);assert.deepEqual(s.annotations.filter(a=>a.type==='Text').map(a=>a.contents),['Check the qty']);
 assert.deepEqual(s.fields.map(f=>[f.name,f.value,f.calculation]),[['Qty','3',false],['Total',undefined,true]]);assert.deepEqual(s.outline,[{depth:0,title:'Order'}]);
 assert.deepEqual(s.attachments.map(a=>a.name),['quote.txt']);assert.ok(s.attachments[0].bytes>0);assert.equal(s.tags.present,true);assert.equal(s.tags.elements,2);assert.equal(s.info.Title,'Parts order');
});
test('a save that loses a calculation, a bookmark or an attachment is reported; the intended change is not',async()=>{
 const before=await rich(),doc=await PDFDocument.load(before);
 doc.getForm().getTextField('Qty').setText('5');doc.getForm().getTextField('Total').acroField.dict.delete(k('AA'));doc.catalog.delete(k('Outlines'));doc.catalog.delete(k('Names'));
 const r=await compareStructure(before,await doc.save(),[/^fields\[0\]/]);
 assert.equal(r.expected.length,1,'the changed Qty value is the intended change');
 assert.ok(r.unexpected.some(l=>l.startsWith('fields[1]')&&l.includes('"calculation":false')),'lost calculation reported');
 assert.ok(r.unexpected.some(l=>l.startsWith('outline')),'lost bookmark reported');assert.ok(r.unexpected.some(l=>l.startsWith('attachments')),'lost attachment reported');
 const unchanged=await compareStructure(before,before);assert.deepEqual(unchanged.unexpected,[]);
});
test('hostile structure: looping bookmarks, field kids and tag trees end quickly instead of hanging',async()=>{
 const doc=await PDFDocument.create(),page=doc.addPage([100,100]),ctx=doc.context;
 const o=ctx.nextRef(),a=ctx.nextRef(),b=ctx.nextRef();ctx.assign(a,ctx.obj({Title:PDFString.of('A'),Next:b,First:a}));ctx.assign(b,ctx.obj({Title:PDFString.of('B'),Next:a}));ctx.assign(o,ctx.obj({First:a}));doc.catalog.set(PDFName.of('Outlines'),o);
 const f=ctx.nextRef();ctx.assign(f,ctx.obj({T:PDFString.of('Loop'),Kids:[f]}));doc.catalog.set(PDFName.of('AcroForm'),ctx.obj({Fields:[f]}));
 const t=ctx.nextRef();ctx.assign(t,ctx.obj({S:'P',K:[t]}));doc.catalog.set(PDFName.of('StructTreeRoot'),ctx.obj({K:[t]}));
 const started=Date.now(),s=await pdfStructure(await doc.save());assert.ok(Date.now()-started<5000);assert.deepEqual(s.outline.map(x=>x.title),['A','B']);assert.equal(s.tags.elements,1);
});
