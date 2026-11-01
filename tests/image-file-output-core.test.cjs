const {test}=require('node:test'),assert=require('node:assert/strict');
const UPNG=require('@pdf-lib/upng').default;
const codec=import('../src/image-file-output.js');
const settings={rotation:0,paper:'a4',orientation:'auto',margin:10};
const png=(width=2,height=1)=>new Uint8Array(UPNG.encode([new Uint8Array(width*height*4).fill(128).buffer],width,height,0));
function backend(t,{decodedWidth=2,decodedHeight=1,encodedWidth=2,encodedHeight=1,mime='image/png'}={}){
 const oldBitmap=Object.getOwnPropertyDescriptor(globalThis,'createImageBitmap'),oldCanvas=Object.getOwnPropertyDescriptor(globalThis,'OffscreenCanvas'),state={closed:0,canvases:0};
 globalThis.createImageBitmap=async()=>({width:decodedWidth,height:decodedHeight,close(){state.closed++;}});
 globalThis.OffscreenCanvas=class{constructor(width,height){state.canvases++;this.width=width;this.height=height;state.canvas=this;}getContext(){return {fillRect(){},translate(){},rotate(){},drawImage(){}};}async convertToBlob(){return new Blob([png(encodedWidth,encodedHeight)],{type:mime});}};
 t.after(()=>{if(oldBitmap)Object.defineProperty(globalThis,'createImageBitmap',oldBitmap);else delete globalThis.createImageBitmap;if(oldCanvas)Object.defineProperty(globalThis,'OffscreenCanvas',oldCanvas);else delete globalThis.OffscreenCanvas;});return state;
}
test('edited PNG export returns matching header geometry and preserves its source bytes',async t=>{
 const {imageFileOutput}=await codec,state=backend(t),bytes=png(),before=bytes.slice();
 const result=await imageFileOutput({bytes,width:2,height:1},settings,'png',.85);
 assert.equal(result.ext,'png');assert.equal(result.width,2);assert.equal(result.height,1);assert.deepEqual(bytes,before);assert.equal(state.closed,1);assert.equal(state.canvas.width,0);assert.equal(state.canvas.height,0);
});
test('a decoder dimension mismatch is rejected before canvas allocation',async t=>{
 const {imageFileOutput}=await codec,state=backend(t,{decodedWidth:3});
 await assert.rejects(imageFileOutput({bytes:png(),width:2,height:1},settings,'png',.85),/decoded image dimensions/);assert.equal(state.canvases,0);assert.equal(state.closed,1);
});
test('JPEG encoder fallback to PNG is refused instead of labeling it as JPEG',async t=>{
 const {imageFileOutput}=await codec,state=backend(t,{mime:'image/png'});
 await assert.rejects(imageFileOutput({bytes:png(),width:2,height:1},settings,'jpg',.85),/could not encode JPEG/);assert.equal(state.closed,1);
});
test('an encoder dimension mismatch is rejected and the bitmap is released',async t=>{
 const {imageFileOutput}=await codec,state=backend(t,{encodedWidth:3});
 await assert.rejects(imageFileOutput({bytes:png(),width:2,height:1},settings,'png',.85),/encoded image dimensions/);assert.equal(state.closed,1);assert.equal(state.canvas.width,0);assert.equal(state.canvas.height,0);
});
