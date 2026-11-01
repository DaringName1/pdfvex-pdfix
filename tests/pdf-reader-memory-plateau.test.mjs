import test from 'node:test';import assert from 'node:assert/strict';
import {memoryPlateau,readerProcessFailures,readerSoakLeaseCovers} from './helpers/reader-memory-plateau.mjs';
test('long lease allows command startup but rejects short or old reservations',()=>{
 const started=Date.now(),lock={started:new Date(started).toISOString(),expiresAt:new Date(started+100*60000).toISOString()};
 assert.equal(readerSoakLeaseCovers(lock,90,started+5000),true);
 assert.equal(readerSoakLeaseCovers(lock,90,started+60000),true);
 assert.equal(readerSoakLeaseCovers(lock,90,started+60001),false);
 assert.equal(readerSoakLeaseCovers({...lock,expiresAt:new Date(started+99*60000).toISOString()},90,started),false);
 assert.equal(readerSoakLeaseCovers({},90,started),false);
});
const samples=(fn,n=12)=>Array.from({length:n},(_,i)=>({atMs:(i+1)*6*60000,privateMiB:fn(i)}));
test('warmup followed by a bounded plateau passes',()=>assert.equal(memoryPlateau(samples(i=>i<3?250+i*200:900+(i%2)*8),72*60000).pass,true));
test('steady native/private growth fails',()=>assert.equal(memoryPlateau(samples(i=>400+i*40),72*60000).pass,false));
test('short smooth smoke cannot certify an hour',()=>{const r=memoryPlateau(samples(()=>400),15*60000);assert.equal(r.eligible,false);assert.equal(r.pass,false);});
test('insufficient cycles and invalid or nonmonotonic receipts fail',()=>{assert.equal(memoryPlateau(samples(()=>400,7),72*60000).pass,false);for(const value of [NaN,Infinity,-1]){const s=samples(()=>400);s[5].privateMiB=value;assert.equal(memoryPlateau(s,72*60000).pass,false);}const s=samples(()=>400);s[4].atMs=s[3].atMs;assert.equal(memoryPlateau(s,72*60000).pass,false);});
test('a flat but excessive private-memory floor fails',()=>assert.equal(memoryPlateau(samples(()=>2500),72*60000).pass,false));

test("GPU/renderer crashes cannot establish an apparent memory plateau",()=>{assert.equal(readerProcessFailures([{event:"child-process-gone",type:"GPU",reason:"crashed"}]).length,1);assert.equal(readerProcessFailures([{event:"render-process-gone",reason:"oom"}]).length,1);assert.equal(readerProcessFailures([{event:"did-fail-load"}]).length,1);assert.equal(readerProcessFailures([{event:"child-process-gone",reason:"clean-exit"},{event:"native-response",ok:false}]).length,0);});
test("missing process diagnostics fail closed",()=>assert.equal(readerProcessFailures(undefined).length,1));
