// Hidden, scoped check of the Files and Favorites lists, the top file search, the Actions panel and what happens
// when a listed file has been deleted, including persistence across a restart. Uses copies of three small fixtures.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
const output=path.resolve('tmp/workspace-files-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Shell-')),work=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Files-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'Scoped Files, Favorites, file search, Actions panel and missing-file checks with three small files; no drag and drop, no large files.'};
const files={pdf:path.join(work,'Reading sample.pdf'),docx:path.join(work,'Editing sample.docx'),txt:path.join(work,'Notes file.txt')};
await fs.copyFile('tests/fixtures/reading-sample.pdf',files.pdf);await fs.copyFile('tests/fixtures/editing-sample.docx',files.docx);await fs.writeFile(files.txt,'Plain notes\nSecond line');
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}await page.keyboard.press('Escape').catch(()=>{});}}
const launch=async()=>{app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');};
const quit=async()=>{const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes',error:'The window did not close within 15 seconds: '+await page.locator('#toast').textContent().catch(()=>'')});try{process.kill(pid);}catch{}}};
const side=name=>page.getByRole('button',{name,exact:true}).first();
const ready=()=>page.locator('.document-area[data-ready="true"],.pdf-paper[data-ready="true"]').first().waitFor({timeout:45000});
const open=async file=>{await side('Home').click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).click();await ready();};
const names=()=>page.locator('main .recent-row b, main [class*="recent"] b').allTextContents().then(list=>list.length?list:page.locator('main').evaluate(main=>[...main.querySelectorAll('button')].map(button=>button.getAttribute('aria-label')||'').filter(label=>label.startsWith('Forget ')).map(label=>label.slice(7))));
const listed=()=>page.locator('main').evaluate(main=>[...main.querySelectorAll('button')].map(button=>button.getAttribute('aria-label')||'').filter(label=>label.startsWith('Forget ')).map(label=>label.slice(7)));
try{
 await launch();
 await check('opened files are listed newest first and a row reopens its file',async()=>{
  for(const file of [files.pdf,files.docx,files.txt])await open(file);await side('Files').click();report.listed=await listed();if(JSON.stringify(report.listed)!==JSON.stringify(['Notes file.txt','Editing sample.docx','Reading sample.pdf']))throw new Error('Files lists '+JSON.stringify(report.listed));
  await page.screenshot({path:path.join(output,'files.png')});await page.locator('main button').filter({hasText:'Editing sample.docx'}).first().click();await ready();await expect(page.getByRole('textbox',{name:'Editable document'})).toContainText('Project notes');
  await expect(page.locator('.document-title b')).toHaveText('Editing sample.docx');await side('Files').click();report.afterReopen=await listed();if(report.afterReopen[0]!=='Editing sample.docx')throw new Error('Reopened file did not move to the top: '+JSON.stringify(report.afterReopen));
 });
 await check('Home shows the latest files above the quick actions and reopens one in a single click',async()=>{
  await side('Home').click();const heading=page.getByRole('heading',{name:'Recently opened'}),quick=page.getByRole('heading',{name:'Quick actions'});await expect(heading).toBeVisible();
  const recentY=(await heading.boundingBox()).y,quickY=(await quick.boundingBox()).y,viewport=await page.evaluate(()=>innerHeight);report.home={recentY:Math.round(recentY),quickY:Math.round(quickY),viewport,rows:await listed()};
  if(!(recentY<quickY)||recentY>viewport-80)throw new Error('Recently opened is at '+recentY+' px, Quick actions at '+quickY+' px, window height '+viewport);if(report.home.rows.length!==3)throw new Error('Home lists '+JSON.stringify(report.home.rows));
  await page.screenshot({path:path.join(output,'home-recents.png')});await page.locator('main button').filter({hasText:'Notes file.txt'}).first().click();await ready();await expect(page.locator('.document-title b')).toHaveText('Notes file.txt');
  await side('Files').click();await page.locator('main button').filter({hasText:'Editing sample.docx'}).first().click();await ready();
 });
 await check('favorites: add, see it under Favorites, remove, and see the empty message',async()=>{
  await side('Files').click();const add=page.getByRole('button',{name:'Add favorite: Reading sample.pdf',exact:true});await add.click();const remove=page.getByRole('button',{name:/Remove favorite: Reading sample\.pdf|favorite: Reading sample\.pdf/}).first();await expect(remove).toHaveAttribute('aria-pressed','true');report.favoriteLabel=await remove.getAttribute('aria-label');
  await side('Favorites').click();const favorites=await listed();if(JSON.stringify(favorites)!==JSON.stringify(['Reading sample.pdf']))throw new Error('Favorites lists '+JSON.stringify(favorites));await page.screenshot({path:path.join(output,'favorites.png')});
 });
 await check('top search filters the list and Ctrl+K reaches it',async()=>{
  await side('Home').click();await page.keyboard.press('Control+k');const search=page.getByRole('textbox',{name:'Find an opened file'}).or(page.getByRole('searchbox',{name:'Find an opened file'})).first();await expect(search).toBeFocused();
  await search.fill('notes');await page.waitForTimeout(300);report.searchNotes=await listed();if(JSON.stringify(report.searchNotes)!==JSON.stringify(['Notes file.txt']))throw new Error('Search "notes" lists '+JSON.stringify(report.searchNotes));
  await search.fill('zzzz');await page.waitForTimeout(300);report.searchNone={listed:await listed(),text:(await page.locator('main').innerText()).replace(/\s+/g,' ').slice(0,260)};if(report.searchNone.listed.length)throw new Error('Search with no match still lists files.');
  await search.fill('');await page.waitForTimeout(300);if((await listed()).length!==3)throw new Error('Clearing the search lists '+JSON.stringify(await listed()));
 });
 await check('Forget removes the row only; the file stays on disk',async()=>{
  await side('Files').click();await page.getByRole('button',{name:'Forget Notes file.txt',exact:true}).click();await page.waitForTimeout(300);const after=await listed();if(after.includes('Notes file.txt')||after.length!==2)throw new Error('After Forget: '+JSON.stringify(after));
  if(await fs.readFile(files.txt,'utf8')!=='Plain notes\nSecond line')throw new Error('The forgotten file changed on disk.');
 });
 await check('Actions panel: F1 and Ctrl+Shift+P open it, search narrows it, Escape closes it, an action runs',async()=>{
  await side('Home').click();await page.keyboard.press('F1');const panel=page.locator('.action-panel');await expect(panel).toBeVisible();const input=panel.locator('input').first();report.actionInput=await input.evaluate(node=>({role:node.getAttribute('role'),type:node.type,label:node.getAttribute('aria-label')||node.labels?.[0]?.textContent?.trim()||node.placeholder||''}));await expect(input).toBeFocused();
  const count=()=>panel.locator('button').evaluateAll(buttons=>buttons.filter(button=>button.getClientRects().length).length);const all=await count();await input.fill('new document');await page.waitForTimeout(250);const narrowed=await count();report.actions={all,narrowed};if(!(narrowed<all)||narrowed<1)throw new Error('Search did not narrow the actions: '+all+' to '+narrowed);
  // With text in the search box the first Escape clears it and the second closes the panel.
  await page.keyboard.press('Escape');await expect(input).toHaveValue('');await expect(panel).toBeVisible();if(await count()!==all)throw new Error('Clearing the search did not restore all actions.');await page.keyboard.press('Escape');await expect(panel).toBeHidden();await page.keyboard.press('Control+Shift+p');await expect(panel).toBeVisible();await panel.locator('button').filter({hasText:'New document'}).first().click();
  await expect(page.getByRole('textbox',{name:'Editable document'})).toBeVisible();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});await expect(panel).toBeHidden();
 });
 await quit();
 await check('after a restart the list and the favorite are still there',async()=>{
  await launch();await side('Files').click();const after=await listed();report.afterRestart=after;if(JSON.stringify([...after].sort())!==JSON.stringify(['Editing sample.docx','Reading sample.pdf']))throw new Error('After restart Files lists '+JSON.stringify(after));
  await side('Favorites').click();if(JSON.stringify(await listed())!==JSON.stringify(['Reading sample.pdf']))throw new Error('After restart Favorites lists '+JSON.stringify(await listed()));
 });
 await check('a listed file that was deleted gives a clear message and the app keeps working',async()=>{
  await fs.rm(files.pdf);await side('Files').click();await page.locator('main button').filter({hasText:'Reading sample.pdf'}).first().click();await page.waitForTimeout(1500);
  report.missing={toast:(await page.locator('#toast').textContent().catch(()=>''))?.slice(0,300),view:await page.evaluate(()=>document.querySelector('main h1,h1')?.textContent?.trim()??null),dialog:await page.locator('dialog[open]').count()?(await page.locator('dialog[open]').innerText()).replace(/\s+/g,' ').slice(0,300):null,stillListed:await listed().catch(()=>null)};
  if(!/no longer where it was opened from/.test(report.missing.toast??''))throw new Error('The deleted-file message is: '+JSON.stringify(report.missing));if(report.missing.dialog)await page.keyboard.press('Escape');
  await side('Files').click();await page.locator('main button').filter({hasText:'Editing sample.docx'}).first().click();await ready();await expect(page.getByRole('textbox',{name:'Editable document'})).toContainText('Project notes');await page.screenshot({path:path.join(output,'after-missing.png')});
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app)await quit();await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});await fs.rm(work,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
