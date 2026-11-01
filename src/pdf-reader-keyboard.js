// Editors, native controls and already-handled events retain normal keyboard behavior.
export function readerKeyAction(event,{control=false,editable=false,query=false,searching=false,optionsOpen=false,menu=false,previewSearchOpen=false,searchPanel=false}={}){
  if(event.defaultPrevented||event.isComposing||event.altKey||editable)return null;
  const key=String(event.key).toLowerCase(),command=!!(event.ctrlKey||event.metaKey);
  if(command&&!event.shiftKey){
    if(key==='f')return 'search';if(key==='d')return 'bookmark';if(key==='p')return 'print';
    if(!control&&key==='home')return 'first';if(!control&&key==='end')return 'last';
  }
  if(command)return null;
  if(key==='escape'&&optionsOpen&&menu)return 'close-options';
  if(key==='escape'&&previewSearchOpen&&searchPanel)return searching?'stop-search':'close-search';
  if(key==='f3')return event.shiftKey?'previous-match':'next-match';
  if(event.shiftKey)return null;
  if(key==='escape'&&(!control||query)){if(searching)return 'stop-search';if(optionsOpen)return 'close-options';}
  if(control)return null;
  if(key==='arrowright'||key==='pagedown')return 'next-page';
  if(key==='arrowleft'||key==='pageup')return 'previous-page';
  return null;
}

export function createPdfReaderKeyHandler(source,{unavailableMessage}={}){
  return event=>{
    const reader=source.activePageReader||source,root=reader.root,target=event.target?.nodeType===1?event.target:event.target?.parentElement;
    if(reader.disposed||!reader.doc||!root.isConnected||root.closest('[hidden],[inert]')||!root.getClientRects().length||getComputedStyle(root).visibility!=='visible'||!target)return;
    const document=root.ownerDocument,modal=[...document.querySelectorAll('dialog[open]')].at(-1);
    if(modal&&!modal.contains(root))return;
    const within=root.contains(target);if(within&&target.closest('[data-pdf-reader-root]')!==root)return;const documentFocus=target===document.body||target===document.documentElement;
    if(!within&&!reader.headerCopy?.parentElement?.contains(target)&&(reader.keyboardWithinRoot&&!source.activePageReader||!documentFocus))return;
    const control=!!target.closest('input,textarea,select,button,a,summary,[role="button"],[role="tab"],[role="menuitem"],[role="textbox"]');
    const editable=!!target.isContentEditable||!!target.closest('[role="textbox"]:not(input):not(textarea)');
    const action=readerKeyAction(event,{control,editable,query:!!target.closest('.pdf-query'),searching:reader.find?.searching,optionsOpen:reader.options?.open,menu:!!reader.options?.contains(target),previewSearchOpen:!!(reader.compactPreviewToolbar||root.dataset?.toolGroup==='Home'||root.dataset.fixedFileActions==='true')&&!root.querySelector('.reader-inspector').hidden,searchPanel:!!target.closest('.reader-inspector')});
    if(!action||action==='bookmark'&&!reader.file.id||(action==='next-match'||action==='previous-match')&&!reader.copyAllowed)return;
    event.preventDefault();
    const doc=reader.doc,run=work=>Promise.resolve().then(()=>{if(!reader.disposed&&reader.doc===doc)return work();}).catch(error=>{if(!reader.disposed)reader.announce(error.message,true);});
    if(action==='close-search'){reader.setPane('inspector',false);(reader.searchReturnFocus?.isConnected&&reader.searchReturnFocus.checkVisibility()?reader.searchReturnFocus:root.dataset?.toolGroup==='Home'?root.querySelector('[data-action=find]'):reader.stage).focus();return;}
    if(action==='stop-search'){reader.find.stop();return;}
    if(action==='close-options'){reader.options.open=false;reader.options.querySelector('summary')?.focus();return;}
    if(action==='search'||action==='next-match'||action==='previous-match'){
      if(!reader.copyAllowed){reader.announce('This PDF does not permit searching selectable text.');return;}
      reader.setPane('inspector',true);
      if(action==='search'){reader.searchReturnFocus=target;if(reader.compactPreviewToolbar)reader.options.open=false;reader.root.querySelector('.pdf-query').focus();}else run(()=>reader.find.move(action==='previous-match'?-1:1));
      return;
    }
    if(action==='bookmark'){run(()=>reader.navigation.showBookmarks());return;}
    if(action==='print'){run(()=>reader.print());return;}
    const page=action==='first'?1:action==='last'?reader.doc.numPages:reader.pageNumber+(action==='next-page'?1:-1);
    run(()=>reader.go(page));
  };
}
