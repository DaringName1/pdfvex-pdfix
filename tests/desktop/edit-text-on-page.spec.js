import {test,expect,_electron as electron} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';import {openTool} from '../helpers/open-tool.js';
// Edit PDF text on the page (owner, October 18): clicking a line of the PDF's own text opens it for changing, and a
// click on blank space starts new text at that spot. Selecting text does neither.
let app,page,root;const errors=[],slow={timeout:process.env.CI?120000:60000};
test.describe.configure({timeout:process.env.CI?240000:120000});
test.beforeEach(async({},info)=>{root=path.resolve('.test-data',`edit-on-page-${info.workerIndex}-${Date.now()}`);await fs.mkdir(root,{recursive:true});errors.length=0;
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}});page=await app.firstWindow({timeout:process.env.CI?90000:30000});page.on('pageerror',e=>errors.push(e.message));await page.waitForLoadState('domcontentloaded');});
test.afterEach(async()=>{await app?.evaluate(({app})=>app.exit(0)).catch(()=>{});await app?.close().catch(()=>{});await fs.rm(root,{recursive:true,force:true}).catch(()=>{});});

test('click a line on the page to change it; click blank space to add text there',async()=>{
 const file=path.join(root,'sample.pdf');await fs.copyFile('tests/fixtures/reading-sample.pdf',file);await app.evaluate(({dialog},f)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});},file);
 await openTool(page,/^Edit PDF text and images/,'Edit PDF text and images');const d=page.getByRole('region',{name:'Edit PDF text options',exact:true}).or(page.locator('dialog[open]')).last();await d.getByRole('button',{name:'Add text',exact:true}).waitFor(slow);
 const paper=page.locator('.pdf-paper').first();await expect(paper).toHaveAttribute('data-ready','true',slow);const line=paper.locator('.textLayer span').filter({hasText:'This is a synthetic PDF fixture'}).first();await line.waitFor(slow);
 await line.click();const replace=d.getByRole('textbox',{name:'Replace original PDF text'});await expect(replace).toBeFocused();await expect(replace).toHaveValue(/This is a synthetic PDF fixture/);
 const box=await paper.boundingBox();await paper.click({position:{x:box.width*0.3,y:box.height*0.75},force:true});
 const added=d.getByRole('textbox',{name:'Added PDF text'});await expect(added).toBeFocused();await expect(added).toHaveValue('Your text');await page.keyboard.type('Checked on site');await expect(added).toHaveValue('Checked on site');
 const frame=paper.locator('.content-frame').first();await expect(frame).toBeVisible();const placed=await frame.boundingBox(),now=await paper.boundingBox();expect(Math.abs(placed.y-(now.y+now.height*0.72))).toBeLessThan(now.height*0.06);
 expect(errors).toEqual([]);
});
