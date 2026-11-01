// Hidden, scoped check of the alignment buttons: each applies its alignment, shows as pressed, follows the cursor,
// agrees with the Ctrl+Shift shortcuts, and is one Undo step.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
const output=path.resolve('tmp/document-align-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Align-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'Two paragraphs in a new document. Headings, tables and narrow windows were not exercised.'};
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'}),button=name=>page.getByRole('button',{name,exact:true}),paragraphs=editor.locator('p');
 await check('each button aligns the paragraph and shows as pressed',async()=>{
  await page.getByRole('button',{name:'New document',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});
  await editor.pressSequentially('First paragraph');await editor.press('Enter');await editor.pressSequentially('Second paragraph');await page.waitForTimeout(600);
  await expect(button('Align left')).toHaveAttribute('aria-pressed','true');
  for(const [name,value] of [['Center','center'],['Align right','right'],['Justify','justify']]){await button(name).click();await expect(paragraphs.nth(1)).toHaveAttribute('data-pdfix-align',value);await expect(button(name)).toHaveAttribute('aria-pressed','true');await expect(button('Align left')).toHaveAttribute('aria-pressed','false');}
  await page.screenshot({path:path.join(output,'buttons.png')});await page.locator('.document-align-buttons').screenshot({path:path.join(output,'buttons-close.png')});
  report.pressedLook=await page.locator('.document-align-button').evaluateAll(list=>list.map(b=>{const s=getComputedStyle(b);return {label:b.getAttribute('aria-label'),pressed:b.getAttribute('aria-pressed'),background:s.backgroundColor,border:s.borderColor};}));
  const look=report.pressedLook,on=look.find(b=>b.pressed==='true'),off=look.find(b=>b.pressed==='false');if(!on||on.background===off.background&&on.border===off.border)throw new Error('The pressed button looks the same as the others: '+JSON.stringify(look));
  const box=await page.locator('.document-align-buttons').boundingBox();report.buttonsBox=box;if(!box||box.width<100||box.height<24)throw new Error('Buttons measure '+JSON.stringify(box));
 });
 await check('the pressed button follows the cursor and the shortcut',async()=>{
  await paragraphs.nth(0).click();await page.waitForTimeout(400);await expect(button('Align left')).toHaveAttribute('aria-pressed','true');await expect(button('Justify')).toHaveAttribute('aria-pressed','false');
  await editor.press('Control+r');await expect(paragraphs.nth(0)).toHaveAttribute('data-pdfix-align','right');await editor.press('Control+Shift+e');await expect(paragraphs.nth(0)).toHaveAttribute('data-pdfix-align','center');await expect(button('Center')).toHaveAttribute('aria-pressed','true');
 });
 await check('each alignment change is one Undo step',async()=>{
  await editor.press('Control+z');await expect(paragraphs.nth(0)).toHaveAttribute('data-pdfix-align','right');await editor.press('Control+z');await expect(paragraphs.nth(0)).not.toHaveAttribute('data-pdfix-align','right');await expect(paragraphs.nth(1)).toHaveAttribute('data-pdfix-align','justify');
  await editor.press('Control+z');await expect(paragraphs.nth(1)).toHaveAttribute('data-pdfix-align','right');await expect(editor).toContainText('Second paragraph');
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds.'});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
