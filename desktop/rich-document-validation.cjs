const LIMITS=require('./document-limits.cjs');
const {validDocumentLayout,validDocumentPage}=require('./document-layout-validation.cjs');
const {validateDocumentTables}=require('./document-table-validation.cjs');
const {validateDocumentImages,rasterHeader}=require('./document-image-validation.cjs');
const MAX_SNAPSHOT=LIMITS.DOCUMENT_BYTES;
const TYPES=new Set(['doc','paragraph','heading','bulletList','orderedList','listItem','blockquote','codeBlock','text','hardBreak','horizontalRule','pageBreak','table','tableRow','tableCell','tableHeader','documentImage']);
const {validLinkTarget,validDocumentAnchor}=require('./document-link-model.cjs');
const {validDocumentSnapshot}=require('./document-snapshot-model.cjs');
const {validParagraphFormat}=require('./document-paragraph-model.cjs');
const MARKS=new Set(['bold','italic','underline','strike','code','superscript','subscript','highlight','documentTextStyle','documentLink']);
const {validHighlight}=require('./document-mark-model.cjs');
function validHighlightMark(mark){if(!mark.attrs||Object.keys(mark.attrs).join(',')!=='color')fail('Unsupported highlight.');try{validHighlight(mark.attrs.color);}catch{fail('Unsupported highlight.');}}
// A link mark carries exactly one already-normalized web or email target.
function validLinkMark(mark){let href;try{href=validLinkTarget(mark.attrs?.href);}catch{fail('Unsupported document link.');}if(Object.keys(mark.attrs).join(',')!=='href'||href!==mark.attrs.href)fail('Unsupported document link.');}
const fail=message=>{throw new Error(message);};
function plain(value){return value&&Object.getPrototypeOf(value)===Object.prototype;}
function bounded(value){
 let count=0;
 const walk=(item,depth)=>{if(++count>LIMITS.DOCUMENT_NODES*15||depth>40)fail('Rich document exceeds its structural limit.');if(item===null||typeof item==='boolean')return;if(typeof item==='string'){if(!item.isWellFormed())fail('Use valid document text.');return;}if(typeof item==='number'){if(!Number.isFinite(item))fail('Invalid rich document geometry.');return;}if(Array.isArray(item)){for(const child of item)walk(child,depth+1);return;}if(!plain(item))fail('Use a plain rich document snapshot.');for(const key of Object.keys(item)){if(['__proto__','prototype','constructor'].includes(key))fail('Unsupported document property.');walk(item[key],depth+1);}};
 walk(value,0);const raw=JSON.stringify(value);if(Buffer.byteLength(raw)>MAX_SNAPSHOT)fail('The document is larger than PDFix can save. Remove some pictures or split it into two documents.');
}
function validRichContent(content){
 bounded(content);let count=0;
 const node=(value,depth)=>{if(++count>LIMITS.DOCUMENT_NODES||depth>32||!plain(value)||!TYPES.has(value.type)||Object.keys(value).some(key=>!['type','attrs','content','text','marks'].includes(key)))fail('Unsupported rich document element.');if(value.attrs!==undefined&&!plain(value.attrs))fail('Invalid document attributes.');if(['paragraph','heading'].includes(value.type)&&value.attrs)try{validParagraphFormat(value.attrs);}catch{fail('Unsupported paragraph layout.');}if(value.attrs?.anchor!==undefined&&value.attrs.anchor!==null){if(value.type!=='heading')fail('Only headings carry link anchors.');try{validDocumentAnchor(value.attrs.anchor);}catch{fail('Unsupported heading anchor.');}}if(value.type==='text'){if(typeof value.text!=='string'||value.content!==undefined)fail('Invalid rich document text.');}else if(value.text!==undefined)fail('Text is allowed only in text elements.');if(value.content!==undefined){if(!Array.isArray(value.content))fail('Invalid document children.');for(const child of value.content)node(child,depth+1);}if(value.marks!==undefined){if(!Array.isArray(value.marks)||value.marks.length>8)fail('Invalid document formatting.');for(const mark of value.marks){if(!plain(mark)||!MARKS.has(mark.type)||Object.keys(mark).some(key=>!['type','attrs'].includes(key))||mark.attrs!==undefined&&!plain(mark.attrs))fail('Unsupported document formatting.');if(mark.type==='documentLink')validLinkMark(mark);else if(mark.type==='highlight')validHighlightMark(mark);else if(['superscript','subscript'].includes(mark.type)&&mark.attrs!==undefined&&Object.keys(mark.attrs).length)fail('Unsupported document formatting.');}}};
 node(content,0);if(content.type!=='doc')fail('Choose a complete rich document.');validateDocumentTables(content);validateDocumentImages(content);return content;
}
function validRichRequest(value){if(!plain(value)||Object.keys(value).sort().join(',')!=='content,layout,version'||value.version!==1)fail('Invalid rich document request.');bounded(value);validRichContent(value.content);validDocumentLayout(value.layout);return value;}
function validRtfImport(value){
 if(!plain(value)||!['bands,doc,warnings','bands,doc,page,warnings'].includes(Object.keys(value).sort().join(',')))fail('Invalid contained RTF result.');if(Object.hasOwn(value,'page'))validDocumentPage(value.page);validRichContent(value.doc);
 if(!Array.isArray(value.warnings)||value.warnings.length>100||value.warnings.some(text=>typeof text!=='string'||text.length>1000))fail('Invalid RTF import notes.');
 if(!plain(value.bands)||Object.keys(value.bands).sort().join(',')!=='footer,header')fail('Invalid imported page bands.');
 for(const band of [value.bands.header,value.bands.footer])if(band!==null&&(!plain(band)||Object.keys(band).sort().join(',')!=='align,text'||typeof band.text!=='string'||band.text.length>120||!['left','center','right'].includes(band.align)))fail('Invalid imported header or footer.');return value;
}
function validRichOutput(value,format){if(!(value instanceof Uint8Array)||value.length<8||value.length>LIMITS.DOCUMENT_BYTES)fail('Invalid contained rich document copy.');if(format==='docx'&&(value[0]!==80||value[1]!==75||value[2]!==3||value[3]!==4)||format==='rtf'&&!Buffer.from(value.subarray(0,10)).toString('ascii').startsWith('{\\rtf1'))fail('Contained copy has the wrong document format.');return value;}
// Paragraph layout read from the Word body: a bounded list of text keys with only the editor's own paragraph values.
// Run formatting as [character count, style] with only the editor's own font, size, color and highlight values.
function validDocxRuns(runs){const {MAX_RUNS}=require('./docx-paragraph-layout.cjs');return Array.isArray(runs)&&runs.length>=1&&runs.length<=MAX_RUNS&&runs.every(run=>plain(run)&&Object.keys(run).sort().join(',')==='n,style'&&Number.isInteger(run.n)&&run.n>0&&run.n<=1000000&&plain(run.style)&&Object.keys(run.style).every(key=>['font','size','color','highlight'].includes(key))&&(run.style.font===undefined||['sans','serif','mono'].includes(run.style.font))&&(run.style.size===undefined||Number.isFinite(run.style.size)&&run.style.size>=8&&run.style.size<=72)&&(run.style.color===undefined||typeof run.style.color==='string'&&/^#[0-9a-f]{6}$/.test(run.style.color))&&(run.style.highlight===undefined||['yellow','green','turquoise','pink'].includes(run.style.highlight)));}
function validDocxParagraphs(list){
 const {MAX_PARAGRAPHS,TEXT_KEY}=require('./docx-paragraph-layout.cjs');if(!Array.isArray(list)||list.length>MAX_PARAGRAPHS)fail('Invalid DOCX paragraph layout.');
 for(const item of list){if(!plain(item)||!['attrs,text','attrs,runs,text'].includes(Object.keys(item).sort().join(','))||item.runs!==undefined&&!validDocxRuns(item.runs)||typeof item.text!=='string'||!item.text||item.text.length>TEXT_KEY||!item.text.isWellFormed()||!plain(item.attrs)||Object.keys(item.attrs).some(key=>!['textAlign','indent','firstLine','lineSpacing','spaceBefore','spaceAfter','rightIndent'].includes(key))||item.attrs.textAlign!==undefined&&!['center','right','justify'].includes(item.attrs.textAlign))fail('Invalid DOCX paragraph layout.');try{validParagraphFormat(item.attrs);}catch{fail('Invalid DOCX paragraph layout.');}}
}
function validDocxImport(value){
 if(plain(value)&&Object.hasOwn(value,'snapshot')){const {snapshot,...rest}=value;validDocumentSnapshot(snapshot,validRichContent,validDocumentLayout);validDocxImport(rest);return value;}
 if(plain(value)&&Object.hasOwn(value,'paragraphs')){const {paragraphs,...rest}=value;validDocxParagraphs(paragraphs);validDocxImport(rest);return value;}
 if(!plain(value)||Object.keys(value).sort().join(',')!=='assets,html,warnings'||typeof value.html!=='string'||!value.html.isWellFormed()||Buffer.byteLength(value.html)>LIMITS.HTML_BYTES||!Array.isArray(value.assets)||value.assets.length>LIMITS.IMAGE_COUNT||!Array.isArray(value.warnings)||value.warnings.length>100||value.warnings.some(text=>typeof text!=='string'||text.length>1000))fail('Invalid contained DOCX import result.');
 let bytes=0,pixels=0;const ids=new Set();
 for(const asset of value.assets){if(!plain(asset)||Object.keys(asset).sort().join(',')!=='alt,bytes,id,mime'||!Number.isInteger(asset.id)||asset.id<1||asset.id>LIMITS.IMAGE_COUNT||ids.has(asset.id)||!['image/png','image/jpeg'].includes(asset.mime)||typeof asset.alt!=='string'||asset.alt.length>500||!asset.alt.isWellFormed()||!(asset.bytes instanceof Uint8Array)||asset.bytes.length>LIMITS.IMAGE_SOURCE_BYTES)fail('Invalid contained DOCX image asset.');ids.add(asset.id);const header=rasterHeader(asset.bytes,asset.mime);bytes+=asset.bytes.length;pixels+=header.width*header.height;if(bytes>LIMITS.IMPORT_IMAGE_TOTAL_BYTES||pixels>LIMITS.IMAGE_TOTAL_PIXELS*4)fail('DOCX embedded images exceed their bounded transfer limit.');}
 return value;
}
module.exports={validRichContent,validRichRequest,validRtfImport,validRichOutput,validDocxImport};
