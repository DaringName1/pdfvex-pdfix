import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';
import {guardPdfjsErrors,guardPdfjsOptionalContent} from '../scripts/pdfjs-fail-closed.mjs';
import {missingLayerFixture} from './helpers/missing-layer-fixture.mjs';
test('missing layer references paint their content; defined hidden layers and malformed dictionaries keep their rules',async()=>{
 const root=await fs.mkdtemp(path.resolve('tmp/layer-unit-'));
 try{
  const worker=path.join(root,'worker.mjs'),module=path.join(root,'pdf.mjs'),workerSource=await fs.readFile('node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs','utf8');
  assert.throws(()=>guardPdfjsOptionalContent(workerSource.replace('const properties = resources.get("Properties");','changed;')),/no longer matches/);
  await fs.writeFile(worker,guardPdfjsOptionalContent(workerSource));await fs.writeFile(module,guardPdfjsErrors(await fs.readFile('node_modules/pdfjs-dist/legacy/build/pdf.mjs','utf8')));
  const pdfjs=await import(pathToFileURL(module));pdfjs.GlobalWorkerOptions.workerSrc=pathToFileURL(worker).href;
  for(const kind of ['missing-dictionary','missing-entry','defined-off','malformed','malformed-zero','malformed-false']){
   const task=pdfjs.getDocument({data:new Uint8Array(await missingLayerFixture(kind)),stopAtErrors:true,isEvalSupported:false});
   try{const doc=await task.promise,page=await doc.getPage(1);if(kind.startsWith('malformed')){await assert.rejects(page.getOperatorList());continue;}
    const ops=await page.getOperatorList();assert.ok(ops.fnArray.length>0);const viewport=page.getViewport({scale:1}),canvas=doc.canvasFactory.create(100,100);
    try{await page.render({canvasContext:canvas.context,viewport}).promise;const pixel=[...canvas.context.getImageData(50,50,1,1).data];assert.deepEqual(pixel,kind==='defined-off'?[255,255,255,255]:[0,255,0,255]);}finally{doc.canvasFactory.destroy(canvas);}
   }finally{await task.destroy();}
  }
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
