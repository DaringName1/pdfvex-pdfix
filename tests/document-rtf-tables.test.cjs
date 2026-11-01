const {test}=require('node:test');const assert=require('node:assert/strict');
const {validRtfImport}=require('../desktop/rich-document-validation.cjs');
const p=text=>({type:'paragraph',content:[{type:'text',text}]}),cell=(text,attrs={})=>({type:'tableCell',attrs:{colspan:1,rowspan:1,colwidth:null,background:null,...attrs},content:[p(text)]}),head=text=>({...cell(text),type:'tableHeader'});
const shape=table=>table.content.map(row=>row.content.map(c=>c.type[5]+':'+JSON.stringify(c.content).match(/"text":"([^"]*)/)?.[1]+'/'+c.attrs.colspan+'x'+c.attrs.rowspan+(c.attrs.background?' '+c.attrs.background:'')).join(' | '));
test('PDFix RTF copies write real tables and reopen them with header, merges, shading and widths',async()=>{
  const {exportRtf,importRtf}=await import('../src/rtf-codec.js');
  const doc={type:'doc',content:[p('Before'),{type:'table',attrs:{columnGridTwips:[1,2,1]},content:[{type:'tableRow',content:[head('H1'),head('H2'),head('H3')]},{type:'tableRow',content:[cell('Wide',{colspan:2,background:'#ffeecc'}),cell('Tall',{rowspan:2})]},{type:'tableRow',content:[cell('A'),{type:'tableCell',attrs:{colspan:1,rowspan:1,colwidth:null,background:null},content:[{type:'bulletList',content:[{type:'listItem',content:[p('Listed')]}]}]}]}]},p('After')]};
  const rtf=Buffer.from(exportRtf(doc)).toString('latin1');assert.match(rtf,/\\trowd\\trgaph108\\trleft0\\trhdr/);assert.match(rtf,/\\clmgf\\clcbpat1/);assert.match(rtf,/\\clvmgf/);assert.match(rtf,/\\pard\\intbl\\cell/);
  const back=importRtf(Buffer.from(rtf,'latin1'));validRtfImport(back);assert.deepEqual(back.doc.content.map(n=>n.type),['paragraph','table','paragraph']);
  const table=back.doc.content[1];assert.deepEqual(table.attrs.columnGridTwips.map(w=>Math.round(w/table.attrs.columnGridTwips[0])),[1,2,1]);
  assert.deepEqual(shape(table),['H:H1/1x1 | H:H2/1x1 | H:H3/1x1','C:Wide/2x1 #ffeecc | C:Tall/1x2','C:A/1x1 | C:Listed/1x1']);
  assert.equal(table.content[2].content[1].content[0].type,'bulletList','a list inside a cell stays a list');
  assert.ok(!back.warnings.some(text=>/tab-separated/.test(text)));
});
test('Word-style RTF tables are read; nested tables fall back to text rows',async()=>{
  const {importRtf}=await import('../src/rtf-codec.js');
  const word='{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\pard Intro\\par\\trowd\\cellx3000\\cellx6000\\pard\\intbl One\\cell Two\\cell\\row\\trowd\\cellx3000\\cellx6000\\pard\\intbl Three\\cell Four\\cell\\row\\pard After\\par}';
  const back=importRtf(Buffer.from(word,'latin1'));validRtfImport(back);assert.deepEqual(back.doc.content.map(n=>n.type),['paragraph','table','paragraph']);assert.deepEqual(shape(back.doc.content[1]),['C:One/1x1 | C:Two/1x1','C:Three/1x1 | C:Four/1x1']);
  const nested='{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\trowd\\cellx3000\\cellx6000\\pard\\intbl Outer\\nestcell Inner\\cell Two\\cell\\row\\pard After\\par}';
  const flat=importRtf(Buffer.from(nested,'latin1'));validRtfImport(flat);assert.ok(!flat.doc.content.some(n=>n.type==='table'));assert.ok(flat.warnings.some(text=>/tab-separated/.test(text)));
});
