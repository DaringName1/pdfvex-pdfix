const {test}=require('node:test'),assert=require('node:assert/strict');
const {readWorkbook,writeWorkbook}=require('../desktop/workbook-codec.cjs'),{readPresentation,writePresentation}=require('../desktop/presentation-codec.cjs');
const {workbookFixture,presentationFixture}=require('./helpers/converter-office-fixture.cjs');
test('XLSX copy reopens edits, preserves untouched parts, cached formulas and original bytes',()=>{
 const bytes=workbookFixture(),original=bytes.slice(),before=readWorkbook(bytes),changes=[{sheet:0,ref:'A1',type:'text',value:'界 & <new>'},{sheet:0,ref:'F3',type:'boolean',value:'false'}],output=writeWorkbook(bytes,{kind:'workbook',sheet:0,changes}),after=readWorkbook(output);
 assert.equal(after.model.sheets[0].cells.find(c=>c.ref==='A1').value,'界 & <new>');assert.equal(after.model.sheets[0].cells.find(c=>c.ref==='F3').value,'false');assert.equal(after.model.sheets[0].cells.find(c=>c.ref==='D1').formula,'B1*2');assert.equal(after.model.sheets[0].cells.find(c=>c.ref==='D1').value,'84');
 for(const name of ['xl/styles.xml','custom/unrendered.bin'])assert.deepEqual(after.entries.get(name),before.entries.get(name));assert.deepEqual(bytes,original);assert.match(after.entries.get('xl/workbook.xml').toString(),/fullCalcOnLoad="1"/);
});
test('XLSX conversion refuses formulas, merged covered cells, protected and externally connected edits',()=>{
 const change=ref=>({kind:'workbook',sheet:0,changes:[{sheet:0,ref,type:'text',value:'changed'}]});
 for(const ref of ['D1','B2'])assert.throws(()=>writeWorkbook(workbookFixture(),change(ref)),/cannot be changed/);
 for(const options of [{protectedSheet:true},{external:true}])assert.throws(()=>writeWorkbook(workbookFixture(options),change('A1')),/read-only/);
});
test('XLSX to CSV uses stored literal values, protects formula-looking edits and retains cached results',async()=>{
 const {workbookCsv}=await import('../src/workbook-csv.js'),source=readWorkbook(workbookFixture()),bytes=workbookCsv(source.model.sheets[0].cells,[{ref:'A1',type:'text',value:'=1+1'}]);
 assert.equal(new TextDecoder().decode(bytes),'"\'=1+1","42","true","84"');
});
test('PPTX text copy reopens edits and preserves theme, hidden-slide status and run formatting',()=>{
 const bytes=presentationFixture(),original=bytes.slice(),before=readPresentation(bytes),output=writePresentation(bytes,{kind:'presentation',slide:0,changes:[{slide:0,run:0,text:'New & <text> 😀'}]}),after=readPresentation(output);
 assert.equal(after.model.slides[0].runs[0].text,'New & <text> 😀');assert.equal(after.model.slides[0].runs[0].bold,true);assert.equal(after.model.slides[0].runs[0].size,24);assert.equal(after.model.slides[0].hidden,true);
 for(const name of ['ppt/theme/theme1.xml','custom/unrendered.bin','ppt/presentation.xml'])assert.deepEqual(after.entries.get(name),before.entries.get(name));assert.deepEqual(bytes,original);
});
test('PPTX copy refuses fields and signed packages',()=>{
 const draft={kind:'presentation',slide:0,changes:[{slide:0,run:0,text:'changed'}]};assert.throws(()=>writePresentation(presentationFixture({field:true}),draft),/protected field/);assert.throws(()=>writePresentation(presentationFixture({signed:true}),draft),/signed or protected/);
});
