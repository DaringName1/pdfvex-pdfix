import {chooseDocumentMode} from '../../scripts/user-robot/document-mode.mjs';
import {readerTools,closeReaderApp} from '../helpers/reader-desktop.mjs';
import {test,expect,_electron as electron} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';
let desktop,page,root,errors;
async function launch(){desktop=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}});page=await desktop.firstWindow();errors=[];page.on('pageerror',e=>errors.push(e.message));await page.waitForLoadState('domcontentloaded');}
test.beforeEach(async()=>{root=path.resolve('.test-data',`navigation-${Date.now()}`);await fs.mkdir(root,{recursive:true});await launch();});
test.afterEach(async()=>{await closeReaderApp(desktop);});
async function open(file){await desktop.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).click();await ready();}
async function ready(number){if(number)await expect(page.locator('.pdf-paper')).toHaveAttribute('data-page',String(number));await expect(page.locator('.pdf-paper')).toHaveAttribute('data-ready','true');}

test('View group menus invoke the existing word count and restore reading controls across modes',async()=>{
 const source=path.resolve('tests/fixtures/navigation-sample.pdf'),original=await fs.readFile(source);await open(source);await readerTools(page,'View');
 const panel=page.getByRole('tabpanel',{name:'View',exact:true}),read=panel.getByRole('button',{name:'Read tools menu',exact:true});
 await read.press('ArrowDown');await page.getByRole('menu',{name:'Read tools',exact:true}).getByRole('menuitem',{name:'Word count',exact:true}).click();
 const statistics=page.getByRole('dialog',{name:'PDF text statistics',exact:true});await expect(statistics.getByRole('status')).toContainText('text units counted.');await expect(statistics.getByRole('button',{name:'Close',exact:true})).toHaveCount(1);await statistics.getByRole('button',{name:'Close',exact:true}).click();await expect(statistics).not.toBeVisible();await read.click();await page.getByRole('menu',{name:'Read tools',exact:true}).getByRole('menuitem',{name:'Word count',exact:true}).click();await page.keyboard.press('Escape');await expect(statistics).not.toBeVisible();
 const documentMenu=panel.getByRole('button',{name:'Document tools menu',exact:true});await documentMenu.click();await page.getByRole('menu',{name:'Document tools',exact:true}).getByRole('menuitem',{name:'Go to sheet label',exact:true}).click();await page.getByRole('searchbox',{name:'Find sheet by embedded PDF page label',exact:true}).press('Escape');await expect(documentMenu).toBeFocused();
 await chooseDocumentMode(page,'view');await expect(page.getByRole('button',{name:'More',exact:true})).not.toBeVisible();await expect(page.getByRole('button',{name:'Fit page',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Pages panel',exact:true})).toBeVisible();await expect(page.getByRole('menu',{name:'Read tools',exact:true,includeHidden:true})).toHaveCount(0);
 await chooseDocumentMode(page,'build');await readerTools(page,'View');await expect(read).toBeVisible();
 await desktop.evaluate(({dialog})=>{dialog.showSaveDialog=async()=>({canceled:true});});await page.getByRole('button',{name:'Save a copy',exact:true}).click();
 const output=path.join(root,'view-copy.pdf');await desktop.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},output);await page.getByRole('button',{name:'Save a copy',exact:true}).click();
 await expect.poll(()=>fs.readFile(output).then(bytes=>bytes.equals(original),()=>false)).toBe(true);expect(await fs.readFile(source)).toEqual(original);expect(errors).toEqual([]);
});

test('grouped Export and Protect tools restore after search and leave an exact saved copy',async()=>{
  const source=path.resolve('tests/fixtures/navigation-sample.pdf'),original=await fs.readFile(source);await open(source);
  await readerTools(page,'Export');const output=page.getByRole('tabpanel',{name:'Export',exact:true});
  const saveAs=output.getByRole('button',{name:'Save as tools menu',exact:true});await saveAs.press('ArrowDown');
  await expect(page.getByRole('menu',{name:'Save as tools',exact:true}).getByRole('menuitem')).toHaveCount(2);
  await page.keyboard.press('Escape');await expect(saveAs).toBeFocused();
  const search=page.getByRole('searchbox',{name:'Filter tools',exact:true});await search.fill('security report');
  await expect(page.getByRole('button',{name:'Security report',exact:true})).toBeVisible();
  await expect(output.getByRole('button',{name:'Compress a PDF',exact:true})).not.toBeVisible();
  await search.press('Escape');await expect(output.getByRole('button',{name:'Compress a PDF',exact:true})).toBeVisible();
  await readerTools(page,'Protect');const protect=page.getByRole('tabpanel',{name:'Protect',exact:true});
  await protect.getByRole('button',{name:'Check tools menu',exact:true}).click();
  await page.getByRole('menu',{name:'Check tools',exact:true}).getByRole('menuitem',{name:'Security report',exact:true}).click();
  const report=page.getByRole('dialog',{name:'PDF security report',exact:true});await expect(report.getByRole('button',{name:'Save report as text',exact:true})).toBeEnabled({timeout:60000});
  await report.getByRole('button',{name:'Close',exact:true}).click();await expect(protect.getByRole('button',{name:'Security report',exact:true})).toBeFocused();
  const destination=path.join(root,'grouped-tools-copy.pdf');await desktop.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},destination);
  await page.getByRole('button',{name:'Save a copy',exact:true}).click();
  await expect.poll(()=>fs.readFile(destination).then(bytes=>bytes.equals(original),()=>false)).toBe(true);
  expect(await fs.readFile(source)).toEqual(original);await page.getByRole('button',{name:'Back to Home',exact:true}).click();
  await expect(page.getByRole('menu',{name:'Check tools',exact:true,includeHidden:true})).toHaveCount(0);expect(errors).toEqual([]);
});
test('fit page stays inside the reader and temporary rotation never changes the saved source copy',async()=>{
  const file=path.resolve('tests/fixtures/navigation-sample.pdf'),original=await fs.readFile(file);await open(file);await expect(page.locator('.reader-inspector')).not.toBeVisible();await readerTools(page);await page.getByRole('button',{name:'Fit page',exact:true}).click();await ready(1);
  const dimensions=()=>page.locator('.page-stage').evaluate(stage=>{const paper=stage.querySelector('.pdf-paper').getBoundingClientRect(),bounds=stage.getBoundingClientRect();return {inside:paper.left>=bounds.left&&paper.right<=bounds.right&&paper.top>=bounds.top&&paper.bottom<=bounds.bottom,width:paper.width,height:paper.height};});
  await expect.poll(async()=> (await dimensions()).inside).toBe(true);await readerTools(page);await page.getByRole('button',{name:'Rotate view',exact:true}).click();await expect(page.locator('.pdf-paper')).toHaveAttribute('data-rotation','90');expect((await dimensions()).width).toBeGreaterThan((await dimensions()).height);await expect(page.locator('.textLayer')).toContainText('Introduction');await expect(page.locator('.page-status')).toContainText('View rotated 90°');
  const dest=path.join(root,'unchanged-copy.pdf');await desktop.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},dest);await page.getByRole('button',{name:'Save a copy',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved unchanged-copy.pdf');expect(await fs.readFile(dest)).toEqual(original);expect(await fs.readFile(file)).toEqual(original);await page.screenshot({path:path.join(root,'rotated-fit.png')});expect(errors).toEqual([]);
});
test('nested document outline and page labels navigate correctly while external destinations remain inert',async()=>{
  await open(path.resolve('tests/fixtures/navigation-sample.pdf'));await expect(page.locator('.page-status')).toContainText('Label i');await readerTools(page);await page.getByRole('button',{name:'Pages panel',exact:true}).click();await page.getByRole('tab',{name:'Outline',exact:true}).click();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'Saved',exact:true})).toBeFocused();await page.keyboard.press('ArrowLeft');await expect(page.getByRole('tab',{name:'Outline',exact:true})).toHaveAttribute('aria-selected','true');await page.getByRole('button',{name:'Maintenance',exact:true}).click();await ready(2);await expect(page.locator('.page-status')).toContainText('Label 1');await page.getByRole('button',{name:'Service history',exact:true}).click();await ready(3);await expect(page.locator('.textLayer')).toContainText('Service history');await expect(page.getByRole('button',{name:'<script>source content only</script>',exact:true})).toBeDisabled();expect(await page.locator('.outline-list script').count()).toBe(0);await page.screenshot({path:path.join(root,'outline.png')});expect(errors).toEqual([]);
});
test('last read page and named saved pages survive restart and stale sources reset them',async()=>{
  const file=path.join(root,'local-guide.pdf'),original=await fs.readFile('tests/fixtures/navigation-sample.pdf');await fs.writeFile(file,original);await open(file);await page.getByRole('spinbutton',{name:'Page number'}).fill('3');await page.getByRole('spinbutton',{name:'Page number'}).press('Tab');await ready(3);await page.keyboard.press('Control+d');await expect(page.getByRole('textbox',{name:'Bookmark name'})).toBeFocused();await page.getByRole('textbox',{name:'Bookmark name'}).fill('Follow up here');await page.getByRole('button',{name:'Save current page',exact:true}).click();await expect(page.locator('.bookmark-status')).toContainText('Saved Page 3');await desktop.close();desktop=null;await launch();await open(file);await ready(3);await page.getByRole('tab',{name:'Saved',exact:true}).click();await expect(page.getByRole('button',{name:/Follow up here/})).toBeVisible();expect(await fs.readFile(file)).toEqual(original);
  await page.getByRole('button',{name:'Remove saved page 3',exact:true}).click();await expect(page.locator('.bookmark-list')).toContainText('Save a page');await page.getByRole('button',{name:'Back to Home'}).click();await fs.appendFile(file,'\n% changed externally\n');await open(file);await ready(1);await page.getByRole('tab',{name:'Saved',exact:true}).click();await expect(page.locator('.bookmark-list')).toContainText('Save a page');expect(errors).toEqual([]);
});
test('compact reader fits the minimum window without body scrolling or hidden bottom controls',async()=>{
  await desktop.evaluate(({BrowserWindow})=>{const win=BrowserWindow.getAllWindows()[0];win.setSize(800,620);if(win.webContents.isOffscreen()){win.setMinimumSize(780,580);win.setContentSize(784,582);}});await expect.poll(()=>page.evaluate(()=>innerWidth)).toBeLessThan(800);
  await open(path.resolve('tests/fixtures/navigation-sample.pdf'));await chooseDocumentMode(page,'build');for(const name of ["Select","Highlight","Add comment","Add text","Draw","Fill and sign","Organize pages"])await expect(page.getByRole('tabpanel',{name:'Home',exact:true}).getByRole('button',{name,exact:true})).toBeVisible();await page.getByRole('tablist',{name:'PDF tool groups',exact:true}).getByRole('tab',{name:'View',exact:true}).click();
  const fits=()=>page.locator('.document-area').evaluate(root=>{const status=root.querySelector('.page-status').getBoundingClientRect(),area=root.querySelector('.page-stage');return {body:document.body.scrollHeight<=innerHeight,footer:status.bottom<=innerHeight+1,area:area.clientHeight};});
  expect(await fits()).toEqual(expect.objectContaining({body:true,footer:true}));expect((await fits()).area).toBeGreaterThan(280);await page.screenshot({path:path.join(root,'compact-reader.png')});expect(errors).toEqual([]);
});
test('reviewing a transformed output does not replace the original document reading position',async()=>{
  const file=path.resolve('tests/fixtures/navigation-sample.pdf');await open(file);await page.getByRole('spinbutton',{name:'Page number'}).fill('3');await page.getByRole('spinbutton',{name:'Page number'}).press('Tab');await ready(3);
  await readerTools(page,'Pages');await page.getByRole('button',{name:'Organize pages',exact:true}).click();const modal=page.locator('.page-workspace');await modal.getByRole('button',{name:'Remove output page 3',exact:true}).click();await modal.getByRole('button',{name:'Remove output page 2',exact:true}).click();await modal.getByRole('button',{name:'Preview new copy',exact:true}).click();await expect(modal.locator('.pdf-paper')).toHaveAttribute('data-page','1');await expect(modal.locator('.pdf-paper')).toHaveAttribute('data-ready','true');await expect(modal.getByRole('button',{name:'Save page',exact:true})).not.toBeVisible();await modal.getByRole('button',{name:'Close page workspace',exact:true}).click();await page.getByRole('button',{name:'Back to Home'}).click();await open(file);await ready(3);expect(errors).toEqual([]);
});
