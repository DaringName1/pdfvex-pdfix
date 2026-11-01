const {test}=require('node:test'),assert=require('node:assert/strict');
const {uniformRichText}=require('../desktop/pdf-review-richtext.cjs');
const style={base:'Helvetica',size:12,color:[0],alignment:0};
test('uniform inert rich text preserves style while escaping replacement text',()=>{
 const source='<body xmlns="http://www.w3.org/1999/xhtml"><p style="font-family:Helvetica;font-size:12pt;color:#000000;text-align:left"><span>Original &amp; plain</span></p></body>';
 const before=uniformRichText(source,'Original & plain',style),output=before.replace('Reviewed <literal> & safe');
 assert.match(output,/Reviewed &lt;literal&gt; &amp; safe/);assert.equal(uniformRichText(output,'Reviewed <literal> & safe',style).styleSeal,before.styleSeal);
});
test('rich text refuses executable markup, entities, mixed runs, stale plain text and style changes',()=>{
 const cases=[
  ['<!DOCTYPE body [<!ENTITY x SYSTEM "file:///private">]><body><p>&x;</p></body>','x'],
  ['outside<body><p>Original</p></body>','Original'],
  ['<body><p><?xml version="1.0"?>Original</p></body>','Original'],
  ['<body><p onclick="alert(1)">Original</p></body>','Original'],
  ['<body><p><script>Original</script></p></body>','Original'],
  ['<body><p><span>Original</span><span>other</span></p></body>','Originalother'],
  ['<body><p style="font-size:18pt">Original</p></body>','Original'],
  ['<body><p style="font-family:Courier">Original</p></body>','Original'],
  ['<body><p style="font-weight:bold">Original</p></body>','Original'],
  ['<body><p style="color:#ff0000">Original</p></body>','Original'],
  ['<body><p style="background:url(https://example.invalid/)">Original</p></body>','Original'],
  ['<body><p>Original</p></body>','Stale'],
  ['<body><p>Original</p><p>Other</p></body>','OriginalOther'],
  ['<body><p><![CDATA[Original]]></p></body>','Original']
 ];for(const [xml,text]of cases)assert.throws(()=>uniformRichText(xml,text,style),/Rich comment/);
});
test('uniform rich bounds and newline refusal are explicit',()=>{
 assert.throws(()=>uniformRichText(' '.repeat(65537),'',style),/bounded/);
 const parsed=uniformRichText('<body><p>Original</p></body>','Original',style);
 assert.throws(()=>parsed.replace('One\nTwo'),/one bounded paragraph/);assert.throws(()=>parsed.replace('x'.repeat(16385)),/bounded/);
});

const {PDFDocument,PDFName,PDFArray,PDFDict,PDFString}=require('pdf-lib');
const {freeTextSource}=require('./helpers/review-freetext.cjs');
const {inspectReview}=require('../desktop/pdf-review-codec.cjs');
const {writeReviewEdits}=require('../desktop/pdf-review-edit-codec.cjs');
const {validReviewEditDraft,validReviewEditResult}=require('../desktop/pdf-review-edit-validation.cjs');
const {validReviewReport,inventorySha256}=require('../desktop/pdf-review-validation.cjs');
const k=PDFName.of,firstNote=doc=>doc.getPage(0).node.lookup(k('Annots'),PDFArray).lookup(0,PDFDict);
async function richFixture(xml='<body xmlns="http://www.w3.org/1999/xhtml"><p style="font-family:Helvetica;font-size:12pt;color:#000000"><span>Original free text</span></p></body>'){
 const doc=await PDFDocument.load(await freeTextSource());firstNote(doc).set(k('RC'),PDFString.of(xml));return Buffer.from(await doc.save({useObjectStreams:false}));
}
test('uniform rich FreeText copy keeps formatting and every original object except declared comment fields',async()=>{
 const bytes=await richFixture(),report=await inspectReview(bytes,[1]);assert.equal(report.annotations[0].richTextEditable,true);validReviewReport(report,{sourceSha256:report.sourceSha256,pages:[1]});
 const model=await import('../src/pdf-review-model.js'),row=model.reviewReport(report,{sourceSha256:report.sourceSha256,pageCount:report.pageCount,pages:[1]}).annotations[0];assert.equal(row.richTextEditable,true);assert.equal(model.reviewEditEligibility(row),'');
 const replacement='Reviewed <literal> & safe',draft=validReviewEditDraft({version:1,inventorySha256:report.inventorySha256,pages:[1],changes:[{kind:'comment',key:row.key,contents:replacement}]}),result=await writeReviewEdits(bytes,draft),before=await PDFDocument.load(bytes),after=await PDFDocument.load(result.bytes),a=firstNote(before),b=firstNote(after);
 assert.equal(b.get(k('Contents')).decodeText(),replacement);assert.match(b.get(k('RC')).decodeText(),/Reviewed &lt;literal&gt; &amp; safe/);assert.match(b.get(k('RC')).decodeText(),/font-family:Helvetica;font-size:12pt;color:#000000/);
 assert.deepEqual(result.report.preservation.allowedAnnotationFields,['Contents','M','AP','RC']);validReviewEditResult(result,draft,report.sourceSha256);
 const ref=before.getPage(0).node.lookup(k('Annots'),PDFArray).get(0).toString();for(const [r,object]of before.context.enumerateIndirectObjects())if(r.toString()!==ref)assert.equal(after.context.lookup(r).toString(),object.toString());for(const [key,value]of a.entries())if(!['Contents','M','AP','RC'].includes(key.decodeText()))assert.equal(b.get(key).toString(),value.toString());
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(result.bytes),isEvalSupported:false});try{const pdf=await task.promise,[note]=await(await pdf.getPage(1)).getAnnotations();assert.equal(note.contentsObj.str,replacement);assert.equal(note.textContent.join(''),replacement);}finally{await task.destroy();}
});
test('unsupported rich styles remain read-only; forged capability flags are rejected',async()=>{
 const bytes=await richFixture('<body><p style="font-size:18pt;letter-spacing:1pt">Original free text</p></body>'),report=await inspectReview(bytes,[1]);assert.equal(report.annotations[0].richTextEditable,undefined);
 await assert.rejects(writeReviewEdits(bytes,{version:1,inventorySha256:report.inventorySha256,pages:[1],changes:[{kind:'comment',key:report.annotations[0].key,contents:'Refused'}]}),/rich-text/);
 for(const value of [false,'true']){const copy=structuredClone(report);copy.annotations[0].richTextEditable=value;copy.inventorySha256=inventorySha256(copy);assert.throws(()=>validReviewReport(copy,{sourceSha256:copy.sourceSha256,pages:[1]}),/unsupported/);}
});

test('uniform rich declarations retain bold italic color and centered alignment',()=>{const style={base:'Times-BoldItalic',size:10,color:[.2,.4,.6],alignment:1},xml='<body><p style="font-family:Times New Roman;font-size:10pt;font-weight:bold;font-style:italic;color:#336699;text-align:center">Before</p></body>',rich=uniformRichText(xml,'Before',style),after=rich.replace('After');assert.equal(after,xml.replace('Before','After'));assert.equal(uniformRichText(after,'After',style).styleSeal,rich.styleSeal);assert.throws(()=>uniformRichText(after,'After',{...style,alignment:0}),/alignments differ/);});
