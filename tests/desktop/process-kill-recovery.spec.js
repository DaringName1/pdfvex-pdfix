import {test,expect,_electron as electron} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';import {execFileSync} from 'node:child_process';import mammoth from 'mammoth';
// V1 audit, area 4: the whole program ends suddenly (like a power cut or Task Manager) in the middle of saving.
// Afterwards there must be no half-written file presented as good, nothing temporary left beside the saved copy or
// the original, and the typed work must come back on the next start.
let app,page,root;const slow={timeout:process.env.CI?120000:60000};
test.describe.configure({timeout:process.env.CI?300000:150000});
async function launch(){app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}});page=await app.firstWindow({timeout:process.env.CI?90000:30000});await page.waitForLoadState('domcontentloaded');}
// Ends PDFix and every process it started, the way Windows does when power is lost or the task is ended.
function killAll(){const pid=app.process().pid;try{execFileSync('taskkill',['/PID',String(pid),'/T','/F'],{stdio:'ignore'});}catch{}}
test.beforeEach(async({},info)=>{root=path.resolve('.test-data',`kill-${info.workerIndex}-${Date.now()}`);await fs.mkdir(path.join(root,'out'),{recursive:true});await launch();});
test.afterEach(async()=>{await app?.evaluate(({app})=>app.exit(0)).catch(()=>{});await app?.close().catch(()=>{});});

test('PDFix killed while saving a Word copy: no partial file, and the typed work comes back after restart',async()=>{
 test.skip(process.platform!=='win32','uses Windows process termination');
 await page.getByRole('button',{name:'New document',exact:true}).first().click();const editor=page.getByRole('textbox',{name:'Editable document'});await editor.waitFor();await editor.click();
 const lines=Array.from({length:60},(_,i)=>`Site visit note ${i+1}: check the bracket at grid line ${i+3}.`);await editor.fill(lines.join('\n'));
 await expect(page.locator('.draft-status')).toHaveText('Recovery draft saved locally',slow);
 const dest=path.join(root,'out','visit.docx');await app.evaluate(({dialog},f)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:f});},dest);
 await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await page.waitForTimeout(150);killAll();
 const left=await fs.readdir(path.join(root,'out'));for(const name of left)expect(name,'only the finished copy may be there').toBe('visit.docx');
 if(left.includes('visit.docx')){const html=(await mammoth.convertToHtml({buffer:await fs.readFile(dest)})).value;expect(html).toContain('Site visit note 60');}
 await launch();const resume=page.locator('.unsaved-documents').getByRole('button',{name:/^Continue /}).first();await expect(resume).toBeVisible(slow);await resume.click();
 await expect(page.getByRole('textbox',{name:'Editable document'})).toContainText('Site visit note 60',slow);
});

test('PDFix killed while saving over the opened file: the file is the old or the new version, never damaged',async()=>{
 test.skip(process.platform!=='win32','uses Windows process termination');
 const file=path.join(root,'out','notes.txt'),before='Original line one.\nOriginal line two.';await fs.writeFile(file,before);
 await app.evaluate(({dialog},f)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).click();
 const editor=page.getByRole('textbox',{name:'Editable document'});await editor.waitFor(slow);await editor.click();await page.keyboard.press('Control+End');await page.keyboard.type(' Added before the power cut.');
 await expect(page.locator('.draft-status')).toHaveText('Recovery draft saved locally',slow);
 await page.keyboard.press('Control+s');await page.waitForTimeout(100);killAll();
 const text=await fs.readFile(file,'utf8');expect(text.includes('Original line one.')).toBe(true);if(text!==before)expect(text).toContain('Added before the power cut.');
 expect((await fs.readdir(path.join(root,'out'))).filter(name=>name!=='notes.txt'),'nothing temporary beside the document').toEqual([]);
 await launch();await app.evaluate(({dialog},f)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'Editable document'})).toContainText('Added before the power cut.',slow);
});

test('PDFix killed after typing into a spreadsheet: the edit comes back when the workbook is opened again',async()=>{
 test.skip(process.platform!=='win32','uses Windows process termination');
 const file=path.join(root,'out','parts.xlsx');await fs.copyFile('tests/fixtures/robot-workbook.xlsx',file);const original=await fs.readFile(file);
 const open=async()=>{await app.evaluate(({dialog},f)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(page.getByLabel('Cell address',{exact:true})).toBeVisible(slow);};
 await open();await page.locator('.workbook-grid [data-cell="B3"]').click();await page.keyboard.type('333');await page.keyboard.press('Enter');await expect(page.locator('.workbook-grid [data-cell="B3"]')).toContainText('333');
 await page.waitForTimeout(2500);killAll();expect((await fs.readFile(file)).equals(original),'the original workbook is untouched').toBe(true);
 await launch();await open();await expect(page.locator('.workbook-grid [data-cell="B3"]')).toContainText('333',slow);
});

test('PDFix killed while saving a signed copy: no partial PDF, the original is untouched, the signature placement comes back',async()=>{
 test.skip(process.platform!=='win32','uses Windows process termination');
 const file=path.join(root,'out','form.pdf');await fs.copyFile('tests/fixtures/reading-sample.pdf',file);const original=await fs.readFile(file),dest=path.join(root,'out','form-signed.pdf');
 const open=async()=>{await app.evaluate(({dialog},[f,d])=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});dialog.showSaveDialog=async()=>({canceled:false,filePath:d});},[file,dest]);await page.getByRole('button',{name:/^Fill and sign/}).first().click();const d=page.locator('dialog[open], .form-workspace.reader-page-tool-options').last();await d.waitFor(slow);return d;};
 let d=await open();const text=d.getByRole('textbox',{name:'Placement text',exact:true});if(!await text.isVisible().catch(()=>false))await d.getByText('Add a visual placement',{exact:true}).click();await text.fill('Signed before the power cut');
 await expect(d.locator('.form-status')).toContainText('kept on this computer',slow);await d.getByRole('button',{name:'Preview filled copy'}).click();await page.waitForTimeout(300);killAll();
 for(const name of await fs.readdir(path.join(root,'out')))expect(['form.pdf','form-signed.pdf']).toContain(name);expect((await fs.readFile(file)).equals(original)).toBe(true);
 await launch();d=await open();await expect(d.getByRole('textbox',{name:'Placement text',exact:true})).toHaveValue('Signed before the power cut',slow);
});

const hasValue=(scope,text)=>scope.evaluate((root,text)=>[...root.querySelectorAll('input,textarea')].some(input=>input.value.includes(text))||root.textContent.includes(text),text);
async function openToolOnFile(file,card,name){await app.evaluate(({dialog},f)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});},file);const home=page.getByRole('button',{name:card}).first();if(await home.isVisible().catch(()=>false))await home.click();else{await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();await page.getByRole('searchbox',{name:'Find a tool across workspaces'}).fill(name);await page.locator('.workspace-room-grid button').filter({has:page.locator('h2',{hasText:name})}).first().click();}const d=page.locator('dialog[open], .reader-page-tool-options').last();await d.waitFor(slow);return d;}

test('PDFix killed while saving a PDF export of a document: no partial PDF, and the typed work comes back',async()=>{
 test.skip(process.platform!=='win32','uses Windows process termination');
 await page.getByRole('button',{name:'New document',exact:true}).first().click();const editor=page.getByRole('textbox',{name:'Editable document'});await editor.waitFor();await editor.click();
 await editor.fill(Array.from({length:80},(_,i)=>`Export line ${i+1} for the crash test.`).join('\n'));await expect(page.locator('.draft-status')).toHaveText('Recovery draft saved locally',slow);
 const dest=path.join(root,'out','export.pdf');await app.evaluate(({dialog},f)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:f});},dest);
 await page.getByRole('button',{name:'Export PDF',exact:true}).click();const d=page.locator('dialog[open]').last();await d.getByRole('button',{name:'Preview PDF',exact:true}).click();
 await expect(d.getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:120000});await d.getByRole('button',{name:'Save PDF copy',exact:true}).click();await page.waitForTimeout(80);killAll();
 const left=await fs.readdir(path.join(root,'out'));for(const name of left)expect(name).toBe('export.pdf');if(left.length)expect((await fs.readFile(dest)).subarray(0,5).toString()).toBe('%PDF-');
 await launch();const resume=page.locator('.unsaved-documents').getByRole('button',{name:/^Continue /}).first();await expect(resume).toBeVisible(slow);await resume.click();
 await expect(page.getByRole('textbox',{name:'Editable document'})).toContainText('Export line 80',slow);
});

test('PDFix killed while Edit PDF text has unsaved additions: the original is untouched and the additions come back',async()=>{
 test.skip(process.platform!=='win32','uses Windows process termination');
 const file=path.join(root,'out','sample.pdf');await fs.copyFile('tests/fixtures/reading-sample.pdf',file);const original=await fs.readFile(file),added='Added before the power cut';
 let d=await openToolOnFile(file,/^Edit PDF text and images/,'Edit PDF text and images');await d.getByRole('button',{name:'Add text',exact:true}).click({timeout:60000});
 const box=d.getByRole('textbox',{name:'Added PDF text'});await box.fill(added);await box.press('Tab');await page.waitForTimeout(3000);killAll();
 expect((await fs.readFile(file)).equals(original)).toBe(true);expect(await fs.readdir(path.join(root,'out'))).toEqual(['sample.pdf']);
 await launch();d=await openToolOnFile(file,/^Edit PDF text and images/,'Edit PDF text and images');await expect.poll(()=>hasValue(d,added),slow).toBe(true);
});

test('PDFix killed while Redact has marked boxes: the original is untouched and the boxes come back',async()=>{
 test.skip(process.platform!=='win32','uses Windows process termination');
 const file=path.join(root,'out','sample.pdf');await fs.copyFile('tests/fixtures/reading-sample.pdf',file);const original=await fs.readFile(file);
 let d=await openToolOnFile(file,/^Hide private information/,'Redact a PDF');await d.getByRole('button',{name:'Add a box',exact:true}).click({timeout:60000});await d.getByRole('button',{name:'Add a box',exact:true}).click();
 await expect(d).toContainText('2 regions',slow);await page.waitForTimeout(3000);killAll();
 expect((await fs.readFile(file)).equals(original)).toBe(true);expect(await fs.readdir(path.join(root,'out'))).toEqual(['sample.pdf']);
 await launch();d=await openToolOnFile(file,/^Hide private information/,'Redact a PDF');await expect(d).toContainText('2 regions',slow);
});

test('PDFix killed after changing slide text: the original is untouched and the change comes back',async()=>{
 test.skip(process.platform!=='win32','uses Windows process termination');
 const file=path.join(root,'out','site visit.pptx');await fs.copyFile('tests/fixtures/robot-slides.pptx',file);const original=await fs.readFile(file),text='Arrive at gate 7 at 8:15';
 const run=()=>page.getByLabel('Slide text run',{exact:true}),box=()=>page.getByLabel('Selected text run',{exact:true});
 const open=async()=>{await app.evaluate(({dialog},f)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});},file);await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(run().locator('option').first()).toBeAttached(slow);};
 const pick=async pattern=>{const value=await run().locator('option').evaluateAll((options,source)=>options.find(o=>new RegExp(source).test(o.textContent))?.value,pattern.source);expect(value,'the first bullet of the site visit slide is offered').toBeTruthy();await run().selectOption(value);};
 await open();await pick(/Arrive at/);await expect(box()).toHaveValue(/Arrive at/);await box().fill(text);await page.getByRole('button',{name:'Apply text',exact:true}).click();
 await expect(page.getByText('Presentation edits recovered locally')).toBeVisible(slow);killAll();
 expect((await fs.readFile(file)).equals(original),'the original slides are untouched').toBe(true);
 await launch();await open();await pick(/gate 7/);await expect(box()).toHaveValue(text);
});

test('PDFix killed while preparing a signing request: the original is untouched and the locations and details come back',async()=>{
 test.skip(process.platform!=='win32','uses Windows process termination');
 const file=path.join(root,'out','sample.pdf');await fs.copyFile('tests/fixtures/reading-sample.pdf',file);const original=await fs.readFile(file);
 let d=await openToolOnFile(file,/^Prepare signing request/,'Prepare signing request');await d.getByRole('textbox',{name:'Recipient name'}).fill('Site Lead');
 await d.getByRole('button',{name:'Add location',exact:true}).click();await d.getByRole('button',{name:'Add location',exact:true}).click();
 await expect(d.getByRole('list',{name:/location/i}).getByRole('listitem')).toHaveCount(2);await page.waitForTimeout(2500);killAll();
 expect((await fs.readFile(file)).equals(original)).toBe(true);expect(await fs.readdir(path.join(root,'out'))).toEqual(['sample.pdf']);
 await launch();d=await openToolOnFile(file,/^Prepare signing request/,'Prepare signing request');
 await expect(d).toContainText('Restored 2 signing locations',slow);await expect(d.getByRole('list',{name:/location/i}).getByRole('listitem')).toHaveCount(2);await expect(d.getByRole('textbox',{name:'Recipient name'})).toHaveValue('Site Lead');
});

test('a signing request draft is cleared once the prepared copy is saved, so old locations do not come back',async()=>{
 const file=path.join(root,'out','sample.pdf'),dest=path.join(root,'out','sample-to-sign.pdf');await fs.copyFile('tests/fixtures/reading-sample.pdf',file);
 await app.evaluate(({dialog},d)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:d});},dest);
 let d=await openToolOnFile(file,/^Prepare signing request/,'Prepare signing request');await d.getByRole('textbox',{name:'Recipient name'}).fill('Site Lead');await d.getByRole('textbox',{name:'Recipient email'}).fill('lead@example.test');
 await d.getByRole('button',{name:'Add location',exact:true}).click();await d.getByRole('checkbox',{name:/I understand these are visible/}).check();await d.getByRole('button',{name:'Build prepared PDF preview',exact:true}).click();
 const save=d.getByRole('button',{name:'Save prepared PDF copy',exact:true});
 await expect(async()=>{for(const check of await d.getByRole('checkbox',{name:/reviewed/i}).all())if(await check.isVisible()&&await check.isEnabled()&&!await check.isChecked())await check.check();expect(await save.isEnabled()).toBe(true);}).toPass(slow);
 await save.click({timeout:60000});await expect(d).toContainText('Saved sample-to-sign.pdf',slow);await d.getByRole('button',{name:'Close',exact:true}).click();await expect(d).toBeHidden();
 d=await openToolOnFile(file,/^Prepare signing request/,'Prepare signing request');await expect(d.getByRole('button',{name:'Add location',exact:true})).toBeVisible(slow);await page.waitForTimeout(1000);
 await expect(d).not.toContainText('Restored');await expect(d.getByRole('list',{name:/location/i}).getByRole('listitem')).toHaveCount(0);await expect(d.getByRole('textbox',{name:'Recipient name'})).toHaveValue('');
});
