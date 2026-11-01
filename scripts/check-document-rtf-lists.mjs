// Hidden, scoped check: a bulleted list with a nested numbered list, made with the toolbar and Tab, survives an RTF
// copy and reopen as lists rather than paragraphs with typed bullets.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
const output=path.resolve('tmp/document-rtf-lists-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-RtfLists-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'One two-level list. RTF files from WordPad or LibreOffice were not exercised.'};
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'}),rtf=path.join(profile,'lists.rtf');
 await check('a nested list survives an RTF copy and reopen',async()=>{
  await page.getByRole('button',{name:'New document',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});
  await editor.pressSequentially('Shopping');await editor.press('Enter');await page.getByRole('button',{name:'Bulleted list',exact:true}).click();
  await editor.pressSequentially('Apples');await editor.press('Enter');await editor.press('Tab');await page.getByRole('button',{name:'Numbered list',exact:true}).click();await editor.pressSequentially('Green');await editor.press('Enter');await editor.pressSequentially('Red');
  await editor.press('Enter');await editor.press('Shift+Tab');await editor.pressSequentially('Pears');
  report.before=await editor.evaluate(el=>el.innerHTML.replace(/ [a-z-]+="[^"]*"/g,'').slice(0,600));
  await expect(editor.locator('ul > li')).toHaveCount(2);await expect(editor.locator('ul > li ol > li')).toHaveCount(2);
  await expect(page.locator('.draft-status')).toHaveText('Recovery draft saved locally',{timeout:10000});
  await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},rtf);await page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name:'File',exact:true}).click();await page.getByRole('button',{name:'Export RTF copy',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved lists.rtf',{timeout:45000});
  await page.getByRole('button',{name:'Home',exact:true}).first().click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},rtf);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});
  report.after=await editor.evaluate(el=>el.innerHTML.replace(/ [a-z-]+="[^"]*"/g,'').slice(0,600));
  await expect(editor.locator('ul > li')).toHaveCount(2);await expect(editor.locator('ul > li ol > li')).toHaveText(['Green','Red']);await expect(editor.locator('ul > li').nth(1)).toContainText('Pears');
  if(/•|•/.test(await editor.textContent()))throw new Error('A typed bullet was left in the text: '+report.after);
  await page.screenshot({path:path.join(output,'reopened.png')});
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds.'});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
