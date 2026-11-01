import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {PDFDocument,PDFName} from 'pdf-lib';
import fixtures from '../helpers/compression-fixture.cjs';
import {launchReader} from '../helpers/reader-launch.mjs';
import {readerTools,closeReaderApp} from '../helpers/reader-desktop.mjs';
import {chooseDocumentMode} from '../../scripts/user-robot/document-mode.mjs';

for(const[width,height,scale]of [[1366,820,1],[800,620,1],[800,620,1.5]]){
 test(`compression stays in the document, cancels safely and restores the original (${width},${scale})`,async()=>{
  const root=await fs.mkdtemp(path.resolve('.test-data/compression-inline-')),source=path.join(root,'source.pdf'),original=await fixtures.fixture(true);
  await fs.writeFile(source,original);const app=await launchReader({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}}),page=await app.firstWindow(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
   await app.evaluate(({BrowserWindow},[w,h])=>BrowserWindow.getAllWindows()[0].setSize(w,h),[width,height]);
   if(scale!==1){await page.getByRole('button',{name:/Settings/}).click();await page.getByRole('combobox',{name:'Interface text size',exact:true}).selectOption(String(scale));await page.getByRole('button',{name:'Home',exact:true}).click();}
   await app.evaluate(({dialog},file)=>dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]}),source);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.getByLabel('Rendered PDF page 1',{exact:true}).waitFor();
   await readerTools(page,'Export');const sourceZoom=await page.locator('.reader-one-place>.pdf-toolbar .zoom-value').textContent();await page.getByRole('button',{name:'Compress a PDF',exact:true}).click();
   const options=page.getByRole('region',{name:'Compress a PDF options',exact:true}),preview=page.getByRole('region',{name:'Compressed copy preview',exact:true});
   await expect(options.locator('.compression-status')).toContainText('independently reopened',{timeout:60000});await expect(preview.locator('.pdf-paper')).toHaveAttribute('data-ready','true');
   await expect(page.locator('dialog[open]')).toHaveCount(0);await expect(page.getByRole('toolbar',{name:'Document panels',exact:true})).toBeVisible();await expect(page.getByLabel('Rendered PDF page 1',{exact:true}).filter({visible:true})).toHaveCount(1);
   expect(await options.evaluate(n=>n.parentElement===document.querySelector('.reader-one-place>.pdf-body'))).toBe(true);
   await expect.poll(()=>options.evaluate(n=>{const b=n.getBoundingClientRect(),save=n.querySelector('[data-save]').getBoundingClientRect();return b.right<=innerWidth&&b.bottom<=innerHeight&&n.scrollWidth<=n.clientWidth&&save.bottom<=b.bottom&&save.right<=b.right;})).toBe(true);
   await page.screenshot({path:path.join(root,'preview.png')});
   await app.evaluate(({dialog})=>dialog.showSaveDialog=async()=>({canceled:true}));await page.getByRole('button',{name:'Save compressed PDF',exact:true}).first().click();await expect(options.locator('.compression-status')).toContainText('Saving canceled');await expect(preview).toBeVisible();
   await chooseDocumentMode(page,'view');await expect(options).not.toBeVisible();await expect(preview).not.toBeVisible();await expect(page.getByRole('button',{name:'Save a copy',exact:true})).toBeVisible();
   await chooseDocumentMode(page,'build');await expect(preview).toBeVisible();await expect(options).toBeVisible();
   const output=path.join(root,'compressed.pdf');await app.evaluate(({dialog},filePath)=>dialog.showSaveDialog=async()=>({canceled:false,filePath}),output);await options.getByRole('button',{name:'Save compressed PDF',exact:true}).click();await expect(options.locator('.compression-status')).toContainText('Saved compressed.pdf');
   const bytes=await fs.readFile(output),pdf=await PDFDocument.load(bytes);expect(bytes.length).toBeLessThan(original.length);expect(pdf.getPageCount()).toBe(1);expect(pdf.getForm().getTextField('Name').getText()).toBe('Saved value');expect(pdf.getTitle()).toBe('Keep this metadata');expect(pdf.catalog.get(PDFName.of('Outlines'))).toBeTruthy();expect(pdf.catalog.get(PDFName.of('Names'))).toBeTruthy();expect(await fs.readFile(source)).toEqual(original);
   await options.getByRole('button',{name:'Close compression workspace',exact:true}).click();await expect(options).toHaveCount(0);await expect(preview).toHaveCount(0);await expect(page.locator('.reader-one-place>.pdf-body>.page-stage')).toBeVisible();await expect(page.getByRole('button',{name:'Save a copy',exact:true})).toBeVisible();
   await expect(page.locator('.reader-one-place>.pdf-toolbar .zoom-value')).toHaveText(sourceZoom);await expect(page.locator('.reader-one-place>.pdf-body>.page-stage>.pdf-paper')).toHaveAttribute('data-ready','true');await page.screenshot({path:path.join(root,'closed.png')});expect(errors).toEqual([]);
  }finally{await closeReaderApp(app);}
 });
}
