import {PDFName,PDFDict,PDFArray,PDFRawStream,decodePDFRawStream} from 'pdf-lib';
import {provenUnobservedCidGlyphs} from './pdf-truetype-glyph-proof.js';
const n=PDFName.of,MAX_CMAP=1024*1024,MAX_MAP=16384;
const ascii=bytes=>{let value='';for(let index=0;index<bytes.length;index+=32768)value+=String.fromCharCode(...bytes.subarray(index,index+32768));return value;};
// Read declarative ToUnicode data only. No PostScript execution or external CMaps.
function lex(source){
  const result=[];let position=0;
  while(position<source.length){if(/[\x00\x09\x0a\x0c\x0d ]/.test(source[position])){position++;continue;}if(source[position]==='%'){while(position<source.length&&!/[\r\n]/.test(source[position]))position++;continue;}
    if(result.length>=200000)throw new Error('Font map token limit');const char=source[position];
    if(char==='<'&&source[position+1]!=='<'){const end=source.indexOf('>',position+1);if(end<0)throw new Error('Unclosed font-map string');const value=source.slice(position+1,end).replace(/[\x00\x09\x0a\x0c\x0d ]/g,'');if(!/^(?:[0-9a-f]{2})+$/i.test(value)||value.length>128)throw new Error('Unsupported font-map string');result.push({hex:value.toUpperCase()});position=end+1;continue;}
    if(char==='('){let depth=1;position++;while(position<source.length&&depth){const next=source[position++];if(next==='\\'){position++;continue;}if(next==='(')depth++;if(next===')')depth--;if(depth>32)throw new Error('Font-map literal nesting');}if(depth)throw new Error('Unclosed font-map literal');result.push('literal');continue;}
    if('[]'.includes(char)){result.push(char);position++;continue;}if(source.slice(position,position+2)==='<<'||source.slice(position,position+2)==='>>'){result.push(source.slice(position,position+2));position+=2;continue;}
    const start=position;while(position<source.length&&!/[\x00\x09\x0a\x0c\x0d ()<>\[\]%]/.test(source[position]))position++;if(position===start)throw new Error('Unsupported font-map delimiter');result.push(source.slice(start,position));
  }return result;
}
function unicode(hex){
  if(!hex||![4,8].includes(hex.length))return null;const first=parseInt(hex.slice(0,4),16);let value;
  if(hex.length===4){if(first>=0xd800&&first<=0xdfff)return null;value=String.fromCharCode(first);}else{const second=parseInt(hex.slice(4),16);if(first<0xd800||first>0xdbff||second<0xdc00||second>0xdfff)return null;value=String.fromCodePoint(0x10000+(first-0xd800)*1024+second-0xdc00);}
  return /[\x00-\x1f\x7f]/.test(value)?null:value;
}
function cmap(bytes,width){
  const tokens=lex(ascii(bytes)),map=new Map(),raw=new Map(),ranges=[];let ended=false,began=false;
  const code=value=>{if(!value?.hex||value.hex.length!==width*2)throw new Error('Variable-width font map');return parseInt(value.hex,16);};
  const put=(key,hex)=>{const old=raw.get(key);if(old!==undefined&&old!==hex)throw new Error('Conflicting glyph mapping');raw.set(key,hex);const value=unicode(hex);if(value!==null)map.set(key,value);if(raw.size>MAX_MAP)throw new Error('Font map size limit');};
  for(let index=0;index<tokens.length;index++){
    const command=tokens[index];if(command==='usecmap'||command==='begincidchar'||command==='begincidrange'||command==='beginnotdefrange'||command==='beginnotdefchar')throw new Error('Inherited or unsupported font map');
    if(command==='/WMode'&&tokens[index+1]!=='0')throw new Error('Vertical font mapping');
    if(command==='begincmap'){if(began||ended)throw new Error('Multiple font maps');began=true;}if(command==='endcmap'){if(!began)throw new Error('Invalid font map');ended=true;}
    const end={begincodespacerange:'endcodespacerange',beginbfchar:'endbfchar',beginbfrange:'endbfrange'}[command];if(!end)continue;
    if(!began||ended||!/^\d+$/.test(tokens[index-1]??''))throw new Error('Invalid mapping section');const count=Number(tokens[index-1]);if(count>MAX_MAP)throw new Error('Font map section limit');
    for(let entry=0;entry<count;entry++){
      const low=code(tokens[++index]);if(command==='beginbfchar'){const destination=tokens[++index];if(!destination?.hex)throw new Error('Invalid glyph mapping');put(low,destination.hex);continue;}
      const high=code(tokens[++index]);if(high<low)throw new Error('Invalid glyph range');if(command==='begincodespacerange'){if(ranges.length>=64)throw new Error('Font codespace limit');ranges.push([low,high]);continue;}if(high-low>=MAX_MAP)throw new Error('Glyph range size limit');
      const destination=tokens[++index];if(destination==='['){for(let key=low;key<=high;key++){const value=tokens[++index];if(!value?.hex)throw new Error('Invalid glyph-map array');put(key,value.hex);}if(tokens[++index]!==']')throw new Error('Wrong glyph-map array length');}
      else{if(!destination?.hex)throw new Error('Invalid glyph range destination');if(![4,8].includes(destination.hex.length)){for(let key=low;key<=high;key++)put(key,'unsupported:'+destination.hex+':'+(key-low));continue;}const start=parseInt(destination.hex,16),digits=destination.hex.length;for(let key=low;key<=high;key++){const value=start+key-low;if(value>0xffffffff||value.toString(16).length>digits)throw new Error('Glyph range overflow');put(key,value.toString(16).padStart(digits,'0'));}}
    }if(tokens[++index]!==end)throw new Error('Wrong font-map section length');
  }
  if(!began||!ended||!ranges.length||!map.size||[...map.keys()].some(key=>!ranges.some(([low,high])=>key>=low&&key<=high)))throw new Error('Incomplete font map');return map;
}
export function mappedOriginalFont(doc,font,budget){
  try{
    const subtype=font.lookupMaybe(n('Subtype'),PDFName)?.decodeText();let width=1,face=font;
    if(subtype==='Type0'){if(font.lookupMaybe(n('Encoding'),PDFName)?.decodeText()!=='Identity-H')return null;const descendants=font.lookupMaybe(n('DescendantFonts'),PDFArray);if(descendants?.size()!==1)return null;face=descendants.lookup(0,PDFDict);if(!['CIDFontType0','CIDFontType2'].includes(face.lookupMaybe(n('Subtype'),PDFName)?.decodeText()))return null;width=2;}
    else if(!['Type1','TrueType'].includes(subtype))return null;
    const descriptor=face.lookupMaybe(n('FontDescriptor'),PDFDict);if(!descriptor||!['FontFile','FontFile2','FontFile3'].some(key=>doc.context.lookup(descriptor.get(n(key))) instanceof PDFRawStream))return null;
    const stream=font.lookupMaybe(n('ToUnicode'),PDFRawStream);if(!stream||stream.dict.get(n('UseCMap'))||budget.bytes>=8*1024*1024||budget.fonts>=200||(budget.glyphs??0)>=65536)return null;
    const bytes=decodePDFRawStream(stream).getBytes(MAX_CMAP+1);budget.bytes+=bytes.length;budget.fonts++;if(bytes.length>MAX_CMAP||budget.bytes>8*1024*1024)return null;
    const map=cmap(bytes,width);budget.glyphs=(budget.glyphs??0)+map.size;if(budget.glyphs>65536)return null;const expansion=width===2?provenUnobservedCidGlyphs(doc,font,face,descriptor,map,budget):null;return {base:font.lookupMaybe(n('BaseFont'),PDFName)?.decodeText()??'Embedded source font',encoding:'source-unicode',width,map,observed:new Map(),identity:font,expansion};
  }catch{return null;}
}
export function decodeMappedText(bytes,font,observe=true){
  if(!bytes.length||bytes.length>4000||bytes.length%font.width)return null;let text='';const entries=[];
  for(let index=0;index<bytes.length;index+=font.width){const key=font.width===2?bytes[index]*256+bytes[index+1]:bytes[index],value=font.map.get(key);if(value===undefined)return null;text+=value;entries.push([value,key]);if(text.length>2000)return null;}
  if(observe)for(const [value,key]of entries){if(!font.observed.has(value))font.observed.set(value,new Set());font.observed.get(value).add(key);}return text;
}
export function encodeMappedText(text,font,originalBytes){
  const preferred=new Map();for(let index=0;index<originalBytes.length;index+=font.width){const code=font.width===2?originalBytes[index]*256+originalBytes[index+1]:originalBytes[index],character=font.map.get(code);if(character!==undefined&&!preferred.has(character))preferred.set(character,code);}
  let hex='';for(const character of text){const codes=font.observed.get(character)??font.expansion?.proven.get(character);if(!codes?.size)throw new Error(`The source font has no observed or independently proven existing glyph for ${JSON.stringify(character)}. Use an available source-font character, or add text with another font.`);const code=preferred.get(character)??(codes.size===1?[...codes][0]:null);if(code===null)throw new Error(`The source uses multiple glyph codes for ${JSON.stringify(character)}. Keep a glyph already present in this text run.`);hex+=code.toString(16).padStart(font.width*2,'0');}return '<'+hex.toUpperCase()+'>';
}
