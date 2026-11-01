// Technical engine wording is replaced by plain words before it reaches the screen (UI-A-GRADE-CHECKLIST X7).
const {test}=require('node:test');const assert=require('node:assert/strict');
const {plainMessage,GENERIC,LARGE}=require('../desktop/plain-message.cjs');
test('technical engine sentences become plain words, keeping the original for the problem report',()=>{
  const r=plainMessage('The isolated output does not match its immutable source request.');
  assert.equal(r.message,GENERIC);assert.equal(r.technical,'The isolated output does not match its immutable source request.');
  assert.equal(plainMessage('The isolated result exceeds its structural budget.').message,LARGE);
  assert.equal(plainMessage('The contained document request exceeds the fixed 2 MiB budget for this operation.').message,LARGE);
});
test('plain messages, cancel messages and non-text values pass through unchanged',()=>{
  for(const m of ['The file is open or locked in another program. Close it there, or save a copy.','That filename already exists. Choose a new name; existing files are never overwritten.','This was canceled. No copy was saved, and your original is unchanged.','The isolated document job was canceled. No copy was saved.'])assert.equal(plainMessage(m).message,m);
  assert.equal(plainMessage(undefined).message,undefined);
});
test('file paths never go into the problem report',()=>{
  const r=plainMessage('Saving failed. A staged output could not be removed at C:\\Users\\someone\\Documents\\private.pdf.partial');
  assert.ok(!r.technical.includes('someone')&&!r.technical.includes('private.pdf'));assert.match(r.technical,/<path>/);
});
