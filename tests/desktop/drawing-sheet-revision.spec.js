import {readerRuntime} from '../helpers/reader-runtime.mjs';
import {test,expect,_electron as electron} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {PDFDocument,PDFName,PDFString} from 'pdf-lib';
import {readerTools,closeReaderApp} from '../helpers/reader-desktop.mjs';

for(const aligned of [false,true])test((aligned?'aligned different-geometry':'exact-geometry')+' sheet revision preserves comments, replies and untouched pages in a native saved copy',async()=>{
 test.setTimeout(180000);
 const root=await fs.mkdtemp(path.resolve('.test-data/sheet-revision-'));
 const doc=await PDFDocument.create(),first=doc.addPage([400,600]),second=doc.addPage([400,600]);
 first.drawText('OLD SHEET',{x:40,y:400});second.drawText('UNTOUCHED SHEET',{x:40,y:400});
 const comment=(pdf,page,name,contents)=>pdf.context.register(pdf.context.obj({Type:'Annot',Subtype:'Text',Rect:[40,200,60,220],P:page.ref,NM:PDFString.of(name),T:PDFString.of('Reviewer'),Contents:PDFString.of(contents),F:4,PrivateReviewField:PDFString.of('keep exact')}));
 const parent=comment(doc,first,'original-parent','Original comment'),reply=comment(doc,first,'original-reply','Reply comment');
 doc.context.lookup(reply).set(PDFName.of('IRT'),parent);doc.context.lookup(reply).set(PDFName.of('RT'),PDFName.of('R'));
 const link=doc.context.register(doc.context.obj({Type:'Annot',Subtype:'Link',Rect:[40,100,100,120],P:first.ref,Dest:[second.ref,'Fit'],Border:[0,0,0]}));
 first.node.set(PDFName.of('Annots'),doc.context.obj([parent,reply,link]));
 const donor=await PDFDocument.create(),fresh=donor.addPage([aligned?800:400,600]);fresh.drawText('NEW SHEET',{x:40,y:400});fresh.node.set(PDFName.of('Annots'),donor.context.obj([comment(donor,fresh,'new-comment','Replacement comment')]));
 const original=Buffer.from(await doc.save({useObjectStreams:false})),replacement=Buffer.from(await donor.save({useObjectStreams:false}));
 const source=path.join(root,'original.pdf'),chosen=path.join(root,'replacement.pdf'),output=path.join(root,'revised.pdf');await fs.writeFile(source,original);await fs.writeFile(chosen,replacement);
 let app;const errors=[];
 try{
  app=await electron.launch({args:[await readerRuntime()],env:{...process.env,PDFIX_TEST_VISIBLE:'0',PDFIX_TEST_DATA:path.join(root,'profile')}});const page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));await page.waitForLoadState('domcontentloaded');
  const choose=async file=>app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);
  await choose(source);await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(page.locator('.document-area .pdf-paper')).toHaveAttribute('data-ready','true');await readerTools(page,'Pages');await page.getByText('Page options and copy details',{exact:true}).click();await page.getByRole('button',{name:'Preserve comments / links: reorder original',exact:true}).click();
  const order=page.getByRole('dialog',{name:'Preserving page reorder',exact:true});await expect(order.getByRole('button',{name:'Replace sheets and carry comments forward',exact:true})).toBeEnabled();await order.getByRole('button',{name:'Replace sheets and carry comments forward',exact:true}).click();
  const tool=page.getByRole('dialog',{name:'Replace drawing sheets and review comment carry-forward',exact:true});await choose(chosen);await tool.getByRole('button',{name:'Choose replacement PDF',exact:true}).click();await expect(tool.getByRole('combobox',{name:'Original physical page',exact:true})).toBeEnabled({timeout:30000});
  await tool.getByRole('combobox',{name:'Original physical page',exact:true}).selectOption('1');await tool.getByRole('combobox',{name:'Replacement physical page',exact:true}).selectOption('1');await tool.getByRole('button',{name:'Add explicit sheet mapping',exact:true}).click();await tool.getByRole('combobox',{name:'Source comment policy for original page 1',exact:true}).selectOption('all');await tool.getByRole('combobox',{name:'Source links for original page 1',exact:true}).selectOption('retain');await tool.getByRole('combobox',{name:'Replacement comments for page 1',exact:true}).selectOption(aligned?'omit':'include');if(aligned){await tool.getByRole('combobox',{name:'Replacement alignment for original page 1',exact:true}).selectOption('fit-original');await tool.getByRole('spinbutton',{name:'Horizontal offset (points) for original page 1',exact:true}).fill('10');await tool.getByRole('spinbutton',{name:'Horizontal offset (points) for original page 1',exact:true}).press('Tab');await tool.getByRole('spinbutton',{name:'Vertical offset (points) for original page 1',exact:true}).fill('-5');await tool.getByRole('spinbutton',{name:'Vertical offset (points) for original page 1',exact:true}).press('Tab');}await tool.getByRole('checkbox',{name:'I reviewed these exact physical sheet numbers',exact:false}).check();await tool.getByRole('button',{name:'Prepare reviewed revision copy',exact:true}).click();
  await expect(tool).toContainText('The actual output reopened',{timeout:60000});await expect(tool.locator('canvas')).toHaveCount(3);await expect(tool.getByRole('checkbox',{name:'I reviewed every mapped original',exact:false})).toHaveCount(0);await expect(tool.getByRole('button',{name:'Choose filename and save revised copy',exact:true})).toBeEnabled();await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},output);await tool.getByRole('button',{name:'Choose filename and save revised copy',exact:true}).click();await expect(tool).toContainText('Saved revised drawing copy: revised.pdf',{timeout:30000});
  const saved=await PDFDocument.load(await fs.readFile(output)),before=await PDFDocument.load(original),savedFirst=saved.getPage(0),beforeFirst=before.getPage(0);
  expect(savedFirst.ref.toString()).toBe(beforeFirst.ref.toString());expect(saved.getPage(1).node.toString()).toBe(before.getPage(1).node.toString());
  for(const ref of [parent,reply,link])expect(saved.context.lookup(ref).toString()).toBe(before.context.lookup(ref).toString());
  expect(savedFirst.node.lookup(PDFName.of('Annots')).size()).toBe(aligned?3:4);expect(savedFirst.getWidth()).toBe(400);expect(savedFirst.node.get(PDFName.of('Contents')).toString()).not.toBe(beforeFirst.node.get(PDFName.of('Contents')).toString());
  expect(await fs.readFile(source)).toEqual(original);expect(await fs.readFile(chosen)).toEqual(replacement);expect(errors).toEqual([]);
  await tool.getByRole('button',{name:'Close sheet revision',exact:true}).click();await order.getByRole('button',{name:'Close preserving mode',exact:true}).click();await page.getByRole('button',{name:'Close page workspace',exact:true}).click();await page.getByRole('button',{name:'Back to Home',exact:true}).click();await choose(output);await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(page.locator('.document-area .pdf-paper')).toHaveAttribute('data-ready','true');await expect(page.locator('.document-area .textLayer')).toContainText('NEW SHEET');expect(errors).toEqual([]);
 }finally{await closeReaderApp(app);}
});
