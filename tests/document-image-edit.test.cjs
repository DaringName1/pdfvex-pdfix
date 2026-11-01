const {test}=require('node:test'),assert=require('node:assert/strict');
const {sourceHeader,SOURCE_TYPES}=require('../desktop/document-image-validation.cjs');
const codec=import('../src/document-image-codec.js');
// Pictures inserted as GIF, BMP or WebP: the size comes from the header before any decoding, within the same limits.
const gif=(w,h)=>{const b=new Uint8Array(40);b.set([...'GIF89a'].map(c=>c.charCodeAt(0)));new DataView(b.buffer).setUint16(6,w,true);new DataView(b.buffer).setUint16(8,h,true);return b;};
const bmp=(w,h)=>{const b=new Uint8Array(60),d=new DataView(b.buffer);b[0]=66;b[1]=77;d.setUint32(14,40,true);d.setInt32(18,w,true);d.setInt32(22,h,true);return b;};
const webp=(chunk,fill)=>{const b=new Uint8Array(40);b.set([...'RIFF'].map(c=>c.charCodeAt(0)));b.set([...'WEBP'].map(c=>c.charCodeAt(0)),8);b.set([...chunk].map(c=>c.charCodeAt(0)),12);fill(b,new DataView(b.buffer));return b;};
test('GIF, BMP and WebP picture sizes are read from their headers',()=>{
 assert.deepEqual(SOURCE_TYPES,['image/png','image/jpeg','image/gif','image/bmp','image/webp']);
 assert.deepEqual(sourceHeader(gif(640,480),'image/gif'),{width:640,height:480});
 assert.deepEqual(sourceHeader(bmp(300,-200),'image/bmp'),{width:300,height:200});
 assert.deepEqual(sourceHeader(webp('VP8 ',(b,d)=>{b.set([0x9d,0x01,0x2a],23);d.setUint16(26,800,true);d.setUint16(28,600,true);}),'image/webp'),{width:800,height:600});
 assert.deepEqual(sourceHeader(webp('VP8L',b=>{b[20]=0x2f;const w=99,h=49,bits=w|(h<<14);b[21]=bits&255;b[22]=bits>>8&255;b[23]=bits>>16&255;b[24]=bits>>24&255;}),'image/webp'),{width:100,height:50});
 assert.deepEqual(sourceHeader(webp('VP8X',b=>{b[24]=0x1f;b[25]=0x03;b[27]=0xef;b[28]=0x01;}),'image/webp'),{width:800,height:496});
});
test('damaged, oversized and animated pictures are refused before decoding',()=>{
 assert.throws(()=>sourceHeader(gif(0,10),'image/gif'),/PNG, JPEG, GIF, BMP or WebP picture/);
 assert.throws(()=>sourceHeader(gif(20000,10),'image/gif'),/up to 40 MB and 60 million pixels/);
 assert.throws(()=>sourceHeader(bmp(10000,10000),'image/bmp'),/60 million pixels/);
 assert.throws(()=>sourceHeader(new Uint8Array(40),'image/bmp'),/WebP picture/);
 assert.throws(()=>sourceHeader(webp('VP8X',b=>{b[20]=0x02;}),'image/webp'),/Animated WebP/);
 assert.throws(()=>sourceHeader(gif(10,10),'image/tiff'),/WebP picture/);
});
test('picture changes turn by quarter turns and always keep part of the picture',async()=>{
 const {imageEdit}=await codec;
 assert.deepEqual(imageEdit(null),{rotate:0,crop:{left:0,top:0,right:0,bottom:0}});
 assert.deepEqual(imageEdit({rotate:90}),{rotate:90,crop:{left:0,top:0,right:0,bottom:0}});
 assert.deepEqual(imageEdit({crop:{left:.1,top:0,right:.2,bottom:.3}}).crop,{left:.1,top:0,right:.2,bottom:.3});
 for(const bad of [{rotate:45},{rotate:'90'},{crop:{left:.5,right:.5,top:0,bottom:0}},{crop:{left:-.1,right:0,top:0,bottom:0}},{crop:{left:0,right:0,top:0,bottom:0,extra:1}},{crop:{left:NaN,right:0,top:0,bottom:0}},'turn'])assert.throws(()=>imageEdit(bad));
});
test('turning a picture swaps its sides and cropping keeps the chosen part, drawn from the right source pixels',async t=>{
 const {normalizeDocumentImage}=await codec,UPNG=require('@pdf-lib/upng').default,png=(w,h)=>new Uint8Array(UPNG.encode([new Uint8Array(w*h*4).buffer],w,h,0));
 const saved=['createImageBitmap','OffscreenCanvas'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]),draws=[];let last;
 globalThis.createImageBitmap=async()=>({width:400,height:200,close(){}});
 globalThis.OffscreenCanvas=class{constructor(w,h){this.width=w;this.height=h;last=this;}getContext(){return {setTransform(){},translate(){},rotate(a){draws.push(['rotate',Math.round(a*180/Math.PI)]);},drawImage(...a){draws.push(['draw',...a.slice(1)]);}};}async convertToBlob(){return new Blob([png(last.width,last.height)],{type:'image/png'});}};
 t.after(()=>{for(const [key,value] of saved){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}});
 const turned=await normalizeDocumentImage(png(400,200),'image/png','',{rotate:90});assert.deepEqual([turned.attrs.pixelWidth,turned.attrs.pixelHeight],[200,400]);assert.deepEqual(draws.slice(0,2),[['rotate',90],['draw',0,0,400,200,-200,-100,400,200]]);
 draws.length=0;const cropped=await normalizeDocumentImage(png(400,200),'image/png','',{crop:{left:.25,top:.1,right:.25,bottom:.4}});assert.deepEqual([cropped.attrs.pixelWidth,cropped.attrs.pixelHeight],[200,100]);assert.deepEqual(draws[1],['draw',100,20,200,100,-100,-50,200,100]);assert.equal(cropped.notice,'');
});
