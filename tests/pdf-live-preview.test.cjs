const {test}=require('node:test'),assert=require('node:assert/strict');
test('live preview debounces edits, waits for active work and cancels on departure',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const {PdfLivePreview}=await import('../src/pdf-live-preview.js');
 const owner={busy:false},calls=[],live=new PdfLivePreview(owner,()=>calls.push('latest'));
 live.schedule();t.mock.timers.tick(200);live.schedule();t.mock.timers.tick(349);await Promise.resolve();assert.equal(calls.length,0);
 t.mock.timers.tick(1);await Promise.resolve();assert.equal(calls.length,1);
 owner.busy=true;live.schedule();t.mock.timers.tick(350);await Promise.resolve();assert.equal(calls.length,1);
 owner.busy=false;t.mock.timers.tick(200);await Promise.resolve();assert.equal(calls.length,2);
 live.schedule();live.cancel();t.mock.timers.tick(1000);await Promise.resolve();assert.equal(calls.length,2);
 live.schedule();owner.closed=true;t.mock.timers.tick(1000);await Promise.resolve();assert.equal(calls.length,2);
});
