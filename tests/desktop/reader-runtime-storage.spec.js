import {test,expect,_electron as electron} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
import {readerRuntime,releaseReaderRuntime} from '../helpers/reader-runtime.mjs';
import {closeReaderApp} from '../helpers/reader-desktop.mjs';
test('temporary reader runtime opens outside Drive and is cleaned after closing',async({},info)=>{
 const snapshot=await readerRuntime(),profile=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-storage-smoke-'));let app,stderr='';
 try{expect(path.dirname(snapshot)).toBe(path.join(os.tmpdir(),'pdfix-test-runtimes'));app=await electron.launch({args:[snapshot],env:{...process.env,PDFIX_TEST_DATA:profile,PDFIX_TEST_VISIBLE:'0'},timeout:30000});app.process().stderr?.on('data',chunk=>stderr+=chunk);const page=await app.firstWindow({timeout:30000});await expect(page.getByRole('button',{name:'Open a file',exact:true})).toBeVisible();}
 catch(error){await info.attach('runtime-startup',{body:Buffer.from(stderr),contentType:'text/plain'});throw error;}
 finally{if(app)await closeReaderApp(app);await releaseReaderRuntime();expect(await fs.stat(snapshot).then(()=>true,()=>false)).toBe(false);}
});
