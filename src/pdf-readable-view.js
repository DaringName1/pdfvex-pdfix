import './pdf-readable-view.css';
import {pdfTaggedReadable} from './pdf-readable-tags.js';
import {pdfReadableText,readableRegions} from './pdf-readable-layout.js';
export {pdfReadableText} from './pdf-readable-layout.js';
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
const KEY='pdfix.readable-view.v1',DEFAULTS={font:18,line:1.7,width:68,order:'auto',columnSplit:50};
const ORDERS=['auto','rows','table','content','two','three','two-rtl','three-rtl','vertical','left','right','regions','tagged'];
const valid=value=>value&&[14,16,18,20,24,28,32].includes(value.font)&&[1.4,1.7,2,2.3].includes(value.line)&&Number.isInteger(value.width)&&value.width>=35&&value.width<=85&&ORDERS.includes(value.order)&&(value.columnSplit===undefined||Number.isInteger(value.columnSplit)&&value.columnSplit>=20&&value.columnSplit<=80);
export class PdfReadableView{
 constructor(reader){this.reader=reader;this.regionDrafts=new Map();this.tagVersion=0;this.settings={...DEFAULTS};try{const raw=localStorage.getItem(KEY);if(raw&&raw.length<=1024){const value=JSON.parse(raw);if(valid(value))this.settings={font:value.font,line:value.line,width:value.width,order:value.order,columnSplit:value.columnSplit??50};}}catch{} }
 render(content,page,number){
  const tagVersion=++this.tagVersion;this.tagCancel?.();this.content=content;this.page=page;this.number=number;const root=this.reader.readable,s=this.settings;root.replaceChildren();root.style.setProperty('--readable-font',s.font+'px');root.style.setProperty('--readable-line',String(s.line));root.style.setProperty('--readable-width',s.width+'ch');
  if(root.hidden)return;
  const heading=el('h2',`Source page ${number} · Readable text`),controls=el('div');controls.className='pdf-readable-controls';
  const select=(label,key,options)=>{const wrapper=el('label',label),input=el('select');input.setAttribute('aria-label',label);for(const[value,text]of options){const option=el('option',text);option.value=String(value);input.append(option);}input.value=String(s[key]);input.onchange=()=>{this.settings[key]=key==='order'?input.value:Number(input.value);try{localStorage.setItem(KEY,JSON.stringify(this.settings));}catch{}this.render(this.content,this.page,this.number);const restored=root.querySelector(`[aria-label="${label}"]`);restored?.focus({preventScroll:true});};wrapper.append(input);controls.append(wrapper);};
  select('Readable type size','font',[14,16,18,20,24,28,32].map(value=>[value,value+' px']));select('Line spacing','line',[1.4,1.7,2,2.3].map(value=>[value,String(value)]));select('Text width','width',[35,45,55,68,75,85].map(value=>[value,value+' characters']));select('Reading order','order',[['tagged','Declared PDF tag order'],['regions','Reviewed region order'],['auto','Propose separated columns'],['rows','Visible rows'],['table','Table rows with gap separators'],['content','PDF content sequence'],['two','Two columns, left then right'],['two-rtl','Two columns, right then left'],['three-rtl','Three columns, right to left'],['vertical','Vertical columns, right to left'],['three','Three columns, left to right'],['left','Left half only'],['right','Right half only']]);
  if(s.order==='two'||s.order==='two-rtl')select('Column split','columnSplit',Array.from({length:13},(_,i)=>20+i*5).map(value=>[value,value+'% from left']));
  if(s.order==='regions'){
   const label=el('label','Ordered page regions (%)'),input=el('textarea');input.setAttribute('aria-label','Ordered page regions (%)');input.maxLength=2000;input.rows=4;input.value=this.regionDrafts.get(number)?.text??'0 0 100 100';label.append(input);const apply=el('button','Apply reviewed region order');apply.type='button';const status=el('p');status.setAttribute('role','status');apply.onclick=()=>{try{const boxes=readableRegions(input.value);pdfReadableText(this.content,this.page,'regions',this.settings.columnSplit,boxes);this.regionDrafts.set(number,{text:input.value,boxes});this.render(this.content,this.page,this.number);root.querySelector('[aria-label="Ordered page regions (%)"]')?.focus({preventScroll:true});}catch(error){status.textContent=error.message;}};controls.append(label,apply,el('p','One region per line: left top right bottom, measured from the artwork top-left as percentages. Lines set reading order. Review against artwork; text outside regions is omitted. Regions stay only for this PDF session.'),status);
  }
  const original=el('button','Return to page artwork');original.type='button';original.onclick=()=>{this.reader.root.querySelector('.reading-view').value='page';this.reader.changeReadingView('page').catch(error=>this.reader.announce(error.message,true));};controls.append(original);root.append(heading,controls);
  const note=el('p','Reading order is inferred from PDF text positions. Columns, tables, captions, drawings, vertical writing and missing character mappings need review against the source artwork. This view changes no PDF content and creates no OCR text.');note.className='footnote';root.append(note);
  if(!this.reader.copyAllowed){root.append(el('p','This PDF does not permit copying text. Use the page artwork view.'));return;}
  if(s.order==='tagged'){
   const message=el('p','Reading the declared page tag order…');root.append(message);let timer,cancel;const limited=promise=>Promise.race([promise,new Promise((_,reject)=>{cancel=()=>reject(new Error('Declared tag reading canceled.'));this.tagCancel=cancel;timer=setTimeout(()=>reject(new Error('Declared tag reading exceeded its 20-second boundary.')),20000);})]);
   limited(Promise.all([page.getTextContent({includeMarkedContent:true}),page.getStructTree()])).then(([marked,tree])=>{if(tagVersion!==this.tagVersion||this.reader.disposed||this.reader.readable.hidden)return;const result=pdfTaggedReadable(marked,tree,content);message.remove();note.textContent=result.method+'. '+note.textContent;if(!result.output.length)root.append(el('p','No page text maps to usable tags. Choose another reading order.'));this.appendParagraphs(root,result);}).catch(error=>{if(tagVersion===this.tagVersion&&!this.reader.disposed)message.textContent=error.message;}).finally(()=>{clearTimeout(timer);if(this.tagCancel===cancel)this.tagCancel=null;});return;
  }
  let output,method,sourceRuns,sourceFragments;try{({output,method,sourceRuns,sourceFragments}=pdfReadableText(content,page,s.order,s.columnSplit,this.regionDrafts.get(number)?.boxes??[[0,0,100,100]]));}catch(error){root.append(el('p',error.message));return;}
  note.textContent=method+'. '+note.textContent;
  if(!output.length)root.append(el('p','No readable text was found for this page/region. Use artwork view, or choose an available OCR language for a scan.'));
  this.appendParagraphs(root,{output,sourceRuns,sourceFragments});
 }
 appendParagraphs(root,{output,sourceRuns,sourceFragments}){const s=this.settings;
  for(let index=0;index<output.length;index++){const paragraph=el('p',output[index]);paragraph.dir='auto';if(s.order==='table'||s.order==='regions')paragraph.className='pdf-readable-table-row';paragraph.pdfSourceRuns=new Set(sourceRuns[index]);paragraph.pdfSourceFragments=sourceFragments[index];root.append(paragraph);}
  this.reader.find?.highlight();
 }
 resetPage(){this.tagVersion++;this.tagCancel?.();this.tagCancel=null;this.content=null;this.page=null;}
 dispose(){this.resetPage();this.regionDrafts.clear();}
}

