// Hidden sweep: open each tool in the Documents and More tools rooms (a sample PDF answers any file picker), then
// quit. Every tool should either close with the app or say why it cannot within a few seconds; none should hang.
// Tools are only opened, not used; a tool that is mid-job when quitting is not exercised here.
import {_electron as electron} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {randomUUID} from 'node:crypto';
const groups=(await import('../src/tool-registry.js')).TOOL_GROUPS.map(group=>group.name).sort((a,b)=>(b==='Create')-(a==='Create'));
const output=path.resolve('tmp/tools-quit-'+randomUUID());await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,results:[],failures:[]};
const only=process.argv.slice(2);
async function launch(){const profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Quit-')),work=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-QuitFiles-')),sample=path.join(work,'Sample.pdf');await fs.copyFile('tests/fixtures/reading-sample.pdf',sample);
 const app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000}),page=await app.firstWindow();await page.waitForLoadState('domcontentloaded');
 await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});dialog.showSaveDialog=async()=>({canceled:true});dialog.showMessageBox=async()=>({response:0});},sample);return {app,page,profile,work};}
async function tiles(page,room){await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).first().click();await page.getByRole('tab',{name:room,exact:true}).click();return page.locator('.workspace-room-grid button h2').allTextContents();}
let names=[];{const {app,page,profile,work}=await launch();for(const room of groups)for(const title of await tiles(page,room))names.push([room,title]);await app.close().catch(()=>{});await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});await fs.rm(work,{recursive:true,force:true}).catch(()=>{});}
if(only.length)names=names.filter(([,title])=>only.includes(title));
for(const [room,title] of names){
 const {app,page,profile,work}=await launch(),result={room,title};const errors=[];page.on('pageerror',error=>errors.push(error.message));
 try{
  await tiles(page,room);await page.locator('.workspace-room-grid button').filter({has:page.locator('h2',{hasText:title})}).first().click();await page.waitForTimeout(3000);
  result.opened=(await page.locator('dialog[open] h2, .document-title b, main h1').first().textContent({timeout:2000}).catch(()=>''))?.trim().slice(0,80);
  const pid=app.process().pid,started=Date.now();result.close=await Promise.race([app.close().then(()=>'closed',()=>'closed'),new Promise(resolve=>setTimeout(()=>resolve('timeout'),12000))]);result.seconds=Math.round((Date.now()-started)/100)/10;
  if(result.close==='timeout'){result.toast=(await page.locator('#toast').textContent({timeout:1000}).catch(()=>''))?.slice(0,200);await page.screenshot({path:path.join(output,title.replace(/[^a-z0-9]+/gi,'-')+'.png')}).catch(()=>{});try{process.kill(pid);}catch{}}
 }catch(error){result.error=error.message.slice(0,200);try{await Promise.race([app.close(),new Promise(r=>setTimeout(r,8000))]);}catch{}try{process.kill(app.process().pid);}catch{}}
 if(errors.length)result.pageErrors=errors.slice(0,3);report.results.push(result);if(result.close!=='closed'||result.error||errors.length)report.failures.push(result);
 console.log(JSON.stringify(result));
 await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});await fs.rm(work,{recursive:true,force:true}).catch(()=>{});
}
report.pass=!report.failures.length;await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,failures:report.failures.length,total:report.results.length}));process.exit(report.pass?0:1);
