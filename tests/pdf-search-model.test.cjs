const {test}=require('node:test');
const assert=require('node:assert/strict');
const model=import('../src/pdf-search-model.js');
const content=(...items)=>({items:items.map(item=>typeof item==='string'?{str:item}:item)});

test('PDF words remain searchable across adjacent font/style fragments',async()=>{
  const {pdfSearchText,pdfSearchModel,normalizePdfSearch}=await model;
  const page=content('main','tenance',' ','re','view');
  assert.equal(pdfSearchText(page),'maintenance review');
  const found=pdfSearchModel(page);
  assert.equal(found.text,normalizePdfSearch(pdfSearchText(page)));
  assert.equal(found.text.indexOf('maintenance'),0);
  assert.deepEqual(found.segments.slice(0,2).map(({run,start,end})=>({run,start,end})),[{run:0,start:0,end:4},{run:1,start:4,end:11}]);
  assert.equal(found.segments.at(-1).run,4);
});

test('real whitespace and line endings separate words without inventing boundaries',async()=>{
  const {pdfSearchText,pdfSearchModel,normalizePdfSearch}=await model;
  for(const page of [content('  First ',{str:'',hasEOL:true},'\t second',' ',{str:'line',hasEOL:true},'third  '),content({type:'beginMarkedContent'},'a',{str:'',hasEOL:true},'b'),content('a','\t','\n','b'),content('a','', 'b')]){
    assert.equal(pdfSearchModel(page).text,normalizePdfSearch(pdfSearchText(page)));
  }
  assert.equal(pdfSearchModel(content('a','b')).text,'ab');
  assert.equal(pdfSearchModel(content({str:'a',hasEOL:true},'b')).text,'a b');
  assert.equal(pdfSearchModel(content('a',' ','b')).text,'a b');
});

test('highlight offsets account for Unicode expansion and contextual lowercase across runs',async()=>{
  const {pdfSearchText,pdfSearchModel,normalizePdfSearch}=await model;
  const page=content('İ','stanbul',' ', 'ΟΣ','Α',' ', '😀','Word');
  const found=pdfSearchModel(page);
  assert.equal(found.text,normalizePdfSearch(pdfSearchText(page)));
  assert.equal(found.text,'i\u0307stanbul οσα 😀word');
  assert.deepEqual(found.segments.slice(0,2).map(({start,end})=>({start,end})),[{start:0,end:2},{start:2,end:9}]);
  for(const segment of found.segments)assert.equal(segment.end-segment.start,normalizePdfSearch(segment.raw).length);
});

test('search extraction rejects unavailable and excessive text before allocating a model',async()=>{
  const {pdfSearchText,pdfSearchModel}=await model;
  assert.throws(()=>pdfSearchText(null),/unavailable/);
  assert.throws(()=>pdfSearchModel(content('x'.repeat(2*1024*1024+1))),/too much/);
  assert.throws(()=>pdfSearchText({items:Array.from({length:50001},()=>({str:''}))}),/too much/);
});
