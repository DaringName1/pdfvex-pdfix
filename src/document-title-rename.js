import COPY_NAMES from '../desktop/copy-name.cjs';
// Owner October28: existing files keep their real name/path; only the next copy
// suggestion changes. Unsaved drafts use their existing naming/recovery path.
export function installDraftTitleRename(workspace){
 const document=workspace.root.ownerDocument,title=document.querySelector('.document-title'),label=title?.querySelector('b');
 if(!label)return{dispose(){}};
 const events=new AbortController(),subtitle=title.querySelector('small'),originalSubtitle=subtitle?.textContent;let input;
 const displayName=()=>workspace.file.copyName?workspace.file.copyName+'.'+workspace.file.ext:workspace.file.name;
 const focusPage=()=>{const target=workspace.focusTarget?.()??workspace.editor?.view.dom??workspace.input;target?.focus();};
 const original={role:label.getAttribute('role'),tabindex:label.getAttribute('tabindex'),'aria-label':label.getAttribute('aria-label')};
 label.setAttribute('role','button');label.tabIndex=0;label.setAttribute('aria-label','Rename document');label.title=workspace.file.isNew?'Double-click to rename, or press F2.':'Double-click or press F2 to name the next Save a copy. The original is unchanged.';
 function finish(save,focusEditor=false){if(!input)return;const value=input.value,old=input;if(save){try{if(workspace.file.isNew)workspace.rename(value);else{const base=value.trim()?COPY_NAMES.preferredCopyBase(value,workspace.file.ext):undefined;if(base)workspace.file.copyName=base;else delete workspace.file.copyName;workspace.formatState?.();}}catch(error){workspace.announce?.(error.message,true);input.focus();return;}}input=null;old.replaceWith(label);label.textContent=displayName();title.title=displayName();if(subtitle&&!workspace.file.isNew){subtitle.textContent=workspace.file.copyName?'Next copy name':originalSubtitle;subtitle.classList.toggle('document-copy-name-note',!!workspace.file.copyName);subtitle.title=workspace.file.copyName?'The original remains '+workspace.file.name:originalSubtitle;subtitle.setAttribute('aria-label',workspace.file.copyName?'Next copy name. The original remains '+workspace.file.name:originalSubtitle);}if(focusEditor)focusPage();else label.focus();}
 function begin(){if(input)return;input=document.createElement('input');input.type='text';input.maxLength=110;input.spellcheck=false;input.className='document-title-input';input.setAttribute('aria-label','Document name');input.value=displayName();label.replaceWith(input);input.addEventListener('blur',()=>finish(true));input.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key==='Escape'){event.preventDefault();event.stopPropagation();finish(event.key==='Enter',true);}});input.focus();input.select();}
 label.addEventListener('dblclick',begin,{signal:events.signal});label.addEventListener('keydown',event=>{if(['F2','Enter',' '].includes(event.key)){event.preventDefault();begin();}},{signal:events.signal});
 return{dispose(){events.abort();if(input){input.replaceWith(label);input=null;}for(const[key,value]of Object.entries(original))if(value===null)label.removeAttribute(key);else label.setAttribute(key,value);}};
}
