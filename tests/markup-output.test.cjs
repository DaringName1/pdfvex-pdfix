const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {PDFDocument,PDFName,PDFDict,PDFArray,PDFHexString,PDFRef}=require('pdf-lib');
const mark=(kind,extra={})=>({id:'pdfix-'+randomUUID(),kind,page:0,color:'blue',text:kind==='note'?'Note 中文 <script>literal</script>':kind==='text'?'A reviewed text box':'',fontSize:12,rotation:0,rect:[30,30,180,110],...extra});
test('standard PDF markup round trips, preserves existing structures and removes its own note data from an editable copy',async()=>{
 const {markedPdf,inspectMarkupPdf}=await import('../src/markup-output.js');const doc=await PDFDocument.create(),page=doc.addPage([400,600]);page.drawText('Original selectable text',{x:30,y:500});doc.setTitle('Keep original metadata');const field=doc.getForm().createTextField('Name');field.setText('Kept form value');field.addToPage(page,{x:200,y:350,width:150,height:30});
 const ctx=doc.context;page.node.addAnnot(ctx.register(ctx.obj({Type:'Annot',Subtype:'Square',Rect:[220,100,300,170],Contents:PDFHexString.fromText('Existing review'),C:[1,0,0],F:4})));page.node.addAnnot(ctx.register(ctx.obj({Type:'Annot',Subtype:'Link',Rect:[20,480,200,515],A:{S:'URI',URI:PDFHexString.fromText('https://example.invalid/inert')}})));
 const source=await doc.save(),original=source.slice(),records=[mark('note'),mark('text',{rect:[30,180,230,240]}),mark('highlight',{rect:[28,470,240,501],quads:[30,499,230,499,30,472,230,472]}),mark('underline',{rect:[28,430,240,461],quads:[30,459,230,459,30,432,230,432]}),mark('ink',{path:[40,50,80,70,150,80]})];
 const output=await markedPdf(source,records);assert.equal(output.expected.length,5);const reopened=await PDFDocument.load(output.bytes);assert.equal(reopened.getTitle(),'Keep original metadata');assert.equal(reopened.getForm().getTextField('Name').getText(),'Kept form value');assert.equal(reopened.getPage(0).node.lookup(PDFName.of('Annots'),PDFArray).size(),8);
 const info=await inspectMarkupPdf(output.bytes);assert.deepEqual(info.marks,records);assert.equal(info.foreign,3);assert.deepEqual(source,original);
 const removed=await markedPdf(output.bytes,records.filter(r=>r.kind!=='note'));const again=await inspectMarkupPdf(removed.bytes);assert.equal(again.marks.length,4);const parsed=await PDFDocument.load(removed.bytes);assert.equal(parsed.context.enumerateIndirectObjects().some(([,object])=>object instanceof PDFDict&&parsed.context.lookup(object.get(PDFName.of('Contents')))?.decodeText?.().includes('Note 中文')),false);
 const flattened=await markedPdf(output.bytes,records,true);assert.equal(flattened.flattened,4);assert.equal(flattened.expected.length,1);const flatInfo=await inspectMarkupPdf(flattened.bytes);assert.equal(flatInfo.marks[0].kind,'note');assert.equal(flatInfo.foreign,3);
});
test('invalid geometry, oversized strokes, unsupported text, signatures and encrypted writing fail without changing inputs',async()=>{
 const {markedPdf,inspectMarkupPdf}=await import('../src/markup-output.js'),{validateMarks,areaQuad,boundsOf}=await import('../src/markup-model.js');const doc=await PDFDocument.create();doc.addPage([300,400]);const bytes=await doc.save(),copy=bytes.slice();
 await assert.rejects(markedPdf(bytes,[mark('note',{rect:[-10,30,180,110]})]),/boundary/);await assert.rejects(markedPdf(bytes,[mark('ink',{path:Array(2002).fill(40)})]),/points/);await assert.rejects(markedPdf(bytes,[mark('text',{text:'中文'})]),/Western font/);await assert.rejects(markedPdf(bytes,[mark('text',{text:'too much text to fit',rect:[30,30,40,40]})]),/fit/);assert.deepEqual(bytes,copy);
 const ctx=doc.context;ctx.register(ctx.obj({Type:'Sig',ByteRange:[0,1,2,3]}));await assert.rejects(inspectMarkupPdf(await doc.save()),/signature/);
 await assert.rejects(inspectMarkupPdf(await fs.readFile(path.resolve('tests/fixtures/password.pdf'))),/Protected|encrypted/);
 assert.throws(()=>validateMarks(Array(501).fill(mark('note')),[{box:[0,0,300,400]}]),/500/);assert.deepEqual(boundsOf(areaQuad({convertToPdfPoint:(x,y)=>[y+10,400-x]}, {left:30,right:100,top:20,bottom:40})),[30,300,50,370]);
});

test('nested direct signature markers cannot slip through markup read or write',async()=>{
 const {markedPdf,inspectMarkupPdf}=await import('../src/markup-output.js');
 for(const marker of [{FT:'Sig'},{Type:'Sig'},{ByteRange:[0,1,2,3]},{DocMDP:{}}]){
  const doc=await PDFDocument.create();doc.addPage([300,400]);doc.context.register(doc.context.obj({Private:{Nested:marker}}));
  const bytes=Buffer.from(await doc.save({useObjectStreams:false})),before=Buffer.from(bytes);
  await assert.rejects(inspectMarkupPdf(bytes),/signature/);await assert.rejects(markedPdf(bytes,[mark('note')]),/signature/);assert.deepEqual(bytes,before);
 }
});
test('PDFix marks with existing review replies cannot be replaced and source reply relationships remain intact',async()=>{
 const {markedPdf,inspectMarkupPdf}=await import('../src/markup-output.js'),doc=await PDFDocument.create();doc.addPage([400,600]);const output=await markedPdf(await doc.save(),[mark('note')]),withReply=await PDFDocument.load(output.bytes),page=withReply.getPage(0),parent=page.node.lookup(PDFName.of('Annots'),PDFArray).get(0);page.node.addAnnot(withReply.context.register(withReply.context.obj({Type:'Annot',Subtype:'Text',Rect:[200,200,220,220],IRT:parent,Contents:PDFHexString.fromText('Keep this reply')})));const source=await withReply.save();await assert.rejects(inspectMarkupPdf(source),/replies|shared/);await assert.rejects(markedPdf(source,[]),/replies|shared/);assert.ok(parent instanceof PDFRef);
});

test('externally changed InkList or width remains foreign and survives another markup copy unchanged',async()=>{
 const {markedPdf,inspectMarkupPdf}=await import('../src/markup-output.js'),doc=await PDFDocument.create();doc.addPage([400,600]);const original=await markedPdf(await doc.save(),[mark('ink',{path:[40,50,80,70,150,80]})]);
 for(const change of ['path','extra stroke','width']){
  const edited=await PDFDocument.load(original.bytes),ink=edited.getPage(0).node.lookup(PDFName.of('Annots'),PDFArray).lookup(0,PDFDict),ctx=edited.context;
  if(change==='path')ink.set(PDFName.of('InkList'),ctx.obj([[40,50,95,65,150,80]]));
  if(change==='extra stroke')ink.set(PDFName.of('InkList'),ctx.obj([[40,50,80,70,150,80],[45,55,60,60]]));
  if(change==='width')ink.set(PDFName.of('BS'),ctx.obj({W:6}));
  ink.set(PDFName.of('PrivateReview'),PDFHexString.fromText('Keep imported edits'));const input=await edited.save(),before=input.slice(),info=await inspectMarkupPdf(input);assert.equal(info.marks.length,0);assert.equal(info.foreign,1);
  const output=await markedPdf(input,[mark('note')]),parsed=await PDFDocument.load(output.bytes),kept=parsed.getPage(0).node.lookup(PDFName.of('Annots'),PDFArray).asArray().map(ref=>parsed.context.lookup(ref)).find(dict=>dict.get(PDFName.of('Subtype')).toString()==='/Ink');
  const lists=d=>d.lookup(PDFName.of('InkList'),PDFArray).asArray().map(ref=>d.context.lookup(ref,PDFArray).asArray().map(n=>n.asNumber()));assert.deepEqual(lists(kept),lists(ink));assert.equal(kept.lookup(PDFName.of('BS'),PDFDict).lookup(PDFName.of('W')).asNumber(),change==='width'?6:2);assert.equal(kept.lookup(PDFName.of('PrivateReview')).decodeText(),'Keep imported edits');assert.deepEqual(input,before);
 }
});

test('changed appearance bytes or graphics state stay foreign even when original metadata remains',async()=>{
 const {markedPdf,inspectMarkupPdf}=await import('../src/markup-output.js'),{PDFStream,PDFRawStream}=require('pdf-lib'),zlib=require('node:zlib'),pdf=await PDFDocument.create();pdf.addPage([400,600]);const output=await markedPdf(await pdf.save(),[mark('ink',{path:[40,50,80,70,150,80],inkOpacity:.5})]);
 for(const change of ['stream','state','metadata']){const doc=await PDFDocument.load(output.bytes),ink=doc.getPage(0).node.lookup(PDFName.of('Annots'),PDFArray).lookup(0,PDFDict),ref=ink.lookup(PDFName.of('AP'),PDFDict).get(PDFName.of('N')),ap=doc.context.lookup(ref,PDFStream);if(change==='stream'){const plain=zlib.inflateSync(Buffer.from(ap.getContents())).toString().replace('2 w','6 w');doc.context.assign(ref,PDFRawStream.of(ap.dict.clone(doc.context),zlib.deflateSync(Buffer.from(plain))));}else if(change==='state')ap.dict.lookup(PDFName.of('Resources'),PDFDict).lookup(PDFName.of('ExtGState'),PDFDict).lookup(PDFName.of('GSInk'),PDFDict).set(PDFName.of('CA'),doc.context.obj(.125));else{const data=JSON.parse(ink.lookup(PDFName.of('PDFixData')).decodeText());data.text='Externally changed metadata';ink.set(PDFName.of('Contents'),PDFHexString.fromText(data.text));ink.set(PDFName.of('PDFixData'),PDFHexString.fromText(JSON.stringify(data)));}
 const source=await doc.save(),info=await inspectMarkupPdf(source);assert.equal(info.marks.length,0);assert.equal(info.foreign,1);const saved=await markedPdf(source,[mark('note')]),again=await PDFDocument.load(saved.bytes),kept=again.getPage(0).node.lookup(PDFName.of('Annots'),PDFArray).asArray().map(r=>again.context.lookup(r)).find(d=>d.get(PDFName.of('Subtype')).toString()==='/Ink');assert.deepEqual(Uint8Array.from(again.context.lookup(kept.lookup(PDFName.of('AP'),PDFDict).get(PDFName.of('N')),PDFStream).getContents()),Uint8Array.from(doc.context.lookup(ref,PDFStream).getContents()));}
});
