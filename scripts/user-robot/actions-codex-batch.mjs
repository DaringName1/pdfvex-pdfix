// Pending robot actions: runner must provide chooseFiles(paths), chooseFile(path)
// (also used for directory dialogs), saveAs(path), goHome(), and temporary files.
// UI uses visible roles/names; verification independently reads every output.
import fs from 'node:fs/promises';
import path from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {expect} from '@playwright/test';
import {inspectPdf,hash} from './verify.mjs';

async function outputs(folder,ext){const found=[];for(const row of await fs.readdir(folder,{withFileTypes:true})){const file=path.join(folder,row.name);if(row.isDirectory())found.push(...await outputs(file,ext));else if(row.name.toLowerCase().endsWith(ext))found.push(file);}return found.sort();}
const compact=text=>text.replace(/\s+/g,' ').trim();
export async function verifyBatchOutcome(outcome){
 const problems=[];try{
  if(!outcome||!['copy','text','compression','bates'].includes(outcome.kind)||!Array.isArray(outcome.sources)||!outcome.sources.length||outcome.sources.length>10||!Array.isArray(outcome.expected)||!outcome.expected.length||outcome.expected.length>10)throw Error('Missing bounded batch outcome.');
  for(const source of outcome.sources)if(hash(await fs.readFile(source.file))!==source.sha256)problems.push('A generated original changed.');
  const files=await outputs(outcome.parent,outcome.kind==='text'?'.txt':'.pdf');
  if(files.length!==outcome.expected.length)problems.push('The saved batch has an unexpected number of files.');
  for(const expected of outcome.expected){
   const file=files.find(f=>path.basename(f)===expected.name);if(!file){problems.push('Missing saved output: '+expected.name);continue;}
   const bytes=await fs.readFile(file);
   if(outcome.kind==='text'){
    const text=bytes.toString('utf8');if(!Buffer.from(text,'utf8').equals(bytes)||compact(text)!==compact(expected.text.map((text,index)=>'--- Physical page '+(index+1)+' --- '+text).join(' ')))problems.push('Saved UTF-8 text differs from the generated source text.');
    continue;
   }
   const info=await inspectPdf(file);if(!info.ok)problems.push('Saved PDF cannot be independently read.');
   const doc=await PDFDocument.load(bytes);if(doc.getPageCount()!==expected.pages)problems.push('Saved page count differs.');
   for(const text of expected.text)if(!info.text.includes(text))problems.push('Source text missing from saved PDF: '+text);
   if(expected.exact&&hash(bytes)!==expected.exact)problems.push('Exact PDF copy changed source bytes.');
   if(expected.smallerThan&&bytes.length>=expected.smallerThan)problems.push('Compressed PDF is not smaller than its generated source.');
   if(expected.identifiers){
    const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(bytes),isEvalSupported:false,standardFontDataUrl:path.resolve('node_modules/pdfjs-dist/standard_fonts').split(path.sep).join('/')+'/'});
    try{const pdf=await task.promise;for(const [index,id]of expected.identifiers.entries()){const text=(await(await pdf.getPage(index+1)).getTextContent()).items.map(item=>item.str).join(' ');if(!text.includes(id)||expected.identifiers.some(other=>other!==id&&text.includes(other)))problems.push('Bates identifiers are missing, repeated or on the wrong page.');}}finally{await task.destroy();}
   }
  }
  if(outcome.kind==='bates'){const report=JSON.parse(await fs.readFile(outcome.report,'utf8'));if(report.nextNumber!==44||JSON.stringify(report.sources.map(s=>s.status))!==JSON.stringify(['saved','skipped','saved']))problems.push('Bates saved report consumed numbers for a skipped file or lost queue status.');}
  return {pass:!problems.length,problems,info:{kind:outcome.kind,files:files.length,originals:outcome.sources.length}};
 }catch(error){return {pass:false,problems:[...problems,'Saved batch verification failed: '+error.message]};}
}

export function makeBatchActions(h){
 const wait={timeout:120000};
 async function setup(ctx,kind){
  if(typeof ctx.chooseFiles!=='function')throw Error('Batch robot actions need ctx.chooseFiles(paths); do not enable them with an older robot context.');
  await h.setup(ctx);const root=await fs.mkdtemp(path.join(ctx.files,'batch-'+kind+'-')),parent=path.join(root,'outputs');await fs.mkdir(parent);
  const sources=[];for(const [name,pages]of [['Alpha',1],['Skip',1],['Gamma',2]]){const pdf=await PDFDocument.create(),text=[];for(let i=1;i<=pages;i++){const line=`Batch ${name} page ${i}`;text.push(line);const page=pdf.addPage([400,600]);page.drawText(line,{x:40,y:520,size:16});if(kind==='compression')page.node.addContentStream(pdf.context.register(pdf.context.stream('q\nQ\n'.repeat(20000))));}const bytes=Buffer.from(await pdf.save({useObjectStreams:false})),file=path.join(root,name+'.pdf');await fs.writeFile(file,bytes,{flag:'wx'});sources.push({file,name,pages,text,sha256:hash(bytes),size:bytes.length});}
  const state={kind,root,parent,sources,expected:[],report:path.join(root,'queue-report.json')};ctx.codexBatchOutcome=state;return state;
 }
 async function start(page,ctx,title){await ctx.goHome();await page.getByRole('button',{name:/^(All tools|Workspaces)$/}).click();await page.getByRole('searchbox',{name:'Find a tool across workspaces',exact:true}).fill(title);await page.getByRole('button').filter({has:page.getByRole('heading',{name:title,exact:true})}).click();return page.getByRole('dialog').last();}
 async function verify(ctx){return verifyBatchOutcome(ctx.codexBatchOutcome);}
 async function previewWidth(page,d){await expect(d).toBeVisible(wait);const windowWidth=await page.evaluate(()=>innerWidth);await expect.poll(async()=>((await d.boundingBox())?.width||0),wait).toBeGreaterThanOrEqual(Math.min(1000,windowWidth-60));expect((await d.boundingBox()).width).toBeLessThanOrEqual(windowWidth);}
 const documentAction=kind=>({name:kind==='copy'?'batch: rename two exact PDF copies and inspect both':'batch: export two literal text files and inspect UTF-8',weight:1,async run(page,ctx){
  const state=await setup(ctx,kind),sources=[state.sources[0],state.sources[2]],d=await start(page,ctx,'Batch copy, rename or export text');await ctx.chooseFiles(sources.map(s=>s.file));await d.getByRole('button',{name:'Choose PDFs',exact:true}).click();await d.getByRole('combobox',{name:'Action',exact:true}).selectOption(kind);
  for(const source of sources){const name='Reviewed '+source.name+(kind==='copy'?'.pdf':'.txt');await d.getByRole('textbox',{name:'Output name for '+path.basename(source.file),exact:true}).fill(name);state.expected.push({name,pages:source.pages,text:source.text,...(kind==='copy'?{exact:source.sha256}:{})});}
  await ctx.chooseFile(state.parent);await d.getByRole('button',{name:'Choose output parent',exact:true}).click();await d.getByRole('button',{name:'Prepare next file',exact:true}).click();
  for(const source of sources){const review=d.getByRole('button',{name:'Save reviewed output & continue',exact:true});await expect(d.getByText(new RegExp('^'+source.name+'[.]pdf →'))).toBeVisible(wait);await expect(review).toBeEnabled(wait);if(kind==='text')await expect(d.getByRole('textbox',{name:'Literal extracted UTF-8 text',exact:true})).toHaveValue(new RegExp('Batch '+source.name),wait);await d.getByRole('button',{name:'Save reviewed output & continue',exact:true}).click();}
  await expect(d.getByRole('status').filter({hasText:'Queue complete'})).toContainText('Queue complete',wait);await ctx.capture?.('batch-'+kind+'-saved');await d.getByRole('button',{name:'Close batch document actions',exact:true}).click();
 },verify});
 const compression={name:'batch: compress two PDFs and inspect every saved copy',weight:1,async run(page,ctx){
  const state=await setup(ctx,'compression'),sources=[state.sources[0],state.sources[2]],d=await start(page,ctx,'Compress several PDFs');await previewWidth(page,d);await ctx.chooseFiles(sources.map(s=>s.file));await d.getByRole('button',{name:'Choose PDFs',exact:true}).click();await ctx.chooseFile(state.parent);await d.getByRole('button',{name:'Choose output parent',exact:true}).click();await d.getByRole('button',{name:'Process next PDF',exact:true}).click();
  for(const source of sources){const review=d.getByRole('button',{name:'Save copy and continue',exact:true});await expect(review).toBeEnabled(wait);for(let pageNo=2;pageNo<=source.pages;pageNo++){await d.getByRole('button',{name:'Next page',exact:true}).click();await expect(d.getByRole('spinbutton',{name:'Physical page',exact:true})).toHaveValue(String(pageNo),wait);await expect(review).toBeEnabled(wait);}await expect.poll(async()=>((await d.getByLabel('Compressed PDF page',{exact:true}).boundingBox())?.height||Infinity),wait).toBeLessThanOrEqual(await page.evaluate(()=>innerHeight*.5));await d.getByLabel('Compressed PDF page',{exact:true}).scrollIntoViewIfNeeded();await ctx.capture?.('batch-compression-'+source.name+'-artwork');await review.scrollIntoViewIfNeeded();await ctx.capture?.('batch-compression-'+source.name+'-review');await d.getByRole('button',{name:'Save copy and continue',exact:true}).click();state.expected.push({name:source.name+'-compressed.pdf',pages:source.pages,text:source.text,smallerThan:source.size});}
  await expect(d.getByRole('status').filter({hasText:'No queued PDFs remain'})).toContainText('No queued PDFs remain',wait);await d.getByRole('button',{name:'Close batch compression',exact:true}).click();
 },verify};
 const bates={name:'batch: continue Bates across PDFs while skipping the middle file',weight:1,async run(page,ctx){
  const state=await setup(ctx,'bates'),d=await start(page,ctx,'Bates numbering across PDFs');await previewWidth(page,d);await ctx.chooseFiles(state.sources.map(s=>s.file));await d.getByRole('button',{name:'Choose original PDFs',exact:true}).click();await expect(d.getByRole('listitem').first()).toContainText('Alpha.pdf · 1 page ·',wait);await expect(d.getByRole('listitem').first()).not.toContainText('1 pages');await d.getByRole('spinbutton',{name:'First number',exact:true}).fill('41');await d.getByRole('button',{name:'Apply settings and file order',exact:true}).click();await ctx.chooseFile(state.parent);await d.getByRole('button',{name:'Choose a new output folder',exact:true}).click();
  for(const source of [state.sources[0],state.sources[2]]){await d.getByRole('button',{name:'Build next PDF preview',exact:true}).click();const review=d.getByRole('button',{name:'Save reviewed copy',exact:true});if(source.pages===2){await expect(d.getByLabel('Numbered output copy',{exact:true})).toBeVisible(wait);await d.getByRole('button',{name:'Next page',exact:true}).click();}await expect(review).toBeEnabled(wait);await expect.poll(async()=>((await d.getByLabel('Numbered output copy',{exact:true}).boundingBox())?.height||Infinity),wait).toBeLessThanOrEqual(await page.evaluate(()=>innerHeight*.5));await d.getByLabel('Numbered output copy',{exact:true}).scrollIntoViewIfNeeded();await ctx.capture?.('batch-bates-'+source.name+'-artwork');await review.scrollIntoViewIfNeeded();await ctx.capture?.('batch-bates-'+source.name+'-review');await d.getByRole('button',{name:'Save reviewed copy',exact:true}).click();await expect(d.getByRole('button',{name:'Save numbering report',exact:true})).toBeEnabled(wait);if(source.name==='Alpha'){await d.getByRole('listitem').filter({hasText:'Skip.pdf'}).getByRole('button',{name:'Skip',exact:true}).click();await expect(d.getByRole('status').filter({hasText:'identifiers were not consumed'})).toContainText('identifiers were not consumed',wait);}}
  await ctx.saveAs(state.report);await d.getByRole('button',{name:'Save numbering report',exact:true}).click();await h.saved(state.report);await expect(d.getByRole('button',{name:'Save numbering report',exact:true})).toBeEnabled(wait);for(const source of [state.sources[0],state.sources[2]])state.expected.push({name:source.name+'-bates.pdf',pages:source.pages,text:source.text,identifiers:source.name==='Alpha'?['BATES-000041']:['BATES-000042','BATES-000043']});await d.getByRole('button',{name:'Close',exact:true}).click();
 },verify};
 return [documentAction('copy'),documentAction('text'),compression,bates];
}
