import {test,expect,_electron as electron} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
// A Markdown file's pictures in the real app: a picture beside the file is placed in the formatted copy, while a
// picture outside its folder and a web address stay text labels; nothing outside the folder is read.
const require=createRequire(import.meta.url),UPNG=require('@pdf-lib/upng').default;
let app,page,root;const errors=[];
test.describe.configure({timeout:process.env.CI?240000:120000});
test.beforeEach(async({},info)=>{root=path.resolve('.test-data',`markdown-pictures-${info.workerIndex}-${Date.now()}`);await fs.mkdir(path.join(root,'notes','pictures'),{recursive:true});errors.length=0;
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}});page=await app.firstWindow({timeout:process.env.CI?90000:30000});page.on('pageerror',e=>errors.push(e.message));await page.waitForLoadState('domcontentloaded');});
test.afterEach(async()=>{await app?.evaluate(({app})=>app.exit(0)).catch(()=>{});await app?.close().catch(()=>{});await fs.rm(root,{recursive:true,force:true}).catch(()=>{});});
const picture=()=>Buffer.from(UPNG.encode([new Uint8Array(8*6*4).fill(200).buffer],8,6,0));

test('a Markdown picture beside the file is placed; one outside the folder and a web address stay labels',async()=>{
 const notes=path.join(root,'notes','site.md');await fs.writeFile(path.join(root,'notes','pictures','beam.png'),picture());await fs.writeFile(path.join(root,'private.png'),picture());
 await fs.writeFile(notes,'# Site visit\n\n![Beam](pictures/beam.png)\n\n![Private](../private.png)\n\n![Web](https://example.com/x.png)\n');
 await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},notes);
 await page.getByRole('button',{name:'Open a file',exact:true}).click();
 await page.getByRole('button',{name:'Open as formatted document'}).click({timeout:30000});
 const editor=page.locator('.ProseMirror').first();await expect(editor.getByRole('heading',{name:'Site visit'})).toBeVisible({timeout:30000});
 await expect(editor.locator('img.document-inline-image')).toHaveCount(1,{timeout:30000});await expect(editor.locator('img.document-inline-image')).toHaveAttribute('alt','Beam');
 await expect(editor).toContainText('Private');await expect(editor).toContainText('Web');
 await expect(page.locator('.editor-warning')).toContainText('2 images stayed text labels');await page.getByRole('tab',{name:'File',exact:true}).click();await expect(page.locator('.editor-import-notes>summary')).toBeVisible();
 expect(errors).toEqual([]);
});
