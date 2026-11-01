import {test,expect,_electron as electron} from '@playwright/test';import fs from 'node:fs/promises';import path from 'node:path';import {openTool} from '../helpers/open-tool.js';import {createRequire} from 'node:module';const UPNG=createRequire(import.meta.url)('@pdf-lib/upng').default;
// Create from clipboard (Electron 44 reads the clipboard asynchronously; the old synchronous calls broke this tool).
// Copied text becomes an editable document; a copied picture arrives as a PNG (Windows re-encodes it, so its size
// differs), and one over four million pixels is refused. The clipboard is put back afterwards.
let app,page,root,before;const errors=[];
test.describe.configure({timeout:process.env.CI?240000:120000});
test.beforeEach(async({},info)=>{root=path.resolve('.test-data',`clipboard-${info.workerIndex}-${Date.now()}`);await fs.mkdir(root,{recursive:true});errors.length=0;
 app=await electron.launch({args:['.'],env:{...process.env,PDFIX_TEST_DATA:path.join(root,'profile'),PDFIX_TEST_VISIBLE:'0'}});page=await app.firstWindow({timeout:process.env.CI?90000:30000});page.on('pageerror',e=>errors.push(e.message));await page.waitForLoadState('domcontentloaded');
 before=await app.evaluate(({clipboard})=>clipboard.readText()).catch(()=>'');});
test.afterEach(async()=>{await app?.evaluate(({clipboard},t)=>clipboard.writeText(t),before).catch(()=>{});await app?.evaluate(({app})=>app.exit(0)).catch(()=>{});await app?.close().catch(()=>{});await fs.rm(root,{recursive:true,force:true}).catch(()=>{});});

test('copied text becomes an editable document',async()=>{
 const text='Copied site note: crane booked for Thursday';await app.evaluate(({clipboard},t)=>clipboard.writeText(t),text);
 await openTool(page,/^Create from email or clipboard/,'Create from email or clipboard');const d=page.locator('dialog[open]').last();await d.waitFor();
 await d.getByRole('button',{name:'Clipboard text / screenshot',exact:true}).click();await d.getByRole('button',{name:'Paste clipboard now',exact:true}).click();
 await expect(d.locator('[role=status]').last()).toContainText('1 clipboard item(s) added',{timeout:30000});await expect(d.locator('.email-clipboard-preview')).toContainText('Plain text');await d.getByRole('checkbox',{name:/I checked the text, pictures/}).check();
 await d.getByRole('button',{name:'Create editable document',exact:true}).click();await expect(page.getByRole('textbox',{name:'Editable document'})).toContainText(text,{timeout:60000});expect(errors).toEqual([]);
});
test('a copied picture is read as a PNG, and an oversized one is refused in plain words',async()=>{
 const put=bytes=>app.evaluate(async({clipboard,ClipboardItem},b64)=>{await clipboard.write([new ClipboardItem({'image/png':new Blob([Buffer.from(b64,'base64')],{type:'image/png'})})]);},bytes.toString('base64'));
 const read=()=>page.evaluate(async()=>{try{const r=await window.pdfix.readCreationClipboard();return {image:r.image&&{mime:r.image.mime,bytes:r.image.bytes.length}};}catch(e){return {error:e.message};}});
 const picture=await fs.readFile('tests/fixtures/scan-page.png');await put(picture);const small=await read();expect(small.image?.mime).toBe('image/png');expect(small.image.bytes).toBeGreaterThan(1000);
 const side=2001,huge=Buffer.from(UPNG.encode([new Uint8Array(side*side*4).fill(255).buffer],side,side,0));await put(huge);expect((await read()).error).toMatch(/four million pixels/);
});
