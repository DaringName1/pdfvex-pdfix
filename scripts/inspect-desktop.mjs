import { _electron as electron } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('.test-data/inspection');await fs.mkdir(root,{recursive:true});
const app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'user-data')}});
app.process().stdout?.on('data',data=>process.stdout.write(data));app.process().stderr?.on('data',data=>process.stderr.write(data));
const page=await app.firstWindow();page.on('console',msg=>console.log(msg.type(),msg.text()));page.on('pageerror',error=>console.log('PAGE ERROR',error.message));
await page.getByRole('heading',{name:'What would you like to do?'}).waitFor();console.log('URL',page.url());await page.screenshot({path:path.join(root,'home.png')});await app.close();
