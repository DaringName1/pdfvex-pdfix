// Hidden check of pictures in Markdown: a picture in a subfolder and an embedded data: picture become pictures when
// the Markdown opens as a formatted document and in its formatted PDF; a web picture and one outside the Markdown
// file's folder stay text labels, and nothing outside that folder is read.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {randomUUID} from 'node:crypto';import zlib from 'node:zlib';
const output=path.resolve('tmp/document-markdown-images-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-MdImg-')),root=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-MdImgFiles-'));await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[]};
function png(width,height,shade){const table=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;}),crc=b=>{let c=0xffffffff;for(const x of b)c=table[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0;},chunk=(t,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const body=Buffer.concat([Buffer.from(t),d]),s=Buffer.alloc(4);s.writeUInt32BE(crc(body));return Buffer.concat([l,body,s]);};
 const raw=Buffer.alloc((width*3+1)*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const o=y*(width*3+1)+1+x*3;raw[o]=shade;raw[o+1]=(x*255/width)|0;raw[o+2]=(y*255/height)|0;}const h=Buffer.alloc(13);h.writeUInt32BE(width,0);h.writeUInt32BE(height,4);h[8]=8;h[9]=2;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
const folder=path.join(root,'notes');await fs.mkdir(path.join(folder,'photos'),{recursive:true});await fs.writeFile(path.join(folder,'photos','site.png'),png(320,240,40));await fs.writeFile(path.join(root,'outside.png'),png(100,80,200));
const embedded='data:image/png;base64,'+png(60,40,120).toString('base64'),md=path.join(folder,'Site notes.md');
await fs.writeFile(md,['# Site notes','','Photo of the site: ![site photo](photos/site.png)','','Small swatch ![swatch]('+embedded+')','','Web picture ![logo](https://example.com/logo.png) stays a label.','','Outside ![escape](../outside.png) stays a label.',''].join('\n'));
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message.slice(0,600)});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},md);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});
 await check('the formatted PDF holds the two pictures and keeps the other two as labels',async()=>{
  const pdf=path.join(root,'Site notes.pdf');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},pdf);await page.getByRole('button',{name:'Export PDF',exact:true}).click();const dialog=page.locator('.document-pdf-export');
  await expect(dialog.locator('[data-formatted]')).toBeChecked();await dialog.getByRole('button',{name:'Preview PDF',exact:true}).click();await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});report.pdfNotes=(await dialog.locator('[data-formatted-notes]').textContent()).slice(0,300);
  await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await dialog.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(dialog.locator('.document-pdf-status')).toContainText('Saved Site notes.pdf',{timeout:45000});await dialog.getByRole('button',{name:'Close PDF export',exact:true}).click();
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile(pdf)),useSystemFonts:true}),loaded=await task.promise,first=await loaded.getPage(1),ops=await first.getOperatorList(),text=(await first.getTextContent()).items.map(item=>item.str).join(' ');await task.destroy();
  report.pdfImages=ops.fnArray.filter(fn=>fn===pdfjs.OPS.paintImageXObject||fn===pdfjs.OPS.paintInlineImageXObject).length;report.pdfText=text.slice(0,300);
  if(report.pdfImages!==2)throw new Error('Pictures in the PDF: '+report.pdfImages);if(!text.includes('[Image: logo]')||!text.includes('[Image: escape]'))throw new Error('Labels missing: '+text);if(!/2 images stayed text labels/.test(report.pdfNotes))throw new Error('Notes: '+report.pdfNotes);
 });
 await check('Open as formatted document places the same two pictures',async()=>{
  await page.getByRole('button',{name:'Open as formatted document',exact:true}).click();const editor=page.getByRole('textbox',{name:'Editable document'});await expect(editor).toBeVisible({timeout:30000});
  await expect(editor.locator('img[data-pdfix-image]')).toHaveCount(2,{timeout:30000});await expect(editor.locator('img[data-pdfix-image]').first()).toHaveAttribute('alt','site photo');await expect(editor).toContainText('[Image: logo]');await expect(editor).toContainText('[Image: escape]');
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid;await Promise.race([app.close().catch(()=>{}),new Promise(r=>setTimeout(r,15000))]);try{process.kill(pid);}catch{}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});await fs.rm(root,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,checks:report.checks.map(c=>c.name),pdfImages:report.pdfImages,pdfNotes:report.pdfNotes,failures:report.failures,errors:report.errors.slice(0,3),error:report.error},null,1));process.exit(report.pass?0:1);
