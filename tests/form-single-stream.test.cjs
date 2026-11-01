const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const path=require('node:path');const {createHash,randomUUID}=require('node:crypto');
const {PDFDocument,PDFName,PDFRef,PDFArray}=require('pdf-lib');
const hash=value=>createHash('sha256').update(value).digest('hex');
const placement=(kind,text,rect)=>({id:'pdfix-form-'+randomUUID(),kind,page:0,rect,rotation:0,confirmed:true,asset:{type:'text',text}});
const textOf=async bytes=>{const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(bytes),useSystemFonts:true}),document=await task.promise,pages=[];for(let number=1;number<=document.numPages;number++)pages.push((await (await document.getPage(number)).getTextContent()).items.map(item=>item.str).join(' '));await task.destroy();return pages;};
// Most PDFs store one content stream per page as a single reference; some store an array. Both must be fillable.
test('Fill and sign places text and a typed signature on pages with a single content stream or an array',async()=>{
  const {filledPdf}=await import('../src/form-output.js');
  for(const name of ['reading-sample.pdf','navigation-sample.pdf']){
    const bytes=new Uint8Array(await fs.readFile(path.join(__dirname,'fixtures',name))),original=bytes.slice(),source=await PDFDocument.load(bytes,{updateMetadata:false}),entry=source.getPages()[0].node.get(PDFName.of('Contents')),shape=entry instanceof PDFRef&&!(source.context.lookup(entry) instanceof PDFArray)?'single reference':'array';
    const draft={kind:'form',version:1,values:[],overlays:[placement('text','Approved for issue 2026',[100,300,340,340]),placement('signature','Alex Example',[100,240,340,280])]};
    const output=await filledPdf(bytes,draft,()=>{},hash);assert.equal(output.overlays.length,2,name);assert.deepEqual(bytes,original,name+': source bytes unchanged');
    const before=await textOf(original),after=await textOf(output.bytes);assert.equal(after.length,before.length,name);assert.ok(after[0].includes('Approved for issue 2026')&&after[0].includes('Alex Example'),name+' ('+shape+') page 1 text: '+after[0].slice(-120));
    for(let index=1;index<before.length;index++)assert.equal(after[index],before[index],name+' page '+(index+1)+' unchanged');assert.ok(after[0].startsWith(before[0].slice(0,40)),name+': original page 1 text is still there');
  }
  const single=new Uint8Array(await fs.readFile(path.join(__dirname,'fixtures','reading-sample.pdf'))),check=await PDFDocument.load(single,{updateMetadata:false});assert.ok(check.getPages()[0].node.get(PDFName.of('Contents')) instanceof PDFRef,'the reading fixture really is the single-reference case');
});
test('Fill and sign still refuses an unconfirmed placement and one outside the page',async()=>{
  const {filledPdf}=await import('../src/form-output.js'),bytes=new Uint8Array(await fs.readFile(path.join(__dirname,'fixtures','reading-sample.pdf')));
  await assert.rejects(filledPdf(bytes,{kind:'form',version:1,values:[],overlays:[{...placement('text','x',[100,300,340,340]),confirmed:false}]},()=>{},hash),/Confirm/);
  await assert.rejects(filledPdf(bytes,{kind:'form',version:1,values:[],overlays:[placement('text','x',[-10,300,340,340])]},()=>{},hash),/boundary|visible/);
  await assert.rejects(filledPdf(bytes,{kind:'form',version:1,values:[],overlays:[placement('text','x',[100,300,340,340])]}),/native retention verifier/);
});
