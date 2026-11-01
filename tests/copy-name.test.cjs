const {test}=require('node:test'),assert=require('node:assert/strict');
const {preferredCopyBase}=require('../desktop/copy-name.cjs');
test('copy suggestions preserve Unicode and normalize only the selected extension',()=>{assert.equal(preferredCopyBase('School notes.PDF','pdf'),'School notes');assert.equal(preferredCopyBase('Résumé 中文','docx'),'Résumé 中文');assert.equal(preferredCopyBase(undefined,'pdf'),undefined);});
test('copy suggestions refuse paths, device names and ambiguous Windows endings',()=>{for(const value of ['../other','C:\\other','folder/name','CON','nul.pdf','COM1.notes','LPT9','notes.','', 'a\0b','a'.repeat(111),{},null])assert.throws(()=>preferredCopyBase(value,'pdf'));assert.equal(preferredCopyBase('Console notes','pdf'),'Console notes');});
