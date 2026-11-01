const {test}=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const read=import('../src/pdf-search-paged.js');
const metadata={pageCount:501,sourceSha256:'a'.repeat(64)};
function result(){const bytes=Uint8Array.of(1,2,3);return {bytes,page:501,...metadata,sha256:createHash('sha256').update(bytes).digest('hex')};}
test('bounded search extraction verifies identity/hash and disposes its worker',async()=>{
  const {extractedPageSearchText}=await read;let destroyed=0,opened=0;
  const pdfjs={getDocument(){opened++;return {promise:Promise.resolve({numPages:1,getPage:async()=>({getTextContent:async()=>({items:[{str:'split'},{str:'word',hasEOL:true},{str:'next'}]})})}),destroy:async()=>{destroyed++;}};}};
  assert.equal(await extractedPageSearchText(result(),metadata,501,pdfjs,{}),'splitword\nnext');assert.equal(opened,1);assert.equal(destroyed,1);
  for(const bad of [{...result(),page:500},{...result(),sourceSha256:'b'.repeat(64)},{...result(),sha256:'0'.repeat(64)},{...result(),bytes:new Uint8Array()}])await assert.rejects(extractedPageSearchText(bad,metadata,501,pdfjs,{}),/identity|integrity/);
  assert.equal(opened,1);
});
test('cancellation and failed/oversized text never retain a disposable search worker',async()=>{
  const {extractedPageSearchText}=await read;
  for(const mode of ['abort','pages','oversized','error']){
    const controller=new AbortController();let destroyed=0;
    const pdfjs={getDocument(){return {promise:Promise.resolve({numPages:mode==='pages'?2:1,getPage:async()=>({getTextContent:async()=>{if(mode==='abort')controller.abort();if(mode==='error')throw new Error('worker failed');return {items:[{str:mode==='oversized'?'x'.repeat(2*1024*1024+1):'late'}]};}})}),destroy:async()=>{destroyed++;}};}};
    await assert.rejects(extractedPageSearchText(result(),metadata,501,pdfjs,{}, {signal:controller.signal}));assert.ok(destroyed>=1,mode);
  }
  const controller=new AbortController();controller.abort();await assert.rejects(extractedPageSearchText(result(),metadata,501,{getDocument(){assert.fail('Canceled extraction started a worker');}},{},{signal:controller.signal}),{code:'CANCELED'});
});
