'use strict';
// Extract table: columns are suggested where no word in the table area reaches across (Claude, October 21).
const {test}=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../src/table-extraction-model.js');
const word=(text,left,top,width=.08,height=.02)=>({text,left,top,width,height});
test('three columns separated by empty strips give two breaks in the middle of each strip',async()=>{
 const {suggestedTableColumns,tableEdges}=await load(),region={left:.1,top:.2,right:.9,bottom:.6};
 const words=[];for(const [i,top] of [.25,.3,.35].entries())words.push(word('Part '+i,.12,top,.1),word(String(10+i),.45,top,.05),word('Bracket',.7,top,.12));
 const result=suggestedTableColumns(words,region);assert.equal(result.count,3);const edges=tableEdges(result.cuts,3);
 const left=.1+(edges[1])*.8,right=.1+(edges[2])*.8;assert.ok(left>.22&&left<.45,`first break ${left}`);assert.ok(right>.5&&right<.7,`second break ${right}`);
});
test('a word reaching across two columns joins them; words outside the area are ignored; no words is refused',async()=>{
 const {suggestedTableColumns}=await load(),region={left:.1,top:.2,right:.9,bottom:.6};
 assert.equal(suggestedTableColumns([word('Item',.12,.25,.1),word('Qty',.45,.25,.05),word('A long description',.15,.3,.4)],region).count,1);
 assert.equal(suggestedTableColumns([word('Item',.12,.25,.1),word('Qty',.45,.25,.05),word('Footer',.5,.9,.3)],region).count,2);
 assert.throws(()=>suggestedTableColumns([word('Footer',.5,.9,.3)],region),/No words/);
});
