const {test}=require('node:test');const assert=require('node:assert/strict');const JSZip=require('jszip');
const {validRichContent,validRtfImport}=require('../desktop/rich-document-validation.cjs');
const {defaultDocumentLayout}=require('../desktop/document-layout-validation.cjs');
const {highlightFromHex,HIGHLIGHTS}=require('../desktop/document-mark-model.cjs');
const text=(value,marks)=>({type:'text',text:value,...(marks?{marks}:{})});
const doc={type:'doc',content:[{type:'paragraph',content:[text('E = mc'),text('2',[{type:'superscript'}]),text(' and H'),text('2',[{type:'subscript'}]),text('O, '),text('marked',[{type:'highlight',attrs:{color:'yellow'}}]),text(' and ',[]),text('pink bold',[{type:'bold'},{type:'highlight',attrs:{color:'pink'}}])]}]};
test('superscript, subscript and listed highlight colors validate; anything else is refused',()=>{
  validRichContent(structuredClone(doc));assert.equal(highlightFromHex('#FFFF00'),'yellow');assert.equal(highlightFromHex('#123456'),null);
  for(const mark of [{type:'highlight',attrs:{color:'orange'}},{type:'highlight'},{type:'highlight',attrs:{color:'yellow',extra:1}},{type:'superscript',attrs:{level:2}}]){const bad=structuredClone(doc);bad.content[0].content[1].marks=[mark];assert.throws(()=>validRichContent(bad),/Unsupported/,JSON.stringify(mark));}
});
test('DOCX copies write vertical alignment and Word highlight colors',async()=>{
  const {exportDocx}=await import('../src/document-codec.js'),xml=await (await JSZip.loadAsync(await exportDocx(doc))).file('word/document.xml').async('string'),runs=xml.match(/<w:r>.*?<\/w:r>/gs),of=value=>runs.find(run=>run.includes('>'+value+'<'));
  assert.match(xml,/<w:vertAlign w:val="superscript"\/>/);assert.match(xml,/<w:vertAlign w:val="subscript"\/>/);assert.match(of('marked'),/<w:highlight w:val="yellow"\/>/);assert.match(of('pink bold'),/<w:highlight w:val="magenta"\/>/);assert.ok(!/w:highlight/.test(of('O, ')));
});
test('RTF copies write and read back superscript, subscript and highlight',async()=>{
  const {exportRtf,importRtf}=await import('../src/rtf-codec.js'),bytes=exportRtf(doc,defaultDocumentLayout()),rtf=Buffer.from(bytes).toString('latin1');
  assert.match(rtf,/\\super 2/);assert.match(rtf,/\\sub 2/);assert.match(rtf,/\\highlight\d+ marked/);assert.match(rtf,/\\red255\\green255\\blue0;/);
  const back=importRtf(bytes);validRtfImport(back);const runs=back.doc.content[0].content,find=value=>runs.find(run=>run.text.includes(value));
  assert.ok(runs.some(run=>run.text==='2'&&run.marks.some(mark=>mark.type==='superscript')));assert.ok(runs.some(run=>run.text==='2'&&run.marks.some(mark=>mark.type==='subscript')));
  assert.deepEqual(find('marked').marks.find(mark=>mark.type==='highlight').attrs,{color:'yellow'});assert.deepEqual(find('pink bold').marks.find(mark=>mark.type==='highlight').attrs,{color:'pink'});assert.ok(!find('O, ').marks.some(mark=>['highlight','superscript','subscript'].includes(mark.type)));
});
test('the PDF copy renders sup, sub and the highlight color',()=>{
  const {documentHtml}=require('../desktop/document-pdf.cjs'),{html}=documentHtml(doc,defaultDocumentLayout());
  assert.match(html,/mc<sup>2<\/sup>/);assert.match(html,/H<sub>2<\/sub>O/);assert.match(html,new RegExp('<mark style="background-color:'+HIGHLIGHTS.yellow.hex+';color:inherit">marked</mark>'));
});
