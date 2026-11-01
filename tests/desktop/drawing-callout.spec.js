import {test,expect} from '@playwright/test';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {PDFDocument,PDFName,PDFArray,PDFDict} from 'pdf-lib';
import {launchReader,attachReaderFailure} from '../helpers/reader-launch.mjs';import {readerRuntime} from '../helpers/reader-runtime.mjs';import {closeReaderApp,readerTools} from '../helpers/reader-desktop.mjs';
import {reviewActions} from '../../scripts/user-robot/actions-codex-review.mjs';import fixture from '../helpers/review-callout.cjs';
const deadline={timeout:process.env.CI?120000:60000};let app,page,root,errors;
test.beforeEach(async()=>{root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-callout-app-'));errors=[];app=await launchReader({args:[await readerRuntime()],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}},test.info());page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));});
test.afterEach(async()=>{await attachReaderFailure(app,test.info());await closeReaderApp(app);});
test('standard callout edits save and reopen with independently preserved geometry and original objects',async()=>{
 test.setTimeout(process.env.CI?300000:150000);
 const ctx={files:path.join(root,'files'),goHome:async()=>{await page.getByRole('button',{name:'Home',exact:true}).click();},chooseFile:file=>app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file),saveAs:file=>app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},file)};
 await reviewActions[0].run(page,ctx);expect(await reviewActions[0].verify(ctx)).toMatchObject({pass:true,problems:[]});expect(errors).toEqual([]);
});
test('unsupported callout layout refuses preview and publishes nothing',async()=>{
 test.setTimeout(process.env.CI?240000:120000);
 const pdf=await PDFDocument.load(await fixture.calloutSource()),k=PDFName.of;pdf.getPage(0).node.lookup(k('Annots'),PDFArray).lookup(0,PDFDict).set(k('CL'),pdf.context.obj([60,340,140,365]));
 const source=path.join(root,'unsupported.pdf'),output=path.join(root,'must-not-exist.pdf'),bytes=Buffer.from(await pdf.save({useObjectStreams:false}));await fs.writeFile(source,bytes);
 await app.evaluate(({dialog},{source,output})=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[source]});dialog.showSaveDialog=async()=>({canceled:false,filePath:output});},{source,output});
 await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(page.getByLabel('Rendered PDF page 1',{exact:true})).toBeVisible(deadline);await readerTools(page,'Comment','Review drawing comments');await page.getByRole('button',{name:'Review drawing comments',exact:true}).click();
 const panel=page.getByRole('region',{name:'Drawing-wide source comments',exact:true});await expect(panel.getByRole('button',{name:'Inspect source comments',exact:true})).toBeEnabled(deadline);await panel.getByRole('button',{name:/Original free text/}).first().click();await panel.getByRole('button',{name:'Edit plain comment',exact:true}).click();
 const d=page.getByRole('dialog',{name:'Stage PDF review comment edits and replies',exact:true});await d.getByRole('textbox',{name:'Plain comment text',exact:true}).fill('Refused replacement');await d.getByRole('button',{name:'Stage this change',exact:true}).click();await d.getByRole('button',{name:'Build reviewed PDF copy',exact:true}).click();await expect(d.getByRole('status').filter({hasText:'text-box edge'})).toBeVisible(deadline);await expect(d.getByRole('button',{name:'Save PDF copy',exact:true})).toBeDisabled();expect(await fs.readFile(source)).toEqual(bytes);expect(await fs.access(output).then(()=>true,()=>false)).toBe(false);
 await d.getByRole('button',{name:'Close',exact:true}).click();await d.getByRole('button',{name:'Discard unsaved review draft and close',exact:true}).click();await expect(d).toHaveCount(0);expect(errors).toEqual([]);
});
