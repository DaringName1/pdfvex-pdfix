const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {PDFDocument,PDFString}=require('pdf-lib'),{sanitize}=require('../desktop/pdf-sanitize-codec.cjs');
async function fixture(){const pdf=await PDFDocument.create();pdf.addPage([400,600]).drawText('Keep visible page text',{x:40,y:500});await pdf.attach(Buffer.from('Remove this attachment'),'private.txt');pdf.setTitle('Private title');pdf.context.register(PDFString.of('Discard trailing orphan object'));return Buffer.from(await pdf.save({useObjectStreams:false}));}
const selection={metadata:true,attachments:true,annotations:true,forms:false,actions:true};
test('cleanup prunes trailing objects without leaving an inflated cross-reference size',async()=>{
 const input=await fixture(),original=Buffer.from(input),result=await sanitize(input,selection),saved=await PDFDocument.load(result.bytes,{updateMetadata:false}),highest=saved.context.enumerateIndirectObjects().reduce((max,[ref])=>Math.max(max,ref.objectNumber),0),sizes=[...Buffer.from(result.bytes).toString('latin1').matchAll(/\/Size\s+(\d+)/g)];
 assert.ok(result.report.prunedObjects>0);assert.equal(Number(sizes.at(-1)?.[1]),highest+1,'Fresh cross-reference size must end at the highest retained object');assert.deepEqual(input,original);assert.equal(saved.getPageCount(),1);assert.equal(saved.getTitle(),undefined);assert.ok(!Buffer.from(result.bytes).includes(Buffer.from('Discard trailing orphan object')));
});
test('a cleaned generated PDF passes strict qpdf checking without repair or warnings',{skip:process.platform!=='win32'},async t=>{
 const engine=path.resolve('dist/native/qpdf/bin/qpdf.exe');try{await fs.access(engine);}catch{t.skip('Pinned qpdf test runtime is not built');return;}
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-cleanup-xref-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const input=await fixture(),result=await sanitize(input,selection),file=path.join(root,'cleaned.pdf');await fs.writeFile(file,result.bytes,{flag:'wx'});
 const check=spawnSync(engine,['--suppress-recovery','--check',file],{encoding:'utf8',windowsHide:true,timeout:10000,maxBuffer:65536});assert.equal(check.error,undefined);assert.equal(check.status,0,check.stderr);assert.equal(check.stderr,'');assert.equal((await PDFDocument.load(await fs.readFile(file))).getPageCount(),1);
});
