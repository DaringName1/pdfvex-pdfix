const {test}=require('node:test'),assert=require('node:assert/strict');const helpers=import('../src/markup-pointer.js'),model=import('../src/markup-model.js');
test('drawing input modes distinguish pen mouse and touch without accepting unknown modes',async()=>{const {markupPointerAllowed}=await helpers;for(const type of ['pen','mouse','touch']){assert.equal(markupPointerAllowed('pen',{pointerType:type}),type==='pen');assert.equal(markupPointerAllowed('touch',{pointerType:type}),type==='touch');assert.equal(markupPointerAllowed('pen-mouse',{pointerType:type}),type!=='touch');}assert.equal(markupPointerAllowed('unknown',{pointerType:'pen'}),false);});
test('moving ink preserves identity and source geometry; normal validation refuses outside movement',async()=>{const {translateMarkup}=await helpers,{validateMarks}=await model,mark={id:'pdfix-12345678-1234-4234-8234-123456789012',kind:'ink',page:0,color:'blue',text:'Stroke',rotation:90,fontSize:12,rect:[10,10,50,50],path:[12,12,30,30,48,48]},before=structuredClone(mark),moved=translateMarkup(mark,15,20);assert.deepEqual(moved.path,[27,32,45,50,63,68]);assert.deepEqual(moved.rect,[25,30,65,70]);assert.equal(moved.id,mark.id);assert.deepEqual(mark,before);assert.equal(validateMarks([moved],[{box:[0,0,100,100]}]).length,1);assert.throws(()=>validateMarks([translateMarkup(mark,200,0)],[{box:[0,0,100,100]}]),/boundary/);assert.throws(()=>translateMarkup(mark,Infinity,0),/finite/);});
test('moving a text highlight or callout translates every coordinate field together',async()=>{const {translateMarkup}=await helpers;const mark={rect:[10,20,30,40],quads:[10,40,30,40,10,20,30,20],path:[10,20,20,30,30,40],textRect:[20,25,30,40]};const shifted=translateMarkup(mark,-5,7);assert.deepEqual(shifted.quads,[5,47,25,47,5,27,25,27]);assert.deepEqual(shifted.path,[5,27,15,37,25,47]);assert.deepEqual(shifted.textRect,[15,32,25,47]);});

test('ink picking follows visible segments rather than rectangles and honors page, zoom, rotation and ties',async()=>{
 const {nearestInkStroke}=await helpers;
 const first={id:'first',kind:'ink',page:0,path:[0,0,100,0,100,100]},second={id:'second',kind:'ink',page:0,path:[0,0,100,0]},foreign={id:'foreign',kind:'line',page:0,path:[0,0,100,0]},other={id:'other-page',kind:'ink',page:1,path:[0,0,100,0]},convert=(x,y)=>[200-y*2,50+x*2];
 assert.equal(nearestInkStroke([first,second,foreign,other],0,{x:195,y:150},convert).id,'second');
 assert.equal(nearestInkStroke([first,second],0,{x:100,y:150},convert),null);
 assert.equal(nearestInkStroke([first],0,{x:150,y:247},convert).id,'first');
 assert.equal(nearestInkStroke([other],0,{x:200,y:150},convert),null);
 const dot={id:'dot',kind:'ink',page:0,path:[10,10,10,10]};assert.equal(nearestInkStroke([dot],0,{x:180,y:70},convert).id,'dot');
});

test('thick ink remains selectable at its visible edge when zoomed',async()=>{
 const {nearestInkStroke}=await helpers,stroke={kind:'ink',page:0,path:[10,10,100,10],inkWidth:12},convert=(x,y)=>[x*4,y*4];assert.equal(nearestInkStroke([stroke],0,{x:200,y:62},convert),stroke);assert.equal(nearestInkStroke([stroke],0,{x:200,y:68},convert),null);
});

test('markup maps scaled screen bounds to viewport units, clamps edges and rejects unavailable geometry',async()=>{
 const {markupViewportPoint}=await helpers,viewport={width:400,height:600},box={left:20,top:30,width:300,height:360};
 assert.deepEqual(markupViewportPoint({clientX:170,clientY:210},box,viewport),{x:200,y:300});
 assert.deepEqual(markupViewportPoint({clientX:0,clientY:500},box,viewport),{x:0,y:600});
 assert.deepEqual(markupViewportPoint({clientX:420,clientY:630},{...box,width:800,height:1200},viewport),{x:200,y:300});
 assert.throws(()=>markupViewportPoint({clientX:20,clientY:30},{...box,width:0},viewport),/not ready/);
 assert.throws(()=>markupViewportPoint({clientX:NaN,clientY:30},box,viewport),/not ready/);
});