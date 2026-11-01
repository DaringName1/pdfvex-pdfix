import {expect} from '@playwright/test';
import {chooseDocumentMode} from './document-mode.mjs';

export function makeViewRibbonActions(h){return [{
 name:'view: grouped reading tools retain modes, navigation and exact saved copy',weight:1,
 async run(page,ctx){
  await h.open(page,ctx,await h.freshSource(ctx));await expect(page.getByRole('button',{name:'Find in PDF',exact:true})).toBeVisible();await h.menu(page,'View');
  await expect(page.getByText(/^Opened .*Your original is unchanged\.$/).first()).not.toBeVisible({timeout:12000});
  let panel=page.getByRole('tabpanel',{name:'View',exact:true});await ctx.capture?.('view-build-default');
  for(const[name,count]of [['Zoom and turn',8],['Go to',3],['Read',4],['Document',6]]){
   const button=panel.getByRole('button',{name:name+' tools menu',exact:true});await button.press('ArrowDown');
   const menu=page.getByRole('menu',{name:name+' tools',exact:true});await expect(menu.getByRole('menuitem')).toHaveCount(count);
   await ctx.capture?.('view-menu-'+name.replaceAll(' ','-'));await page.keyboard.press('Escape');await expect(button).toBeFocused();
  }
  const search=page.getByRole('searchbox',{name:'Filter tools',exact:true});await search.fill('Word count');await expect(panel.getByRole('button',{name:'Word count',exact:true})).toBeVisible();await expect(panel.getByRole('button',{name:'Rotate view',exact:true})).not.toBeVisible();await search.press('Escape');
  await panel.getByRole('button',{name:'Read tools menu',exact:true}).click();await page.getByRole('menu',{name:'Read tools',exact:true}).getByRole('menuitem',{name:'Word count',exact:true}).click();const statistics=page.getByRole('dialog',{name:'PDF text statistics',exact:true});await expect(statistics.getByRole('status')).toContainText('text units counted.');await expect(statistics.getByRole('button',{name:'Close',exact:true})).toHaveCount(1);await ctx.capture?.('view-word-count');await statistics.getByRole('button',{name:'Close',exact:true}).click();await expect(statistics).not.toBeVisible();
  await panel.getByRole('button',{name:'Fit page',exact:true}).click();
  const names=panel.getByRole('button',{name:'Show or hide tool names',exact:true});if(await names.getAttribute('aria-pressed')==='false')await names.click();await ctx.capture?.('view-build-names');
  await chooseDocumentMode(page,'view');await expect(page.getByRole('button',{name:'Fit width',exact:true})).toBeVisible();await page.getByRole('button',{name:'Fit width',exact:true}).press('Enter');await ctx.capture?.('view-common-fit-width');await expect(page.getByRole('tablist',{name:'PDF tool groups',exact:true})).not.toBeVisible();await expect(page.getByRole('button',{name:'More',exact:true})).not.toBeVisible();await expect(page.getByRole('combobox',{name:'Selection mode',exact:true})).not.toBeVisible();await expect(page.getByRole('button',{name:'Fit page',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Pages panel',exact:true})).toBeVisible();await ctx.capture?.('view-reading-restored');
  await chooseDocumentMode(page,'build');await h.menu(page,'View');panel=page.getByRole('tabpanel',{name:'View',exact:true});await expect(panel.getByRole('button',{name:'Read tools menu',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'More',exact:true})).not.toBeVisible();
  const output=await h.fileFor(ctx,'view-ribbon-copy');await h.copy(page,ctx,output);h.outcome(ctx,output,{pages:3,exact:true,text:['needle 1','needle 2','needle 3']});
 },verify:h.verify
}];}
