// Hidden, scoped check of superscript, subscript and highlight: apply from the quick toolbar and shortcuts, Undo,
// paste Word-style markup, then save DOCX, RTF and PDF copies and reopen the DOCX and RTF.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import JSZip from 'jszip';
const output=path.resolve('tmp/document-marks-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Marks-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'One short paragraph and one pasted Word-style fragment. A real Word clipboard and highlight colors outside the four listed were not exercised.'};
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'}),highlight=page.getByRole('combobox',{name:'Highlight color'});
 // Selects the last occurrence of a word through the editor's own selection, then lets the toolbar catch up.
 const select=async word=>{await page.evaluate(word=>{const view=document.querySelector('.ProseMirror').editor;let at=-1;view.state.doc.descendants((node,pos)=>{if(node.isText){const i=node.text.lastIndexOf(word);if(i>=0)at=pos+i;}});view.chain().focus().setTextSelection({from:at,to:at+word.length}).run();},word);await page.waitForTimeout(150);};
 const saveAs=async(button,file)=>{await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},file);await page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name:'File',exact:true}).click();await page.getByRole('button',{name:button,exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved '+path.basename(file),{timeout:45000});};
 const reopen=async file=>{await page.getByRole('button',{name:'Home',exact:true}).first().click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});};
 await check('toolbar buttons, shortcuts and the highlight list format the selection, each as one Undo step',async()=>{
  await page.getByRole('button',{name:'New document',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});
  if(!await page.evaluate(()=>!!document.querySelector('.ProseMirror')?.editor))throw new Error('The editor instance is not reachable from the page; selection helper cannot run.');
  await editor.pressSequentially('Area m2 of H2O with a key point');await page.waitForTimeout(600);
  await select('m2');await page.evaluate(()=>{const v=document.querySelector('.ProseMirror').editor;const {from}=v.state.selection;v.commands.setTextSelection({from:from+1,to:from+2});});await page.getByRole('button',{name:'Superscript',exact:true}).click();
  await expect(editor.locator('sup')).toHaveText('2');await expect(page.getByRole('button',{name:'Superscript',exact:true})).toHaveAttribute('aria-pressed','true');
  await select('H2O');await page.evaluate(()=>{const v=document.querySelector('.ProseMirror').editor;const {from}=v.state.selection;v.commands.setTextSelection({from:from+1,to:from+2});});await page.keyboard.press('Control+,');await expect(editor.locator('sub')).toHaveText('2');
  await select('key point');await highlight.selectOption('yellow');await expect(editor.locator('mark[data-pdfix-highlight="yellow"]')).toHaveText('key point');await expect(highlight).toHaveValue('yellow');
  await highlight.selectOption('pink');await expect(editor.locator('mark[data-pdfix-highlight="pink"]')).toHaveText('key point');
  await editor.press('Control+z');await expect(editor.locator('mark[data-pdfix-highlight="yellow"]')).toHaveText('key point');await editor.press('Control+z');await expect(editor.locator('mark')).toHaveCount(0);await expect(editor.locator('sub')).toHaveText('2');
  await editor.press('Control+y');await editor.press('Control+y');await expect(editor.locator('mark[data-pdfix-highlight="pink"]')).toHaveText('key point');
  await page.screenshot({path:path.join(output,'toolbar.png')});
 });
 await check('Word-style pasted superscript, subscript and highlight keep their formatting',async()=>{
  const caret=()=>page.evaluate(()=>{const v=document.querySelector('.ProseMirror').editor,{from,to}=v.state.selection;return {from,to,end:v.state.doc.content.size-1};});
  report.beforeEnd=await caret();await editor.press('Control+End');await page.waitForTimeout(200);report.afterEnd=await caret();
  if(report.afterEnd.from!==report.afterEnd.to||report.afterEnd.to<report.afterEnd.end)throw new Error('Ctrl+End left the selection at '+JSON.stringify(report.afterEnd)+' (before '+JSON.stringify(report.beforeEnd)+')');
  await editor.press('Enter');
  await page.evaluate(html=>{const data=new DataTransfer();data.setData('text/html',html);data.setData('text/plain','fallback');const view=document.querySelector('.ProseMirror');view.focus();view.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));},
   "<p class=MsoNormal>Pasted x<span style='vertical-align:super'>3</span> and CO<sub>2</sub> with <span style='background:yellow;mso-highlight:yellow'>Word highlight</span>, <span style='background-color:rgb(0, 255, 255)'>web cyan</span> and <span style='background:#123456'>odd color</span></p>");
  const pasted=editor.locator('p').filter({hasText:'Pasted'});await expect(pasted.locator('sup')).toHaveText('3');await expect(pasted.locator('sub')).toHaveText('2');
  await expect(pasted.locator('mark[data-pdfix-highlight="yellow"]')).toHaveText('Word highlight');await expect(pasted.locator('mark[data-pdfix-highlight="turquoise"]')).toHaveText('web cyan');await expect(pasted.locator('mark')).toHaveCount(2);
 });
 const docx=path.join(profile,'marks.docx'),rtf=path.join(profile,'marks.rtf'),pdf=path.join(profile,'marks.pdf');
 await check('the DOCX copy carries Word superscript, subscript and highlight, and reopens with them',async()=>{
  await expect(page.locator('.draft-status')).toHaveText('Recovery draft saved locally',{timeout:10000});report.firstParagraph=await page.evaluate(()=>JSON.stringify(document.querySelector('.ProseMirror').editor.getJSON().content[0]).slice(0,1500));await saveAs('Export DOCX',docx);
  const xml=await (await JSZip.loadAsync(await fs.readFile(docx))).file('word/document.xml').async('string');report.docxCounts={sup:(xml.match(/w:val="superscript"/g)||[]).length,sub:(xml.match(/w:val="subscript"/g)||[]).length,highlight:(xml.match(/<w:highlight /g)||[]).length,values:[...xml.matchAll(/<w:highlight w:val="([a-z]+)"\/>.*?<w:t[^>]*>([^<]*)/g)].map(m=>m[1]+":"+m[2])};
  if(report.docxCounts.sup<2||report.docxCounts.sub<2||!/<w:highlight w:val="magenta"\/>/.test(xml)||!/<w:highlight w:val="cyan"\/>/.test(xml))throw new Error('DOCX runs: '+JSON.stringify(report.docxCounts));
  await reopen(docx);await expect(editor.locator('sup')).toHaveCount(2);await expect(editor.locator('sub')).toHaveCount(2);await expect(editor.locator('mark[data-pdfix-highlight="pink"]')).toHaveText('key point');
 });
 await check('the RTF copy reopens with superscript, subscript and highlight',async()=>{
  await saveAs('Export RTF copy',rtf);await reopen(rtf);await expect(editor.locator('sup')).toHaveCount(2);await expect(editor.locator('sub')).toHaveCount(2);await expect(editor.locator('mark[data-pdfix-highlight="yellow"]')).toHaveText('Word highlight');
 });
 await check('the PDF copy shows raised and lowered digits',async()=>{
  await reopen(docx);await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},pdf);await page.getByRole('button',{name:'Export PDF',exact:true}).click();const dialog=page.locator('.document-pdf-export');await dialog.getByRole('button',{name:'Preview PDF',exact:true}).click();await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await dialog.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(dialog.locator('.document-pdf-status')).toContainText('Saved marks.pdf',{timeout:45000});await dialog.getByRole('button',{name:'Close PDF export',exact:true}).click();
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile(pdf)),useSystemFonts:true}),loaded=await task.promise,items=(await (await loaded.getPage(1)).getTextContent()).items.filter(item=>item.str.trim());await task.destroy();
  const base=items.find(item=>item.str.includes('Area m')),raised=items.find(item=>item.str.trim()==='2'&&base&&item.transform[5]>base.transform[5]+1),lowered=items.find(item=>item.str.trim()==='2'&&base&&item.transform[5]<base.transform[5]-1);
  report.pdf={base:base&&[Math.round(base.transform[5]),Math.round(base.transform[0])],raised:raised&&[Math.round(raised.transform[5]),Math.round(raised.transform[0])],lowered:lowered&&[Math.round(lowered.transform[5]),Math.round(lowered.transform[0])]};
  if(!base||!raised||!lowered)throw new Error('PDF text positions: '+JSON.stringify(items.slice(0,12).map(item=>[item.str,Math.round(item.transform[5])])));
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds.'});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
