import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';
import {PDFDocument,PDFString} from 'pdf-lib';
import {launchReader,attachReaderFailure} from '../helpers/reader-launch.mjs';
import {readerRuntime} from '../helpers/reader-runtime.mjs';
import {readerTools,closeReaderApp} from '../helpers/reader-desktop.mjs';

test('generated active PDF content stays inert through reader, markup and fresh page copies',async()=>{
 test.setTimeout(process.env.CI?300000:180000);
 const root=await fs.mkdtemp(path.resolve('.test-data/reader-hostile-audit-')),pdf=await PDFDocument.create(),p=pdf.addPage([400,600]),c=pdf.context;
 p.drawText('Inert audit artwork',{x:40,y:500,size:18});
 const js=PDFString.of('globalThis.__pdfixHostileAuditExecuted = true; app.launchURL("https://pdfix-audit.invalid/should-never-open");');
 pdf.catalog.set((await import('pdf-lib')).PDFName.of('OpenAction'),c.obj({S:'JavaScript',JS:js}));
 p.node.set((await import('pdf-lib')).PDFName.of('AA'),c.obj({O:{S:'JavaScript',JS:js}}));
 p.node.addAnnot(c.register(c.obj({Type:'Annot',Subtype:'Link',Rect:[40,450,220,480],A:{S:'Launch',F:PDFString.of('not-a-real-program.exe')}})));
 p.node.addAnnot(c.register(c.obj({Type:'Annot',Subtype:'Text',Rect:[40,400,60,420],Contents:PDFString.of('<img src="https://pdfix-audit.invalid/comment" onerror="globalThis.__pdfixHostileAuditExecuted=true">'),F:4})));
 const source=path.join(root,'active.pdf'),original=Buffer.from(await pdf.save({useObjectStreams:false}));await fs.writeFile(source,original);
 let app,page;const requests=[],errors=[];
 try{
  app=await launchReader({args:[await readerRuntime()],env:{...process.env,PDFIX_TEST_VISIBLE:'0',PDFIX_TEST_DATA:path.join(root,'profile')}},test.info());page=await app.firstWindow();
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/i.test(r.url()))requests.push(r.url());});
  await app.evaluate(({shell})=>{globalThis.hostileAuditExternal=[];shell.openExternal=async url=>{globalThis.hostileAuditExternal.push(url);};});
  await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},source);
  await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(page.locator('.document-area .pdf-paper')).toHaveAttribute('data-ready','true',{timeout:90000});
  await expect(page.locator('.document-area .textLayer')).toContainText('Inert audit artwork');
  const exactCopy=path.join(root,'retained-original.pdf');await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},exactCopy);await page.getByRole('button',{name:'Save a copy',exact:true}).click();await expect.poll(()=>fs.readFile(exactCopy).then(bytes=>bytes.equals(original),()=>false)).toBe(true);
  await readerTools(page,'Comment');
  const markup=page.getByRole('region',{name:'PDF comment options',exact:true});await expect(page.getByRole('toolbar',{name:'Comment tools',exact:true}).getByRole('button',{name:'Select',exact:true})).toBeEnabled({timeout:90000});await markup.getByRole('button',{name:'Close markup workspace',exact:true}).click();
  await readerTools(page,'Pages');const pages=page.getByRole('region',{name:'Organize PDF pages',exact:true});
  await expect(pages.getByRole('button',{name:'Rotate output page 1',exact:true})).toBeEnabled();await pages.getByRole('button',{name:'Rotate output page 1',exact:true}).click();
  await expect(pages.getByRole('button',{name:'Preview new copy',exact:true})).toBeEnabled({timeout:90000});await pages.getByRole('button',{name:'Preview new copy',exact:true}).click();await expect(pages.getByRole('button',{name:'Save this copy',exact:true})).toBeEnabled({timeout:90000});
  const output=path.join(root,'safe-page-copy.pdf');await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},output);await pages.getByRole('button',{name:'Save this copy',exact:true}).click();await expect(pages.locator('.job-progress')).toContainText('Saved safe-page-copy.pdf',{timeout:90000});
  const after=await PDFDocument.load(await fs.readFile(output)),n=(await import('pdf-lib')).PDFName.of;expect(after.getPageCount()).toBe(1);expect(after.getPage(0).getRotation().angle).toBe(90);expect(after.catalog.has(n('OpenAction'))).toBe(false);expect(after.getPage(0).node.has(n('AA'))).toBe(false);expect(after.getPage(0).node.has(n('Annots'))).toBe(false);
  expect(await fs.readFile(source)).toEqual(original);expect(requests).toEqual([]);expect(await app.evaluate(()=>globalThis.hostileAuditExternal)).toEqual([]);expect(await page.evaluate(()=>globalThis.__pdfixHostileAuditExecuted)).toBeUndefined();expect(errors).toEqual([]);
  await pages.getByRole('button',{name:'Close page workspace',exact:true}).click();
 }finally{await attachReaderFailure(app,test.info());await closeReaderApp(app);}
});
