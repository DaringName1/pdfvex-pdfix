// Hidden check of links to headings: link text to a heading from the Links panel, follow it from the link popup,
// save a PDF (an internal link that points inside the document) and a DOCX copy that reopens with the link working.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {randomUUID} from 'node:crypto';
const output=path.resolve('tmp/document-heading-links-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-HeadLinks-'));await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[]};let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message.slice(0,600)});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'}),tab=name=>page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name,exact:true}).click();
 const select=async word=>{await page.evaluate(word=>{const view=document.querySelector('.ProseMirror').editor;let at=-1;view.state.doc.descendants((node,pos)=>{if(node.isText&&at<0){const i=node.text.indexOf(word);if(i>=0)at=pos+i;}});view.chain().focus().setTextSelection({from:at,to:at+word.length}).run();},word);await page.waitForTimeout(200);};
 await check('a word links to a heading from the Links panel and the popup goes there',async()=>{
  await page.getByRole('button',{name:'New document',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});
  await editor.pressSequentially('See the results section below.');await editor.press('Enter');for(let i=0;i<25;i++){await editor.pressSequentially('Filler paragraph '+i);await editor.press('Enter');}
  await page.getByRole('combobox',{name:'Paragraph style'}).selectOption('2');await editor.pressSequentially('Results');await editor.press('Enter');await editor.pressSequentially('Final numbers.');await page.waitForTimeout(500);
  await select('results section');await tab('Insert');const panel=page.locator('.document-link-controls');if(!await panel.evaluate(d=>d.open))await panel.locator('summary').click();
  const heading=panel.getByRole('combobox',{name:/or a heading in this document/});await heading.focus();await expect(heading.locator('option')).toHaveText(['Choose a heading…','H2 · Results']);await heading.selectOption({label:'H2 · Results'});await panel.getByRole('button',{name:'Apply link',exact:true}).click();
  const link=editor.locator('a.document-link');await expect(link).toHaveText('results section');report.href=await link.getAttribute('href');if(!/^#h-[0-9a-f]{8}$/.test(report.href))throw new Error('Link target: '+report.href);await expect(editor.locator('h2')).toHaveAttribute('data-pdfix-anchor',report.href.slice(1));
  await editor.press('Control+Home');await link.click();const popup=page.locator('.document-link-popup');await expect(popup).toBeVisible();await expect(popup.locator('.document-link-address')).toHaveText('Heading: Results');
  await popup.getByRole('button',{name:'Go to heading',exact:true}).click();await expect(page.locator('#toast')).toContainText('Moved to the heading');
  report.selectionInHeading=await page.evaluate(()=>{const view=document.querySelector('.ProseMirror').editor;return view.state.selection.$from.parent.type.name;});if(report.selectionInHeading!=='heading')throw new Error('Cursor is in '+report.selectionInHeading);
  await editor.press('Control+z');await expect(editor.locator('a.document-link')).toHaveCount(0);await expect(editor.locator('h2')).not.toHaveAttribute('data-pdfix-anchor',/./);await editor.press('Control+y');await expect(editor.locator('a.document-link')).toHaveCount(1);
 });
 await check('the PDF copy has an internal link to the heading page',async()=>{
  const pdf=path.join(profile,'links.pdf');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},pdf);await page.getByRole('button',{name:'Export PDF',exact:true}).click();const dialog=page.locator('.document-pdf-export');await dialog.getByRole('button',{name:'Preview PDF',exact:true}).click();await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await dialog.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(dialog.locator('.document-pdf-status')).toContainText('Saved links.pdf',{timeout:45000});await dialog.getByRole('button',{name:'Close PDF export',exact:true}).click();
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile(pdf))}),loaded=await task.promise,annotations=(await (await loaded.getPage(1)).getAnnotations()).filter(a=>a.subtype==='Link');report.pdfLinks=annotations.map(a=>({dest:a.dest??null,url:a.url??null}));
  const internal=annotations.find(a=>a.dest);if(!internal)throw new Error('No internal link in the PDF: '+JSON.stringify(report.pdfLinks));let pageIndex=null;try{const dest=typeof internal.dest==='string'?await loaded.getDestination(internal.dest):internal.dest;pageIndex=await loaded.getPageIndex(dest[0]);}catch{}report.linkTargetPage=pageIndex===null?null:pageIndex+1;await task.destroy();
  if(report.linkTargetPage===null)throw new Error('The internal link has no page');
 });
 await check('the DOCX copy reopens with the heading link working',async()=>{
  const docx=path.join(profile,'links.docx');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},docx);await tab('File');await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved links.docx',{timeout:45000});
  await page.getByRole('button',{name:'Home',exact:true}).first().click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},docx);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});
  await expect(editor.locator('a.document-link')).toHaveAttribute('href',report.href);await editor.locator('a.document-link').click();await expect(page.locator('.document-link-popup .document-link-address')).toHaveText('Heading: Results');
 });
 await check('Insert > Table of contents lists the headings, each linked, in one Undo step',async()=>{
  await page.locator('.document-link-popup [data-popup-close]').click().catch(()=>{});await editor.press('Control+Home');await tab('Insert');await page.getByRole('button',{name:'Table of contents',exact:true}).click();
  await expect(page.locator('#toast')).toContainText('Table of contents inserted with 1 heading');await expect(editor.locator('p').first()).toHaveText('Contents');
  const entries=editor.locator('a.document-link').filter({hasText:/^Results$/});await expect(entries).toHaveCount(1);await expect(entries).toHaveAttribute('href',report.href);
  await editor.press('Control+z');await expect(editor.locator('p').first()).not.toHaveText('Contents');
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid;await Promise.race([app.close().catch(()=>{}),new Promise(r=>setTimeout(r,15000))]);try{process.kill(pid);}catch{}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,checks:report.checks.map(c=>c.name),href:report.href,pdfLinks:report.pdfLinks,linkTargetPage:report.linkTargetPage,failures:report.failures,errors:report.errors.slice(0,3),error:report.error},null,1));process.exit(report.pass?0:1);
