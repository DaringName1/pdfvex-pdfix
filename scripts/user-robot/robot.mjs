// PDFix user robot, first slice. Uses the real (hidden) app only through what a person sees: button and menu names,
// typing and keyboard shortcuts. It never reads the app's code or internal state. After every save the separate
// verifier (verify.mjs) inspects the file on disk; the robot does not trust success messages.
//
// A run picks a random but repeatable sequence of actions from a seed; the same seed, or --replay with a saved run,
// repeats exactly the same steps, so a bug can be replayed after a fix. Pairs of consecutive actions are counted in
// a coverage map across runs, so untried combinations stay visible.
//
// Usage (always through the run lock on this PC):
//   node scripts/agent-run.mjs claude -- node scripts/user-robot/robot.mjs --seed 7 --steps 14
//   node scripts/agent-run.mjs claude -- node scripts/user-robot/robot.mjs --replay tmp/user-robot/run-7.json
// Output: tmp/user-robot/run-<seed>.json, screenshots of failures, and tmp/user-robot/coverage.json.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {execFileSync} from 'node:child_process';
import {chooseDocumentMode} from './document-mode.mjs';import {verifyOutput,verifyProtected,inspectPdf,inspectDocx,inspectXlsx,inspectPptx,pdfFieldNames,pdfPageSizes,docxHyperlinks,hash,unchanged} from './verify.mjs';

const args=process.argv.slice(2),arg=name=>{const i=args.indexOf(name);return i>=0?args[i+1]:null;};
const replayFile=arg('--replay'),replay=replayFile?JSON.parse(await fs.readFile(replayFile,'utf8')):null;
let seed=Number(replay?.seed??arg('--seed')??Date.now()%100000),steps=Number(replay?.steps.length??arg('--steps')??12);
const out=path.resolve('tmp/user-robot');await fs.mkdir(out,{recursive:true});
// Small seeded random generator (mulberry32): the same seed always gives the same choices.
let state32=seed>>>0;const random=()=>{state32=state32+0x6D2B79F5>>>0;let t=state32;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
const pick=list=>list[Math.floor(random()*list.length)];
// Once something is open a person mostly works in it, so editing and saving are drawn more often than opening.
const weights={'type a sentence':4,'make everything bold':2,'insert a table':2,'undo then redo':2,'export Word copy':3,'export PDF copy':2,'start PDF export then cancel':1,'turn the PDF into an editable copy':3,'reopen a saved Word copy':2,'hide a word with Redact':2,'remove the password from a protected copy':2,'replace a word everywhere':2,'save a PDF page as a picture':2,'sign a PDF with a typed name':2,'add a fillable text box':2,'extract a table to a spreadsheet file':2,'add a page break and export on chosen paper':2,'search two files for a word':2,'turn a saved email into a document':2,'make a scanned PDF searchable':2,'change and add text in a PDF':2,'edit a workbook cell and save a copy':2,'edit slide text and save a copy':2,'editor: insert a picture, turn it and save a Word copy':2,'editor: print through print preparation':1,'editor: export an RTF copy':1,'editor: header on every page of the PDF copy':1,'health report: check a PDF and save the details':1,'fingerprint: calculate, compare and export a receipt':1,'signing request: mark a signature place and save the prepared copy':2};
// Steps that make a pair of actions not yet tried (in any run on this PC) are drawn three times as often, so
// coverage keeps growing instead of levelling off.
const pickAction=names=>{const pool=names.flatMap(n=>Array((weights[n]||1)*(coverage?.pairs?.[`${previous} → ${n}`]?1:3)).fill(n));return pool[Math.floor(random()*pool.length)];};

// Sample files and the app can come from elsewhere (the spare test PC uses a packaged PDFix and a fixtures folder).
const fixtures=process.env.ROBOT_FIXTURES||'tests/fixtures',packaged=process.env.PDFIX_EXE||null;
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Robot-'));const files=path.join(profile,'files');await fs.mkdir(files);
const samplePdf=path.join(files,'sample.pdf');await fs.copyFile(path.join(fixtures,'reading-sample.pdf'),samplePdf);const sampleHash=hash(await fs.readFile(samplePdf));
const samplePng=path.join(files,'photo.png');await fs.copyFile(path.join(fixtures,'scan-page.png'),samplePng);const pngHash=hash(await fs.readFile(samplePng));
const sampleDocx=path.join(files,'sample.docx');await fs.copyFile(path.join(fixtures,'editing-sample.docx'),sampleDocx);
// The parts table (robot-parts-table.pdf) is optional, so an older fixtures folder still runs the other actions.
const sampleTable=path.join(files,'parts table.pdf');const hasTable=await fs.copyFile(path.join(fixtures,'robot-parts-table.pdf'),sampleTable).then(()=>true,()=>false);
const sampleEmail=path.join(files,'site visit.eml');const hasEmail=await fs.copyFile(path.join(fixtures,'robot-email.eml'),sampleEmail).then(()=>true,()=>false);
const sampleWorkbook=path.join(files,'parts order.xlsx');const hasWorkbook=await fs.copyFile(path.join(fixtures,'robot-workbook.xlsx'),sampleWorkbook).then(()=>true,()=>false);const workbookHash=hasWorkbook?hash(await fs.readFile(sampleWorkbook)):null;
const sampleSlides=path.join(files,'site visit.pptx');const hasSlides=await fs.copyFile(path.join(fixtures,'robot-slides.pptx'),sampleSlides).then(()=>true,()=>false);const slidesHash=hasSlides?hash(await fs.readFile(sampleSlides)):null;
const sampleScan=path.join(files,'scan.pdf');const hasScan=await fs.copyFile(path.join(fixtures,'scan-only.pdf'),sampleScan).then(()=>true,()=>false);const docxHash=hash(await fs.readFile(sampleDocx));
const offline=process.env.ROBOT_OFFLINE==='1',gpuArgs=process.env.ROBOT_IN_PROCESS_GPU?['--in-process-gpu']:[];
// ROBOT_OFFLINE=1: internet off for the whole run. Names cannot be looked up and no proxy answers, and every attempt to
// reach another computer (from a window or the main process) is recorded; any attempt fails the run.
if(offline)gpuArgs.push('--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','--proxy-server=http://127.0.0.1:9');
// The app can be ended and started again within a run (see crash()), always on the same profile and files.
let app,page;const pageErrors=[],networkSeen=[];
async function start(){
 app=await electron.launch({...(packaged?{executablePath:packaged,args:gpuArgs}:{args:['.',...gpuArgs]}),env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:45000});
 page=await app.firstWindow();page.on('pageerror',e=>pageErrors.push(e.message.slice(0,200)));
 await page.waitForLoadState('domcontentloaded');await page.waitForTimeout(800);if(offline)await watchNetwork();
}
// PDFix and everything it started end at once, as at a power cut or End task in Task Manager; then it starts again.
async function crash(){if(offline)networkSeen.push(...await app.evaluate(()=>globalThis.__robotNetwork??[]).catch(()=>[]));const pid=app.process().pid;
 try{execFileSync('taskkill',['/PID',String(pid),'/T','/F'],{stdio:'ignore'});}catch{}await new Promise(resolve=>setTimeout(resolve,1500));await start();world.view='home';world.doc=null;}
const watchNetwork=()=>app.evaluate(({session})=>{const tried=globalThis.__robotNetwork=[],note=(how,where)=>{if(tried.length<50)tried.push(how+' '+String(where).slice(0,160));};
 const local=host=>['127.0.0.1','::1','[::1]','localhost'].includes(String(host??'').toLowerCase()),req=process.mainModule.require;
 for(const name of ['node:http','node:https']){const m=req(name);for(const fn of ['request','get']){const original=m[fn];m[fn]=function(target,...rest){const host=typeof target==='string'||target instanceof URL?new URL(target).hostname:target?.hostname??target?.host;if(!local(host))note(name+'.'+fn,host);return original.call(this,target,...rest);};}}
 for(const [name,fns] of [['node:net',['connect','createConnection']],['node:tls',['connect']]]){const m=req(name);for(const fn of fns){const original=m[fn];m[fn]=function(...args){const o=args[0],host=typeof o==='object'?o?.host:typeof args[1]==='string'?args[1]:undefined;const pipe=typeof o==='object'?!!o?.path:typeof o==='string'&&!/^\d+$/.test(o);if(!pipe&&!local(host??'localhost'))note(name+'.'+fn,host);return original.apply(this,args);};}}
 // The same rule as the app's own filter (desktop/main.cjs), which this replaces for the run: bundled pages only.
 const allowed=u=>{try{const url=new URL(u);return url.protocol==='pdfix:'&&url.host==='app'&&!url.username&&!url.password||u.startsWith('devtools:');}catch{return false;}},inert=u=>/^(data|blob):/.test(u);
 session.defaultSession.webRequest.onBeforeRequest((details,callback)=>{const ok=allowed(details.url);if(!ok&&!inert(details.url))note('window request',details.url);callback({cancel:!ok});});
});
await start();
// ROBOT_OFFLINE_SELFTEST=1 tries the internet once from each side, to prove the record catches it (that run must fail).
if(offline&&process.env.ROBOT_OFFLINE_SELFTEST==='1'){await app.evaluate(()=>{process.mainModule.require('node:https').get('https://example.com/').on('error',()=>{});});await page.evaluate(()=>fetch('https://example.com/').catch(()=>{}));await page.waitForTimeout(500);}

// What the robot believes it has done, used only to know what to expect in files, never read from the app.
const world={view:'home',doc:null,saved:[],counter:0};
const editor=()=>page.getByRole('textbox',{name:'Editable document'});
// A person never presses a key within milliseconds of clicking; this short pause keeps the robot's timing human.
const clickEditor=async()=>{await editor().click();await page.waitForTimeout(150);};
// Review boxes become available only when a preview is ready, which can take a while on a slower PC: wait for it.
const tick=async box=>{await box.waitFor({timeout:120000});for(let i=0;i<480&&!await box.isEnabled();i++)await page.waitForTimeout(250);await box.check();};
const chooseFile=file=>app.evaluate(({dialog},f)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});},file);
// Several files in one Open dialog (Codex's batch tasks: Compress several PDFs, Bates numbering, batch copy).
const chooseFiles=list=>app.evaluate(({dialog},l)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:l});},[...list]);
const saveAs=file=>app.evaluate(({dialog},f)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:f});},file);
const toast=()=>page.locator('#toast');
// The open PDF's tools: the older PDF tools menu, or the reader tool bar's group tab when this build has one.
// A PDF can open in View (or Quick edit), where the tool tabs are hidden: switch to Build first, as a person would.
const showPdfTools=async group=>{const old=page.getByText('PDF tools',{exact:true}),tabs=page.getByRole('tablist',{name:'PDF tool groups'}),modes=page.getByRole('group',{name:'Document mode',exact:true});await old.or(tabs).or(modes).first().waitFor({timeout:60000});if(await old.isVisible().catch(()=>false))return old.click();if(!await tabs.isVisible().catch(()=>false))await chooseDocumentMode(page,'build');await tabs.getByRole('tab',{name:group,exact:true}).click();};
// A tool from its Home card when this build has one, otherwise found by name in All tools (the simpler Home keeps only starting jobs).
const startTool=async(card,tool)=>{const home=page.getByRole('button',{name:card}).first();if(await home.isVisible().catch(()=>false))return home.click();await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();await page.getByRole('searchbox',{name:'Find a tool across workspaces'}).fill(tool);await page.locator('.workspace-room-grid button,[role=tabpanel] button').filter({has:page.locator('h2',{hasText:tool})}).first().click();};
const goHome=async()=>{await page.keyboard.press('Escape').catch(()=>{});await page.getByRole('button',{name:'Home',exact:true}).first().click({timeout:8000});await page.getByText('What would you like to do?').waitFor({timeout:15000});world.view='home';world.doc=null;};
// Open files stay open in tabs (S19). Between steps only (never inside one, where a draft may still be needed), once
// five or more tabs are open the robot closes them all, choosing Discard, to stay under PDFix's 10-open-files limit.
async function closeRobotTabs(atLeast){const tabs=page.getByRole('button',{name:/^Close (.+\.(pdf|docx|rtf|txt|md|xlsx|csv|pptx|png|jpe?g|webp|bmp|tiff?|eml|html?)|Untitled document.*)$/i});if(await tabs.count().catch(()=>0)<atLeast)return;for(let i=0;i<12&&await tabs.count().catch(()=>0);i++){await tabs.first().click({timeout:5000}).catch(()=>{});const discard=page.getByRole('button',{name:'Discard',exact:true});if(await discard.first().isVisible({timeout:1500}).catch(()=>false))await discard.first().click().catch(()=>{});await page.waitForTimeout(200);}await goHome().catch(()=>{});}
// Opens a tool by its name through Workspaces search (with a chosen file when it needs one) and returns its window.
const openTool=async(title,file)=>{if(world.view!=='home')await goHome();if(file)await chooseFile(file);await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();await page.getByRole('searchbox',{name:'Find a tool across workspaces'}).fill(title);await page.locator('.workspace-room-grid button,[role=tabpanel] button').filter({has:page.locator('h2',{hasText:title})}).first().click();const d=page.locator('dialog[open]').last();await d.waitFor({timeout:60000});world.view='tool';return d;};
const closeTool=async()=>{for(let i=0;i<3&&await page.locator('dialog[open]').count();i++){await page.keyboard.press('Escape');await page.waitForTimeout(600);}if(await page.locator('dialog[open]').count())await page.locator('dialog[open]').last().getByRole('button',{name:/^Close/}).first().click().catch(()=>{});await goHome();};
const openFile=async file=>{if(world.view!=='home')await goHome();await chooseFile(file);await page.getByRole('button',{name:'Open a file',exact:true}).click();};
// Ctrl+B toggles, as in Word; whether the document ended up bold is read from the Bold button (see the bold action).
const expectFor=doc=>({expectText:doc.text.slice(-3),expectTable:doc.table,expectBold:doc.bold});

// Each action: when it makes sense (a person would not export an empty page), and what it does.
// Review boxes unlock only after a preview is checked, which can take a while on a slow PC: keep ticking until Save unlocks.
async function tickUntilEnabled(d,save){for(let i=0;i<240&&await save.isDisabled();i++){for(const check of await d.getByRole('checkbox',{name:/checked|reviewed|confirm/i}).all())if(await check.isVisible()&&await check.isEnabled()&&!await check.isChecked())await check.check();await page.waitForTimeout(250);}}
const actions={
 // Health report: run it on the sample PDF and save the details; the saved JSON must name the PDF and carry its
 // exact SHA-256, which the robot works out itself.
 'health report: check a PDF and save the details':{when:w=>true,run:async()=>{const file=path.join(files,`health-${++world.counter}.json`),d=await openTool('Document health report',samplePdf);
  await saveAs(file);await d.getByRole('button',{name:'Save details as JSON',exact:true}).click();for(let i=0;i<240&&!await fs.stat(file).then(s=>s.size>2,()=>false);i++)await page.waitForTimeout(250);await closeTool();
  const problems=[];let report;try{report=JSON.parse(await fs.readFile(file,'utf8'));}catch(error){problems.push('the saved details are not valid JSON: '+error.message.slice(0,80));}const text=JSON.stringify(report??'');
  if(report){if(!text.includes(sampleHash))problems.push('the saved details do not carry the PDF fingerprint');if(!/sample\.pdf/i.test(text))problems.push('the saved details do not name the PDF');}if(!await unchanged(samplePdf,sampleHash))problems.push('the original PDF changed');return {pass:!problems.length,problems,info:{bytes:text.length}};}},
 // Fingerprint: calculate it, compare with the true value, export a receipt that must contain it.
 'fingerprint: calculate, compare and export a receipt':{when:w=>true,run:async()=>{const file=path.join(files,`receipt-${++world.counter}.json`),d=await openTool('Verify PDF fingerprint',null);
  await chooseFile(samplePdf);await d.getByRole('button',{name:'Choose file and calculate',exact:true}).click();await d.getByText(sampleHash).first().waitFor({timeout:90000});
  await d.getByRole('textbox',{name:/Expected SHA-256/}).fill(sampleHash);const compare=d.getByRole('button',{name:'Compare',exact:true});for(let i=0;i<40&&await compare.isDisabled();i++)await page.waitForTimeout(250);await compare.click();
  const said=(await d.innerText()).replace(/\s+/g,' ');await saveAs(file);await d.getByRole('button',{name:'Export verification receipt',exact:true}).click();for(let i=0;i<240&&!await fs.stat(file).then(s=>s.size>2,()=>false);i++)await page.waitForTimeout(250);await closeTool();
  const problems=[];if(!/\bmatch/i.test(said)||/does not match|mismatch/i.test(said))problems.push('the tool did not report a match for the true fingerprint');let text='';try{text=JSON.stringify(JSON.parse(await fs.readFile(file,'utf8')));}catch{problems.push('the receipt is not valid JSON');}
  if(text&&!text.includes(sampleHash))problems.push('the receipt does not carry the fingerprint');return {pass:!problems.length,problems,info:{bytes:text.length}};}},
 // Signing request: mark where to sign, save the prepared copy; it must open with every page and leave the original alone.
 'signing request: mark a signature place and save the prepared copy':{when:w=>true,run:async()=>{const file=path.join(files,`to-sign-${++world.counter}.pdf`),d=await openTool('Prepare signing request',samplePdf);
  await d.getByRole('textbox',{name:'Recipient name'}).fill('Robot Signer');await d.getByRole('textbox',{name:'Recipient email'}).fill('robot@example.test');await d.getByRole('button',{name:'Add location',exact:true}).click();
  const understood=d.getByRole('checkbox',{name:/I understand these are visible/});if(await understood.isVisible().catch(()=>false)&&!await understood.isChecked())await understood.check();const build=d.getByRole('button',{name:'Build prepared PDF preview',exact:true});for(let i=0;i<40&&await build.isDisabled();i++)await page.waitForTimeout(250);await build.click();const save=d.getByRole('button',{name:'Save prepared PDF copy',exact:true});await tickUntilEnabled(d,save);
  await saveAs(file);await save.click();for(let i=0;i<480&&!await fs.stat(file).then(s=>s.size>100,()=>false);i++)await page.waitForTimeout(250);await page.waitForTimeout(500);await closeTool();
  const info=await inspectPdf(file),problems=[];if(!info.ok)problems.push(info.problem);else{if(info.pages!==3)problems.push(`expected 3 pages, found ${info.pages}`);if(!info.text.includes('A little clarity'))problems.push('the page text is missing from the prepared copy');}
  if(!await unchanged(samplePdf,sampleHash))problems.push('the original PDF changed');return {pass:!problems.length,problems,info:{pages:info.pages,sha256:info.sha256,bytes:info.bytes}};}},
 // Pictures in documents: insert a picture, turn it when this build has Turn right, save a Word copy; the saved
 // package must contain the picture and the typed text.
 'editor: insert a picture, turn it and save a Word copy':{when:w=>w.view==='editor',run:async()=>{const file=path.join(files,`picture-${++world.counter}.docx`);await clickEditor();await page.keyboard.press('Control+End');
  await page.getByRole('tab',{name:'Insert',exact:true}).click();const images=page.locator('.document-image-controls');if(!await images.evaluate(d=>d.open))await images.locator(':scope>summary').click();const before=await editor().locator('img[data-pdfix-image]').count();
  await images.locator('[data-file]').setInputFiles(samplePng);await expect(editor().locator('img[data-pdfix-image]')).toHaveCount(before+1,{timeout:60000});const image=editor().locator('img[data-pdfix-image]').last();await image.click();
  const turn=images.getByRole('button',{name:'Turn right',exact:true});let turned=false;if(await turn.isVisible().catch(()=>false)){const width=await image.getAttribute('data-pdfix-image-width');await turn.click();await expect(image).not.toHaveAttribute('data-pdfix-image-width',width,{timeout:60000});turned=true;}
  await page.getByRole('tab',{name:'Home',exact:true}).click();world.doc.pictures=(world.doc.pictures||0)+1;await saveAs(file);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await toastSays(path.basename(file));
  const result=await verifyOutput({file,kind:'docx',...expectFor(world.doc)});if(result.pass&&!(result.info.images>=1)){result.pass=false;result.problems.push('the saved Word copy has no picture');}result.info.turned=turned;world.saved.push({file,kind:'docx',doc:structuredClone(world.doc)});return result;}},
 // Print from the editor: Ctrl+P goes through print preparation to the Windows print call (replaced by a counter
 // here, so nothing reaches a printer); nothing is saved.
 'editor: print through print preparation':{when:w=>w.view==='editor'&&w.doc.text.length,run:async()=>{await app.evaluate(({BrowserWindow})=>{const wc=BrowserWindow.getAllWindows()[0].webContents;if(!wc.robotPrint){wc.robotPrint=true;globalThis.robotPrints=0;wc.print=(_o,cb)=>{globalThis.robotPrints++;setTimeout(()=>cb(true),150);};}});
  const before=await app.evaluate(()=>globalThis.robotPrints),saved=(await fs.readdir(files)).length;await clickEditor();await page.keyboard.press('Control+p');const print=page.locator('.pdf-print-workspace');await print.waitFor({timeout:90000});
  // Print panel (Codex, Oct 29-30): the preview builds by itself and there is no review tick any more; the main button is
  // being renamed from 'Open Windows print dialog' to 'Print'. Accept both, and tick the old box only if a build still has it.
  const review=print.getByRole('checkbox',{name:'I reviewed the prepared pages and settings'});if(await review.count())await tick(review);
  const go=print.getByRole('button',{name:/^(Print|Open Windows print dialog)$/}).first();await expect(go).toBeEnabled({timeout:90000});await go.click();
  for(let i=0;i<240&&await app.evaluate(()=>globalThis.robotPrints)===before;i++)await page.waitForTimeout(250);const printed=await app.evaluate(()=>globalThis.robotPrints)-before;
  for(let i=0;i<5&&await page.locator('dialog[open]').count();i++){await page.keyboard.press('Escape');await page.waitForTimeout(400);}const problems=[];if(printed!==1)problems.push(`expected one print call, got ${printed}`);if((await fs.readdir(files)).length!==saved)problems.push('printing saved a file');return {pass:!problems.length,problems,info:{printed}};}},
 // RTF copy: the words typed so far must be in the saved RTF (older word processors open it).
 'editor: export an RTF copy':{when:w=>w.view==='editor'&&w.doc.text.length,run:async()=>{const file=path.join(files,`copy-${++world.counter}.rtf`);await page.getByRole('tab',{name:'File',exact:true}).click();await saveAs(file);await page.getByRole('button',{name:'Export RTF copy',exact:true}).click();
  await toastSays(path.basename(file));await page.getByRole('tab',{name:'Home',exact:true}).click();const rtf=await fs.readFile(file,'latin1'),problems=[];if(!rtf.startsWith('{\\rtf'))problems.push('not an RTF file');const plain=rtf.replace(/\\[a-z]+-?\d* ?/gi,'').replace(/[{}]/g,'').replace(/\s+/g,' ');
  for(const piece of world.doc.text.slice(-3).filter(t=>/^[\x20-\x7e]+$/.test(t)))if(!plain.includes(piece))problems.push(`expected text missing: "${piece}"`);return {pass:!problems.length,problems,info:{bytes:rtf.length}};}},
 // Page setup: a header line must appear on the pages of the PDF copy.
 'editor: header on every page of the PDF copy':{when:w=>w.view==='editor'&&w.doc.text.length,run:async()=>{const header=`Robot header ${seed}-${++world.counter}`,file=path.join(files,`header-${world.counter}.pdf`);await page.getByRole('tab',{name:'Pages',exact:true}).click();
  const setup=page.locator('details').filter({has:page.getByLabel('Header text',{exact:true})}).last();if(await setup.count()&&!await setup.evaluate(d=>d.open))await setup.locator(':scope>summary').click();await page.getByLabel('Header text',{exact:true}).fill(header);await page.getByLabel('Header text',{exact:true}).press('Tab');
  await page.getByRole('tab',{name:'Home',exact:true}).click();await saveAs(file);await page.getByRole('button',{name:'Export PDF',exact:true}).click();const d=page.locator('dialog[open]').last();await d.getByRole('button',{name:'Preview PDF',exact:true}).click();await expect(d.getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:90000});
  await d.getByRole('button',{name:'Save PDF copy',exact:true}).click();await d.getByText('Saved '+path.basename(file)).waitFor({timeout:60000});await d.getByRole('button',{name:/^Close/}).first().click();const result=await verifyOutput({file,kind:'pdf',expectText:[header,...world.doc.text.slice(-2)]});
  if(result.pass)result.info.headerCount=(result.info.text.split(header).length-1);return result;}},
 // Edit a workbook: open the Excel-shaped sample, change one number, save a copy. The verifier reads the saved
 // package: the new value, the formula next to it, both sheets, and the untouched original.
 'edit a workbook cell and save a copy':{when:w=>hasWorkbook,run:async()=>{if(world.view!=='home')await goHome();const file=path.join(files,`workbook-${++world.counter}.xlsx`),value=String(200+world.counter%700);await chooseFile(sampleWorkbook);await page.getByRole('button',{name:'Open a file',exact:true}).click();
  await page.getByRole('tablist',{name:'Workbook sheets'}).getByRole('tab').first().waitFor({timeout:60000});await page.getByLabel('Cell address',{exact:true}).waitFor({timeout:60000});world.view='office';
  await page.getByLabel('Cell address',{exact:true}).fill('B2');await page.getByRole('button',{name:'Go',exact:true}).click();const cell=page.getByLabel('Selected cell value',{exact:true});for(let i=0;i<40&&!/^[0-9]+$/.test(await cell.inputValue());i++)await page.waitForTimeout(250);
  await cell.fill(value);await page.getByRole('button',{name:'Apply value',exact:true}).click();const save=page.getByRole('button',{name:'Save XLSX copy',exact:true});await expect(save).toBeEnabled({timeout:30000});for(let i=0;i<40&&await save.isDisabled();i++)await page.waitForTimeout(250);
  await saveAs(file);await save.click();for(let i=0;i<480&&!await fs.stat(file).then(s=>s.size>100,()=>false);i++)await page.waitForTimeout(250);await page.waitForTimeout(500);
  const info=await inspectXlsx(file),problems=[];if(!info.ok)problems.push(info.problem);else{if(info.cells.B2?.value!==value)problems.push(`B2 is ${info.cells.B2?.value}, expected ${value}`);if(info.cells.D2?.formula!=='B2*C2')problems.push('the formula in D2 was lost');if(info.sheets!==2)problems.push(`expected 2 sheets, found ${info.sheets}`);}
  if(!await unchanged(sampleWorkbook,workbookHash))problems.push('the original workbook changed');await goHome();return {pass:!problems.length,problems,info:{sheets:info.sheets,sha256:info.sha256,bytes:info.bytes}};}},
 // Edit slide text: change one bullet in the PowerPoint-shaped sample and save a copy. The verifier reads every
 // slide: the new text is there, the old text is gone, the other slides are kept, the original is untouched.
 'edit slide text and save a copy':{when:w=>hasSlides,run:async()=>{if(world.view!=='home')await goHome();const file=path.join(files,`slides-${++world.counter}.pptx`),text=`Arrive at gate ${world.counter} at 8:15`;await chooseFile(sampleSlides);await page.getByRole('button',{name:'Open a file',exact:true}).click();
  const run=page.getByLabel('Slide text run',{exact:true});for(let i=0;i<240&&!await run.locator('option').count().catch(()=>0);i++)await page.waitForTimeout(250);world.view='office';
  const option=await run.locator('option').evaluateAll(options=>options.find(o=>/Arrive at/.test(o.textContent))?.value);if(!option)throw new Error('the first bullet of the site visit slide is not offered');await run.selectOption(option);
  const box=page.getByLabel('Selected text run',{exact:true});for(let i=0;i<40&&!/Arrive at/.test(await box.inputValue());i++)await page.waitForTimeout(250);await box.fill(text);await page.getByRole('button',{name:'Apply text',exact:true}).click();
  const save=page.getByRole('button',{name:'Save PPTX copy',exact:true});await expect(save).toBeEnabled({timeout:30000});for(let i=0;i<40&&await save.isDisabled();i++)await page.waitForTimeout(250);
  await saveAs(file);await save.click();for(let i=0;i<480&&!await fs.stat(file).then(s=>s.size>100,()=>false);i++)await page.waitForTimeout(250);await page.waitForTimeout(500);
  const info=await inspectPptx(file),problems=[];if(!info.ok)problems.push(info.problem);else{const flat=info.text.replace(/\s+/g,' ');if(!flat.includes(text))problems.push('the new slide text is missing');if(flat.includes('north gate'))problems.push('the old slide text is still there');if(info.slides!==3)problems.push(`expected 3 slides, found ${info.slides}`);for(const kept of ['Book the crane for Thursday','Brackets still on order'])if(!flat.includes(kept))problems.push(`other slide text lost: "${kept}"`);}
  if(!await unchanged(sampleSlides,slidesHash))problems.push('the original slides changed');await goHome();return {pass:!problems.length,problems,info:{slides:info.slides,sha256:info.sha256,bytes:info.bytes}};}},
 'new document':{when:w=>true,run:async()=>{if(world.view!=='home')await goHome();await page.getByRole('button',{name:'New document',exact:true}).click();await editor().waitFor({timeout:30000});world.view='editor';world.doc={text:[],table:false,bold:false,from:'new'};}},
 'type a sentence':{when:w=>w.view==='editor',run:async()=>{const phrase=`Robot note ${seed}-${++world.counter}`;await clickEditor();await page.keyboard.press('Control+End');await page.keyboard.press('Enter');await page.keyboard.type(phrase);world.doc.text.push(phrase);return phrase;}},
 'make everything bold':{when:w=>w.view==='editor'&&w.doc.text.length,run:async()=>{await clickEditor();await page.keyboard.press('Control+A');await page.keyboard.press('Control+B');await page.waitForTimeout(150);world.doc.bold=await page.getByRole('button',{name:'Bold',exact:true}).first().getAttribute('aria-pressed')==='true';await page.keyboard.press('Control+End');}},
 'insert a table':{when:w=>w.view==='editor',run:async()=>{await clickEditor();await page.keyboard.press('Control+End');await page.getByRole('tab',{name:'Insert',exact:true}).click();const insertTable=page.getByRole('button',{name:'Insert table',exact:true});if(!await insertTable.isVisible().catch(()=>false))await page.getByText('Table',{exact:true}).first().click();await insertTable.click({timeout:15000}).catch(async error=>{const where=await page.evaluate(()=>{const sel=getSelection(),node=sel.anchorNode,el=node?.nodeType===3?node.parentElement:node;return {inTable:!!el?.closest?.('table'),anchor:(el?.tagName||'')+':'+(node?.textContent||'').slice(0,30),focus:document.activeElement?.getAttribute('aria-label')||document.activeElement?.tagName,disabled:document.querySelector('button')&&[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Insert table')?.disabled};}).catch(()=>({}));throw new Error('Insert table could not be clicked; caret '+JSON.stringify(where));});await page.keyboard.press('Control+End');world.doc.table=true;}},
 // Find and replace: what the robot typed changes everywhere; later exports check the new words reached the file.
 'replace a word everywhere':{when:w=>w.view==='editor'&&w.doc.text.some(t=>t.includes('Robot note')),run:async()=>{await clickEditor();await page.keyboard.press('Control+f');
  await page.getByLabel('Find in document',{exact:true}).fill('Robot note');await page.getByLabel('Replacement text',{exact:true}).fill('Checked note');await page.getByRole('button',{name:'Replace all',exact:true}).click();
  await page.waitForTimeout(400);await page.getByRole('button',{name:'Close document search'}).click().catch(()=>page.keyboard.press('Escape'));
  world.doc.text=world.doc.text.map(t=>t.replaceAll('Robot note','Checked note'));const left=await editor().getByText('Robot note').count();if(left)throw new Error(left+' "Robot note" still in the document after Replace all');}},
 'undo then redo':{when:w=>w.view==='editor'&&w.doc.text.length,run:async()=>{await clickEditor();await page.keyboard.press('Control+z');await page.keyboard.press('Control+y');}},
 'export Word copy':{when:w=>w.view==='editor'&&w.doc.text.length,run:async()=>{const file=path.join(files,`copy-${++world.counter}.docx`);await saveAs(file);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await toastSays(path.basename(file));const result=await verifyOutput({file,kind:'docx',...expectFor(world.doc)});world.saved.push({file,kind:'docx',doc:structuredClone(world.doc)});return result;}},
 'export PDF copy':{when:w=>w.view==='editor'&&w.doc.text.length,run:async()=>{const file=path.join(files,`copy-${++world.counter}.pdf`);await saveAs(file);await page.getByRole('button',{name:'Export PDF',exact:true}).click();const d=page.locator('dialog[open]').last();await d.getByRole('button',{name:'Preview PDF',exact:true}).click();await expect(d.getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:90000});await d.getByRole('button',{name:'Save PDF copy',exact:true}).click();await d.getByText('Saved '+path.basename(file)).waitFor({timeout:60000});await d.getByRole('button',{name:/^Close/}).first().click();const result=await verifyOutput({file,kind:'pdf',expectText:world.doc.text.slice(-3)});return result;}},
 // A page break, then a PDF on A4 or Letter: the saved PDF must have a second page, the new text, and that paper size.
 'add a page break and export on chosen paper':{when:w=>w.view==='editor'&&w.doc.text.length,run:async()=>{const paper=pick(['a4','letter']),size=paper==='a4'?[595,842]:[612,792],file=path.join(files,`paged-${++world.counter}.pdf`),phrase=`After the break ${seed}-${world.counter}`;
  await clickEditor();await page.keyboard.press('Control+End');await page.getByRole('tab',{name:'Insert',exact:true}).click();await page.getByRole('button',{name:'Page break',exact:true}).click();await clickEditor();await page.keyboard.press('Control+End');await page.keyboard.type(phrase);world.doc.text.push(phrase);
  await saveAs(file);await page.getByRole('button',{name:'Export PDF',exact:true}).click();const d=page.locator('dialog[open]').last();await d.getByRole('combobox',{name:'Paper'}).selectOption(paper);
  await d.getByRole('button',{name:'Preview PDF',exact:true}).click();await expect(d.getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:90000});await d.getByRole('button',{name:'Save PDF copy',exact:true}).click();await d.getByText('Saved '+path.basename(file)).waitFor({timeout:60000});await d.getByRole('button',{name:/^Close/}).first().click();
  const result=await verifyOutput({file,kind:'pdf',expectText:[phrase]});if(!result.pass)return result;const sizes=await pdfPageSizes(file);
  if(sizes.length<2)result.problems.push(`expected at least 2 pages after a page break, found ${sizes.length}`);const wrong=sizes.filter(([w,h])=>Math.abs(w-size[0])>2||Math.abs(h-size[1])>2);if(wrong.length)result.problems.push(`${wrong.length} page(s) not ${paper}: ${JSON.stringify(wrong[0])}`);
  result.pass=!result.problems.length;return result;}},
 'start PDF export then cancel':{when:w=>w.view==='editor',run:async()=>{await page.getByRole('button',{name:'Export PDF',exact:true}).click();const d=page.locator('dialog[open]').last();await d.waitFor({timeout:10000});await page.keyboard.press('Escape');await page.waitForTimeout(400);if(await page.locator('dialog[open]').count())throw new Error('Escape did not close the PDF export dialog');}},
 'reopen a saved Word copy':{when:w=>w.saved.some(s=>s.kind==='docx'),run:async()=>{const saved=pick(world.saved.filter(s=>s.kind==='docx'));await openFile(saved.file);await editor().waitFor({timeout:60000});const doc=structuredClone(saved.doc);for(const phrase of doc.text.slice(-3)){const edited=phrase.replace('Robot note','Checked note');await editor().getByText(phrase).first().or(editor().getByText(edited).first()).first().waitFor({timeout:30000});if(edited!==phrase&&await editor().getByText(edited).count())doc.text=doc.text.map(t=>t===phrase?edited:t);}world.view='editor';world.doc=doc;world.doc.from='reopened';return path.basename(saved.file);}},
 'open the sample Word file':{when:w=>true,run:async()=>{await openFile(sampleDocx);await editor().waitFor({timeout:60000});await editor().getByText('Project notes').first().waitFor({timeout:30000});world.view='editor';world.doc={text:['Project notes'],table:false,bold:false,from:'sample'};}},
 'open the sample PDF':{when:w=>true,run:async()=>{await openFile(samplePdf);await page.locator('.pdf-paper[data-ready="true"]').first().waitFor({timeout:60000});world.view='pdf';}},
 'turn the PDF into an editable copy':{when:w=>w.view==='pdf',run:async()=>{await showPdfTools('Edit');await page.getByRole('button',{name:'Text tools menu',exact:true}).click();await page.getByRole('menu',{name:'Text tools',exact:true}).getByRole('menuitem',{name:'Edit a text document copy',exact:true}).click();await editor().waitFor({timeout:60000});await editor().getByText('A little clarity').first().waitFor({timeout:30000});world.view='editor';world.doc={text:['A little clarity'],table:false,bold:false,from:'pdf'};}},
 'open a tool and close it with Escape':{when:w=>true,run:async()=>{if(world.view!=='home')await goHome();await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();const tabs=await page.getByRole('tab').allTextContents(),room=pick(tabs.filter(t=>['Documents','More tools','Create','Edit','Fill & Sign','Protect','Export'].includes(t.trim())));await page.getByRole('tab',{name:room,exact:true}).click();const titles=(await page.locator('[role=tabpanel] button h2').allTextContents()).filter(t=>!/Open a document|New document|synchronized|right-click|Watched/i.test(t));const title=pick(titles);await chooseFile(samplePdf);await page.locator('[role=tabpanel] button').filter({has:page.locator('h2',{hasText:title})}).first().click();if(!await page.locator('dialog[open]').first().or(page.getByRole('button',{name:/^Back to/}).first()).first().waitFor({timeout:60000}).then(()=>true,()=>false))throw new Error(`"${title}" (${room}) did not open within 60 seconds`);if(!await page.locator('dialog[open]').count())await page.locator('dialog[open]').first().waitFor({timeout:15000}).catch(()=>{});await page.waitForTimeout(800);const pressed=Date.now();for(let i=0;i<3&&await page.locator('dialog[open]').count();i++){await page.keyboard.press('Escape');await page.waitForTimeout(500);}
  // A tool closing on Escape first stops its own work and keeps its recovery, which takes longer on a slow PC: wait up to 10 s and note slow closes.
  for(let i=0;i<40&&await page.locator('dialog[open]').count();i++)await page.waitForTimeout(250);const closeMs=Date.now()-pressed;
  const left=await page.locator('dialog[open]').count();await goHome().catch(error=>{throw new Error(`going Home after "${title}" (${room}): `+String(error.message).slice(0,120));});if(left)throw new Error(`"${title}" stayed open for 10 seconds after pressing Escape`);return `${room} → ${title}`+(closeMs>3000?` (closed after ${Math.round(closeMs/100)/10} s)`:'');}},
 'protect a PDF with a password':{when:w=>true,run:async()=>{if(world.view!=='home')await goHome();const password=`Robot-pass-${seed}-${++world.counter}`,file=path.join(files,`protected-${world.counter}.pdf`);
  await chooseFile(samplePdf);await startTool(/^Protect or unlock a PDF/,'Protect or unlock a PDF');const d=page.locator('dialog[open]').last();await d.waitFor({timeout:30000});
  const settings=d.getByText('Passwords and permissions',{exact:true});if(!await d.getByRole('textbox',{name:'New opening password',exact:true}).isVisible().catch(()=>false))await settings.click();
  for(const name of ['New opening password','Confirm opening password'])await d.getByRole('textbox',{name,exact:true}).fill(password);
  {const both=d.getByRole('radio',{name:/^Both/});if(await both.count())await both.check();}
  for(const name of ['New owner password','Confirm owner password'])await d.getByRole('textbox',{name,exact:true}).fill(password+'-owner');
  await d.getByRole('button',{name:'Build verified PDF preview',exact:true}).click();await d.getByText(/Verified/).first().waitFor({timeout:120000});
  await expect(d.getByRole('button',{name:'Save verified PDF copy',exact:true})).toBeEnabled({timeout:120000});await saveAs(file);await d.getByRole('button',{name:'Save verified PDF copy',exact:true}).click();
  await page.getByText(new RegExp('Saved.*'+path.basename(file).replace('.','\\.'))).first().waitFor({timeout:60000});await page.keyboard.press('Escape');await page.waitForTimeout(500);if(await page.locator('dialog[open]').count())await page.locator('dialog[open]').last().getByRole('button',{name:/^Close/}).first().click().catch(()=>{});
  await goHome();world.saved.push({kind:'protected',file,password});return verifyProtected(file,password);}},
 'make a PDF from a picture':{when:w=>true,run:async()=>{if(world.view!=='home')await goHome();const file=path.join(files,`picture-${++world.counter}.pdf`);await chooseFile(samplePng);await page.getByRole('button',{name:/^Image to PDF/}).first().click();
  await page.getByRole('button',{name:'Preview PDF',exact:true}).click();await page.getByText(/Verified 1 image page/).first().waitFor({timeout:90000});await expect(page.getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled({timeout:90000});await saveAs(file);await page.getByRole('button',{name:'Save PDF copy',exact:true}).click();
  await page.getByText('Saved '+path.basename(file)).first().waitFor({timeout:60000});await goHome();const result=await verifyOutput({file,kind:'pdf'});if(result.pass&&result.info.pages!==1){result.pass=false;result.problems=[`expected 1 page, found ${result.info.pages}`];}return result;}},
 // Unlocking a copy the robot protected earlier: the saved copy must open with no password and keep its pages and text.
 'remove the password from a protected copy':{when:w=>w.saved.some(s=>s.kind==='protected'),run:async()=>{if(world.view!=='home')await goHome();const saved=pick(world.saved.filter(s=>s.kind==='protected')),file=path.join(files,`unlocked-${++world.counter}.pdf`);
  await chooseFile(saved.file);await startTool(/^Protect or unlock a PDF/,'Protect or unlock a PDF');const d=page.locator('dialog[open]').last();await d.waitFor({timeout:30000});
  const action=d.getByRole('combobox',{name:'Password action'});if(!await action.isVisible().catch(()=>false))await d.getByText('Passwords and permissions',{exact:true}).click();
  await action.selectOption('remove');await d.getByRole('textbox',{name:'Existing owner password'}).fill(saved.password+'-owner');
  await d.getByRole('button',{name:'Build verified PDF preview',exact:true}).click();await d.getByText(/Verified unprotected/).first().waitFor({timeout:120000});
  await expect(d.getByRole('button',{name:'Save verified PDF copy',exact:true})).toBeEnabled({timeout:120000});await saveAs(file);await d.getByRole('button',{name:'Save verified PDF copy',exact:true}).click();
  await page.getByText(new RegExp('Saved.*'+path.basename(file).replace('.','\.'))).first().waitFor({timeout:60000});await page.keyboard.press('Escape');await page.waitForTimeout(500);if(await page.locator('dialog[open]').count())await page.locator('dialog[open]').last().getByRole('button',{name:/^Close/}).first().click().catch(()=>{});
  await goHome();const info=await inspectPdf(file),problems=[];if(!info.ok)problems.push('does not open without a password: '+info.problem);else{if(info.pages!==3)problems.push(`expected 3 pages, found ${info.pages}`);if(!/welcome/i.test(info.text))problems.push('the original text is missing');}
  return {pass:!problems.length,problems,info:{pages:info.pages,sha256:info.sha256}};}},
 // One PDF page saved as a picture: the file must be a real PNG of a Letter page at 144 dpi (1224 x 1584 pixels).
 'save a PDF page as a picture':{when:w=>true,run:async()=>{if(world.view!=='home')await goHome();const file=path.join(files,`page-${++world.counter}.png`);await chooseFile(samplePdf);await startTool(/^PDF to images/,'PDF to images');const d=page.locator('dialog[open]').last();await d.waitFor({timeout:30000});
  await d.getByRole('button',{name:'Build image previews'}).click();await d.getByText(/Review the pages before saving/).first().waitFor({timeout:90000});
  await expect(d.getByRole('button',{name:'Save image copies',exact:true})).toBeEnabled({timeout:30000});await saveAs(file);await d.getByRole('button',{name:'Save image copies'}).click();
  await page.getByText(new RegExp('Saved.*'+path.basename(file).replace('.','\.'))).first().waitFor({timeout:60000});await page.keyboard.press('Escape');await page.waitForTimeout(500);if(await page.locator('dialog[open]').count())await page.locator('dialog[open]').last().getByRole('button',{name:/^Close/}).first().click().catch(()=>{});
  await goHome();const bytes=await fs.readFile(file),problems=[];const png=bytes.subarray(1,4).toString()==='PNG';if(!png)problems.push('not a PNG file');const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);if(png&&(width!==1224||height!==1584))problems.push(`expected 1224 x 1584 pixels, found ${width} x ${height}`);
  return {pass:!problems.length,problems,info:{width,height,sha256:hash(bytes),bytes:bytes.length}};}},
 // Fill and sign: a typed signature dragged onto page 1. The saved copy must open, keep 3 pages and carry the signature
 // (as text, or at least as new content), and the original must be unchanged.
 'sign a PDF with a typed name':{when:w=>true,run:async()=>{if(world.view!=='home')await goHome();const file=path.join(files,`signed-${++world.counter}.pdf`),name=`Robot Signer ${seed}`,before=hash(await fs.readFile(samplePdf));await chooseFile(samplePdf);await page.getByRole('button',{name:/^Fill and sign/}).first().click();const d=page.locator('dialog[open], .form-workspace.reader-page-tool-options').last();await d.waitFor({timeout:30000});
  const sheet=page.getByLabel(/^Rendered PDF page [0-9]+$/).first();await sheet.waitFor({timeout:60000});const kind=d.getByRole('combobox',{name:'Placement kind'});if(!await kind.isVisible().catch(()=>false))await d.getByText('Add a visual placement',{exact:true}).click();
  await kind.selectOption({label:'Signature'});await d.getByRole('combobox',{name:'Signature method'}).selectOption({label:'Type'});await d.getByRole('textbox',{name:'Placement text'}).fill(name);
  await sheet.evaluate(el=>{let p=el.parentElement;while(p&&!(p.scrollHeight>p.clientHeight+2&&/(auto|scroll)/.test(getComputedStyle(p).overflowY)))p=p.parentElement;if(!p)return;const r=el.getBoundingClientRect(),pr=p.getBoundingClientRect();p.scrollTop+=r.top+r.height*0.81-(pr.top+pr.height/2);});await page.waitForTimeout(300);const box=await sheet.boundingBox();await page.mouse.move(box.x+box.width*0.2,box.y+box.height*0.78);await page.mouse.down();await page.mouse.move(box.x+box.width*0.6,box.y+box.height*0.84,{steps:8});await page.mouse.up();
  const add=d.getByRole('button',{name:'Add at this location',exact:true});for(let i=0;i<20&&await add.isDisabled();i++)await page.waitForTimeout(200);await add.click();
  await d.getByRole('button',{name:'Preview filled copy',exact:true}).click();const save=d.getByRole('button',{name:'Save filled copy',exact:true});await save.waitFor({timeout:120000});
  await tickUntilEnabled(d,save);
  await saveAs(file);await save.click();await page.getByText(new RegExp('Saved.*'+path.basename(file).replace('.','\.'))).first().waitFor({timeout:90000});await page.keyboard.press('Escape');await page.waitForTimeout(500);if(await page.locator('dialog[open]').count())await page.locator('dialog[open]').last().getByRole('button',{name:/^Close/}).first().click().catch(()=>{});
  await goHome();const info=await inspectPdf(file),problems=[];if(!info.ok)problems.push(info.problem);else{if(info.pages!==3)problems.push(`expected 3 pages, found ${info.pages}`);if(!info.text.includes(name)&&info.sha256===before)problems.push('the signed copy is identical to the original');}
  if(hash(await fs.readFile(samplePdf))!==before)problems.push('the original PDF changed');return {pass:!problems.length,problems,info:{pages:info.pages,signatureAsText:!!info.text?.includes(name),sha256:info.sha256}};}},
 // Create fillable fields: one text box added by typed position. The saved copy must contain a form field of that name.
 'add a fillable text box':{when:w=>true,run:async()=>{if(world.view!=='home')await goHome();const file=path.join(files,`fillable-${++world.counter}.pdf`),field=`RobotField${world.counter}`;await chooseFile(samplePdf);
  await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();await page.getByRole('searchbox',{name:'Find a tool across workspaces'}).fill('Create fillable fields');await page.locator('.workspace-room-grid button,[role=tabpanel] button').filter({has:page.getByRole('heading',{name:'Create fillable fields'})}).first().click();
  const d=page.locator('dialog[open]').last();await d.waitFor({timeout:45000});const add=d.getByRole('button',{name:'Add reviewed field',exact:true});await add.waitFor({timeout:60000});await d.getByText(/already in the PDF/).first().waitFor({timeout:60000});await page.waitForTimeout(1000);
  await d.getByRole('textbox',{name:'Unique field name'}).fill(field);await d.getByRole('textbox',{name:'Label / tooltip'}).fill('Robot box');
  // Fields remembered from earlier in the session (the tool's saved recipe) stay, so each new one gets its own row.
  const position=[['Left',72],['Bottom',110+(world.counter%20)*30],['Width',220],['Height',24]];for(let attempt=0;attempt<3;attempt++){for(const [name,value] of position){const input=d.getByLabel(name,{exact:true});await input.fill(String(value));await input.press('Tab');}await page.waitForTimeout(300);let kept=true;for(const [name,value] of position)if(await d.getByLabel(name,{exact:true}).inputValue()!==String(value))kept=false;if(kept&&await d.getByRole('textbox',{name:'Unique field name'}).inputValue()===field)break;await d.getByRole('textbox',{name:'Unique field name'}).fill(field);await d.getByRole('textbox',{name:'Label / tooltip'}).fill('Robot box');}
  await add.click();await d.getByRole('button',{name:'Preview fillable copy',exact:true}).click();const save=d.getByRole('button',{name:'Save fillable copy',exact:true});await save.waitFor({timeout:120000});
  await tickUntilEnabled(d,save);
  await saveAs(file);await save.click();await page.getByText(new RegExp('Saved.*'+path.basename(file).replace('.','\.'))).first().waitFor({timeout:90000});await page.keyboard.press('Escape');await page.waitForTimeout(500);if(await page.locator('dialog[open]').count())await page.locator('dialog[open]').last().getByRole('button',{name:/^Close/}).first().click().catch(()=>{});
  await goHome();const info=await inspectPdf(file),problems=[];if(!info.ok)problems.push(info.problem);else{if(info.pages!==3)problems.push(`expected 3 pages, found ${info.pages}`);const names=await pdfFieldNames(file);if(!names.includes(field))problems.push(`form field "${field}" missing (found: ${names.join(', ')||'none'})`);}
  return {pass:!problems.length,problems,info:{pages:info.pages,sha256:info.sha256}};}},
 // Extract a table: the known 4 x 3 parts table is read into cells and exported as CSV; every cell must match.
 'extract a table to a spreadsheet file':{when:w=>hasTable,run:async()=>{if(world.view!=='home')await goHome();const file=path.join(files,`table-${++world.counter}.csv`),expected=[['Part','Qty','Note'],['Bolt M8','12','Zinc plated'],['Nut M8','30','Order more'],['Washer','45','In stock']];
  await chooseFile(sampleTable);await saveAs(file);await app.evaluate(({dialog})=>{dialog.showMessageBox=async(_w,o)=>{const b=(o??_w)?.buttons??['OK'];const yes=b.findIndex(l=>/save|continue|yes|ok/i.test(l));return {response:yes<0?0:yes,checkboxChecked:false};};});
  await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();await page.getByRole('searchbox',{name:'Find a tool across workspaces'}).fill('Extract a table');await page.locator('[role=tabpanel] button, .workspace-room-grid button').filter({has:page.getByRole('heading',{name:'Extract a table'})}).first().click();
  // Since d63549f the options sit beside the main PDF (region 'Extract a table options'); older packages use a window.
  const d=page.getByRole('region',{name:'Extract a table options',exact:true}).or(page.locator('dialog[open]')).last();await d.waitFor({timeout:45000});const read=d.getByRole('button',{name:'Read selectable words',exact:true});for(let i=0;i<120&&!await read.isEnabled().catch(()=>false);i++)await page.waitForTimeout(250);
  const set=async(name,value)=>{const input=d.getByRole('spinbutton',{name,exact:true});await input.fill(String(value));await input.press('Tab');};
  await set('Left %',((72-2)/612*100).toFixed(2));await set('Top %',((792-692-2)/792*100).toFixed(2));await set('Width %',((450+4)/612*100).toFixed(2));await set('Height %',((120+4)/792*100).toFixed(2));await set('Rows',4);await set('Columns',3);
  await read.click();await page.waitForTimeout(1500);for(const box of await d.getByRole('checkbox',{name:/review|checked|confirm/i}).all())if(await box.isVisible()&&await box.isEnabled()&&!await box.isChecked())await box.check();
  await d.getByRole('button',{name:/csv/i}).first().click();for(let i=0;i<120;i++){if(await fs.stat(file).then(st=>st.size>10,()=>false))break;await page.waitForTimeout(500);}await page.waitForTimeout(500);
  const close=d.getByRole('button',{name:/^Close/}).first();if(await close.isVisible().catch(()=>false))await close.click().catch(()=>{});else await page.keyboard.press('Escape');await page.waitForTimeout(500);if(await page.locator('dialog[open]').count())await page.locator('dialog[open]').last().getByRole('button',{name:/^Close/}).first().click().catch(()=>{});await goHome();
  const problems=[];let rows=[];try{rows=(await fs.readFile(file,'utf8')).replace(/^﻿/,'').trim().split(/\r?\n/).map(line=>line.split(',').map(cell=>cell.replace(/^"|"$/g,'').trim()));}catch{problems.push('no CSV file was saved');}
  if(rows.length&&JSON.stringify(rows)!==JSON.stringify(expected))problems.push('CSV is '+JSON.stringify(rows).slice(0,200));return {pass:!problems.length,problems,info:{rows:rows.length}};}},
 // Search selected files: "welcome" is in the sample PDF and not in the sample Word file. Nothing is saved, so the
 // visible results are checked: the PDF must be listed and the Word file must not be reported as a match.
 'search two files for a word':{when:w=>true,run:async()=>{if(world.view!=='home')await goHome();
  await app.evaluate(({dialog},list)=>{dialog.showOpenDialog=async(_w,o)=>({canceled:false,filePaths:(o??_w)?.properties?.includes('multiSelections')?list:[list[0]]});},[samplePdf,sampleDocx]);
  await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();await page.getByRole('searchbox',{name:'Find a tool across workspaces'}).fill('Search selected files');await page.locator('[role=tabpanel] button, .workspace-room-grid button').filter({has:page.getByRole('heading',{name:'Search selected files'})}).first().click();
  const d=page.locator('dialog[open]').last();await d.waitFor({timeout:30000});await d.getByRole('button',{name:'Choose files',exact:true}).click();await page.waitForTimeout(1500);
  const query=d.getByRole('searchbox',{name:'Word or phrase'}),run=d.getByRole('button',{name:'Search selected files',exact:true});await query.fill('welcome');for(let i=0;i<40&&await run.isDisabled();i++)await page.waitForTimeout(250);await run.click();
  const stop=d.getByRole('button',{name:'Stop',exact:true});for(let i=0;i<240&&!await stop.isDisabled().catch(()=>true);i++)await page.waitForTimeout(250);await page.waitForTimeout(600);
  const text=(await d.innerText()).replace(/\s+/g,' '),results=text.slice(text.indexOf('Stop')+4);await page.keyboard.press('Escape');await page.waitForTimeout(400);if(await page.locator('dialog[open]').count())await page.locator('dialog[open]').last().getByRole('button',{name:/^Close/}).first().click().catch(()=>{});await goHome();
  const problems=[];if(!/sample\.pdf/.test(results))problems.push('the PDF that contains "welcome" is not in the results');if(/sample\.docx[^.]{0,80}welcome/i.test(results))problems.push('the Word file is reported as containing "welcome"');
  return {pass:!problems.length,problems,info:{results:results.slice(0,200)}};}},
 // Email to document: a saved email with an attachment becomes an editable document. Its subject, sender and body must
 // come through and the attachment's contents must not; later exports then check the same text reached the file.
 'turn a saved email into a document':{when:w=>hasEmail,run:async()=>{if(world.view!=='home')await goHome();await chooseFile(sampleEmail);
  await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).click();await page.getByRole('searchbox',{name:'Find a tool across workspaces'}).fill('Create from email or clipboard');await page.locator('[role=tabpanel] button, .workspace-room-grid button').filter({has:page.getByRole('heading',{name:'Create from email or clipboard'})}).first().click();
  const d=page.locator('dialog[open]').last();await d.waitFor({timeout:30000});await d.getByRole('button',{name:'Choose a saved email',exact:true}).click();
  const review=d.getByRole('checkbox',{name:/I checked the text, pictures and their order/});for(let i=0;i<240&&!await review.isEnabled().catch(()=>false);i++)await page.waitForTimeout(250);await review.check();await d.getByRole('button',{name:'Create editable document',exact:true}).click();
  await editor().waitFor({timeout:30000});await editor().getByText('Hello Alex').first().waitFor({timeout:30000});const text=(await editor().innerText()).replace(/\s+/g,' ');
  world.view='editor';world.doc={text:['Hello Alex','meeting is at 10:00'],table:false,bold:false,from:'email'};const problems=[];
  for(const part of ['Site visit','dana@example.com','Hello Alex','café meeting is at 10:00'])if(!text.includes(part))problems.push(`"${part}" did not come through`);if(text.includes('ATTACHMENT-BODY'))problems.push('the attachment contents appeared in the document');
  return {pass:!problems.length,problems,info:{text:text.slice(0,160)}};}},
 // Make a scan searchable: a scanned page with no text gets recognized text. The saved copy must contain the scanned
 // sentences as real text, and the original scan must be unchanged.
 'make a scanned PDF searchable':{when:w=>hasScan,run:async()=>{const file=path.join(files,`searchable-${++world.counter}.pdf`),before=hash(await fs.readFile(sampleScan));await openFile(sampleScan);await page.getByLabel(/^Rendered PDF page [0-9]+$/).first().waitFor({timeout:60000});world.view='pdf';
  await showPdfTools('Edit');await page.getByRole('button',{name:/^Make (a )?scan searchable$/}).click();const d=page.locator('dialog[open]').last();await d.waitFor({timeout:30000});
  await d.getByRole('button',{name:'Start local OCR'}).click();await expect(d.getByRole('button',{name:'Preview searchable copy',exact:true})).toBeEnabled({timeout:120000});
  await d.getByRole('button',{name:'Preview searchable copy'}).click();const save=d.getByRole('button',{name:'Save searchable copy'});for(let i=0;i<240&&await save.isDisabled();i++)await page.waitForTimeout(250);
  await saveAs(file);await save.click();await page.getByText(/searchable/i).filter({hasText:/Reviewed OCR text/}).first().waitFor({timeout:60000});await d.getByRole('button',{name:'Close OCR workspace'}).click().catch(()=>page.keyboard.press('Escape'));await goHome();
  const info=await inspectPdf(file),problems=[];if(!info.ok)problems.push(info.problem);else{const flat=info.text.replace(/\s+/g,' ');if(!/Replace the oil every 5[,.]000 miles/i.test(flat))problems.push('the scanned sentence is not searchable text in the saved copy');if(!/Check the filter/i.test(flat))problems.push('the second scanned line is missing');}
  if(hash(await fs.readFile(sampleScan))!==before)problems.push('the original scan changed');return {pass:!problems.length,problems,info:{pages:info.pages,text:info.text?.slice(0,120)}};}},
 // Edit PDF text: one original line is replaced and a new line is added. The saved copy must have both new texts, the
 // replaced line must be gone, and the original PDF must be unchanged.
 'change and add text in a PDF':{when:w=>true,run:async()=>{if(world.view!=='home')await goHome();const file=path.join(files,`edited-${++world.counter}.pdf`),added=`Checked by robot ${seed}-${world.counter}`,replaced=`Welcome robot ${world.counter}`,before=hash(await fs.readFile(samplePdf));
  await chooseFile(samplePdf);await startTool(/^Edit PDF text and images/,'Edit PDF text and images');const d=page.getByRole('region',{name:'Edit PDF text options',exact:true}).or(page.locator('dialog[open]')).last();await d.waitFor({timeout:30000});
  const line=d.getByRole('button',{name:'Welcome to PDFix',exact:true});await line.waitFor({timeout:60000});await line.click();const replace=d.getByRole('textbox',{name:'Replace original PDF text'});await replace.fill(replaced);await replace.press('Tab');
  await d.getByRole('button',{name:'Add text',exact:true}).click();const box=d.getByRole('textbox',{name:'Added PDF text'});await box.fill(added);await box.press('Tab');const top=d.getByRole('spinbutton',{name:'Addition top'});await top.fill('70');await top.press('Tab');
  await d.getByRole('button',{name:'Build PDF preview',exact:true}).click();const save=d.getByRole('button',{name:/^save/i}).last();await save.waitFor({timeout:120000});
  for(let i=0;i<240&&await save.isDisabled();i++){for(const check of await d.getByRole('checkbox',{name:/checked|reviewed|confirm/i}).all())if(await check.isVisible()&&await check.isEnabled()&&!await check.isChecked())await check.check();await page.waitForTimeout(250);}await saveAs(file);await save.click();await page.getByText(new RegExp('Saved.*'+path.basename(file).replace('.','\.'))).first().waitFor({timeout:90000});
  const closer=d.getByRole('button',{name:'Close PDF content editor'});if(await closer.isVisible().catch(()=>false))await closer.click().catch(()=>{});else await page.keyboard.press('Escape');await page.waitForTimeout(500);if(await page.locator('dialog[open]').count())await page.locator('dialog[open]').last().getByRole('button',{name:/^Close/}).first().click().catch(()=>{});await goHome();
  const info=await inspectPdf(file),problems=[];if(!info.ok)problems.push(info.problem);else{const flat=info.text.replace(/\s+/g,' ');if(!flat.includes(added))problems.push('the added text is not in the saved copy');if(!flat.includes(replaced))problems.push('the replacement text is not in the saved copy');if(flat.includes('Welcome to PDFix'))problems.push('the replaced original line is still in the saved copy');if(info.pages!==3)problems.push(`expected 3 pages, found ${info.pages}`);}
  if(hash(await fs.readFile(samplePdf))!==before)problems.push('the original PDF changed');return {pass:!problems.length,problems,info:{pages:info.pages,text:info.text?.slice(0,120)}};}},
 // Redaction is about privacy, so the check is on the saved file: the word must be gone and every page kept.
 'hide a word with Redact':{when:w=>true,run:async()=>{if(world.view!=='home')await goHome();const file=path.join(files,`redacted-${++world.counter}.pdf`);await chooseFile(samplePdf);await startTool(/^Hide private information/,'Redact a PDF');const d=page.locator('dialog[open]').last();await d.waitFor({timeout:30000});
  const add=d.getByRole('button',{name:/^(Add a region|Add a box)$/});for(let waited=0;!(await add.isEnabled().catch(()=>false))&&waited<60000;waited+=250)await page.waitForTimeout(250);
  await d.getByRole('searchbox',{name:'Text to mark for redaction'}).fill('welcome');await d.getByRole('button',{name:'Find and mark this text'}).click();await d.getByText(/matching text runs? proposed/).first().waitFor({timeout:30000});
  await d.getByRole('button',{name:/^Build clean (redacted preview|copy to review)$/}).click();await d.getByText(/Verified/).first().waitFor({timeout:180000});
  await tick(d.getByRole('checkbox',{name:'I checked all redacted pages and marked regions'}));await saveAs(file);await d.getByRole('button',{name:'Save redacted PDF'}).click();
  await page.getByText(new RegExp('Saved.*'+path.basename(file).replace('.','\.'))).first().waitFor({timeout:90000});await page.keyboard.press('Escape');await page.waitForTimeout(500);if(await page.locator('dialog[open]').count())await page.locator('dialog[open]').last().getByRole('button',{name:/^Close/}).first().click().catch(()=>{});
  await goHome();const info=await inspectPdf(file),problems=[];if(!info.ok)problems.push(info.problem);else{if(info.pages!==3)problems.push(`expected 3 pages, found ${info.pages}`);if(/welcome/i.test(info.text))problems.push('the hidden word is still in the saved file');}
  return {pass:!problems.length,problems,info:{pages:info.pages,sha256:info.sha256}};}},
 'go Home':{when:w=>w.view!=='home',run:async()=>{await goHome();}}
};
// Jobs: longer pieces of work where PDFix ends suddenly in the middle (crash()), the way people lose work at a power
// cut. The robot then does what a person would to get back to it, checks that the work came back, finishes the job
// and inspects the finished file. ROBOT_NO_JOBS=1 leaves them out.
const jobs={
 'job: write a report, PDFix ends suddenly, continue it and save a Word copy':{when:w=>true,run:async()=>{
  if(world.view!=='home')await goHome();const n=++world.counter,before=`Site report ${seed}-${n} written before the crash`,after=`Finished after the crash ${seed}-${n}`;
  await page.getByRole('button',{name:'New document',exact:true}).click();await editor().waitFor({timeout:30000});await clickEditor();await page.keyboard.type(before);await page.waitForTimeout(3000);
  await crash();const problems=[];let found=false;
  // Home offers every unsaved new document; earlier jobs may have left some, so open each until this one is found.
  for(let i=0;i<6&&!found;i++){const offers=page.getByRole('button',{name:/^Continue /});await offers.first().waitFor({timeout:30000}).catch(()=>{});const count=await offers.count();if(i>=count)break;
   await offers.nth(i).click();await editor().waitFor({timeout:30000});if((await editor().innerText()).includes(before))found=true;else await goHome();}
  if(!found){problems.push('the report typed before the crash was not offered back on Home');return {pass:false,problems};}
  world.view='editor';await clickEditor();await page.keyboard.press('Control+End');await page.keyboard.press('Enter');await page.keyboard.type(after);
  world.doc={text:[before,after],table:false,bold:false,from:'new'};const file=path.join(files,`report-${n}.docx`);await saveAs(file);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await toastSays(path.basename(file));
  const result=await verifyOutput({file,kind:'docx',...expectFor(world.doc)});world.saved.push({file,kind:'docx',doc:structuredClone(world.doc)});return result;}},
 'job: sign a PDF, PDFix ends suddenly, finish signing and save':{when:w=>true,run:async()=>{
  if(world.view!=='home')await goHome();const n=++world.counter,file=path.join(files,`signed-after-crash-${n}.pdf`),name=`Robot Signer ${seed}-${n}`,before=hash(await fs.readFile(samplePdf));
  const open=async()=>{await chooseFile(samplePdf);await startTool(/^Fill and sign/,'Fill and sign');const d=page.locator('dialog[open], .form-workspace.reader-page-tool-options').last();await d.waitFor({timeout:30000});world.view='tool';
   const text=d.getByRole('textbox',{name:'Placement text',exact:true});if(!await text.isVisible().catch(()=>false))await d.getByText('Add a visual placement',{exact:true}).click();return d;};
  let d=await open();await d.getByRole('combobox',{name:'Placement kind'}).selectOption({label:'Signature'});await d.getByRole('combobox',{name:'Signature method'}).selectOption({label:'Type'});await d.getByRole('textbox',{name:'Placement text',exact:true}).fill(name);
  // The typed name is kept a moment after the last key (the status may already say kept from the earlier choices).
  await page.waitForTimeout(1500);await expect(d.locator('.form-status')).toContainText('kept on this computer',{timeout:30000});await crash();
  d=await open();const problems=[];
  // The tool checks the PDF first and puts recovered work back after that, so wait for it as a person would.
  await expect(d.getByRole('textbox',{name:'Placement text',exact:true})).toHaveValue(name,{timeout:30000}).catch(()=>{});const kept=await d.getByRole('textbox',{name:'Placement text',exact:true}).inputValue().catch(()=>'');if(kept!==name)problems.push(`the typed signature did not come back after the crash (found "${kept}")`);
  if(kept!==name){await d.getByRole('combobox',{name:'Placement kind'}).selectOption({label:'Signature'});await d.getByRole('combobox',{name:'Signature method'}).selectOption({label:'Type'});await d.getByRole('textbox',{name:'Placement text',exact:true}).fill(name);}
  const sheet=page.getByLabel(/^Rendered PDF page [0-9]+$/).first();await sheet.waitFor({timeout:60000});await sheet.evaluate(el=>{let p=el.parentElement;while(p&&!(p.scrollHeight>p.clientHeight+2&&/(auto|scroll)/.test(getComputedStyle(p).overflowY)))p=p.parentElement;if(!p)return;const r=el.getBoundingClientRect(),pr=p.getBoundingClientRect();p.scrollTop+=r.top+r.height*0.81-(pr.top+pr.height/2);});await page.waitForTimeout(300);const box=await sheet.boundingBox();await page.mouse.move(box.x+box.width*0.2,box.y+box.height*0.78);await page.mouse.down();await page.mouse.move(box.x+box.width*0.6,box.y+box.height*0.84,{steps:8});await page.mouse.up();
  const add=d.getByRole('button',{name:'Add at this location',exact:true});for(let i=0;i<20&&await add.isDisabled();i++)await page.waitForTimeout(200);await add.click();
  await d.getByRole('button',{name:'Preview filled copy',exact:true}).click();const save=d.getByRole('button',{name:'Save filled copy',exact:true});await save.waitFor({timeout:120000});await tickUntilEnabled(d,save);
  await saveAs(file);await save.click();await page.getByText(new RegExp('Saved.*'+path.basename(file).replace('.','\\.'))).first().waitFor({timeout:90000});await closeTool();
  const info=await inspectPdf(file);if(!info.ok)problems.push(info.problem);else{if(info.pages!==3)problems.push(`expected 3 pages, found ${info.pages}`);if(info.sha256===before)problems.push('the signed copy is identical to the original');}
  if(hash(await fs.readFile(samplePdf))!==before)problems.push('the original PDF changed');return {pass:!problems.length,problems,info:{pages:info.pages,signatureAsText:!!info.text?.includes(name),sha256:info.sha256}};}},
 'job: change a spreadsheet, PDFix ends suddenly, reopen it and save a copy':{when:w=>hasWorkbook,run:async()=>{
  if(world.view!=='home')await goHome();const n=++world.counter,file=path.join(files,`workbook-after-crash-${n}.xlsx`),value=String(1000+n%8000);
  const open=async()=>{await chooseFile(sampleWorkbook);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.getByLabel('Cell address',{exact:true}).waitFor({timeout:60000});world.view='office';
   await page.getByLabel('Cell address',{exact:true}).fill('B2');await page.getByRole('button',{name:'Go',exact:true}).click();const cell=page.getByLabel('Selected cell value',{exact:true});for(let i=0;i<40&&!/^[0-9]+$/.test(await cell.inputValue());i++)await page.waitForTimeout(250);return cell;};
  let cell=await open();await cell.fill(value);await page.getByRole('button',{name:'Apply value',exact:true}).click();await page.waitForTimeout(3000);await crash();
  cell=await open();const problems=[];const kept=await cell.inputValue();if(kept!==value){problems.push(`B2 shows ${kept} after the crash, expected the typed ${value}`);await cell.fill(value);await page.getByRole('button',{name:'Apply value',exact:true}).click();}
  if(!await unchanged(sampleWorkbook,workbookHash))problems.push('the original workbook changed');
  const save=page.getByRole('button',{name:'Save XLSX copy',exact:true});await expect(save).toBeEnabled({timeout:30000});for(let i=0;i<40&&await save.isDisabled();i++)await page.waitForTimeout(250);
  await saveAs(file);await save.click();for(let i=0;i<480&&!await fs.stat(file).then(s=>s.size>100,()=>false);i++)await page.waitForTimeout(250);await page.waitForTimeout(500);
  const info=await inspectXlsx(file);if(!info.ok)problems.push(info.problem);else{if(info.cells.B2?.value!==value)problems.push(`B2 is ${info.cells.B2?.value} in the saved copy, expected ${value}`);if(info.cells.D2?.formula!=='B2*C2')problems.push('the formula in D2 was lost');}
  await goHome();return {pass:!problems.length,problems,info:{sha256:info.sha256}};}}
};
if(process.env.ROBOT_NO_JOBS!=='1')Object.assign(actions,jobs);
// Tools no robot task had used before October 20: each is used the way a person would and its result is checked.
const folderAnswers=list=>app.evaluate(({dialog},queue)=>{dialog.showOpenDialog=async()=>{const next=queue.shift();return next?{canceled:false,filePaths:[next]}:{canceled:true,filePaths:[]};};},list);
Object.assign(actions,{
 // Watched folders: exact copies, run automatically. A PDF dropped into the folder must appear unchanged in the output.
 'watched folder: a new PDF gets an exact copy':{when:w=>true,run:async()=>{
  const n=++world.counter,source=path.join(files,`watch-in-${n}`),output=path.join(files,`watch-out-${n}`);await fs.mkdir(source);await fs.mkdir(output);
  const d=await openTool('Watched-folder workflows');await d.getByLabel('What to do with each new PDF').selectOption('copy');await d.getByLabel('When a new PDF arrives').selectOption('automatic');
  await folderAnswers([source,output]);await d.getByRole('button',{name:'Choose source and output folders',exact:true}).click();
  for(const name of [/I grant PDFix access/,/I approve this recipe/,/Save this consent/])await d.getByRole('checkbox',{name}).check();
  const approve=d.getByRole('button',{name:'Approve folder workflow',exact:true});for(let i=0;i<40&&await approve.isDisabled();i++)await page.waitForTimeout(250);await approve.click();await page.waitForTimeout(1500);
  const arrived=path.join(source,`arrived-${n}.pdf`);await fs.copyFile(samplePdf,arrived);const problems=[];let copy=null;
  for(let i=0;i<240&&!copy;i++){await page.waitForTimeout(250);const found=(await fs.readdir(output,{recursive:true}).catch(()=>[])).filter(name=>/\.pdf$/i.test(name));if(found.length)copy=path.join(output,found[0]);}
  if(!copy)problems.push('no copy appeared in the output folder within 60 seconds');else{await page.waitForTimeout(500);if(hash(await fs.readFile(copy))!==sampleHash)problems.push('the copy is not identical to the PDF that arrived');}
  if(hash(await fs.readFile(arrived))!==sampleHash)problems.push('the PDF in the watched folder was changed');
  await closeTool();return {pass:!problems.length,problems,info:{copy:copy&&path.basename(copy)}};}},
 // Synchronized file: a PDF chosen from a (synced) folder is reviewed and opened; the original stays as it was.
 'synchronized file: open a PDF from a synced folder':{when:w=>true,run:async()=>{
  const n=++world.counter,folder=path.join(files,`OneDrive-${n}`),file=path.join(folder,'site plan.pdf');await fs.mkdir(folder);await fs.copyFile(samplePdf,file);
  const d=await openTool('Open a synchronized file');await chooseFile(file);await d.getByRole('button',{name:'Choose a file',exact:true}).click();
  await d.getByRole('checkbox',{name:/I reviewed this source/}).check({timeout:30000});await d.getByRole('button',{name:'Open this file',exact:true}).click();
  const problems=[];await page.locator('.pdf-paper[data-ready="true"]').first().waitFor({timeout:60000}).catch(()=>problems.push('the PDF did not open in the reader'));world.view='reader';
  if(!problems.length&&!(await page.locator('.pdf-paper').first().innerText().catch(()=>'')).includes('clarity')&&!(await page.locator('.textLayer').first().innerText().catch(()=>'')).includes('clarity'))problems.push('the opened PDF does not show its text');
  if(hash(await fs.readFile(file))!==sampleHash)problems.push('the synchronized original changed');await goHome();return {pass:!problems.length,problems};}},
 // Clipboard: copied text becomes a new document. The clipboard on this PC is put back afterwards.
 'clipboard: copied text becomes a document and a Word copy':{when:w=>true,run:async()=>{
  const n=++world.counter,text=`Copied site note ${seed}-${n}: crane booked for Thursday`;const before=await app.evaluate(({clipboard})=>clipboard.readText()).catch(()=>'');
  try{await app.evaluate(({clipboard},t)=>clipboard.writeText(t),text);const d=await openTool('Create from email or clipboard');await d.getByRole('button',{name:'Clipboard text / screenshot',exact:true}).click();
   await d.getByRole('button',{name:'Paste clipboard now',exact:true}).click();await expect(d.locator('[role=status]').last()).toContainText('1 clipboard item(s) added',{timeout:30000});
   await d.getByRole('checkbox',{name:/I checked the text, pictures/}).check();await d.getByRole('button',{name:'Create editable document',exact:true}).click();await editor().waitFor({timeout:60000});}
  finally{await app.evaluate(({clipboard},t)=>clipboard.writeText(t),before).catch(()=>{});}
  world.view='editor';world.doc={text:[text],table:false,bold:false,from:'clipboard'};const file=path.join(files,`clipboard-${n}.docx`);await saveAs(file);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await toastSays(path.basename(file));
  const result=await verifyOutput({file,kind:'docx',...expectFor(world.doc)});world.saved.push({file,kind:'docx',doc:structuredClone(world.doc)});return result;}},
 // Links: the last typed word becomes a web link; the Word copy must carry that link on that word.
 'editor: link a word to a web address and save a Word copy':{when:w=>w.view==='editor'&&w.doc?.text.length,run:async()=>{
  const n=++world.counter,word=`Drawings${n}`,url=`https://example.com/site/${seed}-${n}`;await clickEditor();await page.keyboard.press('Control+End');await page.keyboard.press('Enter');await page.keyboard.type(word);await page.keyboard.press('Shift+Home');
  await page.keyboard.press('Control+k');const address=page.getByLabel('Web or email address');await address.waitFor({timeout:15000});await address.fill(url);await page.getByRole('button',{name:'Apply link',exact:true}).click();await page.waitForTimeout(400);
  world.doc.text.push(word);const file=path.join(files,`linked-${n}.docx`);await saveAs(file);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await toastSays(path.basename(file));
  const links=await docxHyperlinks(file),problems=[];if(!links.some(link=>link.target===url&&link.text.includes(word)))problems.push(`no link to ${url} on "${word}" (found ${JSON.stringify(links).slice(0,200)})`);world.saved.push({file,kind:'docx',doc:structuredClone(world.doc)});return {pass:!problems.length,problems,info:{links:links.length}};}},
 // Spelling: a misspelled word is found by the local Windows dictionaries and corrected from its suggestion.
 'editor: spell check corrects a misspelled word':{when:w=>w.view==='editor'&&w.doc,run:async()=>{
  const n=++world.counter;await clickEditor();await page.keyboard.press('Control+End');await page.keyboard.press('Enter');await page.keyboard.type(`The beams were recieved on site ${n}`);
  await page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name:'Review',exact:true}).click();await page.getByRole('button',{name:'Spell check',exact:true}).click();
  const panel=page.locator('.spell-check-workspace');await panel.getByRole('button',{name:'Check text',exact:true}).click({timeout:30000});const fix=panel.locator('.spelling-findings').getByRole('button',{name:'received',exact:true}).first();
  const problems=[];await fix.waitFor({timeout:60000}).catch(()=>problems.push('the misspelled word "recieved" was not found or offered "received"'));if(!problems.length){await fix.click();await page.waitForTimeout(400);}
  const text=await editor().innerText();if(!problems.length&&(!text.includes(`The beams were received on site ${n}`)||text.includes('recieved')))problems.push('the correction was not applied in the document');
  world.doc.text.push(problems.length?`The beams were recieved on site ${n}`:`The beams were received on site ${n}`);await page.keyboard.press('Escape');return {pass:!problems.length,problems};}},
 // Version history: keep a named version, change the text, restore the version; the newer text is kept as a version too.
 'editor: keep a version, change the text, then restore it':{when:w=>w.view==='editor'&&w.doc?.text.length,run:async()=>{
  const n=++world.counter,label=`Robot version ${seed}-${n}`,later=`Changed after the version ${seed}-${n}`;const fileTab=async()=>{const tab=page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name:'File',exact:true});if(await tab.getAttribute('aria-selected')!=='true')await tab.click();};
  // A version identical to the opened document is not listed again, so change something first, as a person would.
  await clickEditor();await page.keyboard.press('Control+End');await page.keyboard.press('Enter');const kept=`Kept in the version ${seed}-${n}`;await page.keyboard.type(kept);world.doc.text.push(kept);await page.waitForTimeout(1500);
  await fileTab();await page.getByRole('button',{name:'Version history',exact:true}).click();let dialog=page.locator('.version-history');await dialog.getByRole('textbox',{name:'Version name'}).fill(label);await dialog.getByRole('button',{name:'Save current version'}).click();
  await expect(dialog.locator('.version-status')).toContainText('state saved',{timeout:30000});await dialog.getByRole('button',{name:'Close version history'}).click();
  await clickEditor();await page.keyboard.press('Control+End');await page.keyboard.press('Enter');await page.keyboard.type(later);await page.waitForTimeout(1500);
  await fileTab();await page.getByRole('button',{name:'Version history',exact:true}).click();dialog=page.locator('.version-history');await dialog.getByRole('button',{name:new RegExp(label)}).click();await dialog.getByRole('button',{name:'Restore selected version'}).click();await page.waitForTimeout(800);
  const text=await editor().innerText(),problems=[];if(text.includes(later))problems.push('the text added after the version is still there after restoring');for(const piece of world.doc.text.slice(-2))if(!text.replace(/\s+/g,' ').includes(piece))problems.push(`text from the kept version is missing: "${piece}"`);
  return {pass:!problems.length,problems};}}
});
// Codex's reader, markup, Pages and drawing actions (scripts/user-robot/actions-codex.mjs) join the same random draw.
// They need pdf-lib; if the module cannot load (an older tester folder), the robot runs without them and says so.
// The next Save dialog is canceled (tasks that check a canceled save keeps the work and writes nothing).
const cancelSave=()=>app.evaluate(({dialog})=>{dialog.showSaveDialog=async()=>({canceled:true});});
// Generated scans for the large-scan task, made once per tester folder: the dad's drawing size (19.8 million pixels),
// 80 million, and one above the 100-million cap that must be refused with a message. No client drawings.
async function makeScanFixtures(folder){const {PDFDocument,PDFName}=await import('pdf-lib');await fs.mkdir(folder,{recursive:true});const list=[];
 for(const [name,width,height,refused] of [['dad-size-synthetic',6801,2911,false],['80-million',10000,8000,false],['above-cap',11000,10000,true]]){const file=path.join(folder,name+'.pdf');
  try{await fs.access(file);}catch{const pdf=await PDFDocument.create();for(const [w,h] of [[width,height],[100,100]]){const p=pdf.addPage([2592,1728]),c=pdf.context,img=c.register(c.flateStream(new Uint8Array(Math.ceil(w/8)*h),{Type:'XObject',Subtype:'Image',Width:w,Height:h,BitsPerComponent:1,ColorSpace:'DeviceGray'}));p.node.set(PDFName.of('Resources'),c.obj({XObject:{Im0:img}}));p.node.set(PDFName.of('Contents'),c.register(c.flateStream('q 2592 0 0 1728 0 0 cm /Im0 Do Q')));}await fs.writeFile(file,await pdf.save());}
  list.push({name,file,refused});}
 return list;}
const codexCtx={files:path.join(files,'codex'),profile,goHome:()=>goHome(),chooseFile,chooseFiles,saveAs,cancelSave,scanFixtures:[],
 // Copy-title actions check the name PDFix suggests in the save dialog (same helpers as tests/desktop/copy-title.spec.js).
 suggestedCopyDialog:(file,canceled)=>app.evaluate(({dialog},{file,canceled})=>{globalThis.lastCopySuggestion=null;dialog.showSaveDialog=async(_window,options)=>{globalThis.lastCopySuggestion=options.defaultPath;return{canceled,filePath:canceled?undefined:file};};},{file,canceled}),
 verifySuggestedCopy:async file=>{await expect.poll(()=>app.evaluate(()=>globalThis.lastCopySuggestion)).not.toBeNull();expect(path.basename(await app.evaluate(()=>globalThis.lastCopySuggestion))).toBe(path.basename(file));}};
if(process.env.ROBOT_LEGACY_UI!=='1')try{codexCtx.scanFixtures=await makeScanFixtures(path.join(files,'codex-scans'));}catch(error){console.log('Scan test files not made: '+String(error.message).slice(0,160));}
// ROBOT_SKIP_CODEX=1 leaves Codex's tasks out, for a build whose reader tool bar is newer than the copy of those tasks.
const addCodex=list=>{if(process.env.ROBOT_SKIP_CODEX==='1')return;for(const action of list){actions[action.name]={when:w=>true,run:async()=>{if(world.view!=='home')await goHome();await action.run(page,codexCtx);await page.keyboard.press('Escape').catch(()=>{});await goHome();return action.verify(codexCtx);}};weights[action.name]=action.weight||1;}};
try{const codex=await import('./actions-codex.mjs');addCodex([...codex.actions,...(codex.additionalActions||[])]);
 // Opt-in sets Codex verified for the new reader (mode button, grouped toolbars, Text/Table/Redact on the page, several
 // files at once). ROBOT_LEGACY_UI=1 leaves them out for an older package without that reader.
 if(process.env.ROBOT_LEGACY_UI!=='1')for(const key of ['batchActions','modeActions','textActions','tableActions','inlineRedactActions','ribbonActions','pagesRibbonActions','outputRibbonActions','editingRibbonActions','windowLayoutActions','viewRibbonActions','quickActions','savedCopyActions'])addCodex(codex[key]??[]);}
catch(error){console.log('Codex actions not loaded: '+String(error.message).slice(0,200));}
// Codex's drawing comment edits (standard callouts, rich-text comments) build their own sample PDFs; each set loads
// on its own, so a tester folder without one of them still runs everything else.
for(const [file,key] of [['./actions-codex-review.mjs','reviewActions'],['./actions-codex-richtext.mjs','richTextActions'],...(process.env.ROBOT_LEGACY_UI==='1'?[]:[['./actions-codex-document-mode.mjs','documentModeActions'],['./actions-codex-mixedtext.mjs','mixedTextActions'],['./actions-codex-scans.mjs','scanActions'],['./actions-codex-build-tabs.mjs','buildTabActions'],['./actions-codex-copy-title.mjs','copyTitleActions'],['./actions-codex-unified-draft-home.mjs','unifiedDraftHomeActions']])]){try{addCodex((await import(file))[key]??[]);}catch(error){console.log(`Codex actions from ${file} not loaded: `+String(error.message).slice(0,200));}}
// A save is confirmed by the old toast or by the saved-copy receipt ("Saved as <name>.") that replaced it.
async function toastSays(name){await toast().filter({hasText:'Saved '+name}).or(page.getByText('Saved as '+name+'.',{exact:true})).first().waitFor({timeout:60000});}

const log={seed,startedAt:new Date().toISOString(),steps:[],failures:[]};
const coverageFile=path.join(out,'coverage.json');let coverage={pairs:{},actions:{}};try{coverage=JSON.parse(await fs.readFile(coverageFile,'utf8'));}catch{}
let previous='start';
// Setup steps for ROBOT_ONLY, in an order that reaches every common starting point: an editor with text, a saved Word
// copy, then an open PDF.
const SETUP_STEPS=['new document','type a sentence','export Word copy','open the sample PDF'],usedSetup=new Set();
for(let i=0;i<steps;i++){
 // The random draw happens on replay too, so every later choice (which tool, which file) repeats exactly.
 const only=process.env.ROBOT_ONLY?new RegExp(process.env.ROBOT_ONLY,'i'):null;
 const drawn=pickAction(Object.keys(actions).filter(n=>actions[n].when(world)&&(!only||only.test(n))));
 // ROBOT_ONLY task whose starting point is not there yet (no document open, no saved Word copy, no PDF open): run the
 // next setup step first. Setup steps do not use up --steps, so "--steps 1" still runs the chosen task once.
 const setup=only&&!drawn&&!replay?SETUP_STEPS.find(n=>!usedSetup.has(n)&&actions[n].when(world)):null;
 if(only&&!drawn&&!replay&&!setup){console.log(`${String(i).padStart(2)} FAIL no setup step reaches the starting point of ${process.env.ROBOT_ONLY}`);log.failures.push({step:i,action:null,error:'no setup step reaches the chosen task'});break;}
 if(setup){usedSetup.add(setup);steps++;}
 const name=replay?replay.steps[i].action:drawn??setup;
 const started=Date.now(),step={i,action:name,...(setup?{setup:true}:{})};
 try{await closeRobotTabs(5).catch(()=>{});const result=await actions[name].run();step.ms=Date.now()-started;if(process.env.ROBOT_TRACE)step.trace=await editor().innerText({timeout:1000}).then(t=>t.replace(/\s+/g,' ').slice(0,300),()=>'(no editor)');
  if(result&&typeof result==='object'&&'pass' in result){step.verified=result.pass;if(result.info)step.info=result.info;if(!result.pass){step.problems=result.problems;throw new Error('saved file failed verification: '+result.problems.join('; '));}}
  else if(result)step.detail=result;step.ok=true;}
 catch(error){step.ok=false;step.error=error.message.split('\n')[0].slice(0,300);step.ms=Date.now()-started;const shot=path.join(out,`run-${seed}-step-${i}.png`);await page.screenshot({path:shot}).catch(()=>{});step.screenshot=path.relative(process.cwd(),shot);log.failures.push({step:i,action:name,after:previous,error:step.error});
  try{await goHome();}catch{world.view='unknown';}}
 // Which file is open after the step (the name in the document header), to spot tools that leave the person on the original after saving a copy.
 step.openFile=await page.evaluate(()=>document.querySelector('.document-title b')?.textContent.trim()||null).catch(()=>null);
 log.steps.push(step);const pair=`${previous} → ${name}`;coverage.pairs[pair]=coverage.pairs[pair]||{tried:0,failed:0};coverage.pairs[pair].tried++;if(!step.ok)coverage.pairs[pair].failed++;coverage.actions[name]=(coverage.actions[name]||0)+1;previous=name;
 console.log(`${String(i).padStart(2)} ${step.ok?'ok  ':'FAIL'} ${name}${step.detail?' ('+step.detail+')':''}${step.ok?'':' — '+step.error}`);
}
// The original sample files must be untouched however they were used.
if(!await unchanged(samplePdf,sampleHash))log.failures.push({step:'end',action:'original check',error:'the sample PDF was changed on disk'});
if(!await unchanged(samplePng,pngHash))log.failures.push({step:'end',action:'original check',error:'the sample picture was changed on disk'});
if(!await unchanged(sampleDocx,docxHash))log.failures.push({step:'end',action:'original check',error:'the sample Word file was changed on disk'});
if(offline){const tried=[...networkSeen,...await app.evaluate(()=>globalThis.__robotNetwork??[]).catch(()=>['(could not read the network record)'])];log.offline={attempts:tried};if(tried.length)log.failures.push({step:'end',action:'internet off',error:'the app tried to reach another computer: '+tried.slice(0,3).join(' | ')});}
if(pageErrors.length)log.failures.push({step:'end',action:'page errors',error:pageErrors.slice(0,3).join(' | ')});
log.finishedAt=new Date().toISOString();log.pass=!log.failures.length;
await fs.writeFile(path.join(out,`run-${seed}.json`),JSON.stringify(log,null,1));await fs.writeFile(coverageFile,JSON.stringify(coverage,null,1));
await Promise.race([app.close().catch(()=>{}),new Promise(r=>setTimeout(r,20000))]);
// ROBOT_KEEP_FILES=<folder>: keep every file the run saved (for opening in Acrobat and Office by hand).
if(process.env.ROBOT_KEEP_FILES){const keep=path.resolve(process.env.ROBOT_KEEP_FILES);await fs.mkdir(keep,{recursive:true});await fs.cp(files,keep,{recursive:true,force:false,errorOnExist:false}).catch(error=>console.log('Could not keep files: '+error.message));}
await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});
const possible=Object.keys(actions).length**2,tried=Object.keys(coverage.pairs).length;
console.log(`\nSeed ${seed}: ${log.steps.filter(s=>s.ok).length}/${steps} steps ok, ${log.failures.length} failure(s). Action pairs tried so far: ${tried} of up to ${possible}. Log: tmp/user-robot/run-${seed}.json`);
process.exit(log.pass?0:1);
