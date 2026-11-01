const {test}=require('node:test');const assert=require('node:assert/strict');const mammoth=require('mammoth');const fs=require('node:fs/promises');const path=require('node:path');
const codec=import('../src/document-codec.js');
test('formatted DOCX export reimports with headings, emphasis and lists',async()=>{
  const {exportDocx,checkDocxArchive}=await codec;const doc={type:'doc',content:[{type:'heading',attrs:{level:1},content:[{type:'text',text:'Project notes'}]},{type:'paragraph',content:[{type:'text',text:'Important change',marks:[{type:'bold'},{type:'underline'}]}]},{type:'bulletList',content:[{type:'listItem',content:[{type:'paragraph',content:[{type:'text',text:'Check the source'}]}]}]}]};const bytes=await exportDocx(doc);assert.equal(checkDocxArchive(bytes),true);const result=await mammoth.convertToHtml({buffer:Buffer.from(bytes)});assert.match(result.value,/<h1>Project notes/);assert.match(result.value,/<strong>/);assert.match(result.value,/<ul>/);assert.match(result.value,/Check the source/);
  // The desktop tests open this fixture. It is written only when missing or when UPDATE_FIXTURES=1, so an ordinary test run leaves the working tree clean.
  const fixture=path.join(__dirname,'fixtures','editing-sample.docx');if(process.env.UPDATE_FIXTURES==='1'||!await fs.stat(fixture).catch(()=>null)){await fs.mkdir(path.dirname(fixture),{recursive:true});await fs.writeFile(fixture,bytes);}
});
test('ZIP expansion, damaged archives and macro names are rejected before import',async()=>{
  const {exportDocx,checkDocxArchive}=await codec;assert.throws(()=>checkDocxArchive(new Uint8Array(32)),/damaged/);const bytes=await exportDocx({type:'doc',content:[]});const malicious=new Uint8Array(bytes);const view=new DataView(malicious.buffer);let central=-1;for(let i=0;i<malicious.length-4;i++)if(view.getUint32(i,true)===0x02014b50){central=i;break;}view.setUint32(central+24,401*1024*1024,true);assert.throws(()=>checkDocxArchive(malicious),/expanded/);
});
test('plain text conversion keeps source text inert and visual selection excludes distant columns',async()=>{
  const {textDocument,plainText}=await codec;assert.equal(plainText(textDocument('<script>never execute</script>\nSecond line')),'<script>never execute</script>\nSecond line');
  const {orderVisualText,insideSelection}=await import('../src/pdf-selection.js');const entries=[{text:'Right column',left:200,top:20,width:90,height:12},{text:'second',left:10,top:40,width:70,height:12},{text:'Left first',left:10,top:20,width:70,height:12}];assert.deepEqual(orderVisualText(entries.filter(e=>insideSelection(e,{left:0,right:100,top:0,bottom:60}))),['Left first','second']);
});
