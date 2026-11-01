// Hidden check of several unsaved new documents: two new documents keep separate text and names across tab switches,
// Home lists both, both survive a restart, and saving one removes only that one from the list.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {randomUUID} from 'node:crypto';
const output=path.resolve('tmp/document-new-documents-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-NewDocs-')),work=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-NewDocsFiles-'));
await fs.mkdir(output,{recursive:true});const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'Two new documents and one restart. More than ten tabs and twenty unsaved documents were not exercised.'};
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message.slice(0,600)});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
async function launch(){app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');}
async function close(){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(r=>setTimeout(()=>r(false),15000))]);if(!closed){report.failures.push({name:'window closes',error:'did not close in 15 s'});try{process.kill(pid);}catch{}}
 // A second launch while the first process is still exiting would hit the single-instance lock.
 for(let i=0;i<100;i++){try{process.kill(pid,0);}catch{return;}await new Promise(r=>setTimeout(r,100));}}
try{
 await launch();
 const editor=()=>page.getByRole('textbox',{name:'Editable document'}),ready=()=>page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000}),home=()=>page.getByRole('button',{name:'Home',exact:true}).first().click();
 const newDoc=async(name,text)=>{await home();await page.getByRole('button',{name:'New document',exact:true}).click();await ready();await expect(page.locator('.draft-status')).toHaveText('Ready to edit');const field=page.getByRole('textbox',{name:'Document name',exact:true});await field.fill(name);await field.press('Enter');await editor().pressSequentially(text);await expect(page.locator('.draft-status')).toHaveText('Recovery draft saved locally',{timeout:10000});};
 const tab=name=>page.locator('.document-tabs .document-tab-open').filter({hasText:name});
 await check('two new documents keep separate text and names',async()=>{
  await newDoc('Alpha plan','Alpha text only');await newDoc('Beta memo','Beta text only');await expect(editor()).not.toContainText('Alpha');
  await tab('Alpha plan').click();await ready();await expect(editor()).toContainText('Alpha text only');await expect(editor()).not.toContainText('Beta');await expect(page.locator('.document-title b')).toHaveText('Alpha plan');
  await tab('Beta memo').click();await ready();await expect(editor()).toContainText('Beta text only');await expect(page.locator('.document-title b')).toHaveText('Beta memo');
 });
 await check('Home lists both unsaved documents and continues each',async()=>{
  await home();await expect(page.locator('.unsaved-documents')).toBeVisible();await expect(page.getByRole('button',{name:'Continue Alpha plan',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Continue Beta memo',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Continue Alpha plan',exact:true}).click();await ready();await expect(editor()).toContainText('Alpha text only');
 });
 await close();await launch();
 await check('both survive a restart',async()=>{
  await expect(page.getByRole('button',{name:'Continue Alpha plan',exact:true})).toBeVisible({timeout:15000});await page.getByRole('button',{name:'Continue Beta memo',exact:true}).click();await ready();await expect(editor()).toContainText('Beta text only');await expect(page.locator('.draft-status')).toHaveText('Recovered local draft');await expect(page.locator('.document-title b')).toHaveText('Beta memo');
 });
 await check('saving one with Save removes only that one from Home',async()=>{
  const file=path.join(work,'Beta memo.docx');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},file);await editor().press('Control+s');await expect(page.locator('.document-title b')).toHaveText('Beta memo.docx',{timeout:45000}).catch(async error=>{throw new Error(error.message.split(String.fromCharCode(10))[0]+' | toast: '+await page.locator('#toast').textContent()+' | status: '+await page.locator('.draft-status').textContent());});
  await home();await expect(page.getByRole('button',{name:'Continue Alpha plan',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Continue Beta memo',exact:true})).toHaveCount(0);
 });
 await check('Discard asks, then removes an unsaved document from Home; one with an open tab is refused',async()=>{
  // With its tab open, discarding is refused; after closing the tab it asks.
  await page.getByRole('button',{name:'Continue Alpha plan',exact:true}).click();await ready();await home();await page.getByRole('button',{name:'Discard Alpha plan',exact:true}).click();await expect(page.locator('#toast')).toContainText('Close the tab of this document',{timeout:5000});await expect(page.locator('dialog.discard-unsaved')).toHaveCount(0);
  await page.getByRole('button',{name:'Continue Alpha plan',exact:true}).click();await ready();await page.getByRole('button',{name:'Close Alpha plan',exact:true}).click();await ready();await home();
  await page.getByRole('button',{name:'Discard Alpha plan',exact:true}).click();const ask=page.locator('dialog.discard-unsaved');await ask.getByRole('button',{name:'Keep it',exact:true}).click();await expect(page.getByRole('button',{name:'Continue Alpha plan',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Discard Alpha plan',exact:true}).click();await ask.getByRole('button',{name:'Discard',exact:true}).click();await expect(page.getByRole('button',{name:'Continue Alpha plan',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Files',exact:true}).first().click();await home();await expect(page.getByRole('button',{name:'Continue Alpha plan',exact:true})).toHaveCount(0);
 });
 await close();
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}try{await close();}catch{}}
finally{await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});await fs.rm(work,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,checks:report.checks.map(c=>c.name),failures:report.failures,errors:report.errors.slice(0,3),error:report.error},null,1));process.exit(report.pass?0:1);
