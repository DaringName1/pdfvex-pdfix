const {test}=require('node:test');
const assert=require('node:assert/strict');
const sequence=import('../src/pdf-readable-sequence.js');

test('readable content preserves split words and actual PDF whitespace',async()=>{
  const {pdfReadableSequence}=await sequence;
  const items=[{str:'main'},{str:'tenance'},{str:' '},{str:'re'},{str:'view',hasEOL:true},{str:'Next\tline'}];
  const result=pdfReadableSequence({items});
  assert.deepEqual(result.output,['maintenance review','Next\tline']);
  assert.deepEqual(result.items,items);
  assert.deepEqual(result.sourceRuns,[[0,1,2,3,4],[5]]);
  for(let index=0;index<result.output.length;index++)for(const fragment of result.sourceFragments[index])assert.equal(result.output[index].slice(fragment.start,fragment.start+fragment.text.length),fragment.text);
});

test('source fragments retain exact paragraph offsets after trimming and Unicode text',async()=>{
 const {pdfReadableSequence}=await sequence;
 const result=pdfReadableSequence({items:[{str:'  İ😀'},{str:'\t repeated repeated  ',hasEOL:true}]});
 assert.deepEqual(result.output,['İ😀\t repeated repeated']);
 assert.deepEqual(result.sourceFragments,[[{run:0,start:0,text:'İ😀'},{run:1,start:3,text:'\t repeated repeated'}]]);
});

test('empty line-ending items break paragraphs without joining source lines',async()=>{
  const {pdfReadableSequence}=await sequence;
  const result=pdfReadableSequence({items:[{str:'first'},{str:'',hasEOL:true},{str:'second'},{type:'beginMarkedContent'},{str:' ',hasEOL:true},{str:'',hasEOL:true}]});
  assert.deepEqual(result.output,['first','second']);
  assert.deepEqual(result.sourceRuns,[[0,1],[2,3]]);
});

test('whitespace-only input consumes the readable-view budget',async()=>{
  const {pdfReadableSequence}=await sequence;
  assert.throws(()=>pdfReadableSequence({items:[{str:' '.repeat(200001)}]}),/budget/);
  assert.throws(()=>pdfReadableSequence({items:Array.from({length:20001},()=>({str:''}))}),/budget/);
  assert.deepEqual(pdfReadableSequence({items:[{str:' ',hasEOL:true}]}).output,[]);
  assert.throws(()=>pdfReadableSequence(null),/unavailable/);
});
