import {readerRuntime} from '../helpers/reader-runtime.mjs';
import {test,expect,_electron as electron} from '@playwright/test';
import os from 'node:os';import fs from 'node:fs/promises';import path from 'node:path';
import {PDFDocument,PDFName,PDFDict,PDFArray} from 'pdf-lib';
import fixture from '../helpers/review-freetext.cjs';
import {readerTools,closeReaderApp} from '../helpers/reader-desktop.mjs';

test('FreeText keeps its appearance and private data while an additive Unicode reply saves and reopens',async()=>{
  test.setTimeout(150000);
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-freetext-reply-')),source=path.join(root,'source.pdf'),output=path.join(root,'reply.pdf'),original=await fixture.freeTextSource({rich:true});
  await fs.writeFile(source,original);let app;const errors=[];
  try{
    app=await electron.launch({args:[await readerRuntime()],env:{...process.env,PDFIX_TEST_VISIBLE:'0',PDFIX_TEST_DATA:path.join(root,'profile')}});
    const page=await app.firstWindow();page.on('pageerror',error=>errors.push(error.message));await page.waitForLoadState('domcontentloaded');
    const pick=file=>app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);
    await pick(source);await page.getByRole('button',{name:'Open a file',exact:true}).click();
    await expect(page.locator('.document-area .pdf-paper')).toHaveAttribute('data-ready','true',{timeout:30000});
    await readerTools(page,'Comment','Review drawing comments');await page.getByRole('button',{name:'Review drawing comments',exact:true}).click();
    const panel=page.locator('.pdf-review-panel');await expect(panel.locator('.pdf-review-row')).toHaveCount(1,{timeout:30000});const filters=panel.locator('.pdf-review-filter-drawer');await expect(filters).not.toHaveAttribute('open','');await panel.getByText('Filter comments',{exact:true}).click();await expect(panel.getByRole('searchbox',{name:'Search',exact:true})).toBeVisible();await panel.getByText('Filter comments',{exact:true}).click();await panel.locator('.pdf-review-row').click();
    await expect(panel.getByRole('button',{name:'Edit plain comment',exact:true})).toBeDisabled();
    await panel.getByRole('button',{name:'Add reply / review entry',exact:true}).click();
    const tool=page.locator('.pdf-review-edit-workspace');
    await tool.getByRole('textbox',{name:'Plain comment text',exact:true}).fill('Réponse 中文');
    await tool.getByRole('textbox',{name:'Reply author (required)',exact:true}).fill('Réviewer');
    await tool.getByRole('combobox',{name:'New standard review entry',exact:true}).selectOption('Accepted');
    await tool.getByRole('button',{name:'Stage this change',exact:true}).click();await tool.getByRole('button',{name:'Build reviewed PDF copy',exact:true}).click();
    const reviewed=tool.getByRole('button',{name:'Save PDF copy',exact:true});await expect(reviewed).toBeEnabled({timeout:60000});await expect(reviewed).toBeEnabled();
    await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},output);
    await tool.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(tool.locator('.review-edit-status')).toContainText('Saved reply.pdf',{timeout:30000});
    const before=await PDFDocument.load(original),after=await PDFDocument.load(await fs.readFile(output));
    const notes=doc=>doc.getPage(0).node.lookup(PDFName.of('Annots'),PDFArray),parent=notes(before).lookup(0,PDFDict),retained=notes(after).lookup(0,PDFDict);
    expect(retained.toString()).toBe(parent.toString());
    const appearance=dict=>dict.lookup(PDFName.of('AP'),PDFDict).lookup(PDFName.of('N'));
    expect(Buffer.from(appearance(retained).contents)).toEqual(Buffer.from(appearance(parent).contents));expect(appearance(retained).dict.toString()).toBe(appearance(parent).dict.toString());
    expect(notes(after).size()).toBe(2);expect(notes(after).lookup(1,PDFDict).get(PDFName.of('Contents')).decodeText()).toBe('Réponse 中文');
    await tool.getByRole('button',{name:'Close',exact:true}).click();await panel.getByRole('button',{name:'Collapse',exact:true}).click();await page.getByRole('button',{name:'Back to Home',exact:true}).click();
    await pick(output);await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(page.locator('.document-area .pdf-paper')).toHaveAttribute('data-ready','true');
    await readerTools(page,'Comment','Review drawing comments');await page.getByRole('button',{name:'Review drawing comments',exact:true}).click();await expect(panel.locator('.pdf-review-row')).toHaveCount(2,{timeout:30000});
    await panel.locator('.pdf-review-row').filter({hasText:'Réponse 中文'}).click();await expect(panel.locator('.pdf-review-detail')).toContainText('Accepted');await expect(panel.locator('.pdf-review-detail')).toContainText('Original free text');
    expect(await fs.readFile(source)).toEqual(original);expect(errors).toEqual([]);
  }finally{await closeReaderApp(app);}
});

test('plain FreeText body rebuilds visible text through native preview, copy save and reopen',async()=>{
  test.setTimeout(150000);const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-freetext-body-')),source=path.join(root,'source.pdf'),output=path.join(root,'body.pdf'),original=await fixture.freeTextSource();await fs.writeFile(source,original);let app;const errors=[];
  try{
    app=await electron.launch({args:[await readerRuntime()],env:{...process.env,PDFIX_TEST_VISIBLE:'0',PDFIX_TEST_DATA:path.join(root,'profile')}});const page=await app.firstWindow();page.on('pageerror',error=>errors.push(error.message));await page.waitForLoadState('domcontentloaded');
    const pick=file=>app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);
    await pick(source);await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(page.locator('.document-area .pdf-paper')).toHaveAttribute('data-ready','true',{timeout:30000});await readerTools(page,'Comment','Review drawing comments');await page.getByRole('button',{name:'Review drawing comments',exact:true}).click();
    const panel=page.locator('.pdf-review-panel');await expect(panel.locator('.pdf-review-row')).toHaveCount(1,{timeout:30000});await panel.locator('.pdf-review-row').click();await panel.getByRole('button',{name:'Edit plain comment',exact:true}).click();
    const tool=page.locator('.pdf-review-edit-workspace');await expect(tool.locator('.review-edit-editor')).toContainText('rebuilds the visible text box');await tool.getByRole('textbox',{name:'Plain comment text',exact:true}).fill('Updated gate note');await tool.getByRole('button',{name:'Stage this change',exact:true}).click();await tool.getByRole('button',{name:'Build reviewed PDF copy',exact:true}).click();
    const reviewed=tool.getByRole('button',{name:'Save PDF copy',exact:true});await expect(reviewed).toBeEnabled({timeout:60000});await expect(reviewed).toBeEnabled();await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},output);await tool.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(tool.locator('.review-edit-status')).toContainText('Saved body.pdf',{timeout:30000});
    const before=await PDFDocument.load(original),after=await PDFDocument.load(await fs.readFile(output)),notes=doc=>doc.getPage(0).node.lookup(PDFName.of('Annots'),PDFArray),a=notes(before).lookup(0,PDFDict),b=notes(after).lookup(0,PDFDict);expect(b.get(PDFName.of('Contents')).decodeText()).toBe('Updated gate note');expect(b.get(PDFName.of('PrivateFixture')).toString()).toBe(a.get(PDFName.of('PrivateFixture')).toString());expect(b.lookup(PDFName.of('AP'),PDFDict).get(PDFName.of('N')).toString()).not.toBe(a.lookup(PDFName.of('AP'),PDFDict).get(PDFName.of('N')).toString());
    for(const [ref,object]of before.context.enumerateIndirectObjects())if(ref.toString()!==notes(before).get(0).toString())expect(after.context.lookup(ref).toString()).toBe(object.toString());
    await tool.getByRole('button',{name:'Close',exact:true}).click();await panel.getByRole('button',{name:'Collapse',exact:true}).click();await page.getByRole('button',{name:'Back to Home',exact:true}).click();await pick(output);await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(page.locator('.document-area .pdf-paper')).toHaveAttribute('data-ready','true');await readerTools(page,'Comment','Review drawing comments');await page.getByRole('button',{name:'Review drawing comments',exact:true}).click();await expect(panel.locator('.pdf-review-row')).toContainText('Updated gate note');expect(await fs.readFile(source)).toEqual(original);expect(errors).toEqual([]);
  }finally{await closeReaderApp(app);}
});
