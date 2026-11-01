// Presentation only: paths and saved-byte verification remain in the native store.
export function savedCopyChoice(result,originalName='the original'){
 if(!result||typeof result.continueToken!=='string'||!/^[a-f0-9-]{36}$/i.test(result.continueToken)||typeof result.name!=='string'||!result.name.trim())return null;
 return Object.freeze({token:result.continueToken,name:result.name.slice(0,256),originalName:String(originalName||'the original').slice(0,256)});
}
export function isDuplicateSavedAnnouncement(message,choice,error=false){
 if(error||!choice||typeof choice.name!=='string')return false;const saved='Saved '+choice.name+'. Original unchanged.';return message===saved||message===saved+' Editing recovery retained; this copy does not replace the complete editable draft.'||message==='Saved as '+choice.name+'.';
}
export function savedCopyFailure(error,fallback){
 const message=String(error?.message||fallback).slice(0,2048);
 // contextBridge serializes thrown Error messages but may drop custom code.
 // This is presentation only; native hash/token checks still decide opening.
 const unavailable=typeof error?.code==='string'?['MISSING','CHANGED','READ','NOT_FILE','UNSUPPORTED','EMPTY'].includes(error.code):/^(?:The saved copy (?:is no longer|was changed or replaced|changed after verification)|Save a copy first, then|This file cannot be read\.)/.test(message);
 return {message,unavailable};
}
export function installSavedCopyReceipt({document,subscribe,getOriginalName,onContinue,onReveal,announce,onReceipt}){
 let choice=null,busy=false,root=null,message='',failure=null,originFocus=null,disposed=false;
 const revealCopy=onReveal??document.defaultView?.pdfix?.revealSavedCopy;
 const make=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
 const mount=()=>{if(!root||disposed)return;const dialogs=[...document.querySelectorAll('dialog[open]')],host=dialogs.at(-1)||document.querySelector('.main');if(!host||root.parentElement===host)return;if(dialogs.length&&root.parentElement){clear();return;}const header=host.querySelector(dialogs.length?'.dialog-header':'.topbar');if(header)header.after(root);else host.prepend(root);};
 const observer=new MutationObserver(mount);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
 function clear(){choice=null;root?.remove();root=null;message='';failure=null;}
 function paint(){
  if(!choice||disposed)return;const focused=root?.contains(document.activeElement)&&document.activeElement?.dataset?.copyChoice,unavailable=!!failure?.unavailable;
  root?.remove();root=make('section');root.className='saved-copy-receipt';root.dataset.copyState=failure?'error':'saved';root.setAttribute('role','region');root.setAttribute('aria-label','Saved copy');
  const details=make('div'),label=make('p',(unavailable?'Copy unavailable: ':'Saved as ')+choice.name+'.');if(!failure)label.setAttribute('role','status');
  const description=make('small',failure?failure.message+(unavailable?' Save another copy to continue. Your original is still open.':' Your original is still open; you can try again.'):message||'You are still working on '+choice.originalName+'.');if(failure)description.setAttribute('role','alert');details.append(label,description);
  const actions=make('div'),next=make('button',busy==='open'?'Opening saved copy…':failure?'Try opening saved copy again':'Continue with this copy'),reveal=make('button',busy==='reveal'?'Showing in folder…':'Show in folder'),keep=make('button','Keep working on the original');
  next.type=reveal.type=keep.type='button';next.dataset.copyChoice='continue';reveal.dataset.copyChoice='reveal';keep.dataset.copyChoice='keep';next.hidden=reveal.hidden=unavailable;next.disabled=keep.disabled=!!busy;reveal.disabled=!!busy||typeof revealCopy!=='function';reveal.title=typeof revealCopy==='function'?'Select the saved copy in File Explorer without changing the open document.':'Use the updated Windows PDFix app to show this saved copy.';next.className='primary compact';reveal.className='secondary compact';keep.className=unavailable?'primary compact':'secondary compact';next.onclick=proceed;reveal.onclick=showInFolder;keep.onclick=()=>{clear();if(originFocus?.isConnected)originFocus.focus();};actions.append(next,reveal,keep);root.append(details,actions);mount();if(focused)root.querySelector('[data-copy-choice='+(unavailable?'keep':focused)+']')?.focus();
 }
 function refuse(error,fallback){failure=savedCopyFailure(error,fallback);message='';}
 async function proceed(){if(busy||!choice||failure?.unavailable)return;const active=choice;busy='open';message='';failure=null;paint();try{await onContinue(active.token);if(choice===active)clear();}catch(error){if(choice===active)refuse(error,'The saved copy could not be opened.');}finally{busy=false;if(choice)paint();if(choice===active)root?.querySelector('[data-copy-choice='+(failure?.unavailable?'keep':'continue')+']')?.focus();}}
 async function showInFolder(){if(busy||!choice||failure?.unavailable||typeof revealCopy!=='function')return;const active=choice;busy='reveal';message='';failure=null;paint();try{const result=await revealCopy(active.token);if(result?.shown!==true)throw Error('The saved copy could not be shown.');if(choice===active)message='Shown in File Explorer. You are still working on '+active.originalName+'.';}catch(error){if(choice===active)refuse(error,'The saved copy could not be shown.');}finally{busy=false;if(choice)paint();if(choice===active)root?.querySelector('[data-copy-choice='+(failure?.unavailable?'keep':'reveal')+']')?.focus();}}
 const unsubscribe=subscribe?.(result=>{const next=savedCopyChoice(result,getOriginalName?.());if(!next||disposed)return;originFocus=document.activeElement;choice=next;message='';failure=null;paint();onReceipt?.(choice);});
 return {clear,isDuplicateAnnouncement:(message,error)=>isDuplicateSavedAnnouncement(message,choice,error),dispose(){disposed=true;unsubscribe?.();observer.disconnect();clear();}};
}
