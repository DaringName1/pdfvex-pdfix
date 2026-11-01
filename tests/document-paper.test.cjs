const {test}=require('node:test');const assert=require('node:assert/strict');const JSZip=require('jszip');
const {validDocumentLayout,defaultDocumentLayout,documentPapers,documentPaperSize,documentPageMargins}=require('../desktop/document-layout-validation.cjs');
const twips=mm=>Math.round(mm*1440/25.4);
const doc={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Paper size check'}]}]};
test('page setup accepts every listed paper size and rejects unknown ones',()=>{
  assert.deepEqual(Object.keys(documentPapers),['a4','letter','legal','a3','a5','tabloid']);
  assert.deepEqual(documentPaperSize({paper:'legal',landscape:false}),[215.9,355.6]);assert.deepEqual(documentPaperSize({paper:'legal',landscape:true}),[355.6,215.9]);
  for(const paper of Object.keys(documentPapers))for(const landscape of [false,true]){const layout=validDocumentLayout({...defaultDocumentLayout(),paper,landscape});assert.equal(layout.paper,paper);assert.equal(documentPageMargins(layout).left,20);}
  for(const paper of ['executive','constructor','__proto__','',null,7])assert.throws(()=>validDocumentLayout({...defaultDocumentLayout(),paper}),/listed paper size/);
});
test('DOCX and RTF copies carry the chosen paper size and orientation',async()=>{
  const {exportDocx}=await import('../src/document-codec.js'),{exportRtf}=await import('../src/rtf-codec.js');
  for(const paper of Object.keys(documentPapers))for(const landscape of [false,true]){
    const layout={...defaultDocumentLayout(),paper,landscape},[width,height]=documentPaperSize(layout).map(twips);
    const xml=await (await JSZip.loadAsync(await exportDocx(doc,layout))).file('word/document.xml').async('string'),size=xml.match(/<w:pgSz [^>]*>/)[0];
    assert.match(size,new RegExp(`w:w="${width}"`),`${paper} ${landscape} DOCX width in ${size}`);assert.match(size,new RegExp(`w:h="${height}"`),`${paper} ${landscape} DOCX height in ${size}`);assert.equal(/w:orient="landscape"/.test(size),landscape);
    const rtf=Buffer.from(exportRtf(doc,layout)).toString('latin1');assert.ok(rtf.includes(`\\paperw${width}\\paperh${height}`),`${paper} ${landscape} RTF size`);assert.equal(rtf.includes('\\landscape'),landscape);
  }
});
test('a saved DOCX copy reports its page size, orientation and side margins on import',async()=>{
  const {exportDocx}=await import('../src/document-codec.js'),{inspectDocumentTableGrids}=require('../desktop/document-grid-import.cjs'),{validDocumentGridReport}=require('../desktop/document-grid-validation.cjs');
  for(const [paper,landscape,margin] of [['legal',true,25],['a4',false,20],['a5',true,10],['tabloid',false,50],['letter',false,5]]){
    const report=inspectDocumentTableGrids(await exportDocx(doc,{...defaultDocumentLayout(),paper,landscape,margin}));assert.deepEqual(report.page,{paper,landscape,margin});validDocumentGridReport(report,report.sourceSha256);
  }
  const {inspectDocumentTableGrids:inspect}=require('../desktop/document-grid-import.cjs'),zip=await JSZip.loadAsync(await exportDocx(doc)),xml=await zip.file('word/document.xml').async('string');
  zip.file('word/document.xml',xml.replace(/<w:pgSz [^>]*>/,'<w:pgSz w:w="9000" w:h="9000"/>'));const odd=inspect(await zip.generateAsync({type:'uint8array'}));assert.equal(odd.page.paper,'custom');assert.deepEqual(odd.page.customSize,[158.8,158.8]);
  zip.file('word/document.xml',xml.replace(/<w:pgSz [^>]*>/,'<w:pgSz w:w="39000" w:h="9000"/>'));const huge=inspect(await zip.generateAsync({type:'uint8array'}));assert.equal(huge.page,undefined);assert.ok(huge.notices.some(note=>/outside the 50 to 600 mm/.test(note)));
  const base=inspect(await exportDocx(doc));for(const page of [{paper:'bad',landscape:false,margin:20},{paper:'a4',landscape:'no',margin:20},{paper:'a4',landscape:false,margin:99},{paper:'a4',landscape:false,margin:20,extra:1}])assert.throws(()=>validDocumentGridReport({...base,page},base.sourceSha256),/source\/shape limits/);
});
