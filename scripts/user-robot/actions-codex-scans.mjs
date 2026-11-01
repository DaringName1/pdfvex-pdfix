import {expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {hash,inspectPdf} from './verify.mjs';
import {SCAN_MEMORY_MESSAGE} from '../../src/pdf-reader-image-policy.js';
// ctx.scanFixtures holds generated local inputs; no client drawings are needed.
export const scanActions=[{name:'reader: large scans paint, oversized scans explain, unchanged copy stays exact',weight:1,async run(page,ctx){
 await fs.mkdir(ctx.files,{recursive:true});
 for(const fixture of ctx.scanFixtures){
  await ctx.goHome();await ctx.chooseFile(fixture.file);await page.getByRole('button',{name:'Open a file',exact:true}).click();
  if(fixture.refused){await expect(page.getByRole('alert').filter({hasText:SCAN_MEMORY_MESSAGE})).toBeVisible({timeout:120000});}
  else {const canvas=page.getByLabel('Rendered PDF page 1',{exact:true});await expect.poll(()=>canvas.evaluate(c=>c.width*c.height),{timeout:120000}).toBeGreaterThan(0);await expect.poll(()=>canvas.evaluate(c=>c.getContext('2d').getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data[0]),{timeout:120000}).toBeLessThan(20);expect(await canvas.evaluate(c=>c.width*c.height)).toBeLessThanOrEqual(16000000);}
  await ctx.capture?.(fixture.name);
  // A failed page must not make the other page inaccessible.
  const number=page.getByRole('spinbutton',{name:'Page number',exact:true});await number.fill('2');await number.press('Tab');const canvas=page.getByLabel('Rendered PDF page 2',{exact:true});await expect.poll(()=>canvas.evaluate(c=>c.width*c.height),{timeout:120000}).toBeGreaterThan(0);await expect(page.getByRole('alert').filter({hasText:SCAN_MEMORY_MESSAGE})).toHaveCount(0);
 }
 const selected=ctx.scanFixtures.find(row=>!row.refused),output=path.join(ctx.files,'large-scan-unchanged-copy.pdf');await ctx.goHome();await ctx.chooseFile(selected.file);await page.getByRole('button',{name:'Open a file',exact:true}).click();await expect(page.getByLabel(/^Rendered PDF page /)).toBeVisible({timeout:120000});const firstPage=page.getByRole('spinbutton',{name:'Page number',exact:true});await firstPage.fill('1');await firstPage.press('Tab');await expect(page.getByLabel('Rendered PDF page 1',{exact:true})).toBeVisible({timeout:120000});await ctx.saveAs(output);await page.getByRole('button',{name:'Save a copy',exact:true}).first().click();await expect.poll(()=>fs.stat(output).then(s=>s.size,()=>0),{timeout:120000}).toBeGreaterThan(0);ctx.scanCopy={output,source:selected.file};
 },async verify(ctx){const before=await fs.readFile(ctx.scanCopy.source),after=await fs.readFile(ctx.scanCopy.output),info=await inspectPdf(ctx.scanCopy.output);return {pass:hash(before)===hash(after)&&info.ok&&info.pages===2,problems:hash(before)===hash(after)?[]:['Saving an unchanged scan altered its bytes.'],info};}}];
