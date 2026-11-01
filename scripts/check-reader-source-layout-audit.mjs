// Read-only reproduction of owner's editor screenshot; editor fixes belong to Claude.
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {expect} from '@playwright/test';import {launchReader} from '../tests/helpers/reader-launch.mjs';
import {readerRuntime} from '../tests/helpers/reader-runtime.mjs';import {closeReaderApp} from '../tests/helpers/reader-desktop.mjs';
const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-owner-layout-')),file=path.join(root,'layout-sample.md'),text='# Layout sample\n\n'+Array.from({length:60},(_,i)=>'- **Item '+i+':** '+('Long source line kept as plain text. '.repeat(8))).join('\n\n');
await fs.writeFile(file,text);const report={scope:'Generated source-only screenshot reproduction; no editor code changed',states:[]};let app,timer;
try{
 app=await launchReader({args:[await readerRuntime()],env:{...process.env,PDFIX_TEST_VISIBLE:'0',PDFIX_TEST_DATA:path.join(root,'profile')}});timer=setTimeout(()=>app.process().kill(),90000);
 const page=await app.firstWindow();await page.setViewportSize({width:1366,height:820});
 await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);
 await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.getByRole('button',{name:'Source and preview',exact:true}).click();
 await expect(page.getByRole('region',{name:'Markdown preview',exact:true}).getByRole('heading',{name:'Layout sample',exact:true})).toBeVisible();
 for(const value of ['fit','200']){
  await page.getByRole('combobox',{name:'Document view zoom',exact:true}).selectOption(value);
  const geometry=await page.evaluate(()=>{const page=document.querySelector('.editor-page'),preview=document.querySelector('.source-preview-panel'),canvas=document.querySelector('.editor-canvas'),rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};return {source:rect(page),preview:rect(preview),canvas:rect(canvas),canvasScrollWidth:canvas.scrollWidth,canvasClientWidth:canvas.clientWidth,actualZoom:page.style.zoom,inlineSourceWidth:page.style.width};});
  const screenshot=path.join(root,'split-'+value+'.png');await page.screenshot({path:screenshot});report.states.push({value,...geometry,screenshot,overlap:geometry.source.y<geometry.preview.bottom&&geometry.preview.y<geometry.source.bottom&&geometry.source.right>geometry.preview.x+1});
 }
 expect(await fs.readFile(file,'utf8')).toBe(text);report.sourceUnchanged=true;report.reproduced=report.states.some(s=>s.overlap);
}catch(error){report.error=error.stack;}
finally{clearTimeout(timer);await closeReaderApp(app);report.closed=true;await fs.writeFile(path.join(root,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({report:path.join(root,'report.json'),reproduced:report.reproduced,error:report.error}));if(report.error)process.exitCode=1;}
