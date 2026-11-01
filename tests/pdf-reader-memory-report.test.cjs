const {test}=require('node:test');
const assert=require('node:assert/strict');
const helper=import('../scripts/check-reader-memory-report.mjs');

function fixture(){return {pass:true,closed:true,exit:{code:0},originalUnchanged:true,inputCopiesUnchanged:true,largeOriginalUnchanged:true,memory:{elapsedMs:2000,scope:'Natural memory sampling',samples:[{label:'Home baseline',elapsedMs:0,processes:[{type:'Browser',pid:42,privateKiB:1024},{type:'Tab',pid:43,privateKiB:2048}],heap:{JSHeapUsedSize:1048576}},{label:'Home settled',elapsedMs:2000,processes:[{type:'Browser',pid:42,privateKiB:2048},{type:'Tab',pid:43,privateKiB:3072}]}],navigation:[{navigationMs:20,heartbeatExtraMs:1},{navigationMs:100,heartbeatExtraMs:3}]}};}
test('natural receipt separates process totals, renderer heap, navigation and independent Windows tree',async()=>{
  const {summarizeMemory}=await helper;
  const summary=summarizeMemory(fixture(),{rootPid:42,closed:true,samples:[{totalPrivateBytes:8*1048576}]});
  assert.equal(summary.completed,true);assert.equal(summary.inputIntegrityVerified,true);
  assert.deepEqual(summary.electronPrivateMiB,{baseline:3,peak:5,last:5});
  assert.equal(summary.homeSamples[1].rendererHeapMiB,null);
  assert.deepEqual(summary.navigation,{count:2,p50Ms:20,p95Ms:100,maxMs:100,maxHeartbeatExtraMs:3});
  assert.equal(summary.windowsProcessTree.peakPrivateMiB,8);assert.equal(summary.windowsProcessTree.exitObserved,true);
});
test('interrupted or failed sessions never establish completion or final input integrity',async()=>{
  const {summarizeMemory}=await helper;
  for(const change of [{closed:false},{pass:false},{exit:{code:1}},{memory:{...fixture().memory,elapsedMs:undefined}}]){
    const summary=summarizeMemory({...fixture(),...change});assert.equal(summary.completed,false);assert.equal(summary.inputIntegrityVerified,false);
  }
  const missing=fixture();delete missing.largeOriginalUnchanged;assert.equal(summarizeMemory(missing).inputIntegrityVerified,false);
});
test('missing or unordered samples and a sampler for another PID are rejected',async()=>{
  const {summarizeMemory}=await helper;
  const missing=fixture();delete missing.memory.samples[0].processes[0].privateKiB;assert.throws(()=>summarizeMemory(missing),/measurement is missing/);
  const unordered=fixture();unordered.memory.samples.reverse();assert.throws(()=>summarizeMemory(unordered),/ordered elapsed/);
  assert.throws(()=>summarizeMemory(fixture(),{rootPid:99,samples:[]}),/another app process/);
});
