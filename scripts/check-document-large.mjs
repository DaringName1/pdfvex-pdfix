// Hidden, measured check of a long document: a generated DOCX with about 3,000 paragraphs and 20 tables is opened,
// typed into, word-counted and saved as DOCX and PDF copies. Reports timings; fails only on errors or on limits that
// make the editor unusable (opening over 60 s, a keystroke over 1 s, a save over 120 s).
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import * as docx from 'docx';
const output=path.resolve('tmp/document-large-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Large-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,timings:{},checks:[],errors:[],failures:[],scope:'One generated DOCX (text and tables, no images). Large images, very long single paragraphs and RTF were not exercised.'};
const {Document,Packer,Paragraph,TextRun,HeadingLevel,Table,TableRow,TableCell}=docx;
const sentence=i=>`Paragraph ${i} describes site conditions, materials and the schedule for this part of the work in plain words.`;
const children=[];for(let section=0;section<20;section++){children.push(new Paragraph({heading:HeadingLevel.HEADING_1,children:[new TextRun('Section '+(section+1))]}));for(let i=0;i<150;i++)children.push(new Paragraph({children:[new TextRun(sentence(section*150+i))]}));children.push(new Table({rows:Array.from({length:12},(_,r)=>new TableRow({children:Array.from({length:4},(_,c)=>new TableCell({children:[new Paragraph('R'+r+'C'+c)]}))}))}));}
const source=path.join(profile,'Long report.docx');await fs.writeFile(source,await Packer.toBuffer(new Document({sections:[{children}]})));report.sourceBytes=(await fs.stat(source)).size;
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message.slice(0,600)});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
const timed=async(name,run)=>{const start=Date.now();await run();report.timings[name]=Date.now()-start;return report.timings[name];};
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'});
 await check('a 3,000-paragraph DOCX opens',async()=>{
  await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},source);
  const ms=await timed('openMs',async()=>{await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:120000});});
  report.blocks=await editor.evaluate(el=>({paragraphs:el.querySelectorAll('p').length,tables:el.querySelectorAll('table').length}));if(ms>60000)throw new Error('Opening took '+ms+' ms');
  if(report.blocks.tables!==20||report.blocks.paragraphs<3000)throw new Error('Content: '+JSON.stringify(report.blocks));
 });
 await check('typing at the end stays responsive',async()=>{
  await editor.press('Control+End');await page.waitForTimeout(300);const delays=[];
  for(const char of 'Added at the end.'){const start=Date.now();await editor.press(char===' '?'Space':char);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve())));delays.push(Date.now()-start);}
  report.keyMs={median:delays.sort((a,b)=>a-b)[Math.floor(delays.length/2)],max:delays.at(-1)};if(report.keyMs.max>1000)throw new Error('A keystroke took '+report.keyMs.max+' ms');
  await expect(editor).toContainText('Added at the end.');await page.locator('.draft-status').filter({hasText:'Recovery draft saved locally'}).waitFor({timeout:60000});report.statusAfterTyping=await page.locator('.draft-status').textContent();
 });
 await check('word count finishes',async()=>{await timed('wordCountMs',async()=>{await expect(page.locator('.editor-footer')).toContainText(/\d[\d,]* words/,{timeout:30000});});report.words=(await page.locator('.editor-footer').textContent()).match(/[\d,]+ words/)?.[0];});
 await check('DOCX copy saves',async()=>{const file=path.join(profile,'long-copy.docx');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},file);await page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name:'File',exact:true}).click();
  const ms=await timed('docxSaveMs',async()=>{await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect(page.locator('#toast')).toContainText(/Saved long-copy\.docx|could not|limit|exceed/i,{timeout:150000});});report.docxToast=(await page.locator('#toast').textContent()).slice(0,200);if(!/Saved long-copy/.test(report.docxToast))throw new Error(report.docxToast);if(ms>120000)throw new Error('Saving took '+ms+' ms');report.docxBytes=(await fs.stat(file)).size;});
 await check('PDF copy previews and saves',async()=>{const file=path.join(profile,'long-copy.pdf');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},file);await page.getByRole('button',{name:'Export PDF',exact:true}).click();const dialog=page.locator('.document-pdf-export');
  await timed('pdfPreviewMs',async()=>{await dialog.getByRole('button',{name:'Preview PDF',exact:true}).click();await Promise.race([expect(dialog.getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:180000}),dialog.locator('.document-pdf-status').filter({hasText:/limit|exceed|could not|failed/i}).waitFor({timeout:180000})]);});
  report.pdfStatus=(await dialog.locator('.document-pdf-status').textContent()).slice(0,300);if(!await dialog.locator('[data-review]').isVisible())throw new Error('Preview did not finish: '+report.pdfStatus);
  await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await timed('pdfSaveMs',async()=>{await dialog.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(dialog.locator('.document-pdf-status')).toContainText(/Saved long-copy\.pdf|could not|failed/i,{timeout:180000});});
  report.pdfSaved=(await dialog.locator('.document-pdf-status').textContent()).slice(0,200);if(!/Saved long-copy/.test(report.pdfSaved))throw new Error(report.pdfSaved);report.pdfBytes=(await fs.stat(file)).size;await dialog.getByRole('button',{name:'Close PDF export',exact:true}).click();});
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),20000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 20 seconds.'});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,timings:report.timings,keyMs:report.keyMs,blocks:report.blocks,words:report.words,sourceBytes:report.sourceBytes,docxBytes:report.docxBytes,pdfBytes:report.pdfBytes,pdfStatus:report.pdfStatus,failures:report.failures,errors:report.errors.slice(0,3),error:report.error},null,1));process.exit(report.pass?0:1);
