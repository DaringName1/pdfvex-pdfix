import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialDocumentMode,modeShortcut} from '../src/pdf-reader-mode.js';
test('PDFs start in Quick edit; new and Word documents start in Build',()=>{
  assert.equal(initialDocumentMode({ext:'pdf'}),'quick');
  for(const file of [{isNew:true},{ext:'docx'},{ext:'DOC'},{ext:'rtf'}])assert.equal(initialDocumentMode(file),'build');
});
test('mode shortcut respects composing, repeated and already-handled keystrokes',()=>{
  const key={key:'E',ctrlKey:true,shiftKey:true};assert.equal(modeShortcut(key),true);
  for(const change of [{isComposing:true},{repeat:true},{defaultPrevented:true},{altKey:true},{shiftKey:false},{key:'f'}])assert.equal(modeShortcut({...key,...change}),false);
});
