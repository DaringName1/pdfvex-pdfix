const {test}=require('node:test');const assert=require('node:assert/strict');const JSZip=require('jszip');
const {validRichContent,validRtfImport}=require('../desktop/rich-document-validation.cjs');
const {defaultDocumentLayout}=require('../desktop/document-layout-validation.cjs');
const doc={type:'doc',content:[
  {type:'paragraph',content:[{type:'text',text:'See '},{type:'text',text:'Results',marks:[{type:'documentLink',attrs:{href:'#h-1a2b3c4d'}}]},{type:'text',text:' and '},{type:'text',text:'the site',marks:[{type:'documentLink',attrs:{href:'https://example.com/'}}]}]},
  {type:'heading',attrs:{level:2,anchor:'h-1a2b3c4d'},content:[{type:'text',text:'Results'}]},
  {type:'paragraph',content:[{type:'text',text:'Body'}]}]};
test('heading anchors and links to them validate; bad anchors and anchors on paragraphs are refused',()=>{
  validRichContent(structuredClone(doc));
  for(const change of [d=>{d.content[1].attrs.anchor='1bad';},d=>{d.content[1].attrs.anchor='a b';},d=>{d.content[2].attrs={anchor:'h-x'};},d=>{d.content[0].content[1].marks[0].attrs.href='#';},d=>{d.content[0].content[1].marks[0].attrs.href='#a"b';}]){const bad=structuredClone(doc);change(bad);assert.throws(()=>validRichContent(bad),/Unsupported|anchors/);}
});
test('DOCX copies bookmark the heading and link to it internally',async()=>{
  const {exportDocx}=await import('../src/document-codec.js'),xml=await (await JSZip.loadAsync(await exportDocx(doc))).file('word/document.xml').async('string');
  assert.match(xml,/<w:bookmarkStart w:name="h-1a2b3c4d" w:id="[^"]+"\/>/);assert.match(xml,/<w:hyperlink [^>]*w:anchor="h-1a2b3c4d"[^>]*>.*?Results.*?<\/w:hyperlink>/s);assert.match(xml,/<w:hyperlink [^>]*r:id="[^"]+"[^>]*>.*?the site/s);
});
test('RTF copies keep the bookmark and the internal link and read them back',async()=>{
  const {exportRtf,importRtf}=await import('../src/rtf-codec.js'),bytes=exportRtf(doc,defaultDocumentLayout()),rtf=Buffer.from(bytes).toString('latin1');
  assert.ok(rtf.includes('HYPERLINK \\\\l "h-1a2b3c4d"'),rtf.slice(0,400));assert.ok(rtf.includes('{\\*\\bkmkstart h-1a2b3c4d}'));
  const back=importRtf(bytes);validRtfImport(back);const heading=back.doc.content.find(node=>node.type==='heading');assert.equal(heading.attrs.anchor,'h-1a2b3c4d');
  const links=JSON.stringify(back.doc.content[0]);assert.ok(links.includes('"href":"#h-1a2b3c4d"'));assert.ok(links.includes('"href":"https://example.com/"'));
});
test('the PDF copy gives the heading an id and links to it',()=>{
  const {documentHtml}=require('../desktop/document-pdf.cjs'),{html}=documentHtml(doc,defaultDocumentLayout());
  assert.match(html,/<h2[^>]* id="h-1a2b3c4d">Results<\/h2>/);assert.match(html,/<a href="#h-1a2b3c4d">Results<\/a>/);assert.match(html,/<a href="https:\/\/example.com\/">the site<\/a>/);
});
test('opening a link in the browser still takes web and email addresses only',()=>{
  const {validDocumentLink,validLinkTarget}=require('../desktop/document-link-model.cjs');assert.throws(()=>validDocumentLink('#h-1a2b3c4d'));assert.equal(validLinkTarget('#h-1a2b3c4d'),'#h-1a2b3c4d');
});
test('headings 4 to 6 reach DOCX, RTF and the PDF and come back from RTF',async()=>{
  const deep={type:'doc',content:[4,5,6].map(level=>({type:'heading',attrs:{level},content:[{type:'text',text:'Level '+level}]}))};validRichContent(structuredClone(deep));
  const {exportDocx}=await import('../src/document-codec.js'),xml=await (await JSZip.loadAsync(await exportDocx(deep))).file('word/document.xml').async('string');for(const level of [4,5,6])assert.match(xml,new RegExp('<w:pStyle w:val="Heading'+level+'"/>'));
  const {exportRtf,importRtf}=await import('../src/rtf-codec.js'),back=importRtf(exportRtf(deep,defaultDocumentLayout()));validRtfImport(back);assert.deepEqual(back.doc.content.map(node=>node.attrs.level),[4,5,6]);
  const {documentHtml}=require('../desktop/document-pdf.cjs'),{html}=documentHtml(deep,defaultDocumentLayout());assert.match(html,/<h4[^>]*>Level 4<\/h4>/);assert.match(html,/<h6[^>]*>Level 6<\/h6>/);
});
