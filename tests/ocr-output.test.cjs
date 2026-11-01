const {test}=require('node:test');const assert=require('node:assert/strict');const {PDFDocument}=require('pdf-lib');
const operations=import('../src/ocr-output.js');
const record=()=>({index:0,language:'eng',languageName:'English',languageSource:'user-selected',transform:[2,0,0,-2,0,800],width:600,height:800,lines:[{text:'Reviewed words',bbox:{x0:40,y0:40,x1:250,y1:65}}]});
test('OCR coordinate inversion handles cropped and rotated PDF page transforms',async()=>{
  const {inversePoint}=await operations;
  for(const transform of [[2,0,0,-2,-20,820],[0,2,2,0,-40,-20],[-2,0,0,2,620,-40],[0,-2,-2,0,820,620]]){const [a,b,c,d,e,f]=transform;const point=inversePoint(transform,a*33+c*77+e,b*33+d*77+f);assert.ok(Math.abs(point[0]-33)<.00001);assert.ok(Math.abs(point[1]-77)<.00001);}
  assert.throws(()=>inversePoint([0,0,0,0,0,0],0,0),/scale/);
});
test('OCR output rejects unsafe positions, empty or unsupported text, and form documents',async()=>{
  const {searchablePdf}=await operations;const doc=await PDFDocument.create();doc.addPage([300,400]);const bytes=await doc.save();
  const outside=record();outside.lines[0].bbox.x1=1000;await assert.rejects(()=>searchablePdf(bytes,[outside]),/outside/);
  const empty=record();empty.lines[0].text='';await assert.rejects(()=>searchablePdf(bytes,[empty]),/No recognized text/);
  const unicode=record();unicode.lines[0].text='Reviewed 🙂';await assert.rejects(()=>searchablePdf(bytes,[unicode]),/cannot encode a character/);
  const long=record();long.lines[0].text='x'.repeat(2001);await assert.rejects(()=>searchablePdf(bytes,[long]),/one line/);
  const duplicate=record();await assert.rejects(()=>searchablePdf(bytes,[duplicate,duplicate]),/selection/);
  const result=await searchablePdf(bytes,[record()]);assert.equal((await PDFDocument.load(result.bytes)).getPageCount(),1);
  await assert.rejects(()=>searchablePdf(bytes,[]),/at least/);
  doc.getForm().createTextField('Name').addToPage(doc.getPage(0),{x:10,y:10,width:100,height:20});
  const formBytes=await doc.save();await assert.rejects(()=>searchablePdf(formBytes,[record()]),/forms or signatures/);
});
