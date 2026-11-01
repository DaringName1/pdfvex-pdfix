import {expect} from '@playwright/test';
import path from 'node:path';

export function makeWindowLayoutActions(h){return [{
 name:'window: compact document rail, readable file tabs and unchanged saved copy',weight:1,
 async run(page,ctx){
  const first=await h.freshSource(ctx);await h.open(page,ctx,first);
  const home=page.getByRole('button',{name:'Home',exact:true}),expand=page.getByRole('button',{name:'Expand sidebar',exact:true});
  await expect(expand).toHaveAttribute('aria-expanded','false');expect((await home.boundingBox()).width).toBeLessThan(80);
  await ctx.capture?.('document-rail-compact');await expand.click();
  await expect(page.getByRole('button',{name:'Collapse sidebar',exact:true})).toHaveAttribute('aria-expanded','true');expect((await home.boundingBox()).width).toBeGreaterThan(120);
  await ctx.capture?.('document-rail-expanded');await page.keyboard.press('Control+Shift+b');await expect(expand).toBeVisible();
  let current;for(let i=0;i<2;i++){current=await h.freshSource(ctx);await h.open(page,ctx,current);}
  const tabs=page.getByRole('navigation',{name:'Open documents (Ctrl+Tab switches)',exact:true});
  for(const file of [first,current]){
   const text=tabs.getByText(path.basename(file),{exact:true});await text.scrollIntoViewIfNeeded();expect((await text.boundingBox()).width).toBeGreaterThan(55);
  }
  const last=tabs.getByRole('button',{name:'PDF '+path.basename(current),exact:true});await last.focus();await expect(last).toBeFocused();await expect(last).toHaveAttribute('aria-current','page');
  await ctx.capture?.('document-tabs-readable');
  const output=await h.fileFor(ctx,'document-window-copy');await h.copy(page,ctx,output);h.outcome(ctx,output,{pages:3,exact:true,text:['needle 1','needle 2','needle 3']});
  const message=page.getByRole('status').filter({hasText:/^Saved codex-document-window-copy/});await expect(message).toBeVisible();await expect.poll(async()=>{const m=await message.boundingBox(),body=await page.getByRole('main').boundingBox();return !!m&&!!body&&body.y+body.height<=m.y+1;}).toBe(true);await ctx.capture?.('document-save-message');
  await ctx.goHome();await expect(page.getByRole('button',{name:'Collapse sidebar',exact:true})).toBeVisible();expect((await home.boundingBox()).width).toBeGreaterThan(120);await ctx.capture?.('home-rail-restored');
 },verify:h.verify
}];}
