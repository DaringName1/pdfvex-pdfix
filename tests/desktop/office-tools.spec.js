import {test,expect,_electron as electron} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
// Edit a workbook and Edit slide text on files shaped like real Excel and PowerPoint output
// (tests/helpers/office-realistic-fixture.cjs): open, change, save a copy, check the saved file independently with
// PDFix's own readers, check the original is unchanged, then reopen the copy in the app.
const require=createRequire(import.meta.url),{readWorkbook}=require('../../desktop/workbook-codec.cjs'),{readPresentation}=require('../../desktop/presentation-codec.cjs');
let app,page,root;const errors=[];
async function launch(){app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}});page=await app.firstWindow({timeout:process.env.CI?90000:30000});page.on('pageerror',e=>errors.push(e.message));await page.waitForLoadState('domcontentloaded');}
async function files(open,save){await app.evaluate(({dialog},[o,s])=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[o]});dialog.showSaveDialog=async()=>({canceled:false,filePath:s});},[open,save]);}
async function saved(file){await expect.poll(()=>fs.stat(file).then(s=>s.size,()=>0),{timeout:process.env.CI?120000:60000}).toBeGreaterThan(100);}
test.beforeEach(async({},info)=>{root=path.resolve('.test-data',`office-${info.workerIndex}-${Date.now()}`);await fs.mkdir(root,{recursive:true});errors.length=0;await launch();});
test.afterEach(async()=>{await app?.close().catch(()=>{});});

test('a workbook shaped like Excel output opens, a value is changed and saved as a copy that keeps formulas, sheets and the original',async()=>{
 const source=path.join(root,'Parts order.xlsx'),dest=path.join(root,'Parts order edited.xlsx');await fs.copyFile('tests/fixtures/robot-workbook.xlsx',source);const original=await fs.readFile(source);
 await files(source,dest);await page.getByRole('button',{name:'Open a file',exact:true}).click();
 const tabs=page.getByRole('tablist',{name:'Workbook sheets'});await expect(tabs.getByRole('tab')).toHaveCount(2,{timeout:60000});await expect(tabs).toContainText('Parts');await expect(tabs).toContainText('Notes');
 await expect(page.getByText('Ready',{exact:true})).toBeVisible({timeout:60000});const address=page.getByLabel('Cell address',{exact:true});await address.fill('B2');await page.getByRole('button',{name:'Go',exact:true}).click();
 const value=page.getByLabel('Selected cell value',{exact:true});await expect(value).toHaveValue('120');await value.fill('150');await page.getByRole('button',{name:'Apply value',exact:true}).click();
 const saveXlsx=page.getByRole('button',{name:'Save XLSX copy',exact:true});await expect(page.getByRole('checkbox',{name:'I checked my changes'})).toHaveCount(0);await expect(saveXlsx).toBeEnabled();await saveXlsx.click();await saved(dest);
 const book=readWorkbook(new Uint8Array(await fs.readFile(dest))).model,cell=ref=>book.sheets[0].cells.find(c=>c.ref===ref);
 expect(book.sheets.map(s=>s.name)).toEqual(['Parts','Notes']);expect(cell('B2').value).toBe('150');expect(cell('A2').value).toBe('Bolts M8');
 expect(cell('D2').formula).toBe('B2*C2');expect(cell('D10').formula).toBe('SUM(D2:D9)');expect(book.sheets[1].cells.find(c=>c.ref==='A2').value).toMatch(/north gate/);
 expect((await fs.readFile(source)).equals(original)).toBe(true);
 await page.getByRole('button',{name:'Back to Home'}).click();await files(dest,path.join(root,'unused.xlsx'));await page.getByRole('button',{name:'Open a file',exact:true}).click();
 await expect(page.getByRole('tablist',{name:'Workbook sheets'}).getByRole('tab')).toHaveCount(2,{timeout:60000});await expect(page.getByText('Ready',{exact:true})).toBeVisible({timeout:60000});const again=page.getByLabel('Cell address',{exact:true});await again.fill('B2');await page.getByRole('button',{name:'Go',exact:true}).click();await expect(page.getByLabel('Selected cell value',{exact:true})).toHaveValue('150');
 expect(errors).toEqual([]);
});

test('slides shaped like PowerPoint output open, one bullet is changed and saved as a copy that keeps the other slides, theme and the original',async()=>{
 const source=path.join(root,'Site visit.pptx'),dest=path.join(root,'Site visit edited.pptx');await fs.copyFile('tests/fixtures/robot-slides.pptx',source);const original=await fs.readFile(source);
 await files(source,dest);await page.getByRole('button',{name:'Open a file',exact:true}).click();
 const run=page.getByLabel('Slide text run',{exact:true});await expect(run.locator('option')).not.toHaveCount(0,{timeout:60000});
 const option=await run.locator('option').evaluateAll(options=>options.find(o=>/north gate/.test(o.textContent))?.value);expect(option).toBeTruthy();await run.selectOption(option);
 const text=page.getByLabel('Selected text run',{exact:true});await expect(text).toHaveValue('Arrive at the north gate at 8:30');await text.fill('Arrive at the south gate at 8:15');await page.getByRole('button',{name:'Apply text',exact:true}).click();
 const savePptx=page.getByRole('button',{name:'Save PPTX copy',exact:true});await expect(page.getByRole('checkbox',{name:'I checked my changes'})).toHaveCount(0);await expect(savePptx).toBeEnabled();await savePptx.click();await saved(dest);
 const deck=readPresentation(new Uint8Array(await fs.readFile(dest))),all=JSON.stringify(deck.model);
 expect(deck.model.slides).toHaveLength(3);expect(all).toContain('Arrive at the south gate at 8:15');expect(all).not.toContain('north gate');
 for(const kept of ['Book the crane for Thursday','Brackets still on order','Site visit plan'])expect(all).toContain(kept);
 const before=readPresentation(new Uint8Array(original));expect(deck.entries.get('ppt/theme/theme1.xml')).toEqual(before.entries.get('ppt/theme/theme1.xml'));
 expect((await fs.readFile(source)).equals(original)).toBe(true);expect(errors).toEqual([]);
});

test('typing straight into workbook cells: Enter moves down, Tab moves right, Escape cancels, Undo reverses, and the copy keeps the values',async()=>{
 const source=path.join(root,'Parts order.xlsx'),dest=path.join(root,'Parts typed.xlsx');await fs.copyFile('tests/fixtures/robot-workbook.xlsx',source);
 await files(source,dest);await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(page.getByLabel('Cell address',{exact:true})).toBeVisible({timeout:60000});
 const grid=page.locator('.workbook-grid'),cell=ref=>grid.locator(`[data-cell="${ref}"]`),value=page.getByLabel('Selected cell value',{exact:true});
 await cell('B2').click();await page.keyboard.type('175');await expect(page.getByRole('textbox',{name:'Edit cell B2'})).toHaveValue('175');await page.keyboard.press('Enter');
 await expect(page.getByLabel('Cell address',{exact:true})).toHaveValue('B3');await expect(cell('B2')).toContainText('175');
 await page.keyboard.type('Spare bolts');await page.keyboard.press('Tab');await expect(page.getByLabel('Cell address',{exact:true})).toHaveValue('C3');await expect(cell('B3')).toContainText('Spare bolts');
 await page.keyboard.type('9');await page.keyboard.press('Escape');await expect(page.locator('.workbook-cell-typing')).toHaveCount(0);await expect(cell('C3')).toContainText('0.12');
 await cell('A4').dblclick();await expect(page.getByRole('textbox',{name:'Edit cell A4'})).toHaveValue('Washers');await page.keyboard.type(' (box)');await page.keyboard.press('Enter');await expect(cell('A4')).toContainText('Washers (box)');
 await page.keyboard.press('Control+z');await expect(cell('A4')).toHaveText('Washers');
 await cell('D2').click();await page.keyboard.type('1');await page.keyboard.press('Enter');await expect(page.locator('#toast')).toContainText(/read-only/);await expect(cell('D2')).toContainText('42');
 const save=page.getByRole('button',{name:'Save XLSX copy',exact:true});await expect(save).toBeEnabled();await save.click();await saved(dest);
 const book=readWorkbook(new Uint8Array(await fs.readFile(dest))).model,get=ref=>book.sheets[0].cells.find(c=>c.ref===ref);
 expect(get('B2').value).toBe('175');expect(get('B2').type).toBe('number');expect(get('B3').value).toBe('Spare bolts');expect(get('C3').value).toBe('0.12');expect(get('A4').value).toBe('Washers');expect(get('D2').formula).toBe('B2*C2');expect(errors).toEqual([]);
});
