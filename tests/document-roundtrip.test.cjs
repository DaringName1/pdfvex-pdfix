const {test}=require('node:test');const assert=require('node:assert/strict');const JSZip=require('jszip');const mammoth=require('mammoth');
const {defaultDocumentLayout}=require('../desktop/document-layout-validation.cjs');
const cell=(type,text)=>({type,attrs:{colspan:1,rowspan:1,colwidth:null,background:null},content:[{type:'paragraph',content:[{type:'text',text}]}]});
const doc={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Body text'}]},{type:'table',content:[{type:'tableRow',content:[cell('tableHeader','Item'),cell('tableHeader','Qty')]},{type:'tableRow',content:[cell('tableCell','Bolt'),cell('tableCell','12')]}]}]};
test('RTF copies reopen with their own plain header and footer text',async()=>{
  const {exportRtf,importRtf}=await import('../src/rtf-codec.js');
  for(const pageNumbers of [true,false])for(const pageNumberPlacement of ['header','footer']){
    const back=importRtf(exportRtf(doc,{...defaultDocumentLayout(),headerText:'Project Alpha\nSecond line',headerAlign:'center',footerText:'Rev 3 footer',footerAlign:'right',pageNumbers,pageNumberPlacement}));
    assert.deepEqual(back.bands,{header:{text:'Project Alpha\nSecond line',align:'center'},footer:{text:'Rev 3 footer',align:'right'}},`page numbers ${pageNumbers} in ${pageNumberPlacement}`);
  }
  const numbersOnly=importRtf(exportRtf(doc,{...defaultDocumentLayout(),pageNumbers:true}));assert.deepEqual(numbersOnly.bands,{header:null,footer:null});assert.ok(!numbersOnly.warnings.some(note=>/^Original (header|footer) omitted/.test(note)));
});
test('RTF header text that shares a line with a page field is still refused, not half imported',async()=>{
  const {importRtf}=await import('../src/rtf-codec.js');
  const rtf=String.raw`{\rtf1\ansi\ansicpg1252\deff0{\fonttbl{\f0\fswiss\fcharset0 Arial;}}{\header \pard\ql Page {\field{\*\fldinst PAGE}{\fldrslt 4}} of report\par }\pard Body\par}`;
  const back=importRtf(new TextEncoder().encode(rtf));assert.equal(back.bands.header,null);assert.ok(back.warnings.some(note=>/Original header omitted: page fields mixed with authored text/.test(note)));
  const bold=String.raw`{\rtf1\ansi\ansicpg1252\deff0{\fonttbl{\f0\fswiss\fcharset0 Arial;}}{\header \pard\ql \b Bold title\par }\pard Body\par}`;
  assert.equal(importRtf(new TextEncoder().encode(bold)).bands.header,null);
});
test('DOCX copies mark only real header rows as repeating table headers',async()=>{
  const {exportDocx}=await import('../src/document-codec.js'),bytes=await exportDocx(doc),xml=await (await JSZip.loadAsync(bytes)).file('word/document.xml').async('string');
  assert.equal((xml.match(/<w:tblHeader/g)??[]).length,1);
  const html=(await mammoth.convertToHtml({buffer:Buffer.from(bytes)})).value;assert.match(html,/<thead><tr><th>.*Item.*<\/tr><\/thead><tbody><tr><td>.*Bolt/s);
});
test('RTF copies reopen with their page size, orientation and side margins',async()=>{
  const {exportRtf,importRtf}=await import('../src/rtf-codec.js'),{validRtfImport}=require('../desktop/rich-document-validation.cjs');
  for(const [paper,landscape,margin] of [['legal',true,25],['a4',false,20],['a5',true,10],['tabloid',false,50],['letter',false,5]]){const back=importRtf(exportRtf(doc,{...defaultDocumentLayout(),paper,landscape,margin,headerText:'Title'}));assert.deepEqual(back.page,{paper,landscape,margin});validRtfImport(back);}
  const odd=importRtf(new TextEncoder().encode(String.raw`{\rtf1\ansi\ansicpg1252\deff0{\fonttbl{\f0\fswiss\fcharset0 Arial;}}\paperw39000\paperh9000\pard Body\par}`));assert.equal(odd.page,undefined);assert.ok(odd.warnings.some(note=>/Original page size omitted/.test(note)));validRtfImport(odd);
  const good=importRtf(exportRtf(doc));for(const page of [{paper:'bad',landscape:false,margin:20},{paper:'a4',landscape:false,margin:99},{paper:'a4',landscape:false,margin:20,extra:1}])assert.throws(()=>validRtfImport({...good,page}),/Invalid imported page setup/);
});
