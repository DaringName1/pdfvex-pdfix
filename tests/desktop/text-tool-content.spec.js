import {chooseDocumentMode} from '../../scripts/user-robot/document-mode.mjs';
import {test,expect,_electron as electron} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';
// Text tool, Click to type and Edit existing (2.18): both work on the open PDF page through the Edit PDF text editor,
// with its options beside the page - no window and no second copy of the PDF.
let app,page,root;const errors=[],slow={timeout:process.env.CI?120000:60000};
test.describe.configure({timeout:process.env.CI?240000:120000});
test.beforeEach(async({},info)=>{root=path.resolve('.test-data',`text-tool-${info.workerIndex}-${Date.now()}`);await fs.mkdir(root,{recursive:true});errors.length=0;
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}});page=await app.firstWindow({timeout:process.env.CI?90000:30000});page.on('pageerror',e=>errors.push(e.message));await page.waitForLoadState('domcontentloaded');});
test.afterEach(async()=>{await app?.evaluate(({app})=>app.exit(0)).catch(()=>{});await app?.close().catch(()=>{});await fs.rm(root,{recursive:true,force:true}).catch(()=>{});});

test('Click to type adds text where clicked and Edit existing opens the clicked line, on the main page',async()=>{
 const file=path.join(root,'sample.pdf');await fs.copyFile('tests/fixtures/reading-sample.pdf',file);await app.evaluate(({dialog},f)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});},file);
 await page.getByRole('button',{name:'Open a file',exact:true}).first().click();const paper=page.locator('.document-area .pdf-paper').first();await expect(paper).toHaveAttribute('data-ready','true',slow);
 await chooseDocumentMode(page,'build');await page.getByRole('button',{name:'Add text',exact:true}).first().click();const methods=page.getByRole('radiogroup',{name:'Text method'});
 await expect(methods.getByRole('radio',{name:'Click to type'})).toHaveAttribute('aria-checked','true',slow);await expect(page.getByRole('region',{name:'Edit PDF text options'})).toBeVisible();
 expect(await page.locator('dialog[open]').count(),'no window opens').toBe(0);expect(await page.locator('.pdf-paper').count(),'no second copy of the page').toBe(1);
 const box=await paper.boundingBox();await paper.click({position:{x:box.width*0.3,y:box.height*0.8},force:true});
 const added=page.getByRole('textbox',{name:'Added PDF text'});await expect(added).toBeFocused();await page.keyboard.type('Checked on site');await expect(added).toHaveValue('Checked on site');
 await expect(paper.locator('.content-frame')).toHaveCount(1);
 await methods.getByRole('radio',{name:'Edit existing'}).click();await expect(methods.getByRole('radio',{name:'Edit existing'})).toHaveAttribute('aria-checked','true');
 await paper.locator('.textLayer span').filter({hasText:'This is a synthetic PDF fixture'}).first().click();
 const replace=page.getByRole('textbox',{name:'Replace original PDF text'});await expect(replace).toBeFocused();await expect(replace).toHaveValue(/This is a synthetic PDF fixture/);
 await expect(paper.locator('.content-frame')).toHaveCount(1);expect(await page.locator('dialog[open]').count()).toBe(0);
 await chooseDocumentMode(page,'view');await expect(page.getByRole('region',{name:'Edit PDF text options'})).toBeHidden();await paper.click({position:{x:box.width*0.5,y:box.height*0.9},force:true}).catch(()=>{});await expect(paper.locator('.content-frame')).toHaveCount(1);
 expect(errors).toEqual([]);
});
