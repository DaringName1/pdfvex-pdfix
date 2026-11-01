import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {guardPdfjsErrors} from '../scripts/pdfjs-fail-closed.mjs';
import {readerImageOptions,isImageMemoryFailure,SCAN_MEMORY_MESSAGE,readerCanvasContext} from '../src/pdf-reader-image-policy.js';
test('pinned reader has a guarded operator stream and missing-image failure; drift fails the build',async()=>{
 const source=await fs.readFile('node_modules/pdfjs-dist/build/pdf.mjs','utf8');assert.ok(guardPdfjsErrors(source).includes('renderTask.cancel?.(reason)'));assert.throws(()=>guardPdfjsErrors(source.replace('Dependent image', 'Changed image')),/no longer matches/);
});
test('real PDF.js rejects an oversized scan instead of resolving an empty operator list',async()=>{
 const root=await fs.mkdtemp(path.resolve('tmp/pdfjs-error-unit-'));let task;
 try{const source=await fs.readFile('node_modules/pdfjs-dist/legacy/build/pdf.mjs','utf8'),module=path.join(root,'pdf.mjs');await fs.writeFile(module,guardPdfjsErrors(source));const pdfjs=await import(pathToFileURL(module).href);pdfjs.GlobalWorkerOptions.workerSrc=pathToFileURL(path.resolve('node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
 task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile('docs/evidence/codex/scan-decoding-prototype-2026-10-22/5000x4000.pdf')),maxImageSize:16000000,stopAtErrors:true,isEvalSupported:false});const doc=await task.promise,page=await doc.getPage(1);await assert.rejects(page.getOperatorList(),/Image exceeded maximum allowed size/);
 }finally{await task?.destroy();await fs.rm(root,{recursive:true,force:true});}
});
test('100-million input cap leaves output at 16 million; allocation and decoder errors have the owner wording',()=>{
 assert.deepEqual(readerImageOptions(),{maxImageSize:100000000,canvasMaxAreaInBytes:64000000,stopAtErrors:true});for(const message of ['PDFIX_IMAGE_DECODE_FAILED','Image exceeded maximum allowed size and was removed.','Array buffer allocation failed','out of memory','Invalid typed array length'])assert.ok(isImageMemoryFailure(new Error(message)));assert.equal(isImageMemoryFailure(new Error('Page request canceled.')),false);assert.throws(()=>readerCanvasContext({getContext:()=>null}),/PDFIX_IMAGE_DECODE_FAILED/);assert.equal(SCAN_MEMORY_MESSAGE,'This scan could not be displayed with the available memory. Your original is unchanged.');
});
