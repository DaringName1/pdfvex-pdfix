// S5 (Oct 29): text typed on the page but not yet placed with Enter survives PDFix ending suddenly. After a restart it
// comes back at the same spot, places with "Add at this location", and is in the saved copy; the original never changes.
import {readerRuntime} from '../helpers/reader-runtime.mjs';
import {test,expect} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {execFileSync} from 'node:child_process';
import {PDFDocument,StandardFonts} from 'pdf-lib';
import {launchReader} from '../helpers/reader-launch.mjs';import {closeReaderApp} from '../helpers/reader-desktop.mjs';
import {chooseDocumentMode} from '../../scripts/user-robot/document-mode.mjs';
test.setTimeout(6*60*1000);
test('unplaced typing is recovered after a sudden close and saved when placed',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-unplaced-')),file=path.join(root,'worksheet.pdf'),output=path.join(root,'worksheet-typed.pdf'),profile=path.join(root,'profile');
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),form=pdf.getForm(),page1=pdf.addPage([612,792]);
 page1.drawText('1. What was the main goal of the reform movement?',{x:60,y:700,size:14,font});form.createTextField('student.name').addToPage(page1,{x:110,y:592,width:200,height:20});
 const original=Buffer.from(await pdf.save());await fs.writeFile(file,original);
 const runtime=await readerRuntime(),start=async()=>{const app=await launchReader({args:[runtime],env:{...process.env,PDFIX_TEST_VISIBLE:'0',PDFIX_TEST_DATA:profile}}),page=await app.firstWindow();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1366,820));
  await app.evaluate(({dialog},[f,s])=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});dialog.showSaveDialog=async()=>({canceled:false,filePath:s});},[file,output]);
  await page.getByRole('button',{name:'Open a file',exact:true}).first().click();await page.getByLabel('Rendered PDF page 1',{exact:true}).waitFor({timeout:120000});await chooseDocumentMode(page,'quick');return {app,page};};
 let {app,page}=await start();
 try{
  await page.getByRole('button',{name:'Type on page',exact:true}).first().click();await expect(page.getByRole('button',{name:'Add at this location',exact:true})).toBeAttached({timeout:60000});await page.waitForTimeout(1500);await page.locator('.pdf-paper[data-ready=true]').first().waitFor({timeout:60000});await page.waitForTimeout(500);
  const box=await page.locator('.pdf-paper').first().boundingBox(),sx=box.width/612,sy=box.height/792;await page.mouse.click(box.x+80*sx,box.y+(792-670)*sy);
  const typing=page.getByRole('textbox',{name:'Text to place here',exact:true});await expect(typing).toBeFocused();await page.keyboard.type('Ending corruption');
  await expect(page.getByText('Your changes are kept on this computer in case PDFix closes.').first()).toBeVisible({timeout:15000});
  try{execFileSync('taskkill',['/PID',String(app.process().pid),'/T','/F'],{stdio:'ignore'});}catch{}await new Promise(resolve=>setTimeout(resolve,1500));
  expect((await fs.readFile(file)).equals(original)).toBe(true);expect(await fs.readdir(root)).not.toContain('worksheet-typed.pdf');
  ({app,page}=await start());await page.getByRole('button',{name:'Fill form',exact:true}).first().click();
  await expect(page.getByText(/Recovered text you were typing on page 1: "Ending corruption"/).first()).toBeVisible({timeout:60000});
  const recovered=page.getByRole('textbox',{name:'Text to place here',exact:true});await expect(recovered).toHaveValue('Ending corruption');await page.screenshot({path:test.info().outputPath('recovered-typing-on-page.png')});await recovered.press('Enter');
  await expect(page.locator('.form-layer text').filter({hasText:'Ending corruption'})).toBeVisible();await page.screenshot({path:test.info().outputPath('recovered-typing-placed.png')});
  await page.getByRole('button',{name:'Save a copy',exact:true}).first().click();const finish=page.getByRole('button',{name:'Save filled copy',exact:true});
  await expect.poll(async()=>await fs.stat(output).then(()=>true,()=>false)||await finish.isVisible().catch(()=>false),{timeout:120000}).toBe(true);
  if(!await fs.stat(output).then(()=>true,()=>false))await finish.click();await expect.poll(()=>fs.stat(output).then(s=>s.size,()=>0),{timeout:120000}).toBeGreaterThan(0);
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile(output))}),doc=await task.promise;
  expect((await (await doc.getPage(1)).getTextContent()).items.map(item=>item.str).join(' ')).toContain('Ending corruption');await task.destroy();
  expect((await fs.readFile(file)).equals(original)).toBe(true);
 }finally{await closeReaderApp(app).catch(()=>{});try{execFileSync('taskkill',['/PID',String(app.process().pid),'/T','/F'],{stdio:'ignore'});}catch{}await fs.rm(root,{recursive:true,force:true}).catch(()=>{});}
});
