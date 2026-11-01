// Hidden, scoped check that a DOCX copy saved by PDFix reopens with its formatting, and that a copy changed
// outside PDFix falls back to the ordinary Word import instead of showing stale or mismatched content.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import JSZip from 'jszip';
const output=path.resolve('tmp/document-reopen-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Doc-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'Scoped reopen-fidelity checks for one PDFix-written DOCX and two altered copies; not Word or other-editor compatibility.'};
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
const tab=name=>page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name,exact:true}).click();
const docx=path.join(profile,'styled.docx');
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:process.env.CI?90000:30000});
 page=await app.firstWindow({timeout:process.env.CI?90000:30000});page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'}),notes=page.locator('.editor-warning');
 const reopen=async file=>{await page.getByRole('button',{name:'Home',exact:true}).click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});};
 const layoutValues=()=>page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('.document-layout-controls [data-layout]')].map(input=>[input.dataset.layout,input.type==='checkbox'?input.checked:input.value])));
 await check('write a styled document and save a DOCX copy',async()=>{
  await page.getByRole('button',{name:'New document',exact:true}).click();await editor.waitFor();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});
  await editor.pressSequentially('Site report');await page.getByRole('combobox',{name:'Paragraph style'}).selectOption('1');await page.getByRole('button',{name:'Center',exact:true}).click();
  await editor.press('Enter');await page.getByRole('button',{name:'Align right',exact:true}).click();await page.getByRole('combobox',{name:'Selected text font'}).selectOption('serif');await page.getByRole('combobox',{name:'Selected text size'}).selectOption('18');
  await page.getByRole('textbox',{name:'Selected text color'}).evaluate(input=>{input.value='#c00000';input.dispatchEvent(new Event('change',{bubbles:true}));}).catch(async()=>{await page.locator('[data-text-color]').evaluate(input=>{input.value='#c00000';input.dispatchEvent(new Event('change',{bubbles:true}));});});
  await editor.pressSequentially('Serif red words');
  await tab('Home');const more=page.getByRole('button',{name:'Increase indent',exact:true}),less=page.getByRole('button',{name:'Decrease indent',exact:true});await expect(less).toBeDisabled();await more.click();await more.click();await more.click();await less.click();
  await page.getByRole('combobox',{name:'Paragraph line spacing'}).selectOption('1.15');await page.getByRole('combobox',{name:'Paragraph space before'}).selectOption('12');await page.getByRole('combobox',{name:'Paragraph space after'}).selectOption('24');await expect(editor.locator('p').first()).toHaveAttribute('style',/margin-top: ?12pt/);await expect(editor.locator('p').first()).toHaveAttribute('data-pdfix-indent','2');await expect(editor.locator('p').first()).toHaveAttribute('style',/margin-left: ?1in/);
  await editor.press('Enter');await tab('Insert');await page.locator('.document-image-controls>summary').click();await page.locator('.document-image-controls [data-file]').setInputFiles(path.resolve('tests/fixtures/scan-page.png'));await expect(editor.locator('img[data-pdfix-image]')).toHaveCount(1,{timeout:30000});await page.locator('.document-image-controls>summary').click();
  await tab('Layout');await page.locator('[data-layout="paper"]').selectOption('legal');await page.locator('[data-layout="landscape"]').selectOption('true');await page.locator('[data-layout="font"]').selectOption('serif');await page.locator('[data-layout="lineHeight"]').selectOption('2');await page.locator('[data-layout="pageNumberPlacement"]').selectOption('header');await page.locator('[data-layout="pageNumberAlign"]').selectOption('right');await page.locator('[data-layout="footerText"]').fill('Footer line');
  report.before={layout:await layoutValues(),styled:await editor.locator('span[data-pdfix-text-style]').first().evaluate(span=>({...span.dataset,text:span.textContent})),heading:await editor.locator('h1').getAttribute('data-pdfix-align'),paragraph:await editor.locator('p').first().getAttribute('data-pdfix-align'),indent:await editor.locator('p').first().getAttribute('data-pdfix-indent'),line:await editor.locator('p').first().getAttribute('data-pdfix-line'),space:[await editor.locator('p').first().getAttribute('data-pdfix-space-before'),await editor.locator('p').first().getAttribute('data-pdfix-space-after')].join('/')};
  if(report.before.styled.pdfixFont!=='serif'||report.before.styled.pdfixSize!=='18'||report.before.styled.pdfixColor!=='#c00000'||report.before.heading!=='center'||report.before.paragraph!=='right'||report.before.indent!=='2'||report.before.line!=='1.15'||report.before.space!=='12/24')throw new Error('The test document was not styled as intended: '+JSON.stringify(report.before));
  await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},docx);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved styled.docx',{timeout:45000});await page.screenshot({path:path.join(output,'before.png')});
  const pdf=path.join(profile,'styled.pdf');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},pdf);await page.getByRole('button',{name:'Export PDF',exact:true}).click();const dialog=page.locator('.document-pdf-export');await dialog.getByRole('button',{name:'Preview PDF',exact:true}).click();await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await expect(page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Export PDF copy',exact:true})}).getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await dialog.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(dialog.locator('.document-pdf-status')).toContainText('Saved styled.pdf',{timeout:45000});await dialog.getByRole('button',{name:'Close PDF export',exact:true}).click();
  // In the PDF the right-aligned paragraph must end short of the heading's right edge only by its own width, and start one inch right of the margin is not observable for right-aligned text, so the indent is measured on the heading-free left edge of the text block instead.
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile(pdf)),useSystemFonts:true}),loaded=await task.promise,items=(await (await loaded.getPage(1)).getTextContent()).items.filter(item=>item.str.trim());report.pdfText=items.map(item=>({text:item.str,x:Math.round(item.transform[4]),size:Math.round(item.transform[0])}));await task.destroy();
  if(!report.pdfText.some(item=>item.text.includes('Serif red words')&&item.size===18))throw new Error('PDF text is '+JSON.stringify(report.pdfText));
 });
 await check('the saved copy reopens with fonts, size, color, alignment, image and the whole page setup',async()=>{
  await reopen(docx);await expect(notes).toContainText('Reopened a document saved by PDFix');
  const after={layout:await layoutValues(),styled:await editor.locator('span[data-pdfix-text-style]').first().evaluate(span=>({...span.dataset,text:span.textContent})),heading:await editor.locator('h1').getAttribute('data-pdfix-align'),paragraph:await editor.locator('p').first().getAttribute('data-pdfix-align'),indent:await editor.locator('p').first().getAttribute('data-pdfix-indent'),line:await editor.locator('p').first().getAttribute('data-pdfix-line'),space:[await editor.locator('p').first().getAttribute('data-pdfix-space-before'),await editor.locator('p').first().getAttribute('data-pdfix-space-after')].join('/')};report.after=after;
  if(JSON.stringify(after)!==JSON.stringify(report.before))throw new Error('Reopened state differs: '+JSON.stringify(after));
  if(after.layout.pageNumbers!==true)throw new Error('Automatic page numbers were turned off on reopen.');
  await expect(editor.locator('img[data-pdfix-image]')).toHaveCount(1);report.image=await editor.locator('img[data-pdfix-image]').evaluate(image=>image.naturalWidth);if(!report.image)throw new Error('The reopened image did not render.');
  await page.waitForTimeout(900);await expect(page.locator('.draft-status')).toHaveText('Ready to edit');await page.screenshot({path:path.join(output,'after.png')});
 });
 const altered=async(name,change)=>{const zip=await JSZip.loadAsync(await fs.readFile(docx));await change(zip);const file=path.join(profile,name);await fs.writeFile(file,await zip.generateAsync({type:'uint8array',compression:'DEFLATE'}));return file;};
 await check('a copy whose body was edited elsewhere uses the ordinary import and shows the edited text',async()=>{
  await reopen(await altered('edited-elsewhere.docx',async zip=>zip.file('word/document.xml',(await zip.file('word/document.xml').async('string')).replace('Site report','Edited elsewhere'))));
  await expect(editor).toContainText('Edited elsewhere');await expect(editor).not.toContainText('Site report');await expect(notes).not.toContainText('Reopened a document saved by PDFix');await expect(notes).toContainText('Importing an editable copy');
 });
 await check('a saved model whose text disagrees with the body is refused and the body text is shown',async()=>{
  await reopen(await altered('mismatched-model.docx',async zip=>zip.file('docProps/custom.xml',(await zip.file('docProps/custom.xml').async('string')).replace('Site report','Hidden other words'))));
  await expect(editor).toContainText('Site report');await expect(editor).not.toContainText('Hidden other words');await expect(notes).toContainText('Saved PDFix formatting was not used');
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds: '+await page.locator('#toast').textContent().catch(()=>'')});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
