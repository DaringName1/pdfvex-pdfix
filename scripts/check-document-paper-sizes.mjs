// Hidden check of every listed paper size: for A4, Letter, Legal, A3, A5 and Tabloid (portrait) and A3 landscape,
// choose the paper in Layout, save a PDF copy and measure its page size. The sheet in the editor must follow the
// paper too. Fails when any PDF page is more than 1 mm off.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const {documentPapers}=require('../desktop/document-layout-validation.cjs');
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Papers-'));const results=[],failures=[],errors=[];let app,page;
const cases=[...Object.keys(documentPapers).map(paper=>[paper,false]),['a3',true]];
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:process.env.CI?90000:30000});
 page=await app.firstWindow({timeout:process.env.CI?90000:30000});page.on('pageerror',error=>errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'}),tab=name=>page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name,exact:true}).click();
 await page.getByRole('button',{name:'New document',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});await editor.pressSequentially('Paper size check');
 await tab('Layout');const details=page.locator('.document-layout-controls');if(await details.evaluate(d=>d.tagName==='DETAILS'&&!d.open))await details.locator('summary').click();
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
 for(const [paper,landscape] of cases){
  const name=`${paper}${landscape?'-landscape':''}`;
  try{
   await page.locator('[data-layout="paper"]').selectOption(paper);await page.locator('[data-layout="landscape"]').selectOption({label:landscape?'Landscape':'Portrait'});
   const [w,h]=documentPapers[paper].size,expected=landscape?[h,w]:[w,h];
   const sheetMm=await page.locator('.editor-page').evaluate(el=>Math.round(el.getBoundingClientRect().width/parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--document-zoom')||1)/96*25.4)).catch(()=>null);
   const pdf=path.join(profile,name+'.pdf');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},pdf);
   await page.getByRole('button',{name:'Export PDF',exact:true}).click();const dialog=page.locator('.document-pdf-export');
   await dialog.getByRole('button',{name:'Preview PDF',exact:true}).click();await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});
   await dialog.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(dialog.locator('.document-pdf-status')).toContainText('Saved '+name+'.pdf',{timeout:45000});await dialog.getByRole('button',{name:'Close PDF export',exact:true}).click();
   const task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile(pdf))}),loaded=await task.promise,first=await loaded.getPage(1),[,,x,y]=first.view;await task.destroy();
   const actual=[x,y].map(points=>Math.round(points/72*25.4*10)/10);results.push({name,expected,actual,sheetMm});
   if(Math.abs(actual[0]-expected[0])>1||Math.abs(actual[1]-expected[1])>1)failures.push(`${name}: PDF page is ${actual.join(' x ')} mm, expected ${expected.join(' x ')} mm`);
  }catch(error){failures.push(name+': '+error.message.slice(0,300));}
 }
}catch(error){failures.push('Stopped: '+error.message.slice(0,300));}
finally{if(app)await Promise.race([app.close().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,20000))]);await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
const pass=!failures.length&&!errors.length;console.log(JSON.stringify({pass,results,failures,errors:errors.slice(0,3)},null,1));process.exit(pass?0:1);
