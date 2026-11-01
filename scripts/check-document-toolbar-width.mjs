// Hidden check that no part of the editor ribbon scrolls sideways (hiding controls; text fields scrolling their own text are fine) on any tab at 1380, 1024 or
// 800 px, the minimum window width. Default text size only; the larger interface text settings were not exercised.
import {_electron as electron} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {randomUUID} from 'node:crypto';
const output=path.resolve('tmp/document-toolbar-width-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Width-'));await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,results:[],failures:[],errors:[]};let app,page;
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 await page.getByRole('button',{name:'New document',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});
 for(const width of [1380,1024,800]){
  await app.evaluate(({BrowserWindow},width)=>BrowserWindow.getAllWindows()[0].setSize(width,800),width);await page.waitForTimeout(500);
  for(const tab of ['File','Home','Insert','Layout','Review']){
   await page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name:tab,exact:true}).click();await page.waitForTimeout(150);
   const scrolling=await page.evaluate(()=>[...document.querySelectorAll('.document-ribbon *')].filter(el=>!['INPUT','TEXTAREA','SELECT'].includes(el.tagName)&&el.scrollWidth>el.clientWidth+2&&getComputedStyle(el).overflowX!=='visible'&&el.clientWidth>0).map(el=>({cls:String(el.className).slice(0,60),client:el.clientWidth,scroll:el.scrollWidth})));
   report.results.push({width,tab,scrolling});if(scrolling.length){report.failures.push({width,tab,scrolling});await page.screenshot({path:path.join(output,`overflow-${width}-${tab}.png`)});}
  }
  await page.screenshot({path:path.join(output,`ribbon-${width}.png`)});
 }
}catch(error){report.error=error.message;}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed)try{process.kill(pid);}catch{}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,failures:report.failures,error:report.error},null,2));process.exit(report.pass?0:1);
