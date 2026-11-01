// This codec is invoked only by the contained Office inspection operation.
const {xml}=require('./office-archive.cjs');
const {validDocumentLayout,defaultDocumentLayout}=require('./document-layout-validation.cjs');
const {validDocumentBand,FONTS}=require('./document-band-model.cjs');
const NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main',REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships',PKG='http://schemas.openxmlformats.org/package/2006/relationships';
const direct=(node,name)=>Array.from(node.childNodes??[]).filter(n=>n.nodeType===1&&n.namespaceURI===NS&&n.localName===name);
const attr=(node,name)=>node?.getAttributeNS(NS,name)??'';
const elements=node=>Array.from(node.childNodes??[]).filter(n=>n.nodeType===1);
const unsupported=message=>{throw new Error(message);};
function attributes(node,names=[],textSpace=false){
 if(!['t','instrText'].includes(node.localName)&&Array.from(node.childNodes??[]).some(child=>[3,4].includes(child.nodeType)&&child.data.trim()))unsupported('text outside direct header/footer text runs is unsupported');
 for(const attribute of Array.from(node.attributes??[])){
  if(attribute.namespaceURI==='http://www.w3.org/2000/xmlns/')continue;
  if(textSpace&&attribute.namespaceURI==='http://www.w3.org/XML/1998/namespace'&&attribute.localName==='space'&&['preserve','default'].includes(attribute.value))continue;
  if(attribute.namespaceURI!==NS||!names.includes(attribute.localName))unsupported('unsupported or inherited header/footer attributes');
 }
}
function leaf(node,names=[],textSpace=false){attributes(node,names,textSpace);if(elements(node).length)unsupported('wrapped header/footer content is unsupported');}
function paragraphAlignment(paragraph){
 attributes(paragraph);const properties=direct(paragraph,'pPr');if(properties.length>1)unsupported('paragraph properties are ambiguous');let align='left';
 if(properties.length){attributes(properties[0]);const seen=new Set();for(const node of elements(properties[0])){
  if(node.namespaceURI!==NS||!['jc','spacing'].includes(node.localName)||seen.has(node.localName))unsupported('inherited styles or unsupported paragraph formatting');seen.add(node.localName);
  if(node.localName==='jc'){leaf(node,['val']);align=attr(node,'val');}
  else {leaf(node,['before','after','line','lineRule']);for(const name of ['before','after','line'])if(attr(node,name)&&!/^\d{1,5}$/.test(attr(node,name)))unsupported('paragraph spacing is unsupported');if(attr(node,'lineRule')&&!['auto','exact','atLeast'].includes(attr(node,'lineRule')))unsupported('paragraph spacing is unsupported');}
 }}if(!['left','center','right'].includes(align))unsupported('paragraph alignment is unsupported');return align;
}
function onOff(node){leaf(node,['val']);const value=attr(node,'val');if(['','1','true','on'].includes(value))return true;if(['0','false','off'].includes(value))return false;unsupported('run emphasis is unsupported');}
function fieldProperties(node){
 attributes(node);const seen=new Set();for(const property of elements(node)){
  if(property.namespaceURI!==NS||!['rFonts','sz','szCs','color','b','bCs','i','iCs','u'].includes(property.localName)||seen.has(property.localName))unsupported('unsupported page-field formatting');seen.add(property.localName);
  leaf(property,property.localName==='rFonts'?['ascii','hAnsi','eastAsia','cs']:['val']);
 }
}
function runFormatting(run){
 attributes(run);const properties=direct(run,'rPr');if(properties.length!==1)unsupported('explicit run font, size and color are required');attributes(properties[0]);const nodes=new Map();
 for(const node of elements(properties[0])){if(node.namespaceURI!==NS||!['rFonts','sz','szCs','color','b','bCs','i','iCs','u'].includes(node.localName)||nodes.has(node.localName))unsupported('inherited styles or unsupported run formatting');nodes.set(node.localName,node);}
 const fonts=nodes.get('rFonts'),sizeNode=nodes.get('sz'),colorNode=nodes.get('color');if(!fonts||!sizeNode||!colorNode)unsupported('explicit run font, size and color are required');
 leaf(fonts,['ascii','hAnsi','eastAsia','cs']);const fontName=attr(fonts,'ascii'),font=Object.keys(FONTS).find(key=>FONTS[key]===fontName);if(!font||['hAnsi','eastAsia','cs'].some(name=>attr(fonts,name)&&attr(fonts,name)!==fontName))unsupported('unknown fonts or character-specific font shaping are unsupported');
 leaf(sizeNode,['val']);const halfPoints=attr(sizeNode,'val');if(!/^\d{1,2}$/.test(halfPoints)||Number(halfPoints)<16||Number(halfPoints)>48)unsupported('run size is outside 8 to 24 pt');
 if(nodes.has('szCs')){leaf(nodes.get('szCs'),['val']);if(attr(nodes.get('szCs'),'val')!==halfPoints)unsupported('character-specific run sizes are unsupported');}
 leaf(colorNode,['val']);const color=attr(colorNode,'val');if(!/^[a-f0-9]{6}$/i.test(color))unsupported('theme or automatic run colors are unsupported');
 const bold=nodes.has('b')?onOff(nodes.get('b')):false,italic=nodes.has('i')?onOff(nodes.get('i')):false;
 for(const [name,value] of [['bCs',bold],['iCs',italic]])if(nodes.has(name)&&onOff(nodes.get(name))!==value)unsupported('character-specific emphasis is unsupported');
 let underline=false;if(nodes.has('u')){const node=nodes.get('u');leaf(node,['val']);const value=attr(node,'val');if(!['single','none'].includes(value))unsupported('only single text-color underline is supported');underline=value==='single';}
 return {font,size:Number(halfPoints)/2,color:'#'+color.toLowerCase(),bold,italic,underline};
}
// Recognize only standalone PAGE/NUMPAGES paragraphs. Their cached result never enters the model.
function pageFieldParagraph(paragraph){
 const hasFields=['fldSimple','fldChar','instrText'].some(name=>paragraph.getElementsByTagNameNS(NS,name).length);if(!hasFields)return false;
 paragraphAlignment(paragraph);let phase=null,instruction='',fields=0;
 const known=value=>/^(PAGE|NUMPAGES)(?:\s+\\\*\s+MERGEFORMAT)?$/i.test(value.trim());
 const outside=value=>{if(!/^[\s/]*$/.test(value))unsupported('page fields mixed with authored text are unsupported');};
 for(const child of elements(paragraph)){
  if(child.namespaceURI!==NS)unsupported('page-field namespaces are unsupported');if(child.localName==='pPr')continue;
  if(child.localName==='fldSimple'){
   if(phase)unsupported('nested page fields are unsupported');attributes(child,['instr']);if(!known(attr(child,'instr')))unsupported('unknown header/footer field semantics');
   for(const run of elements(child)){if(run.namespaceURI!==NS||run.localName!=='r')unsupported('wrapped page-field content is unsupported');attributes(run);if(direct(run,'rPr').length>1)unsupported('ambiguous page-field properties');for(const node of elements(run)){if(node.namespaceURI!==NS||!['rPr','t'].includes(node.localName))unsupported('unsupported page-field result structures');if(node.localName==='t')leaf(node,[],true);else fieldProperties(node);}}
   fields++;continue;
  }
  if(child.localName!=='r')unsupported('wrapped page-field content is unsupported');attributes(child);if(direct(child,'rPr').length>1)unsupported('ambiguous page-field properties');
  for(const node of elements(child)){
   if(node.namespaceURI!==NS)unsupported('page-field namespaces are unsupported');
   if(node.localName==='rPr'){fieldProperties(node);continue;}
   if(node.localName==='fldChar'){leaf(node,['fldCharType','dirty']);if(attr(node,'dirty')&&!['0','1','true','false'].includes(attr(node,'dirty')))unsupported('unsupported page-field flags');const type=attr(node,'fldCharType');if(type==='begin'&&!phase){phase='instruction';instruction='';}else if(type==='separate'&&phase==='instruction'&&known(instruction)){phase='cache';}else if(type==='end'&&phase&&known(instruction)){fields++;phase=null;}else unsupported('ambiguous or unknown header/footer fields');}
   else if(node.localName==='instrText'){leaf(node,[],true);if(phase!=='instruction')unsupported('ambiguous header/footer field instruction');instruction+=node.textContent;if(instruction.length>100)unsupported('header/footer field instruction is oversized');}
   else if(node.localName==='t'){leaf(node,[],true);if(phase==='instruction')unsupported('ambiguous header/footer field text');if(!phase)outside(node.textContent);}
   else unsupported('unsupported page-field content');
  }
 }
 if(phase||!fields)unsupported('unfinished header/footer page fields');return true;
}
function formattedBand(root,excluded){
 attributes(root);const paragraphs=[];for(const paragraph of elements(root)){
  if(excluded.has(paragraph))continue;if(paragraph.namespaceURI!==NS||paragraph.localName!=='p')unsupported('tables, drawings or wrapped header/footer content are unsupported');const align=paragraphAlignment(paragraph),runs=[];
  for(const run of elements(paragraph)){if(run.namespaceURI===NS&&run.localName==='pPr')continue;if(run.namespaceURI!==NS||run.localName!=='r')unsupported('links, revisions or wrapped runs are unsupported');const format=runFormatting(run);let text='';for(const node of elements(run)){if(node.namespaceURI!==NS)unsupported('unsupported run namespaces');if(node.localName==='rPr')continue;if(node.localName!=='t')unsupported('fields, drawings, breaks, tabs or rich run content are unsupported');leaf(node,[],true);text+=node.textContent;}runs.push({text,...format});}
  if(!runs.length)unsupported('empty paragraphs without explicit run formatting are unsupported');paragraphs.push({align,runs});
 }return paragraphs.length?validDocumentBand({version:1,paragraphs}):null;
}
function plainBand(bytes,location,excluded=new Set(),parsedRoot=null){
 if(!bytes||bytes.length>256*1024)throw new Error('the header/footer part is missing or exceeds 256 KiB');
 const root=parsedRoot??xml(bytes).documentElement;if(root.namespaceURI!==NS||root.localName!==(location==='header'?'hdr':'ftr'))throw new Error('the header/footer namespace is unsupported');
 const paragraphs=direct(root,'p').filter(node=>!excluded.has(node));if(paragraphs.length>2)throw new Error('the header/footer exceeds two paragraphs');let alignment=null;const lines=[];
 for(const child of Array.from(root.childNodes??[]))if(child.nodeType===1&&!paragraphs.includes(child)&&!excluded.has(child))throw new Error('tables, drawings or wrapped header/footer content are unsupported');
 for(const paragraph of paragraphs){
  const pPr=direct(paragraph,'pPr'),jc=pPr.flatMap(node=>direct(node,'jc'));if(pPr.length>1||jc.length>1)throw new Error('paragraph alignment is ambiguous');const align=jc.length?attr(jc[0],'val'):'left';if(!['left','center','right'].includes(align)||alignment!==null&&alignment!==align)throw new Error('mixed or unsupported paragraph alignments are unsupported');alignment=align;
  // Plain text accepts font/size/spacing metadata, but never fields or rich runs.
  if(pPr.some(node=>Array.from(node.childNodes??[]).some(n=>n.nodeType===1&&(!['jc','spacing','ind','rPr','pStyle','contextualSpacing'].includes(n.localName)||n.namespaceURI!==NS))))throw new Error('rich paragraph structures are unsupported');
  let text='';for(const run of Array.from(paragraph.childNodes??[]).filter(n=>n.nodeType===1)){
   if(run.localName==='pPr'&&run.namespaceURI===NS)continue;if(run.namespaceURI!==NS||run.localName!=='r')throw new Error('fields, links, revisions or rich header/footer structures are unsupported');
   for(const node of Array.from(run.childNodes??[]).filter(n=>n.nodeType===1)){
    if(node.namespaceURI!==NS)throw new Error('rich header/footer namespaces are unsupported');
    if(node.localName==='rPr'){if(Array.from(node.childNodes??[]).some(n=>n.nodeType===1&&(!['rFonts','sz','szCs','lang','noProof'].includes(n.localName)||n.namespaceURI!==NS)))throw new Error('rich run formatting is unsupported');continue;}
    if(node.localName==='t'){if(Array.from(node.childNodes??[]).some(n=>n.nodeType===1))throw new Error('wrapped text is unsupported');text+=node.textContent;}
    else if(['br','cr'].includes(node.localName)&&!attr(node,'type'))text+='\n';else throw new Error('page fields, drawings, tabs or other rich content are unsupported');
    if(text.length>120)throw new Error('header/footer text exceeds 120 characters');
   }
  }lines.push(text);
 }
 const text=lines.join('\n');validDocumentLayout({...defaultDocumentLayout(),[location+'Text']:text,[location+'Align']:alignment??'left'});return {text,align:alignment??'left'};
}
function inspectDocumentBands(archive,document,notices){
 const bands={header:null,footer:null},note=text=>{if(notices.length<100)notices.push(text);};
 const sections=Array.from(document.getElementsByTagNameNS(NS,'sectPr'));
 if(sections.length!==1){note('Original headers/footers omitted: importing section-specific or missing section layouts is unsupported.');return bands;}
 const section=sections[0];if(section.parentNode?.localName!=='body'||section.parentNode?.namespaceURI!==NS){note('Original headers/footers omitted: the section layout is not a single default body section.');return bands;}
 if(direct(section,'titlePg').length)note('Original first-page header/footer behavior is omitted; imported default text repeats on every page.');
 const settings=archive.get('word/settings.xml');if(settings&&settings.length<=256*1024&&xml(settings).getElementsByTagNameNS(NS,'evenAndOddHeaders').length)note('Original even/odd header/footer behavior is omitted; imported default text repeats on every page.');
 let relationships;try{const bytes=archive.get('word/_rels/document.xml.rels');if(!bytes||bytes.length>256*1024)throw new Error('document relationships are missing or oversized');relationships=Array.from(xml(bytes).getElementsByTagNameNS(PKG,'Relationship'));}catch(error){note('Original headers/footers omitted: '+error.message+'.');return bands;}
 for(const location of ['header','footer']){
  const refs=direct(section,location+'Reference'),defaults=refs.filter(node=>attr(node,'type')==='default');if(refs.some(node=>attr(node,'type')!=='default'))note(`Original first/even/odd ${location} variants are omitted.`);
  if(!defaults.length)continue;if(defaults.length!==1){note(`Original ${location} omitted: multiple default references are ambiguous.`);continue;}
  try{
   const id=defaults[0].getAttributeNS(REL,'id'),matches=relationships.filter(node=>node.getAttribute('Id')===id);if(!id||matches.length!==1)throw new Error('the default reference is missing or ambiguous');const relationship=matches[0],target=relationship.getAttribute('Target');
   if(relationship.getAttribute('TargetMode')||relationship.getAttribute('Type')!==REL+'/'+location||!target||target.length>200||!/^[A-Za-z0-9_.\-/]+$/.test(target)||target.startsWith('/')||target.split('/').some(part=>!part||part==='.'||part==='..'))throw new Error('the default reference is external or unsupported');
   const bytes=archive.get('word/'+target);if(!bytes||bytes.length>256*1024)throw new Error('the header/footer part is missing or exceeds 256 KiB');const root=xml(bytes).documentElement;
   if(root.namespaceURI!==NS||root.localName!==(location==='header'?'hdr':'ftr'))throw new Error('the header/footer namespace is unsupported');
   const excluded=new Set();for(const paragraph of direct(root,'p'))if(pageFieldParagraph(paragraph))excluded.add(paragraph);
   if(excluded.size)note(`Original ${location}: omitted ${excluded.size} standalone PAGE/NUMPAGES paragraph${excluded.size===1?'':'s'}; cached field values were not imported and automatic page numbers are disabled.`);
   try{bands[location]=formattedBand(root,excluded);if(bands[location])note(`Imported supported direct default ${location} paragraph alignment and run fonts, sizes, colors and emphasis; inherited defaults, source spacing, shaping and absolute placement are simplified to Page setup.`);}
   catch(error){bands[location]=plainBand(bytes,location,excluded,root);note(`Imported plain default ${location} text/alignment; formatting was simplified (${String(error.message).slice(0,180)}), including source fonts, inherited styles, spacing and absolute placement.`);}
  }catch(error){note(`Original ${location} omitted: ${String(error.message).slice(0,600)}.`);}
 }return bands;
}
module.exports={inspectDocumentBands};
