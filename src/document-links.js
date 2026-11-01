import {Mark,Extension,getMarkRange} from '@tiptap/core';
import {closeHistory} from '@tiptap/pm/history';
import {validDocumentLink,documentLinkFromInput,validLinkTarget,validDocumentAnchor,isInternalLink} from './document-link-model.js';
import './document-links.css';

// Links never navigate inside PDFix. A click shows the address first; the person opens it from there.
export const DocumentLink=Mark.create({
 name:'documentLink',inclusive:false,
 addAttributes(){return {href:{default:null}};},
 parseHTML(){return [{tag:'a[href]',getAttrs:element=>{try{return {href:validLinkTarget(element.getAttribute('href'))};}catch{return false;}}}];},
 renderHTML({mark}){const href=validLinkTarget(mark.attrs.href);return ['a',{href,class:'document-link',...(isInternalLink(href)?{}:{rel:'noopener noreferrer'})},0];}
});
// A heading that a link points to carries an anchor name, given when the first link to it is made.
export const DocumentHeadingAnchor=Extension.create({name:'documentHeadingAnchor',addGlobalAttributes(){return [{types:['heading'],attributes:{anchor:{default:null,parseHTML:element=>{try{return validDocumentAnchor(element.dataset.pdfixAnchor);}catch{return null;}},renderHTML:attrs=>attrs.anchor?{'data-pdfix-anchor':attrs.anchor}:{}}}}];}});
// Headings in document order, for the link list and for following a heading link.
function headings(doc){const list=[];doc.descendants((node,position)=>{if(node.type.name==='heading'){list.push({node,position,text:node.textContent.trim()||'(empty heading)'});return false;}return list.length<500;});return list;}

export class DocumentLinkControls{
 constructor(workspace){
  this.workspace=workspace;if(workspace.sourceMode)return;
  const root=document.createElement('details');this.root=root;root.className='document-link-controls';
  root.innerHTML='<summary>Links</summary><div><label>Web or email address <input data-link-url type="text" maxlength="2000" spellcheck="false" autocomplete="off" placeholder="https://example.com"></label></div><div><label>or a heading in this document <select data-link-heading><option value="">Choose a heading…</option></select></label><button data-link-apply>Apply link</button><button data-link-show>Show link</button><button data-link-remove>Remove link</button></div><p role="status" aria-live="polite">Select text, enter an address and choose Apply link. Ctrl+K opens this panel. Clicking a link shows its address before anything opens.</p>';
  this.input=root.querySelector('[data-link-url]');this.heading=root.querySelector('[data-link-heading]');
  // The heading list is read when it is about to be used, so it always matches the document.
  this.heading.onmousedown=this.heading.onfocus=()=>this.fillHeadings();this.heading.onchange=()=>{if(this.heading.value)this.input.value='';};root.addEventListener('toggle',()=>{if(root.open)this.fillHeadings();});
  for(const [name,action] of [['apply',()=>this.apply()],['remove',()=>this.remove(this.current())],['show',()=>this.showCurrent()]]){const button=root.querySelector('[data-link-'+name+']');button.type='button';button.onmousedown=event=>event.preventDefault();button.onclick=action;}
  this.input.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();this.apply();}};
  // Remember where the link goes before the address field takes the caret away from the document.
  this.input.onfocus=()=>{if(this.opening)return;this.target=this.current();};
  workspace.root.querySelector('.editor-toolbar').append(root);
  const popup=document.createElement('div');this.popup=popup;popup.className='document-link-popup';popup.hidden=true;popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Link');
  popup.innerHTML='<p class="document-link-address"></p><p class="document-link-note"></p><div><button class="primary compact" data-popup-open>Open link</button><button class="secondary compact" data-popup-edit>Edit</button><button class="secondary compact" data-popup-remove>Remove</button><button class="icon-button" data-popup-close aria-label="Close link">×</button></div>';
  for(const button of popup.querySelectorAll('button'))button.type='button';
  popup.querySelector('[data-popup-open]').onclick=()=>this.visit();
  popup.querySelector('[data-popup-edit]').onclick=()=>{const range=this.popupRange;this.hidePopup();this.open(range);};
  popup.querySelector('[data-popup-remove]').onclick=()=>{const range=this.popupRange;this.hidePopup();this.remove(range);};
  popup.querySelector('[data-popup-close]').onclick=()=>{this.hidePopup();workspace.editor?.commands.focus();};
  document.body.append(popup);
  const view=workspace.editor.view.dom;
  // Capture phase: the address is shown and the browser's own link handling never runs.
  this.click=event=>{const link=event.target instanceof Element?event.target.closest('a.document-link'):null;if(!link||!view.contains(link))return;event.preventDefault();if(event.type==='click')this.showPopup(link);};
  for(const type of ['click','auxclick'])view.addEventListener(type,this.click,true);
  // Inside the document Ctrl+K means Link, as in other editors; elsewhere it stays the app's file search.
  this.shortcut=event=>{if(!event.ctrlKey||event.altKey||event.shiftKey||event.key.toLowerCase()!=='k')return;event.preventDefault();event.stopPropagation();this.open(this.current());};
  view.addEventListener('keydown',this.shortcut);
  this.outside=event=>{if(this.popup.hidden||this.popup.contains(event.target)||(event.target instanceof Element&&event.target.closest('a.document-link')))return;this.hidePopup();};
  this.escape=event=>{if(event.key==='Escape'&&!this.popup.hidden){event.preventDefault();this.hidePopup();workspace.editor?.commands.focus();}};
  this.scrolled=()=>this.hidePopup();
  document.addEventListener('mousedown',this.outside,true);document.addEventListener('keydown',this.escape,true);workspace.root.querySelector('.editor-canvas')?.addEventListener('scroll',this.scrolled,{passive:true});window.addEventListener('resize',this.scrolled);
  this.sync();
 }
 locked(){const w=this.workspace;return !!(w.saving||w.departing||w.disposed||!w.editor?.isEditable);}
 status(message){this.root.querySelector('[role=status]').textContent=message;}
 // The selection as the person sees it. The page selection is read directly while it is inside the document,
 // because the editor's own copy can lag until the next edit.
 current(){
  const editor=this.workspace.editor,view=editor.view,state=editor.state,selection=view.root.getSelection?.();let {from,to}=state.selection;
  if(selection?.rangeCount&&selection.anchorNode&&selection.focusNode&&view.dom.contains(selection.anchorNode)&&view.dom.contains(selection.focusNode))try{const a=view.posAtDOM(selection.anchorNode,selection.anchorOffset),b=view.posAtDOM(selection.focusNode,selection.focusOffset);from=Math.min(a,b);to=Math.max(a,b);}catch{}
  return {from,to,doc:state.doc};
 }
 linkAt(position){const state=this.workspace.editor.state;if(!Number.isInteger(position)||position<0||position>state.doc.content.size)return null;const range=getMarkRange(state.doc.resolve(position),state.schema.marks.documentLink);return range?{from:range.from,to:range.to,href:state.doc.rangeHasMark(range.from,range.to,state.schema.marks.documentLink)?state.doc.nodeAt(range.from)?.marks.find(mark=>mark.type.name==='documentLink')?.attrs.href??'':''}:null;}
 // A remembered place is used only while the document is unchanged; a caret inside a link means the whole link.
 resolve(target){
  const state=this.workspace.editor.state;let {from,to}=target&&target.doc===state.doc?target:state.selection;
  const link=from===to?this.linkAt(from):null;if(link)({from,to}=link);
  else while(to>from&&/\s/.test(state.doc.textBetween(to-1,to,'\n','\n')))to--;
  return {from,to,link:link??(from<to?this.linkAt(from):null)};
 }
 open(target){if(!this.root||this.locked())return;this.target=target??this.current();this.opening=true;try{this.workspace.toolbar?.select('insert');this.root.open=true;const place=this.resolve(this.target);this.input.value=place.link?.href??'';this.shown=this.input.value;this.input.focus();this.input.select();}finally{this.opening=false;}}
 apply(){
  const w=this.workspace;if(this.locked())return;
  try{
   if(this.heading.value!==''){this.applyHeading(Number(this.heading.value));return;}
   const typed=this.input.value.trim(),href=documentLinkFromInput(typed),editor=w.editor,{from,to}=this.resolve(this.target);
   if(from===to)editor.chain().focus().command(({tr})=>{closeHistory(tr);return true;}).insertContentAt(from,{type:'text',text:typed,marks:[{type:'documentLink',attrs:{href}}]}).run();
   else editor.chain().focus().command(({tr})=>{closeHistory(tr);return true;}).setTextSelection({from,to}).setMark('documentLink',{href}).setTextSelection(to).run();
   this.target=null;this.status('Link applied. Click it in the document to see or open its address.');this.sync(true);
  }catch(error){this.status(error.message);w.announce(error.message,true);}
 }
 fillHeadings(){if(!this.heading||this.locked())return;const chosen=this.heading.value,list=headings(this.workspace.editor.state.doc);this.heading.replaceChildren(new Option(list.length?'Choose a heading…':'No headings yet',''),...list.map((entry,index)=>new Option('H'+entry.node.attrs.level+' · '+entry.text.slice(0,80),String(index))));if(chosen&&Number(chosen)<list.length)this.heading.value=chosen;}
 // A link to a heading: the heading gets an anchor if it has none, and the selection (or the heading's text, when
 // nothing is selected) links to it. Both happen in one Undo step.
 applyHeading(index){
  const w=this.workspace,editor=w.editor,entry=headings(editor.state.doc)[index];if(!entry)throw new Error('Choose a heading.');
  const anchor=entry.node.attrs.anchor??'h-'+Array.from(crypto.getRandomValues(new Uint8Array(4)),byte=>byte.toString(16).padStart(2,'0')).join(''),href='#'+validDocumentAnchor(anchor),{from,to}=this.resolve(this.target);
  const chain=editor.chain().focus().command(({tr})=>{closeHistory(tr);if(!entry.node.attrs.anchor)tr.setNodeMarkup(entry.position,undefined,{...entry.node.attrs,anchor});return true;});
  if(from===to)chain.insertContentAt(from,{type:'text',text:entry.text,marks:[{type:'documentLink',attrs:{href}}]}).run();else chain.setTextSelection({from,to}).setMark('documentLink',{href}).setTextSelection(to).run();
  this.heading.value='';this.target=null;this.status('Link to "'+entry.text.slice(0,80)+'" applied. Click it to go to the heading.');this.sync(true);
 }
 // A table of contents at the cursor: "Contents", then one linked line per heading, indented by heading level. Headings
 // without an anchor get one. One Undo step; inserting again after changing headings makes a fresh list.
 insertContents(){
  const w=this.workspace;if(!this.root||this.locked())return;const editor=w.editor,list=headings(editor.state.doc).filter(entry=>entry.node.textContent.trim());
  if(!list.length){w.announce('Add headings first (Home > Paragraph style), then insert the table of contents.',true);return;}
  const anchors=list.map(entry=>entry.node.attrs.anchor??'h-'+Array.from(crypto.getRandomValues(new Uint8Array(4)),byte=>byte.toString(16).padStart(2,'0')).join(''));
  const lines=[{type:'paragraph',content:[{type:'text',text:'Contents',marks:[{type:'bold'}]}]},...list.map((entry,index)=>({type:'paragraph',attrs:{indent:Math.min(2,entry.node.attrs.level-1)},content:[{type:'text',text:entry.node.textContent.trim().slice(0,300),marks:[{type:'documentLink',attrs:{href:'#'+validDocumentAnchor(anchors[index])}}]}]}))];
  editor.chain().focus().command(({tr})=>{closeHistory(tr);list.forEach((entry,index)=>{if(!entry.node.attrs.anchor)tr.setNodeMarkup(entry.position,undefined,{...entry.node.attrs,anchor:anchors[index]});});return true;}).insertContent(lines).run();
  w.announce('Table of contents inserted with '+list.length+(list.length===1?' heading':' headings')+'. Each line links to its heading.');
 }
 remove(target){
  if(this.locked())return;const {from,to,link}=this.resolve(target);if(!link&&from===to)return;
  this.workspace.editor.chain().focus().command(({tr})=>{closeHistory(tr);return true;}).setTextSelection({from,to}).unsetMark('documentLink').setTextSelection(to).run();this.target=null;this.status('Link removed. The text stays.');this.sync(true);
 }
 showCurrent(){const editor=this.workspace.editor,place=this.resolve(this.current());if(!place.link)return;const found=editor.view.domAtPos(place.from+1),node=found.node.nodeType===1?found.node:found.node.parentElement,link=node?.closest('a.document-link')??node?.querySelector?.('a.document-link');if(link)this.showPopup(link);}
 showPopup(link){
  let href;try{href=validLinkTarget(link.getAttribute('href'));}catch{return;}
  const editor=this.workspace.editor;let position=null;try{position=editor.view.posAtDOM(link,0);}catch{}
  this.popupRange=position===null?null:{from:position,to:position,doc:editor.state.doc};
  const internal=isInternalLink(href),target=internal?headings(editor.state.doc).find(entry=>entry.node.attrs.anchor===href.slice(1)):null;
  this.href=href;this.popup.querySelector('.document-link-address').textContent=internal?(target?'Heading: '+target.text:'A heading that is no longer in this document'):href;
  this.popup.querySelector('.document-link-note').textContent=internal?(target?'Goes to this heading in the document.':'Edit or remove this link.'):href.startsWith('mailto:')?'Opens in your email app.':'Opens in your web browser. PDFix has not checked this website.';
  const go=this.popup.querySelector('[data-popup-open]');go.textContent=internal?'Go to heading':'Open link';go.disabled=internal&&!target;
  for(const name of ['edit','remove'])this.popup.querySelector('[data-popup-'+name+']').disabled=this.locked()||!this.popupRange;
  this.popup.hidden=false;const rect=link.getBoundingClientRect(),box=this.popup.getBoundingClientRect();
  this.popup.style.left=Math.max(8,Math.min(rect.left,innerWidth-box.width-8))+'px';
  this.popup.style.top=(rect.bottom+box.height+12>innerHeight?Math.max(8,rect.top-box.height-6):rect.bottom+6)+'px';
  this.popup.querySelector('[data-popup-open]').focus({preventScroll:true});
 }
 hidePopup(){if(this.popup&&!this.popup.hidden){this.popup.hidden=true;this.href=null;this.popupRange=null;}}
 async visit(){
  const href=this.href,w=this.workspace;if(!href||this.visiting)return;
  if(isInternalLink(href)){const target=headings(w.editor.state.doc).find(entry=>entry.node.attrs.anchor===href.slice(1));this.hidePopup();if(!target){w.announce('That heading is no longer in this document.',true);return;}w.editor.chain().focus().setTextSelection(target.position+1).scrollIntoView().run();w.editor.view.domAtPos(target.position+1)?.node?.parentElement?.closest?.('h1,h2,h3,h4,h5,h6')?.scrollIntoView({block:'start'});w.announce('Moved to the heading "'+target.text.slice(0,80)+'".');return;}
  this.visiting=true;
  try{await window.pdfix.openDocumentLink(href);w.announce(href.startsWith('mailto:')?'Opened in your email app.':'Opened in your browser.');this.hidePopup();}
  catch(error){w.announce(error.message,true);}finally{this.visiting=false;}
 }
 sync(force=false){
  if(!this.root)return;const locked=this.locked(),link=this.linkAt(this.workspace.editor.state.selection.from);
  this.root.querySelector('[data-link-apply]').disabled=locked;this.input.disabled=locked;this.root.querySelector('[data-link-remove]').disabled=locked;
  if(locked)this.hidePopup();
  const href=link?.href??'';if((force||document.activeElement!==this.input)&&href!==this.shown){this.shown=href;this.input.value=href;}
 }
 dispose(){
  if(!this.root)return;const view=this.workspace.editor?.view.dom;for(const type of ['click','auxclick'])view?.removeEventListener(type,this.click,true);view?.removeEventListener('keydown',this.shortcut);
  document.removeEventListener('mousedown',this.outside,true);document.removeEventListener('keydown',this.escape,true);window.removeEventListener('resize',this.scrolled);this.workspace.root.querySelector('.editor-canvas')?.removeEventListener('scroll',this.scrolled);
  this.popup.remove();this.root.remove();
 }
}
