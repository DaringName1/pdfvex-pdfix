import {chooseDocumentMode} from './document-mode.mjs';
import {expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {PDFDocument} from 'pdf-lib';
import {hash} from './verify.mjs';

async function inspectGroups(page,ctx,tab,groups){
 const panel=page.getByRole('tabpanel',{name:tab,exact:true});
 await expect(page.getByText(/^Opened .*Your original is unchanged\.$/).first()).not.toBeVisible({timeout:12000});
 if(tab==='Export'){const buttons=panel.getByRole('button');const names=await buttons.evaluateAll(nodes=>nodes.filter(n=>n.checkVisibility()&&!n.getAttribute('aria-label')?.endsWith('tools menu')&&n.getAttribute('aria-label')!=='Show or hide tool names').map(n=>n.getAttribute('aria-label')));expect(names).toEqual(['PDF to images','Extract a table','Compress a PDF','Name and save unchanged copy','Print-production marks']);}
 await ctx.capture?.(tab.toLowerCase()+'-ribbon-default');
 for(const[name,count]of groups){
  const toggle=panel.getByRole('button',{name:name+' tools menu',exact:true});await toggle.press('ArrowDown');
  const menu=page.getByRole('menu',{name:name+' tools',exact:true});
  await expect(menu.getByRole('menuitem')).toHaveCount(count);
  await expect(menu.getByRole('menuitem').first()).toBeFocused();
  await ctx.capture?.(tab.toLowerCase()+'-menu-'+name.replaceAll(' ','-'));
  await page.keyboard.press('Escape');await expect(toggle).toBeFocused();
 }
 const names=panel.getByRole('button',{name:'Show or hide tool names',exact:true});
 if(await names.getAttribute('aria-pressed')==='false')await names.click();
 if(tab==='Export')for(const name of ['PDF to images','Extract a table','Compress a PDF','Name and save unchanged copy','Print-production marks']){const control=panel.getByRole('button',{name,exact:true});if(!await control.isVisible())continue;const label=control.locator('.reader-ribbon-name');expect(await label.evaluate(n=>n.getBoundingClientRect().height<=2*parseFloat(getComputedStyle(n).lineHeight)+1)).toBe(true);}
 await ctx.capture?.(tab.toLowerCase()+'-ribbon-names');if(tab==='Export'){expect((await page.getByLabel('PDF page view',{exact:true}).boundingBox()).height).toBeGreaterThanOrEqual(160);for(const[group,tool]of [['Size and copies','Name and save unchanged copy'],['Print and archive','Print-production marks']]){await panel.getByRole('button',{name:group+' tools menu',exact:true}).press('ArrowDown');await expect(page.getByRole('menu',{name:group+' tools',exact:true}).getByRole('menuitem',{name:tool,exact:true})).toBeEnabled();await page.keyboard.press('Escape');}}await names.click();return panel;
}

export function makeOutputRibbonActions(h){return [{
 name:'export: grouped tools compress a real PDF and preserve its canceled preview',weight:1,
 async run(page,ctx){
  const f=await h.setup(ctx),source=await h.fileFor(ctx,'output-ribbon-input');
  const pdf=await PDFDocument.create(),sheet=pdf.addPage([400,600]);sheet.drawText('Grouped export retains this text',{x:40,y:520});
  sheet.node.addContentStream(pdf.context.register(pdf.context.stream('q\nQ\n'.repeat(20000))));
  const input=Buffer.from(await pdf.save({useObjectStreams:false}));await fs.writeFile(source,input,{flag:'wx'});f.inputs.push([source,hash(input)]);
  await h.open(page,ctx,source);await h.menu(page,'Export');
  const originalZoom=await page.getByRole('status').filter({hasText:/^\d+%$/}).textContent();
  const panel=await inspectGroups(page,ctx,'Export',[['Save as',2],['Size and copies',2],['Print and archive',4]]);
  const search=page.getByRole('searchbox',{name:'Filter tools',exact:true});await search.fill('Compress');
  await expect(panel.getByRole('button',{name:'Compress a PDF',exact:true})).toBeVisible();
  await expect(panel.getByRole('button',{name:'PDF to images',exact:true})).not.toBeVisible();await search.press('Escape');
  await panel.getByRole('button',{name:'Size and copies tools menu',exact:true}).click();
  await page.getByRole('menu',{name:'Size and copies tools',exact:true}).getByRole('menuitem',{name:'Compress a PDF',exact:true}).click();
  const dialog=page.getByRole('region',{name:'Compress a PDF options',exact:true});await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(dialog.getByRole('button',{name:'Compare quality with original',exact:true})).toBeEnabled({timeout:120000});
  await dialog.getByRole('button',{name:'Compare quality with original',exact:true}).click();
  await expect(page.getByText(/No artwork changes detected/)).toBeVisible({timeout:120000});
  await page.getByRole('button',{name:'Close PDF comparison',exact:true}).click();
  await expect(dialog.getByRole('status').filter({hasText:'1 page independently reopened.'})).toBeVisible();
  await expect(dialog.getByRole('checkbox',{name:'I checked the compressed PDF quality',exact:true})).toHaveCount(0);await ctx.capture?.('export-compressed-preview');
  await ctx.cancelSave();await dialog.getByRole('button',{name:'Save compressed PDF',exact:true}).click();
  await expect(dialog.getByRole('status').filter({hasText:/Saving canceled/})).toBeVisible({timeout:120000});
  const output=await h.fileFor(ctx,'grouped-compressed');await ctx.saveAs(output);await dialog.getByRole('button',{name:'Save compressed PDF',exact:true}).click();
  await h.saved(output);await expect(dialog.getByRole('button',{name:'Refresh preview',exact:true})).toBeEnabled({timeout:120000});
  await dialog.getByRole('button',{name:'Close compression workspace',exact:true}).click();
  const zoom=page.getByRole('status').filter({hasText:/^\d+%$/});await expect(zoom).toHaveText(originalZoom);await ctx.capture?.('export-original-restored');
  await page.getByRole('button',{name:'Compress a PDF',exact:true}).click();await expect(dialog.getByRole('button',{name:'Compare quality with original',exact:true})).toBeEnabled({timeout:120000});await chooseDocumentMode(page,'view');await page.getByRole('button',{name:'Zoom in',exact:true}).click();await expect(zoom).not.toHaveText(originalZoom);const changedZoom=await zoom.textContent();await chooseDocumentMode(page,'build');await dialog.getByRole('button',{name:'Close compression workspace',exact:true}).click();await expect(zoom).toHaveText(changedZoom);await ctx.capture?.('export-manual-zoom-restored');
  h.outcome(ctx,output,{pages:1,text:['Grouped export retains this text']});ctx.outputRibbonSize=input.length;
 },async verify(ctx){const result=await h.verify(ctx),size=(await fs.stat(ctx.codexOutcome.output)).size;
  if(size>=ctx.outputRibbonSize)return {...result,pass:false,problems:[...result.problems,'Compressed output is not smaller than the generated source.']};return result;}
},{
 name:'protect: grouped checks save a source-matched security report without changing the PDF',weight:1,
 async run(page,ctx){
  const source=await h.freshSource(ctx),sourceHash=hash(await fs.readFile(source));await h.open(page,ctx,source);await h.menu(page,'Protect');
  const panel=await inspectGroups(page,ctx,'Protect',[['Secure',3],['Check',4]]);
  const search=page.getByRole('searchbox',{name:'Filter tools',exact:true});await search.fill('security report');
  await expect(panel.getByRole('button',{name:'Security report',exact:true})).toBeVisible();
  await expect(panel.getByRole('button',{name:'Redact a PDF',exact:true})).not.toBeVisible();await search.press('Escape');
  await panel.getByRole('button',{name:'Check tools menu',exact:true}).click();
  await page.getByRole('menu',{name:'Check tools',exact:true}).getByRole('menuitem',{name:'Security report',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'PDF security report',exact:true}),save=dialog.getByRole('button',{name:'Save report as text',exact:true});
  await expect(save).toBeEnabled({timeout:120000});
  const bounds=await save.boundingBox(),screen=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
  expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(screen.height);
  expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(screen.width);
  const scale=await page.evaluate(()=>Number(getComputedStyle(document.body).getPropertyValue('--ui-font-scale'))||1);
  const countSize=await dialog.getByRole('table',{name:'Items found in parsed structures',exact:true}).getByRole('cell').first().evaluate(node=>parseFloat(getComputedStyle(node).fontSize));
  expect(countSize).toBeGreaterThanOrEqual(12*scale);
  await ctx.capture?.('protect-security-report');
  await ctx.cancelSave();await save.click();await expect(save).toBeEnabled({timeout:120000});
  const output=await h.fileFor(ctx,'security-report','txt');await ctx.saveAs(output);await save.click();await h.saved(output);
  await expect(save).toBeEnabled({timeout:120000});const message=page.getByRole('status').filter({hasText:'PDF security report saved as a new text copy.'});await expect(message).toBeVisible();await expect.poll(async()=>{const m=await message.boundingBox(),d=await dialog.boundingBox();return !!m&&!!d&&d.y+d.height<=m.y+1;}).toBe(true);await ctx.capture?.('protect-report-saved-message');await dialog.getByRole('button',{name:'Close',exact:true}).click();
  await expect(panel.getByRole('button',{name:'Security report',exact:true})).toBeFocused();
  ctx.securityRibbon={source,output,sha256:sourceHash};
 },async verify(ctx){
  const {source,output,sha256}=ctx.securityRibbon,report=await fs.readFile(output,'utf8'),problems=[];
  if(hash(await fs.readFile(source))!==sha256)problems.push('Security inspection changed the source PDF.');
  for(const text of ['PDFix PDF security report','Snapshot SHA-256: '+sha256,'JavaScript-bearing dictionaries: 0','Encryption: not found'])if(!report.includes(text))problems.push('Saved report missing '+text);
  const pdf=await PDFDocument.load(await fs.readFile(source));if(pdf.getPageCount()!==3)problems.push('Source page count changed.');
  return {pass:!problems.length,problems,info:{file:output,sourceSha256:sha256,pages:pdf.getPageCount(),bytes:Buffer.byteLength(report)}};
 }
}];}
