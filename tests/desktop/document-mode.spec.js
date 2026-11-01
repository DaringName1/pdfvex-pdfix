import {documentModeActions} from '../../scripts/user-robot/actions-codex-document-mode.mjs';
import {test,expect,_electron as electron} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';
// Build and View in the document editor (owner, October 21): documents open in Build; View hides the formatting tabs
// and makes the text read-only; switching keeps unsaved text; Ctrl+Shift+E switches back.
let app,page,root;const errors=[];
test.describe.configure({timeout:process.env.CI?240000:120000});
test.beforeEach(async({},info)=>{root=path.resolve('.test-data',`document-mode-${info.workerIndex}-${Date.now()}`);await fs.mkdir(root,{recursive:true});errors.length=0;
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}});page=await app.firstWindow({timeout:process.env.CI?90000:30000});page.on('pageerror',e=>errors.push(e.message));await page.waitForLoadState('domcontentloaded');});
test.afterEach(async()=>{await app?.evaluate(({app})=>app.exit(0)).catch(()=>{});await app?.close().catch(()=>{});await fs.rm(root,{recursive:true,force:true}).catch(()=>{});});

test('a new document opens in Build; View is read-only without formatting tabs and keeps the text',async()=>{
 await page.getByRole('button',{name:'New document',exact:true}).first().click();const editor=page.getByRole('textbox',{name:'Editable document'});await editor.waitFor();
 const mode=page.getByRole('group',{name:'Document mode'});await expect(mode.getByRole('button',{name:'Mode: Build',exact:true})).toHaveAttribute('aria-expanded','false');
 await editor.click();await page.keyboard.type('Unsaved site note');await expect(page.getByRole('tablist',{name:'Document tool categories'})).toBeVisible();
 await mode.getByRole('button',{name:'Mode: Build',exact:true}).click();await mode.getByRole('menuitemradio',{name:/^View /}).click();await expect(mode.getByRole('button',{name:'Mode: View',exact:true})).toHaveAttribute('aria-expanded','false');
 await expect(page.getByRole('tablist',{name:'Document tool categories'})).toBeHidden();await expect(editor).toHaveAttribute('contenteditable','false');
 await expect(page.getByRole('button',{name:'Export DOCX',exact:true})).toBeVisible();
 await editor.click();await page.keyboard.type(' should not appear');await expect(editor).toHaveText('Unsaved site note');
 await page.keyboard.press('Control+Shift+E');await expect(mode.getByRole('button',{name:'Mode: Build',exact:true})).toHaveAttribute('aria-expanded','false');await expect(editor).toHaveAttribute('contenteditable','true');
 await editor.click();await page.keyboard.press('Control+End');await page.keyboard.type(' and more');await expect(editor).toHaveText('Unsaved site note and more');expect(errors).toEqual([]);
});

for(const [width,height,scale]of [[1366,820,1],[800,620,1],[800,620,1.5]])test(`one mode menu preserves exact saved Word text (${width},${scale})`,async({},info)=>{
 await app.evaluate(({BrowserWindow},[w,h])=>BrowserWindow.getAllWindows()[0].setSize(w,h),[width,height]);if(scale!==1){await page.getByRole('button',{name:/Settings/}).click();await page.getByRole('combobox',{name:'Interface text size',exact:true}).selectOption(String(scale));await page.getByRole('button',{name:'Home',exact:true}).click();}
 const ctx={files:path.join(root,'files'),goHome:async()=>{const back=page.getByRole('button',{name:/^Back to /});if(await back.isVisible())await back.click();await page.getByRole('button',{name:'Home',exact:true}).first().click();},chooseFile:file=>app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file),saveAs:file=>app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},file),capture:async name=>{await page.screenshot({path:info.outputPath(name+'.png'),animations:'disabled'});const menu=page.getByRole('menu',{name:'Choose document mode',exact:true});if(await menu.isVisible()){const rect=await menu.boundingBox(),size=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(size.width);expect(rect.y+rect.height).toBeLessThanOrEqual(size.height);}}};
 await documentModeActions[0].run(page,ctx);expect(await documentModeActions[0].verify(ctx)).toMatchObject({pass:true,problems:[]});expect(errors).toEqual([]);
});
