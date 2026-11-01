import {launchReader,attachReaderFailure} from '../helpers/reader-launch.mjs';
import {readerRuntime} from '../helpers/reader-runtime.mjs';
import {test,expect} from '@playwright/test';
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {readerPage,closeReaderApp} from '../helpers/reader-desktop.mjs';

test('on-demand Find searches only rendered page text and never extracts another page',async()=>{
  test.setTimeout(process.env.CI?300000:180000);
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-paged-search-')),pdf=await PDFDocument.create();
  for(let i=1;i<=501;i++)pdf.addPage([400,600]).drawText(i===1?'needle needle firstonly':i===501?'needle lastonly':'otheronly',{x:40,y:400});
  const source=path.join(root,'501-search-pages.pdf'),original=Buffer.from(await pdf.save({useObjectStreams:false}));
  await fs.writeFile(source,original);let app;const errors=[];
  try{
    app=await launchReader({args:[await readerRuntime()],env:{...process.env,PDFIX_TEST_VISIBLE:'0',PDFIX_TEST_DATA:path.join(root,'profile')}},test.info());
    const page=await app.firstWindow();page.on('pageerror',error=>errors.push(error.message));await page.waitForLoadState('domcontentloaded');
    await app.evaluate(({dialog,ipcMain},file)=>{
      dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});
      const original=ipcMain._invokeHandlers.get('pdfix:read-paged-pdf');if(typeof original!=='function')throw new Error('Native paged reader handler was not found');globalThis.pagedSearchRequests=[];
      ipcMain.removeHandler('pdfix:read-paged-pdf');ipcMain.handle('pdfix:read-paged-pdf',(event,id,number,token)=>{globalThis.pagedSearchRequests.push(number);return original(event,id,number,token);});
    },source);
    await page.getByRole('button',{name:'Open a file',exact:true}).click();
    await expect(page.locator('.document-area .page-total')).toContainText('501',{timeout:process.env.CI?140000:60000});
    await expect(page.locator('.pdf-multi-slot[data-page="1"]')).toHaveAttribute('data-ready','true',{timeout:process.env.CI?120000:60000});
    await page.getByRole('button',{name:'Find on this page',exact:true}).click();
    const query=page.getByRole('searchbox',{name:'Search this page’s selectable text'});
    await expect(query).toBeFocused();await page.screenshot({path:path.join(root,'page-search-header.png')});await query.fill('needle');await query.press('Enter');
    await expect(page.locator('.reading-view')).toHaveValue('page');
    await expect(page.locator('.search-status')).toContainText('2 matches');
    await expect(page.locator('.search-status')).toContainText('Other pages were not searched');
    const requests=await app.evaluate(()=>globalThis.pagedSearchRequests.slice());
    expect(requests.length).toBeGreaterThan(0);
    await query.press('Enter');await expect(page.locator('.search-position')).toHaveText('1 of 2');
    await query.press('F3');await expect(page.locator('.search-position')).toHaveText('2 of 2');
    await query.press('Shift+F3');await expect(page.locator('.search-position')).toHaveText('1 of 2');
    expect(await page.evaluate(()=>Array.from(CSS.highlights).filter(([name])=>name.startsWith('pdfix-active-')).flatMap(([,highlight])=>[...highlight].map(range=>range.toString())))).toEqual(['needle']);
    await query.fill('lastonly');await query.press('Enter');await expect(page.locator('.search-status')).toContainText('No matches');
    expect(await app.evaluate(()=>globalThis.pagedSearchRequests)).toEqual(requests);
    await readerPage(page,501);await expect(page.locator('.search-results')).toBeEmpty();await expect(page.locator('.search-status')).toContainText('Page changed');
    await page.getByRole('spinbutton',{name:'Page number',exact:true}).focus();await page.keyboard.press('Control+f');await expect(query).toBeFocused();
    const lastRequests=await app.evaluate(()=>globalThis.pagedSearchRequests.slice());
    await query.fill('lastonly');await query.press('Enter');await expect(page.locator('.search-status')).toContainText('1 match');
    await expect(page.locator('.search-results')).toContainText('501');
    await query.press('F3');await expect(page.locator('.search-position')).toHaveText('1 of 1');
    expect(await app.evaluate(()=>globalThis.pagedSearchRequests)).toEqual(lastRequests);
    await query.fill('');await query.press('Enter');await expect(page.locator('.search-results')).toBeEmpty();
    expect(await fs.readFile(source)).toEqual(original);expect(errors).toEqual([]);
  }catch(error){await attachReaderFailure(app,test.info(),error);throw error;}finally{await closeReaderApp(app);}
});
