import {test,expect} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';
import {PDFDocument} from 'pdf-lib';
import {launchReader} from '../helpers/reader-launch.mjs';import {readerRuntime} from '../helpers/reader-runtime.mjs';
import {chooseDocumentMode} from '../../scripts/user-robot/document-mode.mjs';
// Real USB stick check (UI-95-FINISH-LIST B8): a PDF kept on a USB stick is opened, filled in and saved as a copy on
// the same stick. PDFix's own settings stay on this PC, as they would for a real person. The copy has the answer,
// the original on the stick is byte-for-byte unchanged, and nothing else is left on the stick.
// Runs only when PDFIX_USB_FOLDER names a folder on a plugged-in stick, for example: PDFIX_USB_FOLDER="F:\pdfix test"
const usb=process.env.PDFIX_USB_FOLDER;
test.describe.configure({timeout:process.env.CI?300000:180000});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
test('a form PDF on a USB stick is filled and saved as a copy on the same stick',async()=>{
  test.skip(!usb,'set PDFIX_USB_FOLDER to a folder on a USB stick');
  const local=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-usb-profile-')),folder=await fs.mkdtemp(path.join(usb,'usb-save-'));
  const source=path.join(folder,'site form.pdf'),copy=path.join(folder,'site form filled.pdf'),doc=await PDFDocument.create();
  doc.addPage([400,600]).drawText('Original printed words',{x:25,y:540});const field=doc.getForm().createTextField('Name');field.setText('Before');field.addToPage(doc.getPage(0),{x:30,y:400,width:200,height:25});
  const original=Buffer.from(await doc.save());await fs.writeFile(source,original);const typed='Saved on the USB stick';
  const app=await launchReader({args:[await readerRuntime()],env:{...process.env,PDFIX_TEST_DATA:path.join(local,'profile'),PDFIX_TEST_VISIBLE:'0'}});
  try{
    const page=await app.firstWindow();await page.waitForLoadState('domcontentloaded');for(const name of ['Not now','Close'])await page.getByRole('button',{name,exact:true}).first().click({timeout:1500}).catch(()=>{});
    await app.evaluate(({dialog},f)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});},source);await page.getByRole('button',{name:'Open a file',exact:true}).first().click();
    await expect(page.locator('.pdf-paper').first()).toHaveAttribute('data-ready','true',{timeout:60000});
    await chooseDocumentMode(page,'quick');await page.getByRole('toolbar',{name:'Quick edit tools',exact:true}).getByRole('button',{name:'Fill form',exact:true}).click();
    const forms=page.getByRole('region',{name:'Fill and sign options',exact:true});await forms.getByRole('textbox',{name:'Name',exact:true}).fill(typed);
    await expect(forms.locator('.form-status')).toContainText('kept on this computer',{timeout:60000});
    await page.getByRole('button',{name:'Save a copy',exact:true}).click();await expect(forms.getByRole('button',{name:'Save filled copy',exact:true})).toBeEnabled({timeout:120000});await expect(forms.getByRole('checkbox',{name:'I checked the filled values, placements and keyboard order',exact:true})).toHaveCount(0);
    await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},copy);
    await page.getByRole('button',{name:'Save a copy',exact:true}).click();await expect.poll(()=>fs.stat(copy).then(s=>s.size,()=>0),{timeout:120000}).toBeGreaterThan(0);
    const saved=await PDFDocument.load(await fs.readFile(copy));expect(saved.getForm().getTextField('Name').getText()).toBe(typed);
    expect(hash(await fs.readFile(source))).toBe(hash(original));expect((await fs.readdir(folder)).sort()).toEqual(['site form filled.pdf','site form.pdf']);
  }finally{await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});await fs.rm(local,{recursive:true,force:true}).catch(()=>{});}
});
