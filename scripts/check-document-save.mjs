// Hidden check of saving over the opened file: a text file saves in place with Ctrl+S; a Word-style DOCX asks first
// (Cancel and Save a copy leave the file alone, Replace saves) and then reopens with the edit; a file changed by
// another program is not overwritten; a backup of the previous bytes is kept; new documents still save a copy.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {randomUUID,createHash} from 'node:crypto';
import * as docx from 'docx';
const output=path.resolve('tmp/document-save-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Save-')),work=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-SaveFiles-'));
await fs.mkdir(output,{recursive:true});const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'One TXT and one generated DOCX on a local disk. Files open in Word at the same time, network drives and RTF were not exercised.'};
const txt=path.join(work,'Notes.txt'),word=path.join(work,'Report.docx');await fs.writeFile(txt,'Original notes.');
await fs.writeFile(word,await docx.Packer.toBuffer(new docx.Document({sections:[{children:[new docx.Paragraph('Report body from Word.')]}]})));
const hash=async file=>createHash('sha256').update(await fs.readFile(file)).digest('hex');
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message.slice(0,600)});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:process.env.CI?90000:30000});page=await app.firstWindow({timeout:process.env.CI?90000:30000});page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'}),ready=()=>page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});
 const open=async file=>{await page.getByRole('button',{name:'Home',exact:true}).first().click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).click();await ready();};
 const backups=async()=>{const root=path.join(profile,'backups');const folders=await fs.readdir(root).catch(()=>[]);return (await Promise.all(folders.map(async folder=>(await fs.readdir(path.join(root,folder))).map(item=>path.join(root,folder,item))))).flat();};
 await check('a text file saves over itself with Ctrl+S and keeps a backup',async()=>{
  await open(txt);await expect(page.getByRole('button',{name:'Save',exact:true})).toBeVisible();await editor.press('Control+End');await editor.pressSequentially(' Added line.');
  await editor.press('Control+s');await expect(page.locator('#toast')).toContainText('Saved Notes.txt',{timeout:30000});report.txtAfter=(await fs.readFile(txt,'utf8')).slice(0,200);
  if(!report.txtAfter.includes('Original notes. Added line.'))throw new Error('File now holds: '+report.txtAfter);const kept=await backups();if(!kept.length||await fs.readFile(kept[0],'utf8')!=='Original notes.')throw new Error('Backups: '+JSON.stringify(kept));
  await expect(page.locator('.draft-status')).toHaveText(/Saved/);
  // The backup can be saved as a copy from Version history; the current file stays as saved.
  await page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name:'File',exact:true}).click();await page.getByRole('button',{name:'Version history',exact:true}).click();const history=page.locator('dialog.version-history');
  await expect(history.locator('.backup-row')).toHaveCount(1);const restored=path.join(work,'Notes restored.txt');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},restored);
  await history.getByRole('button',{name:/^Save the backup from .* as a copy$/}).click();await expect(history.locator('.version-status')).toContainText('Saved Notes restored.txt');if(await fs.readFile(restored,'utf8')!=='Original notes.')throw new Error('Restored copy holds: '+await fs.readFile(restored,'utf8'));if(!(await fs.readFile(txt,'utf8')).includes('Added line.'))throw new Error('The current file changed');
  await history.getByRole('button',{name:'Close version history'}).click();
 });
 await check('a Word-made DOCX asks first; Cancel and Save a copy leave it alone; Replace saves and it reopens with the edit',async()=>{
  const before=await hash(word);await open(word);await editor.press('Control+End');await editor.pressSequentially(' Edited in PDFix.');await page.waitForTimeout(600);
  await page.getByRole('button',{name:'Save',exact:true}).click();const ask=page.locator('dialog.replace-original');await expect(ask).toContainText('Replace Report.docx?');await ask.getByRole('button',{name:'Cancel',exact:true}).click();await expect(ask).toHaveCount(0);if(await hash(word)!==before)throw new Error('Cancel changed the file');
  const copy=path.join(work,'Report copy.docx');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},copy);
  await page.getByRole('button',{name:'Save',exact:true}).click();await ask.getByRole('button',{name:'Save a copy instead',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved Report copy.docx',{timeout:45000});if(await hash(word)!==before)throw new Error('Save a copy changed the original');
  await page.getByRole('button',{name:'Save',exact:true}).click();await ask.getByRole('button',{name:'Replace the file',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved Report.docx',{timeout:45000});if(await hash(word)===before)throw new Error('Replace did not change the file');
  await editor.press('Control+End');await editor.pressSequentially(' Second edit.');await page.waitForTimeout(600);await expect(page.locator('.draft-status')).toHaveText('Recovery draft saved locally',{timeout:10000});await editor.press('Control+s');await expect(page.locator('.draft-status')).toHaveText('Saved',{timeout:45000});await expect(page.locator('dialog.replace-original')).toHaveCount(0);
  await open(word);await expect(editor).toContainText('Edited in PDFix. Second edit.');await expect(page.locator('.draft-status')).not.toContainText('Recovered');
 });
 await check('a file changed by another program is not overwritten',async()=>{
  await open(txt);await fs.writeFile(txt,'Changed in Notepad.');await editor.press('Control+End');await editor.pressSequentially(' More.');await editor.press('Control+s');
  await expect(page.locator('#toast')).toContainText('changed by another program',{timeout:30000});if(await fs.readFile(txt,'utf8')!=='Changed in Notepad.')throw new Error('The externally changed file was overwritten');
 });
 await check('a new document saves through the Save dialog once, then becomes that file',async()=>{
  await page.getByRole('button',{name:'Home',exact:true}).first().click();await page.getByRole('button',{name:'New document',exact:true}).click();await ready();await expect(page.getByRole('button',{name:'Save',exact:true})).toBeVisible();
  await editor.pressSequentially('Fresh text');await page.waitForTimeout(600);const fresh=path.join(work,'Fresh.docx');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},fresh);await editor.press('Control+s');
  // The saved copy becomes the open document: its tab replaces the new-document tab and Save now goes back to it.
  await expect(page.locator('.document-title b')).toHaveText('Fresh.docx',{timeout:45000});await ready();await expect(page.locator('#toast')).toContainText('Save now goes back to this file');await expect(page.getByRole('button',{name:'Save',exact:true})).toBeVisible();await expect(editor).toContainText('Fresh text');
  await editor.press('Control+End');await editor.pressSequentially(' and more');await expect(page.locator('.draft-status')).toHaveText('Recovery draft saved locally',{timeout:10000});await editor.press('Control+s');await expect(page.locator('.draft-status')).toHaveText('Saved',{timeout:45000});await expect(page.locator('dialog.replace-original')).toHaveCount(0);
  await page.getByRole('button',{name:'Home',exact:true}).first().click();await page.getByRole('button',{name:'New document',exact:true}).click();await ready();report.newAfterSave=(await editor.textContent()).slice(0,80);if(report.newAfterSave.includes('Fresh text'))throw new Error('The saved draft came back as the new document: '+report.newAfterSave);
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(r=>setTimeout(()=>r(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'did not close in 15 s'});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});await fs.rm(work,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,checks:report.checks.map(c=>c.name),failures:report.failures,errors:report.errors.slice(0,3),error:report.error},null,1));process.exit(report.pass?0:1);
