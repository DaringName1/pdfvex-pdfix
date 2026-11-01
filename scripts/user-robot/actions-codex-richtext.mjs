import {chooseDocumentMode} from './document-mode.mjs';
// Opt-in X1 actions. Only visible roles/names drive the app; saved bytes decide success.
import fs from 'node:fs/promises';import path from 'node:path';import {randomUUID} from 'node:crypto';
import {PDFDocument,PDFName,PDFArray,PDFDict} from 'pdf-lib';import {expect} from '@playwright/test';
import fixture from '../../tests/helpers/review-richtext.cjs';
import {inspectPdf,hash} from './verify.mjs';
const deadline={timeout:120000},k=PDFName.of;
const firstNote=pdf=>pdf.getPage(0).node.lookup(k('Annots'),PDFArray).lookup(0,PDFDict);
export async function verifyRichTextFiles(source,output,originalHash,expectedText){
 const beforeBytes=await fs.readFile(source),bytes=await fs.readFile(output),problems=[];
 if(hash(beforeBytes)!==originalHash)problems.push('The original PDF changed.');
 const info=await inspectPdf(output);if(!info.ok||info.pages!==1||!info.text.includes('Original drawing artwork'))problems.push('Saved PDF page/artwork text failed independent readback.');
 const before=await PDFDocument.load(beforeBytes),after=await PDFDocument.load(bytes),a=firstNote(before),b=firstNote(after);
 if(b.get(k('RC'))?.decodeText()!==a.get(k('RC')).decodeText().replace('Original free text',expectedText))problems.push('Rich formatting or paragraph text changed unexpectedly.');
 const sourceRef=before.getPage(0).node.lookup(k('Annots'),PDFArray).get(0).toString();
 if(b.get(k('Contents'))?.decodeText()!==expectedText)problems.push('Saved richtext text differs.');
 for(const [key,value]of a.entries())if(!['Contents','M','AP','RC'].includes(key.decodeText())&&b.get(key)?.toString()!==value.toString())problems.push('Rich text geometry or retained field changed: '+key.decodeText());
 for(const [ref,object]of before.context.enumerateIndirectObjects())if(ref.toString()!==sourceRef&&after.context.lookup(ref)?.toString()!==object.toString())problems.push('Original object changed: '+ref.toString());
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(bytes),useSystemFonts:true});
 try{const doc=await task.promise,notes=await(await doc.getPage(1)).getAnnotations();if(notes.length!==1||notes[0].contentsObj?.str!==expectedText||notes[0].textContent?.join('')!==expectedText||!notes[0].hasAppearance)problems.push('Independent reader did not recover exact richtext appearance text.');}finally{await task.destroy();}
 return {pass:!problems.length,problems,info:{pages:info.pages,bytes:bytes.length,sha256:hash(bytes),originalUnchanged:hash(beforeBytes)===originalHash,geometryAndOriginalObjectsPreserved:!problems.length}};
}
export const richTextActions=[{
 name:'drawing review: edit a uniformly formatted comment, save and reopen',weight:2,
 async run(page,ctx){
  await fs.mkdir(ctx.files,{recursive:true});const id=randomUUID(),source=path.join(ctx.files,'richtext-source-'+id+'.pdf'),output=path.join(ctx.files,'richtext-reviewed-'+id+'.pdf');
  const bytes=await fixture.richTextSource();await fs.writeFile(source,bytes,{flag:'wx'});const text='Reviewed rich comment';
  await ctx.goHome();await ctx.chooseFile(source);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.getByLabel('Rendered PDF page 1',{exact:true}).first().waitFor(deadline);
  async function comments(){await chooseDocumentMode(page,'build');await page.getByRole('tablist',{name:'PDF tool groups',exact:true}).getByRole('tab',{name:'Review',exact:true}).click();const action=page.getByRole('button',{name:'Review drawing comments',exact:true});if(!await action.isVisible())await page.getByRole('searchbox',{name:'Filter tools',exact:true}).fill('Review drawing comments');await action.click();const panel=page.getByRole('region',{name:'Drawing-wide source comments',exact:true});await expect(panel.getByRole('button',{name:'Inspect source comments',exact:true})).toBeEnabled(deadline);return panel;}
  const panel=await comments();await panel.getByRole('button',{name:/Original free text/}).first().click();await panel.getByRole('button',{name:'Edit plain comment',exact:true}).click();
  const d=page.getByRole('dialog',{name:'Stage PDF review comment edits and replies',exact:true});await ctx.capture?.('richtext-open');const limits=d.getByText('Editing limits and draft files',{exact:true}),limitText=d.getByText('No source annotations change before saving a copy.',{exact:false});await expect(limitText).not.toBeVisible();await limits.focus();await limits.press('Enter');await expect(limitText).toBeVisible();await ctx.capture?.('richtext-limits');await limits.press('Space');await expect(limitText).not.toBeVisible();await d.getByRole('textbox',{name:'Plain comment text',exact:true}).fill(text);await d.getByRole('button',{name:'Stage this change',exact:true}).click();
  await ctx.capture?.('richtext-staged');await d.getByRole('button',{name:'Build reviewed PDF copy',exact:true}).click();const reviewed=d.getByRole('button',{name:'Save PDF copy',exact:true});await expect(reviewed).toBeEnabled(deadline);await d.getByRole('heading',{name:'Original source',exact:true}).scrollIntoViewIfNeeded();await ctx.capture?.('richtext-preview-source');await reviewed.scrollIntoViewIfNeeded();await ctx.capture?.('richtext-preview');await expect(reviewed).toBeEnabled();await ctx.saveAs(output);await d.getByRole('button',{name:'Save PDF copy',exact:true}).click();await expect(d.getByRole('button',{name:'Save PDF copy',exact:true})).toBeEnabled(deadline);await expect(d.getByRole('status').filter({hasText:'Saved richtext-reviewed-'})).toBeVisible();await ctx.capture?.('richtext-saved');
  await d.getByRole('button',{name:'Close',exact:true}).click();await panel.getByRole('button',{name:'Collapse',exact:true}).click();await ctx.goHome();await ctx.chooseFile(output);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.getByLabel('Rendered PDF page 1',{exact:true}).first().waitFor(deadline);const reopened=await comments();await expect(reopened.getByRole('button',{name:new RegExp(text)}).first()).toBeVisible(deadline);await reopened.getByRole('button',{name:'Collapse',exact:true}).click();await ctx.goHome();
  ctx.codexReviewOutcome={source,output,originalHash:hash(bytes),text};
 },
 verify:ctx=>{const o=ctx.codexReviewOutcome;return verifyRichTextFiles(o.source,o.output,o.originalHash,o.text);}
}];
