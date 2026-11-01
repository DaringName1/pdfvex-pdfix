import './announcement-layout.css';
const layouts=new WeakMap();

// Keep the existing live region in the top layer, so modal dialogs cannot make
// it unreadable. Its own reserved strip keeps it off artwork and controls.
export function layoutAnnouncement(toast){
 let layout=layouts.get(toast);
 if(!layout){
  const document=toast.ownerDocument,space=document.createElement('div');space.className='announcement-space';space.setAttribute('aria-hidden','true');space.hidden=true;
  let frame;
  const sync=()=>{
   const main=document.querySelector('#app>.main');if(!main||!toast.isConnected)return;
   if(space.parentElement!==main)main.append(space);
   if(toast.hidden){space.hidden=true;document.documentElement.style.setProperty('--announcement-space','0px');document.documentElement.classList.remove('has-announcement');toast.removeAttribute('tabindex');return;}
   const bounds=main.getBoundingClientRect();toast.style.setProperty('--announcement-left',Math.max(0,bounds.left)+'px');toast.style.setProperty('--announcement-width',Math.max(1,bounds.width)+'px');
   const height=Math.ceil(toast.getBoundingClientRect().height);space.style.height=height+'px';space.hidden=false;document.documentElement.style.setProperty('--announcement-space',height+'px');document.documentElement.classList.add('has-announcement');
   if(toast.scrollHeight>toast.clientHeight+1)toast.tabIndex=0;else toast.removeAttribute('tabindex');
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(sync);};
  const resize=new ResizeObserver(schedule);resize.observe(toast);resize.observe(document.querySelector('#app'));const main=document.querySelector('#app>.main');if(main)resize.observe(main);
  const changes=new MutationObserver(schedule);changes.observe(toast,{attributes:true,attributeFilter:['hidden','class'],childList:true,subtree:true});
  window.addEventListener('resize',schedule);layout={sync};layouts.set(toast,layout);
 }
 layout.sync();
}
