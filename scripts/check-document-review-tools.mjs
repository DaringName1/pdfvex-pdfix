// Hidden, scoped check of the remaining document tools: zoom, statistics, spell check, read-aloud preparation
// and the formatted header editor. Read aloud is prepared but never played, so no sound is produced.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import JSZip from 'jszip';
const output=path.resolve('tmp/document-review-tools-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Doc-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'Scoped zoom, statistics, spelling, read-aloud preparation and formatted-header checks on one new document. Speech playback, other dictionary languages and the personal dictionary were not exercised.'};
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}await page.keyboard.press('Escape').catch(()=>{});await page.locator('dialog[open] [aria-label="Close text tools"]').click({timeout:1000}).catch(()=>{});await page.locator('dialog[open]').getByRole('button',{name:'Cancel',exact:true}).click({timeout:1000}).catch(()=>{});}}
const tab=name=>page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name,exact:true}).click();
const FIRST='The quick brown fox jumps. A mispeled wurd is here.',SECOND='Second paragraph with nine words in it right here.';
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'}),tools=page.locator('dialog.document-text-tools-dialog');
 await page.getByRole('button',{name:'New document',exact:true}).click();await editor.waitFor();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});
 await editor.pressSequentially(FIRST);await editor.press('Enter');await editor.pressSequentially(SECOND);await expect(page.locator('.draft-status')).toHaveText('Recovery draft saved locally',{timeout:10000});
 await check('zoom: fixed levels, step buttons and fit width resize the sheet',async()=>{
  const select=page.getByRole('combobox',{name:'Document view zoom'}),sheet=page.locator('.editor-page'),width=async()=>Math.round((await sheet.boundingBox()).width);
  await select.selectOption('100');const full=await width();await select.selectOption('50');const half=await width();report.zoom={full,half};if(Math.abs(full-794)>6||Math.abs(half-full/2)>4)throw new Error('Sheet is '+full+' px at 100% and '+half+' px at 50%; A4 is 794 px wide at 100%.');
  await page.getByRole('button',{name:'Zoom document in',exact:true}).click();await expect(select).toHaveValue('75');await page.getByRole('button',{name:'Zoom document out',exact:true}).click();await expect(select).toHaveValue('50');
  await select.selectOption('fit');const fit=await width(),canvas=Math.round((await page.locator('.editor-canvas').boundingBox()).width);report.zoom.fit=fit;report.zoom.canvas=canvas;if(fit>canvas||fit<canvas*.8)throw new Error('Fit width gives a '+fit+' px sheet in a '+canvas+' px area.');
  await expect(editor).toContainText(SECOND);
 });
 await check('statistics count words, characters and paragraphs for the document and a selection',async()=>{
  await page.locator('.text-statistics-footer-button').click();const panel=page.locator('.text-statistics-workspace');await expect(panel).toBeVisible();await expect(panel.locator('.text-statistics-results')).toContainText(/Words\s*19/,{timeout:10000});
  const results=(await panel.locator('.text-statistics-results').evaluate(list=>[...list.children].map(item=>item.textContent.trim()).join(' '))).replace(/\s+/g,' ');report.statistics=results;const expected={Words:19,'Characters (with spaces)':FIRST.length+SECOND.length,'Characters (without spaces)':(FIRST+SECOND).replace(/\s/g,'').length,Paragraphs:2};
  for(const [label,value] of Object.entries(expected))if(!results.includes(label+' '+value))throw new Error('Expected '+label+' '+value+' in: '+results);
  await expect(page.locator('.word-count')).toHaveText('19 words');await panel.getByRole('button',{name:'Refresh',exact:true}).focus();await page.keyboard.press('Escape');await expect(panel).toBeHidden();
  await page.locator('.text-statistics-footer-button').click();await expect(panel).toBeVisible();await panel.getByRole('button',{name:'Close',exact:true}).click();await expect(panel).toBeHidden();
 });
 await check('spell check finds both errors; a suggestion replaces the word; Undo restores it; Ignore all clears the other',async()=>{
  await tab('Review');await page.locator('[data-document-spelling]').click();await tools.waitFor();const language=tools.getByRole('combobox',{name:'Spelling language'});await expect(language.locator('option')).not.toHaveCount(0,{timeout:30000});report.languages=await language.locator('option').allTextContents();
  const english=report.languages.find(name=>/en-US/.test(name))??report.languages.find(name=>/\ben-/.test(name));if(!english)throw new Error('No English Windows spelling dictionary is installed: '+JSON.stringify(report.languages));await language.selectOption({label:english});
  await tools.getByRole('button',{name:'Check text',exact:true}).click();await expect(tools).toContainText('2 possible spelling errors',{timeout:30000});await expect(editor.locator('.document-spelling-error')).toHaveCount(2);await page.screenshot({path:path.join(output,'spelling.png')});
  await tools.getByRole('button',{name:'misspelled',exact:true}).click();await expect(editor).toContainText('A misspelled wurd is here.');await expect(editor).not.toContainText('mispeled');
  // The remaining finding is listed again without pressing Check text.
  await expect(tools).toContainText('1 possible spelling error',{timeout:30000});await expect(tools.getByRole('button',{name:'Ignore all',exact:true})).toHaveCount(1);await expect(editor.locator('.document-spelling-error')).toHaveText('wurd');
  await tools.getByRole('button',{name:'Ignore all',exact:true}).first().click();await expect(editor.locator('.document-spelling-error')).toHaveCount(0,{timeout:15000});report.afterSpelling=(await tools.innerText()).replace(/\s+/g,' ').slice(160,420);
  await tools.getByRole('button',{name:'Close text tools'}).click();await expect(tools).toBeHidden();await editor.click();await page.waitForTimeout(350);await page.keyboard.press('Control+z');await expect(editor).toContainText('A mispeled wurd is here.');await page.keyboard.press('Control+y');await expect(editor).toContainText('A misspelled wurd is here.');
 });
 await check('Ignore once and Ignore all last while the document is open: after closing the panel, an edit elsewhere and a new check',async()=>{
  await editor.press('Control+End');await editor.pressSequentially(' Anuther mistaek here.');await page.waitForTimeout(600);await tab('Review');await page.locator('[data-document-spelling]').click();await tools.waitFor();
  const language=tools.getByRole('combobox',{name:'Spelling language'});await language.selectOption({label:report.languages.find(name=>/en-US/.test(name))??report.languages.find(name=>/en-/.test(name))});
  await tools.getByRole('button',{name:'Check text',exact:true}).click();await expect(tools).toContainText('2 possible spelling errors',{timeout:30000});await expect(editor.locator('.document-spelling-error')).toHaveText(['Anuther','mistaek']);
  const row=tools.locator('li,div').filter({hasText:/^mistaek/}).first();await tools.getByRole('button',{name:'Ignore once',exact:true}).last().click();await expect(tools).toContainText('1 possible spelling error',{timeout:15000});
  await tools.getByRole('button',{name:'Close text tools'}).click();await editor.press('Control+Home');await editor.pressSequentially('Intro. ');await page.waitForTimeout(600);
  await tab('Review');await page.locator('[data-document-spelling]').click();await language.selectOption({label:report.languages.find(name=>/en-US/.test(name))??report.languages.find(name=>/en-/.test(name))});await tools.getByRole('button',{name:'Check text',exact:true}).click();await expect(tools).toContainText('1 possible spelling error',{timeout:30000});await expect(editor.locator('.document-spelling-error')).toHaveText('Anuther');
  await tools.getByRole('button',{name:'Close text tools'}).click();
 });
 await check('read aloud prepares the whole document text for review and enables Play, without playing',async()=>{
  await tab('Review');await page.locator('[data-document-speech]').click();await tools.waitFor();await page.waitForTimeout(2500);report.voices=await tools.getByRole('combobox',{name:'Installed Windows voice'}).locator('option').allTextContents();
  await tools.getByRole('combobox',{name:'Read aloud text scope'}).selectOption({label:'Whole document'});await tools.getByRole('button',{name:'Prepare text',exact:true}).click();const prepared=tools.getByRole('textbox',{name:'Prepared read aloud text'});
  await expect(prepared).toHaveValue(/Second paragraph with nine words/,{timeout:30000});const text=await prepared.inputValue();report.prepared=text.replace(/\s+/g,' ').slice(0,160);if(!text.includes('A misspelled wurd is here.'))throw new Error('Prepared text does not reflect the edited document: '+report.prepared);
  if(report.voices.length)await expect(tools.getByRole('button',{name:'Play',exact:true})).toBeEnabled();else report.note='No Windows voice is installed, so Play stays unavailable.';await expect(tools.getByRole('button',{name:'Stop',exact:true})).toBeDisabled();
  await tools.getByRole('button',{name:'Close text tools'}).click();await expect(tools).toBeHidden();
 });
 const docx=path.join(profile,'review.docx');
 await check('formatted header: two styled runs, centered, shown on the sheet, written to DOCX and kept on reopen',async()=>{
  await tab('Layout');await page.getByRole('button',{name:'Format header',exact:true}).click();const band=page.locator('dialog.document-band-editor');await band.waitFor();
  await band.getByRole('combobox',{name:'Paragraph 1 alignment'}).selectOption('center');await band.getByRole('textbox',{name:'Paragraph 1, text run 1'}).fill('Project Alpha ');
  await band.getByRole('button',{name:'Add text run',exact:true}).click();await band.getByRole('textbox',{name:'Paragraph 1, text run 2'}).fill('CONFIDENTIAL');await band.getByRole('combobox',{name:'Paragraph 1 run 2 Font'}).selectOption({label:'Times New Roman'});await band.getByLabel('Paragraph 1 run 2 Size (pt)').fill('14');
  await band.getByLabel('Paragraph 1 run 2 Color').evaluate(input=>{input.value='#c00000';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});
  const boxes=band.locator('input[type=checkbox]');report.bandCheckboxNames=await boxes.evaluateAll(list=>list.map(box=>box.getAttribute('aria-label')||box.labels?.[0]?.textContent?.trim()||''));await boxes.nth(3).check();
  for(const name of ['Bold','Italic','Underline'])await expect(band.getByRole('checkbox',{name:'Paragraph 1 run 2 '+name,exact:true})).toHaveCount(1);await band.getByRole('button',{name:'Apply header',exact:true}).click();await expect(band).toBeHidden();const preview=page.locator('.document-band-preview-header');await expect(preview).toHaveText('Project Alpha CONFIDENTIAL');
  report.bandPreview=await preview.locator('span').evaluateAll(spans=>spans.map(span=>({text:span.textContent,weight:span.style.fontWeight,size:span.style.fontSize,color:span.style.color,align:span.parentElement.style.textAlign})));
  const second=report.bandPreview[1];if(!second||second.weight!=='bold'||second.size!=='14pt'||second.color!=='rgb(192, 0, 0)'||second.align!=='center')throw new Error('Header preview is '+JSON.stringify(report.bandPreview));
  await expect(page.locator('[data-layout="headerText"]')).toBeDisabled();await page.screenshot({path:path.join(output,'header.png')});
  await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},docx);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved review.docx',{timeout:45000});
  const zip=await JSZip.loadAsync(await fs.readFile(docx));let header='';for(const name of Object.keys(zip.files).filter(name=>/^word\/header\d*\.xml$/.test(name)))header+=await zip.file(name).async('string');
  if(!/CONFIDENTIAL/.test(header)||!/<w:b\/>|<w:b w:val="true"\/>/.test(header)||!/w:val="C00000"/i.test(header)||!/w:sz w:val="28"/.test(header)||!/<w:jc w:val="center"\/>/.test(header))throw new Error('DOCX header lacks the styled run: '+header.replace(/<[^>]+>/g,' ').slice(0,200));
  const before=JSON.stringify(report.bandPreview);await page.getByRole('button',{name:'Home',exact:true}).click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},docx);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});
  const after=JSON.stringify(await preview.locator('span').evaluateAll(spans=>spans.map(span=>({text:span.textContent,weight:span.style.fontWeight,size:span.style.fontSize,color:span.style.color,align:span.parentElement.style.textAlign}))));if(after!==before)throw new Error('Reopened header is '+after);
  await expect(editor).toContainText('A misspelled wurd is here.');await page.waitForTimeout(900);await expect(page.locator('.draft-status')).toHaveText('Ready to edit');
 });
 // Left running on purpose: the window must still close while a spell check is in progress (checked in "finally").
 await check('start a spell check and leave it running for the close test',async()=>{await tab('Review');await page.locator('[data-document-spelling]').click();await tools.waitFor();await expect(tools.getByRole('combobox',{name:'Spelling language'}).locator('option')).not.toHaveCount(0,{timeout:30000});await tools.getByRole('button',{name:'Check text',exact:true}).click();});
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds: '+await page.locator('#toast').textContent().catch(()=>'')});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
