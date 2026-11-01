const {test}=require('node:test');const assert=require('node:assert/strict');const JSZip=require('jszip');
const {validDocumentLayout,defaultDocumentLayout,documentPageMargins,sideMargins}=require('../desktop/document-layout-validation.cjs');
const doc={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Body text'}]}]};
const layout={...defaultDocumentLayout(),sides:{top:15,right:20,bottom:30,left:35}};
test('separate side margins validate from 5 to 50 mm and the single margin still applies without them',()=>{
  assert.deepEqual(sideMargins(defaultDocumentLayout()),{top:20,right:20,bottom:20,left:20});
  const valid=validDocumentLayout(layout);assert.deepEqual(valid.sides,{top:15,right:20,bottom:30,left:35});assert.deepEqual(documentPageMargins(valid),{top:15,bottom:30,left:35,right:20,header:4,footer:4});
  assert.equal(Object.hasOwn(validDocumentLayout({...defaultDocumentLayout(),sides:null}),'sides'),false,'null sides are dropped so older copies compare equal');
  for(const sides of [{top:4,right:20,bottom:20,left:20},{top:20,right:51,bottom:20,left:20},{top:20,right:20,bottom:20},{top:20,right:20,bottom:20,left:20,gutter:5},{top:'20',right:20,bottom:20,left:20},{top:20.5,right:20,bottom:20,left:20}])assert.throws(()=>validDocumentLayout({...defaultDocumentLayout(),sides}),/margin/,JSON.stringify(sides));
  assert.throws(()=>validDocumentLayout({...defaultDocumentLayout(),paper:'a5',sides:{top:20,right:50,bottom:20,left:50}}),/less than 50 mm/);
});
test('DOCX, RTF and PDF copies use each side margin',async()=>{
  const twips=mm=>Math.round(mm*1440/25.4);
  const {exportDocx}=await import('../src/document-codec.js'),xml=await (await JSZip.loadAsync(await exportDocx(doc,layout))).file('word/document.xml').async('string'),pgMar=xml.match(/<w:pgMar [^>]*>/)[0];
  for(const [name,mm] of [['top',15],['right',20],['bottom',30],['left',35]])assert.match(pgMar,new RegExp('w:'+name+'="'+twips(mm)+'"'),name);
  const {exportRtf}=await import('../src/rtf-codec.js'),rtf=Buffer.from(exportRtf(doc,layout)).toString('latin1');
  assert.match(rtf,new RegExp('\\\\margl'+twips(35)+'\\\\margr'+twips(20)+'\\\\margt'+twips(15)+'\\\\margb'+twips(30)));
  const {documentHtml}=require('../desktop/document-pdf.cjs'),{options}=documentHtml(doc,layout);assert.deepEqual(options.sides,{top:15,right:20,bottom:30,left:35});
});
test('a custom paper size validates from 50 to 600 mm and reaches DOCX, RTF and the PDF page',async()=>{
  const layout=validDocumentLayout({...defaultDocumentLayout(),paper:'custom',customSize:[120,180]}),twips=mm=>Math.round(mm*1440/25.4);assert.deepEqual(layout.customSize,[120,180]);
  for(const customSize of [[49,180],[120,601],[120],'120x180',null])assert.throws(()=>validDocumentLayout({...defaultDocumentLayout(),paper:'custom',customSize}),/paper/,JSON.stringify(customSize));
  assert.equal(Object.hasOwn(validDocumentLayout({...defaultDocumentLayout(),paper:'letter',customSize:[120,180]}),'customSize'),false);
  const {exportDocx}=await import('../src/document-codec.js'),xml=await (await JSZip.loadAsync(await exportDocx(doc,layout))).file('word/document.xml').async('string');assert.match(xml,new RegExp('<w:pgSz w:w="'+twips(120)+'" w:h="'+twips(180)+'"'));
  const {exportRtf}=await import('../src/rtf-codec.js'),rtf=Buffer.from(exportRtf(doc,{...layout,landscape:true})).toString('latin1');assert.ok(rtf.includes('paperw'+twips(180)+'\\paperh'+twips(120)),rtf.slice(0,300));
});
test('imported pages: custom sizes inside 50 to 600 mm, separate margins only when left and right differ',()=>{
  const {documentPageFromTwips,validDocumentPage}=require('../desktop/document-layout-validation.cjs'),t=mm=>Math.round(mm*1440/25.4);
  assert.deepEqual(documentPageFromTwips(t(150),t(200),t(25),t(15),t(30),t(10)).page,{paper:'custom',customSize:[150,200],landscape:false,margin:20,sides:{top:30,right:15,bottom:10,left:25}});
  assert.deepEqual(documentPageFromTwips(t(210),t(297),t(20),t(20),t(35),t(12)).page,{paper:'a4',landscape:false,margin:20},'equal left and right keep one margin even when top and bottom differ');
  assert.equal(documentPageFromTwips(t(700),t(200),t(20),t(20)),null);
  for(const page of [{paper:'custom',landscape:false,margin:20},{paper:'a4',landscape:false,margin:20,extra:1},{paper:'a4',landscape:false,margin:20,sides:{top:1,right:20,bottom:20,left:20}}])assert.throws(()=>validDocumentPage(page),/Invalid imported page/,JSON.stringify(page));
});
