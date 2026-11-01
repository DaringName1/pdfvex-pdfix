// Hidden smoke walk over every tool listed in Workspaces and every Home quick action. For each one it supplies a
// small fixture through the file dialog, waits, and records what happened: a workspace or dialog opened, an error
// message, a renderer error, or nothing. Save and confirmation dialogs are always canceled, so nothing is written.
// This is a survey for review, not acceptance: "opens" only means the tool's screen appeared without an error.
import {_electron as electron} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
const groups=(await import('../src/tool-registry.js')).TOOL_GROUPS.map(group=>group.name).sort((a,b)=>(b==='Create')-(a==='Create'));
const output=path.resolve('tmp/app-smoke-'+randomUUID()),work=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Files-'));
await fs.mkdir(output,{recursive:true});
const fixtures={pdf:path.join(work,'Reading sample.pdf'),pdf2:path.join(work,'Navigation sample.pdf'),docx:path.join(work,'Editing sample.docx'),png:path.join(work,'Scan page.png'),scan:path.join(work,'Scan only.pdf')};
await fs.copyFile('tests/fixtures/reading-sample.pdf',fixtures.pdf);await fs.copyFile('tests/fixtures/navigation-sample.pdf',fixtures.pdf2);await fs.copyFile('tests/fixtures/editing-sample.docx',fixtures.docx);await fs.copyFile('tests/fixtures/scan-page.png',fixtures.png);await fs.copyFile('tests/fixtures/scan-only.pdf',fixtures.scan);
const report={at:new Date().toISOString(),output,scope:'Smoke survey of tool entry points with small fixtures; saving and confirmations canceled. Not acceptance of any tool.',results:[],restarts:0};
const fileFor=title=>/Image to PDF/i.test(title)?[fixtures.png]:/Open a document/i.test(title)?[fixtures.docx]:/searchable|OCR/i.test(title)?[fixtures.scan]:/Compare|Combine|Bates|Compress several|Batch|sheet sets|Search selected/i.test(title)?[fixtures.pdf,fixtures.pdf2]:/slide|workbook/i.test(title)?null:[fixtures.pdf];
let app,page,profile,errors=[];
async function launch(){profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Smoke-'));app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 await app.evaluate(({dialog,shell})=>{global.pdfixSmoke={files:null,boxes:[],dialogs:[]};dialog.showOpenDialog=async(_window,options)=>{global.pdfixSmoke.dialogs.push('open: '+(options?.title??''));const files=global.pdfixSmoke.files;if(!files)return {canceled:true,filePaths:[]};return {canceled:false,filePaths:options?.properties?.includes('multiSelections')?files:[files[0]]};};dialog.showSaveDialog=async(_window,options)=>{global.pdfixSmoke.dialogs.push('save: '+(options?.title??''));return {canceled:true};};dialog.showMessageBox=async(_window,options)=>{global.pdfixSmoke.boxes.push(String(options?.message??'').slice(0,160));const buttons=options?.buttons??['OK'];return {response:options?.cancelId??Math.max(0,buttons.findIndex(label=>/cancel|no|keep|close/i.test(label))),checkboxChecked:false};};shell.openExternal=async()=>{};});
 page=await app.firstWindow();page.on('pageerror',error=>errors.push('pageerror: '+error.message.slice(0,300)));page.on('console',message=>{if(message.type()==='error')errors.push('console: '+message.text().slice(0,300));});await page.waitForLoadState('domcontentloaded');}
async function quit(){if(!app)return;const pid=app.process().pid;const closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),10000))]);if(!closed)try{process.kill(pid);}catch{}app=null;await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});return closed;}
const snapshot=()=>page.evaluate(()=>{const visible=node=>node&&node.getClientRects().length>0;const toast=document.querySelector('#toast');const dialogs=[...document.querySelectorAll('dialog[open]')].map(dialog=>(dialog.getAttribute('aria-label')||dialog.querySelector('h1,h2,h3')?.textContent||dialog.className||'dialog').trim().slice(0,70)+' :: '+dialog.innerText.replace(/\s+/g,' ').slice(0,160));
 const main=document.querySelector('#main-content');return {toast:toast&&!toast.hidden?toast.textContent.slice(0,260):'',toastError:!!(toast&&!toast.hidden&&toast.classList.contains('error')),dialogs,heading:[...document.querySelectorAll('#main-content h1,#main-content h2')].filter(visible)[0]?.textContent.trim().slice(0,70)??'',title:document.querySelector('.document-title b')?.textContent??'',workView:document.querySelector('#app,.app,body > div')?.className??'',mainClasses:[...new Set([...(main?.querySelectorAll(':scope > *')??[])].map(node=>node.className).filter(Boolean))].slice(0,5).join(' | ').slice(0,200),ready:!!document.querySelector('[data-ready="true"]')};});
async function recover(){for(let i=0;i<4&&await page.locator('dialog[open]').count();i++){await page.keyboard.press('Escape').catch(()=>{});await page.waitForTimeout(200);const dialog=page.locator('dialog[open]').last();if(await dialog.count()){const close=dialog.getByRole('button',{name:/^(close|cancel|done|×|keep.*)$/i}).first();if(await close.count())await close.click({timeout:1500}).catch(()=>{});else await dialog.locator('button').first().click({timeout:1500}).catch(()=>{});}}
 await page.getByRole('button',{name:'Home',exact:true}).first().click({timeout:4000}).catch(()=>{});await page.waitForTimeout(300);const home=await page.getByRole('heading',{name:'What would you like to do?'}).isVisible().catch(()=>false);if(!home){const back=page.getByRole('button',{name:'Back to Home'});if(await back.count())await back.click({timeout:3000}).catch(()=>{});await page.waitForTimeout(400);}
 return page.getByRole('heading',{name:'What would you like to do?'}).isVisible().catch(()=>false);}
async function probe(source,title,click){
 const started=Date.now();errors=[];const files=fileFor(title);await app.evaluate((_electron,files)=>{global.pdfixSmoke.files=files;global.pdfixSmoke.boxes=[];global.pdfixSmoke.dialogs=[];},files);const before=await snapshot();let clickError='';
 try{await click();}catch(error){clickError=error.message.split('\n')[0].slice(0,160);}
 let after=before;for(let i=0;i<10;i++){await page.waitForTimeout(600);after=await snapshot().catch(()=>after);if(after.toastError||after.ready&&after.title||after.dialogs.length&&i>=2||i>=4&&(after.heading!==before.heading||after.mainClasses!==before.mainClasses))break;}
 const native=await app.evaluate(()=>({boxes:global.pdfixSmoke.boxes,dialogs:global.pdfixSmoke.dialogs})).catch(()=>({boxes:[],dialogs:[]}));
 const changed=after.dialogs.length||after.heading!==before.heading||after.mainClasses!==before.mainClasses||after.title!==before.title||after.workView!==before.workView;
 const outcome=clickError?'could not click':errors.some(error=>error.startsWith('pageerror'))?'renderer error':after.toastError?'error message':changed?'opens':native.dialogs.length||native.boxes.length?'asks, then nothing (canceled or needs input)':after.toast?'message only':'nothing visible';
 const shot=(source+'-'+title).toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,60)+'.png';if(outcome!=='opens')await page.screenshot({path:path.join(output,shot)}).catch(()=>{});
 const recovered=await recover().catch(()=>false);const entry={source,title,fixture:files?files.map(file=>path.basename(file)).join(' + '):'none (no fixture of this type)',outcome,toast:after.toast,screen:after.dialogs[0]??(after.title?'document: '+after.title:after.heading),native:[...native.dialogs,...native.boxes.map(box=>'box: '+box)].slice(0,4),errors:errors.slice(0,3),clickError,backHome:recovered,ms:Date.now()-started};report.results.push(entry);
 console.error((outcome.padEnd(22))+' '+source+' › '+title+(after.toast&&outcome!=='opens'?'  — '+after.toast.slice(0,110):''));
 if(!recovered){report.restarts++;await quit();await launch();}
}
try{
 await launch();
 await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).first().click();const tools=[];for(const room of groups){await page.getByRole('tablist',{name:'Tool groups'}).getByRole('tab',{name:room,exact:true}).click();for(const title of await page.locator('.workspace-room-grid button h2').allTextContents())tools.push([room,title]);}
 await page.getByRole('button',{name:'Home',exact:true}).first().click();const quick=await page.locator('.task-grid .task-card b').allTextContents();report.counts={workspaceTools:tools.length,homeQuickActions:quick.length};
 // SMOKE_FROM=n skips the first n entries, for continuing a long survey in a second run.
 const skip=Number(process.env.SMOKE_FROM??0);let position=0;const wanted=()=>position++>=skip;
 for(const [room,title] of tools)if(wanted())await probe('All tools/'+room,title,async()=>{await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).first().click();await page.getByRole('tablist',{name:'Tool groups'}).getByRole('tab',{name:room,exact:true}).click();await page.locator('.workspace-room-grid button').filter({has:page.locator('h2',{hasText:new RegExp('^'+title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')})}).first().click({timeout:5000});});
 for(const title of quick)if(wanted())await probe('Home',title,async()=>{await page.locator('.task-grid .task-card').filter({has:page.locator('b',{hasText:new RegExp('^'+title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')})}).first().click({timeout:5000});});
}catch(error){report.error=error.message.slice(0,400);}
finally{await quit();await fs.rm(work,{recursive:true,force:true}).catch(()=>{});}
const tally={};for(const item of report.results)tally[item.outcome]=(tally[item.outcome]??0)+1;report.tally=tally;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,counts:report.counts,tally,restarts:report.restarts,error:report.error,notOpening:report.results.filter(item=>item.outcome!=='opens').map(item=>({where:item.source+' › '+item.title,outcome:item.outcome,fixture:item.fixture,toast:item.toast,native:item.native,errors:item.errors,clickError:item.clickError}))},null,1));process.exit(0);
