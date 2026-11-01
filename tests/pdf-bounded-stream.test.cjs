const {test}=require('node:test'),assert=require('node:assert/strict');
const {PDFDocument,PDFName}=require('pdf-lib');
const {decodeBounded}=require('../desktop/pdf-bounded-stream.cjs');
const DecodeStream=require('pdf-lib/cjs/core/streams/DecodeStream.js').default;

test('bounded stream decoding keeps exact bytes and refuses excess expansion',async()=>{
 const doc=await PDFDocument.create(),bytes=Buffer.from('text\n'.repeat(20000)),stream=doc.context.flateStream(bytes);
 assert.deepEqual(decodeBounded(stream,bytes.length),bytes);
 assert.throws(()=>decodeBounded(stream,bytes.length-1),/exceeds its size limit/);
 assert.throws(()=>decodeBounded(stream,-1),/Invalid/);
 assert.deepEqual(decodeBounded(doc.context.flateStream(Buffer.alloc(0)),0),Buffer.alloc(0));
});

test('tiny thin-line and initial-tag saves fit the unchanged contained allocation ceiling',async()=>{
 const doc=await PDFDocument.create();for(let i=1;i<=3;i++){const p=doc.addPage([400,600]);p.drawText('Known paragraph '+i,{x:40,y:500});p.drawLine({start:{x:40,y:100},end:{x:300,y:100},thickness:.1});}
 const bytes=Buffer.from(await doc.save({useObjectStreams:false})),original=Buffer.from(bytes),ensure=DecodeStream.prototype.ensureBuffer;let reserved=0;
 DecodeStream.prototype.ensureBuffer=function(size){if(size>16*1024*1024)throw Error('Individual contained bound');const value=ensure.call(this,size),capacity=this.buffer.length;reserved+=Math.max(0,capacity-(this.testCapacity||0));this.testCapacity=capacity;if(reserved>64*1024*1024)throw Error('Aggregate contained bound');return value;};
 try{
  const thin=require('../desktop/pdf-thin-line-codec.cjs'),inventory=await thin.inspectThinLines(bytes,{thresholdPt:.25});
  const repaired=await thin.writeThinLines(bytes,{version:1,inspectionSha256:inventory.inspectionSha256,thresholdPt:.25,changes:[{id:inventory.strokes[0].id,widthPt:.5}]});
  assert.equal(repaired.report.changes[0].afterMinimumPt,.5);assert.equal((await PDFDocument.load(repaired.bytes)).getPageCount(),3);
  const tags=require('../desktop/pdf-tags-codec.cjs'),before=await tags.inspect(bytes);assert.equal(before.creation.available,true,before.creation.reason);
  const result=await tags.write(bytes,{inventorySha256:before.inventorySha256,edits:[],orders:[],create:{language:'en-US',reviewed:true,items:before.creation.candidates.map(c=>({candidateId:c.id,role:c.kind==='text'?'P':'Artifact',alt:null,actualText:null,artifactType:c.kind==='text'?null:'Layout'}))}});
  const saved=await PDFDocument.load(result.bytes);assert.ok(saved.catalog.get(PDFName.of('StructTreeRoot')));assert.equal(saved.getPageCount(),3);
  assert.ok(reserved<4*1024*1024,'Tiny streams must not reserve their multi-megabyte ceiling');assert.deepEqual(bytes,original);
 }finally{DecodeStream.prototype.ensureBuffer=ensure;}
});
