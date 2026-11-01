import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {build,preview} from 'vite';
import {chromium} from '@playwright/test';
import {PDFDocument,rgb,degrees} from 'pdf-lib';

// Standalone browser codecs and disk writer. No PDFix app, Electron, bridge or shared dist.
const root=fileURLToPath(new URL('../',import.meta.url));
if(!process.argv[2])throw new Error('Usage: node scripts/check-converter-codecs.mjs OUTPUT_PARENT');
const parent=path.resolve(process.argv[2]);await fs.mkdir(parent,{recursive:true});
const output=await fs.mkdtemp(path.join(parent,'converter-codecs-'));
const spec=(file,suffix='')=>JSON.stringify(path.relative(output,path.join(root,file)).split(path.sep).join('/')+suffix);
const doc=await PDFDocument.create();
const page=doc.addPage([72,36]);page.drawRectangle({x:0,y:0,width:36,height:36,color:rgb(1,0,0)});page.drawRectangle({x:36,y:0,width:36,height:36,color:rgb(0,0,1)});
const rotated=doc.addPage([72,36]);rotated.setRotation(degrees(90));rotated.drawRectangle({x:0,y:0,width:72,height:36,color:rgb(0,1,0)});
const fixture=await doc.save();
await fs.writeFile(path.join(output,'index.html'),`<!doctype html><meta charset="utf-8"><title>Standalone converter codec checks</title><script type="module">
import {normalizeImage} from ${spec('src/image-codec.js')};
import {imageFileOutput} from ${spec('src/image-file-output.js')};
import {preparedImage} from ${spec('src/image-adjustments.js')};
import {imagePdf,imagePagesPdf} from ${spec('src/image-output.js')};
import {pdfImageBlobSize,pdfImageEncodedBytes} from ${spec('src/pdf-image-encoding.js')};
import {pdfImagePageLayout} from ${spec('src/pdf-image-export-model.js')};
import * as pdfjs from ${spec('node_modules/pdfjs-dist/build/pdf.mjs')};
import worker from ${spec('node_modules/pdfjs-dist/build/pdf.worker.mjs','?url')};
</script>`);
let html=await fs.readFile(path.join(output,'index.html'),'utf8');
html=html.replace('</script>',`
pdfjs.GlobalWorkerOptions.workerSrc=worker;
const equal=(a,b,label)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Error(label+': '+JSON.stringify(a)+' != '+JSON.stringify(b));};
const check=(condition,label)=>{if(!condition)throw new Error(label);};
const settings={rotation:0,paper:'image',orientation:'auto',margin:0};
const sourcePixels=[255,0,0,255,0,255,0,255,0,0,255,255,0,0,0,0,100,50,200,255,20,40,60,255,10,20,30,255,240,230,220,255];
async function encode(pixels,width,height,type='image/png',quality=1){const c=new OffscreenCanvas(width,height);try{c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(pixels),width,height),0,0);return await c.convertToBlob({type,quality});}finally{c.width=c.height=0;}}
async function pixels(bytes){const bitmap=await createImageBitmap(new Blob([bytes]));const c=new OffscreenCanvas(bitmap.width,bitmap.height);try{c.getContext('2d').drawImage(bitmap,0,0);return {width:bitmap.width,height:bitmap.height,data:Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data)};}finally{bitmap.close();c.width=c.height=0;}}
function bmp(){const width=2,height=2,stride=8,b=new Uint8Array(54+stride*height),v=new DataView(b.buffer);b.set([66,77]);v.setUint32(2,b.length,true);v.setUint32(10,54,true);v.setUint32(14,40,true);v.setInt32(18,width,true);v.setInt32(22,height,true);v.setUint16(26,1,true);v.setUint16(28,24,true);b.set([255,0,0,255,255,255,0,0],54);b.set([0,0,255,0,255,0,0,0],62);return b;}
function exifRotation(jpeg){const segment=new Uint8Array(36),v=new DataView(segment.buffer);segment.set([255,225,0,34,69,120,105,102,0,0,73,73,42,0]);v.setUint32(14,8,true);v.setUint16(18,1,true);v.setUint16(20,274,true);v.setUint16(22,3,true);v.setUint32(24,1,true);v.setUint16(28,6,true);const out=new Uint8Array(jpeg.length+segment.length);out.set(jpeg.slice(0,2));out.set(segment,2);out.set(jpeg.slice(2),2+segment.length);return out;}
const results=[];
async function test(name,action){try{await action();results.push({name,passed:true});}catch(error){results.push({name,passed:false,error:error.message});}}
window.runCodecChecks=async()=>{
 const sourceBytes=new Uint8Array(await (await encode(sourcePixels,4,2)).arrayBuffer()),source={bytes:sourceBytes,width:4,height:2};
 await test('PNG normalization retains exact opaque colors, transparency and source bytes',async()=>{const before=Array.from(sourceBytes),normalized=await normalizeImage(sourceBytes,'png');equal((await pixels(normalized.bytes)).data,sourcePixels,'PNG pixels');equal(Array.from(sourceBytes),before,'source bytes');});
 await test('24-bit BMP bottom-up rows normalize to correct RGB pixels',async()=>{const normalized=await normalizeImage(bmp(),'bmp');equal((await pixels(normalized.bytes)).data,[255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255],'BMP pixels');});
 await test('static WebP normalizes to correctly sized PNG',async()=>{const blob=await encode(sourcePixels,4,2,'image/webp');equal(blob.type,'image/webp','WebP codec');const normalized=await normalizeImage(new Uint8Array(await blob.arrayBuffer()),'webp');equal([normalized.width,normalized.height],[4,2],'WebP dimensions');const decoded=await pixels(normalized.bytes);equal(decoded.data[15],0,'WebP alpha');});
 await test('JPEG EXIF orientation applies exactly one axis swap',async()=>{const jpeg=new Uint8Array(await (await encode(sourcePixels,4,2,'image/jpeg')).arrayBuffer()),normalized=await normalizeImage(exifRotation(jpeg),'jpg');equal([normalized.width,normalized.height],[2,4],'JPEG camera orientation');});
 await test('image rotations retain exact PNG pixel order and alpha',async()=>{const sourceRows=[[0,1,2,3],[4,5,6,7]],expected=[sourceRows,[[4,0],[5,1],[6,2],[7,3]],[[7,6,5,4],[3,2,1,0]],[[3,7],[2,6],[1,5],[0,4]]];for(const [index,rotation]of [0,90,180,270].entries()){const result=await imageFileOutput(source,{...settings,rotation},'png',.85),decoded=await pixels(result.bytes);equal(decoded.data,expected[index].flat().flatMap(i=>sourcePixels.slice(i*4,i*4+4)),'rotation '+rotation);}});
 await test('crop retains exact selected pixels and dimensions',async()=>{const result=await preparedImage(source,{...settings,crop:{left:50,right:0,top:0,bottom:0}});equal([result.width,result.height],[2,2],'crop dimensions');equal((await pixels(result.bytes)).data,[2,3,6,7].flatMap(i=>sourcePixels.slice(i*4,i*4+4)),'crop pixels');});
 await test('brightness changes RGB while retaining PNG alpha',async()=>{const result=await preparedImage(source,{...settings,brightness:100});equal((await pixels(result.bytes)).data,sourcePixels.map((v,i)=>i%4===3?v:Math.min(255,v*2)),'brightness pixels');});
 await test('deskew produces bounded reopened PNG geometry',async()=>{const result=await preparedImage(source,{...settings,deskew:15}),decoded=await pixels(result.bytes);equal([decoded.width,decoded.height],[result.width,result.height],'deskew geometry');equal([result.width,result.height],[5,3],'deskew bounds');});
 await test('JPEG output uses white behind transparency at all supported quality settings',async()=>{const transparent={bytes:new Uint8Array(await (await encode(new Uint8Array(32*16*4),32,16)).arrayBuffer()),width:32,height:16};for(const quality of [.7,.85,.95]){const result=await imageFileOutput(transparent,settings,'jpg',quality),decoded=await pixels(result.bytes);check(decoded.data.every((v,i)=>i%4===3?v===255:v>=250),'JPEG white background '+quality);}});
 await test('image PDF and ordered multi-image PDF reopen in the real PDF worker',async()=>{const single=await imagePdf(source,settings),singleTask=pdfjs.getDocument({data:single.bytes,isEvalSupported:false}),pdf=await singleTask.promise;try{equal(pdf.numPages,1,'single PDF');equal((await pdf.getPage(1)).getViewport({scale:1}).width,3,'single PDF width');}finally{await singleTask.destroy();}const multiple=await imagePagesPdf([source],[{source:0,settings},{source:0,settings:{...settings,rotation:90}}]),multiTask=pdfjs.getDocument({data:multiple.bytes,isEvalSupported:false}),multi=await multiTask.promise;try{equal(multi.numPages,2,'multiple PDF');equal((await multi.getPage(2)).getViewport({scale:1}).width,1.5,'rotated PDF width');}finally{await multiTask.destroy();}});
 await test('PDF pages encode and reopen PNG/JPEG across DPI and intrinsic/view rotations',async()=>{const task=pdfjs.getDocument({url:'./fixture.pdf',isEvalSupported:false}),pdf=await task.promise;try{for(const dpi of [72,144,216,300])for(const rotation of [0,90,180,270])for(const ext of ['png','jpg']){const page=await pdf.getPage(2),layout=pdfImagePageLayout(page,{dpi,rotation}),c=new OffscreenCanvas(layout.width,layout.height);try{await page.render({canvasContext:c.getContext('2d'),viewport:layout.viewport,background:'rgb(255,255,255)'}).promise;const blob=await c.convertToBlob({type:ext==='png'?'image/png':'image/jpeg',quality:.85});pdfImageBlobSize(blob,ext);const bytes=pdfImageEncodedBytes(new Uint8Array(await blob.arrayBuffer()),ext,layout,blob.size),decoded=await pixels(bytes);equal([decoded.width,decoded.height],[layout.width,layout.height],'PDF image size');const center=(Math.floor(decoded.height/2)*decoded.width+Math.floor(decoded.width/2))*4;check(decoded.data[center+1]>=240&&decoded.data[center]<15&&decoded.data[center+2]<15,'PDF artwork color');}finally{c.width=c.height=0;}}}finally{await task.destroy();}});
 return results;
};
</script>`);
await fs.writeFile(path.join(output,'index.html'),html);
let server,browser;const report={kind:'PDFix.StandaloneConverterCodecs.v1',scope:'Standalone headless browser image/PDF codecs and real image-copy disk writer; no app UI, Electron or native bridge.',output,checks:[]};
try{
 await build({root:output,configFile:false,logLevel:'warn',build:{target:'es2022',outDir:path.join(output,'dist')}});
 await fs.writeFile(path.join(output,'dist','fixture.pdf'),fixture);
 server=await preview({root:output,configFile:false,logLevel:'warn',build:{outDir:path.join(output,'dist')},preview:{host:'127.0.0.1',port:0}});
 const executable=process.env.PDFIX_TEST_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
 browser=await chromium.launch({executablePath:executable,headless:true});const tab=await browser.newPage();
 await tab.goto(server.resolvedUrls.local[0]);await tab.waitForFunction(()=>typeof window.runCodecChecks==='function');
 report.checks=await tab.evaluate(()=>window.runCodecChecks());
 const {writeImageCopies}=createRequire(import.meta.url)('../desktop/image-export-writer.cjs');
 for(const ext of ['png','jpg']){
  const bytes=await tab.evaluate(async ext=>{
   const canvas=new OffscreenCanvas(16,8);try{const context=canvas.getContext('2d');context.fillStyle='#00ff00';context.fillRect(0,0,16,8);const blob=await canvas.convertToBlob({type:ext==='png'?'image/png':'image/jpeg',quality:.85});return Array.from(new Uint8Array(await blob.arrayBuffer()));}finally{canvas.width=canvas.height=0;}
  },ext),part={page:1,width:16,height:8,bytes:new Uint8Array(bytes)};
  const receipt=await writeImageCopies(output,'verified-'+ext,[part],ext),saved=await fs.readFile(path.join(receipt.location,receipt.files[0].name));
  if(!saved.equals(Buffer.from(bytes)))throw new Error('Disk output differs from the encoded '+ext+' bytes.');
  report.checks.push({name:'Actual browser '+ext.toUpperCase()+' output saved and read back with exact bytes',passed:true});
 }
 report.passed=report.checks.filter(check=>check.passed).length;report.failed=report.checks.length-report.passed;
}catch(error){report.error=error.message;process.exitCode=1;}finally{await browser?.close();await server?.close();await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
