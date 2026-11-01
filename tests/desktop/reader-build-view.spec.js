import {chooseDocumentMode} from '../../scripts/user-robot/document-mode.mjs';
import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';import {PDFDocument} from 'pdf-lib';
import {launchReader} from '../helpers/reader-launch.mjs';import {closeReaderApp} from '../helpers/reader-desktop.mjs';
test('PDF opens in Quick edit; mode buttons and shortcut retain page, scale and native text selection',async()=>{
 const root=await fs.mkdtemp(path.resolve('.test-data/reader-mode-')),pdf=await PDFDocument.create();
 for(const text of ['First page','Selected words stay here'])pdf.addPage([400,600]).drawText(text,{x:40,y:520,size:16});
 const source=path.join(root,'source.pdf'),bytes=Buffer.from(await pdf.save());await fs.writeFile(source,bytes);
 const app=await launchReader({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}});const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},source);
  await page.getByRole('button',{name:'Open a file',exact:true}).click();const paper=page.locator('.document-area .pdf-paper');await expect(paper).toHaveAttribute('data-ready','true');
  const modes=page.getByRole('group',{name:'Document mode',exact:true}),view={click:()=>chooseDocumentMode(page,'view')},build={click:()=>chooseDocumentMode(page,'build')};await expect(modes.getByRole('button',{name:'Mode: Quick edit',exact:true})).toBeVisible();await view.click();await expect(page.getByRole('tablist',{name:'PDF tool groups',exact:true})).not.toBeVisible();
  const number=page.getByRole('spinbutton',{name:'Page number',exact:true});await number.fill('2');await number.press('Tab');await expect(paper).toHaveAttribute('data-page','2');await expect(paper).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Zoom out',exact:true}).click();await expect(paper).toHaveAttribute('data-ready','true');const width=await paper.evaluate(e=>e.getBoundingClientRect().width);
  await page.locator('.document-area .textLayer').evaluate(e=>{const node=e.querySelector('span').firstChild,range=document.createRange();range.selectNodeContents(node);const selected=getSelection();selected.removeAllRanges();selected.addRange(range);});
  const selected=await page.evaluate(()=>getSelection().toString());expect(selected).toContain('Selected words');
  await build.click();await expect(modes.getByRole('button',{name:'Mode: Build',exact:true})).toBeVisible();expect(await page.evaluate(()=>getSelection().toString())).toBe(selected);expect(await paper.evaluate(e=>e.getBoundingClientRect().width)).toBeCloseTo(width,0);
  await page.keyboard.press('Control+Shift+E');await expect(modes.getByRole('button',{name:'Mode: View',exact:true})).toBeVisible();await expect(paper).toHaveAttribute('data-page','2');expect(await page.evaluate(()=>getSelection().toString())).toBe(selected);expect(await paper.evaluate(e=>e.getBoundingClientRect().width)).toBeCloseTo(width,0);
  await build.click();await page.getByRole('tablist',{name:'PDF tool groups',exact:true}).getByRole('tab',{name:'Pages',exact:true}).click();const pages=page.getByRole('region',{name:'Organize PDF pages',exact:true});await pages.getByRole('button',{name:'Rotate output page 1',exact:true}).click();await expect(pages.locator('.page-plan-row').first()).toContainText('90°');await view.click();await expect(pages).not.toBeVisible();await expect(paper).toHaveAttribute('data-page','2');await build.click();await expect(pages).toBeVisible();await expect(pages.locator('.page-plan-row').first()).toContainText('90°');await pages.getByRole('button',{name:'Preview new copy',exact:true}).click();await expect(pages.getByRole('button',{name:'Save this copy',exact:true})).toBeEnabled({timeout:120000});const copy=path.join(root,'rotated.pdf');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},copy);await pages.getByRole('button',{name:'Save this copy',exact:true}).click();await expect(pages.getByRole('status').filter({hasText:/^Saved /})).toBeVisible({timeout:120000});const saved=await PDFDocument.load(await fs.readFile(copy));expect(saved.getPage(0).getRotation().angle).toBe(90);expect(saved.getPageCount()).toBe(2);await pages.getByRole('button',{name:'Close page workspace',exact:true}).click();
  expect(await fs.readFile(source)).toEqual(bytes);expect(errors).toEqual([]);
 }finally{await closeReaderApp(app);}
});
