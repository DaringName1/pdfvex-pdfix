import {test,expect,_electron as electron} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';import {inspectPdf} from '../../scripts/user-robot/verify.mjs';
// Fill and sign, click and type (owner, October 18): a click on the page opens a typing box right there; Enter places
// the text. With a typed signature name, the first click asks for the name and later clicks place it at once.
let app,page,root;const errors=[],slow={timeout:process.env.CI?120000:60000};
test.describe.configure({timeout:process.env.CI?240000:120000});
test.beforeEach(async({},info)=>{root=path.resolve('.test-data',`click-type-${info.workerIndex}-${Date.now()}`);await fs.mkdir(root,{recursive:true});errors.length=0;
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}});page=await app.firstWindow({timeout:process.env.CI?90000:30000});page.on('pageerror',e=>errors.push(e.message));await page.waitForLoadState('domcontentloaded');});
test.afterEach(async()=>{await app?.evaluate(({app})=>app.exit(0)).catch(()=>{});await app?.close().catch(()=>{});await fs.rm(root,{recursive:true,force:true}).catch(()=>{});});

test('click on the page and type: text and a typed signature are placed where clicked and saved',async()=>{
 const file=path.join(root,'form.pdf'),dest=path.join(root,'form-filled.pdf');await fs.copyFile('tests/fixtures/reading-sample.pdf',file);
 await app.evaluate(({dialog},[f,d])=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});dialog.showSaveDialog=async()=>({canceled:false,filePath:d});},[file,dest]);
 await page.getByRole('button',{name:/^Fill and sign/}).first().click();const d=page.locator('dialog[open], .form-workspace.reader-page-tool-options').last();await d.waitFor(slow);
 const kind=d.getByRole('combobox',{name:'Placement kind'});if(!await kind.isVisible().catch(()=>false))await d.getByText('Add a visual placement',{exact:true}).click();
 const sheet=page.getByLabel(/^Rendered PDF page [0-9]+$/).first();await sheet.waitFor(slow);await expect(d.locator('.form-status')).toContainText(/fields found|Select a field/,slow);const at=async(fy,fx=0.15)=>{await sheet.evaluate((el,fy)=>{let p=el.parentElement;while(p&&!(p.scrollHeight>p.clientHeight+2&&/(auto|scroll)/.test(getComputedStyle(p).overflowY)))p=p.parentElement;if(!p)return;const r=el.getBoundingClientRect(),pr=p.getBoundingClientRect();p.scrollTop+=r.top+r.height*fy-(pr.top+pr.height/2);},fy);await page.waitForTimeout(150);const b=await sheet.boundingBox();return [b.x+b.width*fx,b.y+b.height*fy];};
 await kind.selectOption({label:'Text'});await page.mouse.click(...await at(0.55));
 const typing=page.getByRole('textbox',{name:'Text to place here'});await expect(typing).toBeFocused();await page.keyboard.type('Approved by site lead');await page.keyboard.press('Enter');
 await expect(typing).toHaveCount(0);await expect(d.locator('.placement-list')).toContainText('text · page 1');
 await kind.selectOption({label:'Signature'});await d.getByRole('combobox',{name:'Signature method'}).selectOption({label:'Type'});await d.getByRole('textbox',{name:'Placement text',exact:true}).fill('');
 await page.mouse.click(...await at(0.75));const name=page.getByRole('textbox',{name:'Name to sign here'});await expect(name).toBeFocused();await page.keyboard.type('Robin Site');await page.keyboard.press('Enter');
 await page.mouse.click(...await at(0.75,0.55));await expect(page.getByRole('textbox',{name:'Name to sign here'})).toHaveCount(0);
 await expect(d.locator('.placement-list').getByText(/signature · page 1/)).toHaveCount(2);
 await kind.selectOption({label:'Text'});await page.mouse.click(...await at(0.35,0.6));await page.keyboard.type('never placed');await page.keyboard.press('Escape');await expect(d.locator('.placement-list').getByText(/text · page 1/)).toHaveCount(1);
 await d.getByRole('button',{name:'Preview filled copy',exact:true}).click();const save=d.getByRole('button',{name:'Save filled copy',exact:true});await save.waitFor(slow);
 await expect(async()=>{for(const check of await d.getByRole('checkbox',{name:/checked|reviewed|confirm/i}).all())if(await check.isVisible()&&await check.isEnabled()&&!await check.isChecked())await check.check();expect(await save.isEnabled()).toBe(true);}).toPass(slow);
 await save.click();await expect(page.getByText(/Saved.*form-filled\.pdf/).first()).toBeVisible(slow);
 const info=await inspectPdf(dest);expect(info.ok).toBe(true);expect(info.text).toContain('Approved by site lead');expect(info.text.split('Robin Site').length-1).toBeGreaterThanOrEqual(1);expect(info.text).not.toContain('never placed');expect(errors).toEqual([]);
});
