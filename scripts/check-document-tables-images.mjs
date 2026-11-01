// Hidden, scoped check of table structure tools (merge, split, fill, column widths, rows/columns) and image
// resize, description and removal, including DOCX output and reopen.
import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import JSZip from 'jszip';
import mammoth from 'mammoth';
const output=path.resolve('tmp/document-tables-images-'+randomUUID()),profile=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-Doc-'));
await fs.mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),output,checks:[],errors:[],failures:[],scope:'Scoped table and image tool checks on one new document; not every table shape or image type.'};
let app,page;
async function check(name,run){try{await run();report.checks.push({name,pass:true});}catch(error){report.failures.push({name,error:error.message});try{await page.screenshot({path:path.join(output,'failure-'+report.failures.length+'.png')});}catch{}}}
const tab=name=>page.getByRole('tablist',{name:'Document tool categories'}).getByRole('tab',{name,exact:true}).click();
// The editor adopts a mouse selection a moment after the mouse is released.
const settle=()=>page.waitForTimeout(350);
try{
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});
 page=await app.firstWindow();page.on('pageerror',error=>report.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 const editor=page.getByRole('textbox',{name:'Editable document'}),tables=page.locator('.document-table-controls'),images=page.locator('.document-image-controls'),command=name=>tables.getByRole('button',{name,exact:true});
 const drag=async(from,to)=>{const a=await from.boundingBox(),b=await to.boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:8});await page.mouse.up();await settle();};
 const cells=()=>editor.locator('table').evaluate(table=>[...table.rows].map(row=>[...row.cells].map(cell=>cell.tagName.toLowerCase()+(cell.colSpan>1?' c'+cell.colSpan:'')+(cell.rowSpan>1?' r'+cell.rowSpan:'')+(cell.dataset.pdfixCellColor?' '+cell.dataset.pdfixCellColor:'')+':'+cell.textContent)));
 await page.getByRole('button',{name:'New document',exact:true}).click();await editor.waitFor();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:30000});
 await editor.pressSequentially('Table and image tools');await editor.press('Enter');await tab('Insert');await tables.locator('summary').click();await tables.locator('[data-rows]').fill('3');await tables.locator('[data-cols]').fill('3');await command('Insert table').click();
 await editor.locator('table th').first().click();for(const text of ['H1','H2','H3','a','b','c','d','e','f']){await page.keyboard.type(text);if(text!=='f')await page.keyboard.press('Tab');}
 await check('merge two header cells across, then split them again',async()=>{
  await drag(editor.locator('table th').nth(0),editor.locator('table th').nth(1));await expect(command('Merge cells')).toBeEnabled();await command('Merge cells').click();
  report.merged=await cells();if(report.merged[0].length!==2||!report.merged[0][0].startsWith('th c2:'))throw new Error('After merge: '+JSON.stringify(report.merged));
  await editor.locator('table th').first().click();await settle();await expect(command('Split cell')).toBeEnabled();await command('Split cell').click();const split=await cells();if(split[0].length!==3)throw new Error('After split: '+JSON.stringify(split));
  await page.keyboard.press('Control+z');const undone=await cells();if(undone[0].length!==2)throw new Error('Undo of split: '+JSON.stringify(undone));
 });
 await check('merge two body cells down',async()=>{
  await drag(editor.locator('table tr').nth(1).locator('td').nth(2),editor.locator('table tr').nth(2).locator('td').nth(2));await expect(command('Merge cells')).toBeEnabled();await command('Merge cells').click();
  report.mergedDown=await cells();if(!report.mergedDown[1][2].startsWith('td r2:')||report.mergedDown[2].length!==2)throw new Error('After vertical merge: '+JSON.stringify(report.mergedDown));
 });
 await check('cell fill applies and clears',async()=>{
  await editor.locator('table tr').nth(1).locator('td').first().click();await settle();await tables.locator('[data-color]').evaluate(input=>{input.value='#ffe699';input.dispatchEvent(new Event('input',{bubbles:true}));});await command('Apply fill').click();
  await expect(editor.locator('table tr').nth(1).locator('td').first()).toHaveAttribute('data-pdfix-cell-color','#ffe699');
  await editor.locator('table tr').nth(1).locator('td').nth(1).click();await settle();await command('Apply fill').click();await command('Clear fill').click();await expect(editor.locator('table tr').nth(1).locator('td').nth(1)).not.toHaveAttribute('data-pdfix-cell-color',/.+/);
 });
 await check('column widths, extra column and row, and their removal',async()=>{
  await tables.locator('[data-grid]').fill('100, 200, 100');await command('Apply column widths').click();const widths=await editor.locator('table col').evaluateAll(columns=>columns.map(column=>Math.round(parseFloat(column.style.width))));report.widths=widths;if(JSON.stringify(widths)!==JSON.stringify([25,50,25]))throw new Error('Column widths are '+JSON.stringify(widths));
  const body=await cells();await command('Column right').click();await expect(editor.locator('table col')).toHaveCount(4);
  // The new column sits right of the selected cell; select it before deleting so the original columns stay.
  await editor.locator('table tr').nth(1).locator('td').nth(2).click();await settle();await command('Delete column').click();await expect(editor.locator('table col')).toHaveCount(3);if(JSON.stringify(await cells())!==JSON.stringify(body))throw new Error('Adding and deleting a column changed the table: '+JSON.stringify(await cells()));
  await editor.locator('table tr').nth(2).locator('td').first().click();await settle();await command('Row below').click();await expect(editor.locator('table tr')).toHaveCount(4);await editor.locator('table tr').nth(3).locator('td').first().click();await settle();await command('Delete row').click();await expect(editor.locator('table tr')).toHaveCount(3);if(JSON.stringify(await cells())!==JSON.stringify(body))throw new Error('Adding and deleting a row changed the table: '+JSON.stringify(await cells()));
  report.finalTable=await cells();await page.screenshot({path:path.join(output,'table.png')});await tables.locator('summary').click();
 });
 await check('image: resize keeping ratio, describe, fit, remove and undo',async()=>{
  await editor.press('Control+End');await images.locator(':scope>summary').click();await images.locator('[data-file]').setInputFiles(path.resolve('tests/fixtures/scan-page.png'));const image=editor.locator('img[data-pdfix-image]');await expect(image).toHaveCount(1,{timeout:30000});
  await image.click();await settle();await expect(images.locator('[data-width]')).toBeEnabled();const ratio=Number(await image.getAttribute('data-pdfix-image-height'))/Number(await image.getAttribute('data-pdfix-image-width'));
  await images.locator('[data-width]').fill('200');await images.locator('[data-alt]').fill('Site plan scan');await images.getByRole('button',{name:'Apply size / description',exact:true}).click();
  await expect(image).toHaveAttribute('width','200');await expect(image).toHaveAttribute('alt','Site plan scan');const height=Number(await image.getAttribute('height'));report.imageSize={width:200,height,ratio};if(Math.abs(height-200*ratio)>1.5)throw new Error('Height '+height+' does not keep the source ratio '+ratio);
  await image.click();await settle();await images.getByRole('button',{name:'Fit image',exact:true}).click();report.fitted=Number(await image.getAttribute('width'));if(!(report.fitted>200))throw new Error('Fit image left the width at '+report.fitted);
  await image.click();await settle();await images.locator('[data-width]').fill('200');await images.getByRole('button',{name:'Apply size / description',exact:true}).click();await expect(image).toHaveAttribute('width','200');
  await image.click();await settle();await images.getByRole('button',{name:'Remove image',exact:true}).click();await expect(image).toHaveCount(0);await page.keyboard.press('Control+z');await expect(image).toHaveCount(1);await expect(image).toHaveAttribute('width','200');await page.keyboard.press('Control+z');await expect(image).toHaveAttribute('width',String(report.fitted));await page.keyboard.press('Control+y');await expect(image).toHaveAttribute('width','200');await expect(image).toHaveAttribute('alt','Site plan scan');
  await page.screenshot({path:path.join(output,'image.png')});await images.locator(':scope>summary').click();
 });
 const docx=path.join(profile,'tables-images.docx');
 await check('DOCX copy keeps spans, fill, column widths, image size and description',async()=>{
  await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},docx);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved tables-images.docx',{timeout:45000});
  const bytes=await fs.readFile(docx),xml=await (await JSZip.loadAsync(bytes)).file('word/document.xml').async('string'),html=(await mammoth.convertToHtml({buffer:bytes})).value;report.docxHtml=html.replace(/src="data:[^"]{40,}"/g,'src="data:…"').slice(0,700);
  for(const part of ['colspan="2"','rowspan="2"','alt="Site plan scan"'])if(!html.includes(part))throw new Error('DOCX read back without '+part+': '+report.docxHtml);
  if(!/w:fill="FFE699"/i.test(xml))throw new Error('DOCX has no cell shading for the filled cell.');const grid=(xml.match(/<w:gridCol w:w="(\d+)"/g)??[]).map(item=>Number(/\d+/.exec(item.slice(15))[0]));report.docxGrid=grid;if(grid.length!==3||Math.abs(grid[1]/grid[0]-2)>.05||Math.abs(grid[2]/grid[0]-1)>.05)throw new Error('DOCX column grid is '+JSON.stringify(grid));
  const extent=/<wp:extent cx="(\d+)" cy="(\d+)"/.exec(xml);report.docxImageEmu=extent&&[Number(extent[1]),Number(extent[2])];if(!extent||Math.abs(Number(extent[1])/9525-200)>1)throw new Error('DOCX image width is '+(extent&&Number(extent[1])/9525)+' px.');
 });
 await check('reopened DOCX shows the same table and image and is not marked edited',async()=>{
  const before={table:await cells(),widths:await editor.locator('table col').evaluateAll(columns=>columns.map(column=>Math.round(parseFloat(column.style.width)))),image:await editor.locator('img[data-pdfix-image]').evaluate(image=>[image.getAttribute('width'),image.getAttribute('height'),image.alt])};
  await page.getByRole('button',{name:'Home',exact:true}).click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},docx);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.locator('.document-area[data-ready="true"]').waitFor({timeout:45000});
  const after={table:await cells(),widths:await editor.locator('table col').evaluateAll(columns=>columns.map(column=>Math.round(parseFloat(column.style.width)))),image:await editor.locator('img[data-pdfix-image]').evaluate(image=>[image.getAttribute('width'),image.getAttribute('height'),image.alt])};report.reopened=after;
  if(JSON.stringify(after)!==JSON.stringify(before))throw new Error('Reopened: '+JSON.stringify(after)+' expected '+JSON.stringify(before));await page.waitForTimeout(900);await expect(page.locator('.draft-status')).toHaveText('Ready to edit');
 });
}catch(error){report.error=error.message;try{await page?.screenshot({path:path.join(output,'failure.png')});}catch{}}
finally{if(app){const pid=app.process().pid,closed=await Promise.race([app.close().then(()=>true,()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),15000))]);if(!closed){report.failures.push({name:'window closes after the checks',error:'The window did not close within 15 seconds.'});try{process.kill(pid);}catch{}}}await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});}
report.pass=!report.failures.length&&!report.errors.length&&!report.error;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exit(report.pass?0:1);
