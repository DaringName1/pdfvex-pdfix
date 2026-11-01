import {Extension} from '@tiptap/core';
import {closeHistory} from '@tiptap/pm/history';
import {MAX_INDENT,MAX_RIGHT_INDENT,INDENT_TWIPS,INDENT_INCHES,LINE_SPACINGS,PARAGRAPH_SPACES,FIRST_LINES,validParagraphFormat} from './document-paragraph-model.js';
export {MAX_INDENT,INDENT_TWIPS,INDENT_INCHES,LINE_SPACINGS,PARAGRAPH_SPACES,FIRST_LINES,validParagraphFormat};
const TYPES=['paragraph','heading'],SPACE={spaceBefore:['data-pdfix-space-before','pdfixSpaceBefore','margin-top'],spaceAfter:['data-pdfix-space-after','pdfixSpaceAfter','margin-bottom']};
// Paragraphs inside lists keep their list level instead; the list buttons and Tab handle those.
function eachParagraph(state,visit){const {from,to}=state.selection;state.doc.nodesBetween(from,to,(node,position)=>{if(!TYPES.includes(node.type.name))return true;const $position=state.doc.resolve(position);for(let depth=$position.depth;depth>0;depth--)if($position.node(depth).type.name==='listItem')return false;visit(node,position);return false;});}
const spaceAttribute=name=>({default:null,parseHTML:element=>{const raw=element.dataset[SPACE[name][1]],value=Number(raw);return raw!==undefined&&raw!==''&&PARAGRAPH_SPACES.includes(value)?value:null;},renderHTML:attrs=>PARAGRAPH_SPACES.includes(attrs[name])?{[SPACE[name][0]]:String(attrs[name]),style:`${SPACE[name][2]}:${attrs[name]}pt`}:{}});
export const DocumentParagraphFormat=Extension.create({
 name:'documentParagraphFormat',
 addGlobalAttributes(){return [{types:TYPES,attributes:{
  // Indent and first line render together because a hanging first line also moves the paragraph's left edge.
  indent:{default:0,parseHTML:element=>{const value=Number(element.dataset.pdfixIndent);return Number.isInteger(value)&&value>=1&&value<=MAX_INDENT?value:0;},renderHTML:attrs=>{const indent=Number.isInteger(attrs.indent)&&attrs.indent>=1&&attrs.indent<=MAX_INDENT?attrs.indent:0,left=indent+(attrs.firstLine==='hanging'?1:0);return left?{...(indent?{'data-pdfix-indent':String(indent)}:{}),style:`margin-left:${left*INDENT_INCHES}in`}:{};}},
  firstLine:{default:null,parseHTML:element=>FIRST_LINES.includes(element.dataset.pdfixFirstLine)?element.dataset.pdfixFirstLine:null,renderHTML:attrs=>FIRST_LINES.includes(attrs.firstLine)?{'data-pdfix-first-line':attrs.firstLine,style:`text-indent:${attrs.firstLine==='first'?'':'-'}${INDENT_INCHES}in`}:{}},
  rightIndent:{default:0,parseHTML:element=>{const value=Number(element.dataset.pdfixRightIndent);return Number.isInteger(value)&&value>=1&&value<=MAX_RIGHT_INDENT?value:0;},renderHTML:attrs=>Number.isInteger(attrs.rightIndent)&&attrs.rightIndent>=1&&attrs.rightIndent<=MAX_RIGHT_INDENT?{'data-pdfix-right-indent':String(attrs.rightIndent),style:'margin-right:'+attrs.rightIndent*INDENT_INCHES+'in'}:{}},
  lineSpacing:{default:null,parseHTML:element=>{const value=Number(element.dataset.pdfixLine);return LINE_SPACINGS.includes(value)?value:null;},renderHTML:attrs=>LINE_SPACINGS.includes(attrs.lineSpacing)?{'data-pdfix-line':String(attrs.lineSpacing),style:`line-height:${attrs.lineSpacing}`}:{}},
  spaceBefore:spaceAttribute('spaceBefore'),spaceAfter:spaceAttribute('spaceAfter')}}];},
 addCommands(){
  // Each paragraph layout change is its own undo step rather than joining the typing around it.
  const setAll=(name,allowed)=>value=>({state,tr,dispatch})=>{if(value!==null&&!allowed.includes(value))return false;let found=false;eachParagraph(state,(node,position)=>{found=true;if(dispatch&&(node.attrs[name]??null)!==value)closeHistory(tr).setNodeMarkup(position,undefined,{...node.attrs,[name]:value});});return found;};
  return {
   changeDocumentIndent:delta=>({state,tr,dispatch})=>{if(![1,-1].includes(delta))return false;let changed=false;eachParagraph(state,(node,position)=>{const next=Math.max(0,Math.min(MAX_INDENT,(node.attrs.indent??0)+delta));if(next===(node.attrs.indent??0))return;changed=true;if(dispatch)closeHistory(tr).setNodeMarkup(position,undefined,{...node.attrs,indent:next});});return changed;},
   setDocumentLineSpacing:setAll('lineSpacing',LINE_SPACINGS),setDocumentSpaceBefore:setAll('spaceBefore',PARAGRAPH_SPACES),setDocumentSpaceAfter:setAll('spaceAfter',PARAGRAPH_SPACES),setDocumentFirstLine:setAll('firstLine',FIRST_LINES),setDocumentRightIndent:setAll('rightIndent',[0,1,2,3,4])};},
 // Tab at the very start of a paragraph indents it, as in other editors; anywhere else Tab keeps its usual meaning
 // (next table cell, list level, or moving focus out of the document).
 addKeyboardShortcuts(){
  const atStart=()=>{const {selection}=this.editor.state,{$from}=selection;if(!selection.empty||$from.parentOffset!==0||!TYPES.includes($from.parent.type.name))return false;for(let depth=$from.depth;depth>0;depth--)if(['listItem','tableCell','tableHeader'].includes($from.node(depth).type.name))return false;return true;};
  return {Tab:()=>atStart()&&this.editor.commands.changeDocumentIndent(1),'Shift-Tab':()=>atStart()&&this.editor.commands.changeDocumentIndent(-1)};}
});
// What the paragraph controls should show for the current selection: the first paragraph outside a list.
export function currentParagraphFormat(editor){let format=null;eachParagraph(editor.state,node=>{format??={indent:node.attrs.indent??0,lineSpacing:node.attrs.lineSpacing??null,spaceBefore:node.attrs.spaceBefore??null,spaceAfter:node.attrs.spaceAfter??null,firstLine:node.attrs.firstLine??null,rightIndent:node.attrs.rightIndent??0};});return format;}
