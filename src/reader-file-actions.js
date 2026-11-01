import {installDraftTitleRename} from './document-title-rename.js';
import './reader-file-actions.css';

// Keep the reader's real action controls as the permission/focus authorities.
// Only their presentation moves to the shell; callbacks and writers stay put.
export function installReaderFileActions(reader){
 const header=reader.headerCopy?.parentElement;if(!header)return {dispose(){}};
 const titleRename=installDraftTitleRename({file:reader.file,root:reader.root,announce:reader.announce,focusTarget:()=>reader.stage});
 const entries=[],document=header.ownerDocument,events=new AbortController();let policySeen=false;try{policySeen=localStorage.getItem('pdfix-copy-policy-seen-v1')==='true';}catch{}
 reader.headerCopy?.addEventListener('click',()=>{if(policySeen||reader.headerCopy.disabled)return;policySeen=true;try{localStorage.setItem('pdfix-copy-policy-seen-v1','true');}catch{}reader.announce('PDFix keeps your original PDF safe and saves your changes as a copy.');},{capture:true,signal:events.signal});
 document.addEventListener('keydown',event=>{if(event.defaultPrevented||event.isComposing||event.repeat||event.altKey||event.shiftKey||!(event.ctrlKey||event.metaKey)||event.key.toLowerCase()!=='s'||reader.disposed||!reader.root.isConnected||document.querySelector('dialog[open]'))return;const target=event.target;if(target!==document.body&&!reader.root.contains(target)&&!header.contains(target))return;event.preventDefault();if(reader.headerCopy?.disabled){reader.announce('Open a readable PDF before saving a copy.');return;}reader.headerCopy?.click();},{signal:events.signal});reader.root.dataset.fixedFileActions='true';
 for(const [action,name,icon]of [['find','Find in PDF','search'],['print','Print','printer']]){
  const source=reader.root.querySelector('[data-action='+action+']');if(!source)continue;
  const button=document.createElement('button');button.type='button';button.className='reader-file-action';button.setAttribute('aria-label',name);button.innerHTML=(icon==='printer'?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 8V3h10v5M7 17H3V8h18v9h-4M7 13h10v8H7Z"/></svg>':reader.icon(icon))+'<span>'+name+'</span>';header.insertBefore(button,action==='find'?reader.headerCopy:reader.headerCopy.nextSibling);
  const hidden=source.hidden,focus=source.focus;source.hidden=true;source.focus=options=>button.focus(options);button.onclick=()=>reader.activePageReader?Promise.resolve(reader.activePageReader.action(action)).catch(error=>reader.announce(error.message,true)):source.click();
  const sync=()=>{const caption=source.getAttribute('aria-label')||source.textContent.trim()||name;button.setAttribute('aria-label',caption);button.querySelector('span').textContent=caption;const target=reader.activePageReader?.root.querySelector('[data-action='+action+']')||source;button.disabled=target.disabled;button.title=target.title||name;for(const attribute of ['aria-pressed','aria-expanded']){const value=target.getAttribute(attribute);if(value===null)button.removeAttribute(attribute);else button.setAttribute(attribute,value);}};
  const observer=new MutationObserver(sync);observer.observe(source,{attributes:true,attributeFilter:['disabled','title','aria-pressed','aria-expanded','aria-label'],childList:true,characterData:true,subtree:true});const proofObserver=new MutationObserver(sync);proofObserver.observe(reader.root,{subtree:true,attributes:true,attributeFilter:['data-inline-proof','data-ready','disabled']});sync();entries.push({source,button,hidden,focus,observer,proofObserver});
 }
 return {dispose(){titleRename.dispose();events.abort();delete reader.root.dataset.fixedFileActions;for(const {source,button,hidden,focus,observer,proofObserver}of entries){observer.disconnect();proofObserver.disconnect();source.focus=focus;source.hidden=hidden;button.remove();}}};
}
