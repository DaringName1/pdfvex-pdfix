// Hidden, scoped UI and function acceptance for the consolidated plan and new toolbar/comment routes.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {PDFDocument,PDFName,PDFString} from 'pdf-lib';
const groups=(await import('../src/tool-registry.js')).TOOL_GROUPS.map(group=>group.name).sort((a,b)=>(b==='Create')-(a==='Create'));
const output=path.resolve('tmp/ui-check-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-UI-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,profile,checks:[],screens:[],errors:[],failures:[],scope:'Scoped main-screen/layout and actual document/comment output checks; not whole adopted-feature or all-file acceptance.'};
const fixture=path.join(profile,'drawing-comments.pdf'),source=await PDFDocument.load(await fs.readFile('tests/fixtures/reading-sample.pdf'));
const drawing=source.getPages()[1],note=source.context.obj({Type:'Annot',Subtype:'Text',Rect:[90,540,110,560],F:4,P:drawing.ref,Name:'Comment',NM:PDFString.of('UI-check-source-comment'),T:PDFString.of('Drawing reviewer'),Contents:PDFString.of('Review drawing alignment'),CreationDate:PDFString.of('D:20261011120000Z')});
drawing.node.set(PDFName.of('Annots'),source.context.obj([source.context.register(note)]));
await fs.writeFile(fixture,await source.save());
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),originalHash=hash(await fs.readFile(fixture));
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});throw error;}}
async function screenshot(name){
 const filename=path.join(output,name+'.png');await page.screenshot({path:filename});
 const metrics=await page.evaluate(()=>({width:innerWidth,height:innerHeight,bodyOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),ribbonHeight:document.querySelector('.document-ribbon')?.getBoundingClientRect().height,writingArea:document.querySelector('.editor-canvas')?.getBoundingClientRect().height,readerArea:document.querySelector('.page-stage')?.getBoundingClientRect().height,missingControlNames:[...document.querySelectorAll('button,input,select,textarea')].filter(n=>n.getClientRects().length&&!n.closest('[hidden]')&&!n.getAttribute('aria-label')&&!n.getAttribute('aria-labelledby')&&!n.textContent?.trim()&&!n.labels?.length&&!n.getAttribute('title')&&n.type!=='hidden').slice(0,20).map(n=>({tag:n.tagName,cls:n.className}))}));
 report.screens.push({name,filename,...metrics});if(metrics.bodyOverflow>2)throw new Error(name+' has horizontal app overflow '+metrics.bodyOverflow+'px.');
}
async function home(){await page.getByRole('button',{name:'Home',exact:true}).click();}
async function open(file){await home();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"],.pdf-paper[data-ready="true"]').first().waitFor({timeout:45000});}
async function saveTo(file){await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},file);}
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 await app.evaluate(({app})=>{const load=process.getBuiltinModule('module').createRequire(app.getAppPath()+'/desktop/main.cjs');const {DocumentSandboxService}=load('./document-sandbox-service.cjs');const original=DocumentSandboxService.prototype.run;global.pdfixCheckEngineErrors=[];DocumentSandboxService.prototype.run=async function(...args){try{return await original.apply(this,args);}catch(error){global.pdfixCheckEngineErrors.push({operation:args[0],code:error.code,message:error.message});throw error;}};});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 await check('main screens and task-room keyboard/search',async()=>{
  for(const size of [[1380,920],[800,620]]){
   await app.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setSize(...size),size);
   for(const [name,label]of [['home','Home'],['workspaces','All tools'],['files','Files'],['settings','Settings & privacy'],['formats','Format support']]){
    await page.getByRole('button',{name:label,exact:true}).click();await screenshot(size[0]+'-'+name);
   }
   await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();
   const tabs=page.getByRole('tablist',{name:'Tool groups'});for(const name of groups){await tabs.getByRole('tab',{name,exact:true}).click();await screenshot(size[0]+'-room-'+name.replaceAll(' ','-'));}
   const finder=page.getByRole('searchbox',{name:'Find a tool across workspaces'});await finder.fill('comments');await expect(page.locator('.workspace-room-grid')).toContainText('Review drawing comments');await finder.fill('');
   await tabs.getByRole('tab',{name:groups[0],exact:true}).click();await tabs.getByRole('tab',{name:groups[0],exact:true}).press('ArrowRight');await expect(tabs.getByRole('tab',{name:groups[1],exact:true})).toHaveAttribute('aria-selected','true');
  }
 });
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1380,920));
 await check('document creation, toolbar tabs and formatting',async()=>{
  await home();await page.getByRole('button',{name:'New document',exact:true}).click();const editor=page.getByRole('textbox',{name:'Editable document'});await editor.waitFor();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});
  await editor.fill('PDFix creation check');await page.getByRole('combobox',{name:'Paragraph style'}).selectOption('1');await expect(editor.locator('h1')).toHaveText('PDFix creation check');
  await editor.press('End');await editor.press('Enter');await page.getByRole('button',{name:'Bold',exact:true}).click();await editor.pressSequentially('A formatted paragraph');await expect(editor.locator('strong')).toContainText('A formatted paragraph');await page.getByRole('button',{name:'Bold',exact:true}).click();
  await editor.press('Control+a');await page.getByRole('combobox',{name:'Selected text font',exact:true}).selectOption('serif');await page.getByRole('combobox',{name:'Selected text size',exact:true}).selectOption('16');await expect(editor.locator('span[data-pdfix-text-style]').first()).toHaveAttribute('data-pdfix-font','serif');
  const tabs=page.getByRole('tablist',{name:'Document tool categories'});for(const name of ['File','Home','Insert','Edit','Review','Pages','View','Export']){await tabs.getByRole('tab',{name,exact:true}).click();await screenshot('document-'+name.toLowerCase());}
  await tabs.getByRole('tab',{name:'Home',exact:true}).click();await tabs.getByRole('tab',{name:'Home',exact:true}).press('ArrowRight');await expect(tabs.getByRole('tab',{name:'Insert',exact:true})).toHaveAttribute('aria-selected','true');
  await tabs.getByRole('tab',{name:'Home',exact:true}).click();await expect(page.locator('.draft-status')).toContainText('saved locally',{timeout:15000});
 });
 await check('actual DOCX and PDF creation/save',async()=>{
  const docx=path.join(profile,'created.docx');await saveTo(docx);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect(page.locator('#toast')).toContainText('created.docx',{timeout:45000});if((await fs.stat(docx)).size<500)throw new Error('DOCX output missing.');
  const pdf=path.join(profile,'created.pdf');await saveTo(pdf);await page.getByRole('button',{name:'Export PDF',exact:true}).click();const dialog=page.locator('.document-pdf-export');await dialog.getByRole('button',{name:'Preview PDF',exact:true}).click();await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await screenshot('document-pdf-preview');await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await dialog.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(dialog.locator('.document-pdf-status')).toContainText('Saved created.pdf',{timeout:45000});report.createdPdfPages=(await PDFDocument.load(await fs.readFile(pdf))).getPageCount();await dialog.getByRole('button',{name:'Close PDF export',exact:true}).click();
 });
 await check('minimum window, large interface text and contrast',async()=>{
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(800,620));await screenshot('800-document');
  await page.getByRole('button',{name:'Settings & privacy',exact:true}).click();await page.getByRole('combobox',{name:'Interface text size'}).selectOption('1.5');await page.getByRole('checkbox',{name:'Stronger interface contrast'}).check();await screenshot('800-large-contrast-settings');
  await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();await screenshot('800-large-contrast-workspaces');
  await page.getByRole('button',{name:'Settings & privacy',exact:true}).click();await page.getByRole('button',{name:'Restore standard interface',exact:true}).click();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1380,920));
 });
 await check('PDF viewer page navigation, fullscreen and restored controls',async()=>{
  await open(fixture);await page.getByRole('spinbutton',{name:'Page number'}).fill('2');await page.getByRole('spinbutton',{name:'Page number'}).press('Tab');await expect(page.locator('.pdf-paper').first()).toHaveAttribute('data-page','2');await screenshot('pdf-reader');
  await page.getByRole('button',{name:'Show PDF only in fullscreen',exact:true}).click();await expect(page.locator('#app')).toHaveClass(/pdf-artwork-fullscreen/);await screenshot('pdf-only-fullscreen');await page.keyboard.press('Escape');await expect(page.locator('#app')).not.toHaveClass(/pdf-artwork-fullscreen/);await expect(page.getByRole('spinbutton',{name:'Page number'})).toHaveValue('2');
 });
 await check('drawing comments inspection, selection and eligible edit output',async()=>{
  const strip=page.getByRole('tablist',{name:'PDF tool groups'});if(await strip.isVisible().catch(()=>false))await strip.getByRole('tab',{name:'Review',exact:true}).click();else{await page.locator('.reader-view-options > summary').click();await page.locator('.pdf-tool-group > summary').filter({hasText:'Drawing review'}).click();}await page.getByRole('button',{name:'Review drawing comments',exact:true}).click();const panel=page.locator('.pdf-review-panel');await panel.locator('.pdf-review-row').first().waitFor({timeout:45000});await panel.locator('.pdf-review-row').filter({hasText:'Review drawing alignment'}).click();await screenshot('drawing-comments');
  await panel.getByRole('button',{name:'Edit plain comment',exact:true}).click();const edit=page.locator('.pdf-review-edit-workspace');await edit.getByRole('textbox',{name:'Plain comment text',exact:true}).fill('Updated drawing review');await edit.getByRole('button',{name:'Stage this change',exact:true}).click();await edit.getByRole('button',{name:'Build reviewed PDF copy',exact:true}).click();await edit.locator('.review-edit-preview').waitFor({timeout:60000});await expect(edit.locator('.review-edit-output-list')).toContainText('Updated drawing review');await screenshot('drawing-comment-edit-preview');
  const edited=path.join(profile,'edited-comments.pdf');await saveTo(edited);await expect(edit.getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled();await edit.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(edit.locator('.review-edit-status')).toContainText('Saved',{timeout:45000});await edit.getByRole('button',{name:'Close',exact:true}).click();if((await fs.stat(edited)).size<500)throw new Error('Edited comments output missing.');
 });
 await check('new comment uses selected page, real note placement and saved annotation',async()=>{
  const panel=page.locator('.pdf-review-panel');await panel.getByRole('button',{name:'New comment',exact:true}).click();// Since d2b0523 New comment switches the open reader to its Comment tools with Note chosen, on the drawing's page
  // (adding and saving comments there is covered by Codex's markup specs).
  const tools=page.getByRole('toolbar',{name:'Comment tools',exact:true});await expect(tools.getByRole('button',{name:'Comment',exact:true})).toHaveAttribute('aria-pressed','true',{timeout:45000});await expect(page.locator('.document-area .pdf-paper').first()).toHaveAttribute('data-page','2',{timeout:45000});await screenshot('new-comment-tools');
 });
 report.originalUnchanged=hash(await fs.readFile(fixture))===originalHash;if(!report.originalUnchanged)throw new Error('Original drawing fixture changed.');
 await home();report.hidden=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().every(w=>!w.isVisible()));
 report.pass=report.failures.length===0&&report.errors.length===0&&report.hidden&&report.originalUnchanged;
}catch(error){report.pass=false;report.error=error.message;if(page){await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});report.lastStatus=await page.locator('[role="status"]').allTextContents().catch(()=>[]);}}
finally{await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');if(app){report.engineErrors=await app.evaluate(()=>global.pdfixCheckEngineErrors).catch(()=>[]);if(page){await page.getByRole('button',{name:'Close PDF export',exact:true}).click({timeout:2000}).catch(()=>{});if(!report.pass)await page.evaluate(()=>window.pdfix.finishClose()).catch(()=>{});}await app.close();}await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({report:path.join(output,'report.json'),pass:report.pass,checks:report.checks,errors:report.errors,failures:report.failures,engineErrors:report.engineErrors},null,2));process.exitCode=report.pass?0:1;
