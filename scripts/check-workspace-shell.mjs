// Hidden, scoped walk through the app shell: Home, Files, Favorites, All tools groups and search, Ask about files,
// Format support and Settings. Records garbled text, horizontal overflow, unnamed controls and renderer errors at
// two window sizes, and checks the All tools route into a new document and back.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
const groups=(await import('../src/tool-registry.js')).TOOL_GROUPS.map(group=>group.name).sort((a,b)=>(b==='Create')-(a==='Create'));
const output=path.resolve('tmp/workspace-shell-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Shell-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],screens:[],findings:[],errors:[],failures:[],scope:'Scoped shell walk-through with an empty profile; no files opened except one new document. Findings are observations for review, not all confirmed defects.'};
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
async function inspect(name){
 await page.waitForTimeout(250);const file=path.join(output,name+'.png');await page.screenshot({path:file});
 const data=await page.evaluate(()=>{
  const visible=node=>node.getClientRects().length&&!node.closest('[hidden]')&&getComputedStyle(node).visibility!=='hidden';
  const text=document.body.innerText,garbled=[...text.matchAll(/[ÂÃâ][\u0080-¿‘-›€™]{1,2}|�/g)].slice(0,8).map(match=>text.slice(Math.max(0,match.index-25),match.index+25).replace(/\s+/g,' '));
  const unnamed=[...document.querySelectorAll('button,input,select,textarea,a[href],[role=button],[role=tab]')].filter(node=>visible(node)&&node.type!=='hidden'&&!node.getAttribute('aria-label')&&!node.getAttribute('aria-labelledby')&&!node.textContent?.trim()&&!node.labels?.length&&!node.getAttribute('title')&&!node.getAttribute('placeholder')).slice(0,10).map(node=>node.tagName.toLowerCase()+'.'+String(node.className).slice(0,40));
  const clipped=[...document.querySelectorAll('button,h1,h2,h3,.sidebar a,.sidebar button')].filter(node=>visible(node)&&node.scrollWidth>node.clientWidth+2&&getComputedStyle(node).overflow!=='visible').slice(0,8).map(node=>node.textContent.trim().slice(0,40));
  const small=[...document.querySelectorAll('button,[role=tab],a[href]')].filter(node=>{if(!visible(node))return false;const box=node.getBoundingClientRect();return box.width<20||box.height<20;}).slice(0,8).map(node=>(node.getAttribute('aria-label')||node.textContent.trim()).slice(0,30)+' '+Math.round(node.getBoundingClientRect().width)+'x'+Math.round(node.getBoundingClientRect().height));
  return {width:innerWidth,height:innerHeight,overflowX:Math.max(0,document.documentElement.scrollWidth-innerWidth),heading:document.querySelector('main h1,h1')?.textContent?.trim().slice(0,60)??null,controls:[...document.querySelectorAll('button,input,select,textarea,[role=tab]')].filter(visible).length,garbled,unnamed,clipped,small,focusOutline:null};
 });
 report.screens.push({name,file,...data});
 for(const [kind,list] of [['garbled text',data.garbled],['control without a name',data.unnamed],['clipped label',data.clipped],['very small target',data.small]])for(const item of list)report.findings.push({screen:name,kind,item});
 if(data.overflowX>2)report.findings.push({screen:name,kind:'horizontal overflow',item:data.overflowX+' px at '+data.width+' wide'});
 return data;
}
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')report.errors.push('console: '+message.text().slice(0,300));});await page.waitForLoadState('domcontentloaded');
 const side=name=>page.getByRole('button',{name,exact:true}).first();
 report.sidebar=await page.evaluate(()=>[...document.querySelectorAll('nav button, .sidebar button, aside button')].filter(node=>node.getClientRects().length).map(node=>(node.getAttribute('aria-label')||node.textContent.trim()).slice(0,40)));
 for(const size of [[1280,800],[800,620]]){
  await app.evaluate(({BrowserWindow},[width,height])=>BrowserWindow.getAllWindows()[0].setSize(width,height),size);await page.waitForTimeout(300);const tag=size[0];
  await check('shell screens at '+size.join('x'),async()=>{
   await side('Home').click();await inspect('home-'+tag);
   for(const name of ['Files','Favorites','All tools','Ask about files','Format support','Settings & privacy']){const button=side(name);if(!(await button.count())||!(await button.isVisible())){report.findings.push({screen:name+'-'+tag,kind:'sidebar entry not reachable',item:name+' at '+size.join('x')});continue;}await button.click();await inspect(name.toLowerCase().replace(/[^a-z]+/g,'-')+'-'+tag);const dialog=page.locator('dialog[open]');if(await dialog.count()){report.findings.push({screen:name+'-'+tag,kind:'note',item:name+' opens a dialog'});await page.keyboard.press('Escape');await page.waitForTimeout(150);if(await dialog.count()){const close=dialog.getByRole('button',{name:/close|done|cancel/i}).first();if(await close.count())await close.click();}}}
  });
 }
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1280,800));await page.waitForTimeout(300);
 await check('All tools groups, keyboard tabs and search',async()=>{
  await side('All tools').click();const tabs=page.getByRole('tablist',{name:'Tool groups'});await expect(tabs).toBeVisible();report.rooms={};
  for(const room of groups){await tabs.getByRole('tab',{name:room,exact:true}).click();await expect(tabs.getByRole('tab',{name:room,exact:true})).toHaveAttribute('aria-selected','true');report.rooms[room]=await page.locator('.workspace-room-grid button h2').allTextContents();if(!report.rooms[room].length)throw new Error(room+' room is empty.');if(room==='Create'&&report.rooms[room][0]!=='New document')throw new Error('Create starts with '+JSON.stringify(report.rooms[room].slice(0,2)));await inspect('room-'+room.toLowerCase().replace(/\s+/g,'-'));}
  await tabs.getByRole('tab',{name:groups[0],exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(tabs.getByRole('tab',{name:groups[1],exact:true})).toBeFocused();await page.keyboard.press('End');await expect(tabs.getByRole('tab',{name:groups.at(-1),exact:true})).toBeFocused();
  const search=page.getByRole('searchbox',{name:'Find a tool across workspaces'});await search.fill('document');report.searchDocument=await page.locator('.workspace-room-grid button h2').allTextContents();if(!report.searchDocument.includes('New document'))throw new Error('Search for "document" did not list New document: '+JSON.stringify(report.searchDocument));
  await search.fill('zzzz-no-such-tool');await expect(page.locator('.workspace-room-empty')).toBeVisible();await inspect('room-search-empty');await search.fill('');
 });
 await check('All tools opens a new document and Back returns to where the user was',async()=>{
  await side('All tools').click();await page.getByRole('tablist',{name:'Tool groups'}).getByRole('tab',{name:'Create',exact:true}).click();await page.locator('.workspace-room-grid button').filter({hasText:'New document'}).click();
  await expect(page.getByRole('textbox',{name:'Editable document'})).toBeVisible();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});await inspect('editor-from-workspaces');
  await page.getByRole('button',{name:'Back to All tools'}).click();await page.waitForTimeout(300);report.afterBack=await page.evaluate(()=>({heading:document.querySelector('main h1,h1')?.textContent?.trim()??null,roomTabs:!!document.querySelector('[role=tablist][aria-label="Tool groups"]')}));await inspect('after-back');
 });
 await check('keyboard: Tab reaches the main actions on Home with a visible focus ring',async()=>{
  await side('Home').click();await page.evaluate(()=>{document.activeElement?.blur();getSelection().removeAllRanges();scrollTo(0,0);});const stops=[];
  for(let i=0;i<40;i++){await page.keyboard.press('Tab');stops.push(await page.evaluate(()=>{const node=document.activeElement,style=getComputedStyle(node);return {label:(node.getAttribute('aria-label')||node.textContent||node.tagName).trim().slice(0,30),ring:node===document.body||node===document.documentElement||style.outlineStyle!=='none'&&parseFloat(style.outlineWidth)>0||style.boxShadow!=='none'};}));}
  report.homeTabStops=stops;const labels=stops.map(stop=>stop.label);if(!labels.some(label=>/Open a file/.test(label))||!labels.some(label=>/New document/.test(label)))throw new Error('Tab did not reach Open a file and New document within 40 stops: '+JSON.stringify(labels));
  const noRing=stops.filter(stop=>!stop.ring).map(stop=>stop.label);for(const label of [...new Set(noRing)])report.findings.push({screen:'home',kind:'no visible focus ring',item:label});
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds.'});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,checks:report.checks,failures:report.failures,errors:report.errors,sidebar:report.sidebar,rooms:report.rooms,searchDocument:report.searchDocument,afterBack:report.afterBack,findings:report.findings,homeTabStops:report.homeTabStops?.map(stop=>stop.label+(stop.ring?'':' (no ring)')),screens:report.screens.map(screen=>screen.name+' '+screen.width+'x'+screen.height+' "'+screen.heading+'" controls '+screen.controls)},null,1));process.exit(report.pass?0:1);
