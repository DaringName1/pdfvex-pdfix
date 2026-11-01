import {test} from 'node:test';import assert from 'node:assert/strict';
import {readerErrorDetail} from '../src/pdf-reader-errors.js';import {SCAN_MEMORY_MESSAGE} from '../src/pdf-reader-image-policy.js';
test('reader failures give a plain next step without exposing parser wording',()=>{
 assert.match(readerErrorDetail(new Error('Pages tree contains circular reference.')),/damaged page list.*Repair PDF/);
 assert.match(readerErrorDetail(new Error('unknown encryption method')),/password protection.*unlocked copy/);
 const error=new TypeError("Cannot read properties of undefined (reading 'get')");assert.doesNotMatch(readerErrorDetail(error),/undefined|reading|TypeError/);assert.match(readerErrorDetail(error),/new copy/);
 assert.equal(readerErrorDetail(new RangeError('Array buffer allocation failed')),SCAN_MEMORY_MESSAGE);
 assert.equal(readerErrorDetail(new Error('This PDF exceeds the supported page limit.')),'This PDF exceeds the supported page limit.');
});

test('parser and renderer infrastructure failures keep a plain recovery step',()=>{for(const name of ['FormatError','InvalidPDFException','XRefParseException']){const error=new Error('Bad internal object at C:\\private\\drawing.pdf; undefined xref');error.name=name;const text=readerErrorDetail(error);assert.match(text,/could not be displayed.*Repair PDF/);assert.doesNotMatch(text,/private|undefined|xref/i);}for(const message of ['Invalid PDF structure','Setting up fake worker failed: https://internal/worker','WASM initialization failed'])assert.match(readerErrorDetail(new Error(message)),/could not be displayed/);const missing=new Error('private file');missing.name='MissingPDFException';assert.match(readerErrorDetail(missing),/Find the file and open it again/);});
