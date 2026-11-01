import {parseCsv,parseMarkdown} from './source-preview-codec.js';
import {validDocumentLink,documentLinkFromInput} from './document-link-model.js';
// Converts Markdown and CSV source text into the editor's own document model, so a source file can be exported
// as a formatted PDF or DOCX, or opened for rich editing. It uses the same bounded parser as the source preview.
// Supported Markdown: headings, paragraphs, bold, italic, strikethrough, inline code, web and email links,
// bulleted, numbered and task lists (nested), quotes, fenced code, rules and pipe tables. Raw HTML stays literal
// text. Images become pictures when the caller has prepared them (see markdownImageTargets); otherwise, and for web
// addresses, which are never fetched, they stay a text label.
const MAX_ROWS=100,MAX_COLUMNS=32;
const text=(value,marks=[])=>value?[{type:'text',text:value,...(marks.length?{marks}:{})}]:[];
// The image targets in a Markdown source, in order, for the caller to prepare (at most 20, each once).
export function markdownImageTargets(source){const targets=[];for(const match of String(source).matchAll(/!\[[^\]\n]{0,1000}\]\((data:image\/[^)\n\s]{1,700000}|[^)\n]{1,2000})\)/g)){const target=match[1].trim().split(/\s+/)[0];if(target&&!targets.includes(target))targets.push(target);if(targets.length>=20)break;}return targets;}
function inline(source,context={}){
 const pattern=/(<br\s*\/?>|<(b|strong|i|em|u|s|del|strike|sup|sub|mark)>([^<\n]{1,2000})<\/\2>|`[^`\n]{1,2000}`|\*\*[^*\n]{1,2000}\*\*|__[^_\n]{1,2000}__|~~[^~\n]{1,2000}~~|\*[^*\n]{1,2000}\*|\b_[^_\n]{1,2000}_\b|!\[[^\]\n]{0,1000}\]\(data:image\/[^)\n\s]{1,700000}\)|!?\[[^\]\n]{0,1000}\]\([^)\n]{1,2000}\))/g,result=[];let at=0,count=0;
 const push=nodes=>{for(const node of nodes){const last=result.at(-1);if(last?.type==='text'&&node.type==='text'&&JSON.stringify(last.marks??[])===JSON.stringify(node.marks??[]))last.text+=node.text;else result.push(node);}};
 for(const match of source.matchAll(pattern)){
  if(++count>2000)break;push(text(source.slice(at,match.index)));const value=match[0];
  if(/^<br/i.test(value)){result.push({type:'hardBreak'});context.html=(context.html??0)+1;}
  else if(value[0]==='<'){const tag=match[2].toLowerCase(),mark={b:'bold',strong:'bold',i:'italic',em:'italic',u:'underline',s:'strike',del:'strike',strike:'strike',sup:'superscript',sub:'subscript'}[tag];push(text(match[3],tag==='mark'?[{type:'highlight',attrs:{color:'yellow'}}]:[{type:mark}]));context.html=(context.html??0)+1;}
  else if(value[0]==='`')push(text(value.slice(1,-1),[{type:'code'}]));
  else if(value.startsWith('**')||value.startsWith('__'))push(text(value.slice(2,-2),[{type:'bold'}]));
  else if(value.startsWith('~~'))push(text(value.slice(2,-2),[{type:'strike'}]));
  else if(value[0]==='*'||value[0]==='_')push(text(value.slice(1,-1),[{type:'italic'}]));
  else{
   const parts=/^(!?)\[([^\]]*)\]\(([^)]*)\)$/.exec(value),target=parts[3].trim().split(/\s+/)[0];
   if(parts[1]){const attrs=context.images?.get(target);if(attrs){push([{type:'documentImage',attrs:{...attrs,alt:(parts[2]||attrs.alt||'').slice(0,500)}}]);context.placed=(context.placed??0)+1;}else{push(text('[Image: '+(parts[2]||'unlabelled')+']'));context.labelled=(context.labelled??0)+1;}}
   else{let href=null;try{href=/^[a-z][a-z0-9+.-]*:/i.test(target)?validDocumentLink(target):documentLinkFromInput(target);}catch{}push(href?text(parts[2]||target,[{type:'documentLink',attrs:{href}}]):text((parts[2]?parts[2]+' ':'')+'('+target+')'));}
  }
  at=match.index+value.length;
 }
 push(text(source.slice(at)));return result;
}
// Line breaks inside a Markdown paragraph are soft: they become spaces.
const paragraph=(source,context)=>{const content=inline(source.replace(/\s*\n\s*/g,' ').trim(),context);return {type:'paragraph',...(content.length?{content}:{})};};
function table(rows,context){
 const width=Math.min(MAX_COLUMNS,rows.reduce((max,row)=>Math.max(max,row.length),1)),kept=rows.slice(0,MAX_ROWS);
 const node={type:'table',attrs:{columnGridTwips:null},content:kept.map((row,index)=>({type:'tableRow',content:Array.from({length:width},(_,column)=>({type:index?'tableCell':'tableHeader',attrs:{colspan:1,rowspan:1,colwidth:null,background:null},content:[paragraph(row[column]??'',context)]}))}))};
 const notes=[];if(rows.length>MAX_ROWS)notes.push(`A table kept its first ${MAX_ROWS} of ${rows.length} rows.`);if(rows.some(row=>row.length>MAX_COLUMNS))notes.push(`A table kept its first ${MAX_COLUMNS} columns.`);
 return {node,notes};
}
// Consecutive list items become nested lists by their indent depth.
function lists(items,context){
 const root=[],stack=[];
 for(const item of items){
  const type=item.ordered?'orderedList':'bulletList',depth=Math.max(0,Math.min(item.depth,stack.length));
  stack.length=Math.min(stack.length,depth+1);
  if(stack[depth]&&stack[depth].list.type!==type)stack.length=depth;
  if(!stack[depth]){const list={type,content:[]};if(depth===0)root.push(list);else stack[depth-1].last.content.push(list);stack[depth]={list,last:null};}
  const label=item.task===null?'':item.task?'☑ ':'☐ ',body=paragraph(label+item.text,context),entry={type:'listItem',content:[body]};stack[depth].list.content.push(entry);stack[depth].last=entry;
 }
 return root;
}
// images: a Map from image target to prepared picture attributes; pictures not in it stay text labels.
export function markdownDocument(source,{images}={}){
 const blocks=parseMarkdown(source).blocks,content=[],notes=new Set(),context={images,placed:0,labelled:0};
 for(let index=0;index<blocks.length;index++){
  const block=blocks[index];
  if(/^h[1-6]$/.test(block.type)){const level=Number(block.type[1]),body=inline(block.text.trim(),context);content.push({type:'heading',attrs:{level},...(body.length?{content:body}:{})});}
  else if(block.type==='p')content.push(paragraph(block.text,context));
  else if(block.type==='pre')content.push({type:'codeBlock',...(block.text?{content:[{type:'text',text:block.text}]}:{})});
  else if(block.type==='hr')content.push({type:'horizontalRule'});
  else if(block.type==='quote'){const lines=[block.text];while(blocks[index+1]?.type==='quote')lines.push(blocks[++index].text);content.push({type:'blockquote',content:lines.join('\n').split(/\n\s*\n/).map(text=>paragraph(text,context))});}
  else if(block.type==='item'){const items=[block];while(blocks[index+1]?.type==='item')items.push(blocks[++index]);content.push(...lists(items,context));}
  else if(block.type==='table'){const result=table(block.rows,context);content.push(result.node);for(const note of result.notes)notes.add(note);}
 }
 if(!content.length)content.push({type:'paragraph'});
 if(context.html)notes.add('Inline HTML formatting (bold, italic, underline, strikethrough, superscript, subscript, highlight and line breaks) was applied.');if(/<(?!br\s*\/?>|\/?(?:b|strong|i|em|u|s|del|strike|sup|sub|mark)>)[a-z\/][^>]*>/i.test(source))notes.add('Other HTML in the Markdown source was kept as literal text.');if(context.labelled)notes.add(context.labelled+(context.labelled===1?' image stayed a text label':' images stayed text labels')+': web addresses are not fetched, and pictures must be PNG or JPEG files in the Markdown file\'s folder (or embedded), up to 5 MB each.');
 return {doc:{type:'doc',content},notes:[...notes]};
}
export function csvDocument(source,delimiter=','){
 const parsed=parseCsv(source,delimiter),rows=parsed.rows.filter(row=>row.some(cell=>cell.trim()));if(!rows.length)return {doc:{type:'doc',content:[{type:'paragraph'}]},notes:['The CSV source has no rows.']};
 const pieces=[],notes=new Set();
 // Long sheets are split into consecutive tables of 100 rows, each repeating the heading row.
 for(let start=1;start<Math.max(2,rows.length)&&pieces.length<50;start+=MAX_ROWS-1){const result=table([rows[0],...rows.slice(start,start+MAX_ROWS-1)]);pieces.push(result.node);for(const note of result.notes)if(!/rows/.test(note))notes.add(note);}
 if(rows.length-1>50*(MAX_ROWS-1))notes.add('Only the first 4,950 data rows were converted.');if(pieces.length>1)notes.add(`The sheet was split into ${pieces.length} tables of up to ${MAX_ROWS-1} rows, each with the heading row.`);
 return {doc:{type:'doc',content:pieces.flatMap((piece,index)=>index?[{type:'paragraph'},piece]:[piece])},notes:[...notes]};
}
export const formattedSourceKind=ext=>['md','markdown'].includes(ext)?'markdown':ext==='csv'?'csv':null;
export function formattedSourceDocument(ext,source,delimiter=',',options={}){const kind=formattedSourceKind(ext);if(!kind)throw new Error('This source format has no formatted conversion.');return kind==='markdown'?markdownDocument(source,options):csvDocument(source,delimiter);}
