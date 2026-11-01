// Focused actual-file acceptance for the reported large-PDF scrolling defect.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
const directory=path.resolve('tmp/sw3-scrolling-'+randomUUID());await fs.mkdir(directory,{recursive:true});
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-SW3-Scroll-'));
const report={at:new Date().toISOString(),directory,profile,checks:[],errors:[]};let app,page;
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 await app.evaluate(({dialog})=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:['C:\\Users\\andre\\Downloads\\SW3.pdf for cal where i live.pdf']});});
 await page.getByRole('button',{name:'Open a file',exact:true}).click();
 const ready=number=>page.locator(`.pdf-multi-slot[data-page="${number}"][data-ready="true"]`).waitFor({timeout:20000});
 await ready(1);await expect(page.locator('.reading-view')).toHaveValue('continuous');
 report.checks.push({name:'default continuous',slots:await page.locator('.pdf-multi-slot').count()});
 async function wheelTo(number){
  const stage=page.locator('.page-stage'),bounds=await stage.boundingBox();await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
  const delta=await page.evaluate(number=>{const stage=document.querySelector('.page-stage'),slot=document.querySelector(`.pdf-multi-slot[data-page="${number}"]`);return slot.getBoundingClientRect().top-stage.getBoundingClientRect().top-12;},number);
  await page.mouse.wheel(0,delta);await expect(page.getByRole('spinbutton',{name:'Page number'})).toHaveValue(String(number),{timeout:60000});await ready(number);
  report.checks.push({name:'mouse wheel',page:number});
 }
 await wheelTo(2);await wheelTo(1);
 await page.getByRole('spinbutton',{name:'Page number'}).fill('350');await page.getByRole('spinbutton',{name:'Page number'}).press('Tab');await ready(350);
 await wheelTo(351);await wheelTo(350);
 report.memory=await page.locator('.pdf-multi-slot canvas').evaluateAll(canvases=>{const live=canvases.filter(c=>c.width&&c.height);return {liveCanvases:live.length,canvasPixels:live.reduce((sum,c)=>sum+c.width*c.height,0)};});
 if(report.memory.liveCanvases>2||report.memory.canvasPixels>32000000)throw new Error('Continuous page canvases exceeded their memory envelope.');
 report.selectableCharacters=(await page.locator('.pdf-multi-slot[data-page="350"] .textLayer').innerText()).trim().length;
 if(report.selectableCharacters<100)throw new Error('Chart text selection was lost.');
 const canvas=page.locator('.pdf-multi-slot[data-page="350"] canvas'),png=await canvas.evaluate(c=>c.toDataURL('image/png').split(',')[1]);await fs.writeFile(path.join(directory,'chart-350.png'),Buffer.from(png,'base64'));
 await page.getByRole('spinbutton',{name:'Page number'}).fill('700');await page.getByRole('spinbutton',{name:'Page number'}).press('Tab');await ready(700);report.checks.push({name:'last page',page:700});
 await page.locator('.reader-view-options > summary').click();await page.locator('.pdf-tool-group > summary').filter({hasText:'View and selection'}).click();await page.getByRole('combobox',{name:'Reading view'}).selectOption('page');await page.locator('.pdf-paper[data-page="700"][data-ready="true"]').waitFor({timeout:60000});report.checks.push({name:'single-page switching',page:700});
 await page.locator('.reader-view-options > summary').click();await page.getByRole('combobox',{name:'Reading view'}).selectOption('continuous');await ready(700);report.checks.push({name:'continuous switching',page:700});
 await page.getByRole('button',{name:'Back to Home',exact:true}).click();await page.getByRole('button',{name:'Open a file',exact:true}).waitFor();
 report.hidden=await app.evaluate(({BrowserWindow})=>!BrowserWindow.getAllWindows()[0].isVisible());report.pass=report.hidden&&report.errors.length===0;
}catch(error){report.pass=false;report.error=error.message;if(page)report.view=await page.evaluate(()=>({asset:document.querySelector('script[type="module"]')?.src,sourceMode:document.querySelector('[data-source-mode]')?.dataset.sourceMode,pageLimit:document.querySelector('[data-continuous-page-limit]')?.dataset.continuousPageLimit,message:document.querySelector('.pdf-message')?.textContent,status:document.querySelector('.page-status')?.textContent,mode:document.querySelector('.reading-view')?.value,stage:document.querySelector('.page-stage')?.getBoundingClientRect().toJSON(),slots:[...document.querySelectorAll('.pdf-multi-slot')].slice(0,3).map(s=>({page:s.dataset.page,ready:s.dataset.ready,placeholder:s.querySelector('.pdf-multi-placeholder')?.textContent,rect:s.getBoundingClientRect().toJSON()}))}));}
finally{if(app)await app.close();await fs.writeFile(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));process.exitCode=report.pass?0:1;
