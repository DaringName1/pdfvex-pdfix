import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {build,preview} from 'vite';
import {PDFDocument,StandardFonts,degrees} from 'pdf-lib';

const root=fileURLToPath(new URL('../',import.meta.url));
const parent=path.resolve(process.argv[2]||path.join(root,'tmp'));
await fs.mkdir(parent,{recursive:true});
const output=await fs.mkdtemp(path.join(parent,'reader-search-'));
const target=path.join(output,'preview');
const spec=(file,suffix='')=>JSON.stringify(path.relative(output,path.join(root,file)).split(path.sep).join('/')+suffix);
const fixture=await PDFDocument.create(),regular=await fixture.embedFont(StandardFonts.Helvetica),bold=await fixture.embedFont(StandardFonts.HelveticaBold);
for(let index=0;index<2;index++){
  const page=fixture.addPage([612,792]);
  if(index)page.setRotation(degrees(90));
  for(const y of index?[720]:[720,590]){
    page.drawText('main',{x:45,y,font:bold,size:22});
    page.drawText('tenance',{x:45+bold.widthOfTextAtSize('main',22),y,font:regular,size:22});
    page.drawText('review',{x:220,y,font:regular,size:22});
  }
}
const bytes=await fixture.save(),sourceHash=createHash('sha256').update(bytes).digest('hex');
await fs.writeFile(path.join(output,'index.html'),`<!doctype html><html><head><meta charset="utf-8"><title>PDFix reader search verification</title><style>body{margin:0;font:14px Arial}#reader{display:flex;height:900px;gap:15px}.page-stage{height:850px;width:900px;overflow:auto}.pdf-paper{position:relative;width:max-content}.textLayer{position:absolute;inset:0}.search-results{max-width:300px}button{padding:8px}aside{width:320px}.readable-page[hidden]{display:none}</style></head><body><div id="reader"><div class="page-stage"><div class="pdf-paper"><canvas></canvas><div class="textLayer"></div></div><article class="readable-page" hidden></article></div><aside><input class="pdf-query"><p class="search-status"></p><div class="search-results"></div></aside></div><script type="module">
import {PdfSearch,pdfSearchText} from ${spec('src/pdf-search.js')};
import {PdfReadableView,pdfReadableText} from ${spec('src/pdf-readable-view.js')};
import {createPdfReaderKeyHandler} from ${spec('src/pdf-reader-keyboard.js')};
import * as pdfjs from ${spec('node_modules/pdfjs-dist/build/pdf.mjs')};
import worker from ${spec('node_modules/pdfjs-dist/build/pdf.worker.mjs','?url')};
</script></body></html>`);
let html=await fs.readFile(path.join(output,'index.html'),'utf8');
html=html.replace('</script>',`
import ${spec('node_modules/pdfjs-dist/web/pdf_viewer.css')};
pdfjs.GlobalWorkerOptions.workerSrc=worker;
const root=document.querySelector('#reader'),paper=root.querySelector('.pdf-paper'),stage=root.querySelector('.page-stage');
const element=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
window.qaReady=(async()=>{
 const task=pdfjs.getDocument({url:'./fixture.pdf',standardFontDataUrl:'./pdf-assets/standard_fonts/',isEvalSupported:false});
 const doc=await task.promise;
 const reader={root,paper,stage,layer:paper.querySelector('.textLayer'),readable:root.querySelector('.readable-page'),queryId:'qa',doc,copyAllowed:true,pageNumber:1,index:new Map(),results:root.querySelector('.search-results'),element,announce:message=>{window.qaMessages.push(message);},navigation:{reference:n=>'Page '+n},cacheText(n,text){this.index.set(n,text);},singlePageView:async()=>{}};
 window.qaMessages=[];reader.find=new PdfSearch(reader);reader.readableView=new PdfReadableView(reader);reader.file={};reader.setPane=()=>{};reader.keyHandler=createPdfReaderKeyHandler(reader);document.addEventListener('keydown',reader.keyHandler);
 reader.go=async n=>{
  reader.textLayer?.cancel();reader.layer.replaceChildren();reader.pageNumber=n;paper.dataset.ready='false';
  const page=await doc.getPage(n),viewport=page.getViewport({scale:1});const canvas=paper.querySelector('canvas');canvas.width=viewport.width;canvas.height=viewport.height;
  paper.style.width=viewport.width+'px';paper.style.height=viewport.height+'px';paper.style.setProperty('--scale-factor',viewport.scale);paper.style.setProperty('--total-scale-factor',viewport.scale*viewport.userUnit);paper.style.setProperty('--user-unit',viewport.userUnit);reader.layer.style.width=viewport.width+'px';reader.layer.style.height=viewport.height+'px';
  await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
  const content=await page.getTextContent();reader.content=content;reader.sourcePage=page;reader.readableOutput=pdfReadableText(content,page,'content').output;reader.cacheText(n,pdfSearchText(content));
  reader.textLayer=new pdfjs.TextLayer({textContentSource:content,container:reader.layer,viewport});await reader.textLayer.render();paper.dataset.ready='true';reader.find.rendered(content);
 };
 await reader.go(1);window.qaReader=reader;window.qaTask=task;
})();
</script>`);
await fs.writeFile(path.join(output,'index.html'),html);
const report={sourceHash,checks:[],errors:[],screenshots:[],output,scope:'Actual PDF.js extraction, PDF rendering, search occurrence selection and DOM highlight ranges in a headless browser. No native save, desktop containment or full-reader acceptance is claimed.'};
let server,browser,page;
try{
 await build({root:output,configFile:false,base:'./',build:{outDir:target,emptyOutDir:false,target:'es2022'},logLevel:'error'});
 await fs.writeFile(path.join(target,'fixture.pdf'),bytes);
 await fs.cp(path.join(root,'node_modules/pdfjs-dist/standard_fonts'),path.join(target,'pdf-assets/standard_fonts'),{recursive:true});
 server=await preview({root:output,configFile:false,build:{outDir:target},preview:{host:'127.0.0.1',port:5186,strictPort:true}});
 const {chromium}=createRequire(path.join(root,'package.json'))('playwright');
 browser=await chromium.launch({channel:'msedge',headless:true,timeout:20000});page=await browser.newPage({viewport:{width:1320,height:920}});page.setDefaultTimeout(15000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5186',{waitUntil:'domcontentloaded'});await page.evaluate(()=>window.qaReady);
 const check=async(name,work)=>{await work();report.checks.push({name,pass:true});console.log('PASS '+name);};
 await check('Real source has adjacent split-word fragments and explicit word spacing',async()=>{
  const result=await page.evaluate(()=>({items:qaReader.content.items.filter(x=>typeof x.str==='string').map(x=>({str:x.str,hasEOL:x.hasEOL})),text:qaReader.index.get(1)}));
  report.extraction=result;assert(result.items.some(x=>x.str==='main'));assert(result.items.some(x=>x.str==='tenance'));assert.match(result.text,/maintenance review/);assert.doesNotMatch(result.text,/main tenance/);
 });
 await check('Readable content sequence retains the same complete words and source lines',async()=>{
  const output=await page.evaluate(()=>qaReader.readableOutput);assert.deepEqual(output,['maintenance review','maintenance review']);
 });
 await check('Search finds all three occurrences, including the rotated second page',async()=>{
  const found=await page.evaluate(async()=>{await qaReader.find.search('maintenance');return qaReader.find.matches.map(x=>({page:x.page,start:x.start}));});assert.equal(found.length,3);assert.deepEqual(found.map(x=>x.page),[1,1,2]);
 });
 await check('Active match highlights both source fragments and advances within a page',async()=>{
  const result=await page.evaluate(async()=>{await qaReader.find.select(0);const first=qaReader.find.activeRanges.map(r=>r.toString());await qaReader.find.move(1);return {first,next:qaReader.find.activeRanges.map(r=>r.toString()),selected:qaReader.find.selected};});assert.deepEqual(result.first,['main','tenance']);assert.deepEqual(result.next,['main','tenance']);assert.equal(result.selected,1);
  await page.screenshot({path:path.join(output,'split-word-active.png')});report.screenshots.push('split-word-active.png');
 });
 await check('Next match renders and highlights the rotated page, then wraps',async()=>{
  const result=await page.evaluate(async()=>{await qaReader.find.move(1);const rotated={page:qaReader.pageNumber,ranges:qaReader.find.activeRanges.map(r=>r.toString())};await qaReader.find.move(1);return {rotated,wrappedPage:qaReader.pageNumber,selected:qaReader.find.selected};});assert.equal(result.rotated.page,2);assert.deepEqual(result.rotated.ranges,['main','tenance']);assert.equal(result.wrappedPage,1);assert.equal(result.selected,0);
 });
 await check('A phrase spanning style fragments and actual spacing uses matching highlight offsets',async()=>{
  const result=await page.evaluate(async()=>{await qaReader.find.search('maintenance review');await qaReader.find.select(0);return {count:qaReader.find.matches.length,parts:qaReader.find.activeRanges.map(r=>r.toString())};});assert.equal(result.count,3);assert.equal(result.parts.join('').replace(/\s/g,''),'maintenancereview');
 });
 await check('Readable search scrolls to the selected source paragraph without a canvas text layer',async()=>{
  const result=await page.evaluate(async()=>{
   const r=qaReader;r.paper.hidden=true;r.readable.hidden=false;r.layer.replaceChildren();r.textLayer=null;
   const seen=[];
   for(const order of ['content','rows','two']){
    r.readableView.settings.order=order;r.readableView.render(r.content,r.sourcePage,1);
    const paragraphs=[...r.readable.querySelectorAll('p')].filter(p=>p.pdfSourceRuns);
    let target=-1;paragraphs.forEach((p,index)=>{const scroll=p.scrollIntoView.bind(p);p.scrollIntoView=options=>{target=index;scroll(options);};});
    r.find.rendered(r.content);await r.find.select(1);
    seen.push({order,target,expected:paragraphs.findIndex(p=>p.pdfSourceRuns.has(r.find.model.segments.find(s=>s.start<=r.find.matches[1].start&&s.end>r.find.matches[1].start).run)),parts:r.find.activeRanges.map(range=>range.toString()),correctParagraph:r.find.activeRanges.every(range=>range.startContainer.parentElement===paragraphs[target]),registered:CSS.highlights.get(r.find.readableActiveName)?.size});
   }
   r.readable.hidden=true;r.paper.hidden=false;await r.go(1);return seen;
  });
  for(const item of result){assert(item.target>=0);assert.equal(item.target,item.expected);assert.equal(item.parts.join('').replace(/\s/g,''),'maintenancereview');assert(item.correctParagraph);assert.equal(item.registered,item.parts.length);}assert.equal(result[0].target,1);assert.equal(result[1].target,1);
 });
 await check('A match omitted by a regional readable layout has an actionable explanation',async()=>{
  const messages=await page.evaluate(async()=>{
   const r=qaReader;qaMessages.length=0;r.paper.hidden=true;r.readable.hidden=false;r.layer.replaceChildren();r.textLayer=null;
   r.readableView.settings.order='right';r.readableView.render(r.content,r.sourcePage,1);r.find.rendered(r.content);await r.find.select(0);
   const messages=[...qaMessages];r.readable.hidden=true;r.paper.hidden=false;await r.go(1);return messages;
  });assert(messages.some(message=>/not shown in the current readable layout/.test(message)&&/PDF content sequence/.test(message)));
 });
 await check('Readable Unicode offsets, repeated words and highlight fallback preserve paragraph text',async()=>{
  const result=await page.evaluate(async()=>{
   const r=qaReader,content={items:[{str:'  İ😀 repeated repeated  ',hasEOL:true}]},originalHighlight=window.Highlight;
   r.paper.hidden=true;r.readable.hidden=false;r.textLayer=null;r.readableView.settings.order='content';r.readableView.render(content,r.sourcePage,1);r.find.rendered(content);
   r.find.query='i\u0307😀';r.find.matches=[{page:1,start:0,end:4}];r.find.selected=0;r.find.highlight();const unicode=r.find.activeRanges.map(range=>range.toString());
   const start=r.find.model.text.lastIndexOf('repeated');r.find.query='repeated';r.find.matches=[{page:1,start,end:start+8}];r.find.highlight();const offset=r.find.activeRanges[0].startOffset;
   const paragraph=r.readable.querySelector('p[dir="auto"]'),before=paragraph.textContent;
   try{window.Highlight=undefined;r.find.highlight();}finally{window.Highlight=originalHighlight;}
   const fallback=paragraph.classList.contains('search-active'),after=paragraph.textContent;
   r.copyAllowed=false;r.find.highlight();const cleared=!paragraph.classList.contains('search-active')&&r.find.activeRanges.length===0&&!CSS.highlights.has(r.find.readableActiveName);r.copyAllowed=true;
   r.readable.hidden=true;r.paper.hidden=false;await r.go(1);return {unicode,offset,before,after,fallback,cleared};
  });assert.deepEqual(result.unicode,['İ😀']);assert.equal(result.offset,13);assert.equal(result.before,result.after);assert(result.fallback);assert(result.cleared);
 });
 await check('Stop immediately settles a delayed page search and retains earlier matches',async()=>{
  await page.evaluate(()=>{
   const r=qaReader;r.index.delete(2);window.qaOriginalGetPage=r.doc.getPage.bind(r.doc);
   const delayed=new Promise(resolve=>{window.qaReleasePage=resolve;});r.doc.getPage=n=>n===2?delayed:qaOriginalGetPage(n);
   window.qaPendingSearch=r.find.search('maintenance');
  });
  await page.waitForFunction(()=>qaReader.find.searching&&qaReader.find.matches.length===2);
  await page.locator('.pdf-query').focus();await page.keyboard.press('Escape');
  const stopped=await page.evaluate(async()=>{await qaPendingSearch;return {searching:qaReader.find.searching,count:qaReader.find.matches.length,complete:qaReader.find.complete,cachedLater:qaReader.index.has(2),status:qaReader.root.querySelector('.search-status').textContent};});
  assert.equal(stopped.searching,false);assert.equal(stopped.count,2);assert.equal(stopped.complete,false);assert.equal(stopped.cachedLater,false);assert.match(stopped.status,/later pages have not been searched/);
 });
 await check('A new search survives the old delayed request without stale results',async()=>{
  const result=await page.evaluate(async()=>{
   const next=qaReader.find.search('review');
   qaReleasePage(await qaOriginalGetPage(2));qaReader.doc.getPage=qaOriginalGetPage;await next;
   return {query:qaReader.find.query,count:qaReader.find.matches.length,complete:qaReader.find.complete};
  });assert.equal(result.query,'review');assert.equal(result.count,3);assert.equal(result.complete,true);
 });
 await check('Ctrl+F and F3/Shift+F3 navigate the actual PDF search occurrences',async()=>{
  await page.evaluate(()=>qaReader.stage.focus());await page.keyboard.press('Control+f');assert.equal(await page.locator('.pdf-query').evaluate(input=>input===document.activeElement),true);
  await page.keyboard.press('F3');await page.waitForFunction(()=>qaReader.find.selected===0);
  await page.keyboard.press('F3');await page.waitForFunction(()=>qaReader.find.selected===1);
  await page.keyboard.press('Shift+F3');await page.waitForFunction(()=>qaReader.find.selected===0);
 });
 assert.equal(createHash('sha256').update(await fs.readFile(path.join(target,'fixture.pdf'))).digest('hex'),sourceHash);assert.deepEqual(report.errors,[]);report.pass=true;
 await page.evaluate(async()=>{document.removeEventListener('keydown',qaReader.keyHandler);qaReader.find.dispose();await qaTask.destroy();});
}catch(error){report.pass=false;report.error=error.stack;console.error(error.message);process.exitCode=1;if(page)await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});}
finally{await browser?.close();if(server)await new Promise(resolve=>server.httpServer.close(resolve));await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,report:path.join(output,'report.json'),checks:report.checks,errors:report.errors}));}
