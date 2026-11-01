// Hidden, scoped check of document creation: status text, strikethrough, list levels, paper sizes and reopened output.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {PDFDocument} from 'pdf-lib';
import JSZip from 'jszip';
import mammoth from 'mammoth';
const output=path.resolve('tmp/document-editing-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Doc-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'Scoped new-document editing, page setup and DOCX/PDF output checks; not whole-editor acceptance.'};
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});throw error;}}
const saveTo=file=>app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async(_window,options)=>{global.pdfixCheckSuggested=options?.defaultPath;return {canceled:false,filePath};};},file);
const suggested=()=>app.evaluate(()=>global.pdfixCheckSuggested);
const tab=name=>page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name,exact:true}).click();
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'});
 await check('new document opens with readable status text',async()=>{
  await page.getByRole('button',{name:'New document',exact:true}).click();await editor.waitFor();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});
  await expect(page.locator('.draft-status')).toHaveText('Ready to edit');await editor.pressSequentially('Plain then ');
  await expect(page.locator('.draft-status')).toHaveText('Recovery draft saved locally',{timeout:10000});
  const garbled=await page.evaluate(()=>/[ÂÃâ][\u0080-¿‘-›€]/.test(document.body.innerText));if(garbled)throw new Error('Garbled characters are visible in the document workspace.');
 });
 await check('a new document can be named and the name survives leaving and returning',async()=>{
  const name=page.getByRole('textbox',{name:'Document name',exact:true});await expect(name).toHaveValue('Untitled document');await name.fill('Site: notes / draft');await name.press('Enter');
  await expect(page.locator('.document-title b')).toHaveText('Site: notes / draft');await expect(editor).toBeFocused();await editor.pressSequentially('named ');await expect(page.locator('.draft-status')).toHaveText('Recovery draft saved locally',{timeout:10000});
  // Home lists the unsaved document under its name; continuing it brings back its own draft.
  await page.getByRole('button',{name:'Home',exact:true}).click();await page.getByRole('button',{name:'Continue Site: notes / draft',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});
  await expect(page.locator('.draft-status')).toHaveText('Recovered local draft');await expect(page.getByRole('textbox',{name:'Document name',exact:true})).toHaveValue('Site: notes / draft');await expect(page.locator('.document-title b')).toHaveText('Site: notes / draft');await editor.press('Control+End');
 });
 await check('strikethrough button formats typed text',async()=>{
  const strike=page.getByRole('button',{name:'Strikethrough',exact:true});await strike.click();await expect(strike).toHaveAttribute('aria-pressed','true');await editor.pressSequentially('struck words');await expect(editor.locator('s')).toHaveText('struck words');await strike.click();await expect(strike).toHaveAttribute('aria-pressed','false');
 });
 await check('Tab at the start of a paragraph indents it and Shift+Tab brings it back',async()=>{
  await editor.press('Enter');await editor.pressSequentially('Tabbed paragraph');await editor.press('Home');await page.waitForTimeout(350);await editor.press('Tab');const tabbed=editor.locator('p').filter({hasText:'Tabbed paragraph'});await expect(tabbed).toHaveAttribute('data-pdfix-indent','1');await editor.press('Tab');await expect(tabbed).toHaveAttribute('data-pdfix-indent','2');
  await editor.press('Shift+Tab');await editor.press('Shift+Tab');await expect(tabbed).not.toHaveAttribute('data-pdfix-indent',/.+/);await expect(editor).toBeFocused();await editor.press('End');
 });
 await check('list indent and outdent buttons follow the list level',async()=>{
  await tab('Home');const indent=page.getByRole('button',{name:'Increase indent',exact:true}),outdent=page.getByRole('button',{name:'Decrease indent',exact:true});
  // Outside a list the same buttons indent the paragraph, so only Decrease is unavailable at the margin.
  await expect(indent).toBeEnabled();await expect(outdent).toBeDisabled();
  await editor.press('Enter');await page.getByRole('button',{name:'Bulleted list',exact:true}).click();await editor.pressSequentially('First item');await editor.press('Enter');await editor.pressSequentially('Nested item');
  await expect(indent).toBeEnabled();await indent.click();await expect(editor.locator('ul ul li')).toHaveText('Nested item');
  await expect(outdent).toBeEnabled();await outdent.click();await expect(editor.locator('ul ul')).toHaveCount(0);await indent.click();await expect(editor.locator('ul ul li')).toHaveText('Nested item');
  await page.screenshot({path:path.join(output,'home.png')});
 });
 await check('Legal landscape page setup reaches the editor sheet, DOCX and PDF',async()=>{
  await tab('Layout');const paper=page.locator('[data-layout="paper"]');report.paperOptions=await paper.locator('option').allTextContents();
  await paper.selectOption('legal');await page.locator('[data-layout="margin"]').fill('25');await page.locator('[data-layout="margin"]').dispatchEvent('change');await page.locator('[data-layout="landscape"]').selectOption('true');await expect(page.locator('.editor-page')).toHaveAttribute('style',/355\.6mm/);await page.screenshot({path:path.join(output,'layout-legal.png')});
  const docx=path.join(profile,'legal.docx');await saveTo(docx);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved legal.docx',{timeout:45000});
  report.suggestedDocx=await suggested();if(report.suggestedDocx!=='Site notes draft.docx')throw new Error('DOCX Save dialog suggested '+report.suggestedDocx);
  const bytes=await fs.readFile(docx),xml=await (await JSZip.loadAsync(bytes)).file('word/document.xml').async('string');report.docxPage=xml.match(/<w:pgSz [^>]*>/)[0];
  if(!/w:w="20160"/.test(report.docxPage)||!/w:h="12240"/.test(report.docxPage)||!/landscape/.test(report.docxPage))throw new Error('DOCX page size is '+report.docxPage);
  if(!/<w:strike\/>/.test(xml))throw new Error('DOCX copy lost the strikethrough run.');
  const html=(await mammoth.convertToHtml({buffer:bytes})).value;report.docxHtml=html;if(!/First item/.test(html)||!/<ul>.*<ul>.*Nested item/s.test(html))throw new Error('DOCX copy lost the nested list: '+html);
  const pdf=path.join(profile,'legal.pdf');await saveTo(pdf);await page.getByRole('button',{name:'Export PDF',exact:true}).click();const dialog=page.locator('.document-pdf-export');
  await expect(dialog.locator('[data-setting="paper"]')).toHaveValue('legal');await dialog.getByRole('button',{name:'Preview PDF',exact:true}).click();await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await page.screenshot({path:path.join(output,'pdf-preview.png')});
  await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await dialog.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(dialog.locator('.document-pdf-status')).toContainText('Saved legal.pdf',{timeout:45000});
  report.suggestedPdf=await suggested();if(report.suggestedPdf!=='Site notes draft.pdf')throw new Error('PDF Save dialog suggested '+report.suggestedPdf);
  const size=(await PDFDocument.load(await fs.readFile(pdf))).getPage(0).getSize();report.pdfPage=size;if(Math.abs(size.width-1008)>1.5||Math.abs(size.height-612)>1.5)throw new Error('PDF page size is '+JSON.stringify(size));
  await dialog.getByRole('button',{name:'Close PDF export',exact:true}).click();
 });
 await check('saved DOCX reopens with strikethrough and nested list intact',async()=>{
  await page.getByRole('button',{name:'Home',exact:true}).click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},path.join(profile,'legal.docx'));
  await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});
  await expect(editor.locator('s')).toHaveText('struck words');await expect(editor.locator('ul ul li')).toHaveText('Nested item');report.reopenedLayout={paper:await page.locator('[data-layout="paper"]').inputValue(),landscape:await page.locator('[data-layout="landscape"]').inputValue(),margin:await page.locator('[data-layout="margin"]').inputValue()};if(JSON.stringify(report.reopenedLayout)!==JSON.stringify({paper:'legal',landscape:'true',margin:'25'}))throw new Error('Reopened page setup is '+JSON.stringify(report.reopenedLayout));await page.waitForTimeout(900);await expect(page.locator('.draft-status')).toHaveText('Ready to edit');
  await page.screenshot({path:path.join(output,'reopened.png')});
 });
 await check('New blank document replaces an unsaved draft and keeps it in Version history',async()=>{
  const fresh=async()=>{await page.getByRole('button',{name:'Home',exact:true}).click();await page.getByRole('button',{name:'New document',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});};
  await fresh();const name=page.getByRole('textbox',{name:'Document name',exact:true});await expect(name).toHaveValue('Untitled document');await editor.pressSequentially('Throwaway draft text');await name.fill('Old draft');await name.press('Enter');await expect(page.locator('.draft-status')).toHaveText('Recovery draft saved locally',{timeout:10000});
  await tab('File');const blank=page.getByRole('button',{name:'New blank document',exact:true});await blank.click();await expect(editor).toContainText('Throwaway draft text');await page.getByRole('button',{name:'Confirm: start blank',exact:true}).click();
  await expect(page.locator('.draft-status')).toHaveText('Blank document ready');await expect(editor).toHaveText('');await expect(name).toHaveValue('Untitled document');await expect(page.locator('.document-title b')).toHaveText('Untitled document');
  await page.getByRole('button',{name:'Version history',exact:true}).click();const history=page.locator('dialog.version-history');await expect(history.locator('.version-row b').filter({hasText:'Before starting a blank document'})).toHaveCount(1);await history.locator('.version-row').filter({hasText:'Before starting a blank document'}).click();await expect(history.locator('pre')).toHaveText('Throwaway draft text');await history.getByRole('button',{name:'Close version history'}).click();
  await fresh();await expect(page.locator('.draft-status')).toHaveText('Ready to edit');await expect(editor).toHaveText('');await page.screenshot({path:path.join(output,'blank.png')});
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.closeBlocked={toast:await page.locator('#toast').textContent().catch(()=>null),status:await page.locator('.draft-status').textContent().catch(()=>null)};report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds.'});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exitCode=report.pass?0:1;
