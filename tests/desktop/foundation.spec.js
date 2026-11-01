import { test, expect, _electron as electron } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
let desktop,page,root;
test.beforeEach(async ({},info)=>{
  root=path.resolve('.test-data',`foundation-${info.workerIndex}-${Date.now()}`);await fs.mkdir(root,{recursive:true});
  desktop=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'user-data')}});
  page=await desktop.firstWindow();await page.waitForLoadState('domcontentloaded');
});
test.afterEach(async()=>{await desktop?.close();});
async function chooseOpen(filePath){await desktop.evaluate(({dialog},filePath)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[filePath]});},filePath);await page.getByRole('button',{name:'Open a file',exact:true}).click();}
test('native home, actual picker, favorites, filter, reopen and safe copy',async()=>{
  await expect(page.getByRole('heading',{name:'What would you like to do?'})).toBeVisible();
  const file=path.join(root,'Actual-notes.txt');await fs.writeFile(file,'Original content.');await chooseOpen(file);
  await expect(page.locator('.document-title b')).toHaveText('Actual-notes.txt');
  const dest=path.join(root,'Actual-notes-copy.txt');await desktop.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},dest);
  await page.getByRole('tab',{name:'File',exact:true}).click();await page.getByRole('button',{name:'Save a copy of the original',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved Actual-notes-copy.txt');
  expect(await fs.readFile(dest,'utf8')).toBe('Original content.');expect(await fs.readFile(file,'utf8')).toBe('Original content.');
  await page.getByRole('button',{name:'Back to Home'}).click();await page.getByRole('button',{name:'Add favorite: Actual-notes.txt'}).click();await page.getByRole('button',{name:'Favorites',exact:true}).click();await expect(page.locator('.file-details b')).toHaveText('Actual-notes.txt');
  await page.getByRole('searchbox',{name:'Find an opened file'}).fill('absent');await expect(page.getByText('No opened files match your search.')).toBeVisible();await page.getByRole('searchbox',{name:'Find an opened file'}).fill('Actual');await page.locator('.file-open').click();await expect(page.locator('.document-title b')).toHaveText('Actual-notes.txt');
});
test('corrupt extension, blocked overwrite, canceled picker and inert document text',async()=>{
  const bad=path.join(root,'broken.pdf');await fs.writeFile(bad,'This is not a PDF');await chooseOpen(bad);await expect(page.locator('#toast')).toContainText('contents do not match');await expect(page.getByRole('heading',{name:'What would you like to do?'})).toBeVisible();
  const file=path.join(root,'<img onerror=alert(1)>.txt'.replace(/[<>]/g,'_'));await fs.writeFile(file,'<script>window.exploit=1</script>');await chooseOpen(file);
  await desktop.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},file);await page.getByRole('tab',{name:'File',exact:true}).click();await page.getByRole('button',{name:'Save a copy of the original',exact:true}).click();await expect(page.locator('#toast')).toContainText('keeps originals safe');expect(await fs.readFile(file,'utf8')).toContain('<script>');expect(await page.evaluate(()=>window.exploit)).toBeUndefined();
  await page.getByRole('button',{name:'Back to Home'}).click();await desktop.evaluate(({dialog})=>{dialog.showOpenDialog=async()=>({canceled:true,filePaths:[]});});await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(page.getByRole('heading',{name:'What would you like to do?'})).toBeVisible();
});
test('no Node access, no online document resources, visible planned capabilities and keyboard controls',async()=>{
  expect(await page.evaluate(()=>typeof window.require)).toBe('undefined');
  expect(await page.evaluate(async()=>{try {await fetch('https://example.com/');return 'allowed';}catch{return 'blocked';}})).toBe('blocked');
  await page.getByRole('button',{name:'Format support',exact:true}).click();await expect(page.getByRole('table')).toContainText('PDF');await expect(page.getByRole('table')).toContainText('Not yet');
  await page.keyboard.press('Control+k');await expect(page.getByRole('searchbox',{name:'Find an opened file'})).toBeFocused();
  await page.getByRole('button',{name:'Home',exact:true}).click();await page.screenshot({path:path.join(root,'home.png')});
});
test('real OS-backed dropped file reaches the narrow preload bridge',async()=>{
  const file=path.join(root,'Dropped.txt');await fs.writeFile(file,'Dropped from disk.');
  await page.evaluate(()=>{const input=document.createElement('input');input.type='file';input.id='test-drop-file';input.hidden=true;document.body.append(input);});
  await page.locator('#test-drop-file').setInputFiles(file);
  await page.evaluate(()=>{const input=document.querySelector('#test-drop-file');const transfer=new DataTransfer();transfer.items.add(input.files[0]);document.querySelector('.drop-zone').dispatchEvent(new DragEvent('drop',{dataTransfer:transfer,bubbles:true,cancelable:true}));input.remove();});
  await expect(page.locator('.document-title b')).toHaveText('Dropped.txt');
});
