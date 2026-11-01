import {expect} from '@playwright/test';

export function makeEditingRibbonActions(h){
 const tabs=[
  ['Edit',[['Text',4],['Select and link',1]],'Make a scan searchable','Review page links'],
  ['Fill & Sign',[['Fill',1],['Sign',1],['Set up forms',2],['Transfer comments',2]],'Prepare signing request','Fill and sign'],
  ['Measure',[['Measure',2],['Scale and maps',1],['Compare',2]],'Drawing sheet sets','Drawing takeoffs']
 ];
 return tabs.map(([tab,groups,searchFor,other])=>({
  name:'toolbar: '+tab+' grouped controls, keyboard menus and unchanged saved copy',weight:1,
  async run(page,ctx){
   await h.open(page,ctx,await h.freshSource(ctx));await h.menu(page,tab);
   await expect(page.getByText(/^Opened .*Your original is unchanged\.$/).first()).not.toBeVisible({timeout:12000});
   const panel=page.getByRole('tabpanel',{name:tab,exact:true}),prefix=tab.toLowerCase().replaceAll(/[^a-z]+/g,'-');
   await ctx.capture?.(prefix+'-ribbon-default');
   for(const[name,count]of groups){
    const toggle=panel.getByRole('button',{name:name+' tools menu',exact:true});await toggle.press('ArrowDown');
    const menu=page.getByRole('menu',{name:name+' tools',exact:true});
    await expect(menu.getByRole('menuitem')).toHaveCount(count);await expect(menu.getByRole('menuitem').first()).toBeFocused();
    for(const item of await menu.getByRole('menuitem').all())await expect(item).toBeEnabled();
    await ctx.capture?.(prefix+'-menu-'+name.replaceAll(' ','-'));await page.keyboard.press('Escape');await expect(toggle).toBeFocused();
   }
   const search=page.getByRole('searchbox',{name:'Filter tools',exact:true});await search.fill(searchFor);
   await expect(panel.getByRole('button',{name:searchFor,exact:true})).toBeVisible();await expect(panel.getByRole('button',{name:other,exact:true})).not.toBeVisible();
   await search.press('Escape');await expect(panel.getByRole('button',{name:other,exact:true})).toBeVisible();
   const names=panel.getByRole('button',{name:'Show or hide tool names',exact:true});
   if(await names.getAttribute('aria-pressed')==='false')await names.click();await ctx.capture?.(prefix+'-ribbon-names');await names.click();
   const output=await h.fileFor(ctx,prefix+'-toolbar-copy');await h.copy(page,ctx,output);h.outcome(ctx,output,{pages:3,exact:true,text:['needle 1','needle 2','needle 3']});
  },verify:h.verify
 }));
}
