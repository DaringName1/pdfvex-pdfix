// Explicit real-app close controls for the four A3 smoke-walk findings.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';
import {closeReaderApp} from '../tests/helpers/reader-desktop.mjs';
const output=await fs.mkdtemp(path.resolve('tmp/reader-tool-exits-'));
const source=path.resolve(process.argv[2]||process.env.PDFIX_PRIVATE_DRAWING||'');
const hash=async()=>createHash('sha256').update(await fs.readFile(source)).digest('hex');
const report={at:new Date().toISOString(),output,source,sourceSha256:await hash(),scope:'Explicit named controls in hidden built Electron on supplied drawing; exit/navigation acceptance, not output/interop certification',checks:[]};
for(const [room,title,selector] of [['Drawing','Drawing sheet sets','.sheet-set-workspace'],['Drawing','Review drawing comments','.pdf-review-panel'],['Pages','Inspect and repair thin lines','.pdf-thin-line-workspace'],['Pages','Edit the PDF outline','.pdf-bookmark-workspace']]){
 let app,page;const record={title,errors:[]};let watchdog;
 try{
  app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(output,title.replaceAll(' ','-')),PDFIX_TEST_VISIBLE:'0'},timeout:30000});watchdog=setTimeout(()=>{try{app.process().kill();}catch{}},90000);
  page=await app.firstWindow();page.setDefaultTimeout(20000);page.on('pageerror',e=>record.errors.push(e.message));await page.waitForLoadState('domcontentloaded');
  await app.evaluate(({dialog},source)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[source]});},source);
  await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();await page.getByRole('searchbox',{name:'Find a tool across workspaces',exact:true}).fill(title);await page.locator('.workspace-room-grid button').filter({has:page.getByRole('heading',{name:title,exact:true})}).click();
  const tool=page.locator(selector);await expect(tool).toBeVisible();record.opened=true;
  if(title==='Drawing sheet sets'){
   await expect(tool.locator('.sheet-set-status')).toContainText('arrangement created',{timeout:30000});
   await tool.getByRole('button',{name:'Close',exact:true}).click();await expect(tool.getByRole('button',{name:'Discard unsaved set and close',exact:true})).toBeVisible();record.unsavedReviewShown=true;
   await tool.getByRole('button',{name:'Discard unsaved set and close',exact:true}).click();await expect(tool).toHaveCount(0);
  }else if(title==='Review drawing comments'){
   await expect(tool.getByRole('button',{name:'Inspect source comments',exact:true})).toBeEnabled({timeout:30000});record.status=await tool.locator('.pdf-review-status').textContent();
   await tool.getByRole('button',{name:'Collapse',exact:true}).click();await expect(tool).not.toBeVisible();
  }else{
   await expect(tool.getByRole('button',{name:title.includes('thin')?'Inspect strokes':'Add top-level section',exact:true})).toBeEnabled({timeout:30000});
   await expect(tool.getByRole('button',{name:'Close',exact:true})).toBeEnabled({timeout:30000});
   record.status=await tool.locator(title.includes('thin')?'.thin-line-status':'.bookmark-status').textContent();
   await tool.getByRole('button',{name:'Close',exact:true}).click();await expect(tool).toHaveCount(0);
  }
  await page.getByRole('button',{name:'Back to Home',exact:true}).click();await expect(page.getByRole('button',{name:'Open a file',exact:true})).toBeVisible();record.returnedHome=true;
  record.originalUnchanged=await hash()===report.sourceSha256;record.pass=record.originalUnchanged&&!record.errors.length;
 }catch(error){record.pass=false;record.error=error.message;try{record.toast=await page.locator('#toast').textContent();await page.screenshot({path:path.join(output,title.replaceAll(' ','-')+'.png')});}catch{}}
 finally{clearTimeout(watchdog);try{await closeReaderApp(app);record.closed=true;}catch(e){record.pass=false;record.closeError=e.message;}}
 report.checks.push(record);
}
report.pass=report.checks.every(c=>c.pass);await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));process.exitCode=report.pass?0:1;
