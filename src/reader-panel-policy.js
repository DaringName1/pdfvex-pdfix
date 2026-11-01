// Shared presentation rules. Each tool still owns its close, cancellation and recovery.
export function installReaderPanelPolicy(reader){
 const root=reader.root,body=root.querySelector('.pdf-body'),events=new AbortController();
 const visible=node=>node&&!node.hidden&&!node.inert&&node.checkVisibility();
 const panels=()=>[...body.children].filter(node=>node.matches('.reader-options-panel,.page-inline')&&visible(node));
 const sync=()=>{
  if(!panels().length)return;
  // These are supplementary inspectors, not the active tool's settings.
  for(const node of body.querySelectorAll(':scope > .reader-tool-options,:scope > .pdf-notes,:scope > .reader-inspector'))node.hidden=true;
 };
 const observer=new MutationObserver(records=>{if(records.some(record=>record.target.matches?.('.reader-options-panel,.page-inline')||record.type==='childList'&&[...record.addedNodes].some(node=>node.matches?.('.reader-options-panel,.page-inline'))))sync();});observer.observe(body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','inert','class']});
 root.ownerDocument.addEventListener('copy',event=>{
  if(!root.isConnected||!reader.copyAllowed||event.defaultPrevented||event.target.closest?.('input,textarea,[contenteditable=true]'))return;
  const selection=root.ownerDocument.getSelection();
  if(!selection?.toString()||!root.contains(selection.anchorNode)||!root.contains(selection.focusNode))return;
  if(!event.clipboardData||![selection.anchorNode,selection.focusNode].every(node=>reader.layer.contains(node)||reader.readable.contains(node)))return;
  event.clipboardData.setData('text/plain',selection.toString());event.preventDefault();reader.announce('Copied.');
 },{signal:events.signal});
 root.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||event.defaultPrevented||event.isComposing||root.ownerDocument.querySelector('dialog[open],[popover]:popover-open:not(#toast)')||event.target.closest('[role=menu],.reader-inspector')||event.target.closest('[data-pdf-reader-root]')!==root)return;
  const panel=panels().at(-1);if(!panel)return;
  // The tool owns Escape inside its fields/artwork (including unsaved-table guards).
  // This fallback is for focus left on the ribbon or document header.
  if(panel.contains(event.target)||reader.stage.contains(event.target))return;
  const close=panel.querySelector('.dialog-header button[aria-label^="Close"],.dialog-header button[data-close]');
  if(!close||close.disabled)return;
  event.preventDefault();event.stopPropagation();close.click();
 },{signal:events.signal});
 return{dispose(){observer.disconnect();events.abort();}};
}
