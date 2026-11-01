import {expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {inspectDocx,hash} from './verify.mjs';

export const documentModeActions=[{name:'document: one mode button keeps unsaved text and saves a verified Word copy',weight:1,async run(page,ctx){
  await fs.mkdir(ctx.files,{recursive:true});const serial=ctx.documentModeSerial=(ctx.documentModeSerial||0)+1;await ctx.goHome();await page.getByRole('button',{name:'New document',exact:true}).first().click();
  const editor=page.getByRole('textbox',{name:'Editable document',exact:true}),mode=page.getByRole('group',{name:'Document mode',exact:true});
  await editor.fill('Unsaved site note');await mode.getByRole('button',{name:'Mode: Build',exact:true}).click();
  await expect(mode.getByRole('menuitemradio',{name:/^Build /})).toHaveAttribute('aria-checked','true');await ctx.capture?.('document-mode-menu');
  await page.keyboard.press('ArrowUp');await expect(mode.getByRole('menuitemradio',{name:/^View /})).toBeFocused();await page.keyboard.press('Escape');await expect(mode.getByRole('button',{name:'Mode: Build',exact:true})).toBeFocused();await expect(mode.getByRole('menu')).not.toBeVisible();
  await mode.getByRole('button',{name:'Mode: Build',exact:true}).press('ArrowDown');await page.keyboard.press('Home');await expect(mode.getByRole('menuitemradio',{name:/^View /})).toBeFocused();await page.keyboard.press('Enter');
  await expect(editor).toHaveAttribute('contenteditable','false');await expect(editor).toHaveText('Unsaved site note');await ctx.capture?.('document-mode-view');
  await page.keyboard.press('Control+Shift+E');await expect(mode.getByRole('button',{name:'Mode: Build',exact:true})).toBeVisible();await expect(editor).toHaveAttribute('contenteditable','true');
  await editor.click();await page.keyboard.press('Control+End');await page.keyboard.type(' and more');await expect(editor).toHaveText('Unsaved site note and more');
  const output=path.join(ctx.files,'document-mode-copy-'+serial+'.docx');await ctx.saveAs(output);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect.poll(()=>fs.stat(output).then(s=>s.size,()=>0),{timeout:120000}).toBeGreaterThan(0);const before=await fs.readFile(output);ctx.codexDocumentMode={output,hash:hash(before)};await ctx.capture?.('document-mode-saved');
  await ctx.goHome();await ctx.chooseFile(output);await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(page.getByRole('textbox',{name:'Editable document',exact:true})).toHaveText('Unsaved site note and more');await expect(page.getByRole('button',{name:'Mode: Build',exact:true})).toBeVisible();
},async verify(ctx){const result=await inspectDocx(ctx.codexDocumentMode.output),problems=[];if(!result.ok||result.text!=='Unsaved site note and more')problems.push('Saved Word copy did not retain exact text across mode changes.');if(hash(await fs.readFile(ctx.codexDocumentMode.output))!==ctx.codexDocumentMode.hash)problems.push('Reopening changed the saved Word copy.');return {pass:!problems.length,problems,info:result};}}];
