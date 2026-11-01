import {test,expect,_electron as electron} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';
// Print straight from the document editor: Ctrl+P and the Print button prepare the document's pages with its page
// setup and hand them to the same print preparation as PDFs. The Windows print call is replaced by a counter.
let app,page,root;const errors=[];
test.beforeEach(async({},info)=>{root=path.resolve('.test-data',`doc-print-${info.workerIndex}-${Date.now()}`);await fs.mkdir(root,{recursive:true});errors.length=0;
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}});page=await app.firstWindow({timeout:process.env.CI?90000:30000});page.on('pageerror',e=>errors.push(e.message));await page.waitForLoadState('domcontentloaded');
 await app.evaluate(({BrowserWindow})=>{globalThis.printCalls=0;BrowserWindow.getAllWindows()[0].webContents.print=(_o,cb)=>{globalThis.printCalls++;setTimeout(()=>cb(true),150);};});});
test.afterEach(async()=>{await app?.evaluate(({app})=>app.exit(0)).catch(()=>{});await app?.close().catch(()=>{});});
test.describe.configure({timeout:process.env.CI?240000:120000});
const slow={timeout:process.env.CI?120000:60000};
async function newDocument(lines){await page.getByRole('button',{name:'New document',exact:true}).first().click();const editor=page.getByRole('textbox',{name:'Editable document'});await editor.waitFor();await editor.click();for(const [i,line] of lines.entries()){if(i)await page.keyboard.press('Enter');await page.keyboard.type(line);}return editor;}
test('Ctrl+P prints the document once through print preparation, without saving a file',async()=>{
 await newDocument(['Print check heading','A second line to print.']);await page.keyboard.press('Control+p');
 const print=page.locator('.pdf-print-workspace');await expect(print).toBeVisible(slow);await print.getByRole('button',{name:/^(Prepare preview|Refresh preview)$/}).click();
 await print.getByRole('button',{name:'Print',exact:true}).click();
 await expect.poll(()=>app.evaluate(()=>globalThis.printCalls),slow).toBe(1);
 expect((await fs.readdir(root)).filter(n=>/\.(pdf|docx)$/i.test(n))).toEqual([]);expect(errors).toEqual([]);
});
test('the Print button opens print preparation; closing it leaves the document editable',async()=>{
 const editor=await newDocument(['Before printing']);await page.getByRole('button',{name:'Print',exact:true}).click();
 const print=page.locator('.pdf-print-workspace');await expect(print).toBeVisible(slow);
 await print.getByRole('button',{name:/^Close/}).first().click();await expect(print).toHaveCount(0);
 for(let i=0;i<5&&await page.locator('dialog[open]').count();i++){await page.keyboard.press('Escape');await page.waitForTimeout(300);}
 await editor.click();await page.keyboard.press('Control+End');await page.keyboard.type(' and after');await expect(editor).toContainText('Before printing and after');
 expect(await app.evaluate(()=>globalThis.printCalls)).toBe(0);expect(errors).toEqual([]);
});
