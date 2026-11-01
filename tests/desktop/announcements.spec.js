import {readerRuntime} from '../helpers/reader-runtime.mjs';
import {test,expect} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {PDFDocument} from 'pdf-lib';
import {launchReader} from '../helpers/reader-launch.mjs';import {readerTools,closeReaderApp} from '../helpers/reader-desktop.mjs';

for(const[width,height,scale]of [[1366,820,1],[800,620,1],[800,620,1.5]]){
 test(`announcements reserve space for page, errors and modal saving (${width},${scale})`,async()=>{
  const root=await fs.mkdtemp(path.resolve('.test-data/announcements-')),source=path.join(root,'A drawing with a readable name that should wrap in a small window.pdf');
  const pdf=await PDFDocument.create();pdf.addPage([400,600]).drawText('Keep this document unchanged',{x:20,y:520,size:16});const original=Buffer.from(await pdf.save());await fs.writeFile(source,original);
  const app=await launchReader({args:[await readerRuntime()],env:{...process.env,PDFIX_TEST_VISIBLE:'0',PDFIX_TEST_DATA:path.join(root,'profile')}}),page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await app.evaluate(({BrowserWindow},[w,h])=>BrowserWindow.getAllWindows()[0].setSize(w,h),[width,height]);if(scale!==1){await page.getByRole('button',{name:/Settings/}).click();await page.getByRole('combobox',{name:'Interface text size',exact:true}).selectOption(String(scale));await page.getByRole('button',{name:'Home',exact:true}).click();}
   await app.evaluate(({dialog},file)=>dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]}),source);await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(page.locator('.pdf-paper')).toHaveAttribute('data-ready','true');
   await expect(page.locator('.textLayer')).toContainText('Keep this document unchanged');const toast=page.locator('#toast');
   const clear=async(target=page.getByRole('main'))=>expect.poll(async()=>{const m=await toast.boundingBox(),b=await target.boundingBox();return !!m&&!!b&&b.y+b.height<=m.y+1&&m.x>=0&&m.x+m.width<=width+1&&m.y+m.height<=height+1;}).toBe(true);
   await expect(toast).toContainText('Opened');await clear();await page.screenshot({path:path.join(root,'opened.png')});
   const output=path.join(root,'A saved copy with a long readable name that should wrap without covering the document.pdf');await app.evaluate(({dialog},filePath)=>dialog.showSaveDialog=async()=>({canceled:false,filePath}),output);await page.getByRole('button',{name:'Save a copy',exact:true}).click();const receipt=page.getByRole('region',{name:'Saved copy',exact:true});await expect(receipt).toContainText(path.basename(output));await expect(receipt.getByRole('button',{name:'Continue with this copy',exact:true})).toBeEnabled();expect(await receipt.evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})).toBe(true);await expect(toast).toBeHidden();expect(await fs.readFile(output)).toEqual(original);
   await app.evaluate(({dialog},filePath)=>dialog.showSaveDialog=async()=>({canceled:false,filePath}),source);await page.getByRole('button',{name:'Save a copy',exact:true}).click();await expect(toast).toHaveClass(/error/);await clear();await page.screenshot({path:path.join(root,'save-refused.png')});expect(await fs.readFile(source)).toEqual(original);
   await readerTools(page,'Protect');await page.getByRole('button',{name:'Security report',exact:true}).click();const dialog=page.getByRole('dialog',{name:'PDF security report',exact:true}),save=dialog.getByRole('button',{name:'Save report as text',exact:true});await expect(save).toBeEnabled();const report=path.join(root,'report.txt');await app.evaluate(({dialog},filePath)=>dialog.showSaveDialog=async()=>({canceled:false,filePath}),report);await save.click();await expect(dialog).toContainText('Saved report as report.txt.');if(await toast.isVisible())await clear(dialog);
   const text=await fs.readFile(report,'utf8');expect(text).toContain('Snapshot SHA-256: '+createHash('sha256').update(original).digest('hex'));await page.screenshot({path:path.join(root,'modal-saved.png')});await dialog.getByRole('button',{name:'Close',exact:true}).click();await expect(toast).toBeHidden({timeout:12000});await expect(page.locator('.announcement-space')).toBeHidden();await expect(page.locator('.pdf-paper')).toHaveAttribute('data-ready','true');expect(errors).toEqual([]);
  }finally{await closeReaderApp(app);}
 });
}

test.beforeAll(async()=>{await fs.mkdir(path.resolve('.test-data'),{recursive:true});});
