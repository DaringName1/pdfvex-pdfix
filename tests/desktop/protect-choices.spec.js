import {test,expect,_electron as electron} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';import {openTool} from '../helpers/open-tool.js';import {PDFDocument} from 'pdf-lib';
// Protect, three choices (owner, October 21): each choice shows only the boxes it needs, and "Password to open" makes
// a copy that cannot be opened without that one password.
let app,page,root;const errors=[],slow={timeout:process.env.CI?120000:60000};
test.describe.configure({timeout:process.env.CI?240000:120000});
test.beforeEach(async({},info)=>{root=path.resolve('.test-data',`protect-choices-${info.workerIndex}-${Date.now()}`);await fs.mkdir(root,{recursive:true});errors.length=0;
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}});page=await app.firstWindow({timeout:process.env.CI?90000:30000});page.on('pageerror',e=>errors.push(e.message));await page.waitForLoadState('domcontentloaded');});
test.afterEach(async()=>{await app?.evaluate(({app})=>app.exit(0)).catch(()=>{});await app?.close().catch(()=>{});await fs.rm(root,{recursive:true,force:true}).catch(()=>{});});

test('each choice shows only its boxes; a password-to-open copy needs exactly that password',async()=>{
 const file=path.join(root,'sample.pdf'),dest=path.join(root,'sample-protected.pdf');await fs.copyFile('tests/fixtures/reading-sample.pdf',file);
 await app.evaluate(({dialog},[f,d])=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});dialog.showSaveDialog=async()=>({canceled:false,filePath:d});},[file,dest]);
 await openTool(page,/^Protect or unlock a PDF/,'Protect or unlock a PDF');const d=page.locator('dialog[open]').last();await d.waitFor(slow);
 if(!await d.getByRole('radio',{name:/^Password to open/}).isVisible().catch(()=>false))await d.getByText('Passwords and permissions',{exact:true}).click();
 const visible=async name=>d.getByRole('textbox',{name,exact:true}).isVisible();
 await expect(d.getByRole('radio',{name:/^Password to open/})).toBeChecked();expect(await visible('New opening password')).toBe(true);expect(await visible('New owner password')).toBe(false);await expect(d.getByRole('checkbox',{name:'Allow printing'})).toBeHidden();
 await d.getByRole('radio',{name:/^Limit printing/}).check();expect(await visible('New opening password')).toBe(false);expect(await visible('New owner password')).toBe(true);await expect(d.getByRole('checkbox',{name:'Allow printing'})).toBeVisible();
 await d.getByRole('radio',{name:/^Both/}).check();expect(await visible('New opening password')).toBe(true);expect(await visible('New owner password')).toBe(true);
 await d.getByRole('radio',{name:/^Password to open/}).check();for(const name of ['New opening password','Confirm opening password'])await d.getByRole('textbox',{name,exact:true}).fill('Open-example-741');
 const build=d.getByRole('button',{name:/^Build/}).first();await build.click();const save=d.getByRole('button',{name:/^Save verified PDF copy/});
 await expect(async()=>{for(const check of await d.getByRole('checkbox',{name:/checked/i}).all())if(await check.isVisible()&&await check.isEnabled()&&!await check.isChecked())await check.check();expect(await save.isEnabled()).toBe(true);}).toPass(slow);
 await save.click();await expect.poll(()=>fs.stat(dest).then(s=>s.size,()=>0),slow).toBeGreaterThan(500);
 await expect(PDFDocument.load(await fs.readFile(dest))).rejects.toThrow(/encrypt/i);expect(errors).toEqual([]);
});
