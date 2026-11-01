// Adapt legacy operation buttons to the shared Cancel-closes-the-tool rule.
// Kept at the app boundary while these workspaces migrate to the main reader.
export function openCancelableWorkspace(workspace){
 const opening=workspace.open(),dialog=workspace.dialog,button=dialog?.querySelector('[data-cancel]');
 if(!button)return opening;
 const sync=()=>{if(button.disabled)button.disabled=false;if(button.textContent!=='Cancel')button.textContent='Cancel';};
 button.onclick=()=>workspace.requestClose?workspace.requestClose():workspace.close();
 const observer=new MutationObserver(sync);observer.observe(button,{attributes:true,attributeFilter:['disabled'],childList:true,subtree:true});
 dialog.addEventListener('close',()=>observer.disconnect(),{once:true});sync();return opening;
}
