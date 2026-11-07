import {assertPdfEditPermission,mayEditPdf} from './pdf-edit-permissions.js';
export const TEXT_METHODS=Object.freeze([
  {id:'click-to-type',name:'Click to type',description:'Click a spot and type on the page.'},
  {id:'edit-existing',name:'Edit existing',description:'Click existing words and change them.'},
  {id:'text-box',name:'Text box',description:'Drag a box, then type inside it.'}
]);
const methodById=id=>TEXT_METHODS.find(method=>method.id===id);

// The common selector owns no document bytes, saving code or renderer. Each
// method connects its existing on-document implementation through this lease.
export class TextMethodRegistry {
  constructor({validate=()=>{},changed=()=>{}}={}){this.validate=validate;this.changed=changed;this.providers=new Map();this.sessions=new Map();this.active=null;this.activeId=null;this.busy=false;this.closed=false;}
  register(id,activate){
    if(!methodById(id)||typeof activate!=='function')throw new Error('Choose a supported Text method.');
    if(this.closed)throw new Error('The document has closed.');if(this.sessions.has(id)&&this.providers.get(id)!==activate)throw new Error('Finish this Text method before reconnecting it.');this.providers.set(id,activate);this.changed();
    return()=>{if(this.providers.get(id)===activate){this.providers.delete(id);this.changed();}};
  }
  async open(id,context={}){
    if(this.closed)throw new Error('The document has closed.');
    if(this.busy)throw new Error('Wait for the Text method to finish opening.');
    if(!methodById(id))throw new Error('Choose a supported Text method.');
    const activate=this.providers.get(id);if(!activate)throw new Error('This Text method is not available for this document yet.');
    this.busy=true;this.pending=new AbortController();const signal=this.pending.signal;this.changed();let session,fresh=false;
    try{
      session=this.sessions.get(id);if(session?.closed){this.sessions.delete(id);await session.dispose?.();session=null;}if(session)await session.resume?.({...context,method:id,signal});else{fresh=true;session=await activate({...context,method:id,signal,previousSession:this.active});}
      if(this.closed||signal.aborted)throw new Error('Opening the Text method was canceled.');
      if(!session||typeof session!=='object')throw new Error('The Text method did not attach to the document.');
      await this.validate(session);if(this.closed||signal.aborted)throw new Error('Opening the Text method was canceled.');
      if(session!==this.active)await this.active?.suspend?.({retainDraft:true});
      if(this.closed||signal.aborted)throw new Error('Opening the Text method was canceled.');
      this.sessions.set(id,session);this.active=session;this.activeId=id;return session;
    }catch(error){if(fresh&&session&&session!==this.active)await session.dispose?.();throw error;}
    finally{this.busy=false;this.pending=null;this.changed();}
  }
  async prepareDeparture(){await this.active?.prepareDeparture?.();}
  async dispose(){if(this.closed)return;this.closed=true;this.pending?.abort();const errors=[];for(const session of new Set(this.sessions.values()))try{await session.dispose?.();}catch(error){errors.push(error);}this.sessions.clear();this.providers.clear();this.active=null;this.activeId=null;if(errors.length)throw new AggregateError(errors,'Some Text methods could not close cleanly.');}
}

export class PdfReaderTextTool {
  constructor(reader){
    this.reader=reader;const document=reader.root.ownerDocument;
    this.root=document.createElement('section');this.root.className='reader-text-methods';this.root.setAttribute('aria-label','Text tool');
    const heading=document.createElement('h3');heading.textContent='Text';const methods=document.createElement('div');methods.setAttribute('role','radiogroup');methods.setAttribute('aria-label','Text method');this.buttons=new Map();
    this.status=document.createElement('p');this.status.setAttribute('role','status');this.status.textContent='Choose how to work with text.';
    this.registry=new TextMethodRegistry({validate:session=>{
      if(!session?.optionsRoot||!reader.root.contains(session.optionsRoot)||session.optionsRoot.closest('dialog')||reader.paper.contains(session.optionsRoot))throw new Error('Text options must stay beside the open document.');
    },changed:()=>this.refresh()});
    for(const method of TEXT_METHODS){const button=document.createElement('button');button.type='button';button.className='secondary compact';button.setAttribute('role','radio');button.setAttribute('aria-checked','false');button.textContent=method.name;button.title=method.description;button.onclick=()=>this.open(method.id).catch(error=>{this.status.textContent=error.message;reader.announce(error.message,true);});methods.append(button);this.buttons.set(method.id,button);}
    methods.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;const enabled=[...this.buttons.values()].filter(button=>!button.disabled);if(!enabled.length)return;event.preventDefault();const index=enabled.indexOf(document.activeElement),direction=['ArrowLeft','ArrowUp'].includes(event.key)?-1:1,next=event.key==='Home'?0:event.key==='End'?enabled.length-1:(index+direction+enabled.length)%enabled.length;enabled[next].focus();enabled[next].click();});
    this.root.append(heading,methods,this.status);this.refresh();
    this.unsubscribe=reader.subscribeInteractionMode?.(mode=>{this.root.hidden=mode==='view';this.registry.active?.onModeChange?.(mode);});
  }
  registerMethod(id,activate){return this.registry.register(id,activate);}
  refresh(){const available=TEXT_METHODS.filter(method=>this.registry.providers.has(method.id)),tabId=available.some(method=>method.id===this.registry.activeId)?this.registry.activeId:available[0]?.id;for(const method of TEXT_METHODS){const button=this.buttons.get(method.id);if(!button)continue;button.disabled=this.registry.busy||!this.registry.providers.has(method.id);button.tabIndex=method.id===tabId?0:-1;button.setAttribute('aria-checked',String(method.id===this.registry.activeId));button.title=!this.registry.providers.has(method.id)?'This method is not connected for this document yet.':this.registry.busy?'Wait for the Text method to open.':method.description;}}
  async open(id){
    assertPdfEditPermission(this.reader,'content');if(this.reader.hasRestrictions&&id==='edit-existing'&&!mayEditPdf(this.reader,'fullContent'))throw Error('This PDF allows added text notes or form answers, but not changing its original text.');
    if(this.reader.interactionMode!=='quick'||id!=='text-box')this.reader.setInteractionMode?.('build');const session=await this.registry.open(id,{reader:this.reader});
    session.optionsRoot.prepend(this.root);this.root.hidden=this.reader.interactionMode==='view';this.status.textContent=methodById(id).description;session.onModeChange?.(this.reader.interactionMode);return session;
  }
  async prepareDeparture(){return this.registry.prepareDeparture();}
  async dispose(){this.unsubscribe?.();this.root.remove();await this.registry.dispose();}
}

// Text box uses the existing editable PDF-comment writer. The other methods
// register their inline implementations from the content/form controllers.
export function installReaderTextTool(reader){
  const tool=new PdfReaderTextTool(reader);reader.textTool=tool;
  tool.registerMethod('text-box',async()=>{
    await reader.showToolGroup('Comment');await reader.openCommentMode();
    const workspace=reader.commentWorkspace,select=workspace.dialog.querySelector('[aria-label="Markup tool"]');
    const activate=()=>{workspace.textEntryMethod='text-box';const color=workspace.dialog.querySelector('[aria-label="New markup color"]');if(color.value==='yellow')color.value='black';select.value='text';select.dispatchEvent(new Event('change'));workspace.syncDirectTools();};activate();
    const update=()=>{if(tool.registry.activeId!=='text-box')return;tool.root.hidden=reader.interactionMode==='view'||select.value!=='text';};
    const observer=new MutationObserver(update);observer.observe(workspace.palette,{subtree:true,attributes:true,attributeFilter:['aria-pressed']});
    return {optionsRoot:workspace.dialog,get closed(){return workspace.closed;},resume:async()=>{await reader.showToolGroup('Comment');activate();},suspend:()=>{workspace.gesture=null;},onModeChange:update,dispose:()=>observer.disconnect()};
  });
  reader.openTextTool=(method)=>tool.open(method||(tool.registry.providers.has('click-to-type')?'click-to-type':'text-box'));
  reader.registerTextMethod=(method,activate)=>tool.registerMethod(method,activate);
  return tool;
}
