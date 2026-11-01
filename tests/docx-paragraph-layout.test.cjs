const {test}=require('node:test');const assert=require('node:assert/strict');
const docx=require('docx');
const {readDocx}=require('../desktop/rich-document-codec.cjs');
const {validDocxImport}=require('../desktop/rich-document-validation.cjs');
const {docxParagraphLayout}=require('../desktop/docx-paragraph-layout.cjs');
const {Document,Packer,Paragraph,TextRun,AlignmentType,HeadingLevel,Tab}=docx;
// A file shaped like Word's own output: properties set directly on paragraphs, no PDFix snapshot.
async function wordFile(){
  const p=(text,options={})=>new Paragraph({...options,children:[new TextRun(text)]});
  const document=new Document({sections:[{children:[
    new Paragraph({heading:HeadingLevel.HEADING_1,alignment:AlignmentType.CENTER,children:[new TextRun('Centred title')]}),
    p('Plain body text'),
    p('Indented once',{indent:{left:720}}),
    p('First line in',{indent:{firstLine:720}}),
    p('Hanging reference',{indent:{left:1440,hanging:720}}),
    p('Justified and spaced',{alignment:AlignmentType.JUSTIFIED,spacing:{before:240,after:120,line:360}}),
    p('Odd amounts stay default',{indent:{left:500,firstLine:300},spacing:{before:70,line:300}}),
    new Paragraph({children:[new TextRun('Tab'),new TextRun({children:[new Tab(),'separated']})],alignment:AlignmentType.RIGHT}),
    p('A list item',{bullet:{level:0}}),
  ]}]});
  return new Uint8Array(await Packer.toBuffer(document));
}
test('paragraph layout set directly in a Word body is read with only the editor\'s own values',async()=>{
  const {readArchive}=require('../desktop/office-archive.cjs'),layout=docxParagraphLayout(readArchive(Buffer.from(await wordFile())).get('word/document.xml')),of=text=>layout.find(item=>item.text===text.replace(/\s+/g,''))?.attrs;
  assert.deepEqual(of('Centred title'),{textAlign:'center'});assert.deepEqual(of('Plain body text'),{});assert.deepEqual(of('Indented once'),{indent:1});assert.deepEqual(of('First line in'),{firstLine:'first'});
  assert.deepEqual(of('Hanging reference'),{firstLine:'hanging',indent:1});assert.deepEqual(of('Justified and spaced'),{textAlign:'justify',spaceBefore:12,spaceAfter:6,lineSpacing:1.5});
  assert.deepEqual(of('Odd amounts stay default'),{});assert.deepEqual(of('Tab separated'),{textAlign:'right'});assert.equal(of('A list item'),undefined,'list items are left to the list import');
});
test('the contained DOCX import returns the layout beside the HTML and the validator bounds it',async()=>{
  const imported=await readDocx(await wordFile(),{});assert.equal(imported.snapshot,undefined);assert.ok(Array.isArray(imported.paragraphs));validDocxImport(imported);
  assert.ok(imported.paragraphs.some(item=>item.attrs.firstLine==='hanging'));
  for(const bad of [{text:'x',attrs:{indent:20}},{text:'x',attrs:{textAlign:'left'}},{text:'x',attrs:{color:'red'}},{text:'',attrs:{}},{text:'x'.repeat(121),attrs:{}},{text:'x',attrs:{},extra:1}])assert.throws(()=>validDocxImport({...imported,paragraphs:[bad]}),/paragraph layout/,JSON.stringify(bad));
});
test('the editor lines the layout up with the imported paragraphs by text',async t=>{
  const {JSDOM}=await import('jsdom').catch(()=>({}));if(!JSDOM)return t.skip('jsdom is not installed; scripts/check-document-word-layout.mjs covers this in the app');
  globalThis.DOMParser=new JSDOM('').window.DOMParser;const {applyDocxParagraphs}=await import('../src/docx-paragraph-layout.js');
  const imported=await readDocx(await wordFile(),{}),{html,applied}=applyDocxParagraphs(imported.html,imported.paragraphs);
  assert.equal(applied,6);assert.match(html,/<h1 data-pdfix-align="center">Centred title/);assert.match(html,/<p data-pdfix-indent="1" data-pdfix-first-line="hanging">Hanging reference/);
  assert.match(html,/<p data-pdfix-align="justify" data-pdfix-line="1.5" data-pdfix-space-before="12" data-pdfix-space-after="6">Justified/);assert.match(html,/<li>(<p>)?A list item/);
  // A paragraph the import lost does not shift the layout onto the next one.
  const skipped=applyDocxParagraphs('<p>Plain body text</p><p>First line in</p>',imported.paragraphs);assert.match(skipped.html,/<p>Plain body text<\/p><p data-pdfix-first-line="first">/);
});
test('run font, size, color, highlight and underline from a Word body are read with only the editor\'s values',async()=>{
  const document=new Document({sections:[{children:[new Paragraph({children:[new TextRun('Plain then '),new TextRun({text:'red serif',font:'Times New Roman',size:28,color:'C00000'}),new TextRun(' and '),new TextRun({text:'marked',highlight:'yellow',underline:{}}),new TextRun({text:' code',font:'Consolas'}),new TextRun({text:' themed',color:'auto'})]})]}]});
  const bytes=new Uint8Array(await Packer.toBuffer(document)),{readArchive}=require('../desktop/office-archive.cjs'),[entry]=docxParagraphLayout(readArchive(Buffer.from(bytes)).get('word/document.xml'));
  assert.deepEqual(entry.runs,[{n:11,style:{}},{n:9,style:{font:'serif',size:14,color:'#c00000'}},{n:5,style:{}},{n:6,style:{highlight:'yellow'}},{n:5,style:{font:'mono'}},{n:7,style:{}}]);
  const imported=await readDocx(bytes,{});validDocxImport(imported);assert.match(imported.html,/<u>marked<\/u>/);
  for(const runs of [[{n:0,style:{}}],[{n:3,style:{font:'fantasy'}}],[{n:3,style:{size:100}}],[{n:3,style:{color:'red'}}],[{n:3,style:{highlight:'orange'}}],[{n:3,style:{},extra:1}],[]])assert.throws(()=>validDocxImport({...imported,paragraphs:[{text:'x',attrs:{},runs}]}),/paragraph layout/,JSON.stringify(runs));
});
