import {DocumentTextStyle} from './document-formatting.js';
import {DocumentParagraphFormat} from './document-paragraph.js';

// The PDF viewport uses one CSS pixel per PDF point before its zoom transform.
// Word's CSS points/inches would otherwise enlarge typed text and indents by 4/3.
export function pdfPointStyles(style){
 return style.replace(/(-?(?:\d+\.?\d*|\.\d+))(pt|in)\b/g,(_,value,unit)=>String(Number(value)*(unit==='in'?72:1))+'px');
}
export const PdfHomeTextStyle=DocumentTextStyle.extend({
 renderHTML(context){const dom=this.parent(context),attrs=dom[1];if(attrs?.style)attrs.style=pdfPointStyles(attrs.style).replace('Consolas, monospace','"Courier New", monospace');return dom;}
});
export const PdfHomeParagraphFormat=DocumentParagraphFormat.extend({
 addGlobalAttributes(){return this.parent().map(group=>({...group,attributes:Object.fromEntries(Object.entries(group.attributes).map(([name,attribute])=>[name,{...attribute,...(attribute.renderHTML?{renderHTML:attrs=>{const rendered=attribute.renderHTML(attrs);return rendered.style?{...rendered,style:pdfPointStyles(rendered.style)}:rendered;}}:{})}]))}));}
});
