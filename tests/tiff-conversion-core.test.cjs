const {test}=require('node:test'),assert=require('node:assert/strict'),UPNG=require('@pdf-lib/upng').default;
const {inspectTiff,decodeTiffPage}=require('../desktop/tiff-codec.cjs');
const {validTiffInspection,validTiffPageResult,hash}=require('../desktop/tiff-validation.cjs');
const {tiffFixture}=require('./helpers/converter-tiff-fixture.cjs');
const grayscale=result=>Array.from(new Uint8Array(UPNG.toRGBA8(UPNG.decode(result.bytes.buffer.slice(result.bytes.byteOffset,result.bytes.byteOffset+result.bytes.byteLength)))[0])).filter((_,index)=>index%4===0);
test('TIFF normalizes all eight orientations with exact independent pixel expectations',()=>{
 const expected=[[10,20,30,40,50,60],[30,20,10,60,50,40],[60,50,40,30,20,10],[40,50,60,10,20,30],[10,40,20,50,30,60],[40,10,50,20,60,30],[60,30,50,20,40,10],[30,60,20,50,10,40]];
 for(let orientation=1;orientation<=8;orientation++){const bytes=tiffFixture({orientation}),original=bytes.slice(),report=inspectTiff(bytes);validTiffInspection(report,hash(bytes));const result=decodeTiffPage(bytes,0);validTiffPageResult(result,0,hash(bytes),report);assert.deepEqual(grayscale(result),expected[orientation-1]);assert.deepEqual([result.report.width,result.report.height],orientation<5?[3,2]:[2,3]);assert.deepEqual(bytes,original);}
});
test('TIFF supported non-fax compression and byte orders reopen to identical pixels',()=>{
 for(const compression of [1,5,8,32946,32773])for(const little of [true,false]){const bytes=tiffFixture({compression,little}),result=decodeTiffPage(bytes,0);assert.deepEqual(grayscale(result),[10,20,30,40,50,60]);}
});
test('TIFF horizontal predictor and packed grayscale decode exact samples',()=>{
 assert.deepEqual(grayscale(decodeTiffPage(tiffFixture({compression:8,predictor:2,pixels:[10,10,10,40,10,10]}),0)),[10,20,30,40,50,60]);
 assert.deepEqual(grayscale(decodeTiffPage(tiffFixture({width:4,height:1,bits:4,pixels:[0x05,0xaf]}),0)),[0,85,170,255]);
 assert.deepEqual(grayscale(decodeTiffPage(tiffFixture({width:4,height:1,bits:1,pixels:[0x50],photometric:0}),0)),[255,0,255,0]);
});
test('TIFF conversion rejects broken strips, directory cycles, unsupported modes and cancellation',()=>{
 assert.throws(()=>inspectTiff(tiffFixture({cycle:true})),/cycle/);
 const bad=tiffFixture({compression:7}),report=inspectTiff(bad);assert.equal(report.pages[0].supported,false);assert.throws(()=>decodeTiffPage(bad,0),/unsupported/);
 assert.throws(()=>decodeTiffPage(tiffFixture({pixels:[1]}),0),/row budget/);
 const controller=new AbortController();controller.abort();assert.throws(()=>decodeTiffPage(tiffFixture(),0,{signal:controller.signal}),/canceled/);
});
test('TIFF oriented PNG output converts into a real reopened PDF without changing source',async()=>{
 const {imagePdf}=await import('../src/image-output.js'),{PDFDocument}=require('pdf-lib'),bytes=tiffFixture({orientation:6}),original=bytes.slice(),result=decodeTiffPage(bytes,0);
 const output=await imagePdf({bytes:new Uint8Array(result.bytes),width:result.report.width,height:result.report.height},{rotation:0,paper:'image',orientation:'auto',margin:0}),pdf=await PDFDocument.load(output.bytes);
 assert.equal(pdf.getPageCount(),1);assert.deepEqual(pdf.getPage(0).getSize(),{width:1.5,height:2.25});assert.deepEqual(bytes,original);
});
