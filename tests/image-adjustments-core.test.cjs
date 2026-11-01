const {test}=require('node:test'),assert=require('node:assert/strict');
const UPNG=require('@pdf-lib/upng').default;
const codec=import('../src/image-adjustments.js');
const settings={rotation:0,paper:'a4',orientation:'auto',margin:10,brightness:10};
const png=(width=2,height=1)=>new Uint8Array(UPNG.encode([new Uint8Array(width*height*4).fill(128).buffer],width,height,0));
function backend(t,{mime='image/png',encodedWidth=2,fail=false,noContext=false}={}){
 const saved=['createImageBitmap','OffscreenCanvas'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]),state={closed:0,canvas:null};
 globalThis.createImageBitmap=async()=>({width:2,height:1,close(){state.closed++;}});
 globalThis.OffscreenCanvas=class{
  constructor(width,height){this.width=width;this.height=height;state.canvas=this;}
  getContext(){return noContext?null:{translate(){},rotate(){},drawImage(){},setTransform(){},getImageData(){return {data:new Uint8ClampedArray(8)};},putImageData(){}};}
  async convertToBlob(){if(fail)throw new Error('Encoder failed');return new Blob([png(encodedWidth)],{type:mime});}
 };
 t.after(()=>{for(const [key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});return state;
}
function released(state){assert.equal(state.closed,1);assert.equal(state.canvas.width,0);assert.equal(state.canvas.height,0);}
test('edited image validates the PNG and releases its bitmap and canvas',async t=>{
 const {preparedImage}=await codec,state=backend(t),bytes=png(),original=bytes.slice();
 const result=await preparedImage({bytes,width:2,height:1},settings);
 assert.equal(result.width,2);assert.equal(result.height,1);assert.deepEqual(bytes,original);released(state);
});
test('edited image rejects incorrect MIME and dimensions',async t=>{
 const {preparedImage}=await codec;
 await t.test('MIME',async t=>{const state=backend(t,{mime:'image/jpeg'});await assert.rejects(preparedImage({bytes:png(),width:2,height:1},settings),/encode.*PNG/);released(state);});
 await t.test('dimensions',async t=>{const state=backend(t,{encodedWidth:3});await assert.rejects(preparedImage({bytes:png(),width:2,height:1},settings),/dimensions changed during editing/);released(state);});
});
test('canvas and bitmap are released after encoder or context failure',async t=>{
 const {preparedImage}=await codec;
 await t.test('encoder',async t=>{const state=backend(t,{fail:true});await assert.rejects(preparedImage({bytes:png(),width:2,height:1},settings),/Encoder failed/);released(state);});
 await t.test('context',async t=>{const state=backend(t,{noContext:true});await assert.rejects(preparedImage({bytes:png(),width:2,height:1},settings),/editing canvas/);released(state);});
});
test('brightness and contrast modify RGB while preserving alpha',async()=>{
 const {applyImageAdjustments}=await codec,data=new Uint8ClampedArray([0,128,255,0,32,64,192,127]),alpha=[data[3],data[7]];
 let written;
 applyImageAdjustments({getImageData(){return {data};},putImageData(pixels){written=pixels.data;}},2,1,{...settings,brightness:100,contrast:0});
 assert.deepEqual(Array.from(written),[0,255,255,alpha[0],64,128,255,alpha[1]]);
});
