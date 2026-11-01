import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {readerRuntime} from '../helpers/reader-runtime.mjs';
import {PDFDocument} from 'pdf-lib';
import {launchReader} from '../helpers/reader-launch.mjs';
import {readerTools,closeReaderApp} from '../helpers/reader-desktop.mjs';

for(const[tab,group,tool]of [['Edit','Text','Add text'],['Fill & Sign','Set up forms','Create fillable fields'],['Measure','Compare','Drawing sheet sets']]){
 test(tab+' group restores from search, cancels saving and closes its menu on Home',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-editing-ribbon-')),source=path.join(root,'source.pdf');
  const pdf=await PDFDocument.create();pdf.addPage().drawText('Grouped controls keep the original');const original=Buffer.from(await pdf.save());await fs.writeFile(source,original);
  const app=await launchReader({args:[await readerRuntime()],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}}),page=await app.firstWindow(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
   await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},source);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.getByLabel('Rendered PDF page 1',{exact:true}).waitFor();
   await readerTools(page,tab);const panel=page.getByRole('tabpanel',{name:tab,exact:true}),toggle=panel.getByRole('button',{name:group+' tools menu',exact:true});
   await toggle.press('ArrowDown');await expect(page.getByRole('menu',{name:group+' tools',exact:true}).getByRole('menuitem',{name:tool,exact:true})).toBeEnabled();await page.keyboard.press('Escape');await expect(toggle).toBeFocused();
   const search=page.getByRole('searchbox',{name:'Filter tools',exact:true});await search.fill('no such tool');await expect(panel).not.toBeVisible();await search.press('Escape');await expect(panel.getByRole('button',{name:tool,exact:true})).toBeVisible();
   await app.evaluate(({dialog})=>{dialog.showSaveDialog=async()=>({canceled:true});});await page.getByRole('button',{name:'Save a copy',exact:true}).click();
   await expect(page.getByRole('button',{name:'Save a copy',exact:true})).toBeEnabled();expect(await fs.readdir(root)).not.toContain('saved.pdf');expect(await fs.readFile(source)).toEqual(original);
   const output=path.join(root,'saved.pdf');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},output);await page.getByRole('button',{name:'Save a copy',exact:true}).click();
   await expect.poll(()=>fs.readFile(output).then(data=>data.equals(original),()=>false)).toBe(true);
   await page.getByRole('button',{name:'Back to Home',exact:true}).click();await expect(page.getByRole('menu',{name:group+' tools',exact:true})).not.toBeVisible();expect(errors).toEqual([]);
  }finally{await closeReaderApp(app);}
 });
}
