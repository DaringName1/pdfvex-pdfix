import {test,expect,_electron as electron} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
// Pictures in documents: a BMP is accepted and prepared as PNG, then turned and cropped through the Images panel.
// The picture is red on its left half and blue on its right, so the saved Word copy shows whether the turn went the
// right way and the crop kept the right part: after a right turn red is on top, and cropping the top half leaves blue.
const require=createRequire(import.meta.url),JSZip=require('jszip'),UPNG=require('@pdf-lib/upng').default;
let app,page,root;const errors=[];
const slow={timeout:process.env.CI?120000:60000};
test.describe.configure({timeout:process.env.CI?240000:120000});
test.beforeEach(async({},info)=>{root=path.resolve('.test-data',`doc-pictures-${info.workerIndex}-${Date.now()}`);await fs.mkdir(root,{recursive:true});errors.length=0;
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}});page=await app.firstWindow({timeout:process.env.CI?90000:30000});page.on('pageerror',e=>errors.push(e.message));await page.waitForLoadState('domcontentloaded');});
test.afterEach(async()=>{await app?.evaluate(({app})=>app.exit(0)).catch(()=>{});await app?.close().catch(()=>{});});
// A 40×20 24-bit BMP: left half red, right half blue (rows bottom-up, each padded to 4 bytes).
function halvesBmp(width=40,height=20){const row=Math.ceil(width*3/4)*4,size=54+row*height,b=Buffer.alloc(size);b.write('BM',0);b.writeUInt32LE(size,2);b.writeUInt32LE(54,10);b.writeUInt32LE(40,14);b.writeInt32LE(width,18);b.writeInt32LE(height,22);b.writeUInt16LE(1,26);b.writeUInt16LE(24,28);b.writeUInt32LE(row*height,34);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const at=54+y*row+x*3;if(x<width/2)b[at+2]=255;else b[at]=255;}return b;}
async function savedPicture(file){const zip=await JSZip.loadAsync(await fs.readFile(file)),name=Object.keys(zip.files).find(n=>/^word\/media\/.+\.png$/i.test(n));expect(name).toBeTruthy();const png=UPNG.decode((await zip.file(name).async('uint8array')).buffer),rgba=new Uint8Array(UPNG.toRGBA8(png)[0]);
 const at=(x,y)=>{const i=(y*png.width+x)*4;return rgba[i]>200&&rgba[i+2]<60?'red':rgba[i+2]>200&&rgba[i]<60?'blue':'other';};return {width:png.width,height:png.height,top:at(Math.floor(png.width/2),1),bottom:at(Math.floor(png.width/2),png.height-2)};}

test('a BMP picture is inserted, turned right and cropped; Undo reverses each change and the Word copy keeps the result',async()=>{
 const bmp=path.join(root,'halves.bmp');await fs.writeFile(bmp,halvesBmp());
 await page.getByRole('button',{name:'New document',exact:true}).first().click();const editor=page.getByRole('textbox',{name:'Editable document'});await editor.waitFor();await editor.click();await page.keyboard.type('Picture check ');
 const images=page.locator('.document-image-controls');await page.getByRole('tab',{name:'Insert',exact:true}).click();await images.locator(':scope>summary').click();await images.locator('[data-file]').setInputFiles(bmp);
 const image=editor.locator('img[data-pdfix-image]');await expect(image).toHaveCount(1,slow);await expect(image).toHaveAttribute('src',/^data:image\/png;base64,/);await expect(image).toHaveAttribute('data-pdfix-image-width','40');await expect(image).toHaveAttribute('data-pdfix-image-height','20');
 await image.click();await images.getByRole('button',{name:'Turn right',exact:true}).click();await expect(image).toHaveAttribute('data-pdfix-image-width','20',slow);await expect(image).toHaveAttribute('data-pdfix-image-height','40');
 await expect(images.getByRole('status')).toContainText('Picture turned');
 await images.locator('.document-image-crop summary').click();await images.locator('[data-crop-top]').fill('50');await images.getByRole('button',{name:'Apply crop',exact:true}).click();
 await expect(image).toHaveAttribute('data-pdfix-image-height','20',slow);await expect(image).toHaveAttribute('data-pdfix-image-width','20');await expect(images.getByRole('status')).toContainText('Picture cropped');
 await page.keyboard.press('Control+z');await expect(image).toHaveAttribute('data-pdfix-image-height','40');await page.keyboard.press('Control+z');await expect(image).toHaveAttribute('data-pdfix-image-width','40');
 await page.keyboard.press('Control+y');await page.keyboard.press('Control+y');await expect(image).toHaveAttribute('data-pdfix-image-height','20');await expect(image).toHaveAttribute('data-pdfix-image-width','20');
 const dest=path.join(root,'pictures.docx');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},dest);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved pictures.docx',slow);
 expect(await savedPicture(dest)).toEqual({width:20,height:20,top:'blue',bottom:'blue'});expect(errors).toEqual([]);
});

test('turning without cropping puts the left half on top; a crop that keeps nothing is refused and changes nothing',async()=>{
 const bmp=path.join(root,'halves.bmp');await fs.writeFile(bmp,halvesBmp());
 await page.getByRole('button',{name:'New document',exact:true}).first().click();const editor=page.getByRole('textbox',{name:'Editable document'});await editor.waitFor();await editor.click();
 const images=page.locator('.document-image-controls');await page.getByRole('tab',{name:'Insert',exact:true}).click();await images.locator(':scope>summary').click();await images.locator('[data-file]').setInputFiles(bmp);const image=editor.locator('img[data-pdfix-image]');await expect(image).toHaveCount(1,slow);
 await image.click();await images.getByRole('button',{name:'Turn right',exact:true}).click();await expect(image).toHaveAttribute('data-pdfix-image-width','20',slow);
 await images.locator('.document-image-crop summary').click();await images.locator('[data-crop-left]').fill('60');await images.locator('[data-crop-right]').fill('60');await images.getByRole('button',{name:'Apply crop',exact:true}).click();
 await expect(images.getByRole('status')).toContainText('Keep at least 5%');await expect(image).toHaveAttribute('data-pdfix-image-width','20');await expect(image).toHaveAttribute('data-pdfix-image-height','40');
 const dest=path.join(root,'turned.docx');await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},dest);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect(page.locator('#toast')).toContainText('Saved turned.docx',slow);
 expect(await savedPicture(dest)).toEqual({width:20,height:40,top:'red',bottom:'blue'});expect(errors).toEqual([]);
});

test('dragging the corner handle of a selected picture resizes it keeping its shape; Undo restores the size',async()=>{
 await page.getByRole('button',{name:'New document',exact:true}).first().click();const editor=page.getByRole('textbox',{name:'Editable document'});await editor.waitFor();await editor.click();
 const images=page.locator('.document-image-controls');await page.getByRole('tab',{name:'Insert',exact:true}).click();await images.locator(':scope>summary').click();await images.locator('[data-file]').setInputFiles(path.resolve('tests/fixtures/scan-page.png'));
 const image=editor.locator('img[data-pdfix-image]');await expect(image).toHaveCount(1,slow);await image.click();await images.locator('[data-width]').fill('200');await images.getByRole('button',{name:'Apply size / description',exact:true}).click();await expect(image).toHaveAttribute('width','200');
 const ratio=Number(await image.getAttribute('data-pdfix-image-height'))/Number(await image.getAttribute('data-pdfix-image-width'));
 await image.click();const handle=editor.locator('.document-image-handle');await expect(handle).toBeVisible();await handle.scrollIntoViewIfNeeded();await page.waitForTimeout(200);const box=await handle.boundingBox(),shown=(await image.boundingBox()).width,scale=shown/200;
 // If the drag does not take (seen only in the cloud), say what is under the pointer and how big the window is.
 const under=await page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return (e?.className||e?.tagName||'nothing')+' in '+innerWidth+'x'+innerHeight;},[box.x+box.width/2,box.y+box.height/2]);
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+60*scale,box.y+box.height/2+20,{steps:6});await page.mouse.move(box.x+box.width/2+100*scale,box.y+box.height/2+30,{steps:6});await page.mouse.up();
 await expect.poll(async()=>Number(await image.getAttribute('width')),{message:'picture width after dragging the handle (under the pointer: '+under+')'}).toBeGreaterThan(285);const width=Number(await image.getAttribute('width'));expect(width).toBeLessThan(315);expect(Math.abs(Number(await image.getAttribute('height'))-width*ratio)).toBeLessThan(1.5);
 await page.keyboard.press('Control+z');await expect(image).toHaveAttribute('width','200');expect(errors).toEqual([]);
});

// V1 audit, area 5: the header is valid but the picture data inside is broken (PNG, JPEG, GIF, short BMP). Each is
// refused in plain words and nothing is placed; a good picture and typing still work afterwards.
test('pictures with a valid header but broken data are refused in plain words, and the editor keeps working',async()=>{
 const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.from('0000000d494844520000002800000014080200000000000000','hex'),Buffer.from('0000004049444154','hex'),Buffer.alloc(64,0x5a),Buffer.alloc(4),Buffer.from('0000000049454e44ae426082','hex')]);
 const jpeg=Buffer.concat([Buffer.from('ffd8ffc0000b080014002801011100ffda0008010100003f00','hex'),Buffer.alloc(200,0x77),Buffer.from('ffd9','hex')]);
 const gif=Buffer.concat([Buffer.from('GIF89a'),Buffer.from([40,0,20,0,0,0,0]),Buffer.from([0x2c,0,0,0,0,40,0,20,0,0,8]),Buffer.alloc(30,0xff),Buffer.from([0,0x3b])]);
 const bmp=halvesBmp().subarray(0,80);
 const cases={'broken.png':png,'broken.jpg':jpeg,'broken.gif':gif,'short.bmp':bmp};
 await page.getByRole('button',{name:'New document',exact:true}).first().click();const editor=page.getByRole('textbox',{name:'Editable document'});await editor.waitFor();await editor.click();await page.keyboard.type('Broken pictures ');
 const images=page.locator('.document-image-controls');await page.getByRole('tab',{name:'Insert',exact:true}).click();await images.locator(':scope>summary').click();const placed=editor.locator('img[data-pdfix-image]');
 for(const [name,bytes] of Object.entries(cases)){const file=path.join(root,name);await fs.writeFile(file,bytes);const before=await placed.count();const started=Date.now();
  await images.locator('[data-file]').setInputFiles(file);await expect(images.getByRole('status'),name+' is refused in plain words').toContainText('could not be decoded',slow);await images.getByRole('status').evaluate(node=>{node.textContent='';});
  expect(Date.now()-started,name+' is handled within 30 seconds').toBeLessThan(30000);
  expect(await placed.count(),name+' is not placed').toBe(before);}
 await images.locator('[data-file]').setInputFiles(await fs.writeFile(path.join(root,'good.bmp'),halvesBmp()).then(()=>path.join(root,'good.bmp')));
 await expect(placed.last()).toHaveAttribute('data-pdfix-image-width','40',slow);
 await editor.click();await page.keyboard.press('Control+End');await page.keyboard.type(' still typing');await expect(editor).toContainText('still typing');expect(errors).toEqual([]);
});
