import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {build,preview} from 'vite';

const root=fileURLToPath(new URL('../',import.meta.url)),parent=path.resolve(process.argv[2]||path.join(root,'tmp'));
if(!process.argv[3])throw new Error('Usage: node scripts/check-reader-component.mjs OUTPUT_DIRECTORY NAVIGATION_FIXTURE_PDF (generate the fixture with check-reader-navigation.mjs first).');
const bytes=await fs.readFile(path.resolve(process.argv[3]));if(bytes.length>5*1024*1024)throw new Error('This component check accepts a generated fixture up to 5 MiB.');
const sourceHash=createHash('sha256').update(bytes).digest('hex');await fs.mkdir(parent,{recursive:true});const output=await fs.mkdtemp(path.join(parent,'reader-component-')),target=path.join(output,'preview');
const spec=file=>JSON.stringify(path.relative(output,path.join(root,file)).split(path.sep).join('/'));
await fs.writeFile(path.join(output,'index.html'),`<!doctype html><html><head><meta charset="utf-8"><title>PDFix actual reader component check</title><style>#app{display:block!important;width:100%;height:900px!important;padding:15px}#reader{width:100%;height:850px;display:flex;flex-direction:column}#other-editor{position:fixed;bottom:0;right:0;width:180px;background:white;z-index:50}</style></head><body><div id="app"><main id="reader"></main></div><div id="other-editor" contenteditable="true">Other editor</div><script type="module">
import {PdfReader} from ${spec('src/pdf-reader.js')};
import ${spec('src/style.css')};
import ${spec('src/text-layer.css')};
window.qaMessages=[];window.qaNativeCalls=[];
// Explicit test doubles for metadata/window interfaces; no native saving,
// grants, browser opening, containment or OS fullscreen is being tested.
window.pdfix={reading:async()=>({page:1,bookmarks:[]}),saveReading:async(id,state)=>{qaNativeCalls.push({method:'saveReading',page:state.page});},editorGuard:async()=>{},onWindowState:()=>()=>{},windowState:async()=>({fullscreen:false}),fullscreen:async fullscreen=>({fullscreen}),reviewPdfLink:async()=>{throw new Error('Native link opening is outside this test.');},cancelPdfLink:async()=>{}};
window.qaReady=(async()=>{
 const bytes=new Uint8Array(await(await fetch('./fixture.pdf')).arrayBuffer());const element=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
 const reader=new PdfReader(document.querySelector('#reader'),{id:'generated-reader-fixture',name:'Reader navigation fixture.pdf',bytes,size:bytes.length},{element,icon:()=>'<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16"/></svg>',announce:(message,error)=>qaMessages.push({message,error:!!error}),setGuard:()=>{}});
 window.qaReader=reader;await reader.open();await reader.navigationLoading;reader.setPane('thumbnails',true);
})();
</script></body></html>`);
const report={sourceHash,output,scope:'Actual PdfReader constructor, lifecycle, rendering, keyboard, search and reading-mode transitions with production CSS and PDF.js in headless Edge. Native metadata/window interfaces are test doubles; no Electron/native/security/save/fullscreen acceptance.',checks:[],errors:[]};
let browser,server,page;
try{
 await build({root:output,configFile:false,base:'./',build:{outDir:target,emptyOutDir:false,target:'es2022'},logLevel:'error'});await fs.writeFile(path.join(target,'fixture.pdf'),bytes);
 for(const directory of ['standard_fonts','cmaps','wasm','iccs']){const source=path.join(root,'node_modules/pdfjs-dist',directory);if(await fs.stat(source).catch(()=>null))await fs.cp(source,path.join(target,'pdf-assets',directory),{recursive:true});}
 server=await preview({root:output,configFile:false,build:{outDir:target},preview:{host:'127.0.0.1',port:5188,strictPort:true}});
 const {chromium}=createRequire(path.join(root,'package.json'))('playwright');browser=await chromium.launch({channel:'msedge',headless:true,timeout:20000});page=await browser.newPage({viewport:{width:1380,height:950}});page.setDefaultTimeout(20000);page.on('pageerror',error=>report.errors.push(error.message));
 await page.goto('http://127.0.0.1:5188',{waitUntil:'domcontentloaded'});await page.evaluate(()=>qaReady);
 const check=async(name,work)=>{await work();report.checks.push({name,pass:true});console.log('PASS '+name);};
 const ready=()=>page.waitForFunction(()=>qaReader.paper.dataset.ready==='true'&&!qaReader.activePageRenders);
 await check('Actual reader opens and renders the generated three-page PDF',async()=>{await ready();assert.equal(await page.evaluate(()=>qaReader.doc?.numPages),3);assert.equal(await page.evaluate(()=>qaReader.canvas.width>0&&qaReader.textLayer.textDivs.length>0),true);assert.deepEqual(await page.evaluate(()=>qaMessages.filter(x=>x.error)),[]);});
 await check('Actual reader search finds and highlights a source occurrence',async()=>{
  await page.locator('.page-stage').focus();await page.keyboard.press('Control+f');await page.locator('.pdf-query').fill('left upper');await page.locator('.pdf-query').press('Enter');await page.waitForFunction(()=>qaReader.find.complete);
  assert.equal(await page.evaluate(()=>qaReader.find.matches.length),4);await page.locator('.pdf-query').press('F3');await page.waitForFunction(()=>qaReader.pageNumber===3&&qaReader.find.activeRanges.length>0);await ready();
 });
 await check('Actual outline applies its named position and zoom',async()=>{
  await page.getByRole('tab',{name:'Outline',exact:true}).click();await page.getByRole('button',{name:'Named detail',exact:true}).click();await page.waitForFunction(()=>qaReader.pageNumber===1&&qaReader.zoom===2&&!qaReader.viewNavigation.busy);await ready();
  const point=await page.evaluate(()=>{const r=qaReader,p=r.paper.getBoundingClientRect(),s=r.stage.getBoundingClientRect();return r.viewNavigation.current.viewport.convertToPdfPoint(s.left+r.stage.clientLeft-p.left,s.top+r.stage.clientTop-p.top);});assert(Math.abs(point[0]-80)<1);assert(Math.abs(point[1]-500)<1);
 });
 await check('Actual page shortcuts work and another editor retains its keys',async()=>{
  await page.locator('.page-stage').focus();await page.keyboard.press('Control+End');await page.waitForFunction(()=>qaReader.pageNumber===3&&qaReader.paper.dataset.ready==='true');await ready();
  const other=page.locator('#other-editor');await other.focus();await other.press('ArrowRight');assert.equal(await page.evaluate(()=>qaReader.pageNumber),3);assert.equal(await other.evaluate(node=>node===document.activeElement),true);
  await page.locator('.page-stage').focus();await page.keyboard.press('Control+Home');await page.waitForFunction(()=>qaReader.pageNumber===1);await ready();
 });
 await check('Actual reader enters continuous/facing views and returns to exact outline navigation',async()=>{
  for(const mode of ['continuous','facing']){
   await page.evaluate(async mode=>{const r=qaReader;r.root.querySelector('.reading-view').value=mode;await r.changeReadingView(mode);},mode);
   assert.equal(await page.evaluate(()=>qaReader.multiPage.active),true);assert.equal(await page.evaluate(()=>qaReader.paper.hidden),true);
   await page.getByRole('button',{name:'Named detail',exact:true}).click();await page.waitForFunction(()=>qaReader.readingView==='page'&&!qaReader.viewNavigation.busy);await ready();assert.equal(await page.evaluate(()=>qaReader.multiPage.active),false);
  }
 });
 await check('Actual readable view preserves column order and source match navigation',async()=>{
  await page.evaluate(async()=>{const r=qaReader;await r.go(3);r.readableView.settings.order='two';r.root.querySelector('.reading-view').value='text';await r.changeReadingView('text');});
  const paragraphs=await page.evaluate(()=>[...qaReader.readable.querySelectorAll('p')].filter(p=>p.pdfSourceRuns).map(p=>p.textContent));assert.equal(paragraphs[8],'Middle section');assert.match(paragraphs[0],/^maintenance left upper 1$/);
  await page.evaluate(async()=>{await qaReader.find.search('left lower');await qaReader.find.select(0);});assert.equal(await page.evaluate(()=>qaReader.paper.hidden),true);assert.equal(await page.evaluate(()=>qaReader.find.selected),0);
  const highlights=await page.evaluate(()=>{const r=qaReader;return {text:r.find.activeRanges.map(range=>range.toString()).join(''),paragraph:r.find.activeRanges[0]?.startContainer.parentElement.textContent,registered:CSS.highlights.get(r.find.readableActiveName)?.size,color:getComputedStyle(r.find.activeRanges[0].startContainer.parentElement,'::highlight('+r.find.readableActiveName+')').color};});assert.equal(highlights.text,'left lower');assert.match(highlights.paragraph,/left lower 1/);assert(highlights.registered>0);assert.notEqual(highlights.color,'rgba(0, 0, 0, 0)');
  await page.getByLabel('Reading order',{exact:true}).selectOption('rows');assert.equal(await page.evaluate(()=>qaReader.find.activeRanges.map(range=>range.toString()).join('')),'left lower');
  await page.getByLabel('Reading order',{exact:true}).selectOption('two');
  await page.screenshot({path:path.join(output,'actual-reader-readable.png')});
 });
 await check('Actual outline returns from readable mode and previous view restores it',async()=>{
  await page.getByRole('button',{name:'Named detail',exact:true}).click();await page.waitForFunction(()=>qaReader.readingView==='page'&&!qaReader.viewNavigation.busy);await ready();
  await page.evaluate(()=>qaReader.viewNavigation.move(-1));assert.equal(await page.evaluate(()=>qaReader.readingView), 'text');assert.equal(await page.evaluate(()=>qaReader.pageNumber),3);await ready();
 });
 await check('Window resizing preserves exact destinations and fit-page rendering',async()=>{
  await page.evaluate(async()=>{const r=qaReader;r.root.querySelector('.reading-view').value='page';await r.changeReadingView('page');});
  for(const width of [900,1100,1380]){
   await page.setViewportSize({width,height:950});
   await page.evaluate(async()=>{const r=qaReader;r.fit=true;r.fitPage=true;await r.renderPage();await r.navigation.goDestination('detail');});
   await ready();const point=await page.evaluate(()=>{const r=qaReader,p=r.paper.getBoundingClientRect(),s=r.stage.getBoundingClientRect();return {page:r.pageNumber,zoom:r.zoom,point:r.viewNavigation.current.viewport.convertToPdfPoint(s.left+r.stage.clientLeft-p.left,s.top+r.stage.clientTop-p.top)};});
   assert.equal(point.page,1);assert.equal(point.zoom,2);assert(Math.abs(point.point[0]-80)<1);assert(Math.abs(point.point[1]-500)<1);
  }
 });
 await check('Fit-page settles after resize without recurring loading-banner renders',async()=>{
  await page.evaluate(async()=>{const r=qaReader;await r.go(3);await r.action('fit-page');});await ready();
  for(const width of [800,1100,1380]){
   await page.setViewportSize({width,height:950});await ready();await page.waitForTimeout(550);await ready();
   const before=await page.evaluate(()=>qaReader.version);await page.waitForTimeout(450);
   const state=await page.evaluate(()=>{const r=qaReader,p=r.paper.getBoundingClientRect(),s=r.stage.getBoundingClientRect();return {version:r.version,fit:r.fit,fitPage:r.fitPage,ready:r.paper.dataset.ready,inside:p.left>=s.left&&p.right<=s.right+1&&p.top>=s.top&&p.bottom<=s.bottom+1};});
   assert.equal(state.version,before);assert(state.fit&&state.fitPage&&state.inside);assert.equal(state.ready,'true');
  }
 });
 await check('Rapid page requests keep the final page and supersede delayed destinations',async()=>{
  await page.evaluate(async()=>{const r=qaReader;await Promise.all([r.go(1),r.go(2),r.go(3),r.go(2),r.go(3)]);});await ready();
  assert.deepEqual(await page.evaluate(()=>({page:qaReader.pageNumber,rendered:qaReader.viewNavigation.current.page,ready:qaReader.paper.dataset.page})),{page:3,rendered:3,ready:'3'});
  const result=await page.evaluate(async()=>{const r=qaReader,doc=r.doc,original=doc.getDestination;let release;const pending=new Promise(resolve=>{release=resolve;});doc.getDestination=()=>pending;
   try{const jump=r.navigation.goDestination('delayed-fixture').then(()=>({canceled:false}),error=>({canceled:true,message:error.message}));await r.go(2);release([0,{name:'XYZ'},80,500,2]);const status=await jump;return {...status,page:r.pageNumber,rendered:r.viewNavigation.current.page};}finally{doc.getDestination=original;}
  });assert(result.canceled);assert.equal(result.page,2);assert.equal(result.rendered,2);
 });
 await check('A page without selectable text keeps its warning and stable fit-page layout',async()=>{
  await page.evaluate(async()=>{const r=qaReader,p=await r.doc.getPage(2);window.qaOriginalText={page:p,getTextContent:p.getTextContent};p.getTextContent=async()=>({items:[],styles:{}});await r.go(2);await r.action('fit-page');});
  try{await ready();await page.setViewportSize({width:1100,height:950});await page.waitForTimeout(550);await ready();
   const before=await page.evaluate(()=>qaReader.version);await page.waitForTimeout(450);
   const state=await page.evaluate(()=>({version:qaReader.version,warning:!qaReader.message.hidden&&qaReader.message.textContent.includes('No selectable text'),ready:qaReader.paper.dataset.ready}));assert.equal(state.version,before);assert(state.warning);assert.equal(state.ready,'true');
  }finally{await page.evaluate(async()=>{const original=window.qaOriginalText;original.page.getTextContent=original.getTextContent;delete window.qaOriginalText;await qaReader.go(2);});}
 });
 await check('Source bytes remain unchanged and reader disposal releases its document',async()=>{
  const hash=await page.evaluate(async()=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',qaReader.file.bytes))].map(x=>x.toString(16).padStart(2,'0')).join(''));assert.equal(hash,sourceHash);
  await page.evaluate(()=>qaReader.dispose());assert.equal(await page.evaluate(()=>qaReader.disposed),true);assert.equal(await page.evaluate(()=>qaReader.canvas.width),0);
 });
 assert.equal(createHash('sha256').update(await fs.readFile(path.join(target,'fixture.pdf'))).digest('hex'),sourceHash);assert.deepEqual(report.errors,[]);report.messages=await page.evaluate(()=>qaMessages);assert.deepEqual(report.messages.filter(x=>x.error),[]);report.pass=true;
}catch(error){report.pass=false;report.error=error.stack;console.error(error.stack);process.exitCode=1;if(page){report.messages=await page.evaluate(()=>window.qaMessages).catch(()=>[]);report.readerState=await page.evaluate(()=>{const r=window.qaReader;return r?{page:r.pageNumber,mode:r.readingView,ready:r.paper.dataset.ready,active:r.activePageRenders,multiUpdating:r.multiPage.updating,busy:r.viewNavigation.busy,fit:r.fit,fitPage:r.fitPage,version:r.version,stage:[r.stage.clientWidth,r.stage.clientHeight],message:r.message.textContent}:null;}).catch(()=>null);await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});}}
finally{await browser?.close();if(server)await new Promise(resolve=>server.httpServer.close(resolve));await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,report:path.join(output,'report.json'),checks:report.checks,errors:report.errors,messages:report.messages}));}
