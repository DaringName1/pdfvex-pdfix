import {test,expect,_electron as electron} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';import {openTool} from '../helpers/open-tool.js';
// Extract a table on the page (owner, October 18): drag around the table, let PDFix suggest its rows and columns from
// the words, drag a grid line to adjust, and the rebuilt cells hold the right words.
let app,page,root;const errors=[],slow={timeout:process.env.CI?120000:60000};
test.describe.configure({timeout:process.env.CI?240000:120000});
const TABLE=[['Part','Qty','Note'],['Bolt M8','12','Zinc plated'],['Nut M8','30','Order more'],['Washer','45','In stock']],X=72,TOP=692,COLUMN=150,ROW=30;
test.beforeEach(async({},info)=>{root=path.resolve('.test-data',`table-on-page-${info.workerIndex}-${Date.now()}`);await fs.mkdir(root,{recursive:true});errors.length=0;
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}});page=await app.firstWindow({timeout:process.env.CI?90000:30000});page.on('pageerror',e=>errors.push(e.message));await page.waitForLoadState('domcontentloaded');});
test.afterEach(async()=>{await app?.evaluate(({app})=>app.exit(0)).catch(()=>{});await app?.close().catch(()=>{});await fs.rm(root,{recursive:true,force:true}).catch(()=>{});});

test('drag around a table, suggest rows and columns, drag a column line, and the cells are right',async()=>{
 const file=path.join(root,'Parts table.pdf'),doc=await PDFDocument.create(),sheet=doc.addPage([612,792]),font=await doc.embedFont(StandardFonts.Helvetica);
 sheet.drawText('Parts list for the site visit',{x:X,y:740,size:14,font});for(let r=0;r<TABLE.length;r++)for(let c=0;c<3;c++)sheet.drawText(TABLE[r][c],{x:X+6+c*COLUMN,y:TOP-r*ROW-20,size:11,font});
 for(let r=0;r<=TABLE.length;r++)sheet.drawLine({start:{x:X,y:TOP-r*ROW},end:{x:X+3*COLUMN,y:TOP-r*ROW},thickness:.7,color:rgb(0,0,0)});await fs.writeFile(file,await doc.save());
 await app.evaluate(({dialog},f)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});},file);await openTool(page,/^Extract a table/,'Extract a table');
 const d=page.getByRole('region',{name:'Extract a table options',exact:true});await d.waitFor(slow);await expect(d.getByRole('button',{name:'Read selectable words',exact:true})).toBeEnabled(slow);
 const overlay=page.locator('.document-area .table-extraction-overlay');const box=await overlay.boundingBox(),at=(x,y)=>({x:box.x+x/612*box.width,y:box.y+(792-y)/792*box.height});
 const a=at(X-3,TOP+3),b=at(X+3*COLUMN+3,TOP-TABLE.length*ROW-3);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:8});await page.mouse.up();
 await d.getByRole('button',{name:'Read selectable words',exact:true}).click();await d.getByRole('button',{name:'Suggest rows and columns',exact:true}).click({timeout:30000});
 await expect(d.getByRole('spinbutton',{name:'Rows',exact:true})).toHaveValue('4');await expect(d.getByRole('spinbutton',{name:'Columns',exact:true})).toHaveValue('3');await expect(page.locator('.document-area .table-extraction-column-line')).toHaveCount(2);
 await d.getByText('Uneven rows or columns',{exact:true}).click();
 const cuts=d.getByRole('textbox',{name:'Column breaks %'}),before=await cuts.inputValue(),line=await page.locator('.document-area .table-extraction-column-line').first().boundingBox(),target=at(X+COLUMN-4,TOP-60);
 await page.mouse.move(line.x+line.width/2,line.y+line.height/2);await page.mouse.down();await page.mouse.move(target.x,line.y+line.height/2,{steps:6});await page.mouse.up();
 const after=await cuts.inputValue();expect(after).not.toBe(before);expect(Math.abs(Number(after.split(',')[0])-(COLUMN-1)/(3*COLUMN+6)*100)).toBeLessThan(3);
 await d.getByRole('button',{name:'Rebuild table from words',exact:true}).click();const cells=await d.evaluate(node=>[...node.querySelectorAll('table tr')].map(row=>[...row.querySelectorAll('td,th')].map(cell=>(cell.querySelector('input,textarea')?.value??cell.textContent).trim())).filter(row=>row.length));
 const flat=JSON.stringify(cells);for(const value of ['Bolt M8','Zinc plated','Washer','45'])expect(flat).toContain(value);expect(flat).not.toContain('Parts list for');expect(errors).toEqual([]);
});
