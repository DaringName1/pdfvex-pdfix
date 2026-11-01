// Hidden, basic accessibility audit of Home and the document editor (every ribbon tab, Version history, PDF export,
// the replace-original prompt). Checks: every visible button, field, list and link has an accessible name; images
// have alt text; ids are unique; Tab reaches the ribbon and the page with a visible focus outline. Not a full WCAG
// audit: contrast, screen-reader announcements and reading order are not measured.
import {_electron as electron} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {randomUUID} from 'node:crypto';
const output=path.resolve('tmp/accessibility-basics-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-A11y-')),work=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-A11yFiles-'));await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,screens:{},failures:[],errors:[]};
// A Word-style file (no PDFix snapshot), so Save shows the replace prompt.
const docx=path.join(work,'Sample.docx');{const lib=await import('docx');await fs.writeFile(docx,await lib.Packer.toBuffer(new lib.Document({sections:[{children:[new lib.Paragraph('Sample text for the audit.')]}]})));}
let app,page,appPid;
// Name computation close enough for an audit: aria-labelledby, aria-label, a wrapping or for= label, text, title, alt, placeholder.
const audit=()=>page.evaluate(()=>{
 const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!el.closest('[hidden],[inert]');};
 const name=el=>{const by=el.getAttribute('aria-labelledby');if(by)return by.split(/\s+/).map(id=>document.getElementById(id)?.textContent??'').join(' ').trim();const label=el.getAttribute('aria-label');if(label)return label.trim();if(el.id){const l=document.querySelector(`label[for="${CSS.escape(el.id)}"]`);if(l?.textContent.trim())return l.textContent.trim();}const wrap=el.closest('label');if(wrap&&wrap!==el){const t=wrap.textContent.replace(el.textContent??'','').trim();if(t)return t;}if(el.tagName==='INPUT'&&['button','submit'].includes(el.type))return el.value;const text=el.textContent?.trim();if(text&&!['SELECT','TEXTAREA','INPUT'].includes(el.tagName))return text;return (el.getAttribute('title')||el.getAttribute('alt')||el.getAttribute('placeholder')||'').trim();};
 const unnamed=[...document.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=tab],[role=checkbox],[role=menuitem],[role=textbox]')].filter(visible).filter(el=>!name(el)).map(el=>el.outerHTML.slice(0,160));
 const images=[...document.querySelectorAll('img')].filter(visible).filter(el=>!el.hasAttribute('alt')).map(el=>el.outerHTML.slice(0,120));
 const ids=[...document.querySelectorAll('[id]')].map(el=>el.id),duplicates=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
 return {controls:document.querySelectorAll('button,a[href],input,select,textarea').length,unnamed,images,duplicates};});
const record=async label=>{report.lastStep=label;const result=await audit();report.screens[label]={controls:result.controls,unnamed:result.unnamed.length,images:result.images.length,duplicates:result.duplicates};if(result.unnamed.length||result.images.length||result.duplicates.length)report.failures.push({screen:label,unnamed:result.unnamed.slice(0,8),images:result.images.slice(0,4),duplicates:result.duplicates.slice(0,8)});};
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});appPid=app.process().pid;app.on('close',()=>{report.appClosedAt=report.lastStep??'start';});page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');await page.waitForTimeout(800);
 await record('Home');
 await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},docx);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});
 for(const tab of ['File','Home','Insert','Layout','Review']){await page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name:tab,exact:true}).click();await page.waitForTimeout(200);await page.evaluate(()=>document.querySelectorAll('.document-ribbon details').forEach(d=>{d.open=true;}));await page.waitForTimeout(200);await record('Editor '+tab);}
 await page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name:'File',exact:true}).click();await page.getByRole('button',{name:'Version history',exact:true}).click();await page.locator('dialog.version-history[open]').waitFor();await page.waitForTimeout(400);await record('Version history');await page.getByRole('button',{name:'Close version history'}).click();
 await page.getByRole('button',{name:'Export PDF',exact:true}).click();await page.locator('.document-pdf-export[open]').waitFor();await record('PDF export');await page.getByRole('button',{name:'Close PDF export',exact:true}).click();
 await page.getByRole('textbox',{name:'Editable document'}).press('Control+End');await page.getByRole('textbox',{name:'Editable document'}).pressSequentially(' x');await page.waitForTimeout(500);await page.getByRole('button',{name:'Save',exact:true}).click();await page.locator('dialog.replace-original[open]').waitFor();await record('Replace prompt');await page.locator('dialog.replace-original').getByRole('button',{name:'Cancel',exact:true}).click();
 // Keyboard: from Save, Tab moves forward through the ribbon controls with a visible outline. The editing area shows
 // its text caret instead of an outline, as text fields do, so it is not counted as missing a focus ring.
 await page.getByRole('button',{name:'Save',exact:true}).focus();const stops=[];
 for(let i=0;i<25;i++){await page.keyboard.press('Tab');const stop=await page.evaluate(()=>{const el=document.activeElement,s=getComputedStyle(el);return {tag:el.tagName,label:(el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,30),outline:s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0||s.boxShadow!=='none'};});stops.push(stop);}
 report.tabStops=stops.map(stop=>stop.tag+':'+stop.label+(stop.outline?'':' (NO FOCUS RING)'));const hidden=stops.filter(stop=>!stop.outline&&stop.tag!=='BODY'&&stop.label!=='Editable document');if(hidden.length)report.failures.push({screen:'Keyboard focus',noRing:hidden.slice(0,8)});
}catch(error){report.error=error.message;}
finally{if(app){const pid=appPid;await Promise.race([app.close().catch(()=>{}),new Promise(r=>setTimeout(r,15000))]);try{process.kill(pid);}catch{}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});await fs.rm(work,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,screens:report.screens,failures:report.failures,tabStops:report.tabStops,errors:report.errors.slice(0,3),error:report.error},null,1));process.exit(report.pass?0:1);
