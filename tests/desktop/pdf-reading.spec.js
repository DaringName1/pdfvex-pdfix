import {readerTools,readerPage,closeReaderApp} from '../helpers/reader-desktop.mjs';
import { test, expect, _electron as electron } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
let desktop,page,root,errors;
test.beforeEach(async()=>{
  root=path.resolve('.test-data',`pdf-${Date.now()}`);await fs.mkdir(root,{recursive:true});
  desktop=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'user-data'),PDFIX_TEST_VISIBLE:'0'}});page=await desktop.firstWindow();errors=[];page.on('pageerror',error=>errors.push(error.message));await page.waitForLoadState('domcontentloaded');
});
test.afterEach(async()=>{await closeReaderApp(desktop);});
async function open(name){const file=path.resolve('tests/fixtures',name);await desktop.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).click();}
async function ready(number=1){await expect(page.locator('.pdf-paper')).toHaveAttribute('data-page',String(number));await expect(page.locator('.pdf-paper')).toHaveAttribute('data-ready','true');await expect(page.locator('.page-status')).toHaveText(new RegExp(`Page ${number} of `));await expect(page.locator('.pdf-paper')).toHaveAttribute('data-page',String(number));}
test('actual PDF renders text and thumbnails, navigation, search, selection and zoom',async()=>{
  await open('reading-sample.pdf');await ready();await readerTools(page);await page.getByRole('button',{name:'Pages panel',exact:true}).click();await expect(page.locator('.textLayer')).toContainText('Welcome to PDFix');await expect(page.locator('.thumbnail[data-page="1"]')).toHaveAttribute('data-rendered','true');
  expect(await page.locator('.pdf-paper canvas').evaluate(c=>{const ctx=c.getContext('2d');const bytes=ctx.getImageData(0,0,c.width,c.height).data;let colored=0;for(let i=0;i<bytes.length;i+=4)if(bytes[i]<240&&bytes[i+1]<240)colored++;return colored;})).toBeGreaterThan(1000);
  await readerPage(page,2);await ready(2);await expect(page.locator('.textLayer')).toContainText('Replace the oil every 5,000 miles');
  const before=await page.locator('.pdf-paper canvas').evaluate(c=>c.width);await page.getByRole('button',{name:'Zoom in',exact:true}).click();await expect.poll(()=>page.locator('.pdf-paper canvas').evaluate(c=>c.width)).toBeGreaterThan(before);
  await page.getByRole('button',{name:'Fit width',exact:true}).click();await page.getByRole('button',{name:/^(Find|Find in PDF)$/,exact:true}).click();await page.getByRole('searchbox',{name:'Search selectable text'}).fill('4,800');await page.getByRole('button',{name:'Search PDF',exact:true}).click();await expect(page.locator('.search-status')).toContainText('1 match on 1 page.');await page.getByRole('button',{name:/Page 3.*service completed/i}).click();await ready(3);
  await expect.poll(()=>page.evaluate(()=>CSS.highlights?[...CSS.highlights].filter(([key])=>key.startsWith('pdfix-active-')).flatMap(([,value])=>[...value].map(range=>range.toString())).join(''):document.querySelector('.textLayer .search-active')?.textContent)).toBe('4,800');
  await page.locator('.page-stage').focus();await page.keyboard.press('PageUp');await ready(2);await page.getByRole('spinbutton',{name:'Page number'}).fill('1');await page.getByRole('spinbutton',{name:'Page number'}).press('Tab');await ready(1);
  await expect(page.locator('.thumbnail.current')).toHaveAttribute('data-page','1');await expect(page.locator('.thumbnail[aria-current=page]')).toHaveCount(1);await expect(page.locator('.thumbnail[aria-current=page]')).toHaveAttribute('data-page','1');await page.mouse.move(400,25);await page.screenshot({path:path.join(root,'reader.png')});expect(errors).toEqual([]);
});
test('scan-only page stays readable and does not invent searchable text',async()=>{
  await open('scan-only.pdf');await ready();await expect(page.locator('.pdf-message')).toContainText('No selectable text');expect(await page.locator('.textLayer').innerText()).toBe('');await page.getByRole('button',{name:/^(Find|Find in PDF)$/,exact:true}).click();await page.getByRole('searchbox',{name:'Search selectable text'}).fill('oil');await page.getByRole('button',{name:'Search PDF'}).click();await expect(page.locator('.search-status')).toContainText('No matches');
});
test('wrong/correct passwords, restricted copying and cancellation respect the document',async()=>{
  await open('password.pdf');await expect(page.getByRole('dialog')).toContainText('needs a password');await page.getByRole('textbox',{name:'PDF password'}).fill('wrong');await page.getByRole('button',{name:'Unlock',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('did not unlock');await page.getByRole('textbox',{name:'PDF password'}).fill('pdfix-test');await page.getByRole('button',{name:'Unlock',exact:true}).click();await ready();
  await page.getByRole('button',{name:'Back to Home'}).click();await open('restricted.pdf');await page.getByRole('textbox',{name:'PDF password'}).fill('pdfix-test');await page.getByRole('button',{name:'Unlock',exact:true}).click();await ready();await readerTools(page,'View','Copy page text');await expect(page.getByRole('button',{name:'Copy page text'})).toBeDisabled();await page.getByRole('button',{name:/^(Find|Find in PDF)$/,exact:true}).click();await expect(page.getByRole('searchbox',{name:'Search selectable text'})).toBeDisabled();await expect(page.locator('.textLayer')).toBeEmpty();
  await page.getByRole('button',{name:'Back to Home'}).click();await page.getByRole('button',{name:'Close password.pdf',exact:true}).click();await open('password.pdf');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('.pdf-message')).toContainText('canceled');
});
test('damaged PDF shows a recovery action; print prepares all pages and cleans up',async()=>{
  await open('damaged.pdf');await expect(page.locator('.pdf-message')).toContainText('could not be read');
  await page.getByRole('button',{name:'Back to Home'}).click();await open('reading-sample.pdf');await ready();
  await desktop.evaluate(({BrowserWindow})=>{BrowserWindow.getAllWindows()[0].webContents.print=(_options,callback)=>setTimeout(()=>callback(true),200);});
  let captured=0;await page.exposeFunction('recordPrint',n=>{captured=n;});await page.evaluate(()=>{const observer=new MutationObserver(()=>{const root=document.querySelector('.print-pages[data-ready="true"]');if(root){window.recordPrint(root.querySelectorAll('img').length);observer.disconnect();}});observer.observe(document.body,{childList:true,subtree:true,attributes:true});});
  await page.getByRole('button',{name:'Print',exact:true}).click();const print=page.locator('.pdf-print-workspace');await print.getByRole('button',{name:'Refresh preview',exact:true}).click();await print.getByRole('button',{name:'Print',exact:true}).click();await expect.poll(()=>captured).toBe(3);await expect(page.locator('.print-pages')).toHaveCount(0);await print.getByRole('button',{name:'Close print preparation'}).click();await ready();expect(errors).toEqual([]);
});
