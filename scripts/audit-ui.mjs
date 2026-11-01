import {_electron as electron} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('.test-data',`visual-audit-${Date.now()}`);await fs.mkdir(root,{recursive:true});
const desktop=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile')}}),page=await desktop.firstWindow();
const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.waitForLoadState('domcontentloaded');
const measurements=[];
async function capture(name){await page.screenshot({path:path.join(root,`${name}.png`)});measurements.push(await page.evaluate(name=>({name,width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth-innerWidth,topbar:document.querySelector('.topbar').getBoundingClientRect().height,documentArea:document.querySelector('.document-area')?.getBoundingClientRect().height,editorArea:document.querySelector('.editor-canvas')?.getBoundingClientRect().height,readerArea:document.querySelector('.page-stage')?.getBoundingClientRect().height,stageWidth:document.querySelector('.page-stage')?.clientWidth,stageScrollWidth:document.querySelector('.page-stage')?.scrollWidth,paperWidth:document.querySelector('.pdf-paper')?.getBoundingClientRect().width}),name));}
async function open(name){await desktop.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},path.resolve('tests/fixtures',name));await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.pdf-paper[data-ready="true"],.document-area[data-ready="true"]').waitFor();}
try{
  for(const [width,height]of [[1380,920],[800,620]]){
    await desktop.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setSize(...size),[width,height]);
    await page.getByRole('button',{name:'Home',exact:true}).click();await capture(`${width}-home`);
    await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();await capture(`${width}-workspaces`);
    await page.getByRole('button',{name:'Home',exact:true}).click();await open('editing-sample.docx');await capture(`${width}-editor`);await page.getByRole('button',{name:'Version history',exact:true}).click();await page.locator('.version-row').first().waitFor();await capture(`${width}-versions`);await page.getByRole('button',{name:'Close version history',exact:true}).click();
    await page.getByRole('button',{name:'Back to Home'}).click();await open('reading-sample.pdf');await page.waitForTimeout(250);await capture(`${width}-reader`);
    await page.getByRole('button',{name:'Organize pages',exact:true}).click();await page.getByRole('button',{name:'Preview new copy',exact:true}).waitFor({state:'visible'});await page.locator('.page-plan-row').first().waitFor();await capture(`${width}-organizer`);await page.getByRole('button',{name:'Close page workspace'}).click();
    await page.getByRole('button',{name:'Settings & privacy',exact:true}).click();await capture(`${width}-settings`);await page.getByRole('button',{name:'Files',exact:true}).click();await capture(`${width}-files`);await page.getByRole('button',{name:'Format support',exact:true}).click();await capture(`${width}-formats`);await page.getByRole('button',{name:'Home',exact:true}).click();await open('scan-only.pdf');await page.getByRole('button',{name:'Make scan searchable',exact:true}).click();const ocr=page.locator('.ocr-workspace');await ocr.getByRole('button',{name:'Start local OCR',exact:true}).click();await ocr.locator('.ocr-lines input').first().waitFor({timeout:60000});await ocr.evaluate(node=>node.scrollTop=0);await capture(`${width}-ocr-review`);await ocr.getByRole('button',{name:'Close OCR workspace',exact:true}).click();
  }
}finally{await desktop.close();}
await fs.writeFile(path.join(root,'measurements.json'),JSON.stringify({measurements,errors},null,2));console.log(JSON.stringify({root,measurements,errors}));
