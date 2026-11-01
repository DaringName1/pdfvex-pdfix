import {expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {hash} from './verify.mjs';

export function makePagesRibbonActions(h){return [{
 name:'pages: grouped toolbar searches, rotates, cancels and saves an inspected copy',weight:1,
 async run(page,ctx){
  const source=await h.freshSource(ctx),before=hash(await fs.readFile(source));
  await h.open(page,ctx,source);await h.menu(page,'Pages');
  const toolbar=page.getByRole('tabpanel',{name:'Pages',exact:true});
  const workspace=page.getByRole('region',{name:'Organize PDF pages',exact:true});
  await expect(workspace.getByRole('button',{name:'Rotate output page 1',exact:true})).toBeEnabled({timeout:120000});
  await expect(page.getByText(/^Opened .*Your original is unchanged\.$/).first()).not.toBeVisible({timeout:12000});
  await ctx.capture?.('pages-ribbon-default');
  for(const[name,count]of [['Organize',3],['Numbering',1],['Outline and boxes',3]]){
   const toggle=toolbar.getByRole('button',{name:name+' tools menu',exact:true});
   await toggle.press('ArrowDown');
   const menu=page.getByRole('menu',{name:name+' tools',exact:true});
   await expect(menu.getByRole('menuitem')).toHaveCount(count);
   await expect(menu.getByRole('menuitem').first()).toBeFocused();
   await ctx.capture?.('pages-ribbon-menu-'+name.replaceAll(' ','-'));
   await page.keyboard.press('Escape');await expect(toggle).toBeFocused();
  }
  const search=page.getByRole('searchbox',{name:'Filter tools',exact:true});
  await search.fill('page boxes');
  await expect(toolbar.getByRole('button',{name:'Edit PDF page boxes',exact:true})).toBeVisible();
  await expect(toolbar.getByRole('button',{name:'Organize pages',exact:true})).not.toBeVisible();
  await ctx.capture?.('pages-ribbon-filter');
  await search.press('Escape');
  await expect(toolbar.getByRole('button',{name:'Organize pages',exact:true})).toBeVisible();
  const names=toolbar.getByRole('button',{name:'Show or hide tool names',exact:true});
  if(await names.getAttribute('aria-pressed')==='false')await names.click();
  await ctx.capture?.('pages-ribbon-names');
  expect((await workspace.boundingBox()).height).toBeGreaterThanOrEqual(100);
  await names.click();
  // The group menu invokes the same organizer rather than starting another copy.
  await toolbar.getByRole('button',{name:'Organize tools menu',exact:true}).click();
  await page.getByRole('menu',{name:'Organize tools',exact:true}).getByRole('menuitem',{name:'Organize pages',exact:true}).click();
  await expect(workspace).toHaveCount(1);
  await workspace.getByRole('button',{name:'Rotate output page 1',exact:true}).click();
  await expect(workspace.getByLabel('Preview of output page 1',{exact:true})).toHaveAttribute('data-ready','true',{timeout:120000});
  await ctx.capture?.('pages-ribbon-rotated');
  await ctx.cancelSave();await workspace.getByRole('button',{name:'Save pages',exact:true}).click();
  await expect(workspace.getByRole('status').filter({hasText:/Save canceled/})).toBeVisible({timeout:120000});
  expect(hash(await fs.readFile(source))).toBe(before);
  await ctx.capture?.('pages-ribbon-canceled');
  const output=await h.fileFor(ctx,'pages-ribbon');await ctx.saveAs(output);
  await workspace.getByRole('button',{name:'Save this copy',exact:true}).click();await h.saved(output);
  await expect(workspace.getByRole('status').filter({hasText:/^Saved .*Originals unchanged/})).toBeVisible({timeout:120000});
  await ctx.capture?.('pages-ribbon-saved');
  await workspace.getByRole('button',{name:'Close page workspace',exact:true}).focus();
  await page.keyboard.press('Escape');await expect(workspace).toHaveCount(0);
  h.outcome(ctx,output,{pages:3,rotations:[90,0,0],text:['needle 1','needle 2','needle 3']});
 },verify:ctx=>h.verify(ctx)
}];}
