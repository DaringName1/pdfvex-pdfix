const {test}=require('node:test');const assert=require('node:assert/strict');
const {validRtfImport}=require('../desktop/rich-document-validation.cjs');
const p=text=>({type:'paragraph',content:[{type:'text',text}]});
const texts=node=>JSON.stringify(node).match(/"text":"[^"]*"/g)?.map(item=>item.slice(8,-1))??[];
test('PDFix RTF copies mark list items and reopen them as nested lists',async()=>{
  const {exportRtf,importRtf}=await import('../src/rtf-codec.js');
  const doc={type:'doc',content:[p('Intro'),{type:'bulletList',content:[{type:'listItem',content:[p('Apples'),{type:'orderedList',attrs:{start:3},content:[{type:'listItem',content:[p('Three')]},{type:'listItem',content:[p('Four')]}]}]},{type:'listItem',content:[p('Pears'),p('More about pears')]}]},p('After'),{type:'blockquote',content:[p('Quoted')]},{type:'orderedList',content:[{type:'listItem',content:[p('One')]}]}]};
  const rtf=Buffer.from(exportRtf(doc)).toString('latin1');assert.match(rtf,/\{\\listtext \\u8226\?\\tab \}\{\\fs24 Apples\}/);assert.match(rtf,/\{\\listtext 3\.\\tab \}/);
  const back=importRtf(Buffer.from(rtf,'latin1'));validRtfImport(back);const content=back.doc.content;
  assert.deepEqual(content.map(node=>node.type),['paragraph','bulletList','paragraph','paragraph','orderedList']);
  const bullets=content[1];assert.equal(bullets.content.length,2);assert.deepEqual(texts(bullets.content[0]),['Apples','Three','Four']);
  const nested=bullets.content[0].content[1];assert.equal(nested.type,'orderedList');assert.equal(nested.attrs.start,3);assert.deepEqual(texts(bullets.content[1]),['Pears','More about pears']);
  assert.equal(content[4].attrs,undefined,'a list starting at 1 has no start attribute');assert.ok(!back.warnings.some(text=>/lists are flattened/i.test(text)));
  assert.ok(!JSON.stringify(back.doc).includes('_li'),'internal markers are removed');
});
test('Word-style RTF lists with Symbol bullets and numbers become lists',async()=>{
  const {importRtf}=await import('../src/rtf-codec.js');
  const rtf='{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}{\\f3\\fcharset2 Symbol;}}'+
   '\\pard\\plain\\f0 Before\\par'+
   '\\pard\\plain\\fi-360\\li720\\f0{\\listtext\\pard\\plain\\f3\\fs20 \\\'b7\\tab}First bullet\\par'+
   '\\pard\\plain\\fi-360\\li720\\f0{\\listtext\\pard\\plain\\f3\\fs20 \\\'b7\\tab}Second bullet\\par'+
   '\\pard\\plain\\fi-360\\li1440\\f0{\\listtext\\pard\\plain\\f0 1.\\tab}Nested number\\par'+
   '\\pard\\plain\\f0 After\\par}';
  const back=importRtf(Buffer.from(rtf,'latin1'));validRtfImport(back);const content=back.doc.content;
  assert.deepEqual(content.map(node=>node.type),['paragraph','bulletList','paragraph']);assert.equal(content[1].content.length,2);
  assert.equal(content[1].content[1].content[1].type,'orderedList');assert.deepEqual(texts(content[1].content[1].content[1]),['Nested number']);
  assert.ok(!texts(content[1]).some(text=>text.includes('\u00b7')),'the marker is not left in the text');
});
