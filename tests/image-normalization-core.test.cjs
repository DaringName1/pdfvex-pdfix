const {test}=require('node:test'),assert=require('node:assert/strict'),UPNG=require('@pdf-lib/upng').default;
const codec=import('../src/image-codec.js');
const png=(w=2,h=1)=>new Uint8Array(UPNG.encode([new Uint8Array(w*h*4).buffer],w,h,0));
function backend(t,{width=2,height=1,encodedWidth=width,encodedHeight=height,mime='image/png',fail=false}={}){
 const saved=['createImageBitmap','OffscreenCanvas'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]),state={closed:0,canvas:null};
 globalThis.createImageBitmap=async(blob,options)=>{state.options=options;return {width,height,close(){state.closed++;}};};
 globalThis.OffscreenCanvas=class{constructor(w,h){this.width=w;this.height=h;state.canvas=this;}getContext(){return {drawImage(){}};}async convertToBlob(){if(fail)throw Object.assign(new Error('failed'),{name:'EncodingError'});return new Blob([png(encodedWidth,encodedHeight)],{type:mime});}};
 t.after(()=>{for(const [key,value]of saved){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}});return state;
}
test('image normalization accepts oriented axis swaps and preserves source bytes',async t=>{
 const {normalizeImage}=await codec,state=backend(t,{width:1,height:2}),bytes=png(),original=bytes.slice(),result=await normalizeImage(bytes,'png');
 assert.deepEqual([result.width,result.height],[1,2]);assert.deepEqual(bytes,original);assert.deepEqual(state.options,{imageOrientation:'from-image',colorSpaceConversion:'default'});assert.equal(state.closed,1);assert.equal(state.canvas.width,0);
});
test('image normalization rejects unexpected dimensions before allocation',async t=>{
 const {normalizeImage}=await codec,state=backend(t,{width:3});await assert.rejects(normalizeImage(png(),'png'),/dimensions differ/);assert.equal(state.canvas,null);assert.equal(state.closed,1);
});
test('image normalization rejects invalid decoded geometry',async t=>{
 const {normalizeImage}=await codec,state=backend(t,{width:0});await assert.rejects(normalizeImage(png(),'png'),/pixel limit/);assert.equal(state.canvas,null);assert.equal(state.closed,1);
});
test('image normalization rejects wrong encoder format and geometry',async t=>{
 const {normalizeImage}=await codec;
 await t.test('format',async t=>{const state=backend(t,{mime:'image/jpeg'});await assert.rejects(normalizeImage(png(),'png'),/normalize.*PNG/);assert.equal(state.closed,1);assert.equal(state.canvas.height,0);});
 await t.test('geometry',async t=>{const state=backend(t,{encodedWidth:3});await assert.rejects(normalizeImage(png(),'png'),/changed during encoding/);assert.equal(state.closed,1);assert.equal(state.canvas.height,0);});
});
test('image normalization translates encoding failures and releases allocations',async t=>{
 const {normalizeImage}=await codec,state=backend(t,{fail:true});await assert.rejects(normalizeImage(png(),'png'),/could not be read/);assert.equal(state.closed,1);assert.equal(state.canvas.width,0);
});
