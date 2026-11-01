// Hidden UI debug pass over the shell and every tool screen in All tools (each tool group, from src/tool-registry.js). Each screen is opened in a fresh
// app at each window size and checked for sideways scrolling, controls cut off or overlapping, controls with no
// name, and page errors; a screenshot of each is kept for review. Writes tmp/ui-screens-<time>/report.json.
// Usage: node scripts/check-ui-screens.mjs [--only "tool title"] [--large-text]
import {_electron as electron} from '@playwright/test';
import fs from 'node:fs/promises';import {execFileSync} from 'node:child_process';import path from 'node:path';import os from 'node:os';
const args=process.argv.slice(2),only=args.includes('--only')?args[args.indexOf('--only')+1]:null,largeText=args.includes('--large-text');
const output=path.resolve('tmp/ui-screens-'+new Date().toISOString().replace(/[:.]/g,'-'));await fs.mkdir(output,{recursive:true});
const fixtures={pdf:path.resolve('tests/fixtures/reading-sample.pdf'),png:path.resolve('tests/fixtures/scan-page.png'),docx:path.resolve('tests/fixtures/editing-sample.docx')};
const sizes=[[800,620],[1366,820]];
const groups=(await import('../src/tool-registry.js')).TOOL_GROUPS.map(group=>group.name);
const shell=['Home','Files','Favorites','All tools','Ask about files','Format support','Settings & privacy'];
const fileFor=title=>/image to pdf/i.test(title)?fixtures.png:/open a document|edit slide|edit a workbook/i.test(title)?fixtures.docx:fixtures.pdf;
const slug=text=>text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
// Runs inside the page: everything visible that a person could not use or read properly.
function inspect(){
 const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);if(!(r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!el.closest('[hidden]')))return false;/* Content of a closed menu keeps a layout box but is not shown. */for(let d=el.closest('details');d;d=d.parentElement?.closest('details'))if(!d.open&&!d.querySelector(':scope>summary')?.contains(el))return false;return true;};
 const surface=[...document.querySelectorAll('dialog[open]')].at(-1)||document.querySelector('#app')||document.body;
 const label=el=>(el.getAttribute('aria-label')||el.getAttribute('title')||el.labels?.[0]?.textContent||el.textContent||el.getAttribute('placeholder')||el.value||'').trim().replace(/\s+/g,' ');
 const controls=[...surface.querySelectorAll('button,select,input:not([type=hidden]),textarea,summary,a[href]')].filter(visible).filter(el=>!el.closest('.textLayer,.ProseMirror,.pdf-paper'));
 const issues=[];
 if(document.documentElement.scrollWidth>innerWidth+1)issues.push({kind:'page scrolls sideways',detail:document.documentElement.scrollWidth+' > '+innerWidth});
 for(const box of [surface,...surface.querySelectorAll('.dialog-body,.workspace-room-panel,.document-ribbon,.editor-toolbar,[class$="-workspace"]')])if(visible(box)&&box.scrollWidth>box.clientWidth+2&&getComputedStyle(box).overflowX!=='visible')issues.push({kind:'panel scrolls sideways',detail:(box.className||box.tagName).toString().slice(0,60)+' '+box.scrollWidth+' > '+box.clientWidth});
 for(const el of controls){const name=label(el);if(!name&&el.type!=='color'&&el.type!=='file')issues.push({kind:'control with no name',detail:el.outerHTML.slice(0,120)});
  const r=el.getBoundingClientRect();if(r.right>innerWidth+1||r.bottom>innerHeight+1&&getComputedStyle(el).position==='fixed')issues.push({kind:'control outside the window',detail:name.slice(0,50)});
  if(['BUTTON','SUMMARY'].includes(el.tagName)&&el.scrollWidth>el.clientWidth+2&&getComputedStyle(el).overflow!=='visible')issues.push({kind:'text cut off',detail:name.slice(0,60)});}
 const rects=controls.map(el=>({el,r:el.getBoundingClientRect(),name:label(el).slice(0,40)}));
 for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];if(a.el.contains(b.el)||b.el.contains(a.el))continue;const w=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left),h=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);if(w>4&&h>4)issues.push({kind:'controls overlap',detail:a.name+' / '+b.name});}
 return {title:(document.querySelector('dialog[open] h2')||document.querySelector('#main-content h1'))?.textContent?.trim().slice(0,80)||'',controls:controls.length,issues};
}
async function launch(width,height){
 const profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-UI-'));const app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 const page=await app.firstWindow();const errors=[];page.on('pageerror',e=>errors.push(e.message.slice(0,200)));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text().slice(0,200));});
 await page.waitForLoadState('domcontentloaded');await app.evaluate(({BrowserWindow},[w,h])=>BrowserWindow.getAllWindows()[0].setSize(w,h),[width,height]);await page.waitForTimeout(800);
 if(largeText){await page.getByRole('button',{name:/Settings/}).first().click();const select=page.locator('.interface-accessibility select').first();await select.selectOption({index:(await select.locator('option').count())-1});await page.getByRole('button',{name:'Home',exact:true}).first().click();await page.waitForTimeout(400);}
 return {app,page,errors,profile};
}
// If PDFix does not close within 15 seconds, end it and everything it started, so a finished check never keeps
// app windows (and the shared run lock) alive (it did on October 20).
async function close({app,profile}){const pid=app.process()?.pid;const closed=await Promise.race([app.close().then(()=>true,()=>false),new Promise(r=>setTimeout(()=>r(false),15000))]);
 if(!closed&&pid){try{execFileSync('taskkill',['/PID',String(pid),'/T','/F'],{stdio:'ignore'});}catch{}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
const results=[];
async function record(name,size,session,shot){const found=await session.page.evaluate(inspect).catch(error=>({title:'',controls:0,issues:[{kind:'check failed',detail:error.message.slice(0,120)}]}));
 const file=path.join(output,`${slug(name)}-${size[0]}x${size[1]}${largeText?'-large':''}.png`);await session.page.screenshot({path:file}).catch(()=>{});
 results.push({name,size:size.join('x'),...found,errors:[...new Set(session.errors)].slice(0,5),screenshot:path.basename(file)});session.errors.length=0;}
// Tools in every All tools group, read from the app itself (the group tabs come from the shared tool registry).
let tools=[];{const s=await launch(1366,820);await s.page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();for(const room of groups){await s.page.getByRole('tablist',{name:'Tool groups'}).getByRole('tab',{name:room,exact:true}).click();for(const title of await s.page.locator('.workspace-room-grid button h2').allTextContents())tools.push([room,title]);}await close(s);}
if(only)tools=tools.filter(([,title])=>title===only);
for(const size of sizes){
 if(!only){const s=await launch(...size);for(const name of shell){await s.page.getByRole('button',{name,exact:true}).first().click().catch(()=>{});await s.page.waitForTimeout(700);await record('shell: '+name,size,s);}
  await s.page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();for(const room of groups){await s.page.getByRole('tablist',{name:'Tool groups'}).getByRole('tab',{name:room,exact:true}).click();await s.page.waitForTimeout(300);await record('room: '+room,size,s);}
  await s.page.getByRole('button',{name:'Home',exact:true}).first().click();await s.page.getByRole('button',{name:'New document',exact:true}).click();await s.page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000}).catch(()=>{});
  for(const tab of ['File','Home','Insert','Layout','Review']){await s.page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name:tab,exact:true}).click().catch(()=>{});await s.page.waitForTimeout(300);await record('editor: '+tab,size,s);}
  await close(s);}
 for(const [room,title] of tools){const s=await launch(...size);try{await s.app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});dialog.showSaveDialog=async()=>({canceled:true});},fileFor(title));
   await s.page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();await s.page.getByRole('tablist',{name:'Tool groups'}).getByRole('tab',{name:room,exact:true}).click();await s.page.locator('.workspace-room-grid button').filter({has:s.page.locator('h2',{hasText:title})}).first().click();
   await s.page.waitForTimeout(3500);await record('tool: '+title,size,s);}catch(error){results.push({name:'tool: '+title,size:size.join('x'),issues:[{kind:'could not open',detail:error.message.split('\n')[0].slice(0,160)}],errors:s.errors.slice(0,3)});}await close(s);}
}
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(results,null,1));
const withIssues=results.filter(r=>r.issues.length||r.errors.length);
console.log(JSON.stringify({output,screens:results.length,withIssues:withIssues.length,summary:withIssues.map(r=>`${r.name} @${r.size}: `+[...new Set(r.issues.map(i=>i.kind+(i.detail?' ('+i.detail.slice(0,70)+')':'')))].slice(0,4).join('; ')+(r.errors.length?' | errors: '+r.errors[0]:''))},null,1));
// Leave nothing running once the report is written.
process.exit(0);
