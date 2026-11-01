// Hidden, scoped check of Redact a PDF. A region and a text search are marked, the clean copy is saved, and the
// saved file is read back independently: no selectable text anywhere, no document information, no raw text
// bytes of the marked words, and the marked region is solid when the page is rendered outside PDFix.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import {randomUUID} from 'node:crypto';
import {PDFDocument} from 'pdf-lib';
const output=path.resolve('tmp/tools-redaction-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Doc-')),work=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Files-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'Scoped redaction check with one synthetic three-page PDF at 144 dpi: one drawn region and one text search. Forms, annotations, attachments, layers and scanned pages were not exercised.'};
const pdf=path.join(work,'Reading sample.pdf'),redacted=path.join(work,'redacted.pdf');await fs.copyFile('tests/fixtures/reading-sample.pdf',pdf);const original=await fs.readFile(pdf);
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
// Every stream in the file, inflated where possible, as one searchable buffer.
function inflatedContent(bytes){const parts=[bytes];let at=0;while((at=bytes.indexOf('stream',at))>=0){let start=at+6;if(bytes[start]===13)start++;if(bytes[start]===10)start++;const end=bytes.indexOf('endstream',start);if(end<0)break;try{parts.push(zlib.inflateSync(bytes.subarray(start,end)));}catch{try{parts.push(zlib.inflateRawSync(bytes.subarray(start,end)));}catch{}}at=end+9;}return Buffer.concat(parts);}
async function renderRegion(file,pageNumber,region){
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),{createCanvas}=await import('@napi-rs/canvas');const task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile(file)),useSystemFonts:true});const document=await task.promise,pageProxy=await document.getPage(pageNumber),viewport=pageProxy.getViewport({scale:1}),canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height)),context=canvas.getContext('2d');
 await pageProxy.render({canvasContext:context,viewport,canvas}).promise;const x=Math.round(viewport.width*region.left/100)+3,y=Math.round(viewport.height*region.top/100)+3,w=Math.round(viewport.width*region.width/100)-6,h=Math.round(viewport.height*region.height/100)-6,data=context.getImageData(x,y,w,h).data;let dark=0,total=0,colors=new Set();
 for(let i=0;i<data.length;i+=4){total++;if(data[i]<40&&data[i+1]<40&&data[i+2]<40)dark++;colors.add((data[i]>>4)+','+(data[i+1]>>4)+','+(data[i+2]>>4));}const whole=context.getImageData(0,0,canvas.width,canvas.height).data;let ink=0;for(let i=0;i<whole.length;i+=4)if(whole[i]<200)ink++;
 await fs.writeFile(path.join(output,'rendered-page-'+pageNumber+'.png'),canvas.toBuffer('image/png'));await task.destroy();return {darkShare:dark/total,distinctColors:colors.size,pageInkPixels:ink,size:[canvas.width,canvas.height]};
}
const REGION={left:10,top:8,width:55,height:12};
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 await app.evaluate(({dialog},{pdf,redacted})=>{global.pdfixAsked=[];dialog.showOpenDialog=async()=>({canceled:false,filePaths:[pdf]});dialog.showSaveDialog=async(_window,options)=>{global.pdfixAsked.push('save '+(options?.title??'')+' -> '+(options?.defaultPath??''));return {canceled:false,filePath:redacted};};dialog.showMessageBox=async(_window,options)=>{global.pdfixAsked.push('box '+String(options?.message??'').slice(0,160));const buttons=options?.buttons??['OK'];const yes=buttons.findIndex(label=>/save|continue|yes|ok|redact/i.test(label));return {response:yes<0?0:yes,checkboxChecked:false};};},{pdf,redacted});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).first().click();await page.getByRole('searchbox',{name:'Find a tool across workspaces'}).fill('Redact a PDF');await page.locator('.workspace-room-grid button').filter({has:page.locator('h2',{hasText:/^Redact a PDF$/})}).first().click();
 const dialog=page.locator('dialog.redaction-workspace');await dialog.waitFor({timeout:45000});const build=dialog.getByRole('button',{name:/^Build clean (redacted preview|copy to review)$/,exact:true}),save=dialog.getByRole('button',{name:'Save redacted PDF',exact:true});
 await check('nothing can be built or saved before something is marked and the loss is accepted',async()=>{await expect(build).toBeDisabled();await expect(save).toBeDisabled();});
 await check('mark one region and every run matching a searched word, then build and save the clean copy',async()=>{
  await dialog.getByRole('button',{name:'Add a box',exact:true}).click();await dialog.locator('details').filter({has:page.locator('summary',{hasText:'Precise region position'})}).last().evaluate(details=>{details.open=true;});
  for(const [name,value] of [['left',REGION.left],['top',REGION.top],['width',REGION.width],['height',REGION.height]]){const input=dialog.getByRole('spinbutton',{name:'Redaction region '+name+' percent'});await input.fill(String(value));}await dialog.getByRole('button',{name:'Apply position',exact:true}).click();
  await dialog.getByRole('searchbox',{name:'Text to mark for redaction'}).fill('welcome');await dialog.getByRole('button',{name:'Find and mark this text',exact:true}).click();await page.waitForTimeout(2500);report.afterMarking=(await page.locator('#toast').textContent().catch(()=>''))?.slice(0,200);report.regions=await dialog.evaluate(node=>node.querySelectorAll('[class*="region"]:not(summary):not(input):not(button)').length);
  await expect(build).toBeEnabled({timeout:10000});await build.click();const review=dialog.getByRole('checkbox',{name:'I checked all redacted pages and marked regions'});await expect(review).toBeEnabled({timeout:120000});await page.waitForTimeout(600);
  report.buildStatus=(await dialog.innerText()).replace(/\s+/g,' ').slice(-360);await page.screenshot({path:path.join(output,'redaction-preview.png')});await review.check();await expect(save).toBeEnabled({timeout:10000});await save.click();await expect.poll(()=>fs.stat(redacted).then(stat=>stat.size,()=>0),{timeout:90000}).toBeGreaterThan(1000);await page.waitForTimeout(1000);report.asked=await app.evaluate(()=>global.pdfixAsked);
 });
 await check('the saved copy has no selectable text, no document information and no trace of the marked words',async()=>{
  const bytes=await fs.readFile(redacted),pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(bytes),useSystemFonts:true}),document=await task.promise;let text='',annotations=0;
  for(let number=1;number<=document.numPages;number++){const pageProxy=await document.getPage(number);text+=(await pageProxy.getTextContent()).items.map(item=>item.str).join(' ');annotations+=(await pageProxy.getAnnotations()).length;}
  const metadata=await document.getMetadata(),attachments=await document.getAttachments(),outline=await document.getOutline();report.saved={pages:document.numPages,textLength:text.trim().length,annotations,info:metadata.info,hasXmp:!!metadata.metadata,attachments:attachments?Object.keys(attachments).length:0,outline:outline?outline.length:0,bytes:bytes.length};await task.destroy();
  if(document.numPages!==3)throw new Error('Saved copy has '+document.numPages+' pages.');if(text.trim())throw new Error('Saved copy still has selectable text: '+text.slice(0,120));if(annotations||report.saved.attachments||report.saved.outline)throw new Error('Saved copy keeps annotations, attachments or an outline: '+JSON.stringify(report.saved));
  for(const key of ['Title','Author','Subject','Keywords'])if(metadata.info?.[key])throw new Error('Saved copy keeps document information "'+key+'": '+metadata.info[key]);
  const content=inflatedContent(bytes).toString('latin1');for(const word of ['Welcome','welcome','clarity','PDFix tests','paperwork'])if(content.includes(word))throw new Error('The word "'+word+'" is still present in the file bytes.');
  const library=await PDFDocument.load(bytes);report.saved.producer=library.getProducer()??null;report.saved.title=library.getTitle()??null;
 });
 await check('rendered outside PDFix, the marked region is solid and the other pages still show their artwork',async()=>{
  const first=await renderRegion(redacted,1,REGION),before=await renderRegion(pdf,1,REGION).catch(error=>({error:error.message})),second=await renderRegion(redacted,2,{left:10,top:8,width:55,height:12});report.rendered={first,originalSameRegion:before,second};
  if(first.darkShare<0.98||first.distinctColors>2)throw new Error('The marked region is not solid: '+JSON.stringify(first));if(second.pageInkPixels<500)throw new Error('Page 2 looks blank after redaction: '+JSON.stringify(second));if(second.darkShare>0.5)throw new Error('An unmarked area of page 2 is blacked out.');
 });
 await check('the original file is unchanged and the window closes',async()=>{if(!(await fs.readFile(pdf)).equals(original))throw new Error('The original PDF changed.');await dialog.getByRole('button',{name:'Close redaction workspace'}).click();});
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds: '+await page.locator('#toast').textContent().catch(()=>'')});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});await fs.rm(work,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
