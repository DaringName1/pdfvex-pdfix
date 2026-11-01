// Hidden, scoped check of the two image conversions: an image to a PDF page, and PDF pages to PNG and JPEG
// images. The saved files are read back independently (page size and embedded image; image type and pixel size).
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {PDFDocument,PDFName} from 'pdf-lib';
const output=path.resolve('tmp/conversion-images-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Doc-')),work=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Files-')),outDir=path.join(work,'out');
await fs.mkdir(output,{recursive:true});await fs.mkdir(outDir);
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],notes:[],scope:'Scoped image conversion checks with one PNG and one three-page PDF. Crop, deskew, brightness, multi-image collections, annotations and transparency were not exercised.'};
const png=path.join(work,'Scan page.png'),pdf=path.join(work,'Reading sample.pdf');await fs.copyFile('tests/fixtures/scan-page.png',png);await fs.copyFile('tests/fixtures/reading-sample.pdf',pdf);
const sourceHashes={png:(await fs.readFile(png)).length,pdf:(await fs.readFile(pdf)).length};
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}await page.keyboard.press('Escape').catch(()=>{});}}
const tool=async title=>{await page.getByRole('button',{name:/^(Workspaces|All tools)$/}).first().click();await page.getByRole('searchbox',{name:'Find a tool across workspaces'}).fill(title);await page.locator('.workspace-room-grid button').filter({has:page.locator('h2',{hasText:new RegExp('^'+title+'$')})}).first().click();};
// Image copies are written into a new folder inside the chosen one, so files are looked up recursively.
const listed=async(folder,pattern)=>(await fs.readdir(folder,{recursive:true})).filter(name=>pattern.test(name)).sort();
const imageSize=bytes=>{if(bytes[0]===0x89&&bytes[1]===0x50)return {type:'png',width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};if(bytes[0]===0xff&&bytes[1]===0xd8){let at=2;while(at<bytes.length){const marker=bytes[at+1],length=bytes.readUInt16BE(at+2);if(marker>=0xc0&&marker<=0xc2)return {type:'jpeg',width:bytes.readUInt16BE(at+7),height:bytes.readUInt16BE(at+5)};at+=2+length;}}return {type:'unknown'};};
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 await app.evaluate(({dialog},{outDir})=>{global.pdfixNative={open:null,save:null,asked:[]};dialog.showOpenDialog=async(_window,options)=>{global.pdfixNative.asked.push('open '+(options?.properties??[]).join('+')+' '+(options?.title??''));if(options?.properties?.includes('openDirectory'))return {canceled:false,filePaths:[outDir]};return global.pdfixNative.open?{canceled:false,filePaths:[global.pdfixNative.open]}:{canceled:true,filePaths:[]};};dialog.showSaveDialog=async(_window,options)=>{global.pdfixNative.asked.push('save '+(options?.title??'')+' -> '+(options?.defaultPath??''));return global.pdfixNative.save?{canceled:false,filePath:global.pdfixNative.save}:{canceled:true};};dialog.showMessageBox=async(_window,options)=>{global.pdfixNative.asked.push('box '+String(options?.message??'').slice(0,120));const buttons=options?.buttons??['OK'];const yes=buttons.findIndex(label=>/save|continue|replace|yes|ok/i.test(label));return {response:yes<0?0:yes,checkboxChecked:false};};},{outDir});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const native=values=>app.evaluate((_electron,values)=>Object.assign(global.pdfixNative,values),values),asked=()=>app.evaluate(()=>global.pdfixNative.asked.splice(0));
 await check('image to PDF: a PNG becomes a one-page Letter PDF holding the image, and the PNG is unchanged',async()=>{
  const target=path.join(outDir,'scan.pdf');await native({open:png,save:target});await tool('Image to PDF');const main=page.locator('#main-content');await expect(main.getByRole('button',{name:'Preview PDF',exact:true})).toBeVisible({timeout:30000});
  await main.getByRole('combobox',{name:'PDF page size'}).selectOption({label:'Letter'});await main.getByRole('combobox',{name:'PDF page orientation'}).selectOption({label:'Portrait'});await main.getByRole('spinbutton',{name:'PDF margin in millimeters'}).fill('10');await main.getByRole('spinbutton',{name:'PDF margin in millimeters'}).dispatchEvent('change');
  await main.getByRole('button',{name:'Preview PDF',exact:true}).click();const save=main.getByRole('button',{name:'Save PDF copy',exact:true});
  for(let i=0;i<40&&await save.isDisabled();i++){await page.waitForTimeout(500);const review=page.locator('input[type=checkbox]').filter({hasNot:page.locator('[disabled]')});for(const box of await page.locator('label:has(input[type=checkbox])').filter({hasText:/review|checked|confirm|looked/i}).locator('input[type=checkbox]').all())if(await box.isVisible()&&!await box.isChecked())await box.check().catch(()=>{});void review;}
  report.imageToPdfStatus=(await page.locator('#main-content,dialog[open]').last().innerText()).replace(/\s+/g,' ').slice(-380);await page.screenshot({path:path.join(output,'image-to-pdf.png')});await expect(save).toBeEnabled({timeout:5000});await save.click();
  await expect.poll(()=>fs.stat(target).then(stat=>stat.size,()=>0),{timeout:45000}).toBeGreaterThan(1000);report.imageToPdfAsked=await asked();
  const document=await PDFDocument.load(await fs.readFile(target)),first=document.getPage(0),size=first.getSize(),objects=first.node.Resources()?.lookup(PDFName.of('XObject')),names=objects?objects.keys().map(String):[];report.imageToPdf={pages:document.getPageCount(),size,imageObjects:names.length,bytes:(await fs.stat(target)).size};
  if(document.getPageCount()!==1||Math.abs(size.width-612)>1||Math.abs(size.height-792)>1)throw new Error('PDF is '+JSON.stringify(report.imageToPdf));if(names.length<1)throw new Error('The PDF page holds no image.');if((await fs.readFile(png)).length!==sourceHashes.png)throw new Error('The source PNG changed.');
 });
 for(const [format,dpi,scale] of [['PNG','144 dpi',2],['JPEG','72 dpi',1]])await check('PDF to images: all three pages as '+format+' at '+dpi+' with the right pixel size',async()=>{
  await page.getByRole('button',{name:'Home',exact:true}).first().click().catch(()=>{});for(const name of await fs.readdir(outDir))if(name!=='scan.pdf')await fs.rm(path.join(outDir,name),{recursive:true,force:true});
  await native({open:pdf,save:path.join(outDir,'pages.'+(format==='PNG'?'png':'jpg'))});await tool('PDF to images');const dialog=page.locator('dialog.pdf-image-export');await dialog.waitFor({timeout:45000});
  await dialog.locator('select').nth(0).selectOption({label:'All pages'});await dialog.locator('select').nth(1).selectOption({label:format});await dialog.locator('select').nth(2).selectOption({label:dpi});
  await dialog.getByRole('button',{name:'Build image previews',exact:true}).click();const save=dialog.getByRole('button',{name:'Save image copies',exact:true});
  for(let i=0;i<60&&await save.isDisabled();i++){await page.waitForTimeout(500);for(const box of await dialog.locator('label:has(input[type=checkbox])').filter({hasText:/review|checked|confirm|looked/i}).locator('input[type=checkbox]').all())if(await box.isVisible()&&!await box.isChecked())await box.check().catch(()=>{});}
  report['status'+format]=(await dialog.innerText()).replace(/\s+/g,' ').slice(-300);await page.screenshot({path:path.join(output,'pdf-to-'+format.toLowerCase()+'.png')});await expect(save).toBeEnabled({timeout:5000});await save.click();
  const pattern=format==='PNG'?/\.png$/i:/\.jpe?g$/i;await expect.poll(async()=>(await listed(outDir,pattern)).length,{timeout:60000}).toBe(3);await page.waitForTimeout(800);report['asked'+format]=await asked();
  const names=await listed(outDir,pattern),sizes=[];report['folder'+format]=await fs.readdir(outDir);for(const name of names)sizes.push({name,...imageSize(await fs.readFile(path.join(outDir,name)))});report['images'+format]=sizes;
  for(const item of sizes)if(item.type!==format.toLowerCase()||Math.abs(item.width-612*scale)>2||Math.abs(item.height-792*scale)>2)throw new Error('Unexpected image: '+JSON.stringify(item)+' (expected '+612*scale+' x '+792*scale+' '+format+')');
  if((await fs.readFile(pdf)).length!==sourceHashes.pdf)throw new Error('The source PDF changed.');await dialog.getByRole('button',{name:'Close PDF image export'}).click().catch(()=>{});
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds: '+await page.locator('#toast').textContent().catch(()=>'')});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});await fs.rm(work,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
