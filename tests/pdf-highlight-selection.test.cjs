const {test}=require('node:test'),assert=require('node:assert/strict');
test('word highlighting accepts a thin sweep across the glyphs, while rectangle copying retains center selection',async()=>{
 const {insideSelection,intersectsSelection}=await import('../src/pdf-selection.js');
 const word={left:20,top:20,width:80,height:24},sweep={left:30,right:95,top:21,bottom:23};
 assert.equal(insideSelection(word,sweep),false);assert.equal(intersectsSelection(word,sweep),true);
 assert.equal(intersectsSelection(word,{left:101,right:120,top:21,bottom:23}),false);
 assert.equal(intersectsSelection(word,{left:30,right:95,top:45,bottom:48}),false);
 assert.equal(intersectsSelection(word,{left:100,right:120,top:20,bottom:44}),false);
});
