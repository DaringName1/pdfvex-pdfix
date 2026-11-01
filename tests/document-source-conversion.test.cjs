const {test}=require('node:test');const assert=require('node:assert/strict');const JSZip=require('jszip');const mammoth=require('mammoth');
const {validRichContent}=require('../desktop/rich-document-validation.cjs');
const MARKDOWN=`# Project *Alpha* report

Intro paragraph with **bold**, *italic*, ~~struck~~, \`inline code\` and a [web link](https://example.com/guide)
continued on a second source line. Mail [the team](mailto:team@example.com). Unsafe [script](javascript:alert(1)) stays text.

## Tasks

- First item
  - Nested item
- [x] Done task
- [ ] Open task

1. Step one
2. Step two

> Quoted line one
> quoted line two

\`\`\`js
const answer = 42; // **not bold**
\`\`\`

---

| Item | Qty | Note |
| --- | ---: | --- |
| Bolt | 12 | **Zinc** |
| Nut | 30 | |

##### Deep heading
<b>raw html</b> and <span>kept span</span> and ![logo](https://example.com/logo.png)
`;
const flat=node=>node.type==='text'?[node]:(node.content??[]).flatMap(flat);
const marksOf=(doc,value)=>flat(doc).find(node=>node.text===value)?.marks?.map(mark=>mark.type).sort().join(',')??null;
test('Markdown converts to a valid formatted document',async()=>{
  const {markdownDocument}=await import('../src/source-to-document.js'),{doc,notes}=markdownDocument(MARKDOWN);validRichContent(structuredClone(doc));
  const types=doc.content.map(node=>node.type+(node.attrs?.level?node.attrs.level:''));assert.deepEqual(types,['heading1','paragraph','heading2','bulletList','orderedList','blockquote','codeBlock','horizontalRule','table','heading5','paragraph']);
  assert.equal(flat(doc.content[0]).map(node=>node.text).join(''),'Project Alpha report');assert.equal(marksOf(doc,'Alpha'),'italic');assert.equal(marksOf(doc,'bold'),'bold');assert.equal(marksOf(doc,'struck'),'strike');assert.equal(marksOf(doc,'inline code'),'code');
  const link=flat(doc).find(node=>node.text==='web link');assert.equal(link.marks[0].attrs.href,'https://example.com/guide');assert.equal(flat(doc).find(node=>node.text==='the team').marks[0].attrs.href,'mailto:team@example.com');
  const all=flat(doc).map(node=>node.text).join('|');assert.ok(all.includes('script (javascript:alert(1))'),'an unsafe link stays visible text');assert.ok(!flat(doc).some(node=>node.marks?.some(mark=>mark.type==='documentLink'&&/javascript/i.test(mark.attrs.href))));
  assert.ok(all.includes('and a ')&&all.includes(' continued on a second source line.'),'soft line breaks become spaces');
  const bullets=doc.content[3];assert.equal(bullets.content.length,3);assert.equal(bullets.content[0].content[1].type,'bulletList');assert.equal(flat(bullets.content[0].content[1])[0].text,'Nested item');assert.equal(flat(bullets.content[1])[0].text,'☑ Done task');assert.equal(flat(bullets.content[2])[0].text,'☐ Open task');
  assert.equal(doc.content[4].content.length,2);assert.equal(flat(doc.content[5]).map(node=>node.text).join(''),'Quoted line one quoted line two');assert.equal(flat(doc.content[6])[0].text,'const answer = 42; // **not bold**');
  const table=doc.content[8];assert.equal(table.content.length,3);assert.deepEqual(table.content.map(row=>row.content.map(cell=>cell.type)).flat().filter((type,index)=>index<4),['tableHeader','tableHeader','tableHeader','tableCell']);assert.equal(marksOf(table,'Zinc'),'bold');assert.equal(table.content[2].content.length,3);
  assert.ok(!all.includes('<b>raw html</b>')&&JSON.stringify(doc).includes('{"type":"text","text":"raw html","marks":[{"type":"bold"}]}'),'inline HTML bold is applied');assert.ok(all.includes('<span>kept span</span>'));assert.ok(all.includes('[Image: logo]'));assert.ok(!notes.some(note=>/level 3/.test(note)),'levels 4 to 6 are kept');assert.ok(notes.some(note=>/literal text/.test(note)));assert.ok(notes.some(note=>/1 image stayed a text label/.test(note)));
});
test('converted Markdown writes a formatted DOCX and RTF',async()=>{
  const {markdownDocument}=await import('../src/source-to-document.js'),{exportDocx}=await import('../src/document-codec.js'),{exportRtf}=await import('../src/rtf-codec.js'),{doc}=markdownDocument(MARKDOWN);
  const bytes=await exportDocx(doc),html=(await mammoth.convertToHtml({buffer:Buffer.from(bytes)})).value;
  for(const part of ['<h1>Project <em>Alpha</em> report</h1>','<strong>bold</strong>','<s>struck</s>','<a href="https://example.com/guide">web link</a>','<li>First item<ul><li>Nested item</li></ul></li>','<ol><li>Step one</li>','<table>','Bolt','<strong>Zinc</strong>','const answer = 42;'])assert.ok(html.includes(part),'DOCX is missing '+part+' in '+html.slice(0,900));
  assert.ok(!/(^|>)#+ |\*\*bold\*\*|\| --- \|/.test(html),'no Markdown syntax is left in the DOCX');
  const rtf=Buffer.from(exportRtf(doc)).toString('latin1');assert.ok(rtf.includes('Project ')&&rtf.includes('HYPERLINK "https://example.com/guide"'));
});
test('CSV converts to tables, split when long, and oversized or odd input is handled',async()=>{
  const {csvDocument,markdownDocument,formattedSourceKind}=await import('../src/source-to-document.js');
  const small=csvDocument('Name,Qty\n"Bolt, zinc",12\nNut,30\n');validRichContent(structuredClone(small.doc));assert.equal(small.doc.content.length,1);assert.equal(small.doc.content[0].content.length,3);assert.equal(flat(small.doc.content[0].content[1])[0].text,'Bolt, zinc');
  const long=csvDocument('A,B\n'+Array.from({length:250},(_,i)=>i+','+(i*2)).join('\n'));validRichContent(structuredClone(long.doc));const tables=long.doc.content.filter(node=>node.type==='table');assert.equal(tables.length,3);assert.equal(tables.reduce((sum,table)=>sum+table.content.length-1,0),250);assert.ok(tables.every(table=>flat(table.content[0])[0].text==='A'));assert.ok(long.notes.some(note=>/split into 3 tables/.test(note)));
  const wide=markdownDocument('|'+Array.from({length:40},(_,i)=>'c'+i).join('|')+'|\n|'+Array.from({length:40},()=>'---').join('|')+'|\n|'+Array.from({length:40},(_,i)=>i).join('|')+'|');validRichContent(structuredClone(wide.doc));assert.equal(wide.doc.content[0].content[0].content.length,32);assert.ok(wide.notes.some(note=>/first 32 columns/.test(note)));
  validRichContent(markdownDocument('').doc);assert.equal(formattedSourceKind('md'),'markdown');assert.equal(formattedSourceKind('csv'),'csv');assert.equal(formattedSourceKind('json'),null);
});
