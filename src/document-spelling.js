import {Extension} from '@tiptap/core';
import {Plugin,PluginKey} from '@tiptap/pm/state';
import {Decoration,DecorationSet} from '@tiptap/pm/view';
const key=new PluginKey('pdfix-document-spelling');
export const DocumentSpellingHighlights=Extension.create({
 name:'documentSpellingHighlights',
 addProseMirrorPlugins(){return [new Plugin({key,state:{init:()=>DecorationSet.empty,apply(transaction,old){
  const ranges=transaction.getMeta(key);
  if(ranges!==undefined)return DecorationSet.create(transaction.doc,ranges.filter(range=>Number.isSafeInteger(range.from)&&Number.isSafeInteger(range.to)&&range.from>=0&&range.to>range.from&&range.to<=transaction.doc.content.size).slice(0,1000).map(range=>Decoration.inline(range.from,range.to,{class:'document-spelling-error',title:'Possible spelling error: '+String(range.word||'').slice(0,128)})));
  // Clear on edits; mapping old findings would present unchecked words as errors.
  return transaction.docChanged?DecorationSet.empty:old;
 }},props:{decorations:state=>key.getState(state)}})];}
});

// The snapshot uses JavaScript/Windows UTF-16 offsets. Each paragraph maps to a
// contiguous ProseMirror range; code blocks and inline code are blanked before
// checking. Leaf atoms occupy one offset, matching ProseMirror's node size.
export function documentSpellingSnapshot(editor,revision,sourceLabel='Document'){
 const doc=editor.state.doc,parts=[],segments=[];let start=0;
 doc.descendants((node,pos)=>{
  if(!node.isTextblock)return;
  const raw=node.textBetween(0,node.content.size,'\n','\uFFFC');let text=raw;
  if(node.type.name==='codeBlock')text=raw.replace(/[^\r\n]/g,' ');
  else{const excluded=[];node.descendants((child,offset)=>{if(child.isText&&child.marks.some(mark=>mark.type.name==='code'))excluded.push({start:offset,end:offset+child.nodeSize});});for(const range of excluded.reverse())text=text.slice(0,range.start)+' '.repeat(range.end-range.start)+text.slice(range.end);text=text.replace(/\uFFFC/g,' ');}
  if(parts.length){parts.push('\n');start++;}parts.push(text);if(node.type.name!=='codeBlock')segments.push({start,end:start+text.length,from:pos+1});start+=text.length;return false;
 });
 return {text:parts.join(''),revision,sourceLabel,segments,readOnly:!editor.isEditable};
}
export function documentSpellingRange(snapshot,finding){
 const end=finding.start+finding.length,segment=snapshot.segments?.find(row=>Number.isSafeInteger(row.from)&&finding.start>=row.start&&end<=row.end);
 return segment?{from:segment.from+finding.start-segment.start,to:segment.from+end-segment.start,word:finding.word}:null;
}
export function setDocumentSpellingHighlights(editor,findings,snapshot){
 if(editor?.isDestroyed)return;const ranges=findings.map(finding=>documentSpellingRange(snapshot,finding)).filter(Boolean);
 editor.view.dispatch(editor.state.tr.setMeta(key,ranges).setMeta('addToHistory',false));
}

// Input opt-outs are intentional. Bind live prose controls with spellcheck=true;
// paths, identifiers, formulas, receipt numbers and source editors use false.
export function configureProseSpellcheck(input,{prose=false,language}={}){
 input.spellcheck=Boolean(prose);input.setAttribute('spellcheck',prose?'true':'false');if(language)input.lang=language;
}
