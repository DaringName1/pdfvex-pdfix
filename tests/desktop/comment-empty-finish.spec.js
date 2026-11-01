import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {launchReader,attachReaderFailure} from '../helpers/reader-launch.mjs';
import {readerRuntime} from '../helpers/reader-runtime.mjs';import {closeReaderApp} from '../helpers/reader-desktop.mjs';
import {commentActions} from '../../scripts/user-robot/actions-codex-comment.mjs';
for(const size of [[1366,820,1,0],[1366,700,1,0],[800,620,1,0],[800,620,1.5,0],[1366,820,1,90],[1366,820,1,270]])test(`Unused comments disappear and existing comments remain (${size})`,async({},info)=>{
 test.setTimeout(180000);const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-comment-finish-')),app=await launchReader({args:[await readerRuntime()],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}},info),page=await app.firstWindow(),errors=[];let failed=false;page.on('pageerror',e=>errors.push(e.message));
 try{await app.evaluate(({BrowserWindow},s)=>BrowserWindow.getAllWindows()[0].setSize(s[0],s[1]),size);if(size[2]!==1){await page.getByRole('button',{name:/Settings/}).click();await page.getByRole('combobox',{name:'Interface text size',exact:true}).selectOption(String(size[2]));await page.getByRole('button',{name:'Home',exact:true}).click();}
 const ctx={commentRotation:size[3],files:path.join(root,'files'),goHome:async()=>{await page.getByRole('button',{name:'Home',exact:true}).first().click();},chooseFile:file=>app.evaluate(({dialog},file)=>dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]}),file),saveAs:filePath=>app.evaluate(({dialog},filePath)=>dialog.showSaveDialog=async()=>({canceled:false,filePath}),filePath),cancelSave:()=>app.evaluate(({dialog})=>dialog.showSaveDialog=async()=>({canceled:true})),capture:name=>page.screenshot({path:info.outputPath(name+'.png')})};
 await commentActions[0].run(page,ctx);expect(await commentActions[0].verify(ctx)).toMatchObject({pass:true,problems:[]});expect(errors).toEqual([]);
 }catch(error){failed=true;await attachReaderFailure(app,info,error);throw error;}finally{try{await closeReaderApp(app);}catch(error){if(!failed)throw error;}}
});
