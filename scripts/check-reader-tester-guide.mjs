// Rehearse the drawing instructions using disposable files and a hidden built app.
// Never invokes Windows printing; the check ends at the reviewed print preview.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {PDFDocument,PDFName} from 'pdf-lib';
import {expect} from '@playwright/test';
import {launchReader} from '../tests/helpers/reader-launch.mjs';
import {readerRuntime} from '../tests/helpers/reader-runtime.mjs';
import {closeReaderApp} from '../tests/helpers/reader-desktop.mjs';
import {ownedReceipt,stopOwned} from '../tests/helpers/reader-process-tree.mjs';
import {actions} from './user-robot/actions-codex.mjs';
const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-tester-guide-'));
const report={root,checks:[],errors:[],screenshots:[],physicalPrinting:false};let app,page,timer;
const check=name=>{report.checks.push(name);console.log('PASS '+name);};
async function shot(name){const file=path.join(root,name+'.png');await page.screenshot({path:file});report.screenshots.push(file);}
try{
 app=await launchReader({args:[await readerRuntime()],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}});
 page=await app.firstWindow();page.setDefaultTimeout(60000);page.on('pageerror',e=>report.errors.push(e.message));timer=setTimeout(()=>ownedReceipt(app).then(receipt=>stopOwned(receipt.processes)).catch(error=>console.error('Guide timeout cleanup: '+error.message)),300000);
 if(process.env.PDFIX_GUIDE_SMALL==='1'){await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(800,620));await page.getByRole('button',{name:/Settings/}).click();await page.getByRole('combobox',{name:'Interface text size',exact:true}).selectOption('1.5');await page.getByRole('button',{name:'Home',exact:true}).click();report.config={width:800,height:620,interfaceText:150};}
 const ctx={files:path.join(root,'files'),chooseFile:file=>app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file),saveAs:file=>app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},file),goHome:async()=>{await page.getByRole('button',{name:'Home',exact:true}).click();}};
 // This creates a generated drawing fixture and independently verifies the reader copy.
 await actions[0].run(page,ctx);expect((await actions[0].verify(ctx)).pass).toBe(true);
 await ctx.goHome();await ctx.chooseFile(ctx.codexFixtures.source);await page.getByRole('button',{name:'Open a file',exact:true}).click();
 let artwork=page.getByLabel('Rendered PDF page 1',{exact:true});await artwork.waitFor();
 const bounds=await artwork.boundingBox(),before=bounds.width;await page.mouse.move(bounds.x+50,bounds.y+50);await page.keyboard.down('Control');try{await page.mouse.wheel(0,-80);}finally{await page.keyboard.up('Control');}
 await expect.poll(async()=> (await artwork.boundingBox()).width).toBeGreaterThan(before);check('Ctrl+wheel enlarges the drawing under the pointer');
 for(const name of ['Zoom out','Zoom in'])await page.getByRole('button',{name,exact:true}).click();
 await artwork.waitFor();check('Visible minus and plus buttons work');
 await page.keyboard.press('Control+f');const query=page.getByRole('searchbox',{name:'Search selectable text',exact:true});await expect(query).toBeFocused();await query.fill('needle');await query.press('Enter');
 await expect(page.getByRole('button',{name:'Next search match',exact:true})).toBeEnabled();await query.press('F3');const position=page.getByText(/^\d+ of 3$/);await expect(position).toBeVisible();const initial=await position.innerText();await query.press('F3');await expect(position).not.toHaveText(initial);check('Ctrl+F, Enter and F3 search selectable drawing text');
 await shot('reader-search');
 await ctx.goHome();await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();await page.getByRole('searchbox',{name:'Find a tool across workspaces',exact:true}).fill('Mark up a PDF');await ctx.chooseFile(ctx.codexFixtures.source);await page.locator('.workspace-room-grid button').filter({has:page.getByRole('heading',{name:'Mark up a PDF',exact:true})}).click();
 const d=page.locator('.markup-workspace'),tool=page.getByRole('toolbar',{name:'Comment tools',exact:true}),surface=page.getByRole('img',{name:'Markup drawing surface',exact:true});await expect(tool.getByRole('button',{name:'Select',exact:true})).toBeEnabled({timeout:120000});
 await tool.getByRole('button',{name:'Comment',exact:true}).click();await expect.poll(async()=>(await surface.boundingBox())?.width||0).toBeGreaterThan(120);const noteBox=await surface.boundingBox();await surface.click({position:{x:noteBox.width*.3,y:noteBox.height*.3}});await d.getByRole('textbox',{name:'Markup comment or text',exact:true}).fill('Tester guide note');
 for(const label of ['Arrow','Cloud']){await tool.getByRole('button',{name:label,exact:true}).click();await surface.scrollIntoViewIfNeeded();const b=await surface.boundingBox();await page.mouse.move(b.x+b.width*.2,b.y+b.height*.3);await page.mouse.down();await page.mouse.move(b.x+b.width*.7,b.y+b.height*.5,{steps:8});await page.mouse.up();}
 await d.getByRole('button',{name:'Preview annotated copy',exact:true}).click();await expect(d.getByRole('button',{name:'Save annotated copy',exact:true})).toBeEnabled({timeout:90000});await expect(d.locator('.markup-output-reader .reader-inspector')).not.toBeVisible();await expect(d.locator('.markup-output-reader .pdf-navigation')).not.toBeVisible();report.previewPanesIsolated=true;await shot('drawing-markup-preview');
 const output=path.join(ctx.files,'guide-markup.pdf');await ctx.saveAs(output);await d.getByRole('button',{name:'Save annotated copy',exact:true}).click();await expect(d.getByRole('button',{name:'Preview annotated copy',exact:true})).toBeEnabled();
 const pdf=await PDFDocument.load(await fs.readFile(output)),annots=pdf.getPage(0).node.lookup(PDFName.of('Annots')),rows=Array.from({length:annots.size()},(_,i)=>pdf.context.lookup(annots.get(i)));
 expect(rows.some(r=>r.get(PDFName.of('Contents'))?.decodeText?.()==='Tester guide note')).toBe(true);
 expect(rows.some(r=>r.get(PDFName.of('Subtype'))?.toString()==='/Line')).toBe(true);
 expect(rows.some(r=>r.get(PDFName.of('Subtype'))?.toString()==='/Square')).toBe(true);
 check('All tools > Mark up a PDF; direct Note, Arrow and Cloud buttons; saved annotations independently checked');await d.getByRole('button',{name:'Close markup workspace',exact:true}).click();if(process.env.PDFIX_GUIDE_SMALL==='1'){await expect(page.locator('.document-area .reader-inspector')).toBeVisible();await expect(page.locator('.document-area .pdf-navigation')).toBeVisible();report.temporaryPanesRestored=true;}
 await ctx.goHome();await ctx.chooseFile(output);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.getByLabel('Rendered PDF page 1',{exact:true}).waitFor();await page.getByRole('button',{name:'Print',exact:true}).click();const print=page.getByRole('dialog').last();
 await expect(print.getByRole('heading',{name:'Prepare and review printing',exact:true})).toBeVisible();await print.getByRole('button',{name:'Refresh preview',exact:true}).click();await expect(print.getByRole('button',{name:'Print',exact:true})).toBeEnabled({timeout:120000});await expect(print.getByRole('button',{name:'Print',exact:true})).toBeEnabled();await shot('saved-markup-print-preview');await page.keyboard.press('Escape');await expect(print).not.toBeVisible();check('Saved drawing reopens; Print prepares sheets and enables Windows dialog after review (not sent)');
 await actions.at(-1).run(page,ctx);const result=await actions.at(-1).verify(ctx);expect(result.pass,result.problems.join('; ')).toBe(true);report.measurement=result.info;check('Measure drawing: confirm known scale, finish line and independently recompute saved 100 mm ledger');
 expect(await fs.readFile(ctx.codexFixtures.source)).toEqual(await fs.readFile(ctx.codexFixtures.inputs[0][0]));
}catch(error){report.error=error.stack;if(page)await shot('failure').catch(()=>{});}
finally{clearTimeout(timer);try{await closeReaderApp(app);report.closed=true;}catch(error){report.closeError=error.message;}}
report.pass=report.checks.length===6&&!report.error&&!report.errors.length&&report.closed;await fs.writeFile(path.join(root,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exitCode=report.pass?0:1;
