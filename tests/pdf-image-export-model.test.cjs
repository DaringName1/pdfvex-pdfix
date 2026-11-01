const {test}=require('node:test'),assert=require('node:assert/strict');
const model=import('../src/pdf-image-export-model.js');
const page=(width,height,rotate=0)=>({pageNumber:2,rotate,getViewport({scale,rotation}){const swapped=rotation%180!==0;return {width:(swapped?height:width)*scale,height:(swapped?width:height)*scale,rotation,scale};}});
test('PDF image selection is bounded before expanding all pages or ranges',async()=>{
 const {pdfImageExportPages}=await model;
 assert.deepEqual(pdfImageExportPages({mode:'current',count:10000,current:9999}),[9998]);
 assert.deepEqual(pdfImageExportPages({mode:'all',count:3}),[0,1,2]);
 assert.deepEqual(pdfImageExportPages({mode:'range',count:10000,range:'9998–10000, 2'}),[9997,9998,9999,1]);
 for(const count of [101,Number.MAX_SAFE_INTEGER])assert.throws(()=>pdfImageExportPages({mode:'all',count}),/100 pages/);
 assert.throws(()=>pdfImageExportPages({mode:'range',count:1000000000,range:'1-999999999'}),/100 pages/);
 for(const range of ['1-3,3','0','4-2','1,','NaN','10001'])assert.throws(()=>pdfImageExportPages({mode:'range',count:10000,range}));
 for(const mode of ['invalid',undefined])assert.throws(()=>pdfImageExportPages({mode,count:3,range:'1'}));
 assert.throws(()=>pdfImageExportPages({mode:'current',count:3,current:4}),/current/);
 assert.throws(()=>pdfImageExportPages({mode:'all',count:Infinity}),/page count/);
});
test('PDF image resolution and combined source/view rotation preserve geometry',async()=>{
 const {pdfImagePageLayout}=await model;
 for(const dpi of [72,144,216,300])for(const rotation of [0,90,180,270]){
  const result=pdfImagePageLayout(page(200.25,100.5,90),{dpi,rotation}),swapped=(90+rotation)%180!==0;
  assert.equal(result.page,2);assert.equal(result.width,Math.ceil((swapped?100.5:200.25)*dpi/72));assert.equal(result.height,Math.ceil((swapped?200.25:100.5)*dpi/72));
 }
});
test('invalid or excessive page geometry is rejected before allocating a canvas',async()=>{
 const {pdfImagePageLayout}=await model;
 for(const dimensions of [[-1,100],[NaN,100],[Infinity,100],[0,100],[8193,1],[4001,4001]])assert.throws(()=>pdfImagePageLayout(page(...dimensions),{dpi:72}),/geometry|pixel limit/);
 assert.throws(()=>pdfImagePageLayout(page(200,100),{dpi:600}),/resolution/);assert.throws(()=>pdfImagePageLayout(page(200,100),{dpi:72,rotation:45}),/rotation/);
 assert.throws(()=>pdfImagePageLayout(page(200,100,NaN),{dpi:72}),/geometry/);
});
test('PDF image export enforces both per-page and aggregate pixel budgets',async()=>{
 const {pdfImagePlanPixels}=await model;
 assert.equal(pdfImagePlanPixels([{width:4000,height:4000},{width:4000,height:4000}]),32_000_000);
 assert.throws(()=>pdfImagePlanPixels(Array.from({length:7},()=>({width:4000,height:4000}))),/range/);
 assert.throws(()=>pdfImagePlanPixels(Array.from({length:101},()=>({width:1,height:1}))),/100 PDF pages/);
 for(const layout of [{width:-1,height:1},{width:NaN,height:1},{width:1.5,height:1},null])assert.throws(()=>pdfImagePlanPixels([layout]),/range/);
 assert.throws(()=>pdfImagePlanPixels([]),/100 PDF pages/);
});
