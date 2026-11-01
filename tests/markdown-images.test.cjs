const {test}=require('node:test');const assert=require('node:assert/strict');
test('prepared Markdown images become pictures; others stay labels with a count',async()=>{
  const {markdownDocument,markdownImageTargets}=await import('../src/source-to-document.js');
  const source=['# Report','','Before ![site photo](photos/site.png "Site") after.','','- item ![web](https://example.com/x.png)','','| A |','|---|','| ![cell](photos/site.png) |',''].join('\n');
  assert.deepEqual(markdownImageTargets(source),['photos/site.png','https://example.com/x.png']);
  const attrs={src:'data:image/png;base64,iVBORw0KGgo=',alt:'',width:120,height:90,pixelWidth:120,pixelHeight:90};
  const {doc,notes}=markdownDocument(source,{images:new Map([['photos/site.png',attrs]])}),nodes=JSON.stringify(doc);
  assert.equal((nodes.match(/documentImage/g)||[]).length,2);assert.ok(nodes.includes('"alt":"site photo"'));assert.ok(nodes.includes('"text":"Before "'));assert.ok(nodes.includes('[Image: web]'));
  assert.ok(notes.some(note=>/1 image stayed a text label/.test(note)),notes.join(' | '));
  const many=Array.from({length:25},(_,i)=>'![x](p'+i+'.png)').join(' ');assert.equal(markdownImageTargets(many).length,20);
});
