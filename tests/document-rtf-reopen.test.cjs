const {test}=require('node:test');const assert=require('node:assert/strict');
const {validRtfImport}=require('../desktop/rich-document-validation.cjs');
const linked=(text,href,extra=[])=>({type:'text',text,marks:[...extra,{type:'documentLink',attrs:{href}}]});
const doc={type:'doc',content:[
 {type:'paragraph',attrs:{indent:2,textAlign:'center'},content:[{type:'text',text:'See the '},linked('manual','https://example.com/guide?x=1#top',[{type:'bold'}]),{type:'text',text:' or '},linked('sales','mailto:sales@example.com'),{type:'text',text:'.'}]},
 {type:'paragraph',content:[{type:'text',text:'At the margin'}]},
 {type:'heading',attrs:{level:2,indent:1},content:[{type:'text',text:'Indented heading'}]}]};
const flat=node=>(node.content??[]).flatMap(child=>child.type==='text'?[child]:flat(child));
const link=item=>item.marks?.find(mark=>mark.type==='documentLink')?.attrs.href??null;
test('RTF copies reopen with their links and paragraph indents',async()=>{
  const {exportRtf,importRtf}=await import('../src/rtf-codec.js'),back=importRtf(exportRtf(doc));validRtfImport(back);
  const runs=flat(back.doc),text=runs.map(run=>run.text).join('');assert.equal(text,'See the manual or sales.At the marginIndented heading');
  const manual=runs.find(run=>run.text==='manual'),sales=runs.find(run=>run.text==='sales');assert.equal(link(manual),'https://example.com/guide?x=1#top');assert.equal(link(sales),'mailto:sales@example.com');
  assert.ok(manual.marks.some(mark=>mark.type==='bold'));assert.ok(!manual.marks.some(mark=>mark.type==='underline'),'the link underline is not turned into a separate underline');
  for(const run of runs.filter(run=>!['manual','sales'].includes(run.text)))assert.equal(link(run),null,run.text);
  assert.deepEqual(back.doc.content.map(node=>[node.type,node.attrs.indent??0,node.attrs.textAlign]),[['paragraph',2,'center'],['paragraph',0,'left'],['heading',1,'left']]);
});
test('RTF link fields with unsafe or unknown instructions keep only their visible text',async()=>{
  const {importRtf}=await import('../src/rtf-codec.js'),head=String.raw`{\rtf1\ansi\ansicpg1252\deff0{\fonttbl{\f0\fswiss\fcharset0 Arial;}}\pard `;
  for(const instruction of [String.raw`HYPERLINK "javascript:alert(1)"`,String.raw`HYPERLINK "file:///C:/Windows/win.ini"`,String.raw`HYPERLINK \\l "1bad name"`,'PAGE',String.raw`INCLUDETEXT "C:\\\\secret.txt"`,String.raw`HYPERLINK "https://exa mple.com"`]){
    const back=importRtf(new TextEncoder().encode(head+String.raw`Before {\field{\*\fldinst `+instruction+String.raw`}{\fldrslt shown}} after\par}`));validRtfImport(back);
    const runs=flat(back.doc);assert.equal(runs.map(run=>run.text).join(''),'Before shown after',instruction);assert.ok(runs.every(run=>link(run)===null),instruction);
  }
  // A link to a bookmark (a heading in the document) is an internal link.
  const internal=importRtf(new TextEncoder().encode(head+String.raw`Before {\field{\*\fldinst HYPERLINK \\l "bookmark"}{\fldrslt shown}} after\par}`));validRtfImport(internal);assert.ok(flat(internal.doc).some(run=>link(run)==='#bookmark'));
  const good=importRtf(new TextEncoder().encode(head+String.raw`{\field{\*\fldinst {HYPERLINK "https://example.com/a"}}{\fldrslt {\ul\cf1 nested}}} tail\par}`)),runs=flat(good.doc);
  assert.equal(link(runs.find(run=>run.text==='nested')),'https://example.com/a');assert.equal(link(runs.find(run=>run.text.includes('tail'))),null);
  const odd=importRtf(new TextEncoder().encode(head+String.raw`\li500 Odd indent\par\pard\li1440 Two steps\par\pard None\par}`));assert.deepEqual(odd.doc.content.map(node=>node.attrs.indent??0),[0,2,0]);
});
