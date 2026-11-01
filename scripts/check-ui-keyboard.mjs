// Hidden keyboard and close-behaviour pass over every Documents / More tools screen, one after another in one app,
// so leftovers from one tool show up in the next. For each tool: Tab through up to 30 stops (focus must stay inside
// the open tool and be visibly marked), press Escape (the tool must close, leaving no open dialog or overlay), then
// return Home. Writes tmp/ui-keyboard-<time>/report.json.
import {_electron as electron} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
const groups=(await import('../src/tool-registry.js')).TOOL_GROUPS.map(group=>group.name).sort((a,b)=>(b==='Create')-(a==='Create'));
const output=path.resolve('tmp/ui-keyboard-'+new Date().toISOString().replace(/[:.]/g,'-'));await fs.mkdir(output,{recursive:true});
const fixtures={pdf:path.resolve('tests/fixtures/reading-sample.pdf'),png:path.resolve('tests/fixtures/scan-page.png'),docx:path.resolve('tests/fixtures/editing-sample.docx')};
const fileFor=title=>/image to pdf/i.test(title)?fixtures.png:/open a document|edit slide|edit a workbook/i.test(title)?fixtures.docx:fixtures.pdf;
const slug=text=>text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-KB-'));
const app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
const page=await app.firstWindow();const errors=[];page.on('pageerror',e=>errors.push(e.message.slice(0,200)));
await page.waitForLoadState('domcontentloaded');await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1100,760));await page.waitForTimeout(800);
const focusInfo=()=>page.evaluate(()=>{const el=document.activeElement;if(!el||el===document.body)return {where:'nothing'};
 const surface=[...document.querySelectorAll('dialog[open]')].at(-1),inside=surface?surface.contains(el):true,s=getComputedStyle(el),r=el.getBoundingClientRect();
 const marked=s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0||s.boxShadow!=='none';
 return {where:inside?'inside':'outside the open tool',name:(el.getAttribute('aria-label')||el.textContent||el.title||el.tagName).trim().slice(0,40),marked,shown:r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight};});
const state=()=>page.evaluate(()=>({dialogs:document.querySelectorAll('dialog[open]').length,toast:document.querySelector('#toast')?.hidden===false?document.querySelector('#toast').textContent.trim().slice(0,90):'',view:document.querySelector('#main-content h1')?.textContent.trim().slice(0,40)||''}));
let tools=[];await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();for(const room of groups){await page.getByRole('tablist',{name:'Tool groups'}).getByRole('tab',{name:room,exact:true}).click();for(const title of await page.locator('.workspace-room-grid button h2').allTextContents())tools.push([room,title]);}
const results=[];let previousToast='';
for(const [room,title] of tools){
 const result={tool:title,issues:[]};errors.length=0;
 try{
  await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});dialog.showSaveDialog=async()=>({canceled:true});},fileFor(title));
  await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();await page.getByRole('tab',{name:room,exact:true}).click();
  await page.locator('.workspace-room-grid button').filter({has:page.locator('h2',{hasText:title})}).first().click();await page.waitForTimeout(3000);
  const opened=await state();if(previousToast&&opened.toast===previousToast&&!/^Opened /.test(previousToast))result.issues.push('previous tool\'s message still showing: '+previousToast);
  const stops=[];for(let i=0;i<30;i++){await page.keyboard.press('Tab');const f=await focusInfo();stops.push(f);}
  const outside=stops.filter(f=>f.where==='outside the open tool').length,unmarked=stops.filter(f=>f.where==='inside'&&!f.marked&&f.name!=='Editable document').map(f=>f.name),hidden=stops.filter(f=>f.where==='inside'&&!f.shown).map(f=>f.name);
  if(outside)result.issues.push(`focus left the tool on ${outside} of 30 Tab presses`);
  if(unmarked.length)result.issues.push('focus not visibly marked on: '+[...new Set(unmarked)].slice(0,5).join(', '));
  if(hidden.length)result.issues.push('focus went to something off-screen: '+[...new Set(hidden)].slice(0,4).join(', '));
  await page.screenshot({path:path.join(output,slug(title)+'-focus.png')});
  await page.keyboard.press('Escape');await page.waitForTimeout(800);let after=await state();
  if(after.dialogs){await page.keyboard.press('Escape');await page.waitForTimeout(800);after=await state();if(after.dialogs)result.issues.push('Escape did not close the tool');else result.issues.push('needed Escape twice to close');}
  result.afterEscape=after;previousToast=after.toast;
  if(after.dialogs){const close=page.locator('dialog[open]').last().getByRole('button',{name:/^Close/}).first();await close.click({timeout:3000}).catch(()=>result.issues.push('no Close button worked'));await page.waitForTimeout(600);}
  const back=page.getByRole('button',{name:/^Back to /}).first();if(await back.isVisible().catch(()=>false)){await back.click();await page.waitForTimeout(800);}
  const leftovers=await state();if(leftovers.dialogs)result.issues.push('a dialog stayed open after closing');
 }catch(error){result.issues.push('stopped: '+error.message.split('\n')[0].slice(0,140));await page.keyboard.press('Escape').catch(()=>{});}
 if(errors.length)result.issues.push('page errors: '+errors.slice(0,2).join(' | '));
 results.push(result);
}
await Promise.race([app.close().catch(()=>{}),new Promise(r=>setTimeout(r,15000))]);await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(results,null,1));
console.log(JSON.stringify({output,tools:results.length,withIssues:results.filter(r=>r.issues.length).map(r=>r.tool+': '+r.issues.join('; '))},null,1));
