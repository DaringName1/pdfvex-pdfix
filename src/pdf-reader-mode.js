import {createDocumentModeMenu} from './document-mode-menu.js';
// Changing interaction mode changes presentation only: no workspace departure,
// recovery reset, source reload or save is performed here.
export function initialDocumentMode(file={}) {
  return file.isNew||['docx','doc','rtf'].includes(String(file.ext||'').toLowerCase())?'build':'quick';
}
export function modeShortcut(event) {
  return !event.defaultPrevented&&!event.isComposing&&!event.repeat&&!event.altKey&&
    !!(event.ctrlKey||event.metaKey)&&!!event.shiftKey&&String(event.key).toLowerCase()==='e';
}
export function installReaderMode(reader,apply) {
  const root=reader.root,document=root.ownerDocument,events=new AbortController();
  const modes=[{id:'quick',name:'Quick edit',description:'Mark, type, fill and sign. Existing text and pictures stay as they are.',icon:'edit'},{id:'view',name:'View',description:'Read without editing. Your work stays here.',icon:'focus'},{id:'build',name:'Build',description:'Show every tool for changing this PDF.',icon:'settings'}];
  const listeners=new Set();let selection=null,toolFit=null;
  const controls=createDocumentModeMenu({document,modes,onSelect:set,beforeOpen:capture,icon:reader.icon});controls.root.classList.add('reader-mode-switch');
  root.querySelector('.pdf-toolbar').prepend(controls.root);const hint=document.createElement('p');hint.className='reader-mode-hint';hint.setAttribute('role','status');hint.hidden=true;hint.textContent='Your page arrangement is kept in Build. View shows the opened PDF.';root.querySelector('.pdf-toolbar').after(hint);
  function capture(){const selected=document.getSelection();if(selected?.rangeCount&&!selected.isCollapsed&&reader.paper.contains(selected.anchorNode)&&reader.paper.contains(selected.focusNode))selection=selected.getRangeAt(0).cloneRange();else selection=null;}
  function restore(){if(!selection?.startContainer.isConnected||!selection.endContainer.isConnected)return;const selected=document.getSelection();selected.removeAllRanges();selected.addRange(selection);}
  function set(mode){
    if(!modes.some(choice=>choice.id===mode))throw new Error('Choose Quick edit, View or Build.');
    if(reader.interactionMode===mode)return;
    // A mode switch must not change a fitted page's current magnification when
    // hiding a sidebar. Keep its actual scale; Fit remains an explicit action.
    if(reader.doc){const scale=reader.currentViewport?.scale||reader.zoom;if(reader.fit)toolFit={page:reader.fitPage,scale};else if(toolFit&&Math.abs(reader.zoom-toolFit.scale)>.0001)toolFit=null;reader.zoom=scale;reader.fit=false;reader.fitPage=false;for(const name of ['fit','fit-page'])root.querySelector('[data-action='+name+']')?.setAttribute('aria-pressed','false');}
    if(mode!=='view')reader.lastEditingMode=mode;reader.interactionMode=mode;root.dataset.interactionMode=mode;
    controls.update(mode);
    hint.textContent='Your page arrangement is kept in Build. '+(mode==='quick'?'Quick edit':'View')+' shows the opened PDF.';hint.hidden=mode==='build'||!reader.pagesWorkspace||reader.pagesWorkspace.closed;apply(mode);for(const listener of listeners)try{listener(mode);}catch(error){reader.announce(error.message,true);}
    root.dispatchEvent(new CustomEvent('pdfix-reader-mode-change',{detail:{mode}}));restore();
  }
  reader.setInteractionMode=set;
  // Keep the scale during mode switching, but resume a previously fitted page
  // when the user explicitly opens tools beside it. A manual zoom wins.
  reader.resumeToolFit=()=>{if(toolFit&&!reader.fit&&Math.abs(reader.zoom-toolFit.scale)<.0001){reader.fit=true;reader.fitPage=toolFit.page;for(const name of ['fit','fit-page'])root.querySelector('[data-action='+name+']')?.setAttribute('aria-pressed',String(name==='fit-page'?reader.fitPage:!reader.fitPage));}toolFit=null;};
  reader.subscribeInteractionMode=listener=>{if(typeof listener!=='function')throw new Error('A mode listener is required.');listeners.add(listener);listener(reader.interactionMode);return()=>listeners.delete(listener);};
  document.addEventListener('keydown',event=>{if(!root.isConnected||reader.disposed||!modeShortcut(event))return;const modal=[...document.querySelectorAll('dialog[open]')].at(-1);if(modal&&!modal.contains(root))return;if(!root.contains(event.target)&&!reader.headerCopy?.parentElement?.contains(event.target)&&event.target!==document.body)return;event.preventDefault();event.stopPropagation();capture();set(reader.interactionMode==='view'?(reader.lastEditingMode||'quick'):'view');controls.focus();restore();},{signal:events.signal});
  set(initialDocumentMode(reader.file));
  reader.modeControls={dispose(){events.abort();listeners.clear();controls.dispose();hint.remove();delete reader.setInteractionMode;delete reader.resumeToolFit;delete reader.subscribeInteractionMode;}};
}
