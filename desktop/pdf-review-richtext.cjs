'use strict';
const {DOMParser,XMLSerializer}=require('@xmldom/xmldom');
const {richTextParagraph}=require('./pdf-review-rich-runs.cjs');
const {PDFString,PDFHexString,PDFDict,PDFName,PDFNumber,StandardFonts}=require('pdf-lib');
const {createHash}=require('node:crypto');
const fail=message=>{throw new Error('Rich comment: '+message);};
const hash=value=>createHash('sha256').update(value).digest('hex');
const same=(a,b)=>Math.abs(a-b)<.00001;
function uniformRichText(xml,plain,style){
 if(typeof xml!=='string'||xml.length>65536||Buffer.byteLength(xml,'utf8')>131072||/<!DOCTYPE|<!ENTITY|<!\[CDATA\[/i.test(xml))fail('only bounded inert XML without declarations or entities is supported.');
 const content=xml.trim().replace(/^<\?xml\s[^?]*\?>\s*/, '');if(!/^<body(?:\s|>)/.test(content)||!content.endsWith('</body>')||content.includes('<?'))fail('only one rich body without surrounding content is supported.');
 let invalid=false;const doc=new DOMParser({errorHandler:()=>{invalid=true;}}).parseFromString(xml,'application/xml');
 if(invalid||!doc.documentElement||Array.from(doc.childNodes).some(n=>n.nodeType===3&&n.data.trim()||n.nodeType===1&&n!==doc.documentElement))fail('the rich text is malformed.');
 let count=0;const pending=[[doc,0]];
 while(pending.length){const [node,depth]=pending.pop();if(++count>40||depth>8)fail('this rich layout exceeds the supported structure.');if(node.nodeType===7&&(node.nodeName!=='xml'||node.parentNode!==doc)||![1,3,7,9].includes(node.nodeType))fail('this rich layout contains unsupported content.');for(let n=node.lastChild;n;n=n.previousSibling)pending.push([n,depth+1]);}
 const family=style.base.startsWith('Helvetica')?'Helvetica':style.base.startsWith('Times')?'Times':style.base.startsWith('Courier')?'Courier':null;
 if(!family||!Number.isFinite(style.size)||style.size<1||style.size>144||!Array.isArray(style.color)||![1,3].includes(style.color.length)||!style.color.every(n=>Number.isFinite(n)&&n>=0&&n<=1)||![0,1,2].includes(style.alignment))fail('the declared style is unsupported.');
 const rgb=style.color.length===1?Array(3).fill(style.color[0]):style.color,bold=/Bold/.test(style.base),italic=/Italic|Oblique/.test(style.base);
 const checkStyles=text=>{
  if(text.length>1024)fail('the style is too long.');const seen=new Set();
  for(const item of text.split(';').map(v=>v.trim()).filter(Boolean)){
   const index=item.indexOf(':'),key=item.slice(0,index).trim().toLowerCase(),value=item.slice(index+1).trim();
   if(index<1||seen.has(key)||seen.size>=12)fail('the style is ambiguous.');seen.add(key);
   if(key==='font-family'){
    const name=value.replace(/^(['"])(.*)\1$/,'$2'),aliases={Helvetica:'Helvetica',Arial:'Helvetica','Times-Roman':'Times','Times New Roman':'Times',Times:'Times',Courier:'Courier','Courier New':'Courier'};
    if(aliases[name]!==family)fail('rich and declared font families differ.');
   }else if(key==='font-size'){const m=/^(\d+(?:\.\d+)?)pt$/.exec(value);if(!m||!same(Number(m[1]),style.size))fail('rich and declared font sizes differ.');}
   else if(key==='font-weight'){if(!(bold?['bold','700']:['normal','400']).includes(value))fail('rich and declared font weights differ.');}
   else if(key==='font-style'){if(!(italic?['italic','oblique']:['normal']).includes(value))fail('rich and declared font styles differ.');}
   else if(key==='text-align'){if(value!==['left','center','right'][style.alignment])fail('rich and declared alignments differ.');}
   else if(key==='text-decoration'){if(value!=='none')fail('text decoration needs another appearance adapter.');}
   else if(key==='color'){
    const m=/^#([a-f\d]{6}|[a-f\d]{3})$/i.exec(value);if(!m)fail('this rich color is unsupported.');const hex=m[1].length===3?[...m[1]].map(c=>c+c).join(''):m[1];
    if([0,2,4].some((n,i)=>!same(parseInt(hex.slice(n,n+2),16)/255,rgb[i])))fail('rich and declared colors differ.');
   }else fail('unsupported rich style '+key+'.');
  }
 };
 const root=doc.documentElement;if(root.nodeName!=='body'||root.namespaceURI&&!['http://www.w3.org/1999/xhtml'].includes(root.namespaceURI))fail('the rich root must be an XHTML body.');
 let leaf=root,expected='p',depth=0;
 while(true){
  if(++depth>4)fail('this rich layout has too many nested spans.');
  for(let i=0;i<leaf.attributes.length;i++){
   const attr=leaf.attributes.item(i);
   if(attr.name==='style')checkStyles(attr.value);
   else if(leaf===root&&attr.name==='xmlns'&&attr.value==='http://www.w3.org/1999/xhtml'){}
   else if(leaf===root&&attr.name==='xmlns:xfa'&&attr.value==='http://www.xfa.org/schema/xfa-data/1.0/'){}
   else if(leaf===root&&['xfa:spec','xfa:APIVersion'].includes(attr.name)&&/^[A-Za-z\d:.\-]{1,80}$/.test(attr.value)){}
   else fail('unsupported rich attribute '+attr.name+'.');
  }
  const children=Array.from(leaf.childNodes),elements=children.filter(n=>n.nodeType===1);
  if(!elements.length){if(leaf===root)fail('the rich body needs one paragraph.');break;}
  if(elements.length!==1||elements[0].nodeName!==expected||elements[0].namespaceURI!==root.namespaceURI||children.some(n=>n.nodeType!==1&&n.nodeType!==3||n.nodeType===3&&n.data.trim()))fail('only one uniformly styled paragraph is supported.');
  leaf=elements[0];expected='span';
 }
 const original=leaf.textContent;
 if(typeof plain!=='string'||plain.length>16384||original!==plain||/[\r\n\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(original))fail('plain and rich comment text must match one paragraph exactly.');
 const serializer=new XMLSerializer(),serialize=text=>{while(leaf.firstChild)leaf.removeChild(leaf.firstChild);leaf.appendChild(doc.createTextNode(text));return serializer.serializeToString(doc);};
 const styleSeal=hash(serialize(''));serialize(original);
 return {styleSeal,replace(text){if(typeof text!=='string'||text.length>16384||/[\r\n\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))fail('replacement text must be one bounded paragraph.');const output=serialize(text);if(output.length>65536||Buffer.byteLength(output,'utf8')>131072)fail('the replacement rich text exceeds its limit.');return output;}};
}
// Inventory eligibility is advisory; the writer revalidates the same source.
function inspectUniformRichText(dict,g,plain,{runs=false}={}){
 const rc=g.get(dict,'RC'),da=g.get(dict,'DA');if(!(rc instanceof PDFString||rc instanceof PDFHexString)||!(da instanceof PDFString||da instanceof PDFHexString)||dict.has(PDFName.of('DS'))||da.decodeText().length>512)fail('unsupported rich source or default style.');
 const m=/^\s*\/([A-Za-z\d_.+\-]{1,64})\s+(\d+(?:\.\d+)?)\s+Tf\s+((?:\d+(?:\.\d+)?\s+){1,3})(g|rg)\s*$/.exec(da.decodeText());if(!m)fail('a simple declared font and color are required.');
 const ap=g.get(dict,'AP'),normal=ap instanceof PDFDict?g.get(ap,'N'):null,resources=normal?.dict&&g.get(normal.dict,'Resources'),fonts=resources instanceof PDFDict?g.get(resources,'Font'):null,font=fonts instanceof PDFDict?g.get(fonts,m[1]):null;
 const base=font instanceof PDFDict?g.name(g.get(font,'BaseFont')):'',q=g.get(dict,'Q');
 if(!Object.values(StandardFonts).includes(base)||g.name(g.get(font,'Subtype'))!=='Type1')fail('the rich source font is unsupported.');
 if(q!==undefined&&!(q instanceof PDFNumber))fail('the rich alignment is invalid.');
 const color=m[3].trim().split(/\s+/).map(Number);if(color.length!==(m[4]==='g'?1:3)||color.some(n=>n<0||n>1))fail('the declared rich color is unsupported.');
 return (runs?richTextParagraph:uniformRichText)(rc.decodeText(),plain,{base,size:Number(m[2]),color,alignment:q?.asNumber()||0});
}
module.exports={uniformRichText,inspectUniformRichText};
