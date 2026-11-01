const {test}=require('node:test');
const assert=require('node:assert/strict');
const {PDFDocument,PDFName,PDFDict,PDFRawStream,PDFArray,decodePDFRawStream}=require('pdf-lib');
const UPNG=require('@pdf-lib/upng').default;
const output=import('../src/image-output.js');
const settings=(extra={})=>({rotation:0,paper:'a4',orientation:'auto',margin:10,...extra});
function image(width=2,height=1){
 const rgba=new Uint8Array(width*height*4);for(let n=0;n<rgba.length;n+=4)rgba.set([255,n?200:0,50,n?128:255],n);
 return {bytes:new Uint8Array(UPNG.encode([rgba.buffer],width,height,0)),width,height};
}
function asset(doc,page){const objects=page.node.lookup(PDFName.of('Resources'),PDFDict).lookup(PDFName.of('XObject'),PDFDict);return objects.entries().map(([,ref])=>({ref,stream:doc.context.lookup(ref,PDFRawStream)})).find(({stream})=>stream.dict.get(PDFName.of('Subtype'))?.toString()==='/Image');}
function imageCorners(doc,page){
 const contents=page.node.lookup(PDFName.of('Contents')),streams=contents instanceof PDFArray?contents.asArray().map(ref=>doc.context.lookup(ref,PDFRawStream)):[contents];
 const text=streams.map(stream=>Buffer.from(decodePDFRawStream(stream).decode()).toString('ascii')).join('\n');
 const multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
 let matrix=[1,0,0,1,0,0],numbers=[];const stack=[];
 for(const token of text.trim().split(/\s+/)){
  if(token==='q')stack.push([...matrix]);else if(token==='Q')matrix=stack.pop();
  else if(token==='cm'){assert.equal(numbers.length,6);matrix=multiply(matrix,numbers);numbers=[];}
  else if(token==='Do')return [[0,0],[1,0],[0,1],[1,1]].map(([x,y])=>[matrix[0]*x+matrix[2]*y+matrix[4],matrix[1]*x+matrix[3]*y+matrix[5]]);
  else if(Number.isFinite(Number(token)))numbers.push(Number(token));
 }
 throw new Error('No image paint command was found');
}

test('PNG to PDF preserves exact RGB, transparency, dimensions and source bytes',async()=>{
 const {imagePdf}=await output,source=image(),original=source.bytes.slice();
 const result=await imagePdf(source,settings()),doc=await PDFDocument.load(result.bytes),embedded=asset(doc,doc.getPage(0)).stream;
 assert.equal(doc.getPageCount(),1);assert.equal(embedded.dict.lookup(PDFName.of('Width')).asNumber(),2);assert.equal(embedded.dict.lookup(PDFName.of('Height')).asNumber(),1);
 assert.deepEqual([...decodePDFRawStream(embedded).decode()],[255,0,50,255,200,50]);
 const mask=doc.context.lookup(embedded.dict.get(PDFName.of('SMask')),PDFRawStream);assert.deepEqual([...decodePDFRawStream(mask).decode()],[255,128]);assert.deepEqual(source.bytes,original);
});

test('all image-to-PDF rotations and supported papers fit without distortion',async()=>{
 const {imagePdf}=await output,source=image(3,2);
 for(const rotation of [0,90,180,270])for(const paper of ['a4','letter','image'])for(const orientation of ['auto','portrait','landscape']){
  const result=await imagePdf(source,settings({rotation,paper,orientation})),doc=await PDFDocument.load(result.bytes),page=doc.getPage(0),layout=result.layout;
  assert.deepEqual([page.getWidth(),page.getHeight()],layout.page);assert(layout.left>=10*72/25.4-.001&&layout.bottom>=10*72/25.4-.001);
  assert(Math.abs(layout.drawWidth/layout.drawHeight-(rotation%180?2/3:3/2))<1e-9);
  assert(layout.left+layout.drawWidth<=page.getWidth()+.001);assert(layout.bottom+layout.drawHeight<=page.getHeight()+.001);
  const corners=imageCorners(doc,page),xs=corners.map(point=>point[0]),ys=corners.map(point=>point[1]);
  assert(Math.abs(Math.min(...xs)-layout.left)<.001);assert(Math.abs(Math.min(...ys)-layout.bottom)<.001);
  assert(Math.abs(Math.max(...xs)-Math.min(...xs)-layout.drawWidth)<.001);assert(Math.abs(Math.max(...ys)-Math.min(...ys)-layout.drawHeight)<.001);
 }
});

test('multi-image PDF respects order, duplicates, independent page setup and shared assets',async()=>{
 const {imagePagesPdf}=await output,sources=[image(2,1),image(1,3)],originals=sources.map(item=>item.bytes.slice()),progress=[];
 const pages=[{source:1,settings:settings({paper:'letter',rotation:90})},{source:0,settings:settings({paper:'image',margin:0})},{source:1,settings:settings({paper:'a4'})}];
 const result=await imagePagesPdf(sources,pages,item=>progress.push(item)),doc=await PDFDocument.load(result.bytes);assert.equal(doc.getPageCount(),3);
 assert.deepEqual(doc.getPages().map(page=>asset(doc,page).stream.dict.lookup(PDFName.of('Width')).asNumber()),[1,2,1]);
 assert.equal(asset(doc,doc.getPage(0)).ref.toString(),asset(doc,doc.getPage(2)).ref.toString());
 assert.deepEqual([doc.getPage(0).getWidth(),doc.getPage(0).getHeight()],[792,612]);assert.deepEqual([doc.getPage(1).getWidth(),doc.getPage(1).getHeight()],[1.5,.75]);
 assert.deepEqual(progress.map(item=>item.current),[1,2,3]);sources.forEach((source,index)=>assert.deepEqual(source.bytes,originals[index]));
});

test('invalid later recipes are rejected before any decoding or partial progress',async()=>{
 const {imagePagesPdf}=await output,source=image(),progress=[];
 // The first valid page requests a canvas edit. Node has no image decoder;
 // reaching it would fail differently and prove validation happened too late.
 const first={source:0,settings:settings({brightness:10})};
 for(const last of [null,{source:-1,settings:settings()},{source:1,settings:settings()},{source:0},{source:0,settings:settings({rotation:45})}]){
  await assert.rejects(imagePagesPdf([source],[first,last],item=>progress.push(item)),/source image|page settings/);
 }
 assert.deepEqual(progress,[]);
});

test('source mismatches and malformed inputs fail before image editing',async()=>{
 const {imagePdf,imagePagesPdf}=await output,source=image();
 await assert.rejects(imagePdf({...source,width:3},settings({brightness:5})),/dimensions changed/);
 await assert.rejects(imagePdf(null,settings()),/source image/);
 await assert.rejects(imagePdf(source,settings({margin:NaN})),/page settings/);
 await assert.rejects(imagePagesPdf([],[]),/10 source images/);
 await assert.rejects(imagePagesPdf([source],Array.from({length:101},()=>({source:0,settings:settings()}))),/100 PDF pages/);
 await assert.rejects(imagePdf({...source,bytes:new Uint8Array([1,2,3])},settings()),/damaged or in a type PDFix cannot read/);
});

test('draft changes during progress cannot change the validated page plan',async()=>{
 const {imagePagesPdf}=await output,pages=[{source:0,settings:settings()},{source:0,settings:settings({paper:'letter',orientation:'portrait'})}],progress=[];
 const result=await imagePagesPdf([image()],pages,state=>{progress.push(state);if(state.current===1){pages[1].settings.paper='image';pages.push({source:0,settings:settings()});}}),doc=await PDFDocument.load(result.bytes);
 assert.equal(result.pageCount,2);assert.equal(doc.getPageCount(),2);assert.deepEqual([doc.getPage(1).getWidth(),doc.getPage(1).getHeight()],[612,792]);assert.deepEqual(progress.map(state=>state.total),[2,2]);
});
