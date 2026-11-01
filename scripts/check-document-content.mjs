// Hidden, scoped check of document content tools: tables, images, header/footer text, find/replace, undo and DOCX/RTF/PDF output.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {PDFDocument} from 'pdf-lib';
import JSZip from 'jszip';
import mammoth from 'mammoth';
const output=path.resolve('tmp/document-content-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Doc-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'Scoped table, image, header/footer, find/replace, undo and output checks on one new document; not whole-editor acceptance.'};
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
const saveTo=file=>app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},file);
const tab=name=>page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name,exact:true}).click();
const pdfItems=async file=>{const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');const task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile(file)),useSystemFonts:true});const pdf=await task.promise,items=(await (await pdf.getPage(1)).getTextContent()).items.filter(item=>item.str.trim()).map(item=>({text:item.str,x:item.transform[4]}));await task.destroy();return items;};
const pdfText=async file=>{const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');const task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile(file)),useSystemFonts:true});const pdf=await task.promise;let text='';for(let i=1;i<=pdf.numPages;i++)text+=(await (await pdf.getPage(i)).getTextContent()).items.map(item=>item.str).join(' ')+'\n';await task.destroy();return text;};
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'});
 await page.getByRole('button',{name:'New document',exact:true}).click();await editor.waitFor();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});
 await editor.pressSequentially('Alpha intro. The alpha value and ALPHA label.');
 // The first paragraph is indented two steps (one inch); the next paragraph is returned to the margin before the table.
 const more=page.getByRole('button',{name:'Increase indent',exact:true}),less=page.getByRole('button',{name:'Decrease indent',exact:true});await more.click();await more.click();await editor.press('Enter');await less.click();await less.click();await expect(editor.locator('p[data-pdfix-indent]')).toHaveCount(1);
 await check('table: insert, type across cells, add a row, undo and redo',async()=>{
  await tab('Insert');const tables=page.locator('.document-table-controls');await tables.locator('summary').click();await tables.locator('[data-rows]').fill('2');await tables.locator('[data-cols]').fill('3');await tables.getByRole('button',{name:'Insert table',exact:true}).click();
  await expect(editor.locator('table tr')).toHaveCount(2);await editor.locator('table th').first().click();
  for(const text of ['Item','Qty','Note','Bolt','12','Zinc']){await page.keyboard.type(text);if(text!=='Zinc')await page.keyboard.press('Tab');}
  await expect(editor.locator('table td').nth(2)).toHaveText('Zinc');await tables.getByRole('button',{name:'Row below',exact:true}).click();await expect(editor.locator('table tr')).toHaveCount(3);
  await page.keyboard.press('Control+z');await expect(editor.locator('table tr')).toHaveCount(2);await page.keyboard.press('Control+y');await expect(editor.locator('table tr')).toHaveCount(3);
  await tables.getByRole('button',{name:'Insert table',exact:true}).isDisabled().then(disabled=>{if(!disabled)throw new Error('Insert table stays enabled inside a table.');});
  await page.screenshot({path:path.join(output,'table.png')});await tables.locator('summary').click();
 });
 await check('image: insert a PNG after the table',async()=>{
  await editor.press('Control+End');await tab('Insert');const images=page.locator('.document-image-controls');await images.locator(':scope>summary').click();
  await images.locator('[data-file]').setInputFiles(path.resolve('tests/fixtures/scan-page.png'));await expect(editor.locator('img[data-pdfix-image]')).toHaveCount(1,{timeout:30000});
  report.image=await editor.locator('img[data-pdfix-image]').evaluate(image=>({width:image.width,height:image.height,complete:image.complete,natural:image.naturalWidth}));if(!report.image.natural)throw new Error('The inserted image did not render.');
  await page.screenshot({path:path.join(output,'image.png')});await images.locator(':scope>summary').click();
 });
 await check('header and footer text appear on the sheet preview',async()=>{
  await tab('Layout');await page.locator('[data-layout="paper"]').selectOption('letter');await page.locator('[data-layout="headerText"]').fill('Project Alpha header');await page.locator('[data-layout="footerText"]').fill('Rev 3 footer');
  await expect(page.locator('.document-band-preview-header')).toContainText('Project Alpha header');await expect(page.locator('.document-band-preview-footer')).toContainText('Rev 3 footer');await page.screenshot({path:path.join(output,'bands.png')});
 });
 await check('find counts matches; replace all and its undo work',async()=>{
  await editor.click();await page.keyboard.press('Control+f');const find=page.locator('[data-query]');await expect(find).toBeFocused();await find.fill('alpha');
  const bar=find.locator('xpath=ancestor::*[.//button[@data-all]][1]');report.findStatus=(await bar.textContent()).replace(/\s+/g,' ').slice(0,200);
  await expect(editor.locator('.document-find-match, [class*="find"]')).not.toHaveCount(0);
  await page.locator('[data-replacement]').fill('omega');await bar.locator('[data-all]').click();await expect(editor).not.toContainText(/alpha/i);await expect(editor).toContainText('omega intro. The omega value and omega label.');
  await bar.locator('[data-close]').click();await editor.click();await page.keyboard.press('Control+z');await expect(editor).toContainText('Alpha intro. The alpha value and ALPHA label.');
  await page.keyboard.press('Control+f');await bar.locator('[data-case]').check();await find.fill('alpha');await bar.locator('[data-all]').click();await expect(editor).toContainText('Alpha intro. The omega value and ALPHA label.');
  await bar.locator('[data-close]').click();await expect(find).toBeHidden();
 });
 await check('word count reflects the document',async()=>{await expect(page.locator('.word-count')).toContainText(/\d+\s+words?/i,{timeout:10000});report.wordCount=(await page.locator('.word-count').textContent()).trim();});
 const docx=path.join(profile,'content.docx'),rtf=path.join(profile,'content.rtf'),pdf=path.join(profile,'content.pdf');
 await check('DOCX copy keeps table, image, header, footer and replaced text',async()=>{
  await saveTo(docx);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved content.docx',{timeout:45000});
  const bytes=await fs.readFile(docx),zip=await JSZip.loadAsync(bytes),names=Object.keys(zip.files),html=(await mammoth.convertToHtml({buffer:bytes})).value;report.docxHtml=html.replace(/src="data:[^"]{40,}"/g,'src="data:…"').slice(0,900);
  for(const text of ['Alpha intro. The omega value and ALPHA label.','<table>','Item','Bolt','Zinc','<img'])if(!html.includes(text))throw new Error('DOCX copy is missing '+text);
  if(!names.some(name=>/^word\/media\//.test(name)))throw new Error('DOCX copy has no embedded image part.');
  let bands='';for(const name of names.filter(name=>/^word\/(header|footer)\d*\.xml$/.test(name)))bands+=await zip.file(name).async('string');if(!bands.includes('Project Alpha header')||!bands.includes('Rev 3 footer'))throw new Error('DOCX copy lost header or footer text.');
 });
 await check('PDF copy carries body, table, header and footer text',async()=>{
  await saveTo(pdf);await page.getByRole('button',{name:'Export PDF',exact:true}).click();const dialog=page.locator('.document-pdf-export');await dialog.getByRole('button',{name:'Preview PDF',exact:true}).click();await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await page.screenshot({path:path.join(output,'pdf-preview.png')});
  await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await dialog.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(dialog.locator('.document-pdf-status')).toContainText('Saved content.pdf',{timeout:45000});await dialog.getByRole('button',{name:'Close PDF export',exact:true}).click();
  report.pdfPages=(await PDFDocument.load(await fs.readFile(pdf))).getPageCount();const text=(await pdfText(pdf)).replace(/\s+/g,' ');report.pdfText=text.slice(0,500);
  for(const part of ['omega value','Item','Bolt','Zinc','Project Alpha header','Rev 3 footer'])if(!text.includes(part))throw new Error('PDF copy is missing "'+part+'"');
  const items=await pdfItems(pdf),body=items.find(item=>item.text.includes('intro')),header=items.find(item=>item.text.includes('Project Alpha header'));report.pdfIndentPoints=Math.round((body.x-header.x)*10)/10;
  if(Math.abs(report.pdfIndentPoints-72)>3)throw new Error('The indented paragraph starts '+report.pdfIndentPoints+' pt right of the margin in the PDF; expected about 72.');
 });
 await check('RTF copy saves and carries body and header text',async()=>{
  await tab('File');await saveTo(rtf);await page.getByRole('button',{name:'Export RTF copy',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved content.rtf',{timeout:45000});
  const text=(await fs.readFile(rtf)).toString('latin1');for(const part of ['omega value','Bolt','Project Alpha header','Rev 3 footer'])if(!text.includes(part))throw new Error('RTF copy is missing "'+part+'"');
 });
 const reopen=async file=>{await page.getByRole('button',{name:'Home',exact:true}).click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});};
 await check('reopened DOCX keeps table, image and header/footer and stays unmodified',async()=>{
  await reopen(docx);await expect(editor.locator('table tr')).toHaveCount(3);await expect(editor.locator('table')).toContainText('Zinc');report.reopenNotes=(await page.locator('.editor-warning').textContent()).slice(0,1500);await expect(editor.locator('table th')).toHaveCount(3);await expect(editor.locator('table td')).toHaveCount(6);await expect(editor.locator('img[data-pdfix-image]')).toHaveCount(1);await expect(editor).toContainText('The omega value');
  await expect(page.locator('.document-band-preview-header')).toContainText('Project Alpha header');await expect(page.locator('.document-band-preview-footer')).toContainText('Rev 3 footer');
  await expect(page.locator('[data-layout="paper"]')).toHaveValue('letter');await page.waitForTimeout(900);await expect(page.locator('.draft-status')).toHaveText('Ready to edit');await page.screenshot({path:path.join(output,'reopened-docx.png')});
 });
 await check('reopened RTF keeps body text and header/footer',async()=>{
  await reopen(rtf);await expect(editor).toContainText('The omega value');await expect(editor).toContainText('Bolt');await expect(editor.locator('table')).toHaveCount(1);report.rtfTableCells=await editor.locator('table th, table td').count();if(report.rtfTableCells<9)throw new Error('The reopened RTF table has '+report.rtfTableCells+' cells');report.rtfImages=await editor.locator('img[data-pdfix-image]').count();if(report.rtfImages<1)throw new Error('The reopened RTF lost its picture');
  await expect(page.locator('.document-band-preview-header')).toContainText('Project Alpha header');await expect(page.locator('.document-band-preview-footer')).toContainText('Rev 3 footer');
  await expect(page.locator('[data-layout="paper"]')).toHaveValue('letter');await page.waitForTimeout(900);report.rtfStatus=await page.locator('.draft-status').textContent();await page.screenshot({path:path.join(output,'reopened-rtf.png')});if(report.rtfStatus!=='Ready to edit')throw new Error('Reopened RTF status is "'+report.rtfStatus+'"');
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds: '+await page.locator('#toast').textContent().catch(()=>'')});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
