// Focused actual SW3 acceptance check; the native window stays hidden.
import {_electron as electron} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
const root=path.resolve('.'),directory=path.join(root,'tmp','sw3-desktop-'+randomUUID());
await fs.mkdir(directory,{recursive:true});
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-SW3-Desktop-'));
const file='C:\\Users\\andre\\Downloads\\SW3.pdf for cal where i live.pdf';
const report={at:new Date().toISOString(),directory,profile,pages:[],errors:[]};
let app;
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 const page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));
 await page.waitForLoadState('domcontentloaded');
 await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);
 const started=Date.now();await page.getByRole('button',{name:'Open a file',exact:true}).click();
 for(const number of [1,350,700,1]){
  const start=number===1&&!report.pages.length?started:Date.now();
  if(report.pages.length){await page.getByRole('spinbutton',{name:'Page number'}).fill(String(number));await page.getByRole('spinbutton',{name:'Page number'}).press('Tab');}
  await page.locator(`.pdf-paper[data-page="${number}"][data-ready="true"]`).waitFor({timeout:60000});
  const canvas=page.locator('.pdf-paper canvas');
  const pixels=await canvas.evaluate(c=>{const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let ink=0;for(let i=0;i<data.length;i+=4)if(data[i]<200&&data[i+1]<200&&data[i+2]<200)ink++;return {width:c.width,height:c.height,ink};});
  if(pixels.ink<1000)throw new Error('The chart canvas has insufficient visible artwork.');
  const selectableCharacters=(await page.locator('.textLayer').innerText()).trim().length;
  if(selectableCharacters<100)throw new Error('The original SW3 page text was not available for selection.');
  report.pages.push({page:number,readyMs:Date.now()-start,...pixels,selectableCharacters,status:await page.locator('.page-status').innerText(),messageVisible:await page.locator('.pdf-message').isVisible()});
  const png=await canvas.evaluate(c=>c.toDataURL('image/png').split(',')[1]);
  await fs.writeFile(path.join(directory,'canvas-'+number+'.png'),Buffer.from(png,'base64'));
 }
 report.hidden=await app.evaluate(({BrowserWindow})=>!BrowserWindow.getAllWindows()[0].isVisible());
 await page.getByRole('button',{name:'Back to Home',exact:true}).click();
 await page.getByRole('button',{name:'Open a file',exact:true}).waitFor();
 report.returnedHome=true;report.pass=report.hidden&&report.errors.length===0&&report.pages.every(p=>p.status.includes('of 700'));
}catch(error){report.pass=false;report.error=error.message;}
finally{if(app)await app.close();await fs.writeFile(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));process.exitCode=report.pass?0:1;
