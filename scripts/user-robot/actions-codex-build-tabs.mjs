import {expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {Document,Packer,Paragraph} from 'docx';
import JSZip from 'jszip';
import {BUILD_TABS} from '../../src/build-tabs.js';
import {chooseDocumentMode} from './document-mode.mjs';
import {inspectPdf,inspectDocx,hash} from './verify.mjs';

export const buildTabActions=[{
 name:'build: shared tabs retain the original and save readable PDF and Word copies',weight:1,
 async run(page,ctx){
  await fs.mkdir(ctx.files,{recursive:true});const serial=ctx.buildTabSerial=(ctx.buildTabSerial||0)+1;ctx.buildTabCopies=[];
  for(const ext of ['pdf','docx']){
   await ctx.goHome();const text='Unified Build tabs preserve this original.',source=path.join(ctx.files,'build-tabs-source-'+serial+'.'+ext),output=path.join(ctx.files,'build-tabs-copy-'+serial+'.'+ext);
   let bytes;if(ext==='pdf'){const pdf=await PDFDocument.create();pdf.addPage([400,600]).drawText(text,{x:25,y:510,size:13});bytes=Buffer.from(await pdf.save());}else bytes=await Packer.toBuffer(new Document({sections:[{children:[new Paragraph(text)]}]}));
   await fs.writeFile(source,bytes);await ctx.chooseFile(source);await page.getByRole('button',{name:'Open a file',exact:true}).click();
   if(ext==='pdf')await expect(page.getByLabel('Rendered PDF page 1',{exact:true})).toBeVisible();else await expect(page.getByRole('textbox',{name:'Editable document',exact:true})).toHaveText(text);
   await chooseDocumentMode(page,'build');const tabs=page.getByRole('tablist',{name:ext==='pdf'?'PDF tool groups':'Document tool categories',exact:true});
   expect(await tabs.getByRole('tab').allTextContents()).toEqual(BUILD_TABS);
   for(const name of BUILD_TABS){const tab=tabs.getByRole('tab',{name,exact:true});
    if(await tab.isDisabled()){expect(await tab.getAttribute('title')).toMatch(/PDF/);continue;}
    await tab.click();await expect(tab).toHaveAttribute('aria-selected','true');
    if(ext==='pdf'&&name==='Review')await expect(page.getByRole('toolbar',{name:'Comment tools',exact:true}).getByRole('button',{name:'Select',exact:true})).toBeEnabled({timeout:120000});
    if(ext==='pdf'&&name==='Pages')await expect(page.getByRole('button',{name:'Rotate output page 1',exact:true})).toBeEnabled({timeout:120000});
    if(ext==='docx'&&name==='Pages'){
     const setup=page.getByText('Page setup',{exact:true});await setup.click();const panel=page.getByRole('region',{name:'Page setup options',exact:true});await expect(panel).toBeVisible();await panel.getByRole('textbox',{name:'Footer text',exact:true}).fill('Saved from the page setup panel');await ctx.capture?.('shared-tabs-docx-page-setup');await page.keyboard.press('Escape');await expect(panel).not.toBeVisible();await expect(setup).toBeFocused();
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    if(['Home','Insert','Review','Pages','Export'].includes(name))await ctx.capture?.('shared-tabs-'+ext+'-'+name);
   }
   const home=tabs.getByRole('tab',{name:'Home',exact:true});await home.click();await home.press('End');await expect(tabs.getByRole('tab',{name:'Export',exact:true})).toBeFocused();await home.click();
   if(ext==='pdf'){await chooseDocumentMode(page,'quick');await expect(tabs).not.toBeVisible();await chooseDocumentMode(page,'build');}
   await ctx.cancelSave();await page.getByRole('button',{name:ext==='pdf'?'Save a copy':'Export DOCX',exact:true}).click();expect(await fs.stat(output).then(()=>true,()=>false)).toBe(false);
   await ctx.saveAs(output);await page.getByRole('button',{name:ext==='pdf'?'Save a copy':'Export DOCX',exact:true}).click();await expect.poll(()=>fs.stat(output).then(s=>s.size,()=>0),{timeout:120000}).toBeGreaterThan(0);
   if(ext==='docx')await expect(page.getByRole('button',{name:'Export DOCX',exact:true})).toBeEnabled({timeout:120000});
   ctx.buildTabCopies.push({source,output,ext,text,originalHash:hash(bytes)});
  }
 },
 async verify(ctx){const problems=[];for(const r of ctx.buildTabCopies){if(hash(await fs.readFile(r.source))!==r.originalHash)problems.push('Original changed: '+r.ext);const info=await(r.ext==='pdf'?inspectPdf(r.output):inspectDocx(r.output));if(!info.ok||!info.text.includes(r.text))problems.push('Saved copy lost readable text: '+r.ext);if(r.ext==='pdf'&&hash(await fs.readFile(r.output))!==r.originalHash)problems.push('Untouched PDF copy bytes differ.');if(r.ext==='docx'){const zip=await JSZip.loadAsync(await fs.readFile(r.output));let found=false;for(const file of Object.values(zip.files))if(/^word\/footer\d+\.xml$/.test(file.name)&&!file.dir)found||=(await file.async('string')).includes('Saved from the page setup panel');if(!found)problems.push('Page setup footer missing from saved Word copy.');}}return{pass:!problems.length,problems};}
}];
