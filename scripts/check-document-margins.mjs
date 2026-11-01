// Hidden, scoped check of separate page margins: turn on "Each side" in the Layout tab, set four values, see the
// sheet follow, save DOCX and PDF copies (measuring the PDF text position) and reopen the DOCX with the same margins.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import JSZip from 'jszip';
const output=path.resolve('tmp/document-margins-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Margins-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'A4 portrait with one paragraph. Header/footer bands with separate margins, RTF reopen and DOCX files with unequal margins made in Word were not exercised.'};
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'}),tab=name=>page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name,exact:true}).click();
 const side=name=>page.getByRole('spinbutton',{name:name+' margin (mm)',exact:true}),docx=path.join(profile,'margins.docx'),pdf=path.join(profile,'margins.pdf');
 await check('Each side shows four margins, starting from the single margin, and the sheet follows them',async()=>{
  await page.getByRole('button',{name:'New document',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});await editor.pressSequentially('Left edge marker text');
  await tab('Layout');const details=page.locator('.document-layout-controls');if(await details.evaluate(d=>d.tagName==='DETAILS'&&!d.open))await details.locator('summary').click();
  await expect(side('Top')).toBeHidden();await page.getByRole('checkbox',{name:'Each side'}).check();for(const name of ['Top','Right','Bottom','Left'])await expect(side(name)).toHaveValue('20');await expect(page.locator('[data-layout="margin"]')).toBeDisabled();
  for(const [name,value] of [['Top','15'],['Right','10'],['Bottom','30'],['Left','40']]){await side(name).fill(value);await side(name).press('Tab');}
  report.sheetPadding=await page.locator('.editor-page').evaluate(el=>{const s=getComputedStyle(el),mm=v=>Math.round(parseFloat(v)/96*25.4);return [s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft].map(mm);});
  if(JSON.stringify(report.sheetPadding)!=='[15,10,30,40]')throw new Error('Sheet padding in mm: '+JSON.stringify(report.sheetPadding));
  await side('Left').fill('3');await side('Left').press('Tab');await expect(page.locator('#toast')).toContainText('5 to 50 mm');await expect(side('Left')).toHaveValue('40');
  await page.screenshot({path:path.join(output,'layout.png')});
 });
 await check('the DOCX copy has the four margins and reopens with them',async()=>{
  await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},docx);await tab('File');await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved margins.docx',{timeout:45000});
  const xml=await (await JSZip.loadAsync(await fs.readFile(docx))).file('word/document.xml').async('string');report.pgMar=xml.match(/<w:pgMar [^>]*>/)?.[0];const twips=mm=>Math.round(mm*1440/25.4);
  for(const [name,mm] of [['top',15],['right',10],['bottom',30],['left',40]])if(!new RegExp('w:'+name+'="'+twips(mm)+'"').test(report.pgMar??''))throw new Error('pgMar is '+report.pgMar);
  await page.getByRole('button',{name:'Home',exact:true}).first().click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},docx);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});
  await tab('Layout');const details=page.locator('.document-layout-controls');if(await details.evaluate(d=>d.tagName==='DETAILS'&&!d.open))await details.locator('summary').click();
  await expect(page.getByRole('checkbox',{name:'Each side'})).toBeChecked();await expect(side('Left')).toHaveValue('40');await expect(side('Bottom')).toHaveValue('30');
 });
 await check('the PDF copy starts the text at the left margin',async()=>{
  await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},pdf);await page.getByRole('button',{name:'Export PDF',exact:true}).click();const dialog=page.locator('.document-pdf-export');
  await expect(dialog.locator('[data-setting="margin"]')).toBeDisabled();await dialog.getByRole('button',{name:'Preview PDF',exact:true}).click();await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await dialog.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(dialog.locator('.document-pdf-status')).toContainText('Saved margins.pdf',{timeout:45000});await dialog.getByRole('button',{name:'Close PDF export',exact:true}).click();
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile(pdf)),useSystemFonts:true}),loaded=await task.promise,pdfPage=await loaded.getPage(1),height=pdfPage.view[3],item=(await pdfPage.getTextContent()).items.find(entry=>entry.str.includes('Left edge'));await task.destroy();
  report.pdfText=item&&{xMm:Math.round(item.transform[4]/72*25.4),topMm:Math.round((height-item.transform[5])/72*25.4)};
  if(!item||Math.abs(report.pdfText.xMm-40)>1||report.pdfText.topMm<15||report.pdfText.topMm>25)throw new Error('PDF text position: '+JSON.stringify(report.pdfText));
 });
 await check('a custom paper size reaches the sheet, the PDF page and the DOCX copy',async()=>{
  await page.getByRole('button',{name:'Home',exact:true}).first().click();await page.getByRole('button',{name:'New document',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});await editor.pressSequentially('Custom paper text');
  await tab('Layout');const details=page.locator('.document-layout-controls');if(await details.evaluate(d=>d.tagName==='DETAILS'&&!d.open))await details.locator('summary').click();
  const width=page.getByRole('spinbutton',{name:'Width (mm)'}),height=page.getByRole('spinbutton',{name:'Height (mm)'});await expect(width).toBeHidden();await page.locator('[data-layout="paper"]').selectOption('custom');await expect(width).toHaveValue('210');await expect(height).toHaveValue('297');
  await width.fill('150');await width.press('Tab');await height.fill('200');await height.press('Tab');report.customSheetMm=await page.locator('.editor-page').evaluate(el=>Math.round(el.getBoundingClientRect().width/el.ownerDocument.defaultView.devicePixelRatio));
  const pdf2=path.join(profile,'custom.pdf');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},pdf2);await page.getByRole('button',{name:'Export PDF',exact:true}).click();const dialog=page.locator('.document-pdf-export');await expect(dialog.locator('[data-setting="paper"]')).toHaveValue('custom');await dialog.getByRole('button',{name:'Preview PDF',exact:true}).click();await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await dialog.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(dialog.locator('.document-pdf-status')).toContainText('Saved custom.pdf',{timeout:45000});await dialog.getByRole('button',{name:'Close PDF export',exact:true}).click();
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile(pdf2))}),loaded=await task.promise,view=(await loaded.getPage(1)).view;await task.destroy();report.customPdfMm=[Math.round(view[2]/72*25.4),Math.round(view[3]/72*25.4)];if(JSON.stringify(report.customPdfMm)!=='[150,200]')throw new Error('PDF page in mm: '+JSON.stringify(report.customPdfMm));
  const docx2=path.join(profile,'custom.docx');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},docx2);await tab('File');await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved custom.docx',{timeout:45000});
  await page.getByRole('button',{name:'Home',exact:true}).first().click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},docx2);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});
  await tab('Layout');if(await details.evaluate(d=>d.tagName==='DETAILS'&&!d.open))await details.locator('summary').click();await expect(page.locator('[data-layout="paper"]')).toHaveValue('custom');await expect(width).toHaveValue('150');await expect(height).toHaveValue('200');
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds.'});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
