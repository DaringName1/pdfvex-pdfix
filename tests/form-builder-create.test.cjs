const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const path=require('node:path');const zlib=require('node:zlib');const {createHash}=require('node:crypto');
const {PDFDocument,PDFName,PDFArray}=require('pdf-lib');
const codec=require('../desktop/form-builder-codec.cjs');
const hash=value=>createHash('sha256').update(value).digest('hex');
const field=(name,type,rect,extra={})=>({name,label:name+' label',type,page:0,rect,required:false,readOnly:false,fontSize:12,...extra});
const streams=async bytes=>{const doc=await PDFDocument.load(bytes,{updateMetadata:false}),page=doc.getPages()[0],contents=page.node.Contents(),list=contents instanceof PDFArray?contents.asArray().map(ref=>doc.context.lookup(ref)):[contents];return list.map(stream=>{const raw=stream.getContents();let text=null;if(raw.length<=64&&String(stream.dict.get(PDFName.of('Filter')))==='/FlateDecode')try{text=zlib.inflateSync(Buffer.from(raw)).toString('latin1').trim();}catch{}return {hash:hash(raw),text};});};
// Both common page shapes: one content stream stored as a reference, and an array of streams.
test('Create fillable fields writes a text field and a checkbox and keeps the page artwork',async()=>{
  for(const name of ['reading-sample.pdf','navigation-sample.pdf']){
    const bytes=new Uint8Array(await fs.readFile(path.join(__dirname,'fixtures',name))),original=bytes.slice(),before=await streams(bytes);
    const result=await codec.create(bytes,{kind:'form-builder',version:1,fields:[field('FullName','text',[72,300,312,324]),field('Agree','checkbox',[72,260,90,278])]}),output=result.bytes??result;
    assert.deepEqual(bytes,original,name+': source bytes unchanged');
    const doc=await PDFDocument.load(output,{updateMetadata:false}),fields=doc.getForm().getFields();assert.deepEqual(fields.map(item=>[item.getName(),item.constructor.name]),[['FullName','PDFTextField'],['Agree','PDFCheckBox']],name);
    const rect=fields[0].acroField.getWidgets()[0].getRectangle();assert.ok(Math.abs(rect.x-72.5)<1&&Math.abs(rect.y-300.5)<1&&Math.abs(rect.width-239)<1.5,name+' rectangle '+JSON.stringify(rect));
    assert.equal(doc.getForm().getTextField('FullName').getText()??'','');assert.equal(doc.getForm().getCheckBox('Agree').isChecked(),false);assert.equal(doc.getPageCount(),3);
    const after=await streams(output),kept=after.filter(item=>item.text!=='q'&&item.text!=='Q').map(item=>item.hash);assert.deepEqual(kept,before.map(item=>item.hash),name+': original content streams are unchanged and in order');
    assert.ok(after.every((item,index)=>item.text===null||index===0&&item.text==='q'||index===after.length-1&&item.text==='Q'),name+': only a leading q and trailing Q were added');
  }
});
test('Create fillable fields still refuses bad names, overlaps and an empty request',async()=>{
  const bytes=new Uint8Array(await fs.readFile(path.join(__dirname,'fixtures','reading-sample.pdf'))),draft=fields=>({kind:'form-builder',version:1,fields});
  await assert.rejects(codec.create(bytes,draft([])),/at least one/);
  await assert.rejects(codec.create(bytes,draft([field('','text',[72,300,312,324])])),/unique field names/);
  await assert.rejects(codec.create(bytes,draft([field('9bad','text',[72,300,312,324])])),/unique field names/);
  await assert.rejects(codec.create(bytes,draft([field('A','text',[72,300,312,324]),field('A','text',[72,200,312,224])])),/unique field names/);
  await assert.rejects(codec.create(bytes,draft([field('A','text',[72,300,312,324]),field('B','text',[100,310,300,320])])),/./);
});
