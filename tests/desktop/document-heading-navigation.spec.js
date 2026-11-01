import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';
import {objectOptionsActions} from '../../scripts/user-robot/actions-codex-object-options.mjs';
import {launchReader} from '../helpers/reader-launch.mjs';import {readerRuntime} from '../helpers/reader-runtime.mjs';import {closeReaderApp} from '../helpers/reader-desktop.mjs';
for(const size of [[1366,820,1],[1366,700,1],[800,620,1],[800,620,1.5]])test('Word heading navigation retains exact saved headings ('+size.join(',')+')',async({},info)=>{
 test.setTimeout(180000);await fs.mkdir('.test-data',{recursive:true});const root=await fs.mkdtemp(path.resolve('.test-data/heading-navigation-'));
 const app=await launchReader({args:[await readerRuntime()],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}},info),page=await app.firstWindow(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 try{await app.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setSize(size[0],size[1]),size);if(size[2]!==1){await page.getByRole('button',{name:/Settings/}).click();await page.getByRole('combobox',{name:'Interface text size',exact:true}).selectOption(String(size[2]));await page.getByRole('button',{name:'Home',exact:true}).click();}
 const ctx={files:path.join(root,'files'),goHome:async()=>{const back=page.getByRole('button',{name:'Back to Home',exact:true});if(await back.isVisible())await back.click();await page.getByRole('button',{name:'Home',exact:true}).click();},chooseFile:file=>app.evaluate(({dialog},file)=>dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]}),file),saveAs:filePath=>app.evaluate(({dialog},filePath)=>dialog.showSaveDialog=async()=>({canceled:false,filePath}),filePath),cancelSave:()=>app.evaluate(({dialog})=>dialog.showSaveDialog=async()=>({canceled:true})),capture:name=>page.screenshot({path:info.outputPath(name+'.png')})};
 await objectOptionsActions[1].run(page,ctx);expect(await objectOptionsActions[1].verify(ctx)).toMatchObject({pass:true,problems:[]});expect(errors).toEqual([]);
 }catch(error){await page.screenshot({path:info.outputPath('heading-navigation-failure.png')}).catch(()=>{});throw error;}finally{await closeReaderApp(app);}
});
