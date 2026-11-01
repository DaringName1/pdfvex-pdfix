import {test,expect} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';
import {missingLayerFixture} from '../helpers/missing-layer-fixture.mjs';import {launchReader} from '../helpers/reader-launch.mjs';import {closeReaderApp} from '../helpers/reader-desktop.mjs';
test('unresolved layer names show artwork, real hidden layers stay hidden, and saved copies keep exact bytes',async()=>{
 const root=await fs.mkdtemp(path.resolve('.test-data/missing-layer-'));const app=await launchReader({args:['.'],env:{...process.env,PDFIX_TEST_VISIBLE:'0',PDFIX_TEST_DATA:path.join(root,'profile')}}),page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{for(const kind of ['missing-dictionary','missing-entry','defined-off']){
  const original=await missingLayerFixture(kind),file=path.join(root,kind+'.pdf');await fs.writeFile(file,original);await app.evaluate(({dialog},file)=>dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]}),file);await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(page.locator('.pdf-paper').first()).toHaveAttribute('data-ready','true');
  expect(await page.getByLabel('Rendered PDF page 1',{exact:true}).evaluate(c=>[...c.getContext('2d').getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data])).toEqual(kind==='defined-off'?[255,255,255,255]:[0,255,0,255]);
  const output=path.join(root,kind+'-copy.pdf');await app.evaluate(({dialog},filePath)=>dialog.showSaveDialog=async()=>({canceled:false,filePath}),output);await page.getByRole('button',{name:'Save a copy',exact:true}).click();await expect.poll(()=>fs.readFile(output).then(b=>b.equals(original),()=>false)).toBe(true);expect(await fs.readFile(file)).toEqual(original);await page.getByRole('button',{name:'Back to Home',exact:true}).click();
 }expect(errors).toEqual([]);}finally{await closeReaderApp(app);}
});
