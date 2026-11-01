import {expect} from '@playwright/test';
import fs from 'node:fs/promises';import path from 'node:path';
import {PDFDocument} from 'pdf-lib';import {Document,Packer,Paragraph} from 'docx';
import {inspectPdf,inspectDocx,hash} from './verify.mjs';

export const copyTitleActions=[{
 name:'files: title names the next PDF or Word copy without renaming either original',weight:1,
 async run(page,ctx){
  await fs.mkdir(ctx.files,{recursive:true});const serial=ctx.copyTitleSerial=(ctx.copyTitleSerial||0)+1;const outputs=[];
  for(const ext of ['pdf','docx']){
   await ctx.goHome();const text='Original source stays here.',source=path.join(ctx.files,'original-'+serial+'.'+ext),output=path.join(ctx.files,'Named copy '+serial+'.'+ext);
   let bytes;if(ext==='pdf'){const pdf=await PDFDocument.create();pdf.addPage([400,600]).drawText(text,{x:30,y:500});bytes=Buffer.from(await pdf.save());}else bytes=Buffer.from(await Packer.toBuffer(new Document({sections:[{children:[new Paragraph(text)]}]})));
   await fs.writeFile(source,bytes);await ctx.chooseFile(source);await page.getByRole('button',{name:'Open a file',exact:true}).click();if(ext==='pdf')await expect(page.getByLabel('Rendered PDF page 1',{exact:true})).toBeVisible();else await expect(page.getByRole('textbox',{name:'Editable document',exact:true})).toHaveText(text);
   const title=page.getByRole('button',{name:'Rename document',exact:true});await title.dblclick();const field=page.getByRole('textbox',{name:'Document name',exact:true});await field.fill('Named copy '+serial+'.'+ext);await field.press('Enter');await expect(title).toHaveText('Named copy '+serial+'.'+ext);await expect(page.getByText('Next copy name',{exact:true})).toBeVisible();await expect(page.getByText('Next copy name',{exact:true})).toHaveAttribute('title','The original remains original-'+serial+'.'+ext);expect(hash(await fs.readFile(source))).toBe(hash(bytes));
   await ctx.capture?.('copy-title-'+ext);await ctx.suggestedCopyDialog(output,true);await page.getByRole('button',{name:ext==='pdf'?'Save a copy':'Save',exact:true}).click();await ctx.verifySuggestedCopy(output);expect(await fs.stat(output).then(()=>true,()=>false)).toBe(false);
   await ctx.suggestedCopyDialog(output,false);await page.getByRole('button',{name:ext==='pdf'?'Save a copy':'Save',exact:true}).click();await expect.poll(()=>fs.stat(output).then(s=>s.size,()=>0),{timeout:120000}).toBeGreaterThan(0);await ctx.verifySuggestedCopy(output);outputs.push({source,output,ext,originalSha:hash(bytes),text});
  }
  ctx.copyTitles=outputs;
 },
 async verify(ctx){const problems=[];for(const r of ctx.copyTitles){if(hash(await fs.readFile(r.source))!==r.originalSha)problems.push('Original was changed: '+r.ext);const info=r.ext==='pdf'?await inspectPdf(r.output):await inspectDocx(r.output);if(!info.ok||!info.text.includes(r.text))problems.push('Named copy lost text: '+r.ext);}return{pass:!problems.length,problems};}
}];
