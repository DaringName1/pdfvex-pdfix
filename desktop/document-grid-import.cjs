// Called only inside the contained Office engine, never in the parent process.
const {createHash}=require('node:crypto');
const {readArchive,xml}=require('./office-archive.cjs');
const {inspectDocumentBands}=require('./document-band-import.cjs');
const {documentPageFromTwips}=require('./document-layout-validation.cjs');
const LIMITS=require('./document-limits.cjs');
const NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const direct=(node,name)=>Array.from(node.childNodes??[]).filter(n=>n.nodeType===1&&n.namespaceURI===NS&&n.localName===name);
const attr=(node,name)=>node?.getAttributeNS(NS,name)??'';
const number=(value,max)=>/^\d{1,6}$/.test(value)&&Number(value)>=1&&Number(value)<=max?Number(value):null;
const hash=value=>createHash('sha256').update(value).digest('hex');
const normalize=text=>text.replace(/\s+/gu,' ').trim().normalize('NFC');
function cellText(cell){let result='';const visit=node=>{if(node.nodeType!==1)return;if(node.namespaceURI===NS){if(node.localName==='t'){result+=node.textContent;return;}if(['tab','br','cr'].includes(node.localName)){result+='\n';return;}}for(const child of Array.from(node.childNodes??[]))visit(child);if(node.namespaceURI===NS&&node.localName==='p')result+='\n';};visit(cell);return normalize(result);}
function descriptor(table,index){
 const base={key:'table-'+(index+1),rows:0,columns:0,widthsTwips:null,signature:null,reason:null};const unsupported=reason=>({...base,reason});
 if(table.namespaceURI!==NS||table.getElementsByTagNameNS(NS,'tbl').length)return unsupported('Nested or unsupported table namespaces do not have a supported grid.');
 for(const name of ['ins','del','moveFrom','moveTo','tblGridChange','tcPrChange','trPrChange','sdt','altChunk'])if(table.getElementsByTagNameNS(NS,name).length)return unsupported('Tracked, wrapped or alternate table structures have ambiguous column geometry.');
 const rows=direct(table,'tr');if(!rows.length||rows.length>LIMITS.TABLE_ROWS)return unsupported('Supported column grids require 1–1,000 rows.');
 const grid=Array.from({length:rows.length},()=>[]),cells=[];let columns=0,textSize=0;
 for(let y=0;y<rows.length;y++){
  const row=rows[y],rowPr=direct(row,'trPr')[0];if(rowPr&&(direct(rowPr,'gridBefore').length||direct(rowPr,'gridAfter').length))return unsupported('Rows with omitted leading/trailing grid cells are unsupported.');let x=0;
  for(const cell of direct(row,'tc')){
   const pr=direct(cell,'tcPr')[0],spanNode=pr&&direct(pr,'gridSpan')[0],span=spanNode?number(attr(spanNode,'val'),32):1,merge=pr&&direct(pr,'vMerge')[0],mergeValue=merge?attr(merge,'val'):null,text=cellText(cell);if(!span||x+span>32||(textSize+=text.length)>LIMITS.DOCUMENT_TEXT)return unsupported('Table cell spans or text exceed the supported grid limits.');
   if(merge&&(mergeValue===''||mergeValue==='continue')){const origin=y?grid[y-1][x]:null;if(!origin||origin.column!==x||origin.colspan!==span||!origin.openMerge||text)return unsupported('A vertical merge continuation is ambiguous or contains text.');origin.rowspan++;for(let dx=0;dx<span;dx++)grid[y][x+dx]=origin;}
   else {if(merge&&mergeValue!=='restart')return unsupported('Unsupported vertical merge mode.');const item={row:y,column:x,rowspan:1,colspan:span,text,openMerge:!!merge,xml:cell};cells.push(item);for(let dx=0;dx<span;dx++)grid[y][x+dx]=item;}
   x+=span;
  }columns=Math.max(columns,x);
 }
 if(!columns||rows.length*columns>LIMITS.TABLE_CELLS||grid.some(row=>row.length!==columns||Array.from({length:columns},(_,x)=>row[x]).some(v=>!v)))return unsupported('The table does not have a supported complete rectangular grid.');
 base.rows=rows.length;base.columns=columns;base.signature=hash(JSON.stringify({rows:base.rows,columns,cells:cells.map(({row,column,rowspan,colspan,text})=>({row,column,rowspan,colspan,text}))}));
 const sourceGrid=direct(table,'tblGrid');if(sourceGrid.length!==1){base.reason='The original table has no unique declared Word column grid.';return base;}
 const widths=direct(sourceGrid[0],'gridCol').map(col=>number(attr(col,'w'),30000));if(widths.length!==columns||widths.some(w=>w===null)){base.reason='Declared Word grid widths are missing, outside bounds or do not match the cell geometry.';return base;}
 for(const item of cells){const pr=direct(item.xml,'tcPr')[0],cellWidth=pr&&direct(pr,'tcW')[0];if(cellWidth){const type=attr(cellWidth,'type'),w=Number(attr(cellWidth,'w'));if((type==='dxa'||type==='')&&(!Number.isInteger(w)||Math.abs(w-widths.slice(item.column,item.column+item.colspan).reduce((a,b)=>a+b,0))>2)){base.reason='Preferred cell widths conflict with the declared column grid.';return base;}if(type&&!['dxa','auto','nil'].includes(type)){base.reason='Percentage or unsupported cell widths make the declared grid ambiguous.';return base;}}}
 base.widthsTwips=widths;return base;
}
// Page setup comes only from one body-level section whose paper matches a listed size.
// Anything else is disclosed and left at the editor default instead of being guessed.
function inspectDocumentPage(body,notices){
 const note=text=>{if(notices.length<100)notices.push(text);},sections=direct(body,'sectPr');
 if(sections.length!==1||body.getElementsByTagNameNS(NS,'sectPr').length!==1){note('Original page size and margins omitted: section-specific or missing page setup is unsupported.');return null;}
 const size=direct(sections[0],'pgSz')[0],margins=direct(sections[0],'pgMar')[0],w=size&&number(attr(size,'w'),40000),h=size&&number(attr(size,'h'),40000);
 if(!w||!h){note('Original page size omitted: the document does not declare a supported page size.');return null;}
 const matched=documentPageFromTwips(w,h,margins&&number(attr(margins,'left'),31680),margins&&number(attr(margins,'right'),31680),margins&&number(attr(margins,'top'),31680),margins&&number(attr(margins,'bottom'),31680));
 if(!matched){note('Original page size omitted: '+(w/1440*25.4).toFixed(0)+' x '+(h/1440*25.4).toFixed(0)+' mm is outside the 50 to 600 mm PDFix supports. Choose a paper in Page setup.');return null;}
 if(matched.margins==='unsupported')note('Original side margins are unequal or outside 5 to 50 mm; the default margin is used.');else if(matched.margins==='missing')note('Original margins omitted: the document does not declare supported side margins.');
 note(matched.page.sides?'Imported page size, orientation and the four margins.':'Imported page size, orientation and side margins. Top and bottom spacing follow Page setup and header/footer bands.');return matched.page;
}
function inspectDocumentTableGrids(input){
 const bytes=Buffer.from(input);if(!bytes.length||bytes.length>LIMITS.WORD_IMPORT_BYTES)throw new Error('DOCX column-grid inspection is limited to 100 MB.');const archive=readArchive(bytes,{size:LIMITS.WORD_IMPORT_BYTES,expanded:LIMITS.DOCX_EXPANDED_BYTES,part:LIMITS.DOCX_PART_BYTES}),document=xml(archive.get('word/document.xml')),body=Array.from(document.getElementsByTagNameNS(NS,'body'))[0];if(!body)throw new Error('Supported DOCX document body is missing.');
 const source=Array.from(body.getElementsByTagNameNS(NS,'tbl'));if(source.length>LIMITS.TABLE_COUNT)throw new Error('DOCX grid inspection supports up to 1,000 tables.');const tables=source.map(descriptor);if(tables.reduce((sum,item)=>sum+item.rows*item.columns,0)>LIMITS.TABLE_TOTAL_CELLS)throw new Error('DOCX tables exceed 200,000 aggregate grid slots.');
 const notices=['Declared column proportions are fitted to the editable page or cell width. Original borders, absolute table placement and Word layout are not reconstructed.'];for(const table of tables)if(table.reason&&notices.length<100)notices.push(table.key+': '+table.reason);
 let bands={header:null,footer:null};try{bands=inspectDocumentBands(archive,document,notices);}catch{if(notices.length<100)notices.push('Original headers/footers omitted: source band metadata could not be inspected safely. Table grid inspection remains available.');}let page=null;try{page=inspectDocumentPage(body,notices);}catch{if(notices.length<100)notices.push('Original page size and margins omitted: page setup could not be inspected safely.');}return {version:1,sourceSha256:hash(bytes),tables,notices,bands,...(page?{page}:{})};
}
module.exports={inspectDocumentTableGrids};
