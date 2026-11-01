const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{randomUUID}=require('node:crypto');
const {PDFDocument,StandardFonts}=require('pdf-lib');
const {BatchCompression}=require('../desktop/batch-compression.cjs'),{BatchDocumentActions}=require('../desktop/batch-document-actions.cjs'),{extractBatchPdfText}=require('../desktop/batch-pdf-text-codec.cjs'),{FileStore}=require('../desktop/file-store.cjs');
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
async function fixture(t){
 const parent=path.resolve(os.tmpdir()),root=await fs.mkdtemp(path.join(parent,'pdfix-batch-converter-'));
 t.after(()=>{if(path.dirname(root)!==parent||!path.basename(root).startsWith('pdfix-batch-converter-'))throw new Error('Unexpected cleanup path');return fs.rm(root,{recursive:true,force:true});});
 const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica);doc.addPage([300,200]).drawText('Batch conversion source',{font,x:20,y:100});const bytes=await doc.save(),original=path.join(root,'source.pdf');await fs.writeFile(original,bytes);return {root,bytes,original};
}
function output(bytes){return {bytes:Uint8Array.from(bytes),originalSize:bytes.length,size:bytes.length,pageCount:1,geometry:[{media:{x:0,y:0,width:300,height:200},crop:{x:0,y:0,width:300,height:200},rotation:0}],mode:'lossless',changedImages:0};}
async function compression(t,engine){const f=await fixture(t),second=path.join(f.root,'unstarted.pdf');await fs.writeFile(second,f.bytes);const service=new BatchCompression(engine??{compress:async(token,bytes)=>output(bytes),cancel:async()=>true});t.after(()=>service.dispose());const session=await service.select([f.original,second]);await service.destination(session.token,f.root,'Copies');return {...f,service,session,id:session.sources[0].id,job:randomUUID()};}
test('batch compression rejects changed source before dispatching the engine',async t=>{
 let calls=0;const f=await compression(t,{compress:async()=>{calls++;},cancel:async()=>true});await fs.writeFile(f.original,'changed');await assert.rejects(f.service.build(f.session.token,f.id,f.job,{mode:'lossless'}),error=>error.code==='CHANGED');assert.equal(calls,0);assert.equal(f.service.report(f.session.token).files[0].status,'failed');
});
test('batch compression rechecks source after output-folder preparation',async t=>{
 const f=await compression(t),preview=await f.service.build(f.session.token,f.id,f.job,{mode:'lossless'}),prepare=f.service.prepareFolder.bind(f.service);f.service.prepareFolder=async()=>{const folder=await prepare();await fs.writeFile(f.original,'changed during folder preparation');return folder;};let writes=0;
 await assert.rejects(f.service.save({saveCopy:async()=>{writes++;}},f.session.token,f.id,f.job,{sha256:preview.sha256}),error=>error.code==='CHANGED');assert.equal(writes,0);assert.equal(f.service.saving,false);assert.deepEqual(await fs.readdir(path.join(f.root,'Copies')),[]);
});
test('batch Stop waits for asynchronous cancellation and retains unstarted rows',async t=>{
 const job=deferred(),cancel=deferred(),started=deferred();const f=await compression(t,{compress:()=>{started.resolve();return job.promise;},cancel:()=>cancel.promise});
 const build=f.service.build(f.session.token,f.id,f.job,{mode:'lossless'});const rejection=assert.rejects(build,error=>error.code==='CANCELED');await started.promise;let stopped=false;const stop=f.service.cancel(f.session.token).then(()=>{stopped=true;});job.resolve(output(f.bytes));await rejection;await new Promise(resolve=>setImmediate(resolve));assert.equal(stopped,false);cancel.resolve(true);await stop;assert.deepEqual(f.service.report(f.session.token).files.map(row=>row.status),['canceled','queued']);assert.equal(f.service.verified,null);
});
test('batch save warnings distinguish completed output from a source changed during writing',async t=>{
 const f=await compression(t),preview=await f.service.build(f.session.token,f.id,f.job,{mode:'lossless'});
 // Explicit save seam: native PDF structural verification is outside this test.
 const store={saveCopy:async(id,destination,bytes)=>{await fs.writeFile(destination,bytes,{flag:'wx'});await fs.writeFile(f.original,'changed after writing');return {name:path.basename(destination),location:destination};}};
 const saved=await f.service.save(store,f.session.token,f.id,f.job,{sha256:preview.sha256});assert.match(saved.warning,/original changed/);const row=f.service.report(f.session.token).files[0];assert.equal(row.status,'saved');assert.equal(row.warning,saved.warning);assert.deepEqual(new Uint8Array(await fs.readFile(saved.location)),f.bytes);
});
test('batch failed encoding can retry without advancing another queue item',async t=>{
 let attempts=0;const f=await compression(t,{compress:async(token,bytes)=>{if(++attempts===1)throw new Error('Decoder failed');return output(bytes);},cancel:async()=>true});await assert.rejects(f.service.build(f.session.token,f.id,f.job,{mode:'lossless'}),/Decoder failed/);assert.equal(f.service.report(f.session.token).files[0].status,'failed');await f.service.build(f.session.token,f.id,randomUUID(),{mode:'lossless'});const row=f.service.report(f.session.token).files[0];assert.equal(row.status,'review');assert.equal(row.error,undefined);
});
test('failed batch saves remain reviewable with per-file errors and can be retried',async t=>{
 const f=await compression(t),preview=await f.service.build(f.session.token,f.id,f.job,{mode:'lossless'}),review={sha256:preview.sha256};
 await assert.rejects(f.service.save({saveCopy:async()=>{throw new Error('Disk full');}},f.session.token,f.id,f.job,review),/Disk full/);const report=f.service.report(f.session.token);assert.equal(report.files[0].status,'review');assert.equal(report.files[0].error,'Disk full');assert.equal(report.files[1].status,'queued');assert.equal(f.service.saving,false);
 await f.service.save({saveCopy:async(id,destination,bytes)=>{await fs.writeFile(destination,bytes,{flag:'wx'});return {name:path.basename(destination),location:destination};}},f.session.token,f.id,f.job,review);const row=f.service.report(f.session.token).files[0];assert.equal(row.status,'saved');assert.equal(row.error,undefined);
});
test('failed cancellation is surfaced and unfinished processing blocks a replacement',async t=>{
 const pending=deferred(),started=deferred();let calls=0;const f=await compression(t,{compress:()=>{started.resolve();return pending.promise;},cancel:async()=>{if(++calls===1)throw new Error('Cancellation not observed');return true;}});const build=f.service.build(f.session.token,f.id,f.job,{mode:'lossless'}),rejection=assert.rejects(build,error=>error.code==='CANCELED');await started.promise;
 await assert.rejects(f.service.cancel(f.session.token),/Cancellation not observed/);await assert.rejects(f.service.build(f.session.token,f.id,randomUUID(),{mode:'lossless'}),error=>error.code==='BUSY');pending.resolve(output(f.bytes));await rejection;
});
test('batch PDF text converts through the actual parser and FileStore with keep-both collision naming',async t=>{
 const f=await fixture(t),service=new BatchDocumentActions();t.after(()=>service.dispose());service.text.extract=async(token,bytes)=>extractBatchPdfText(bytes);const session=await service.select([f.original]),id=session.sources[0].id,job=randomUUID();await service.destination(session.token,f.root,'Text');
 const result=await service.build(session.token,id,job,{action:'text',name:'source.txt'});assert.match(result.text,/Batch conversion source/);await service.prepareFolder();await fs.writeFile(path.join(f.root,'Text','source.txt'),'existing');await assert.rejects(service.save({saveCopy:async()=>{throw new Error('Text save unavailable');}},session.token,id,job,{sha256:result.sha256}),/Text save unavailable/);assert.equal(service.report(session.token).files[0].error,'Text save unavailable');const store=new FileStore(path.join(f.root,'metadata'));await store.init();
 const saved=await service.save(store,session.token,id,job,{sha256:result.sha256});assert.equal(saved.name,'source (2).txt');assert.equal(await fs.readFile(saved.location,'utf8'),result.text);assert.equal(await fs.readFile(path.join(f.root,'Text','source.txt'),'utf8'),'existing');assert.deepEqual(new Uint8Array(await fs.readFile(f.original)),f.bytes);assert.equal(service.report(session.token).files[0].status,'saved');assert.equal(service.report(session.token).files[0].error,undefined);
});
