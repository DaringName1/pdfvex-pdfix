import {test,expect,_electron as electron} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';
// Settings names the PDFix version, so testers can say which version a problem happened in (release paperwork, Oct 23).
let app,page,root;
test.beforeEach(async({},info)=>{root=path.resolve('.test-data',`settings-version-${info.workerIndex}-${Date.now()}`);await fs.mkdir(root,{recursive:true});
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}});page=await app.firstWindow({timeout:process.env.CI?90000:30000});});
test.afterEach(async()=>{await app?.evaluate(({app})=>app.exit(0)).catch(()=>{});await app?.close().catch(()=>{});await fs.rm(root,{recursive:true,force:true}).catch(()=>{});});

test('Settings shows the PDFix version from the app itself',async()=>{
 const version=JSON.parse(await fs.readFile('package.json','utf8')).version;
 await page.getByRole('button',{name:/Settings/}).first().click();
 await expect(page.locator('.settings-version')).toHaveText(`PDFix version ${version} (development run)`,{timeout:30000});
});
