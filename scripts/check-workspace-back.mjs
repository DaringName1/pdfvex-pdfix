// Hidden check that Back in a document returns to the page the document was opened from (Home, Files or
// All tools), names that page, and that switching document tabs keeps the original page.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {randomUUID} from 'node:crypto';
const output=path.resolve('tmp/workspace-back-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Back-')),work=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-BackFiles-'));
await fs.mkdir(output,{recursive:true});const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[]};
const pdf=path.join(work,'Reading sample.pdf'),docx=path.join(work,'Editing sample.docx');await fs.copyFile('tests/fixtures/reading-sample.pdf',pdf);await fs.copyFile('tests/fixtures/editing-sample.docx',docx);
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message.slice(0,500)});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const side=name=>page.getByRole('button',{name,exact:true}).first(),ready=()=>page.locator('.document-area[data-ready="true"],.pdf-paper[data-ready="true"]').first().waitFor({timeout:45000});
 const pick=file=>app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);
 await check('opened from Home, Back says and goes Home',async()=>{await pick(docx);await page.getByRole('button',{name:'Open a file',exact:true}).click();await ready();await page.getByRole('button',{name:'Back to Home',exact:true}).click();await expect(page.getByRole('button',{name:'Open a file',exact:true})).toBeVisible();});
 await check('opened from Files, Back returns to Files',async()=>{await side('Files').click();await page.locator('.file-open').filter({hasText:'Editing sample.docx'}).first().click();await ready();const back=page.getByRole('button',{name:'Back to Files',exact:true});await expect(back).toBeVisible();await back.click();await expect(page.locator('main')).toContainText('Editing sample.docx');await expect(page.locator('main h1, main h2').first()).toContainText(/opened files/i);});
 await check('opened from All tools, Back returns to All tools; switching tabs keeps it',async()=>{await pick(pdf);await side('All tools').click();await page.getByRole('tab',{name:'Create',exact:true}).click();await page.locator('.workspace-room-grid button').filter({hasText:'Open a document'}).first().click();await ready();
  await expect(page.getByRole('button',{name:'Back to All tools',exact:true})).toBeVisible();
  const tabs=page.locator('.document-tabs .document-tab-open');if(await tabs.count()>1){await tabs.filter({hasText:'Editing sample.docx'}).click();await ready();await expect(page.getByRole('button',{name:'Back to All tools',exact:true})).toBeVisible();}
  await page.getByRole('button',{name:'Back to All tools',exact:true}).click();await expect(page.getByRole('tab',{name:'Create',exact:true})).toBeVisible();});
}catch(error){report.error=error.message;}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(r=>setTimeout(()=>r(false),15000))]);if(!closed)try{process.kill(pid);}catch{}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});await fs.rm(work,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,checks:report.checks.map(c=>c.name),failures:report.failures,errors:report.errors.slice(0,3),error:report.error},null,1));process.exit(report.pass?0:1);
