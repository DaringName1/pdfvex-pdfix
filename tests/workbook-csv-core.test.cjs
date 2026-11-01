const {test}=require('node:test'),assert=require('node:assert/strict'),codec=import('../src/workbook-csv.js');
test('worksheet CSV quotes multiline Unicode values and applies edits without mutating source',async()=>{
 const {workbookCsv}=await codec,cells=[{ref:'A1',type:'text',value:'café,"😀"\nnext'},{ref:'C2',type:'number',value:'-5'}],original=structuredClone(cells);
 const bytes=workbookCsv(cells,[{ref:'B1',type:'boolean',value:'true'}]);
 assert.deepEqual(Array.from(bytes.slice(0,3)),[239,187,191]);assert.equal(new TextDecoder().decode(bytes),'"café,""😀""\nnext","true",""\r\n"","","-5"');assert.deepEqual(cells,original);
});
test('worksheet CSV neutralizes formula-like text while keeping numeric negatives',async()=>{
 const {workbookCsv}=await codec,cells=['=cmd',' +1','\tword','@user','-5'].map((value,index)=>({ref:String.fromCharCode(65+index)+'1',value,type:'text'}));cells.push({ref:'F1',value:'-5',type:'number'});
 assert.equal(new TextDecoder().decode(workbookCsv(cells)),`"'=cmd","' +1","'\tword","'@user","'-5","-5"`);
});
test('worksheet CSV enforces UTF-8 byte limits including BOM and quotes',async()=>{
 const {workbookCsv}=await codec,cell=value=>[{ref:'A1',type:'text',value}],MAX=8*1024*1024;
 assert.equal(workbookCsv(cell('a'.repeat(MAX-5))).length,MAX);
 assert.throws(()=>workbookCsv(cell('a'.repeat(MAX-4))),/8 MB/);
 assert.throws(()=>workbookCsv(cell('界'.repeat(3_000_000))),/8 MB/);
});
test('worksheet CSV refuses huge sparse ranges and invalid addresses before output allocation',async()=>{
 const {workbookCsv}=await codec;
 assert.throws(()=>workbookCsv([{ref:'XFD1048576',type:'text',value:'x'}]),/million cells/);
 for(const ref of ['XFE1','A1048577','A0','bad'])assert.throws(()=>workbookCsv([{ref,type:'text',value:'x'}]),/address/);
 assert.throws(()=>workbookCsv([{ref:'A1',type:'text',value:'\ud800'}]),/value/);
});
