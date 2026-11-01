// One presentation control shared by document and PDF workspaces. The caller
// owns editing permissions, retained drafts and mode changes; this owns only UI.
export function createDocumentModeMenu({document,modes,onSelect,beforeOpen=()=>{},icon=()=>''}){
  const events=new AbortController(),root=document.createElement('div');
  root.className='document-mode-control';root.setAttribute('role','group');root.setAttribute('aria-label','Document mode');
  const toggle=document.createElement('button');toggle.type='button';toggle.className='document-mode-toggle';toggle.setAttribute('aria-haspopup','menu');toggle.setAttribute('aria-expanded','false');
  const menu=document.createElement('div');menu.className='document-mode-list';menu.setAttribute('role','menu');menu.setAttribute('aria-label','Choose document mode');menu.hidden=true;
  const items=new Map();let current;
  const setOpen=(open,focus=false)=>{if(open)beforeOpen();menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(focus)(open?items.get(current):toggle)?.focus({preventScroll:true});};
  for(const mode of modes){
    const button=document.createElement('button');button.type='button';button.setAttribute('role','menuitemradio');button.setAttribute('aria-checked','false');button.tabIndex=-1;
    const name=document.createElement('strong'),description=document.createElement('span');name.textContent=mode.name;description.textContent=mode.description;button.append(name,description);
    button.addEventListener('click',()=>{onSelect(mode.id);setOpen(false,true);},{signal:events.signal});menu.append(button);items.set(mode.id,button);
  }
  const help=document.createElement('small');help.textContent='Ctrl+Shift+E switches modes';menu.append(help);root.append(toggle,menu);
  toggle.addEventListener('pointerdown',()=>beforeOpen(),{signal:events.signal});
  toggle.addEventListener('click',()=>setOpen(menu.hidden,true),{signal:events.signal});
  root.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!menu.hidden){event.preventDefault();event.stopPropagation();setOpen(false,true);return;}
    if(event.key==='Tab'){if(!menu.hidden)setOpen(false,true);return;}
    if(!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
    event.preventDefault();if(menu.hidden){setOpen(true,true);return;}
    const values=[...items.values()],index=values.indexOf(document.activeElement),next=event.key==='Home'?0:event.key==='End'?values.length-1:(index+(event.key==='ArrowUp'?-1:1)+values.length)%values.length;values[next].focus();
  },{signal:events.signal});
  document.addEventListener('pointerdown',event=>{if(!root.contains(event.target))setOpen(false);},{signal:events.signal});
  function update(id){const mode=modes.find(mode=>mode.id===id);if(!mode)throw new Error('Choose an available document mode.');current=id;toggle.replaceChildren();const artwork=document.createElement('span');artwork.innerHTML=icon(mode.icon||'settings');artwork.setAttribute('aria-hidden','true');const label=document.createElement('span');label.textContent=mode.name;const arrow=document.createElement('span');arrow.textContent='▾';arrow.setAttribute('aria-hidden','true');toggle.append(artwork,label,arrow);toggle.setAttribute('aria-label','Mode: '+mode.name);toggle.title=mode.description+' (Ctrl+Shift+E)';for(const[value,button]of items)button.setAttribute('aria-checked',String(value===id));}
  return {root,toggle,update,close:()=>setOpen(false),focus:()=>toggle.focus({preventScroll:true}),dispose(){events.abort();root.remove();}};
}
