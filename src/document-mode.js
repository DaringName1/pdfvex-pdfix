import {modeShortcut} from './pdf-reader-mode.js';
import './document-mode-menu.css';
import {createDocumentModeMenu} from './document-mode-menu.js';
// One mode menu for documents (owner, October 22). Everything
// opened here is a document (new, Word, RTF, text, Markdown...) and opens in Build. View hides the formatting tabs and makes the text read-only; switching never saves, reloads
// or drops unsaved edits. Ctrl+Shift+E switches, as in the reader.
export function installDocumentMode(workspace){
 const navigation=workspace.root.querySelector('.document-ribbon-navigation');if(!navigation)return null;
 const doc=workspace.root.ownerDocument,events=new AbortController(),choices=[{id:'view',name:'View',description:'Read without editing. Your work stays here.',icon:'focus'},{id:'build',name:'Build',description:'Write and format this document.',icon:'settings'}];
 const controls=createDocumentModeMenu({document:doc,modes:choices,onSelect:mode=>set(mode),icon:workspace.icon});navigation.prepend(controls.root);
 function set(mode){
  if(!choices.some(choice=>choice.id===mode))throw new Error('Choose Build or View.');
  workspace.interactionMode=mode;workspace.root.dataset.interactionMode=mode;
  controls.update(mode);
  // Saving holds editing too; only allow typing when neither is in effect.
  const busy=!!(workspace.saving||workspace.departing);workspace.editor?.setEditable(mode==='build'&&!busy,false);if(workspace.input)workspace.input.readOnly=mode==='view'||busy;
  if(mode==='view'&&workspace.toolbar?.panelByName?.get('file')&&workspace.toolbar.select)workspace.toolbar.select('home');
 }
 doc.addEventListener('keydown',event=>{if(!workspace.root.isConnected||workspace.disposed||!modeShortcut(event))return;const modal=[...doc.querySelectorAll('dialog[open]')].at(-1);if(modal&&!modal.contains(workspace.root))return;event.preventDefault();set(workspace.interactionMode==='view'?'build':'view');},{signal:events.signal});
 set('build');
 return {set,dispose(){events.abort();controls.dispose();}};
}
