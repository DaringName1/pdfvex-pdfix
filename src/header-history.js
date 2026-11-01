// Present the active tool's existing history in one place; never keep a second edit stack.
export function installHeaderHistory({root,header,sources,mode=()=>root.dataset.interactionMode,ownsEvent=()=>true,unavailableReason=()=> 'Choose an editing tool with history.'}){
 if(!header)return{sync(){},dispose(){}};
 const doc=header.ownerDocument,events=new AbortController(),bar=doc.createElement('div'),title=header.querySelector('.document-title');let records=[],frame=0,disposed=false;
 bar.className='header-history';bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Undo and redo');root.dataset.headerHistory='true';title?.classList.add('with-header-history');(title||header.lastElementChild).after(bar);
 const buttons=['Undo','Redo'].map((name,i)=>{const button=doc.createElement('button');button.type='button';button.className='header-history-action';button.setAttribute('aria-label',name);button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="'+(i?'m16 3 5 5-5 5M21 8H10a7 7 0 0 0 0 14':'m8 3-5 5 5 5M3 8h11a7 7 0 0 1 0 14')+'"/></svg>';button.onmousedown=e=>e.preventDefault();button.onclick=()=>{sync();if(!button.disabled)records[i]?.source.click();};bar.append(button);return button;});
 function restore(){for(const record of records){if(!record)continue;record.observer.disconnect();record.source.hidden=record.hidden;record.source.focus=record.focus;delete record.source.dataset.headerHistorySource;}records=[];}
 function schedule(){if(disposed)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(sync);}
 function sync(){
  if(disposed)return;const pair=sources()||[];
  if(pair[0]!==records[0]?.source||pair[1]!==records[1]?.source){restore();for(let i=0;i<2;i++){const source=pair[i];if(!source)continue;const observer=new MutationObserver(schedule),record={source,hidden:source.hidden,focus:source.focus,observer};source.dataset.headerHistorySource='true';source.hidden=true;source.focus=options=>buttons[i].focus(options);observer.observe(source,{attributes:true,attributeFilter:['disabled','title','aria-pressed','class']});records[i]=record;}}
  buttons.forEach((button,i)=>{const source=records[i]?.source,view=mode()==='view',blocked=!!source?.closest('[inert]'),name=i?'Redo':'Undo';const caption=source&&(source.title||source.getAttribute('aria-label')||source.textContent.trim()||name),hint=caption&&(/(?:Ctrl|Cmd|Control)\+/.test(caption)?caption:caption+' (Ctrl+'+(i?'Y':'Z')+')');button.disabled=!source||source.disabled||view||blocked;button.title=view?'Switch to Build to change this document.':!source?pair.some(Boolean)?name+' is not available for this tool.':unavailableReason():blocked?'Wait for the current operation to finish.':source.disabled?(source.title&&!/^(?:Undo|Redo)(?: \(.*\))?$/.test(source.title)?source.title:'Nothing to '+name.toLowerCase()+' in this tool.'):hint;});
 }
 function key(event){
  if(event.defaultPrevented||event.altKey||event.repeat||event.isComposing||!(event.ctrlKey||event.metaKey)||!ownsEvent(event.target))return;
  if(event.target?.closest?.('input,textarea,select,[contenteditable=true]'))return;
  const k=event.key.toLowerCase(),i=k==='y'||k==='z'&&event.shiftKey?1:k==='z'?0:-1;if(i<0)return;sync();event.preventDefault();event.stopImmediatePropagation();if(!buttons[i].disabled)buttons[i].click();
 }
 // Inputs keep native text undo. The header and non-text page controls delegate once to the active tool.
 root.addEventListener('keydown',key,{capture:true,signal:events.signal});header.addEventListener('keydown',key,{capture:true,signal:events.signal});
 const observer=new MutationObserver(schedule);observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','hidden','inert','data-interaction-mode','class']});sync();return{sync,dispose(){disposed=true;events.abort();observer.disconnect();cancelAnimationFrame(frame);restore();bar.remove();title?.classList.remove('with-header-history');delete root.dataset.headerHistory;}};
}

function foldedToolHistory(button){const panel=button.closest('.reader-options-panel,.reader-tool-options');return !!panel&&!panel.hidden&&!panel.inert&&!!button.closest('.pdf-body[data-options-folded]')&&!button.parentElement?.closest('[hidden],[inert]');}

export function visibleToolHistory(root){
 const candidates=[...root.querySelectorAll('button')].filter(button=>/^(?:Undo|Redo)(?: point)?$/.test((button.getAttribute('aria-label')||button.textContent).trim())&&button.closest('[data-pdf-reader-root]')===root&&(button.dataset.headerHistorySource==='true'||!button.hidden)&&(button.parentElement?.checkVisibility()||foldedToolHistory(button)));
 return ['Undo','Redo'].map(name=>candidates.find(button=>new RegExp('^'+name+'(?: point)?$').test((button.getAttribute('aria-label')||button.textContent).trim())));
}
