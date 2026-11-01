const {test}=require('node:test'),assert=require('node:assert/strict');
const UPNG=require('@pdf-lib/upng').default,encoding=import('../src/pdf-image-encoding.js');
const png=()=>new Uint8Array(UPNG.encode([new Uint8Array(8).buffer],2,1,0));
test('PDF image encoding rejects format fallback before decoding',async()=>{
 const {pdfImageBlobSize}=await encoding;
 assert.throws(()=>pdfImageBlobSize({type:'image/png',size:100},'jpg'),/encode JPEG/);
 assert.throws(()=>pdfImageBlobSize({type:'image/jpeg',size:100},'png'),/encode PNG/);
 assert.throws(()=>pdfImageBlobSize({type:'image/png',size:100},'webp'),/PNG or JPEG/);
});
test('PDF image bytes enforce exact per-page and total output budgets',async()=>{
 const {pdfImageBlobSize}=await encoding,MB=1024*1024;
 assert.equal(pdfImageBlobSize({type:'image/png',size:32*MB},'png',68*MB),100*MB);
 assert.throws(()=>pdfImageBlobSize({type:'image/png',size:32*MB+1},'png'),/32 MB/);
 assert.throws(()=>pdfImageBlobSize({type:'image/jpeg',size:1},'jpg',100*MB),/100 MB/);
 for(const size of [0,-1,NaN,Infinity,1.5])assert.throws(()=>pdfImageBlobSize({type:'image/png',size},'png'),/encoded/);
});
test('PDF image bytes keep exact valid PNG geometry and bytes',async()=>{
 const {pdfImageEncodedBytes}=await encoding,bytes=png(),original=bytes.slice();
 assert.equal(pdfImageEncodedBytes(bytes,'png',{width:2,height:1},bytes.length),bytes);
 assert.deepEqual(bytes,original);
});
test('PDF image bytes reject size, geometry and format mismatches',async()=>{
 const {pdfImageEncodedBytes}=await encoding,bytes=png();
 assert.throws(()=>pdfImageEncodedBytes(bytes,'png',{width:2,height:1},bytes.length+1),/size changed/);
 assert.throws(()=>pdfImageEncodedBytes(bytes,'png',{width:1,height:2},bytes.length),/dimensions changed/);
 assert.throws(()=>pdfImageEncodedBytes(bytes,'jpg',{width:2,height:1},bytes.length),/damaged or in a type PDFix cannot read/);
});
