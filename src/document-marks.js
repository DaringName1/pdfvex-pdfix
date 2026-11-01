import {Mark} from '@tiptap/core';
import {closeHistory} from '@tiptap/pm/history';
import {HIGHLIGHTS,SCRIPT_MARKS,validHighlight,highlightFromHex} from './document-mark-model.js';
export {HIGHLIGHTS,SCRIPT_MARKS,validHighlight,highlightFromHex};
// Superscript and subscript exclude each other, as in Word.
const script=(name,tag,other,key)=>Mark.create({
  name,excludes:other,
  parseHTML(){return [{tag},{style:'vertical-align',getAttrs:value=>value===(name==='superscript'?'super':'sub')&&null}];},
  renderHTML(){return [tag,0];},
  addCommands(){const title=name[0].toUpperCase()+name.slice(1);return {['toggle'+title]:()=>({commands})=>commands.toggleMark(name)};},
  addKeyboardShortcuts(){return {[key]:()=>this.editor.commands['toggle'+name[0].toUpperCase()+name.slice(1)]()};}
});
export const DocumentSuperscript=script('superscript','sup','subscript','Mod-.');
export const DocumentSubscript=script('subscript','sub','superscript','Mod-,');
export const DocumentHighlight=Mark.create({
  name:'highlight',
  addAttributes(){return {color:{default:'yellow',parseHTML:element=>Object.hasOwn(HIGHLIGHTS,element.dataset.pdfixHighlight)?element.dataset.pdfixHighlight:'yellow',renderHTML:attrs=>({'data-pdfix-highlight':attrs.color,style:'background-color:'+HIGHLIGHTS[attrs.color]?.hex})}};},
  parseHTML(){return [{tag:'mark[data-pdfix-highlight]'},{tag:'span[data-pdfix-highlight]'}];},
  renderHTML({HTMLAttributes}){return ['mark',HTMLAttributes,0];},
  // One Undo step per highlight change, like the paragraph layout controls.
  addCommands(){return {setDocumentHighlight:color=>({tr,commands})=>{if(color===null){closeHistory(tr);return commands.unsetMark('highlight');}validHighlight(color);closeHistory(tr);return commands.setMark('highlight',{color});}};}
});
// The highlight under the cursor, for the toolbar.
export function currentHighlight(editor){return editor.isActive('highlight')?editor.getAttributes('highlight').color??'yellow':'';}
