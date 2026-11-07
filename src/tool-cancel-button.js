// Adapt legacy operation buttons to the shared Cancel-closes-the-tool rule.
// Kept at the app boundary while these workspaces migrate to the main reader.
export function openCancelableWorkspace(workspace){
 const opening=workspace.open(),dialog=workspace.dialog,button=dialog?.querySelector('[data-cancel]');
 if(!button)return opening;
 if(workspace.inline&&!dialog.isConnected){
  const reader=workspace.hostReader;
  reader.pageToolHost?.suspend();
  dialog.classList.add('reader-page-tool-options');
  reader.root.querySelector('.pdf-body').append(dialog);
 }
 const sync=()=>{
  button.hidden=!!dialog.querySelector('.reader-tool-cancel');
  if(button.disabled)button.disabled=false;
  if(button.textContent!=='Cancel')button.textContent='Cancel';
 };
 button.onclick=()=>workspace.requestClose?workspace.requestClose():workspace.close();
 const observer=new MutationObserver(sync);observer.observe(dialog,{attributes:true,attributeFilter:['disabled'],childList:true,subtree:true});
 sync();
 return opening.finally(()=>{sync();observer.disconnect();});
}
