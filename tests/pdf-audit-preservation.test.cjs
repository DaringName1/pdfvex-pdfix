const {test}=require('node:test'),assert=require('node:assert/strict');
const {PDFDocument,PDFName,PDFDict,PDFRawStream,PDFString,PDFArray,decodePDFRawStream}=require('pdf-lib');
const {createHash}=require('node:crypto');
const {freeTextSource}=require('./helpers/review-freetext.cjs');
const {inspectReview}=require('../desktop/pdf-review-codec.cjs');
const {writeReviewEdits}=require('../desktop/pdf-review-edit-codec.cjs');
const n=PDFName.of;
const hash=b=>createHash('sha256').update(b).digest('hex');
// A test-only structural fixture, not a conforming PDF/UA or signed document.
async function source(){
 const doc=await PDFDocument.load(await freeTextSource(),{updateMetadata:false}),c=doc.context;
 doc.setTitle('Retained audit metadata');await doc.attach(Buffer.from('Original attachment bytes'),'audit.txt');
 const field=doc.getForm().createTextField('Total');field.setText('42');
 field.acroField.dict.set(n('AA'),c.obj({C:{S:'JavaScript',JS:PDFString.of('event.value = 42;')}}));
 doc.catalog.lookup(n('AcroForm'),PDFDict).set(n('CO'),c.obj([field.ref]));
 doc.catalog.set(n('StructTreeRoot'),c.register(c.obj({Type:'StructTreeRoot',K:[],PrivateTag:PDFString.of('Retain structure root')})));
 doc.catalog.set(n('Outlines'),c.register(c.obj({Type:'Outlines',Count:0})));
 return Buffer.from(await doc.save({useObjectStreams:false,updateFieldAppearances:false}));
}
function fingerprint(value,omit=[]){
 const d=value instanceof PDFRawStream?value.dict:value;
 if(d instanceof PDFDict){const copy=d.clone(d.context);for(const k of omit)copy.delete(n(k));return hash(Buffer.concat([Buffer.from(copy.toString()),value instanceof PDFRawStream?Buffer.from(value.contents):Buffer.alloc(0)]));}
 return hash(Buffer.from(value.toString()));
}
async function compare(input,output,allowed){
 const before=await PDFDocument.load(input,{updateMetadata:false}),after=await PDFDocument.load(output,{updateMetadata:false});
 for(const [ref,value]of before.context.enumerateIndirectObjects()){
  const saved=after.context.lookup(ref);assert.ok(saved,'Source object retained: '+ref);
  assert.equal(fingerprint(saved,allowed.get(ref.toString())||[]),fingerprint(value,allowed.get(ref.toString())||[]),'Only approved fields changed: '+ref);
 }
 for(const key of ['AcroForm','Names','StructTreeRoot','Outlines'])assert.equal(after.catalog.get(n(key)).toString(),before.catalog.get(n(key)).toString());
 assert.equal(after.getForm().getTextField('Total').getText(),'42');assert.equal(after.getTitle(),'Retained audit metadata');
 const form=after.catalog.lookup(n('AcroForm'),PDFDict);assert.equal(form.get(n('CO')).toString(),before.catalog.lookup(n('AcroForm'),PDFDict).get(n('CO')).toString());
 return after;
}
test('markup copy preserves original objects, attachment bytes, tags and calculations with checked annotation/q-Q wrapper changes',async()=>{
 const bytes=await source(),original=Buffer.from(bytes),before=await PDFDocument.load(bytes,{updateMetadata:false}),{markedPdf}=await import('../src/markup-output.js');
 const out=await markedPdf(bytes,[{id:'pdfix-00000000-0000-4000-8000-000000000001',kind:'note',page:0,color:'blue',text:'Audit note',fontSize:12,rotation:0,rect:[30,30,50,50]}]);
 const after=await compare(bytes,out.bytes,new Map([[before.getPage(0).ref.toString(),['Annots','Contents']]]));
 const sourceContents=before.getPage(0).node.lookup(n('Contents'),PDFArray).asArray(),savedContents=after.getPage(0).node.lookup(n('Contents'),PDFArray).asArray();
 assert.deepEqual(savedContents.slice(1,-1).map(String),sourceContents.map(String));
 for(const [ref,operator]of [[savedContents[0],'q'],[savedContents.at(-1),'Q']])assert.equal(Buffer.from(decodePDFRawStream(after.context.lookup(ref)).decode()).toString().trim(),operator);assert.deepEqual(bytes,original);
});
test('comment body copy preserves catalog, attached streams, tags and form calculation order/actions',async()=>{
 const bytes=await source(),original=Buffer.from(bytes),inventory=await inspectReview(bytes,[1]),row=inventory.annotations.find(a=>a.subtype==='FreeText');
 const out=await writeReviewEdits(bytes,{version:1,pages:[1],inventorySha256:inventory.inventorySha256,changes:[{kind:'comment',key:row.key,contents:'Audit revised note'}]});
 const ref=row.key.replace(/^ref:(\d+):(\d+)$/,'$1 $2 R');await compare(bytes,out.bytes,new Map([[ref,['Contents','M','AP']]]));assert.deepEqual(bytes,original);
});
