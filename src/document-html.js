import LIMITS from '../desktop/document-limits.cjs';
import {validateDocumentImage} from './document-image-model.js';
import DOMPurify from 'dompurify';
import {tableGeometry} from './document-table-model.js';
import {validLinkTarget} from './document-link-model.js';
const tags=['p','h1','h2','h3','h4','h5','h6','strong','b','em','i','u','s','sup','sub','mark','ul','ol','li','br','blockquote','pre','code','hr','span','table','tbody','thead','tfoot','tr','td','th','img','a'];
const attrs=['data-pdfix-page-break','data-pdfix-text-style','data-pdfix-font','data-pdfix-size','data-pdfix-color','data-pdfix-align','colspan','rowspan','data-pdfix-cell-color','src','alt','width','height','data-pdfix-image','data-pdfix-image-width','data-pdfix-image-height','data-pdfix-column-grid','href','data-pdfix-indent','data-pdfix-line','data-pdfix-space-before','data-pdfix-space-after','data-pdfix-first-line','data-pdfix-highlight','data-pdfix-right-indent','data-pdfix-anchor'];
// The strict URI pattern is for src only. Without this list the sanitizer also tests every other attribute value
// against it and silently drops spans, sizes, colors, alignment and image geometry. Those values are validated
// below and by the editor schema.
const plainAttrs=attrs.filter(name=>!['src','href'].includes(name));
export function sanitizeDocumentHTML(html){
 if(typeof html!=='string'||html.length>LIMITS.HTML_BYTES)throw new Error('The imported or pasted document is larger than PDFix can edit.');
 const clean=DOMPurify.sanitize(html,{ALLOWED_TAGS:tags,ALLOWED_ATTR:attrs,ALLOW_DATA_ATTR:false,ALLOWED_URI_REGEXP:/^(?:#[A-Za-z_][A-Za-z0-9_.-]{0,39}$|data:image\/(?:png|jpeg);base64,|https?:\/\/|mailto:)/i,ADD_URI_SAFE_ATTR:plainAttrs}),parsed=new DOMParser().parseFromString(clean,'text/html'),tables=[...parsed.querySelectorAll('table')];
 if(tables.length>50)throw new Error('Use up to 50 tables in a document.');let slots=0;
 for(const table of tables){if(table.parentElement?.closest('table'))throw new Error('Nested tables are not supported yet. Open the source in Word and simplify the nested table before importing it.');
  const rows=[...table.querySelectorAll('tr')];let widths=null;if(table.hasAttribute('data-pdfix-column-grid'))try{widths=JSON.parse(table.getAttribute('data-pdfix-column-grid'));}catch{throw new Error('Pasted table column widths are invalid.');}const model={type:'table',attrs:{columnGridTwips:widths},content:rows.map(row=>({type:'tableRow',content:[...row.children].filter(cell=>['TD','TH'].includes(cell.tagName)).map(cell=>({type:cell.tagName==='TH'?'tableHeader':'tableCell',attrs:{colspan:cell.hasAttribute('colspan')?Number(cell.getAttribute('colspan')):1,rowspan:cell.hasAttribute('rowspan')?Number(cell.getAttribute('rowspan')):1},content:[{type:'paragraph'}]}))}))};
  const geometry=tableGeometry(model);slots+=geometry.width*geometry.height;if(slots>LIMITS.TABLE_TOTAL_CELLS)throw new Error('The document exceeds 200,000 table grid cells.');
 }
 // Only validated web/email targets and links to a heading anchor stay links; scripts and anything else keep their text only.
 for(const link of parsed.querySelectorAll('a')){let href;try{href=validLinkTarget(link.getAttribute('href'));}catch{link.replaceWith(...link.childNodes);continue;}for(const attribute of [...link.attributes])link.removeAttribute(attribute.name);link.setAttribute('href',href);}
 for(const image of parsed.querySelectorAll('img')){try{if(image.closest('pre,code')||image.getAttribute('data-pdfix-image')!=='true')throw new Error('Use Insert picture for this image.');validateDocumentImage({src:image.getAttribute('src'),alt:image.getAttribute('alt')??'',width:Number(image.getAttribute('width')),height:Number(image.getAttribute('height')),pixelWidth:Number(image.getAttribute('data-pdfix-image-width')),pixelHeight:Number(image.getAttribute('data-pdfix-image-height'))});}catch{image.replaceWith(parsed.createTextNode('[Image omitted: use Insert picture]'));}}
 return parsed.body.innerHTML;
}
