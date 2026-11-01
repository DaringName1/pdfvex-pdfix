import {expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
import {inspectDocx} from './verify.mjs';

export const unifiedDraftHomeActions=[{
 name:'document: rename a draft in the title and preserve Home paragraph spacing in Word',weight:1,
 async run(page,ctx){
  await fs.mkdir(ctx.files,{recursive:true});const serial=ctx.draftHomeSerial=(ctx.draftHomeSerial||0)+1;await ctx.goHome();await page.getByRole('button',{name:'New document',exact:true}).first().click();
  const title=page.getByRole('button',{name:'Rename document',exact:true}),editor=page.getByRole('textbox',{name:'Editable document',exact:true});await expect(title).toHaveText('Untitled document');
  await title.press('F2');const name=page.getByRole('textbox',{name:'Document name',exact:true});await name.fill('Discard this name');await name.press('Escape');await expect(title).toHaveText('Untitled document');await expect(editor).toBeFocused();
  await title.dblclick();await name.fill('Study notes '+serial);await name.press('Enter');await expect(title).toHaveText('Study notes '+serial);await expect(name).toHaveCount(0);await expect(editor).toBeFocused();
  const text='Study notes retain paragraph spacing.';await editor.fill(text);await editor.press('Control+a');
  const compact=page.getByRole('button',{name:'Paragraph tools menu',exact:true}),spacing=page.getByRole('button',{name:'Spacing',exact:true});if(await compact.isVisible())await compact.press('ArrowDown');else await spacing.press('ArrowDown');
  await page.getByRole('combobox',{name:'Paragraph line spacing',exact:true}).selectOption('1.5');await page.getByRole('combobox',{name:'Paragraph space before',exact:true}).selectOption('6');await ctx.capture?.('draft-home-spacing');
  await page.getByRole('combobox',{name:'Paragraph space before',exact:true}).focus();await page.keyboard.press('Escape');await expect(await compact.isVisible()?compact:spacing).toBeFocused();await ctx.capture?.('draft-home-title');
  await page.getByRole('tab',{name:'File',exact:true}).click();await ctx.cancelSave();await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect(editor).toHaveText(text);await expect(title).toHaveText('Study notes '+serial);
  const output=path.join(ctx.files,'Study notes '+serial+'.docx');await ctx.saveAs(output);await page.getByRole('button',{name:'Export DOCX',exact:true}).click();await expect.poll(()=>inspectDocx(output).then(r=>r.text,()=>''),{timeout:120000}).toBe(text);await expect(page.getByRole('region',{name:'Saved copy',exact:true})).toContainText('Study notes '+serial+'.docx');await expect(page.getByRole('button',{name:'Export DOCX',exact:true})).toBeEnabled();ctx.unifiedDraftHome={output,text};
 },
 async verify(ctx){const{output,text}=ctx.unifiedDraftHome,info=await inspectDocx(output),zip=await JSZip.loadAsync(await fs.readFile(output)),xml=await zip.file('word/document.xml').async('string'),problems=[];if(!info.ok||info.text!==text)problems.push('The saved document lost its exact text.');if(!/<w:spacing\b[^>]*w:line="360"/.test(xml)||!/<w:spacing\b[^>]*w:before="120"/.test(xml))problems.push('The saved document lost line/paragraph spacing.');return{pass:!problems.length,problems,info};}
}];
