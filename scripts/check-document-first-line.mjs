// Hidden, scoped check of first-line and hanging indents: set them from the Home tab, see them in the editor,
// undo one, save DOCX and PDF copies, reopen the DOCX, and measure the first and wrapped lines in the PDF.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
const output=path.resolve('tmp/document-first-line-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-FirstLine-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'Two long paragraphs in a new document. Word-made DOCX files with their own first-line indents, lists and table cells were not exercised.'};
const docx=path.join(profile,'first-line.docx'),pdf=path.join(profile,'first-line.pdf');
const long=word=>Array.from({length:40},(_,i)=>word+i).join(' ');
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'}),firstLine=page.getByRole('combobox',{name:'Paragraph first line'}),paragraphs=editor.locator('p');
 const tab=name=>page.getByRole('tab',{name,exact:true}).click();
 await check('first-line and hanging indents apply from the Home tab and show in the editor',async()=>{
  await page.getByRole('button',{name:'New document',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});
  await editor.pressSequentially(long('alpha'));await tab('Home');await expect(firstLine).toHaveValue('');await firstLine.selectOption('first');
  await editor.press('Enter');await expect(firstLine).toHaveValue('first');await firstLine.selectOption('');await editor.pressSequentially(long('beta'));await page.getByRole('button',{name:'Increase indent',exact:true}).click();await firstLine.selectOption('hanging');
  await expect(paragraphs.nth(0)).toHaveAttribute('data-pdfix-first-line','first');await expect(paragraphs.nth(0)).toHaveAttribute('style',/text-indent: ?0\.5in/);
  await expect(paragraphs.nth(1)).toHaveAttribute('data-pdfix-first-line','hanging');await expect(paragraphs.nth(1)).toHaveAttribute('data-pdfix-indent','1');await expect(paragraphs.nth(1)).toHaveAttribute('style',/margin-left: ?1in/);await expect(paragraphs.nth(1)).toHaveAttribute('style',/text-indent: ?-0\.5in/);
  // The rendered first line of each paragraph sits where the setting says, against the wrapped lines below it.
  report.editorLines=await paragraphs.evaluateAll(list=>list.map(p=>{const range=document.createRange();range.selectNodeContents(p);const rects=[...range.getClientRects()],top=Math.min(...rects.map(r=>r.top)),first=Math.min(...rects.filter(r=>r.top-top<4).map(r=>r.left)),rest=Math.min(...rects.filter(r=>r.top-top>4).map(r=>r.left));return Math.round(first-rest);}));
  if(!(report.editorLines[0]>=40&&report.editorLines[1]<=-40))throw new Error('First line offsets in the editor are '+JSON.stringify(report.editorLines));
  await editor.press('Control+z');await expect(paragraphs.nth(1)).not.toHaveAttribute('data-pdfix-first-line','hanging');await expect(firstLine).toHaveValue('');await editor.press('Control+y');await expect(paragraphs.nth(1)).toHaveAttribute('data-pdfix-first-line','hanging');await expect(firstLine).toHaveValue('hanging');
  // Right indent on the same paragraph, chosen from Home.
  await page.getByRole('combobox',{name:'Paragraph right indent'}).selectOption('2');await expect(paragraphs.nth(1)).toHaveAttribute('data-pdfix-right-indent','2');await expect(paragraphs.nth(1)).toHaveAttribute('style',/margin-right: ?1in/);
  await page.screenshot({path:path.join(output,'editor.png')});
 });
 await check('the PDF copy keeps the first line in and the hanging line out',async()=>{
  await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},pdf);await page.getByRole('button',{name:'Export PDF',exact:true}).click();const dialog=page.locator('.document-pdf-export');await dialog.getByRole('button',{name:'Preview PDF',exact:true}).click();await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await dialog.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(dialog.locator('.document-pdf-status')).toContainText('Saved first-line.pdf',{timeout:45000});await dialog.getByRole('button',{name:'Close PDF export',exact:true}).click();
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile(pdf)),useSystemFonts:true}),loaded=await task.promise,items=(await (await loaded.getPage(1)).getTextContent()).items.filter(item=>item.str.trim());await task.destroy();
  const lines=new Map();for(const item of items){const y=Math.round(item.transform[5]),x=item.transform[4],word=item.str.trim().split(/\s+/)[0];const line=lines.get(y);if(!line||x<line.x)lines.set(y,{x,word});}
  const ordered=[...lines.entries()].sort((a,b)=>b[0]-a[0]).map(([,line])=>line),start=word=>ordered.findIndex(line=>line.word.startsWith(word));
  const a=start('alpha'),b=start('beta');report.pdfLines=ordered.map(line=>({x:Math.round(line.x),word:line.word}));
  if(a<0||b<0||!ordered[a+1]||!ordered[b+1])throw new Error('Could not find both paragraphs in the PDF: '+JSON.stringify(report.pdfLines));
  report.pdfOffsets=[Math.round(ordered[a].x-ordered[a+1].x),Math.round(ordered[b].x-ordered[b+1].x)];
  if(Math.abs(report.pdfOffsets[0]-36)>3||Math.abs(report.pdfOffsets[1]+36)>3)throw new Error('First line offsets in the PDF are '+JSON.stringify(report.pdfOffsets)+' points; half an inch is 36.');
 });
 await check('the DOCX copy reopens with both settings',async()=>{
  await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},docx);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved first-line.docx',{timeout:45000});
  await page.getByRole('button',{name:'Home',exact:true}).first().click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},docx);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});
  await expect(paragraphs.nth(0)).toHaveAttribute('data-pdfix-first-line','first');await expect(paragraphs.nth(1)).toHaveAttribute('data-pdfix-first-line','hanging');await expect(paragraphs.nth(1)).toHaveAttribute('data-pdfix-indent','1');await expect(paragraphs.nth(1)).toHaveAttribute('data-pdfix-right-indent','2');
  await paragraphs.nth(1).click();await tab('Home');await expect(firstLine).toHaveValue('hanging');await page.screenshot({path:path.join(output,'reopened.png')});
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds.'});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
