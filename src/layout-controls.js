const KEY='pdfix-layout-v1';
export function layoutPreference(name,fallback){try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');return typeof saved[name]==='boolean'?saved[name]:fallback;}catch{return fallback;}}
export function saveLayoutPreference(name,value){try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');localStorage.setItem(KEY,JSON.stringify({...saved,[name]:value}));}catch{/* A storage failure must not prevent changing the view. */}}

export function layoutControls(app,{icon,announce}){
  let collapsed=layoutPreference('sidebarCollapsed',false),focus=false,fullscreen=false,windowStateTouched=false;
  let documentCollapsed=null,wasDocumentOpen=app.classList.contains('document-open');
  const sidebarCollapsed=()=>app.classList.contains('document-open')?(documentCollapsed??true):collapsed;
  const bar=app.querySelector('.topbar'),controls=document.createElement('div');controls.className='layout-controls';controls.setAttribute('aria-label','View controls');
  const sidebar=document.createElement('button'),concentrate=document.createElement('button'),screen=document.createElement('button');
  for(const button of [sidebar,concentrate,screen]){button.className='icon-button';button.type='button';}
  sidebar.innerHTML=icon('sidebar');sidebar.setAttribute('aria-controls','workspace-sidebar');
  concentrate.innerHTML=icon('focus');screen.innerHTML=icon('fullscreen');
  controls.append(concentrate,screen);bar.prepend(sidebar);bar.append(controls);
  // Collapsed navigation retains its names for keyboard and screen-reader users.
  app.querySelectorAll('.sidebar button').forEach(button=>{const name=button.querySelector('span')?.textContent;if(name){button.setAttribute('aria-label',name);button.title=name;}});
  const update=()=>{
    const compact=sidebarCollapsed();
    app.classList.toggle('sidebar-collapsed',compact);app.classList.toggle('focus-mode',focus);
    sidebar.setAttribute('aria-expanded',String(!compact&&!focus));sidebar.setAttribute('aria-label',focus?'Show sidebar':compact?'Expand sidebar':'Collapse sidebar');sidebar.title=`${sidebar.getAttribute('aria-label')} (Ctrl Shift B)`;
    concentrate.setAttribute('aria-pressed',String(focus));concentrate.setAttribute('aria-label',focus?'Exit focus mode':'Focus mode');concentrate.title=`${concentrate.getAttribute('aria-label')} (Ctrl Shift F)`;
    screen.setAttribute('aria-pressed',String(fullscreen));screen.setAttribute('aria-label',fullscreen?'Exit fullscreen':'Enter fullscreen');screen.title=`${screen.getAttribute('aria-label')} (F11)`;
    screen.innerHTML=icon(fullscreen?'restore':'fullscreen');
  };
  const toggleSidebar=()=>{const next=focus?false:!sidebarCollapsed();focus=false;if(app.classList.contains('document-open'))documentCollapsed=next;else{collapsed=next;saveLayoutPreference('sidebarCollapsed',collapsed);}update();};
  const toggleFocus=()=>{focus=!focus;update();};
  const setFullscreen=async value=>{if(screen.disabled)return;windowStateTouched=true;screen.disabled=true;try{if(window.pdfix){const result=await window.pdfix.fullscreen(value);fullscreen=result.fullscreen;}else{if(value)await document.documentElement.requestFullscreen();else if(document.fullscreenElement)await document.exitFullscreen();fullscreen=!!document.fullscreenElement;}update();}catch(error){announce(error.message,true);}finally{screen.disabled=false;}};
  sidebar.addEventListener('click',toggleSidebar);concentrate.addEventListener('click',toggleFocus);screen.addEventListener('click',()=>setFullscreen(!fullscreen));
  window.pdfix?.onWindowState(state=>{windowStateTouched=true;fullscreen=state.fullscreen;update();});
  window.pdfix?.windowState().then(state=>{if(!windowStateTouched){fullscreen=state.fullscreen;update();}}).catch(error=>announce(error.message,true));
  document.addEventListener('fullscreenchange',()=>{if(!window.pdfix){fullscreen=!!document.fullscreenElement;update();}});
  document.addEventListener('keydown',event=>{
    if(event.repeat||document.querySelector('dialog[open]')||app.classList.contains('pdf-artwork-fullscreen'))return;
    if(event.key==='Escape'&&app.querySelector('.pdf-zoom-region-overlay:not([hidden])'))return;
    if(event.key==='F11'){event.preventDefault();setFullscreen(!fullscreen);}
    else if(event.ctrlKey&&event.shiftKey&&event.key.toLowerCase()==='b'){event.preventDefault();toggleSidebar();}
    else if(event.ctrlKey&&event.shiftKey&&event.key.toLowerCase()==='f'){event.preventDefault();toggleFocus();}
    else if(event.key==='Escape'){if(fullscreen){event.preventDefault();setFullscreen(false);}else if(focus){event.preventDefault();focus=false;update();}}
  },true);
  // Opening a document makes room for the page. A manual expansion lasts for
  // this document session; returning Home restores the person's Home choice.
  const documentState=new MutationObserver(()=>{const open=app.classList.contains('document-open');if(open===wasDocumentOpen)return;wasDocumentOpen=open;documentCollapsed=null;update();});
  documentState.observe(app,{attributes:true,attributeFilter:['class']});
  const tabsState=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1&&node.matches('.document-tabs'))node.querySelector('[aria-current="page"]')?.parentElement.scrollIntoView({block:'nearest',inline:'nearest'});});
  tabsState.observe(app.querySelector('.main'),{childList:true});
  update();
  return {toggleSidebar,toggleFocus,toggleFullscreen:()=>setFullscreen(!fullscreen)};
}
