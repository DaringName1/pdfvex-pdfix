import {launchReader,attachReaderFailure} from '../helpers/reader-launch.mjs';
import {ownedReceipt,drainOwned,desktopReceipt} from '../helpers/reader-process-tree.mjs';
import {readerRuntime} from '../helpers/reader-runtime.mjs';
import {test,expect} from '@playwright/test';
import os from 'node:os';import fs from 'node:fs/promises';import path from 'node:path';
import {PDFDocument} from 'pdf-lib';import {readerPage,closeReaderApp} from '../helpers/reader-desktop.mjs';

test('entire on-demand PDF search stops, resumes beyond page 500 and navigates exact matches',async()=>{
  test.setTimeout(process.env.CI?480000:300000);const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-search-all-')),pdf=await PDFDocument.create();
  for(let i=1;i<=501;i++)pdf.addPage([400,600]).drawText(i===1||i===501?'needle physical '+i:'ordinary physical '+i,{x:40,y:400});
  const original=Buffer.from(await pdf.save({useObjectStreams:false})),source=path.join(root,'source.pdf');await fs.writeFile(source,original);
  let app;const owned=new Map(),errors=[],report={root,source,scope:'Generated 501-page built Electron search; no real engineering corpus or outside-software claim'};
  const sample=async label=>{const receipt=await ownedReceipt(app);for(const row of receipt.processes)owned.set(row.pid+':'+row.created,row);const desktop=await desktopReceipt().catch(error=>({error:error.message}));(report.resources??=[]).push({label,...receipt,desktop});};
  try{
    app=await launchReader({args:[await readerRuntime()],env:{...process.env,PDFIX_TEST_VISIBLE:'0',PDFIX_TEST_DATA:path.join(root,'profile')}},test.info());const page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));
    await page.waitForLoadState('domcontentloaded');await sample('Home before PDF');await app.evaluate(({dialog,ipcMain},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});const original=ipcMain._invokeHandlers.get('pdfix:read-paged-pdf');globalThis.searchRequests=[];globalThis.searchSourceIds=new Set();ipcMain.removeHandler('pdfix:read-paged-pdf');ipcMain.handle('pdfix:read-paged-pdf',(...args)=>{globalThis.searchRequests.push(args[2]);globalThis.searchSourceIds.add(args[1]);return original(...args);});},source);
    await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(page.locator('.page-total')).toContainText('501',{timeout:process.env.CI?140000:60000});
    await expect(page.locator('.pdf-multi-slot[data-page="1"]')).toHaveAttribute('data-ready','true',{timeout:30000});await page.getByRole('button',{name:'Find on this page',exact:true}).click();
    await page.getByRole('combobox',{name:'PDF search scope',exact:true}).selectOption('all');
    const query=page.getByRole('searchbox',{name:'Search selectable text across this PDF'});await query.fill('needle');await query.press('Enter');
    await expect(page.locator('.search-results')).toContainText('1 match');
    await page.getByRole('button',{name:'Stop search',exact:true}).click();await expect(page.getByRole('button',{name:'Continue search',exact:true})).toBeVisible();
    await expect(page.locator('.search-status')).toContainText('Later pages have not been searched');
    await sample('First search stopped');
    await page.getByRole('button',{name:'Continue search',exact:true}).click();
    await expect(page.locator('.search-status')).toContainText('Searching page',{timeout:30000});
    await readerPage(page,250);await expect(page.getByRole('button',{name:'Continue search',exact:true})).toBeVisible();
    await expect(page.locator('.search-results')).toContainText('1 match');await expect(page.locator('.pdf-paper')).toHaveAttribute('data-page','250');
    const started=Date.now();await page.getByRole('button',{name:'Continue search',exact:true}).click();
    await expect(page.locator('.search-status')).toHaveText('2 matches on 2 pages. Use Next / Previous or F3 / Shift F3.',{timeout:240000});report.searchMs=Date.now()-started;
    await expect(page.locator('.search-result')).toHaveCount(2);await page.locator('.search-result').filter({hasText:'501'}).click();await expect(page.locator('.pdf-paper')).toHaveAttribute('data-page','501');await expect(page.locator('.pdf-paper')).toHaveAttribute('data-ready','true');
    expect(await page.evaluate(()=>Array.from(CSS.highlights).filter(([name])=>name.startsWith('pdfix-active-')).flatMap(([,h])=>[...h].map(r=>r.toString())))).toEqual(['needle']);
    await query.press('F3');await expect(page.locator('.pdf-paper')).toHaveAttribute('data-page','1');await expect(page.locator('.pdf-paper')).toHaveAttribute('data-ready','true');
    report.requests=await app.evaluate(()=>globalThis.searchRequests);expect(report.requests).toContain(500);expect(report.requests).toContain(501);report.processes=await app.evaluate(({app})=>app.getAppMetrics().map(p=>({type:p.type,privateKiB:p.memory.privateBytes,workingSetKiB:p.memory.workingSetSize})));
    await sample('Search and final navigation complete');expect(await fs.readFile(source)).toEqual(original);expect(errors).toEqual([]);report.pass=true;
  }catch(error){report.error=error.message;await attachReaderFailure(app,test.info(),error);throw error;}
  finally{
    report.cleanup={};
    let releaseTimer;try{await Promise.race([(async()=>{if(app){
      const ids=await app.evaluate(()=>[...(globalThis.searchSourceIds??[])]),page=app.windows()[0];
      if(page){await page.evaluate(async ids=>{for(const id of ids)await window.pdfix.releasePagedPdf(id);},ids);report.cleanup.pagedSessionsReleased=true;}
      await sample('Paged sessions released before app quit');
      report.cleanup.remainingJobFolders=(await fs.readdir(path.join(root,'profile','paged-reading')).catch(error=>{if(error.code==='ENOENT')return [];throw error;})).filter(name=>name.startsWith('job-'));
    }})(),new Promise((_,reject)=>{releaseTimer=setTimeout(()=>reject(Error('Paged-session cleanup exceeded 30 seconds')),30000);})]);}catch(error){report.cleanup.releaseError=error.message;}finally{clearTimeout(releaseTimer);}
    try{await closeReaderApp(app);report.closed=true;}catch(error){report.cleanup.closeError=error.message;}
    try{report.cleanup.processes=await drainOwned([...owned.values()]);}catch(error){report.cleanup.processError=error.message;}
    report.cleanup.desktop=await desktopReceipt().catch(error=>({error:error.message}));
    report.errors=errors;report.searchAndCleanupPassed=!!report.pass&&report.closed&&!report.cleanup.releaseError&&!report.cleanup.closeError&&!report.cleanup.processError&&report.cleanup.remainingJobFolders?.length===0&&report.cleanup.processes?.remaining.length===0&&report.cleanup.processes?.forced.length===0;report.pass=false;report.probe={state:report.searchAndCleanupPassed?'pending':'not run'};
    const receipt=path.join(root,'report.json');await fs.writeFile(receipt,JSON.stringify(report,null,2));if(!report.searchAndCleanupPassed)await test.info().attach('reader-search-all-resource-cleanup',{path:receipt,contentType:'application/json'});
    if(app){expect(report.cleanup,'Search-all must release its helpers and exit without orphan processes').toMatchObject({pagedSessionsReleased:true,remainingJobFolders:[],processes:{remaining:[],forced:[]}});expect(report.closed).toBe(true);}
  }
  // Keep a poisoned-start failure on the test that exercised the sandbox.
  // No GPU retry, security change or longer-startup workaround.
  let probe,probeOwned=[];
  try{probe=await launchReader({args:[await readerRuntime()],env:{...process.env,PDFIX_TEST_VISIBLE:'0',PDFIX_TEST_DATA:path.join(root,'probe-profile')}},test.info());probeOwned=(await ownedReceipt(probe)).processes;await expect((await probe.firstWindow()).getByRole('button',{name:'Open a file',exact:true})).toBeVisible();report.probe.opened=true;}
  catch(error){report.probe.error=error.message;throw error;}
  finally{
    try{await closeReaderApp(probe);report.probe.closed=true;}catch(error){report.probe.closeError=error.message;}
    try{report.probe.processes=await drainOwned(probeOwned);}catch(error){report.probe.processError=error.message;}
    report.probe.state='completed';report.pass=report.searchAndCleanupPassed&&report.probe.opened===true&&report.probe.closed===true&&!report.probe.closeError&&!report.probe.processError&&report.probe.processes?.remaining.length===0&&report.probe.processes?.forced.length===0;
    const receipt=path.join(root,'report.json');await fs.writeFile(receipt,JSON.stringify(report,null,2));await test.info().attach('reader-search-all-resource-cleanup',{path:receipt,contentType:'application/json'});console.log(JSON.stringify({report:receipt,searchMs:report.searchMs,pass:report.pass,cleanup:report.cleanup,probe:report.probe}));expect(report.pass,'Search-all cleanup and the subsequent clean-profile launch must both pass').toBe(true);
  }
});
