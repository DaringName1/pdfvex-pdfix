import {test,expect} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {PDFDocument,PDFName} from 'pdf-lib';
import fixtures from '../helpers/compression-fixture.cjs';
import {launchReader} from '../helpers/reader-launch.mjs';
import {readerTools} from '../helpers/reader-desktop.mjs';
// Release blocker S3 (MASTER-IMPROVEMENT-PLAN-2026-10-26): PDFix ends suddenly (power cut, Task Manager) while one of the
// new on-page tools is saving. Afterwards: no half-written file left, any copy that exists is complete, the original is
// unchanged, and PDFix starts again and opens the file normally.
test.describe.configure({timeout:process.env.CI?300000:180000});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const kill=app=>{try{execFileSync('taskkill',['/PID',String(app.process().pid),'/T','/F'],{stdio:'ignore'});}catch{}};
const env=root=>({...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'});
async function openPdf(app,page,file){await app.evaluate(({dialog},f)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).first().click();await page.getByLabel('Rendered PDF page 1',{exact:true}).filter({visible:true}).first().waitFor({timeout:60000});}
async function afterKill(root,source,original,output,checkOutput){
  // Nothing temporary is left where the copy was being saved.
  expect((await fs.readdir(path.dirname(output))).filter(n=>/\.partial$|\.tmp$/i.test(n))).toEqual([]);
  // A copy that exists is a complete, correct one; no copy is also fine.
  const exists=await fs.stat(output).then(()=>true,()=>false);console.log('after kill: '+(exists?'a complete copy was saved':'no copy was saved')+' ('+path.basename(output)+')');
  if(exists)await checkOutput(await fs.readFile(output));
  expect(hash(await fs.readFile(source))).toBe(hash(original));
  // PDFix starts again and opens the original normally.
  const app=await launchReader({args:['.'],env:env(root)}),page=await app.firstWindow();
  try{await page.waitForLoadState('domcontentloaded');for(const name of ['Discard','Not now','Close'])await page.getByRole('button',{name,exact:true}).first().click({timeout:1500}).catch(()=>{});await openPdf(app,page,source);}
  finally{await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}
}
for(const delay of [150,600,2000]){
  test(`killed ${delay} ms into saving an on-page compressed copy: no partial file, original intact, restart works`,async()=>{
    const root=await fs.mkdtemp(path.resolve('.test-data/kill-compress-')),source=path.join(root,'source.pdf'),original=await fixtures.fixture(true),output=path.join(root,'out','compressed.pdf');
    await fs.mkdir(path.dirname(output));await fs.writeFile(source,original);
    const app=await launchReader({args:['.'],env:env(root)}),page=await app.firstWindow();
    await openPdf(app,page,source);await readerTools(page,'Export');await page.getByRole('button',{name:'Compress a PDF',exact:true}).click();
    const options=page.getByRole('region',{name:'Compress a PDF options',exact:true});await expect(options.locator('.compression-status')).toContainText('independently reopened',{timeout:60000});
    await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},output);
    await options.getByRole('button',{name:'Save compressed PDF',exact:true}).click();await page.waitForTimeout(delay);kill(app);await new Promise(r=>setTimeout(r,3000));
    await afterKill(root,source,original,output,async bytes=>{const pdf=await PDFDocument.load(bytes);expect(pdf.getPageCount()).toBe(1);expect(pdf.getForm().getTextField('Name').getText()).toBe('Saved value');});
  });
  test(`killed ${delay} ms into saving an on-page redacted copy: no partial file, original intact, restart works`,async()=>{
    const root=await fs.mkdtemp(path.resolve('.test-data/kill-redact-')),source=path.join(root,'private.pdf'),output=path.join(root,'out','redacted.pdf');
    const doc=await PDFDocument.create(),sheet=doc.addPage([400,600]);sheet.drawText('Public drawing note',{x:40,y:520,size:16});sheet.drawText('PRIVATE NAME',{x:150,y:320,size:18});const original=await doc.save();
    await fs.mkdir(path.dirname(output));await fs.writeFile(source,original);
    const app=await launchReader({args:['.'],env:env(root)}),page=await app.firstWindow();
    await openPdf(app,page,source);await readerTools(page,'Protect');await page.getByRole('button',{name:'Redact a PDF',exact:true}).click();
    const panel=page.getByRole('region',{name:'Redact a PDF options',exact:true});await expect(panel.getByRole('button',{name:'Add a box',exact:true})).toBeEnabled({timeout:120000});
    await panel.getByRole('combobox',{name:'Redaction resolution',exact:true}).selectOption('144');await panel.getByRole('button',{name:'Add a box',exact:true}).click();
    await panel.getByRole('button',{name:'Build clean copy to review',exact:true}).click();await expect(panel.getByRole('button',{name:'Verified redacted preview',exact:true})).toBeEnabled({timeout:120000});
    await panel.getByRole('checkbox',{name:'I checked all redacted pages and marked regions',exact:true}).check();
    await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},output);
    await panel.getByRole('button',{name:'Save redacted PDF',exact:true}).click();await page.waitForTimeout(delay);kill(app);await new Promise(r=>setTimeout(r,3000));
    // A redacted copy is rebuilt from pictures of the pages: one page, and no font left to carry the original text.
    await afterKill(root,source,original,output,async bytes=>{const pdf=await PDFDocument.load(bytes);expect(pdf.getPageCount()).toBe(1);expect(pdf.getPage(0).node.Resources()?.get(PDFName.of('Font'))).toBeUndefined();});
  });
}
