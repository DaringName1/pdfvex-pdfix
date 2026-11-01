const {test}=require('node:test'),assert=require('node:assert/strict');
test('only a whole original permutation enters the preserving page-copy route',async()=>{
 const {preservingPermutation:p}=await import('../src/page-preserving-copy.js');
 const sources=[{file:{id:'frozen-source'},info:{pages:[{},{}]}}],plan=[{source:0,index:1,turn:0},{source:0,index:0,turn:0}];
 assert.deepEqual(p(sources,plan),[2,1]);
 for(const changed of [[plan[0]], [plan[0],plan[0]], [{...plan[0],turn:90},plan[1]], [{...plan[0],crop:{top:1}},plan[1]], [{...plan[0],resize:{paper:'a4'}},plan[1]], [{...plan[0],source:1},plan[1]], [{...plan[0],index:-1},plan[1]]])assert.equal(p(sources,changed),null);
 assert.equal(p([...sources,...sources],plan),null);assert.equal(p([{...sources[0],file:{id:null}}],plan),null);
});
