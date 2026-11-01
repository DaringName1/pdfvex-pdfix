// Native dialogs restore their opener only while that element still exists.
// Workspace cards disappear when their PDF opens, so provide a visible fallback.
const watching=new WeakMap();
export function rememberPdfDialogFocus(dialog){
 const doc=dialog.ownerDocument;let state=watching.get(dialog);if(state){state.previous=doc.activeElement;return;}state={previous:doc.activeElement};watching.set(dialog,state);
 dialog.addEventListener('close',()=>{queueMicrotask(()=>{const previous=state.previous;
  if(dialog.open||doc.querySelector('dialog[open]'))return;
  const visible=node=>node?.isConnected&&!node.disabled&&node.checkVisibility?.()!==false&&node.getClientRects().length&&!node.closest('[hidden],[inert]')&&getComputedStyle(node).visibility!=='hidden';
  if(doc.activeElement!==doc.body&&visible(doc.activeElement))return;
  const summary=previous?.closest?.('.reader-view-more')?.querySelector('summary');
  const target=previous!==doc.body&&visible(previous)?previous:visible(summary)?summary:doc.querySelector('.document-area .page-stage')||doc.querySelector('.workspace-room-tabs [aria-selected="true"]');
  if(visible(target))target.focus({preventScroll:true});
 });});
}
