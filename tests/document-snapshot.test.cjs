const {test}=require('node:test');const assert=require('node:assert/strict');const JSZip=require('jszip');const fs=require('node:fs/promises');const path=require('node:path');
const {defaultDocumentLayout}=require('../desktop/document-layout-validation.cjs');
const {readDocx}=require('../desktop/rich-document-codec.cjs');
const {validDocxImport}=require('../desktop/rich-document-validation.cjs');
const {documentSnapshot,SNAPSHOT_LIMIT}=require('../desktop/document-snapshot-model.cjs');
const style=(font,size,color)=>({type:'documentTextStyle',attrs:{font,size,color}});
const doc={type:'doc',content:[
 {type:'heading',attrs:{level:1,textAlign:'center'},content:[{type:'text',text:'Site report'}]},
 {type:'paragraph',attrs:{textAlign:'right'},content:[{type:'text',text:'Serif red 18',marks:[style('serif',18,'#c00000')]},{type:'text',text:' and '},{type:'text',text:'a link',marks:[{type:'documentLink',attrs:{href:'https://example.com/'}}]}]},
 {type:'pageBreak'},
 {type:'paragraph',attrs:{textAlign:'justify'},content:[{type:'text',text:'Second page text.',marks:[{type:'strike'}]}]}]};
const layout={...defaultDocumentLayout(),paper:'legal',landscape:true,margin:25,font:'serif',size:11,lineHeight:2,pageNumbers:true,pageNumberPlacement:'header',pageNumberAlign:'right',headerText:'Header',footerText:'Footer',footerAlign:'center'};
test('a DOCX copy carries a bound copy of the editor model that the engine returns unchanged',async()=>{
  const {exportDocx,checkDocxArchive}=await import('../src/document-codec.js'),bytes=await exportDocx(doc,layout);assert.equal(checkDocxArchive(bytes),true);
  const imported=await readDocx(bytes,{});assert.deepEqual(imported.snapshot,{version:1,content:doc,layout});validDocxImport(imported);
  assert.match(imported.html,/Site report/);assert.match(imported.html,/Second page text/);
});
test('the saved model is dropped when the body changed, the hash is missing or the copy is malformed',async()=>{
  const {exportDocx}=await import('../src/document-codec.js'),bytes=await exportDocx(doc,layout);
  const rewrite=async change=>{const zip=await JSZip.loadAsync(bytes);await change(zip);return zip.generateAsync({type:'uint8array',compression:'DEFLATE'});};
  const edited=await readDocx(await rewrite(async zip=>zip.file('word/document.xml',(await zip.file('word/document.xml').async('string')).replace('Site report','Site rep0rt'))),{});assert.equal(edited.snapshot,undefined);assert.match(edited.html,/Site rep0rt/);
  const custom=async(zip,change)=>zip.file('docProps/custom.xml',change(await zip.file('docProps/custom.xml').async('string')));
  for(const change of [text=>text.replace(/>[a-f0-9]{64}</,'>'+'0'.repeat(64)+'<'),text=>text.replace('&quot;version&quot;:1','&quot;version&quot;:2'),text=>text.replace('documentTextStyle','script'),text=>text.replace('&quot;paper&quot;:&quot;legal&quot;','&quot;paper&quot;:&quot;bad&quot;'),text=>text.replace('https://example.com/','javascript:alert(1)')]){
    const result=await readDocx(await rewrite(zip=>custom(zip,change)),{});assert.equal(result.snapshot,undefined,String(change));assert.match(result.html,/Site report/);
  }
  const plain=await readDocx(await rewrite(zip=>{zip.remove('docProps/custom.xml');}),{}).catch(error=>error);assert.ok(plain instanceof Error||plain.snapshot===undefined);
});
test('images are kept out of the saved model and oversized models are not written',async()=>{
  const {exportDocx}=await import('../src/document-codec.js'),{normalizeless}={normalizeless:true};assert.ok(normalizeless);
  const png=await fs.readFile(path.join(__dirname,'fixtures','scan-page.png')),{rasterHeader}=require('../desktop/document-image-validation.cjs'),size=rasterHeader(png,'image/png');
  if(png.length<=512*1024){const image={type:'documentImage',attrs:{src:'data:image/png;base64,'+png.toString('base64'),alt:'Scan',width:200,height:Math.round(200*size.height/size.width),pixelWidth:size.width,pixelHeight:size.height}},withImage={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Before '},image]}]};
    const text=documentSnapshot(withImage,defaultDocumentLayout());assert.ok(text.length<2000);assert.ok(text.includes('pdfix-snapshot-image-1'));assert.equal(withImage.content[0].content[1].attrs.src.startsWith('data:image/png'),true,'the caller model is not modified');
    const imported=await readDocx(await exportDocx(withImage),{});assert.equal(imported.snapshot.content.content[0].content[1].attrs.src,'pdfix-snapshot-image-1');assert.equal(imported.assets.length,1);validDocxImport(imported);}
  const big={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'x'.repeat(SNAPSHOT_LIMIT)}]}]};assert.equal(documentSnapshot(big,defaultDocumentLayout()),null);
  const zip=await JSZip.loadAsync(await exportDocx(big));assert.ok(!(await zip.file('docProps/custom.xml')?.async('string')??'').includes('PDFixDocument'));assert.equal((await readDocx(await exportDocx(big),{})).snapshot,undefined);
});
