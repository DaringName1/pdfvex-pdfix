import {validateRichText} from './pdf-content-rich-layout.js';
import {HIGHLIGHTS,highlightFromHex} from './document-marks.js';

export function richTextFromDocument(doc,base){
 const paragraphs=[];
 function paragraph(node,list='none',depth=0){const attrs=node.attrs||{},runs=[];
  for(const child of node.content||[]){if(child.type==='hardBreak')throw Error('Use Enter for a new paragraph.');if(child.type!=='text')throw Error('Only text belongs in this PDF text box.');const r={text:child.text};for(const mark of child.marks||[]){if(['bold','italic','underline','strike'].includes(mark.type))r[mark.type]=true;else if(mark.type==='superscript'||mark.type==='subscript')r.script=mark.type==='superscript'?'super':'sub';else if(mark.type==='documentTextStyle'){for(const key of ['font','size','color'])if(mark.attrs?.[key]!=null)r[key]=mark.attrs[key];}else if(mark.type==='highlight')r.highlight=HIGHLIGHTS[mark.attrs?.color]?.hex;}if(node.type==='heading'){r.size??=[24,20,18][Math.min(3,attrs.level)-1];r.bold??=true;}runs.push(r);}
  if(!runs.length)runs.push({text:''});paragraphs.push({runs,align:attrs.textAlign||'left',indent:(attrs.indent||0)+depth,rightIndent:attrs.rightIndent||0,firstLine:attrs.firstLine||null,lineSpacing:attrs.lineSpacing||1.2,spaceBefore:attrs.spaceBefore||0,spaceAfter:attrs.spaceAfter||0,list,level:node.type==='heading'?attrs.level:0});
 }
 function walk(node,list='none',depth=0){if(node.type==='paragraph'||node.type==='heading')paragraph(node,list,depth);else if(['doc','listItem','bulletList','orderedList'].includes(node.type)){const next=node.type==='bulletList'?'bullet':node.type==='orderedList'?'number':list;for(const child of node.content||[])walk(child,next,depth+(node.type==='listItem'&&['bulletList','orderedList'].includes(child.type)?1:0));}else throw Error('Only paragraphs and lists belong in this PDF text box.');}
 walk(doc);validateRichText(paragraphs);return paragraphs;
}
export function richTextDocument(item){
 const rows=item.richText||item.text.split('\n').map(text=>({runs:[{text}],list:'none'})),content=[];
 for(const p of rows){const paragraph={type:p.level?'heading':'paragraph',attrs:{...(p.level?{level:p.level}:{}),textAlign:p.align||null,indent:p.indent||0,rightIndent:p.rightIndent||0,firstLine:p.firstLine||null,lineSpacing:p.lineSpacing||null,spaceBefore:p.spaceBefore??null,spaceAfter:p.spaceAfter??null},content:[]};
  for(const r of p.runs){if(!r.text)continue;const marks=[];for(const type of ['bold','italic','underline','strike'])if(r[type])marks.push({type});if(r.script)marks.push({type:r.script==='super'?'superscript':'subscript'});const attrs={font:r.font||null,size:r.size||null,color:r.color||null};if(Object.values(attrs).some(v=>v!==null))marks.push({type:'documentTextStyle',attrs});if(r.highlight){const color=highlightFromHex(r.highlight);if(color)marks.push({type:'highlight',attrs:{color}});}paragraph.content.push({type:'text',text:r.text,...(marks.length?{marks}:{})});}
  if(p.list&&p.list!=='none'){const type=p.list==='number'?'orderedList':'bulletList',last=content.at(-1);if(last?.type===type)last.content.push({type:'listItem',content:[paragraph]});else content.push({type,content:[{type:'listItem',content:[paragraph]}]});}else content.push(paragraph);
 }
 return {type:'doc',content};
}
export function richTextPlain(value){return value.map(p=>p.runs.map(r=>r.text).join('')).join('\n');}
