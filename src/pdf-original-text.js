import {PDFName,PDFDict,PDFArray,PDFRawStream,PDFRef,decodePDFRawStream} from 'pdf-lib';
import {mappedOriginalFont,decodeMappedText,encodeMappedText} from './pdf-original-font-map.js';
import {imageDigest,supportedForm,replaceFormProgram,resolveImagePath} from './pdf-original-image-path.js';
const n=PDFName.of,STREAM_LIMIT=8*1024*1024,TOTAL_LIMIT=64*1024*1024;
const standard=new Set(['Helvetica','Helvetica-Bold','Helvetica-Oblique','Helvetica-BoldOblique','Times-Roman','Times-Bold','Times-Italic','Times-BoldItalic','Courier','Courier-Bold','Courier-Oblique','Courier-BoldOblique']);
const space=character=>/[\x00\x09\x0a\x0c\x0d ]/.test(character);
const ascii=bytes=>{let value='';for(let index=0;index<bytes.length;index+=32768)value+=String.fromCharCode(...bytes.subarray(index,index+32768));return value;};
function tokens(source){
  let position=0,count=0;
  const read=depth=>{
    if(depth>32||++count>100000)throw new Error('Content syntax limit');
    while(position<source.length){if(space(source[position])){position++;continue;}if(source[position]==='%'){while(position<source.length&&!/[\r\n]/.test(source[position]))position++;continue;}break;}
    if(position>=source.length)return null;const start=position,character=source[position++];
    if(character==='('){const bytes=[];let nesting=1;while(position<source.length&&nesting){let c=source[position++];if(c==='\\'){if(position>=source.length)throw new Error('Unclosed escape');c=source[position++];if(c==='\r'||c==='\n'){if(c==='\r'&&source[position]==='\n')position++;continue;}if(/[0-7]/.test(c)){let digits=c;while(digits.length<3&&/[0-7]/.test(source[position]??''))digits+=source[position++];bytes.push(parseInt(digits,8)&255);continue;}bytes.push(({n:10,r:13,t:9,b:8,f:12})[c]??c.charCodeAt(0));continue;}if(c==='('){if(++nesting>32)throw new Error('String nesting limit');}else if(c===')'){if(--nesting===0)break;}if(c==='\r'){if(source[position]==='\n')position++;c='\n';}bytes.push(c.charCodeAt(0));if(bytes.length>1000000)throw new Error('String size limit');}if(nesting)throw new Error('Unclosed string');return {type:'string',bytes:new Uint8Array(bytes),start,end:position};}
    if(character==='<'&&source[position]!=='<'){let hex='';while(position<source.length&&source[position]!=='>'){const c=source[position++];if(space(c))continue;if(!/[a-f0-9]/i.test(c))throw new Error('Invalid hex string');hex+=c;if(hex.length>2000000)throw new Error('String size limit');}if(source[position++]!=='>')throw new Error('Unclosed hex string');if(hex.length%2)hex+='0';const bytes=new Uint8Array(hex.length/2);for(let index=0;index<bytes.length;index++)bytes[index]=parseInt(hex.slice(index*2,index*2+2),16);return {type:'string',bytes,start,end:position};}
    if(character==='['||character==='<'&&source[position]==='<'){const dictionary=character==='<';if(dictionary)position++;const items=[];while(position<source.length){while(space(source[position]))position++;if(dictionary&&source.slice(position,position+2)==='>>'){position+=2;return {type:'dictionary',items,start,end:position};}if(!dictionary&&source[position]===']'){position++;return {type:'array',items,start,end:position};}const item=read(depth+1);if(!item)break;items.push(item);}throw new Error('Unclosed compound');}
    if(/[\]<>)]/.test(character))throw new Error('Unmatched delimiter');
    let value=character;while(position<source.length&&!space(source[position])&&!/[()<>\[\]{}\/%]/.test(source[position]))value+=source[position++];
    if(character==='/')return {type:'name',value:value.slice(1).replace(/#([a-f0-9]{2})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16))),start,end:position};
    return {type:/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value)?'number':'operator',value,start,end:position};
  };
  const result=[];while(position<source.length){const token=read(0);if(token)result.push(token);}return result;
}
function fontFor(doc,resources,key,cache,budget){
  try{if(typeof key!=='string'||!key||key.length>200||/[\x00-\x1f\x7f]|#[a-f0-9]{2}/i.test(key))return null;const fonts=resources?.lookupMaybe(n('Font'),PDFDict),font=fonts?.lookupMaybe(n(key),PDFDict);if(!font)return null;if(cache.has(font))return cache.get(font);let result=mappedOriginalFont(doc,font,budget);if(!result&&String(font.get(n('Subtype')))==='/Type1'&&!font.get(n('FontDescriptor'))&&!font.get(n('ToUnicode'))){const base=font.lookupMaybe(n('BaseFont'),PDFName)?.decodeText(),encoding=font.lookupMaybe(n('Encoding'),PDFName)?.decodeText();if(standard.has(base)&&(!encoding||encoding==='WinAnsiEncoding'))result={base,encoding:encoding??'ascii'};}cache.set(font,result);return result;}catch{return null;}
}
function decode(bytes,font){
  if(font.encoding==='source-unicode')return decodeMappedText(bytes,font,false);
  if(!bytes.length||bytes.length>4000)return null;
  if(font.encoding==='ascii'){const value=ascii(bytes);return value.length<=2000&&/^[A-Za-z0-9 .,:;!?+_=@\/()\-]+$/.test(value)?value:null;}
  if([...bytes].some(byte=>byte<32||byte===127||[129,141,143,144,157].includes(byte)))return null;const value=new TextDecoder('windows-1252').decode(bytes);return value.length<=2000?value:null;
}
export async function originalText(doc,sourceSha256){
  if(!/^[a-f0-9]{64}$/.test(sourceSha256??''))throw new Error('Original text paths need the exact source identity');const candidates=[],streams=new Map(),fontCache=new WeakMap(),fontBudget={bytes:0,fonts:0};let total=0,limited=false,formCount=0,pathNodes=0,candidateCount=0;
  const blank=()=>({font:null,size:0,resource:null,stack:[],inside:false,marked:0});
  const scan=(record,resources,state)=>{
    const stream=record.stream;if(!(stream instanceof PDFRawStream)||['F','FFilter','FDecodeParms'].some(name=>stream.dict.get(n(name))))throw new Error('Unsupported source text stream');
    const bytes=decodePDFRawStream(stream).getBytes(STREAM_LIMIT+1);if(bytes.length>STREAM_LIMIT||(total+=bytes.length)>TOTAL_LIMIT)throw new Error('Decoded text stream limit');const syntax=tokens(ascii(bytes));if(syntax.some(token=>token.type==='operator'&&token.value==='BI'))throw new Error('Inline image stream needs a dedicated parser');record.bytes=bytes;const rows=[],usedForms=new Set(),unsafeForms=new Set();let operands=[];
    for(const token of syntax){if(token.type!=='operator'){operands.push(token);if(operands.length>1000)throw new Error('Text operand limit');continue;}const operator=token.value;
      const numeric=value=>value?.type==='number'&&Number.isFinite(Number(value.value));
      if(['q','Q','BT','ET','EMC'].includes(operator)&&operands.length)throw new Error('Unexpected structural operands');
      if(operator==='Tf'&&(operands.length!==2||operands[0]?.type!=='name'||!numeric(operands[1])))throw new Error('Malformed source font operator');
      if(operator==='Do'&&(operands.length!==1||operands[0]?.type!=='name'))throw new Error('Malformed Form invocation');
      if((operator==='BMC'&&(operands.length!==1||operands[0]?.type!=='name'))||(operator==='BDC'&&(operands.length!==2||operands[0]?.type!=='name'||!['name','dictionary'].includes(operands[1]?.type))))throw new Error('Malformed marked content');
      if(['Tj',"'"].includes(operator)&&(operands.length!==1||operands[0]?.type!=='string'))throw new Error('Malformed source text operator');
      if(operator==='"'&&(operands.length!==3||!numeric(operands[0])||!numeric(operands[1])||operands[2]?.type!=='string'))throw new Error('Malformed spaced text operator');
      if(operator==='TJ'&&(operands.length!==1||operands[0]?.type!=='array'||operands[0].items.some(item=>item.type!=='string'&&!numeric(item))))throw new Error('Malformed source text array');
      if(operator==='q'){if(state.stack.length>=32)throw new Error('Graphics stack limit');state.stack.push({font:state.font,size:state.size,resource:state.resource});}
      if(operator==='Q'){const restored=state.stack.pop();if(!restored)throw new Error('Unbalanced graphics stack');Object.assign(state,restored);}
      if(operator==='BT'){if(state.inside)throw new Error('Nested text object');state.inside=true;}if(operator==='ET'){if(!state.inside)throw new Error('Unbalanced text object');state.inside=false;}
      if(operator==='BDC'||operator==='BMC'){if(++state.marked>32)throw new Error('Marked content limit');}if(operator==='EMC'){if(!state.marked)throw new Error('Unbalanced marked content');state.marked--;}
      if(operator==='gs')state.font=null;
      if(operator==='Tf'){const [key,size]=operands.slice(-2);state.font=key?.type==='name'?fontFor(doc,resources,key.value,fontCache,fontBudget):null;state.resource=key?.type==='name'?key.value:null;state.size=size?.type==='number'?Number(size.value):0;}
      if(operator==='Do'){const operand=operands.at(-1);if(operands.length===1&&operand?.type==='name'){if(state.marked||state.inside)unsafeForms.add(operand.value);else usedForms.add(operand.value);}}
      const operand=operands.at(-1),strings=operator==='TJ'&&operand?.type==='array'&&operand.items.every(item=>item.type==='string'||item.type==='number')?operand.items.filter(item=>item.type==='string'):operand?.type==='string'?[operand]:[];
      if(state.inside&&!state.marked&&state.font&&state.size>0&&state.size<=200&&['Tj','TJ',"'",'"'].includes(operator)){
        for(const string of strings){const text=decode(string.bytes,state.font);if(text===null){limited=true;continue;}if(text&&text.trim()){if(++candidateCount>2000){limited=true;continue;}rows.push({page:record.page,text,font:state.font.base,size:state.size,encoding:state.font.encoding,key:record.key,start:string.start,end:string.end,sourceFont:state.font,fontResource:state.resource,originalBytes:string.bytes,formPath:[...(record.formPath??[])]});}}
      }else if(state.inside&&strings.length&&['Tj','TJ',"'",'"'].includes(operator))limited=true;operands=[];
    }
    for(const name of unsafeForms){usedForms.delete(name);limited=true;}return {rows,usedForms,unsafeForms};
  };
  const descend=async(page,name,path,resources,active)=>{
    if(++pathNodes>20000)throw new Error('Nested text path limits');if(!name||name.length>200||/[\x00-\x1f\x7f]|#[a-f0-9]{2}/i.test(name))throw new Error('Unsupported or ambiguous Form resource name');const objects=resources?.lookupMaybe(n('XObject'),PDFDict),ref=objects?.get(n(name)),stream=doc.context.lookup(ref);
    if(!(stream instanceof PDFRawStream)||stream.dict.lookupMaybe(n('Subtype'),PDFName)?.decodeText()!=='Form')return {rows:[],records:[]};if(path.length>=8||++formCount>1000)throw new Error('Nested text Form limit');if(!(ref instanceof PDFRef)||active.has(stream))throw new Error('Direct or cyclic original text Form');const supported=supportedForm(doc,stream),formPath=[...path,name],key=JSON.stringify([page,formPath]),record={key,page,formPath,stream,ref},state=blank(),read=scan(record,supported.resources,state);if(state.inside||state.marked||state.stack.length)throw new Error('Incomplete Form text/graphics structure');const rows=[...read.rows],records=[record],nextActive=new Set(active);nextActive.add(stream);
    for(const child of read.usedForms){const childRows=await descend(page,child,formPath,supported.resources,nextActive);rows.push(...childRows.rows);records.push(...childRows.records);}for(const row of read.rows){const identity=await imageDigest(new TextEncoder().encode(JSON.stringify({sourceSha256,page,path:formPath,ref:ref.toString(),start:row.start})));row.id='pdfix-original-'+page+'-0-'+row.start+'-n-'+identity;}return {rows,records};
  };
  for(let pageIndex=0;pageIndex<doc.getPageCount();pageIndex++){
    const page=doc.getPage(pageIndex),contents=page.node.Contents(),entries=contents instanceof PDFArray?contents.asArray():contents?[page.node.get(n('Contents'))]:[],resources=page.node.Resources(),state=blank(),usedForms=new Set(),unsafeForms=new Set(),pageRows=[],pageRecords=[];let pageUnsafe=false;
    for(let streamIndex=0;streamIndex<entries.length;streamIndex++){
      const key=pageIndex+'-'+streamIndex,record={key,entries,streamIndex,page:pageIndex,stream:doc.context.lookup(entries[streamIndex]),formPath:[]};try{const read=scan(record,resources,state);for(const row of read.rows)row.id='pdfix-original-'+pageIndex+'-'+streamIndex+'-'+row.start;pageRows.push(...read.rows);pageRecords.push(record);for(const name of read.usedForms)usedForms.add(name);for(const name of read.unsafeForms)unsafeForms.add(name);}catch{Object.assign(state,blank());pageUnsafe=true;limited=true;}
    }
    if(pageUnsafe||state.inside||state.marked||state.stack.length){limited=true;continue;}candidates.push(...pageRows);for(const record of pageRecords)streams.set(record.key,record);for(const name of unsafeForms)usedForms.delete(name);
    for(const name of usedForms)try{const result=await descend(pageIndex,name,[],resources,new Set());candidates.push(...result.rows);for(const record of result.records)streams.set(record.key,record);}catch{limited=true;}
  }
  for(const candidate of candidates)if(candidate.encoding==='source-unicode')decodeMappedText(candidate.originalBytes,candidate.sourceFont,true);
  return {candidates,streams,limited};
}
export function originalTextResources(doc,page,formPath=[]){return formPath.length?supportedForm(doc,resolveImagePath(doc,page,formPath).stream).resources:doc.getPage(page).node.Resources();}
export async function replaceOriginalText(doc,edits,inspection,formSession=null){
  const found=new Map(inspection.candidates.map(item=>[item.id,item])),groups=new Map(),fonts=new Map(),expected=[];
  for(const edit of edits){const candidate=found.get(edit.id);if(!candidate)throw new Error('This original text run is no longer editable in the opened PDF.');if(candidate.encoding==='ascii'&&!/^[A-Za-z0-9 .,:;!?+_=@\/()\-]*$/.test(edit.text))throw new Error('This source font supports simple ASCII text here. Use text placement for other characters.');let encoded;if(candidate.encoding==='source-unicode')encoded=encodeMappedText(edit.text,candidate.sourceFont,candidate.originalBytes);else{if(!fonts.has(candidate.font))fonts.set(candidate.font,await doc.embedFont(candidate.font));try{encoded=fonts.get(candidate.font).encodeText(edit.text).toString();}catch{throw new Error('The replacement uses characters unavailable in the original font.');}}if(!groups.has(candidate.key))groups.set(candidate.key,[]);groups.get(candidate.key).push({...candidate,encoded});expected.push({page:candidate.page,text:edit.text});}
  const pageEntries=new Map();
  for(const [key,changes]of groups){const record=inspection.streams.get(key),source=ascii(record.bytes);let output=source;for(const change of changes.sort((a,b)=>b.start-a.start))output=output.slice(0,change.start)+change.encoded+output.slice(change.end);if(output.length>STREAM_LIMIT)throw new Error('An edited content stream exceeds its limit.');const bytes=Uint8Array.from(output,c=>c.charCodeAt(0));if(record.formPath.length){if(!formSession)throw new Error('The nested text edit session is unavailable');await replaceFormProgram(formSession,record.page,record.formPath,bytes);continue;}const replacement=doc.context.flateStream(bytes),dictionary=record.stream.dict.clone(doc.context);dictionary.delete(n('DecodeParms'));dictionary.delete(n('DL'));dictionary.set(n('Filter'),n('FlateDecode'));dictionary.delete(n('Length'));const ref=doc.context.register(PDFRawStream.of(dictionary,replacement.contents));if(!pageEntries.has(record.page))pageEntries.set(record.page,[...record.entries]);pageEntries.get(record.page)[record.streamIndex]=ref;}
  for(const [page,entries]of pageEntries)doc.getPage(page).node.set(n('Contents'),doc.context.obj(entries));return expected;
}
