// Hidden, scoped check of Extract a table: a PDF holding a known 4 x 3 table is generated, the table rectangle
// and grid are set, the words are read into cells, and the exported CSV is compared with the known values.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
const output=path.resolve('tmp/tools-table-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Doc-')),work=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Files-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'Scoped table extraction check with one generated text table (4 rows, 3 columns, ruled, evenly spaced). Scanned tables, merged cells, uneven grids, automatic row suggestions and XLSX export were not exercised.'};
const TABLE=[['Part','Qty','Note'],['Bolt M8','12','Zinc plated'],['Nut M8','30','Order more'],['Washer','45','In stock']];
// Page 612 x 792. Table: left 72, top 692 (100 pt below the top edge), 3 columns of 150 pt, 4 rows of 30 pt.
const X=72,TOP=692,COLUMN=150,ROW=30;
const pdf=path.join(work,'Parts table.pdf');{const document=await PDFDocument.create(),sheet=document.addPage([612,792]),font=await document.embedFont(StandardFonts.Helvetica);sheet.drawText('Parts list for the site visit',{x:X,y:740,size:14,font});for(let r=0;r<=TABLE.length;r++)sheet.drawLine({start:{x:X,y:TOP-r*ROW},end:{x:X+3*COLUMN,y:TOP-r*ROW},thickness:.7,color:rgb(0,0,0)});for(let c=0;c<=3;c++)sheet.drawLine({start:{x:X+c*COLUMN,y:TOP},end:{x:X+c*COLUMN,y:TOP-TABLE.length*ROW},thickness:.7,color:rgb(0,0,0)});TABLE.forEach((row,r)=>row.forEach((text,c)=>sheet.drawText(text,{x:X+c*COLUMN+8,y:TOP-r*ROW-20,size:11,font})));sheet.drawText('Text below the table that must not be extracted',{x:X,y:500,size:11,font});await fs.writeFile(pdf,await document.save());}
const original=await fs.readFile(pdf);
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
const parseCsv=text=>text.replace(/^﻿/,'').trim().split(/\r?\n/).map(line=>{const cells=[];let cell='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(quoted){if(c==='"'&&line[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}else if(c==='"')quoted=true;else if(c===','){cells.push(cell);cell='';}else cell+=c;}cells.push(cell);return cells.map(value=>value.trim());});
try{
 const csv=path.join(work,'parts.csv');
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 await app.evaluate(({dialog},{pdf,csv})=>{global.pdfixAsked=[];dialog.showOpenDialog=async()=>({canceled:false,filePaths:[pdf]});dialog.showSaveDialog=async(_window,options)=>{global.pdfixAsked.push('save '+(options?.title??'')+' -> '+(options?.defaultPath??''));const wantsCsv=/\.csv$/i.test(String(options?.defaultPath??''))||/csv/i.test(String(options?.title??''));return wantsCsv?{canceled:false,filePath:csv}:{canceled:true};};dialog.showMessageBox=async(_window,options)=>{global.pdfixAsked.push('box '+String(options?.message??'').slice(0,140));const buttons=options?.buttons??['OK'];const yes=buttons.findIndex(label=>/save|continue|yes|ok/i.test(label));return {response:yes<0?0:yes,checkboxChecked:false};};},{pdf,csv});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).first().click();await page.getByRole('searchbox',{name:'Find a tool across workspaces'}).fill('Extract a table');await page.locator('.workspace-room-grid button').filter({has:page.locator('h2',{hasText:'Extract a table'})}).first().click();
 const dialog=page.locator('dialog.pdf-table-extraction');await dialog.waitFor({timeout:45000});const number=name=>dialog.getByRole('spinbutton',{name,exact:true});
 await check('set the table rectangle and grid, then read the words into cells',async()=>{
  await expect(dialog.getByRole('button',{name:'Read selectable words',exact:true})).toBeEnabled({timeout:30000});
  for(const [name,value] of [['Left %',(X-2)/612*100],['Top %',(792-TOP-2)/792*100],['Width %',(3*COLUMN+4)/612*100],['Height %',(TABLE.length*ROW+4)/792*100]]){await number(name).fill(value.toFixed(2));await number(name).dispatchEvent('change');}
  await number('Rows').fill(String(TABLE.length));await number('Rows').dispatchEvent('change');await number('Columns').fill('3');await number('Columns').dispatchEvent('change');await page.waitForTimeout(400);
  await dialog.getByRole('button',{name:'Read selectable words',exact:true}).click();await page.waitForTimeout(2500);report.afterRead=(await dialog.innerText()).replace(/\s+/g,' ').slice(-600);
  report.controls=await dialog.evaluate(node=>[...node.querySelectorAll('button,select,input[type=checkbox]')].filter(item=>item.getClientRects().length).map(item=>(item.tagName==='INPUT'?'[checkbox] ':'')+(item.getAttribute('aria-label')||item.labels?.[0]?.textContent?.trim()||item.textContent.trim()).slice(0,60)+(item.disabled?' (disabled)':'')));
  report.cells=await dialog.evaluate(node=>{const grid=[...node.querySelectorAll('table tr')].map(row=>[...row.querySelectorAll('td,th')].map(cell=>(cell.querySelector('input,textarea')?.value??cell.textContent).trim()));return grid.filter(row=>row.length);});await page.screenshot({path:path.join(output,'table-read.png')});
  const flat=JSON.stringify(report.cells);for(const value of ['Bolt M8','Zinc plated','Washer','45'])if(!flat.includes(value))throw new Error('Cell value "'+value+'" was not read. Cells: '+flat.slice(0,400)+' | '+report.afterRead.slice(-200));if(flat.includes('must not be extracted')||flat.includes('Parts list for'))throw new Error('Text outside the rectangle was read into the table.');
 });
 await check('export the table as CSV and compare every cell',async()=>{
  for(const box of await dialog.locator('input[type=checkbox]').all())if(await box.isVisible()&&await box.isEnabled()&&!await box.isChecked()){const label=await box.evaluate(node=>node.labels?.[0]?.textContent?.trim()||node.getAttribute('aria-label')||'');if(/review|checked|confirm/i.test(label)){(report.reviewLabels??=[]).push(label.slice(0,90));await box.check();}}
  const button=dialog.getByRole('button',{name:/csv/i}).first();if(!(await button.count()))throw new Error('No CSV export control. Controls: '+JSON.stringify(report.controls));await expect(button).toBeEnabled({timeout:15000});await button.click();await expect.poll(()=>fs.readFile(csv,'utf8').then(text=>text.length,()=>0),{timeout:60000}).toBeGreaterThan(10);await page.waitForTimeout(500);report.asked=await app.evaluate(()=>global.pdfixAsked);
  const rows=parseCsv(await fs.readFile(csv,'utf8'));report.csv=rows;if(JSON.stringify(rows)!==JSON.stringify(TABLE))throw new Error('CSV is '+JSON.stringify(rows)+' but the table is '+JSON.stringify(TABLE));if(!(await fs.readFile(pdf)).equals(original))throw new Error('The source PDF changed.');
  await dialog.getByRole('button',{name:'Close',exact:true}).first().click().catch(()=>{});
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds: '+await page.locator('#toast').textContent().catch(()=>'')});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});await fs.rm(work,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
