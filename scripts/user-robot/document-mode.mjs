// Shared by desktop specs and real user-robot actions; visible names only.
export async function chooseDocumentMode(page,id){
 const name={view:'View',build:'Build',quick:'Quick edit'}[id];if(!name)throw new Error('Choose an available document mode.');
 const group=page.getByRole('group',{name:'Document mode',exact:true}),current=group.getByRole('button',{name:'Mode: '+name,exact:true});if(await current.isVisible())return;
 const toggle=group.getByRole('button',{name:/^Mode: /});if(await toggle.isVisible()){await toggle.click();await group.getByRole('menuitemradio',{name:new RegExp('^'+name+' ')}).click();return;}
 // Older packaged versions and embedded tool previews remain usable.
 const legacy=group.getByRole('button',{name,exact:true});if(await legacy.isVisible()&&await legacy.getAttribute('aria-pressed')!=='true')await legacy.click();
}
