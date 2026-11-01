import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {build,preview} from 'vite';
import {PDFDocument,StandardFonts,PDFName,PDFString,PDFNumber,degrees,rgb} from 'pdf-lib';

const root=fileURLToPath(new URL('../',import.meta.url)),parent=path.resolve(process.argv[2]||path.join(root,'tmp'));
await fs.mkdir(parent,{recursive:true});
const output=await fs.mkdtemp(path.join(parent,'reader-navigation-')),target=path.join(output,'preview');
const spec=(file,suffix='')=>JSON.stringify(path.relative(output,path.join(root,file)).split(path.sep).join('/')+suffix);
const fixture=await PDFDocument.create(),font=await fixture.embedFont(StandardFonts.Helvetica),bold=await fixture.embedFont(StandardFonts.HelveticaBold);
const first=fixture.addPage([612,792]),second=fixture.addPage([612,792]),columns=fixture.addPage([612,792]);
first.drawText('Named destination detail',{x:80,y:500,font,size:20});
second.setRotation(degrees(90));second.setCropBox(20,30,560,720);second.node.set(PDFName.of('UserUnit'),PDFNumber.of(2));
second.drawText('Rotated cropped detail',{x:100,y:450,font,size:20});
second.drawRectangle({x:100,y:150,width:200,height:300,borderWidth:2,borderColor:rgb(0,.35,.8)});
for(const [section,y] of [['upper',730],['lower',550]])for(let i=0;i<4;i++){
 columns.drawText('right '+section+' '+(i+1),{x:350,y:y-i*25,font,size:14});
 if(i===0){columns.drawText('main',{x:40,y,font:bold,size:14});columns.drawText('tenance',{x:40+bold.widthOfTextAtSize('main',14),y,font,size:14});columns.drawText('left '+section+' 1',{x:140,y,font,size:14});}
 else columns.drawText('left '+section+' '+(i+1),{x:40,y:y-i*25,font,size:14});
}
columns.drawText('Middle section',{x:220,y:620,font,size:20});
const ctx=fixture.context,xyz=ctx.obj([first.ref,PDFName.of('XYZ'),80,500,2]),region=ctx.obj([second.ref,PDFName.of('FitR'),100,150,300,450]);
fixture.catalog.set(PDFName.of('Names'),ctx.obj({Dests:{Names:[PDFString.of('detail'),xyz]}}));
const outlines=ctx.obj({Type:'Outlines',Count:4}),outlinesRef=ctx.register(outlines);
const entries=[['Named detail',PDFString.of('detail')],['Rotated region',region],['Fit page',ctx.obj([first.ref,PDFName.of('Fit')])],['Fit width',ctx.obj([second.ref,PDFName.of('FitH'),500])]].map(([title,dest])=>ctx.obj({Title:PDFString.of(title),Parent:outlinesRef,Dest:dest}));
const refs=entries.map(entry=>ctx.register(entry));entries.forEach((entry,i)=>{if(i)entry.set(PDFName.of('Prev'),refs[i-1]);if(i<entries.length-1)entry.set(PDFName.of('Next'),refs[i+1]);});
outlines.set(PDFName.of('First'),refs[0]);outlines.set(PDFName.of('Last'),refs.at(-1));fixture.catalog.set(PDFName.of('Outlines'),outlinesRef);
first.node.set(PDFName.of('Annots'),ctx.obj([ctx.register(ctx.obj({Type:'Annot',Subtype:'Link',Rect:[40,700,220,725],Border:[0,0,0],Dest:PDFString.of('detail')}))]));
const bytes=await fixture.save(),sourceHash=createHash('sha256').update(bytes).digest('hex');
await fs.writeFile(path.join(output,'index.html'),`<!doctype html><html><head><meta charset="utf-8"><title>PDFix reader navigation checks</title><style>
body{margin:0;font:14px Arial}#reader{display:flex;gap:15px}.pdf-navigation{flex:0 0 210px}.outline-entry{display:block;margin:8px}.page-stage{flex:0 0 620px;min-width:0;height:400px;max-height:400px;overflow:auto;padding:12px;position:relative;background:#ddd}.pdf-paper{position:relative;flex:none;background:white}.view-options-panel{width:230px}canvas{display:block}[hidden]{display:none!important}
</style></head><body><main id="reader"><aside class="pdf-navigation"><button data-navigation="pages">Pages</button><button data-navigation="outline">Outline</button><button data-navigation="saved">Saved</button><div data-navigation-panel="pages"></div><div class="outline-list" data-navigation-panel="outline"></div><div data-navigation-panel="saved"><input class="bookmark-name"><button data-save-bookmark>Save page</button><p class="bookmark-status"></p><div class="bookmark-list"></div></div></aside><div class="page-stage" tabindex="0"><div class="pdf-paper"><canvas></canvas><div class="region-layer" hidden></div></div><article class="readable-page" hidden></article></div><div class="view-options-panel"><select class="reading-view"><option value="page">Page</option><option value="text">Text</option></select><input class="page-number"><button data-action="fit">Fit</button><button data-action="fit-page">Fit page</button></div></main><script type="module">
import {ReaderNavigation} from ${spec('src/reader-navigation.js')};
import {PdfViewNavigation} from ${spec('src/pdf-view-navigation.js')};
import {PdfLinkReview} from ${spec('src/pdf-link-review.js')};
import {createPdfReaderKeyHandler} from ${spec('src/pdf-reader-keyboard.js')};
import {pdfReadableText} from ${spec('src/pdf-readable-view.js')};
import * as pdfjs from ${spec('node_modules/pdfjs-dist/build/pdf.mjs')};
import worker from ${spec('node_modules/pdfjs-dist/build/pdf.worker.mjs','?url')};
pdfjs.GlobalWorkerOptions.workerSrc=worker;
window.qaReady=(async()=>{
 const task=pdfjs.getDocument({url:'./fixture.pdf',standardFontDataUrl:'./pdf-assets/standard_fonts/',isEvalSupported:false}),doc=await task.promise,root=document.querySelector('#reader'),paper=root.querySelector('.pdf-paper');
 const element=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const r={root,paper,stage:root.querySelector('.page-stage'),region:paper.querySelector('.region-layer'),pageInput:root.querySelector('.page-number'),options:{open:false},file:{name:'Reader navigation fixture'},doc,pageNumber:1,navigationIntent:0,viewRotation:0,zoom:1,fit:false,fitPage:false,readingView:'page',pagePixelLimit:16000000,element,scheduleThumbnails(){},setPane(){},announce:message=>qaMessages.push(message)};
 window.qaMessages=[];window.qaKeyboardCalls=[];
 r.renderPage=async()=>{paper.dataset.ready='false';const page=await doc.getPage(r.pageNumber),viewport=page.getViewport({scale:r.zoom,rotation:(page.rotate+r.viewRotation)%360}),canvas=paper.querySelector('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);paper.style.width=viewport.width+'px';paper.style.height=viewport.height+'px';await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;paper.dataset.ready='true';r.viewNavigation?.rendered({page,viewport});};
 r.go=async n=>{qaKeyboardCalls.push(n);r.navigationIntent++;const token=r.viewNavigation?.begin();r.pageNumber=n;r.pageInput.value=n;await r.renderPage();r.viewNavigation?.commit(token);};
 r.changeReadingView=async mode=>{r.navigationIntent++;r.readingView=mode;r.paper.hidden=mode==='text';root.querySelector('.readable-page').hidden=mode!=='text';await r.renderPage();};
 r.viewNavigation=new PdfViewNavigation(r);r.navigation=new ReaderNavigation(r);r.linkReview=new PdfLinkReview(r);r.keyHandler=createPdfReaderKeyHandler(r);document.addEventListener('keydown',r.keyHandler);
 await r.go(1);await r.navigation.load();await r.navigation.loadOutline();r.navigation.select('outline');window.qaReader=r;window.qaTask=task;window.qaReadable=pdfReadableText;
})();
</script></body></html>`);
const report={sourceHash,checks:[],errors:[],output,scope:'Production outline, destination, view-history, link-review and readable-layout components with actual PDF.js rendering in a browser reader adapter. Not full Electron or large-file acceptance.'};
let browser,server,page;
try{
 await build({root:output,configFile:false,base:'./',build:{outDir:target,emptyOutDir:false,target:'es2022'},logLevel:'error'});
 await fs.writeFile(path.join(target,'fixture.pdf'),bytes);await fs.cp(path.join(root,'node_modules/pdfjs-dist/standard_fonts'),path.join(target,'pdf-assets/standard_fonts'),{recursive:true});
 server=await preview({root:output,configFile:false,build:{outDir:target},preview:{host:'127.0.0.1',port:5187,strictPort:true}});
 const {chromium}=createRequire(path.join(root,'package.json'))('playwright');browser=await chromium.launch({channel:'msedge',headless:true,timeout:20000});page=await browser.newPage({viewport:{width:1180,height:800}});page.setDefaultTimeout(20000);page.on('pageerror',error=>report.errors.push(error.message));
 await page.goto('http://127.0.0.1:5187',{waitUntil:'domcontentloaded'});await page.evaluate(()=>qaReady);
 const check=async(name,work)=>{await work();report.checks.push({name,pass:true});console.log('PASS '+name);};
 const position=()=>page.evaluate(()=>{const r=qaReader,v=r.viewNavigation.current.viewport,p=r.paper.getBoundingClientRect(),s=r.stage.getBoundingClientRect();return {page:r.pageNumber,zoom:r.zoom,point:v.convertToPdfPoint(s.left+r.stage.clientLeft-p.left,s.top+r.stage.clientTop-p.top),scroll:[r.stage.scrollLeft,r.stage.scrollTop],history:r.viewNavigation.entries.length,messages:qaMessages};});
 await check('Named outline jumps to the requested coordinates and zoom',async()=>{
  await page.getByRole('button',{name:'Named detail',exact:true}).click();await page.waitForFunction(()=>qaReader.zoom===2&&qaReader.stage.scrollTop>400&&!qaReader.viewNavigation.busy);
  const result=await position();assert.equal(result.page,1);assert.equal(result.zoom,2);assert(Math.abs(result.point[0]-80)<1);assert(Math.abs(result.point[1]-500)<1);assert.deepEqual(result.messages,[]);
 });
 await check('Previous and next view restore the entire destination position',async()=>{
  const before=await position();await page.getByRole('button',{name:'Previous view',exact:true}).click();await page.waitForFunction(()=>qaReader.zoom===1&&!qaReader.viewNavigation.busy);assert.equal((await position()).zoom,1);
  await page.getByRole('button',{name:'Next view',exact:true}).click();await page.waitForFunction(()=>qaReader.zoom===2&&!qaReader.viewNavigation.busy);const after=await position();assert.deepEqual(after.scroll,before.scroll);
 });
 await check('FitR makes a rotated cropped UserUnit rectangle visible at the requested scale',async()=>{
  await page.getByRole('button',{name:'Rotated region',exact:true}).click();await page.waitForFunction(()=>qaReader.pageNumber===2&&!qaReader.viewNavigation.busy&&qaReader.paper.dataset.ready==='true');
  const result=await page.evaluate(()=>{const r=qaReader,v=r.viewNavigation.current.viewport,p=r.paper.getBoundingClientRect(),s=r.stage.getBoundingClientRect();const points=[[100,150],[300,150],[100,450],[300,450]].map(([x,y])=>v.convertToViewportPoint(x,y)).map(([x,y])=>[x+p.left,y+p.top]);return {zoom:r.zoom,userUnit:v.userUnit,inside:points.every(([x,y])=>x>=s.left-1&&x<=s.right+1&&y>=s.top-1&&y<=s.bottom+1)};});assert.equal(result.userUnit,2);assert.equal(result.inside,true);report.rotatedRegion=result;
  await page.screenshot({path:path.join(output,'rotated-destination.png')});
 });
 await check('Fit page and fit width destinations use the available viewing area',async()=>{
  await page.locator('.outline-list').getByRole('button',{name:'Fit page',exact:true}).click();await page.waitForFunction(()=>qaReader.pageNumber===1&&!qaReader.viewNavigation.busy);assert((await position()).zoom<.6);
  await page.getByRole('button',{name:'Fit width',exact:true}).click();await page.waitForFunction(()=>qaReader.pageNumber===2&&!qaReader.viewNavigation.busy);const dimensions=await page.evaluate(()=>({page:qaReader.viewNavigation.current.viewport.width,stage:qaReader.stage.clientWidth}));assert(dimensions.page<=dimensions.stage-24);
 });
 await check('Reviewed internal links apply the same exact destination view',async()=>{
  await page.evaluate(async()=>{await qaReader.go(1);await qaReader.linkReview.show();});await page.getByRole('button',{name:'Go to page 1',exact:true}).click();await page.waitForFunction(()=>qaReader.zoom===2&&!qaReader.viewNavigation.busy&&qaReader.stage.scrollTop>400);
  const result=await position();assert(Math.abs(result.point[0]-80)<1);assert(Math.abs(result.point[1]-500)<1);
 });
 await check('Real column extraction retains split words and a middle heading in reading order',async()=>{
  const result=await page.evaluate(async()=>{const p=await qaReader.doc.getPage(3),content=await p.getTextContent();return {two:qaReadable(content,p,'two').output,auto:qaReadable(content,p,'auto').output,rows:qaReadable(content,p,'rows').output};});
  report.columns=result;
  for(const output of [result.two,result.auto]){assert.equal(output.length,17);assert.match(output[0],/^maintenance left upper 1$/);assert.equal(output[8],'Middle section');assert.match(output[9],/^maintenance left lower 1$/);assert.equal(output[16],'right lower 4');assert(output.indexOf('left upper 4')<output.indexOf('right upper 1'));}
  assert(result.rows[0].includes('maintenance'));assert(!result.rows[0].includes('main tenance'));report.columns=result;
 });
 await check('Reader keyboard navigates pages and supports first/last-page shortcuts',async()=>{
  await page.evaluate(async()=>{await qaReader.go(1);qaReader.stage.focus();});await page.keyboard.press('PageDown');await page.waitForFunction(()=>qaReader.viewNavigation.current.page===2&&qaReader.paper.dataset.ready==='true');
  await page.keyboard.press('Control+End');await page.waitForFunction(()=>qaReader.viewNavigation.current.page===3&&qaReader.paper.dataset.ready==='true');
  await page.keyboard.press('Control+Home');await page.waitForFunction(()=>qaReader.viewNavigation.current.page===1&&qaReader.paper.dataset.ready==='true');
 });
 await check('Reader keys leave editor focus, native controls, modifiers and handled events alone',async()=>{
  const result=await page.evaluate(async()=>{
   const r=qaReader,inside=document.createElement('div'),outside=document.createElement('input');inside.contentEditable='true';inside.textContent='Editable reader notes';r.root.querySelector('.view-options-panel').append(inside);document.body.append(outside);
   const events=[];const send=(target,key,options={})=>{target.focus();const event=new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...options});target.dispatchEvent(event);events.push(event.defaultPrevented);};
   qaKeyboardCalls.length=0;send(inside,'ArrowRight');send(inside,'f',{ctrlKey:true});send(outside,'f',{ctrlKey:true});send(r.pageInput,'End',{ctrlKey:true});send(r.stage,'ArrowRight',{shiftKey:true});send(r.stage,'ArrowLeft',{ctrlKey:true});
   const handled=new KeyboardEvent('keydown',{key:'PageDown',bubbles:true,cancelable:true});handled.preventDefault();r.stage.dispatchEvent(handled);
   await new Promise(resolve=>setTimeout(resolve,20));inside.remove();outside.remove();return {prevented:events,calls:[...qaKeyboardCalls],page:r.pageNumber};
  });assert.deepEqual(result.prevented,[false,false,false,false,false,false]);assert.deepEqual(result.calls,[]);assert.equal(result.page,1);
 });
 await check('Hidden readers and other open dialogs do not receive shortcuts',async()=>{
  const result=await page.evaluate(async()=>{
   const r=qaReader;qaKeyboardCalls.length=0;r.root.hidden=true;document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'PageDown',bubbles:true,cancelable:true}));r.root.hidden=false;
   r.root.style.visibility='hidden';document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'PageDown',bubbles:true,cancelable:true}));r.root.style.visibility='';
   const dialog=document.createElement('dialog');document.body.append(dialog);dialog.showModal();dialog.dispatchEvent(new KeyboardEvent('keydown',{key:'PageDown',bubbles:true,cancelable:true}));dialog.close();dialog.remove();
   await new Promise(resolve=>setTimeout(resolve,20));return [...qaKeyboardCalls];
  });assert.deepEqual(result,[]);
 });
 await check('Outline navigation returns from readable mode and history restores that mode',async()=>{
  await page.evaluate(async()=>{const r=qaReader;await r.viewNavigation.navigate(async()=>{r.root.querySelector('.reading-view').value='text';await r.changeReadingView('text');});});
  await page.getByRole('button',{name:'Named detail',exact:true}).click();await page.waitForFunction(()=>qaReader.readingView==='page'&&!qaReader.viewNavigation.busy);
  await page.getByRole('button',{name:'Previous view',exact:true}).click();await page.waitForFunction(()=>qaReader.readingView==='text'&&!qaReader.viewNavigation.busy);
  assert.equal(await page.evaluate(()=>qaReader.paper.hidden),true);
 });
 assert.equal(createHash('sha256').update(await fs.readFile(path.join(target,'fixture.pdf'))).digest('hex'),sourceHash);assert.deepEqual(report.errors,[]);report.pass=true;
 await page.evaluate(async()=>{document.removeEventListener('keydown',qaReader.keyHandler);qaReader.linkReview.dispose();qaReader.viewNavigation.dispose();await qaTask.destroy();});
}catch(error){report.pass=false;report.error=error.stack;console.error(error.stack);process.exitCode=1;if(page)await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});}
finally{await browser?.close();if(server)await new Promise(resolve=>server.httpServer.close(resolve));await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,report:path.join(output,'report.json'),checks:report.checks,errors:report.errors}));}
