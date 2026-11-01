// Hidden, scoped check of document tabs: open a PDF, a DOCX and a new document, switch between them with the
// mouse and Ctrl+Tab, keep unsaved edits across switches, close tabs, and drop a tab whose file was deleted.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
const output=path.resolve('tmp/workspace-tabs-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Shell-')),work=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Files-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'Scoped tab checks with one PDF, one DOCX and one new document. Large files, ten-tab overflow, tools opened from a tab and tab order after restarts were not exercised.'};
const pdf=path.join(work,'Reading sample.pdf'),docx=path.join(work,'Editing sample.docx');await fs.copyFile('tests/fixtures/reading-sample.pdf',pdf);await fs.copyFile('tests/fixtures/editing-sample.docx',docx);
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
const ready=()=>page.locator('.document-area[data-ready="true"],.pdf-paper[data-ready="true"]').first().waitFor({timeout:45000});
const tabs=()=>page.locator('.document-tabs .document-tab-open').evaluateAll(list=>list.map(item=>item.textContent.trim()+(item.getAttribute('aria-current')==='page'?' *':'')));
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const open=async file=>{await page.getByRole('button',{name:'Home',exact:true}).first().click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).click();await ready();};
 const editor=page.getByRole('textbox',{name:'Editable document'}),tab=name=>page.locator('.document-tabs .document-tab-open').filter({hasText:name});
 await check('one tab per opened document, the newest active',async()=>{
  await open(pdf);await expect(page.locator('.document-tabs')).toHaveCount(0);await open(docx);await page.getByRole('button',{name:'Home',exact:true}).first().click();await page.getByRole('button',{name:'New document',exact:true}).click();await ready();
  report.afterOpening=await tabs();if(JSON.stringify(report.afterOpening)!==JSON.stringify(['PDFReading sample.pdf','DOCXEditing sample.docx','DOCXUntitled document *']))throw new Error('Tabs are '+JSON.stringify(report.afterOpening));await page.screenshot({path:path.join(output,'tabs.png')});
 });
 await check('switching by click keeps unsaved edits in each document',async()=>{
  await editor.pressSequentially('Draft words in the new document');await expect(page.locator('.draft-status')).toHaveText('Recovery draft saved locally',{timeout:10000});
  await tab('Editing sample.docx').click();await ready();await expect(editor).toContainText('Project notes');await editor.press('Control+End');await editor.pressSequentially(' plus a DOCX edit');await expect(page.locator('.draft-status')).toHaveText('Recovery draft saved locally',{timeout:10000});
  await tab('Reading sample.pdf').click();await page.locator('.pdf-paper[data-ready="true"]').first().waitFor({timeout:45000});await expect(page.locator('.document-title b')).toHaveText('Reading sample.pdf');
  await tab('Untitled document').click();await ready();await expect(editor).toContainText('Draft words in the new document');await tab('Editing sample.docx').click();await ready();await expect(editor).toContainText('plus a DOCX edit');report.afterSwitching=await tabs();
 });
 await check('Ctrl+Tab and Ctrl+Shift+Tab move through the tabs in order',async()=>{
  await page.keyboard.press('Control+Tab');await ready();await expect(tab('Untitled document')).toHaveAttribute('aria-current','page');await page.keyboard.press('Control+Tab');await page.locator('.pdf-paper[data-ready="true"]').first().waitFor({timeout:45000});await expect(tab('Reading sample.pdf')).toHaveAttribute('aria-current','page');
  await page.keyboard.press('Control+Shift+Tab');await ready();await expect(tab('Untitled document')).toHaveAttribute('aria-current','page');
 });
 await check('closing an inactive tab removes it; closing the active one moves to its neighbour',async()=>{
  await page.getByRole('button',{name:'Close Reading sample.pdf',exact:true}).click();await expect(tab('Reading sample.pdf')).toHaveCount(0);await expect(tab('Untitled document')).toHaveAttribute('aria-current','page');
  await page.getByRole('button',{name:'Close Untitled document',exact:true}).click();await ready();await expect(tab('Untitled document')).toHaveCount(0);await expect(page.locator('.document-title b')).toHaveText('Editing sample.docx');await expect(page.locator('.document-tabs')).toHaveCount(0);
  await page.getByRole('button',{name:'Home',exact:true}).first().click();await page.getByRole('button',{name:'Continue Untitled document',exact:true}).click();await ready();await expect(page.locator('.draft-status')).toHaveText('Recovered local draft');await expect(editor).toContainText('Draft words in the new document');
 });
 await check('a tab whose file was deleted is dropped with a message instead of failing again',async()=>{
  await open(pdf);report.beforeDelete=await tabs();await fs.rm(docx);await tab('Editing sample.docx').click();await page.waitForTimeout(2000);report.deleteMessage=(await page.locator('#toast').textContent().catch(()=>'')).slice(0,200);report.afterDelete=await tabs();
  if(report.afterDelete.some(item=>item.includes('Editing sample.docx')))throw new Error('The tab of the deleted file is still there: '+JSON.stringify(report.afterDelete));if(!/no longer where it was opened/i.test(report.deleteMessage))throw new Error('Message was: '+report.deleteMessage);
  await expect(page.locator('.document-title b')).not.toHaveText('Editing sample.docx');
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds: '+await page.locator('#toast').textContent().catch(()=>'')});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});await fs.rm(work,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
