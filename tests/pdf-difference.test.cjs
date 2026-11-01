const test=require('node:test'),assert=require('node:assert/strict');
test('literal word differences preserve both versions including whitespace, Unicode and script-shaped text',async()=>{
  const {textChanges}=await import('../src/pdf-difference.js');
  for(const [before,after]of [['Amount: 5,000 USD','Amount: 6,000 USD'],['same words\nnext line','same words next line'],['猫 café','猫 résumé <script>alert(1)</script>'],['','a'],['a',''],['unchanged','unchanged']]){
    const result=textChanges(before,after);assert.equal(result.parts.filter(p=>p.kind!=='added').map(p=>p.text).join(''),before);assert.equal(result.parts.filter(p=>p.kind!=='removed').map(p=>p.text).join(''),after);assert.equal(result.changed,before!==after);
  }
  const huge=textChanges('a'.repeat(100001),'small');assert.match(huge.unavailable,/too much text/);assert.equal(huge.parts.length,0);
  const coarse=textChanges(Array(1000).fill('before').join(' '),Array(1000).fill('after').join(' '));assert.equal(coarse.coarse,true);assert.equal(coarse.parts.filter(p=>p.kind==='removed').map(p=>p.text).join(''),Array(1000).fill('before').join(' '));
});
test('artwork comparison ignores small raster noise, flags a changed pixel and rejects unbounded dimensions',async()=>{
  const {pixelChanges}=await import('../src/pdf-difference.js');const a=new Uint8ClampedArray([255,255,255,255,0,0,0,255]);
  assert.equal(pixelChanges(a,a,2,1).changed,0);const b=a.slice();b[0]=240;assert.equal(pixelChanges(a,b,2,1).changed,0);b[1]=0;const difference=pixelChanges(a,b,2,1);assert.equal(difference.changed,1);assert.equal(difference.fraction,.5);assert.deepEqual([...difference.pixels.subarray(0,4)],[226,70,114,255]);
  assert.throws(()=>pixelChanges(a,b,1000,1000),/pixel limit/);assert.throws(()=>pixelChanges(a,b,3,1),/pixel limit/);
});
