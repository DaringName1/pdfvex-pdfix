import './pdf-layers.css';
const LIMIT=256,ORDER_LIMIT=2048,ORDER_DEPTH=10;
const element=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
const name=value=>typeof value==='string'&&value.trim()?value.slice(0,180):'Unnamed PDF layer';
export class PdfLayers{
 constructor(reader){this.reader=reader;this.config=null;this.groups=new Map();this.rows=new Map();this.generation=0;this.closed=false;this.busy=false;this.renderPending=false;this.mount();}
 mount(){
  this.button=element('button','PDF layers','text-button');this.button.type='button';this.button.setAttribute('aria-expanded','false');this.reader.root.querySelector('.reader-tools').append(this.button);
  this.panel=element('section',undefined,'pdf-layers');this.panel.hidden=true;this.panel.setAttribute('aria-label','PDF optional content layers');
  this.panel.innerHTML='<div class="pdf-layers-heading"><b>PDF layers</b><button type="button" class="icon-button" data-layer-close aria-label="Close PDF layers">×</button></div><p class="pdf-layers-policy">Show or hide optional PDF content in this page view. Hidden layers remain in the document. This is not redaction or removal. View changes are temporary; saved files, exports, thumbnails and printing keep their own document settings.</p><p class="pdf-layers-status" role="status" aria-live="polite"></p><div class="pdf-layers-list"></div><div class="pdf-layers-actions"><button type="button" class="secondary compact" data-layer-defaults>Restore document defaults</button><button type="button" class="text-button" data-layer-cancel>Cancel layer changes</button><button type="button" class="text-button" data-layer-retry hidden>Retry layer discovery</button></div>';
  this.reader.root.querySelector('.pdf-body').before(this.panel);this.list=this.panel.querySelector('.pdf-layers-list');this.events=new AbortController();
  const on=(node,event,fn)=>node.addEventListener(event,fn,{signal:this.events.signal});on(this.button,'click',()=>this.toggle());on(this.panel.querySelector('[data-layer-close]'),'click',()=>this.toggle(false));
  on(this.panel.querySelector('[data-layer-defaults]'),'click',()=>this.restoreDefaults());on(this.panel.querySelector('[data-layer-cancel]'),'click',()=>this.cancel());on(this.panel.querySelector('[data-layer-retry]'),'click',()=>this.load());
  on(this.panel,'keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.toggle(false);}});
  this.observe=new MutationObserver(()=>{if(this.reader.paper.dataset.ready==='true')this.renderError=false;this.renderPending=this.reader.paper.dataset.ready!=='true'&&!this.renderError;this.sync();});this.observe.observe(this.reader.paper,{attributes:true,attributeFilter:['data-ready']});this.sync();
 }
 get optionalContentConfigPromise(){return this.config?Promise.resolve(this.config):undefined;}
 status(message){this.panel.querySelector('.pdf-layers-status').textContent=message;}
 async toggle(visible=this.panel.hidden){
  if(this.closed)return;if(visible&&!this.reader.doc){this.reader.announce('Open a readable PDF before inspecting layers.');return;}
  const restoreFocus=this.panel.contains(document.activeElement);this.panel.hidden=!visible;this.button.setAttribute('aria-expanded',String(visible));
  if(!visible){if(this.loading){this.generation++;clearTimeout(this.timer);this.abortLoad?.();this.loading=false;this.busy=false;this.sync();}if(restoreFocus)(this.button.checkVisibility()?this.button:this.reader.root.querySelector('.reader-view-more>summary')||this.reader.stage).focus();return;}
  this.reader.options.open=false;if(!this.config)await this.load();if(this.closed||this.panel.hidden)return;
  this.openingState=this.snapshot();this.panel.querySelector('[data-layer-close]').focus();
 }
 async load(){
  if(this.closed||this.busy||!this.reader.doc)return;const token=++this.generation,doc=this.reader.doc;this.loading=true;this.busy=true;this.status('Reading document layer settings…');this.sync();
  try{
   const abort=new Promise((_,reject)=>{this.abortLoad=()=>reject(new Error('Layer discovery canceled.'));this.timer=setTimeout(()=>reject(new Error('Layer discovery took too long. Try again or use the default PDF view.')),20000);});
   const config=await Promise.race([doc.getOptionalContentConfig({intent:'display'}),abort]);if(this.closed||token!==this.generation||doc!==this.reader.doc)return;
   this.adopt(config);this.panel.querySelector('[data-layer-retry]').hidden=true;this.openingState=this.snapshot();
   this.status(this.groups.size?`${this.groups.size} optional layers. ${this.unsupported?`${this.unsupported} unsupported states are read-only. `:''}${this.orderWarning?'Some layer order entries are unsupported; remaining layers are listed separately. ':''}Radio-linked layers preserve the PDF’s mutual exclusion when enabled.`:'This PDF exposes no optional-content layers.');
  }catch(error){if(!this.closed&&token===this.generation){this.config=null;this.groups.clear();this.rows.clear();this.list.replaceChildren();this.status(error.message);this.panel.querySelector('[data-layer-retry]').hidden=false;}}
  finally{if(token===this.generation){clearTimeout(this.timer);this.abortLoad=null;this.loading=false;this.busy=false;this.sync();}}
 }
 adopt(config){
  if(!config||typeof config[Symbol.iterator]!=='function'||typeof config.getOrder!=='function'||typeof config.getGroup!=='function'||typeof config.setVisibility!=='function')throw new Error('This reader cannot inspect the PDF’s layer configuration safely.');
  const groups=new Map();for(const entry of config){if(!Array.isArray(entry)||entry.length!==2||typeof entry[0]!=='string'||entry[0].length>160||!entry[1])throw new Error('The PDF contains an unsupported layer identifier.');groups.set(entry[0],entry[1]);if(groups.size>LIMIT)throw new Error(`This document exceeds the ${LIMIT}-layer control limit. The default view remains available.`);}
  this.unsupported=0;const states=new Map(),links=new Map([...groups.keys()].map(id=>[id,new Set()]));let radioReferences=0;
  for(const [id,group]of groups){let supported=typeof group.visible==='boolean',linked=false;const rb=group.rbGroups;
   if(!Array.isArray(rb)||rb.length>LIMIT)supported=false;else for(const set of rb){if(!set||typeof set[Symbol.iterator]!=='function'){supported=false;break;}let count=0;for(const peer of set){if(++radioReferences>16384)throw new Error('This PDF has too many radio-layer relationships for safe interactive controls. The default view remains available.');if(++count>LIMIT||typeof peer!=='string'||!groups.has(peer)){supported=false;break;}if(peer!==id){linked=true;links.get(id).add(peer);links.get(peer).add(id);}}}
   if(!supported)this.unsupported++;states.set(id,{group,supported,linked});
  }
  const blocked=[...states].filter(([,state])=>!state.supported).map(([id])=>id);for(let i=0;i<blocked.length;i++)for(const peer of links.get(blocked[i])){const state=states.get(peer);if(state.supported){state.supported=false;this.unsupported++;blocked.push(peer);}}
  this.config=config;this.groups=states;this.rows.clear();this.list.replaceChildren();this.orderWarning=false;const seen=new Set();let count=0;
  const walk=(order,depth=0)=>{
   if(!Array.isArray(order)||depth>ORDER_DEPTH){this.orderWarning=true;return;}
   for(const entry of order){if(++count>ORDER_LIMIT){this.orderWarning=true;return;}
    if(typeof entry==='string'){if(!states.has(entry)){this.orderWarning=true;continue;}if(seen.has(entry))continue;seen.add(entry);this.addRow(entry,depth);}
    else if(entry&&typeof entry==='object'&&!Array.isArray(entry)&&Array.isArray(entry.order)){if(entry.name!==null&&typeof entry.name!=='string'){this.orderWarning=true;continue;}const heading=element('div',entry.name===null?'Other PDF layers':name(entry.name),'pdf-layer-group-heading');heading.style.paddingInlineStart=`${Math.min(depth,6)*14}px`;this.list.append(heading);walk(entry.order,depth+1);}
    else this.orderWarning=true;
   }
  };
  const order=config.getOrder();if(order!==null)walk(order);for(const id of states.keys())if(!seen.has(id))this.addRow(id,0);this.sync();
 }
 addRow(id,depth){
  const state=this.groups.get(id),label=element('label',undefined,'pdf-layer-row'),input=element('input');input.type='checkbox';input.checked=typeof state.group.visible==='boolean'?state.group.visible:false;
  const description=element('span',name(state.group.name));description.title=typeof state.group.name==='string'?state.group.name.slice(0,2048):'Unnamed PDF layer';
  label.style.paddingInlineStart=`${Math.min(depth,6)*14}px`;label.append(input,description);if(state.linked)label.append(element('small','Radio-linked'));if(!state.supported)label.append(element('small','Unsupported state'));
  input.addEventListener('change',()=>this.change(id,input.checked),{signal:this.events.signal});this.rows.set(id,input);this.list.append(label);
 }
 snapshot(){return new Map([...this.groups].filter(([,state])=>state.supported).map(([id,state])=>[id,state.group.visible]));}
 sync(){
  if(this.closed)return;const pending=this.busy||this.renderPending;
  for(const [id,input]of this.rows){const state=this.groups.get(id);input.checked=typeof state.group.visible==='boolean'?state.group.visible:false;input.disabled=pending||!state.supported;}
  this.panel.querySelector('[data-layer-defaults]').disabled=pending||!this.config||!this.groups.size;this.panel.querySelector('[data-layer-cancel]').disabled=pending||!this.config||!this.openingState?.size;this.panel.querySelector('[data-layer-retry]').disabled=pending;
 }
 rendering(){if(this.closed)return;this.renderError=false;this.renderPending=true;this.sync();}
 rendered(){if(this.closed)return;this.renderError=false;this.renderPending=false;this.sync();}
 renderFailed(){if(this.closed)return;this.renderError=true;this.renderPending=false;this.sync();}
 async redraw(message){
  this.busy=true;this.sync();try{await this.reader.renderPage();if(!this.closed)this.status(message);}catch(error){if(!this.closed){this.renderFailed();this.status(`The selected layer view could not be rendered. ${error.message} Restore document defaults or reopen the PDF.`);}}finally{if(!this.closed){this.busy=false;this.renderPending=this.reader.paper.dataset.ready!=='true'&&!this.renderError;this.sync();}}
 }
 async change(id,visible){
  const state=this.groups.get(id);if(this.closed||this.busy||this.renderPending||!state?.supported){this.sync();return;}
  try{this.config.setVisibility(id,visible,true);this.sync();await this.redraw(`${name(state.group.name)} ${visible?'shown':'hidden'} in the current view. Hidden content remains in the PDF.${state.linked&&visible?' Linked layer checkboxes were updated.':''}`);}catch(error){this.status(error.message);this.sync();}
 }
 async restoreDefaults(){
  if(this.closed||this.busy||this.renderPending||!this.reader.doc)return;this.busy=true;this.sync();const doc=this.reader.doc,token=++this.generation;
  try{const config=await doc.getOptionalContentConfig({intent:'display'});if(this.closed||token!==this.generation||doc!==this.reader.doc)return;this.adopt(config);await this.redraw('Document default layer visibility restored.');}catch(error){if(!this.closed)this.status(`Defaults could not be restored. ${error.message}`);}finally{if(!this.closed){this.busy=false;this.sync();}}
 }
 async cancel(){
  if(this.closed||this.busy||this.renderPending||!this.config||!this.openingState)return;
  try{for(const [id,visible]of this.openingState)this.config.setVisibility(id,visible,false);this.sync();await this.redraw('Layer view reverted to the state before opening these controls.');if(!this.closed)this.toggle(false);}catch(error){this.status(`Layer changes could not be canceled. ${error.message}`);}
 }
 dispose(){if(this.closed)return;this.closed=true;this.generation++;clearTimeout(this.timer);this.abortLoad?.();this.events.abort();this.observe.disconnect();this.panel.remove();this.button.remove();this.groups.clear();this.rows.clear();this.config=null;this.openingState=null;}
}
