import {test,expect} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {PDFDocument} from 'pdf-lib';
import {launchReader} from '../helpers/reader-launch.mjs';
import {readerTools} from '../helpers/reader-desktop.mjs';
import {inspectXlsx} from '../../scripts/user-robot/verify.mjs';
// Release blocker S3 / P1-1 (MASTER-IMPROVEMENT-PLAN-2026-10-26): PDFix ends suddenly while saving a table taken from
// the page. Afterwards: no half-written file, any CSV or XLSX that exists is complete and right, the PDF is unchanged,
// and PDFix starts again and opens the PDF normally.
test.describe.configure({timeout:process.env.CI?300000:180000});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const kill=app=>{try{execFileSync('taskkill',['/PID',String(app.process().pid),'/T','/F'],{stdio:'ignore'});}catch{}};
const env=root=>({...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'});
const TABLE=[['Part','Qty','Note'],['Bolt M8','12','Zinc plated'],['Nut M8','30','Order more'],['Washer','45','In stock']];
async function openPdf(app,page,file){await app.evaluate(({dialog},f)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).first().click();await page.getByLabel('Rendered PDF page 1',{exact:true}).filter({visible:true}).first().waitFor({timeout:60000});}
for(const [kind,caption]of [['csv','Save reviewed CSV'],['xlsx','Save reviewed XLSX']])for(const delay of [100,500,1500]){
  test(`killed ${delay} ms into saving an extracted table as ${kind.toUpperCase()}: no partial file, PDF intact, restart works`,async()=>{
    const root=await fs.mkdtemp(path.resolve('.test-data/kill-table-')),source=path.join(root,'parts.pdf'),output=path.join(root,'out','table.'+kind);
    const doc=await PDFDocument.create(),sheet=doc.addPage([612,792]);for(let r=0;r<TABLE.length;r++)for(let c=0;c<3;c++)sheet.drawText(TABLE[r][c],{x:78+c*150,y:672-r*30,size:11});const original=await doc.save();
    await fs.mkdir(path.dirname(output));await fs.writeFile(source,original);
    const app=await launchReader({args:['.'],env:env(root)}),page=await app.firstWindow();
    await openPdf(app,page,source);await readerTools(page,'Edit','Extract a table');await page.getByRole('button',{name:'Extract a table',exact:true}).click();
    const panel=page.getByRole('region',{name:'Extract a table options',exact:true});await expect(panel.getByRole('button',{name:'Read selectable words',exact:true})).toBeEnabled({timeout:120000});
    for(const [name,value]of [['Left %',70/612*100],['Top %',98/792*100],['Width %',454/612*100],['Height %',124/792*100],['Rows',4],['Columns',3]]){const input=panel.getByRole('spinbutton',{name,exact:true});await input.fill(String(value));await input.press('Tab');}
    await panel.getByRole('button',{name:'Read selectable words',exact:true}).click();await expect(panel.getByRole('textbox',{name:/^Row 2, column 2/})).toHaveValue('12',{timeout:60000});
    await panel.getByRole('checkbox',{name:'I checked every cell against the original page',exact:true}).check();
    await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},output);
    await panel.getByRole('button',{name:caption,exact:true}).click();await page.waitForTimeout(delay);kill(app);await new Promise(r=>setTimeout(r,3000));
    expect((await fs.readdir(path.dirname(output))).filter(n=>n!==path.basename(output))).toEqual([]);
    const exists=await fs.stat(output).then(()=>true,()=>false);console.log('after kill: '+(exists?'a complete copy was saved':'no copy was saved')+' ('+path.basename(output)+')');
    if(exists&&kind==='csv'){const rows=(await fs.readFile(output,'utf8')).replace(/^﻿/,'').trim().split(/\r?\n/).map(l=>l.split(',').map(v=>v.replace(/^"|"$/g,'')));expect(rows).toEqual(TABLE);}
    if(exists&&kind==='xlsx'){const book=await inspectXlsx(output);expect(book.ok).toBe(true);for(let r=0;r<TABLE.length;r++)for(let c=0;c<3;c++)expect(book.cells[String.fromCharCode(65+c)+(r+1)]?.value).toBe(TABLE[r][c]);}
    expect(hash(await fs.readFile(source))).toBe(hash(original));
    const again=await launchReader({args:['.'],env:env(root)}),next=await again.firstWindow();
    try{await next.waitForLoadState('domcontentloaded');for(const name of ['Discard','Not now','Close'])await next.getByRole('button',{name,exact:true}).first().click({timeout:1500}).catch(()=>{});await openPdf(again,next,source);}
    finally{await again.evaluate(({app})=>app.exit(0)).catch(()=>{});await again.close().catch(()=>{});}
  });
}
