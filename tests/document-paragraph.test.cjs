const {test}=require('node:test');const assert=require('node:assert/strict');const JSZip=require('jszip');
const {validParagraphFormat}=require('../desktop/document-paragraph-model.cjs');
const {validRichContent,validRtfImport}=require('../desktop/rich-document-validation.cjs');
const {defaultDocumentLayout}=require('../desktop/document-layout-validation.cjs');
const paragraph=(text,attrs)=>({type:'paragraph',...(attrs?{attrs}:{}),content:[{type:'text',text}]});
const doc={type:'doc',content:[paragraph('Plain'),paragraph('Indented twice',{indent:2}),paragraph('Double spaced',{lineSpacing:2,textAlign:'center'}),{type:'heading',attrs:{level:2,indent:1,lineSpacing:1.15},content:[{type:'text',text:'Heading'}]},
 paragraph('Spaced out',{spaceBefore:12,spaceAfter:24}),paragraph('Tight',{spaceBefore:0,spaceAfter:0}),paragraph('First line in',{firstLine:'first'}),paragraph('Hanging list',{indent:1,firstLine:'hanging'}),
 {type:'bulletList',content:[{type:'listItem',content:[paragraph('List item')]}]}]};
test('paragraph indent, line spacing and space before/after accept only listed values',()=>{
  assert.deepEqual(validParagraphFormat(undefined),{indent:0,lineSpacing:null,spaceBefore:null,spaceAfter:null,firstLine:null,rightIndent:0});assert.deepEqual(validParagraphFormat({indent:8,lineSpacing:1.15,spaceBefore:0,spaceAfter:24}),{indent:8,lineSpacing:1.15,spaceBefore:0,spaceAfter:24,firstLine:null,rightIndent:0});
  for(const bad of [{indent:9},{indent:-1},{indent:1.5},{indent:'2'},{lineSpacing:3},{lineSpacing:'2'},{lineSpacing:0},{spaceBefore:7},{spaceAfter:-6},{spaceAfter:'12'},{spaceBefore:1000},{firstLine:'left'},{firstLine:1},{firstLine:''},{rightIndent:5},{rightIndent:-1},{rightIndent:1.5}])assert.throws(()=>validParagraphFormat(bad),/paragraph indent/,JSON.stringify(bad));
  validRichContent(structuredClone(doc));const bad=structuredClone(doc);bad.content[1].attrs.indent=40;assert.throws(()=>validRichContent(bad),/Unsupported paragraph layout/);
});
test('DOCX copies write paragraph indent, line spacing and space before/after, and leave list items to their list level',async()=>{
  const {exportDocx}=await import('../src/document-codec.js'),xml=await (await JSZip.loadAsync(await exportDocx(doc))).file('word/document.xml').async('string'),paragraphs=xml.match(/<w:p>.*?<\/w:p>/gs);
  const of=text=>paragraphs.find(item=>item.includes('>'+text+'<'));
  assert.ok(!/<w:ind /.test(of('Plain')));assert.ok(!/<w:spacing /.test(of('Plain')));assert.match(of('Indented twice'),/<w:ind w:left="1440"\/>/);assert.match(of('Double spaced'),/<w:spacing [^>]*w:line="480"/);assert.match(of('Double spaced'),/<w:jc w:val="center"\/>/);
  assert.match(of('Heading'),/<w:ind w:left="720"\/>/);assert.match(of('Heading'),/<w:spacing [^>]*w:line="276"/);assert.ok(!/<w:ind /.test(of('List item')));
  assert.match(of('Spaced out'),/<w:spacing [^>]*w:before="240"/);assert.match(of('Spaced out'),/<w:spacing [^>]*w:after="480"/);assert.match(of('Tight'),/<w:spacing [^>]*w:before="0"/);assert.match(of('Tight'),/<w:spacing [^>]*w:after="0"/);
});
test('RTF copies write paragraph layout in twips and read space before/after back',async()=>{
  const {exportRtf,importRtf}=await import('../src/rtf-codec.js'),layout={...defaultDocumentLayout(),size:12,lineHeight:1.5},bytes=exportRtf(doc,layout),lines=Buffer.from(bytes).toString('latin1').split('\n');
  const of=text=>lines.find(line=>line.includes(text));
  assert.match(of('Plain'),/\\li0\\/);assert.match(of('Plain'),/\\sl360\\slmult0 /);assert.match(of('Indented twice'),/\\li1440\\/);assert.match(of('Double spaced'),/\\qc\\li0\\.*\\sl480\\/);assert.match(of('Heading'),/\\li720\\.*\\sl276\\/);
  assert.match(of('Spaced out'),/\\slmult0\\sb240\\sa480 /);assert.match(of('Tight'),/\\slmult0\\sb0\\sa0 /);
  const back=importRtf(bytes);validRtfImport(back);const find=text=>back.doc.content.find(node=>JSON.stringify(node).includes(text)).attrs;
  assert.equal(find('Spaced out').spaceBefore,12);assert.equal(find('Spaced out').spaceAfter,24);assert.equal(find('Tight').spaceBefore,0);assert.equal(find('Tight').spaceAfter,0);assert.equal(find('Plain').spaceBefore,undefined);assert.equal(find('Indented twice').indent,2);
  const bad=structuredClone(doc);bad.content[1].attrs.indent=40;assert.throws(()=>exportRtf(bad),/paragraph indent/);
});
test('first-line and hanging indents reach DOCX, RTF and the PDF copy, and RTF reads them back',async()=>{
  const {paragraphOffsets}=require('../desktop/document-paragraph-model.cjs');assert.deepEqual(paragraphOffsets({indent:0,firstLine:'first'}),{left:0,firstLine:1,right:0});assert.deepEqual(paragraphOffsets({indent:1,firstLine:'hanging'}),{left:2,firstLine:-1,right:0});assert.deepEqual(paragraphOffsets({indent:3,firstLine:null}),{left:3,firstLine:0,right:0});
  const {exportDocx}=await import('../src/document-codec.js'),xml=await (await JSZip.loadAsync(await exportDocx(doc))).file('word/document.xml').async('string'),paragraphs=xml.match(/<w:p>.*?<\/w:p>/gs),of=text=>paragraphs.find(item=>item.includes('>'+text+'<'));
  assert.match(of('First line in'),/<w:ind [^>]*w:firstLine="720"/);assert.ok(!/w:left=/.test(of('First line in')));assert.match(of('Hanging list'),/<w:ind [^>]*w:left="1440"/);assert.match(of('Hanging list'),/<w:ind [^>]*w:hanging="720"/);
  const {exportRtf,importRtf}=await import('../src/rtf-codec.js'),bytes=exportRtf(doc,{...defaultDocumentLayout(),size:12,lineHeight:1.5}),lines=Buffer.from(bytes).toString('latin1').split('\n'),line=text=>lines.find(item=>item.includes(text));
  assert.match(line('First line in'),/\\li0\\fi720\\/);assert.match(line('Hanging list'),/\\li1440\\fi-720\\/);
  const back=importRtf(bytes);validRtfImport(back);const find=text=>back.doc.content.find(node=>JSON.stringify(node).includes(text)).attrs;
  assert.equal(find('First line in').firstLine,'first');assert.equal(find('First line in').indent,undefined);assert.equal(find('Hanging list').firstLine,'hanging');assert.equal(find('Hanging list').indent,1);assert.equal(find('Plain').firstLine,undefined);
  const {documentHtml}=require('../desktop/document-pdf.cjs'),{html}=documentHtml(doc,defaultDocumentLayout());assert.match(html,/<p style="text-indent:0.5in;">First line in/);assert.match(html,/<p style="margin-left:1in;text-indent:-0.5in;">Hanging list/);
  const bad=structuredClone(doc);bad.content[0].attrs={firstLine:'outdent'};assert.throws(()=>validRichContent(bad),/Unsupported paragraph layout/);
});
test('right indent reaches DOCX, RTF and the PDF copy, and RTF reads it back',async()=>{
  const quote={type:'doc',content:[{type:'paragraph',attrs:{indent:1,rightIndent:2},content:[{type:'text',text:'Quoted block'}]},{type:'paragraph',content:[{type:'text',text:'Normal'}]}]};
  const {exportDocx}=await import('../src/document-codec.js'),xml=await (await JSZip.loadAsync(await exportDocx(quote))).file('word/document.xml').async('string');
  assert.match(xml,/<w:ind w:left="720" w:right="1440"\/>/);
  const {exportRtf,importRtf}=await import('../src/rtf-codec.js'),bytes=exportRtf(quote,defaultDocumentLayout()),rtf=Buffer.from(bytes).toString('latin1');assert.match(rtf,/\\li720\\ri1440\\/);
  const back=importRtf(bytes);validRtfImport(back);assert.equal(back.doc.content[0].attrs.rightIndent,2);assert.equal(back.doc.content[0].attrs.indent,1);assert.equal(back.doc.content[1].attrs.rightIndent,undefined);
  const {documentHtml}=require('../desktop/document-pdf.cjs'),{html}=documentHtml(quote,defaultDocumentLayout());assert.match(html,/<p style="margin-left:0.5in;margin-right:1in;">Quoted block/);
});
