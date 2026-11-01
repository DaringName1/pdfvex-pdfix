const {test}=require('node:test'),assert=require('node:assert/strict'),{PDFDocument,StandardFonts,PDFName,PDFString}=require('pdf-lib'),{createHash}=require('node:crypto');
const {extractBatchPdfText}=require('../desktop/batch-pdf-text-codec.cjs');
const {validBatchTextResult}=require('../desktop/batch-pdf-text-validation.cjs');
async function fixture({annotated=false,form=false}={}){const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica);doc.addPage([300,200]).drawText('First café (literal)',{font,x:20,y:100});const page=doc.addPage([300,200]);page.drawText('Second page',{font,x:20,y:100});if(annotated){const annotation=doc.context.obj({Type:'Annot',Subtype:'Text',Rect:[0,0,10,10],Contents:PDFString.of('Omitted note')});page.node.set(PDFName.of('Annots'),doc.context.obj([doc.context.register(annotation)]));}if(form)doc.getForm().createTextField('Field').addToPage(page,{x:0,y:0,width:50,height:20});return doc.save();}
test('batch text preserves literal WinAnsi text, physical page order, source bytes and seals',async()=>{
 const bytes=await fixture(),before=bytes.slice(),result=await extractBatchPdfText(bytes);validBatchTextResult(result,createHash('sha256').update(bytes).digest('hex'));assert.equal(result.pageCount,2);assert.equal(Buffer.from(result.bytes).toString('utf8'),'--- Physical page 1 ---\nFirst café (literal)\n\n\n--- Physical page 2 ---\nSecond page\n\n');assert.deepEqual(bytes,before);
});
test('an unsupported later page refuses the whole batch text item',async()=>{
 await assert.rejects(extractBatchPdfText(await fixture({annotated:true})),/page 2.*annotations/);await assert.rejects(extractBatchPdfText(await fixture({form:true})),/forms/);
});
test('batch text rejects scans and options instead of creating success-shaped output',async()=>{
 const doc=await PDFDocument.create();doc.addPage([100,100]).drawRectangle({x:1,y:1,width:20,height:20});await assert.rejects(extractBatchPdfText(await doc.save()),/no supported literal/);await assert.rejects(extractBatchPdfText(await fixture(),{path:'ignored'}),/no paths\/options/);
});
test('batch text receipts reject changed output bytes or a substituted source seal',async()=>{
 const bytes=await fixture(),source=createHash('sha256').update(bytes).digest('hex'),result=await extractBatchPdfText(bytes);assert.throws(()=>validBatchTextResult({...result,sourceSha256:'0'.repeat(64)},source),/seal/);const changed=result.bytes.slice();changed[0]^=1;assert.throws(()=>validBatchTextResult({...result,bytes:changed},source),/seal/);
});
