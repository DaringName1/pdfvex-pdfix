import {LINE_SPACINGS,MAX_INDENT} from './document-paragraph-model.js';
import {highlightFromHex} from './document-mark-model.js';
// Pasted HTML from Word, browsers and web editors carries its formatting as inline styles, which the sanitizer
// removes. This inert pre-pass rewrites the supported part of those styles into the editor's own markers
// (font family, size, color, bold/italic/underline/strike, alignment, indent, line spacing) and rebuilds Word's
// paragraph-based lists as real lists. It only adds markers; sanitizeDocumentHTML still decides what is allowed.
import LIMITS from '../desktop/document-limits.cjs';
const ALIGN=['left','center','right','justify'];
function color(value){
 const text=(value||'').trim().toLowerCase();let match=/^#([0-9a-f]{3})$/.exec(text);if(match)return '#'+[...match[1]].map(c=>c+c).join('');if(/^#[0-9a-f]{6}$/.test(text))return text;
 match=/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(text);if(!match||match.slice(1,4).some(part=>Number(part)>255)||match[4]!==undefined&&Number(match[4])===0)return null;
 return '#'+match.slice(1,4).map(part=>Number(part).toString(16).padStart(2,'0')).join('');
}
function family(value){
 const names=(value||'').toLowerCase().split(',').map(name=>name.replace(/["']/g,'').trim()).filter(Boolean);if(!names.length)return null;const first=names[0],generic=names.at(-1);
 if(/courier|consolas|mono|menlo|monaco/.test(first)||generic==='monospace')return 'mono';
 if(/times|georgia|cambria|garamond|palatino|antiqua|century/.test(first)||generic==='serif')return 'serif';
 if(/arial|calibri|helvetica|segoe|verdana|tahoma|aptos|roboto/.test(first)||generic==='sans-serif')return 'sans';return null;
}
function points(value){const match=/^(-?[\d.]+)(pt|px|in|cm|mm)$/.exec((value||'').trim().toLowerCase());if(!match)return null;const size=Number(match[1])*{pt:1,px:.75,in:72,cm:28.3465,mm:2.83465}[match[2]];return Number.isFinite(size)?size:null;}
function textSize(value){const size=points(value);if(size===null)return null;const rounded=Math.round(size*2)/2;return rounded>=8&&rounded<=72?rounded:null;}
function inlineStyles(root){
 // Some web editors wrap everything in <b style="font-weight:normal">; that wrapper is not bold.
 for(const element of root.querySelectorAll('b,strong,i,em')){const bold=['B','STRONG'].includes(element.tagName);if(bold?/^(normal|[1-4]00)$/.test(element.style.fontWeight):element.style.fontStyle==='normal')element.replaceWith(...element.childNodes);}
 const computed=new WeakMap();
 for(const element of root.querySelectorAll('span,font')){
  const style=element.style,inherited=computed.get(element.parentElement?.closest('span,font'))??{};
  const own={font:family(style.fontFamily||element.getAttribute('face')),size:textSize(style.fontSize),color:color(style.color||element.getAttribute('color'))};if(own.color==='#000000')own.color=null;
  const value={font:own.font??inherited.font??null,size:own.size??inherited.size??null,color:own.color??inherited.color??null};computed.set(element,value);
  const wraps=[];if(/^(bold|[6-9]00)$/.test(style.fontWeight))wraps.push('strong');if(style.fontStyle==='italic')wraps.push('em');const decoration=style.textDecorationLine||style.textDecoration||'';if(/underline/.test(decoration))wraps.push('u');if(/line-through/.test(decoration))wraps.push('s');
  for(const tag of wraps){const wrapper=root.ownerDocument.createElement(tag);wrapper.append(...element.childNodes);element.append(wrapper);}
  if(!value.font&&!value.size&&!value.color)continue;
  // Only the innermost styled element carries the marker, so nested Word spans combine instead of overriding each other.
  let target=element;if(element.tagName==='FONT'){target=root.ownerDocument.createElement('span');target.append(...element.childNodes);element.replaceWith(target);computed.set(target,value);}
  target.setAttribute('data-pdfix-text-style','true');for(const [name,item] of [['font',value.font],['size',value.size],['color',value.color]])if(item)target.setAttribute('data-pdfix-'+name,String(item));else target.removeAttribute('data-pdfix-'+name);
 }
}
function blockStyles(root){
 for(const element of root.querySelectorAll('p,h1,h2,h3,h4,h5,h6')){
  const style=element.style,align=(style.textAlign||element.getAttribute('align')||'').toLowerCase();if(ALIGN.includes(align)&&align!=='left')element.setAttribute('data-pdfix-align',align);
  if(element.closest('li,td,th')===null&&!/mso-list/i.test(element.getAttribute('style')??'')){
   // A half-inch first-line offset becomes a first-line or hanging indent; a hang's extra left half inch is not paragraph indent.
   const first=points(style.textIndent),near=(value,target)=>value!==null&&Math.abs(value-target)<=6;let left=points(style.marginLeft);
   if(near(first,36))element.setAttribute('data-pdfix-first-line','first');else if(near(first,-36)&&left!==null&&left>=30){element.setAttribute('data-pdfix-first-line','hanging');left-=36;}
   const steps=left===null?0:Math.round(left/36);if(steps>=1&&steps<=MAX_INDENT&&Math.abs(left-steps*36)<=6)element.setAttribute('data-pdfix-indent',String(steps));
   const right=points(style.marginRight),rightSteps=right===null?0:Math.round(right/36);if(rightSteps>=1&&rightSteps<=4&&Math.abs(right-rightSteps*36)<=6)element.setAttribute('data-pdfix-right-indent',String(rightSteps));}
  const line=style.lineHeight,multiple=/^[\d.]+$/.test(line)?Number(line):/^[\d.]+%$/.test(line)?Number(line.slice(0,-1))/100:null,spacing=multiple===null?null:LINE_SPACINGS.find(item=>Math.abs(item-multiple)<=.03);if(spacing)element.setAttribute('data-pdfix-line',String(spacing));
 }
}
// Word writes each list item as a paragraph with an "mso-list" style and a hidden marker. Consecutive ones become one list.
// Superscript/subscript written as vertical-align, and highlights in one of the editor's colors (Word writes
// "mso-highlight", browsers a background color). Other background colors are dropped as before.
const HIGHLIGHT_NAMES={yellow:'yellow',lime:'green',brightgreen:'green',aqua:'turquoise',cyan:'turquoise',turquoise:'turquoise',fuchsia:'pink',magenta:'pink',pink:'pink'};
function scriptAndHighlight(root){
 for(const element of [...root.querySelectorAll('[style]')]){
  const raw=element.getAttribute('style')??'',align=element.style.verticalAlign;
  const named=/mso-highlight\s*:\s*([a-z]+)/i.exec(raw)?.[1]?.toLowerCase(),background=(element.style.backgroundColor||'').toLowerCase(),highlight=named?HIGHLIGHT_NAMES[named]??null:HIGHLIGHT_NAMES[background]??highlightFromHex(color(background));
  if(align==='super'||align==='sub'){const wrap=root.ownerDocument.createElement(align==='super'?'sup':'sub');wrap.append(...element.childNodes);element.append(wrap);}
  if(highlight&&!element.matches('p,h1,h2,h3,h4,h5,h6,li,td,th,table,tr,body,div')){// Its own inner span: the editor reads one mark per element, and this one may already carry font or color.
   const span=root.ownerDocument.createElement('span');span.setAttribute('data-pdfix-highlight',highlight);span.append(...element.childNodes);element.append(span);}
 }
}
function wordLists(root){
 const document=root.ownerDocument,isItem=node=>node?.nodeType===1&&node.tagName==='P'&&/mso-list\s*:\s*l\d+/i.test(node.getAttribute('style')??'');
 const next=node=>{let sibling=node.nextSibling;while(sibling&&(sibling.nodeType===8||sibling.nodeType===3&&!sibling.data.trim()))sibling=sibling.nextSibling;return sibling;};
 for(const first of [...root.querySelectorAll('p')].filter(node=>isItem(node))){
  if(!first.isConnected||!isItem(first))continue;const items=[];for(let node=first;isItem(node);node=next(node))items.push(node);
  const stack=[],top=()=>stack.at(-1);let rootList=null;
  for(const item of items){
   const level=Math.max(1,Math.min(9,Number(/level(\d+)/i.exec(item.getAttribute('style'))?.[1]??1)));let marker='';
   const ignored=[...item.querySelectorAll('*')].find(node=>/mso-list\s*:\s*ignore/i.test(node.getAttribute('style')??''));
   if(ignored){marker=ignored.textContent;(ignored.parentElement!==item&&ignored.parentElement.textContent===ignored.textContent?ignored.parentElement:ignored).remove();}
   else{const children=[...item.childNodes],start=children.findIndex(node=>node.nodeType===8&&/supportLists/i.test(node.data)),end=children.findIndex((node,index)=>index>start&&node.nodeType===8&&/endif/i.test(node.data));if(start>=0&&end>start)for(const node of children.slice(start,end+1)){if(node.nodeType!==8)marker+=node.textContent;node.remove();}}
   const ordered=/^\(?[0-9a-z]{1,4}[.)]$/i.test(marker.replace(/\s+/g,''))?'OL':'UL';
   while(stack.length&&(top().level>level||top().level===level&&top().list.tagName!==ordered))stack.pop();
   if(!stack.length||top().level<level){const list=document.createElement(ordered);if(stack.length&&top().last)top().last.append(list);else if(!rootList){rootList=list;first.before(list);}else{rootList.after(list);rootList=list;}stack.push({list,level,last:null});}
   const entry=document.createElement('li'),body=document.createElement('p');for(const name of ['data-pdfix-align'])if(item.hasAttribute(name))body.setAttribute(name,item.getAttribute(name));body.append(...item.childNodes);entry.append(body);top().list.append(entry);top().last=entry;item.remove();
  }
 }
}
export function normalizePastedHTML(html){
 if(typeof html!=='string'||html.length>LIMITS.HTML_BYTES||!/style\s*=|<font\b|\balign\s*=/i.test(html))return html;
 const parsed=new DOMParser().parseFromString(html,'text/html');
 // Order matters: styles are read while Word's list paragraphs still carry them, then the lists are rebuilt.
 inlineStyles(parsed.body);blockStyles(parsed.body);scriptAndHighlight(parsed.body);wordLists(parsed.body);
 return parsed.body.innerHTML;
}
