import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {expect} from '@playwright/test';
import {launchReader} from '../tests/helpers/reader-launch.mjs';
import {readerRuntime} from '../tests/helpers/reader-runtime.mjs';
import {readerTools,closeReaderApp} from '../tests/helpers/reader-desktop.mjs';
const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-sheet-departure-'));
const report={root,checks:[],errors:[],screenshots:[]};
const doc=await PDFDocument.create();for(const title of ['Drawing A','Drawing B'])doc.addPage([400,600]).drawText(title,{x:40,y:500});
const source=path.join(root,'original.pdf'),bytes=Buffer.from(await doc.save());await fs.writeFile(source,bytes);
const runtime=await readerRuntime();
for(const edit of [false,true]){
 const profile=path.join(root,edit?'edited-profile':'clean-profile');let app,page,closed=false;
 try{
  app=await launchReader({args:[runtime],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'}});page=await app.firstWindow();page.on('pageerror',e=>report.errors.push(e.message));page.setDefaultTimeout(60000);
  await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},source);
  await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(page.locator('.document-area .pdf-paper')).toHaveAttribute('data-ready','true');
  await readerTools(page,'Measure');await page.getByRole('button',{name:'Drawing sheet sets',exact:true}).click();
  const tool=page.getByRole('dialog',{name:'Related drawing sheets and revisions',exact:true}),title=tool.getByRole('textbox',{name:'Drawing title',exact:true}).first();await expect(title).toBeEnabled();
  if(edit){
   await title.fill('Reviewed drawing A');await title.press('Tab');
   await app.evaluate(({app})=>{setTimeout(()=>app.quit(),0);});
   await expect(page.getByText('Save or explicitly discard the unsaved sheet-set arrangement before leaving.',{exact:true})).toBeVisible();
   if(app.process().exitCode!==null)throw Error('App quit despite an unsaved sheet-set edit.');
   await tool.getByText('Saved sheet-set library',{exact:true}).click();await tool.getByRole('textbox',{name:'Set name',exact:true}).fill('Reviewed arrangement');await tool.getByRole('button',{name:'Save named set',exact:true}).click();
   await expect(tool.getByRole('status').filter({hasText:/^Named set saved/})).toHaveText('Named set saved. Original drawing PDFs and their comments remain unchanged.',{timeout:60000});
   await expect(page.getByText('Named sheet set saved. Original PDFs unchanged.',{exact:true})).toBeVisible();const saved=JSON.parse(await fs.readFile(path.join(profile,'sheet-sets/sheet-sets.json'),'utf8'));
   expect(saved.items).toHaveLength(1);expect(saved.items[0].sheets).toHaveLength(2);expect(saved.items[0].sheets[0].title).toBe('Reviewed drawing A');expect(saved.items[0].name).toBe('Reviewed arrangement');
  }
  const shot=path.join(root,edit?'saved-arrangement.png':'clean-open.png');await page.screenshot({path:shot});report.screenshots.push(shot);
  await closeReaderApp(app);closed=true;expect(await fs.readFile(source)).toEqual(bytes);
  report.checks.push({edit,pass:true,closedWithoutForcedCleanup:true,originalUnchanged:true,...(edit?{unsavedQuitRefused:true,savedLibraryIndependentlyRead:true}:{untouchedQuitAllowed:true})});
 }catch(error){report.error={edit,message:error.stack};if(page&&!page.isClosed())await page.screenshot({path:path.join(root,'failure.png')}).catch(()=>{});}
 finally{if(app&&!closed)try{await closeReaderApp(app);}catch(error){report.cleanupError=error.message;}}
 if(report.error)break;
}
report.pass=report.checks.length===2&&report.checks.every(row=>row.pass)&&!report.error&&!report.cleanupError&&!report.errors.length;await fs.writeFile(path.join(root,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exitCode=report.pass?0:1;
