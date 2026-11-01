import {test,expect} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {PDFDocument} from 'pdf-lib';
import {launchReader} from '../helpers/reader-launch.mjs';import {readerRuntime} from '../helpers/reader-runtime.mjs';
import {chooseDocumentMode} from '../../scripts/user-robot/document-mode.mjs';
// Release blocker S4 / P1-13 (MASTER-IMPROVEMENT-PLAN-2026-10-26): someone fills in a form in Quick edit, switches
// to View or Build without saving, and PDFix ends suddenly. Afterwards the PDF is unchanged, nothing is left beside
// it, and the answer comes back when the PDF is opened in Quick edit again.
test.describe.configure({timeout:process.env.CI?300000:180000});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const kill=app=>{try{execFileSync('taskkill',['/PID',String(app.process().pid),'/T','/F'],{stdio:'ignore'});}catch{}};
const env=root=>({...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'});
async function openPdf(app,page,file){await app.evaluate(({dialog},f)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).first().click();await expect(page.locator('.pdf-paper').first()).toHaveAttribute('data-ready','true',{timeout:60000});}
for(const after of ['view','build'])test(`killed after filling a form in Quick edit and switching to ${after}: the PDF is unchanged and the answer comes back`,async()=>{
  test.skip(process.platform!=='win32','uses Windows process termination');
  const root=await fs.mkdtemp(path.resolve('.test-data/kill-mode-')),source=path.join(root,'site form.pdf'),doc=await PDFDocument.create();doc.addPage([400,600]).drawText('Original printed words',{x:25,y:540});
  const field=doc.getForm().createTextField('Name');field.setText('Before');field.addToPage(doc.getPage(0),{x:30,y:400,width:200,height:25});const original=Buffer.from(await doc.save());await fs.writeFile(source,original);
  const typed='Typed before the switch',runtime=await readerRuntime();let app,page;
  const open=async()=>{app=await launchReader({args:[runtime],env:env(root)});page=await app.firstWindow();await page.waitForLoadState('domcontentloaded');for(const name of ['Not now','Close'])await page.getByRole('button',{name,exact:true}).first().click({timeout:1500}).catch(()=>{});
    await openPdf(app,page,source);await chooseDocumentMode(page,'quick');await page.getByRole('toolbar',{name:'Quick edit tools',exact:true}).getByRole('button',{name:'Fill form',exact:true}).click();return page.getByRole('region',{name:'Fill and sign options',exact:true});};
  let forms=await open();await forms.getByRole('textbox',{name:'Name',exact:true}).fill(typed);await expect(forms.locator('.form-status')).toContainText('kept on this computer',{timeout:60000});
  await chooseDocumentMode(page,after);await page.waitForTimeout(500);kill(app);await new Promise(r=>setTimeout(r,3000));
  // Nothing new beside the PDF, and the PDF itself is exactly as it was.
  expect((await fs.readdir(root)).sort()).toEqual(['profile','site form.pdf']);expect(hash(await fs.readFile(source))).toBe(hash(original));
  try{forms=await open();await expect(forms.getByRole('textbox',{name:'Name',exact:true})).toHaveValue(typed,{timeout:60000});}
  finally{await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}
});
