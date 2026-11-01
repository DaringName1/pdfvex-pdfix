// The Windows package ships only the libraries the main process loads. These tests make sure the list matches the code
// and that packaging stops if code starts loading a library that would not be shipped.
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
let packages;test.before(async()=>{packages=await import('../scripts/runtime-packages.mjs');});
test('every library the app main process loads is shipped',async()=>{
  const found=await packages.checkRuntimePackages(path.join(__dirname,'..'));
  for(const name of found.keys())assert.ok(packages.RUNTIME_PACKAGES.includes(name),name);
  assert.ok(found.has('pdf-lib')&&found.has('mammoth'),'the scan reaches the main-process code');
});
test('packaging stops when code loads a library that is not shipped',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-runtime-packages-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  await fs.mkdir(path.join(root,'desktop'));await fs.mkdir(path.join(root,'src'));
  await fs.writeFile(path.join(root,'desktop','main.cjs'),"const fs=require('node:fs');const {app}=require('electron');require('../src/helper.js');");
  await fs.writeFile(path.join(root,'src','helper.js'),"import {PDFDocument} from 'pdf-lib';import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';");
  await assert.rejects(packages.checkRuntimePackages(root),/pdfjs-dist \(from src[\\/]helper\.js\)/);
});
test('only English and Spanish screen-language files are kept',()=>{
  for(const name of ['en-US.pak','es.pak','es-419.pak'])assert.match(name,packages.KEPT_LOCALE);
  for(const name of ['de.pak','en-GB.pak','fr.pak','zh-CN.pak','en-US.pak.info'])assert.doesNotMatch(name,packages.KEPT_LOCALE);
});
