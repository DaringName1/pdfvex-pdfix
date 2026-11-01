// Hidden, scoped check of Make a scan searchable: run local OCR on a one-page image-only PDF, save the copy,
// and read it back independently: it must now have selectable text while still showing the scan.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
const output=path.resolve('tmp/tools-ocr-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Doc-')),work=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Files-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'Scoped OCR check with one synthetic English scan page. Other languages, multi-page scans, corrections to recognized words, rotated or skewed pages and recognition accuracy on real scans were not exercised.'};
const pdf=path.join(work,'Scan only.pdf'),searchable=path.join(work,'searchable.pdf');await fs.copyFile('tests/fixtures/scan-only.pdf',pdf);const original=await fs.readFile(pdf);
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
const readBack=async file=>{const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile(file)),useSystemFonts:true}),document=await task.promise,pageProxy=await document.getPage(1),text=(await pageProxy.getTextContent()).items.map(item=>item.str).join(' ').replace(/\s+/g,' ').trim(),operators=await pageProxy.getOperatorList(),images=operators.fnArray.filter(fn=>fn===pdfjs.OPS.paintImageXObject||fn===pdfjs.OPS.paintInlineImageXObject).length,pages=document.numPages;await task.destroy();return {pages,text,images};};
try{
 const before=await readBack(pdf);report.before={pages:before.pages,textLength:before.text.length,images:before.images};
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 await app.evaluate(({dialog},{pdf,searchable})=>{global.pdfixAsked=[];dialog.showOpenDialog=async()=>({canceled:false,filePaths:[pdf]});dialog.showSaveDialog=async(_window,options)=>{global.pdfixAsked.push('save '+(options?.title??'')+' -> '+(options?.defaultPath??''));return {canceled:false,filePath:searchable};};dialog.showMessageBox=async(_window,options)=>{global.pdfixAsked.push('box '+String(options?.message??'').slice(0,160));const buttons=options?.buttons??['OK'];const yes=buttons.findIndex(label=>/save|continue|yes|ok/i.test(label));return {response:yes<0?0:yes,checkboxChecked:false};};},{pdf,searchable});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 await page.locator('.task-grid .task-card').filter({has:page.locator('b',{hasText:'Make a scan searchable'})}).first().click();const dialog=page.locator('dialog.ocr-workspace');await dialog.waitFor({timeout:45000});
 await check('the fixture really is image-only before OCR',async()=>{if(before.text.length||before.images<1)throw new Error('Fixture has text or no image: '+JSON.stringify(report.before));});
 await check('local OCR runs in English and shows recognized words for review',async()=>{
  await dialog.getByRole('combobox',{name:'OCR language'}).selectOption({label:'English'});const started=Date.now();await dialog.getByRole('button',{name:'Start local OCR',exact:true}).click();
  const done=dialog.getByRole('button',{name:'Preview searchable copy',exact:true});for(let i=0;i<240&&!await done.isEnabled();i++){await page.waitForTimeout(1000);const toast=page.locator('#toast');if(await toast.isVisible()&&await toast.evaluate(node=>node.classList.contains('error'))){report.ocrError=await toast.textContent();break;}}
  report.seconds=Math.round((Date.now()-started)/1000);if(report.ocrError)throw new Error('OCR failed: '+report.ocrError);report.afterOcr=(await dialog.innerText()).replace(/\s+/g,' ').slice(0,900);report.controls=await dialog.evaluate(node=>[...node.querySelectorAll('button,select,input,textarea')].filter(item=>item.getClientRects().length).map(item=>item.tagName.toLowerCase()+(item.type&&item.tagName==='INPUT'?'['+item.type+']':'')+':'+(item.getAttribute('aria-label')||item.labels?.[0]?.textContent?.trim()||item.textContent.trim()||'').slice(0,60)+(item.disabled?' (disabled)':'')).slice(0,30));
  if(!await done.isEnabled())throw new Error('No recognized text appeared within four minutes: '+report.afterOcr.slice(0,300));report.lines=await dialog.locator('input[type=text]').evaluateAll(inputs=>inputs.map(input=>input.value));if(!report.lines.length||!report.lines.some(line=>/[A-Za-z]{3,}/.test(line)))throw new Error('No recognized words: '+JSON.stringify(report.lines));await page.screenshot({path:path.join(output,'ocr-review.png')});
 });
 await check('save the searchable copy',async()=>{
  await expect(dialog.getByRole('checkbox',{name:'I reviewed the recognized text'})).toHaveCount(0);const preview=dialog.getByRole('button',{name:'Preview searchable copy',exact:true});await expect(preview).toBeEnabled({timeout:10000});await preview.click();const saveReady=dialog.getByRole('button',{name:/save/i}).last();for(let i=0;i<120&&!(await saveReady.count());i++){await page.waitForTimeout(1000);const toast=page.locator('#toast');if(await toast.isVisible()&&await toast.evaluate(node=>node.classList.contains('error')))throw new Error('Preview failed: '+await toast.textContent());}report.afterPreview=(await dialog.innerText()).replace(/\s+/g,' ').slice(-380);await page.screenshot({path:path.join(output,'ocr-preview.png')});
  for(const box of await dialog.locator('input[type=checkbox]').all())if(await box.isVisible()&&await box.isEnabled()&&!await box.isChecked()){const label=await box.evaluate(node=>node.labels?.[0]?.textContent?.trim()||node.getAttribute('aria-label')||'');if(/check|review|confirm/i.test(label))await box.check();}
  const save=dialog.getByRole('button',{name:/save/i}).last();await expect(save).toBeEnabled({timeout:20000});await save.click();await expect.poll(()=>fs.stat(searchable).then(stat=>stat.size,()=>0),{timeout:120000}).toBeGreaterThan(1000);await page.waitForTimeout(800);report.asked=await app.evaluate(()=>global.pdfixAsked);
 });
 await check('the saved copy has selectable text, still shows the scan, and the original is unchanged',async()=>{
  const after=await readBack(searchable);report.after={pages:after.pages,text:after.text.slice(0,400),textLength:after.text.length,images:after.images,bytes:(await fs.stat(searchable)).size};
  if(after.pages!==before.pages)throw new Error('Page count changed to '+after.pages);if(after.text.length<20||!/[A-Za-z]{3,}/.test(after.text))throw new Error('Saved copy has no usable selectable text: "'+after.text.slice(0,120)+'"');if(after.images<1)throw new Error('The scan image is no longer on the page.');
  if(!(await fs.readFile(pdf)).equals(original))throw new Error('The original PDF changed.');await dialog.getByRole('button',{name:'Close OCR workspace'}).click().catch(()=>{});
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds: '+await page.locator('#toast').textContent().catch(()=>'')});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});await fs.rm(work,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
