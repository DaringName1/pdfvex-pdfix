// Hidden, scoped check of document hyperlinks: create, popup-before-open, refusal of unsafe targets, DOCX/RTF/PDF output and reopen.
// The system browser is never started: the main-process opener is replaced with a recorder for this run.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import JSZip from 'jszip';
import mammoth from 'mammoth';
const output=path.resolve('tmp/document-links-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Doc-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'Scoped hyperlink checks on one new document; the real browser/email handoff is replaced by a recorder and was not exercised.'};
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
const saveTo=file=>app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},file);
const opened=()=>app.evaluate(()=>global.pdfixCheckOpened);
const tab=name=>page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name,exact:true}).click();
const WEB='https://example.com/guide?x=1#top',MAIL='mailto:sales@example.com';
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 await app.evaluate(({shell})=>{global.pdfixCheckOpened=[];shell.openExternal=async url=>{global.pdfixCheckOpened.push(url);};});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'}),popup=page.locator('.document-link-popup'),url=page.locator('[data-link-url]'),status=page.locator('.document-link-controls [role=status]');
 await page.getByRole('button',{name:'New document',exact:true}).click();await editor.waitFor();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});
 await editor.pressSequentially('See the manual today.');
 await check('Ctrl+K links the selected word; a bare domain becomes https',async()=>{
  await editor.getByText('See the manual today.').dblclick({position:{x:95,y:8}});const picked=await page.evaluate(()=>getSelection().toString().trim());if(picked!=='manual')throw new Error('Test selection was "'+picked+'"');
  await page.keyboard.press('Control+k');await expect(url).toBeFocused();await url.fill('example.com/guide?x=1#top');await url.press('Enter');
  await expect(editor.locator('a.document-link')).toHaveText('manual');await expect(editor.locator('a.document-link')).toHaveAttribute('href',WEB);await expect(page.locator('.draft-status')).toHaveText('Recovery draft saved locally',{timeout:10000});
 });
 await check('unsafe or malformed addresses are refused and nothing is linked',async()=>{
  await editor.press('Control+End');await editor.pressSequentially(' plain');await editor.press('Shift+Control+ArrowLeft');
  for(const bad of ['javascript:alert(1)','file:///C:/Windows/win.ini','https://user:pw@example.com/','not a link','data:text/html,x']){await page.keyboard.press('Control+k');await url.fill(bad);await url.press('Enter');await expect(status).toContainText('Use a web address');await expect(editor.locator('a.document-link')).toHaveCount(1);await editor.click({position:{x:5,y:5}});await editor.press('Control+End');await editor.press('Shift+Control+ArrowLeft');}
  for(const bad of ['file:///C:/Windows/win.ini','javascript:alert(1)','https://example.com/a b','HTTPS://EXAMPLE.COM/']){const result=await page.evaluate(href=>window.pdfix.openDocumentLink(href).then(()=>'opened',error=>'refused: '+error.message),bad);if(!result.startsWith('refused'))throw new Error('The bridge opened '+bad);}
  if((await opened()).length)throw new Error('Something was opened: '+JSON.stringify(await opened()));
 });
 await check('clicking a link only shows its address; the popup button opens it once',async()=>{
  await editor.locator('a.document-link').click();await expect(popup).toBeVisible();await expect(popup.locator('.document-link-address')).toHaveText(WEB);await expect(popup.locator('.document-link-note')).toContainText('web browser');
  if((await opened()).length)throw new Error('The first click already opened the link.');if(await page.evaluate(()=>location.href)!=='pdfix://app/')throw new Error('The window navigated to '+await page.evaluate(()=>location.href));
  await page.screenshot({path:path.join(output,'popup.png')});await page.keyboard.press('Escape');await expect(popup).toBeHidden();
  await editor.locator('a.document-link').click();await popup.getByRole('button',{name:'Open link',exact:true}).click();await expect(popup).toBeHidden();await expect(page.locator('#toast')).toContainText('Opened in your browser');
  report.opened=await opened();if(JSON.stringify(report.opened)!==JSON.stringify([WEB]))throw new Error('Opened '+JSON.stringify(report.opened));
 });
 await check('an address typed with no selection inserts linked text; remove and undo work',async()=>{
  await editor.press('Control+End');await editor.pressSequentially(' Contact ');await page.keyboard.press('Control+k');await url.fill('sales@example.com');await url.press('Enter');
  const mail=editor.locator('a.document-link[href="'+MAIL+'"]');await expect(mail).toHaveText('sales@example.com');
  await mail.click();await expect(popup.locator('.document-link-note')).toContainText('email app');await popup.getByRole('button',{name:'Remove',exact:true}).click();await expect(mail).toHaveCount(0);await expect(editor).toContainText('Contact sales@example.com');
  await editor.click({position:{x:5,y:5}});await page.keyboard.press('Control+z');await expect(mail).toHaveCount(1);await tab('Insert');await page.screenshot({path:path.join(output,'links-panel.png')});
 });
 const docx=path.join(profile,'links.docx'),rtf=path.join(profile,'links.rtf'),pdf=path.join(profile,'links.pdf');
 await check('DOCX copy carries both links',async()=>{
  await saveTo(docx);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved links.docx',{timeout:45000});
  const bytes=await fs.readFile(docx),zip=await JSZip.loadAsync(bytes),rels=await zip.file('word/_rels/document.xml.rels').async('string'),xml=await zip.file('word/document.xml').async('string'),html=(await mammoth.convertToHtml({buffer:bytes})).value;report.docxHtml=html;
  if((xml.match(/<w:hyperlink /g)??[]).length!==2)throw new Error('DOCX has '+(xml.match(/<w:hyperlink /g)??[]).length+' hyperlinks.');if(!rels.includes('TargetMode="External"')||!rels.includes('example.com/guide'))throw new Error('DOCX relationships lack the external target.');
  if(!html.includes('<a href="https://example.com/guide?x=1#top">manual</a>')||!html.includes('<a href="mailto:sales@example.com">sales@example.com</a>'))throw new Error('DOCX read back as '+html);
 });
 await check('PDF copy carries clickable link annotations',async()=>{
  await saveTo(pdf);await page.getByRole('button',{name:'Export PDF',exact:true}).click();const dialog=page.locator('.document-pdf-export');await dialog.getByRole('button',{name:'Preview PDF',exact:true}).click();await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});
  await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await dialog.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(dialog.locator('.document-pdf-status')).toContainText('Saved links.pdf',{timeout:45000});await dialog.getByRole('button',{name:'Close PDF export',exact:true}).click();
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile(pdf)),useSystemFonts:true}),document=await task.promise,annotations=await (await document.getPage(1)).getAnnotations();report.pdfLinks=annotations.filter(item=>item.subtype==='Link').map(item=>item.url||item.unsafeUrl);await task.destroy();
  for(const target of [WEB,MAIL])if(!report.pdfLinks.includes(target))throw new Error('PDF links are '+JSON.stringify(report.pdfLinks));
  if((await opened()).length!==1)throw new Error('Exporting opened a link: '+JSON.stringify(await opened()));
 });
 await check('RTF copy carries hyperlink fields',async()=>{
  await tab('File');await saveTo(rtf);await page.getByRole('button',{name:'Export RTF copy',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved links.rtf',{timeout:45000});
  const text=(await fs.readFile(rtf)).toString('latin1');for(const part of ['HYPERLINK "https://example.com/guide?x=1#top"','HYPERLINK "mailto:sales@example.com"'])if(!text.includes(part))throw new Error('RTF copy is missing '+part);
 });
 await check('reopened DOCX keeps both links and is not marked edited',async()=>{
  await page.getByRole('button',{name:'Home',exact:true}).click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},docx);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});
  await expect(editor.locator('a.document-link')).toHaveCount(2);await expect(editor.locator('a.document-link').first()).toHaveAttribute('href',WEB);await expect(editor.locator('a.document-link').nth(1)).toHaveAttribute('href',MAIL);
  await page.waitForTimeout(900);await expect(page.locator('.draft-status')).toHaveText('Ready to edit');await page.screenshot({path:path.join(output,'reopened.png')});
 });
 await check('reopened RTF keeps both links and is not marked edited',async()=>{
  await page.getByRole('button',{name:'Home',exact:true}).click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},rtf);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});
  await expect(editor.locator('a.document-link')).toHaveCount(2);await expect(editor.locator('a.document-link').first()).toHaveAttribute('href',WEB);await expect(editor.locator('a.document-link').first()).toHaveText('manual');await expect(editor.locator('a.document-link').nth(1)).toHaveAttribute('href',MAIL);
  await page.waitForTimeout(900);await expect(page.locator('.draft-status')).toHaveText('Ready to edit');if((await opened()).length!==1)throw new Error('Reopening opened a link: '+JSON.stringify(await opened()));
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds: '+await page.locator('#toast').textContent().catch(()=>'')});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
