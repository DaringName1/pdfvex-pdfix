const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {PDFDocument,PDFName,PDFString}=require('pdf-lib');
const operations=import('../src/pdf-operations.js');
const fixture=name=>fs.readFile(path.join(__dirname,'fixtures',name));
test('annotation-page warning ignores empty direct and indirect arrays',async()=>{
  const {inspectPdf}=await operations,doc=await PDFDocument.create();
  doc.addPage().node.set(PDFName.of('Annots'),doc.context.obj([]));
  doc.addPage().node.set(PDFName.of('Annots'),doc.context.register(doc.context.obj([])));
  const note=doc.context.register(doc.context.obj({Type:'Annot',Subtype:'Text',Rect:[10,10,20,20],Contents:PDFString.of('Review')}));
  doc.addPage().node.set(PDFName.of('Annots'),doc.context.obj([note]));
  assert.equal((await inspectPdf(await doc.save())).annotationPages,1);
});
test('reorder/rotate/remove/extract/duplicate/combine output reopens; inputs stay unchanged',async()=>{
  const {organizePdf,inspectPdf}=await operations;const original=await fixture('reading-sample.pdf'),scan=await fixture('scan-only.pdf');const initial=Buffer.from(original);const plan=[{source:0,index:2,turn:90},{source:0,index:0,turn:0},{source:0,index:0,turn:180},{source:1,index:0,turn:0}];
  const output=await organizePdf([{bytes:original},{bytes:scan}],plan);const doc=await PDFDocument.load(output.bytes);assert.equal(doc.getPageCount(),4);assert.equal(doc.getPage(0).getRotation().angle,90);assert.equal(doc.getPage(2).getRotation().angle,180);assert.equal(output.pageCount,4);assert.deepEqual(original,initial);assert.deepEqual(await fixture('reading-sample.pdf'),initial);assert.equal((await inspectPdf(scan)).pages.length,1);
  const extracted=await organizePdf([{bytes:original}],[{source:0,index:1,turn:0}]);assert.equal((await PDFDocument.load(extracted.bytes)).getPageCount(),1);
});
test('encrypted/form PDFs and invalid/empty plans fail without output',async()=>{
  const {organizePdf,inspectPdf}=await operations;await assert.rejects(inspectPdf(await fixture('password.pdf')),/password-protected/);
  const form=await PDFDocument.create();form.addPage();form.getForm().createTextField('name');await assert.rejects(inspectPdf(await form.save()),/forms or signatures/);
  const original=await fixture('reading-sample.pdf');await assert.rejects(organizePdf([{bytes:original}],[]),/Keep between/);await assert.rejects(organizePdf([{bytes:original}],[{source:0,index:99,turn:0}]),/invalid/);await assert.rejects(organizePdf([{bytes:original}],[{source:0,index:1,turn:45}]),/invalid/);
});

test('fresh page copies refuse orphan signatures, certification, attachments and accessibility tags',async()=>{
 const {inspectPdf,organizePdf,splitPdf}=await operations;
 for(const kind of ['orphan signature','nested signature','certification','tags','attachment']){
  const doc=await PDFDocument.create();doc.addPage();const ctx=doc.context,n=PDFName.of;
  if(kind==='orphan signature')ctx.register(ctx.obj({Type:'Sig',ByteRange:[0,1,2,3]}));
  if(kind==='nested signature')ctx.register(ctx.obj({Private:{FT:'Sig'}}));
  if(kind==='certification')doc.catalog.set(n('Perms'),ctx.obj({DocMDP:ctx.register(ctx.obj({Type:'Sig'}))}));
  if(kind==='tags')doc.catalog.set(n('StructTreeRoot'),ctx.register(ctx.obj({Type:'StructTreeRoot',K:[]})));
  if(kind==='attachment')await doc.attach(Buffer.from('Keep attachment'),'receipt.txt');
  const bytes=await doc.save({useObjectStreams:false}),original=Buffer.from(bytes),pattern=/signature|certification|tags|attached files/i;
  await assert.rejects(inspectPdf(bytes),pattern);
  await assert.rejects(organizePdf([{bytes}],[{source:0,index:0,turn:90}]),pattern);
  await assert.rejects(splitPdf([{bytes}],[{source:0,index:0,turn:0},{source:0,index:0,turn:0}],[[0],[1]]),pattern);
  assert.deepEqual(Buffer.from(bytes),original);
 }
});
test('page annotations/actions and source catalog metadata are excluded from new copies',async()=>{
  const {organizePdf}=await operations;const source=await PDFDocument.create();const page=source.addPage();source.setTitle('Private source metadata');const annotation=source.context.obj({Type:'Annot',Subtype:'Link',Rect:[0,0,100,100],A:{S:'JavaScript',JS:PDFString.of('alert(1)')}});page.node.set(PDFName.of('Annots'),source.context.obj([source.context.register(annotation)]));page.node.set(PDFName.of('AA'),source.context.obj({O:{S:'JavaScript',JS:PDFString.of('alert(2)')}}));const output=await organizePdf([{bytes:await source.save()}],[{source:0,index:0,turn:0}]);const reopened=await PDFDocument.load(output.bytes);assert.equal(output.removedAnnotations,true);assert.equal(reopened.getTitle(),undefined);assert.equal(reopened.getPage(0).node.get(PDFName.of('Annots')),undefined);assert.equal(reopened.getPage(0).node.get(PDFName.of('AA')),undefined);
});

test('visual crop edges respect all clockwise rotations and offset/intersected page boxes',async()=>{
  const {organizePdf,inspectPdf}=await operations;const source=await PDFDocument.create();const p=source.addPage([420,320]);p.setMediaBox(-20,-30,420,320);p.setCropBox(10,0,360,240);p.drawText('Keep selectable content',{x:100,y:100});const bytes=await source.save(),original=Buffer.from(bytes),info=(await inspectPdf(bytes)).pages[0];assert.deepEqual(info.crop,{x:10,y:0,width:360,height:240});
  const unit=72/25.4,crop={top:1,right:2,bottom:3,left:4};
  const raw=[[1,2,3,4],[2,3,4,1],[3,4,1,2],[4,1,2,3]];
  for(const turn of [0,90,180,270]){const out=await organizePdf([{bytes}],[{source:0,index:0,turn,crop}]),doc=await PDFDocument.load(out.bytes),b=doc.getPage(0).getCropBox(),r=raw[turn/90];assert.ok(Math.abs(b.x-(10+r[3]*unit))<1e-6);assert.ok(Math.abs(b.y-r[2]*unit)<1e-6);assert.ok(Math.abs(b.width-(360-(r[1]+r[3])*unit))<1e-6);assert.ok(Math.abs(b.height-(240-(r[0]+r[2])*unit))<1e-6);assert.equal(doc.getPage(0).getRotation().angle,turn);assert.deepEqual(doc.getPage(0).getTrimBox(),b);}
  assert.deepEqual(Buffer.from(bytes),original);
});

test('crop then resize creates exact paper geometry, embeds vector content and supports blank pages',async()=>{
 const {organizePdf}=await operations;const source=await PDFDocument.create();const artwork=source.addPage([300,200]);artwork.drawText('Selectable vector artwork',{x:40,y:60});artwork.node.set(PDFName.of('Group'),source.context.obj({S:'Transparency',CS:'DeviceRGB',I:true,K:false}));source.addPage([300,200]);const bytes=await source.save();
 for(const turn of [0,90,180,270])for(const paper of ['a4','letter','custom']){const out=await organizePdf([{bytes}],[{source:0,index:0,turn,crop:{top:2,right:3,bottom:4,left:5},resize:{paper,orientation:'landscape',margin:10,width:250,height:150}},{source:0,index:1,turn,resize:{paper:'letter',orientation:'portrait',margin:0}}]);const doc=await PDFDocument.load(out.bytes),page=doc.getPage(0),dimensions=paper==='a4'?[297*72/25.4,210*72/25.4]:paper==='letter'?[792,612]:[250*72/25.4,150*72/25.4];assert.equal(page.getRotation().angle,0);assert.ok(Math.abs(page.getWidth()-dimensions[0])<1e-6);assert.ok(Math.abs(page.getHeight()-dimensions[1])<1e-6);const objects=page.node.Resources().lookup(PDFName.of('XObject'));assert.ok(objects);assert.ok(objects.entries().some(([,ref])=>doc.context.lookup(ref).dict?.lookup(PDFName.of('Group'))?.get(PDFName.of('S'))?.toString()==='/Transparency'));assert.equal(doc.getPage(1).getWidth(),612);assert.equal(doc.getPage(1).getHeight(),792);assert.equal(out.geometry.length,2);}
});

test('invalid crop/resize/user-unit geometry is refused without changing source bytes',async()=>{
 const {organizePdf,inspectPdf}=await operations;const source=await PDFDocument.create();source.addPage([200,100]);const bytes=await source.save(),original=Buffer.from(bytes),base={source:0,index:0,turn:0},crop={top:0,right:0,bottom:0,left:0};
 for(const value of [-1,NaN,Infinity,5001,'5'])await assert.rejects(organizePdf([{bytes}],[{...base,crop:{...crop,left:value}}]),/Crop margins/);
 await assert.rejects(organizePdf([{bytes}],[{...base,crop:{...crop,left:100}}]),/leave at least/);
 for(const resize of [{paper:'bad',orientation:'portrait',margin:0},{paper:'custom',orientation:'portrait',margin:0,width:5,height:100},{paper:'custom',orientation:'portrait',margin:50,width:10,height:10}])await assert.rejects(organizePdf([{bytes}],[{...base,resize}]),/valid paper|dimensions|no room/);
 source.getPage(0).node.set(PDFName.of('UserUnit'),source.context.obj(2));await assert.rejects(inspectPdf(await source.save()),/user units/);assert.deepEqual(Buffer.from(bytes),original);
});
