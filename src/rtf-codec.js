import {documentBandParagraphs} from './document-band-model.js';
import {validateDocumentImages,validateDocumentImage,imageDataBytes,rasterHeader} from './document-image-model.js';
import LIMITS from '../desktop/document-limits.cjs';
import {tableGeometry,tableColumnWidths,validateDocumentTables} from './document-table-model.js';
import {documentLayout,defaultDocumentLayout,documentPageMargins,documentPaperSize,documentPageFromTwips} from './document-layout-model.js';
import {importedBandLayout} from './document-band-import.js';
import {validDocumentLink,validLinkTarget,validDocumentAnchor,isInternalLink} from './document-link-model.js';
import {validParagraphFormat,paragraphOffsets,INDENT_TWIPS,PARAGRAPH_SPACES} from './document-paragraph-model.js';
import {HIGHLIGHTS,validHighlight,highlightFromHex} from './document-mark-model.js';

// Local text-only RTF adapter. Grammar reference: Microsoft's RTF specification
// https://learn.microsoft.com/en-us/previous-versions/office/developer/office2000/aa140277(v=office.10)
const LIMIT=LIMITS.DOCUMENT_BYTES, decoder=new TextDecoder('windows-1252');
// A left indent that is a whole number of half-inch steps is a paragraph indent; anything else is left at the margin.
// A half-inch first-line offset is a first-line indent; a half-inch negative one is a hanging indent whose
// extra left half inch belongs to the hang, not to the paragraph indent.
const paragraphShape=(left,first)=>{const firstLine=first===INDENT_TWIPS?'first':first===-INDENT_TWIPS&&left>=INDENT_TWIPS?'hanging':null,steps=indentSteps(firstLine==='hanging'?left-INDENT_TWIPS:left);return {...(steps?{indent:steps}:{}),...(firstLine?{firstLine}:{})};};
// A right indent that is 1 to 4 whole half-inch steps; anything else is left at the margin.
const rightSteps=twips=>Number.isInteger(twips)&&twips>0&&twips%INDENT_TWIPS===0&&twips/INDENT_TWIPS<=4?twips/INDENT_TWIPS:0;
const indentSteps=twips=>Number.isInteger(twips)&&twips>0&&twips%INDENT_TWIPS===0?Math.min(8,twips/INDENT_TWIPS):0;
const OMIT=new Set('stylesheet info pict object objdata result headerl headerr headerf footerl footerr footerf footnote annotation datastore filetbl listtable listoverridetable generator xmlopen xmlclose fldinst shppict nonshppict shp shpinst themedata colorschememapping datafield'.split(' '));
const fresh=()=>({intbl:false,bold:false,italic:false,underline:false,strike:false,script:null,highlight:0,font:0,size:24,color:0,align:'left',heading:null,hidden:false,uc:1,skip:false,dest:null,star:false,field:null,link:null,li:0,fi:0,ri:0,sb:null,sa:null,fontId:null,fontFamily:'sans',charset:0});
export function importRtf(input){
  const bytes=new Uint8Array(input);if(bytes.length>10*1024*1024)throw new Error('RTF import is limited to 10 MB.');
  const source=decoder.decode(bytes);if(!/^\{\\rtf1(?:\\|\s)/.test(source))throw new Error('Choose a supported RTF 1 document.');
  let state=fresh(),at=0,tokens=0,skipFallback=0,textSize=0,nodes=0,rootClosed=false,paragraph=null,defaultFont=0;
  const stack=[],fonts=new Map(),colors=[],warnings=new Set(),content=[],sourceBands={header:[],footer:[]};let rgb=[0,0,0],hasColor=false,sectionBreaks=0;const pageSetup={};
  const warn=message=>warnings.add(message);
  const rawPush=node=>{if(++nodes>LIMITS.DOCUMENT_NODES)throw new Error('RTF content exceeds the 200,000 element limit.');content.push(node);};
  // Tables: each row's cell definitions (cellx with the merge and shading words before it) and each cell's paragraphs
  // (those marked intbl). Content outside the table ends it.
  let table=null,rowDefs=[],pendingCell={},cellParagraphs=[],rowCells=[],pictures=0,pendingAnchor=null;
  // A finished picture: a PNG within the editor's limits becomes an inline image at its intended size; anything else
  // (other formats, too large, more than 500 pictures) becomes the same placeholder as before.
  const picture=pict=>{let node=null;
    if(['png','jpeg'].includes(pict.kind)&&pictures<LIMITS.IMAGE_COUNT)try{const hex=pict.hex.join('');if(hex.length%2)throw new Error('odd');const bytes=new Uint8Array(hex.length/2);for(let i=0;i<bytes.length;i++)bytes[i]=parseInt(hex.slice(i*2,i*2+2),16);
      let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));const mime=pict.kind==='jpeg'?'image/jpeg':'image/png',src='data:'+mime+';base64,'+btoa(binary),size=rasterHeader(imageDataBytes(src).bytes,mime);
      let width=pict.widthGoal>0?Math.round(pict.widthGoal/15):size.width;width=Math.max(8,Math.min(2000,width));const height=Math.max(8,Math.min(2000,pict.heightGoal>0&&pict.widthGoal>0?Math.round(pict.heightGoal/15*width/Math.round(pict.widthGoal/15)):Math.round(width*size.height/size.width)));
      node={type:'documentImage',attrs:validateDocumentImage({src,alt:pict.alt.replace(/[\x00-\x1f\x7f]/g,' ').trim().slice(0,500),width,height,pixelWidth:size.width,pixelHeight:size.height})};pictures++;}catch{node=null;}
    if(!node){warn('Pictures that are not PNG or JPEG, over 4 MB or beyond the first 500 became placeholders.');append('[Image'+(pict.alt?': '+pict.alt.slice(0,200):'')+']');return;}
    const p=ensure();if(++nodes>LIMITS.DOCUMENT_NODES)throw new Error('RTF content exceeds the element limit.');p.content.push(node);};
  const closeTable=()=>{if(!table)return;const rows=table.rows,nested=table.nested;table=null;const node=nested?null:tableFromRows(rows,colors);if(node)rawPush(node);else{warn('A table with nested or uneven rows was flattened to tab-separated rows.');for(const row of rows)rawPush({type:'paragraph',content:[{type:'text',text:row.cells.map(cell=>cell.map(paragraph=>(paragraph.content??[]).map(node=>node.text??'').join('')).join(' ')).join('\t')||' '}]});}};
  const push=node=>{closeTable();rawPush(node);};
  // A list marker (Word's "listtext", older "pntext") comes before its paragraph's text; it is kept beside the
  // paragraph with the paragraph's left indent so consecutive marked paragraphs can be rebuilt into lists.
  let marker=null;
  const ensure=()=>paragraph??={...(marker?.trim()?{_list:marker.trim()}:{}),_li:state.li,...(marker=null,{}),type:state.heading===null?'paragraph':'heading',attrs:{textAlign:state.align,...paragraphShape(state.li,state.fi),...(rightSteps(state.ri)?{rightIndent:rightSteps(state.ri)}:{}),...(state.sb!==null?{spaceBefore:state.sb}:{}),...(state.sa!==null?{spaceAfter:state.sa}:{}),...(state.heading===null?{}:{level:state.heading})},content:[]};
  const flush=(force=false)=>{if(paragraph||force){const node=paragraph??{type:'paragraph',attrs:{textAlign:state.align}};paragraph=null;if(node._anchor===undefined&&pendingAnchor&&node.content?.length){node._anchor=pendingAnchor;}pendingAnchor=null;if(node._anchor!==undefined){if(node.type==='heading')node.attrs.anchor=node._anchor;delete node._anchor;}if(state.intbl){if(++nodes>LIMITS.DOCUMENT_NODES)throw new Error('RTF content exceeds the 200,000 element limit.');cellParagraphs.push(node);}else push(node);}};
  const endCell=()=>{if(paragraph||!cellParagraphs.length)flush(true);rowCells.push(cellParagraphs);cellParagraphs=[];};
  const endRow=()=>{if(cellParagraphs.length||paragraph)endCell();table??={rows:[]};if(table.rows.length>=LIMITS.TABLE_ROWS)throw new Error('RTF tables are limited to 1,000 rows.');table.rows.push({defs:rowDefs,header:!!rowDefs.header,cells:rowCells});rowCells=[];};
  function append(value){
    if(state.skip||state.hidden)return;
    if(state.dest==='bkmkstart'){if(state.bookmark.name.length<40)state.bookmark.name+=value;return;}
    if(state.dest==='pict'){const hex=value.replace(/[^0-9a-f]/gi,'');if(state.pict.length+hex.length>2*LIMITS.IMAGE_STORED_BYTES)state.pict.kind='large';else{state.pict.hex.push(hex);state.pict.length+=hex.length;}return;}
    if(state.dest==='pdfixalt'){if(state.pict&&state.pict.alt.length<500)state.pict.alt+=value;return;}
    if(state.dest==='listtext'){if(!state.band&&(marker??'').length<20)marker=(marker??'')+value;return;}
    if(state.dest==='fonttbl')return;
    if(state.dest==='colortbl'){for(const char of value)if(char===';'){if(colors.length>=256)throw new Error('RTF color table exceeds 256 entries.');colors.push(hasColor?'#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join(''):null);rgb=[0,0,0];hasColor=false;}return;}
    const entry=fonts.get(state.font);if(entry?.charset&&! [0,1].includes(entry.charset))throw new Error('This RTF uses a font character set that is not supported yet. Export a Unicode DOCX copy first.');
    if(state.band){const band=state.band;if(band.reason)return;if(band.fieldLines.has(band.text.split('\n').length-1)){if(value==='\n')band.text+=value;else if(!/^[\s/]*$/.test(value))band.reason='page fields mixed with authored text';return;}if(!['left','center','right'].includes(state.align)||band.align!==null&&band.align!==state.align){band.reason='mixed or unsupported alignment';return;}band.align=state.align;if(band.text.length+value.length>121){band.reason='text exceeds the 120-character bound';return;}band.text+=value;return;}
    // Field instructions are collected for the link target and never become document text.
    if(state.dest==='fldinst'){if(state.field&&state.field.instruction.length<2200)state.field.instruction+=value;return;}
    if((textSize+=value.length)>LIMIT)throw new Error('The RTF text is larger than PDFix can edit.');
    const marks=[];for(const type of ['bold','italic','underline','strike'])if(state[type]&&!(type==='underline'&&state.link))marks.push({type});if(state.script)marks.push({type:state.script});{const highlight=state.highlight?highlightFromHex(colors[state.highlight]):null;if(highlight)marks.push({type:'highlight',attrs:{color:highlight}});}if(state.link)marks.push({type:'documentLink',attrs:{href:state.link}});
    const size=Math.max(8,Math.min(72,state.size/2));if(size!==state.size/2)warn('Font sizes outside 8–72 pt were adjusted.');
    marks.push({type:'documentTextStyle',attrs:{font:entry?.family??'sans',size,color:colors[state.color]??null}});
    const p=ensure(),last=p.content.at(-1);if(last?.type==='text'&&JSON.stringify(last.marks)===JSON.stringify(marks))last.text+=value;
    else {if(++nodes>LIMITS.DOCUMENT_NODES)throw new Error('RTF content exceeds the element limit.');p.content.push({type:'text',text:value,marks});}
  }
  function character(value){if(skipFallback){skipFallback--;return;}append(value);}
  function control(word,n){
    // A standalone PAGE/NUMPAGES paragraph in a header/footer is dropped with its cached value; the rest of the band is kept.
    if(word==='field'&&state.band&&!state.skip){const band=state.band,line=band.text.split('\n').length-1;if(band.text.split('\n')[line].trim())band.reason='page fields mixed with authored text';band.fieldLines.add(line);state.skip=true;state.bandField=true;return;}
    // Body hyperlinks: {\field{\*\fldinst HYPERLINK "address"}{\fldrslt visible text}}. Only web and email addresses become links.
    if(word==='field'&&!state.band&&!state.skip){state.field={instruction:''};return;}
    if(word==='fldinst'&&state.star&&state.field&&!state.band&&!state.skip){state.star=false;state.dest='fldinst';return;}
    if(word==='fldrslt'&&state.field&&!state.band&&!state.skip){const internal=/^\s*HYPERLINK\s+\\l\s+"([^"\s]+)"\s*$/.exec(state.field.instruction),match=internal??/^\s*HYPERLINK\s+"([^"\s]+)"\s*$/.exec(state.field.instruction);if(match)try{state.link=internal?'#'+validDocumentAnchor(match[1]):validDocumentLink(match[1]);}catch{warn('A link with an unsupported address was kept as plain text.');}else if(state.field.instruction.trim())warn('Fields other than web or email links were kept as their visible text.');return;}
    // Pictures: PNG pictures become document images. Word wraps them in a starred shppict group with a nonshppict
    // fallback copy, which stays skipped. Starred groups inside a picture (ids, properties) are skipped except PDFix's alt text.
    // A bookmark names the heading it sits in, so links to it (HYPERLINK \\l) can find it again.
    if(word==='bkmkstart'&&state.star&&!state.band&&!state.skip){state.star=false;state.dest='bkmkstart';state.bookmark={name:''};return;}
    if(word==='shppict'&&state.star&&!state.band&&!state.skip){state.star=false;state.dest='shppict';return;}
    if(word==='pict'&&!state.band&&!state.skip){state.star=false;state.dest='pict';state.pict={kind:null,widthGoal:0,heightGoal:0,hex:[],length:0,alt:''};return;}
    if(state.dest==='pict'&&!state.skip){if(word==='pdfixalt'&&state.star){state.star=false;state.dest='pdfixalt';return;}if(state.star){state.star=false;state.skip=true;return;}if(word==='pngblip')state.pict.kind='png';else if(word==='jpegblip')state.pict.kind='jpeg';else if(['wmetafile','emfblip','macpict','dibitmap','wbitmap','pmmetafile'].includes(word))state.pict.kind='other';else if(word==='picwgoal')state.pict.widthGoal=n;else if(word==='pichgoal')state.pict.heightGoal=n;return;}
    if(state.star){state.star=false;state.skip=true;if(state.band&&!state.bandField)state.band.reason='optional or rich destinations';if(!state.bandField)warn('Optional RTF destinations were omitted.');}
    if((word==='header'||word==='footer')&&!state.skip){if(state.band){state.band.reason='nested header/footer destinations';state.skip=true;return;}const band={text:'',align:null,reason:null,fieldLines:new Set()};if(sourceBands[word].length>=50)throw new Error('RTF header/footer declarations exceed 50 per location.');sourceBands[word].push(band);state.band=band;state.align='left';state.dest=word;return;}
    if(['headerl','headerr','headerf','footerl','footerr','footerf','titlepg','facingp'].includes(word))warn('Original first/even/odd header/footer behavior is omitted; imported default text repeats on every page.');
    if(OMIT.has(word)){state.skip=true;if(state.bandField)return;if(state.band)state.band.reason='images, fields, objects or rich destinations';warn('Images, objects, document metadata or complex formatting were omitted.');return;}
    if(word==='fonttbl'||word==='colortbl'){state.dest=word;return;}
    if(word==='rtf'&&n!==1)throw new Error('Only RTF version 1 is supported.');
    if(word==='upr')throw new Error('This RTF uses alternate Unicode groups. Export a Unicode DOCX copy first.');
    if(word==='bin'){if(!Number.isSafeInteger(n)||n<0||at+n>source.length)throw new Error('Damaged RTF binary data.');at+=n;if(state.band)state.band.reason='embedded binary content';warn('Embedded binary content was omitted.');return;}
    if(state.skip)return;
    if(word==='ansicpg'&&n!==1252)throw new Error('This RTF uses an unsupported ANSI code page. Export a Unicode DOCX copy first.');
    if(['mac','pc','pca'].includes(word))throw new Error('This RTF character encoding is not supported yet.');
    if(state.dest==='fonttbl'){
      if(word==='f'){state.fontId=n;state.fontFamily='sans';state.charset=0;if(fonts.size>=256&&!fonts.has(n))throw new Error('RTF font table exceeds 256 entries.');fonts.set(n,{family:'sans',charset:0});}
      if(['fmodern','froman','fswiss'].includes(word))state.fontFamily={fmodern:'mono',froman:'serif',fswiss:'sans'}[word];
      if(word==='fcharset')state.charset=n;
      if(state.fontId!==null)fonts.set(state.fontId,{family:state.fontFamily,charset:state.charset});return;
    }
    if(['paperw','paperh','margl','margr','margt','margb'].includes(word)&&!state.band&&stack.length===1&&Number.isInteger(n)&&!Object.hasOwn(pageSetup,word)){pageSetup[word]=n;return;}
    if(state.dest==='colortbl'){const i={red:0,green:1,blue:2}[word];if(i!==undefined){if(!Number.isInteger(n)||n<0||n>255)throw new Error('Invalid RTF color.');rgb[i]=n;hasColor=true;}return;}
    if(word==='uc'){if(!Number.isInteger(n)||n<0||n>16)throw new Error('Unsupported Unicode fallback count.');state.uc=n;return;}
    if(word==='u'){if(!Number.isInteger(n)||n< -32768||n>65535)throw new Error('Invalid RTF Unicode character.');append(String.fromCharCode(n&65535));skipFallback=state.uc;return;}
    if(skipFallback){skipFallback--;return;}
    if(state.band){
      if(word==='pard'||word==='plain'){state.align=word==='pard'?'left':state.align;return;}
      if(['ql','qc','qr'].includes(word)){state.align={ql:'left',qc:'center',qr:'right'}[word];return;}
      if(word==='par'||word==='line'){append('\n');return;}
      if(word==='f'){state.font=n;return;}
      if(['fs','sl','slmult','sa','sb','li','ri','fi','keep','keepn','widctlpar','nowidctlpar','lang','langfe','langnp','kerning','expnd','expndtw'].includes(word))return;
      if((['b','i','ul','strike','v','highlight'].includes(word)&&n===0)||word==='ulnone'||word==='cf')return;
      state.band.reason='fields, rich formatting or unsupported controls';return;
    }
    if(['b','i','ul','strike','v'].includes(word)){state[{b:'bold',i:'italic',ul:'underline',strike:'strike',v:'hidden'}[word]]=n!==0;if(word==='v')warn('Hidden text was omitted.');}
    else if(word==='ulnone')state.underline=false;
    else if(word==='super'||word==='sub')state.script=word==='super'?'superscript':'subscript';
    else if(word==='nosupersub')state.script=null;
    else if(word==='highlight')state.highlight=Number.isInteger(n)&&n>0?n:0;
    else if(word==='deff'){defaultFont=n;state.font=n;}
    else if(word==='f')state.font=n;
    else if(word==='fs'){if(!Number.isInteger(n)||n<=0||n>32767)throw new Error('Invalid RTF font size.');state.size=n;}
    else if(word==='cf')state.color=n;
    else if(word==='plain')Object.assign(state,{bold:false,italic:false,underline:false,strike:false,script:null,highlight:0,font:defaultFont,size:24,color:0,hidden:false});
    else if(word==='pard'){state.intbl=false;state.align='left';state.heading=null;state.li=0;state.fi=0;state.ri=0;state.sb=null;state.sa=null;if(paragraph){paragraph.type='paragraph';paragraph.attrs={textAlign:'left'};}}
    else if(['ql','qc','qr','qj'].includes(word)){state.align={ql:'left',qc:'center',qr:'right',qj:'justify'}[word];if(paragraph)paragraph.attrs.textAlign=state.align;}
    else if(word==='outlinelevel'&&n>=0&&n<=5){state.heading=n+1;if(paragraph){paragraph.type='heading';paragraph.attrs.level=n+1;}}
    else if(word==='sb'||word==='sa'){const points=Number.isInteger(n)?n/20:null,name=word==='sb'?'spaceBefore':'spaceAfter';state[word]=PARAGRAPH_SPACES.includes(points)?points:null;if(paragraph){if(state[word]!==null)paragraph.attrs[name]=state[word];else delete paragraph.attrs[name];}}
    else if(word==='ri'){state.ri=Number.isInteger(n)&&n>0?n:0;if(paragraph){const steps=rightSteps(state.ri);if(steps)paragraph.attrs.rightIndent=steps;else delete paragraph.attrs.rightIndent;}}
    else if(word==='li'||word==='fi'){state[word]=Number.isInteger(n)?word==='li'?Math.max(0,n):n:0;if(paragraph){delete paragraph.attrs.indent;delete paragraph.attrs.firstLine;Object.assign(paragraph.attrs,paragraphShape(state.li,state.fi));}}
    else if(word==='par')flush(true);
    else if(word==='row')endRow();
    else if(word==='cell'){if(state.intbl)endCell();else append('\t');}
    else if(word==='page'||word==='sect'){if(word==='sect')sectionBreaks++;flush();push({type:'pageBreak'});}
    else if(word==='pagebb'){flush();push({type:'pageBreak'});}
    else if(word==='line'){const p=ensure();if(++nodes>LIMITS.DOCUMENT_NODES)throw new Error('RTF content exceeds the element limit.');p.content.push({type:'hardBreak'});}
    else if(word==='tab')append('\t');
    else if(['emdash','endash','bullet','lquote','rquote','ldblquote','rdblquote'].includes(word))append({emdash:'—',endash:'–',bullet:'•',lquote:'‘',rquote:'’',ldblquote:'“',rdblquote:'”'}[word]);
    else if(word==='listtext'||word==='pntext'){if(!state.band){state.dest='listtext';marker='';}}
    else if(word==='trowd'){rowDefs=[];pendingCell={};}
    else if(word==='trhdr')rowDefs.header=true;
    else if(['clmgf','clmrg','clvmgf','clvmrg'].includes(word))pendingCell[word]=true;
    else if(word==='clcbpat')pendingCell.shade=Number.isInteger(n)?n:0;
    else if(word==='cellx'){if(rowDefs.length>=32)throw new Error('RTF tables are limited to 32 columns.');rowDefs.push({right:Number.isInteger(n)?n:0,...pendingCell});pendingCell={};}
    else if(word==='intbl')state.intbl=true;
    else if(['nestcell','nestrow','nesttableprops'].includes(word)){table??={rows:[]};table.nested=true;warn('Nested tables are not supported; their text is kept.');}
  }
  while(at<source.length){
    if(++tokens>500000)throw new Error('RTF exceeds the processing limit.');
    const c=source[at++];if(rootClosed){if(!/\s/.test(c))throw new Error('Unexpected content after the RTF document.');continue;}
    if(c==='{'){if(stack.length>=64)throw new Error('RTF nesting exceeds 64 groups.');stack.push(state);state={...state,star:false};skipFallback=0;continue;}
    if(c==='}'){if(!stack.length)throw new Error('Unbalanced RTF groups.');const closing=state;state=stack.pop();if(closing.dest==='pict'&&state.dest!=='pict'&&closing.pict)picture(closing.pict);if(closing.dest==='bkmkstart'&&closing.bookmark){const name=closing.bookmark.name.trim();if(/^[A-Za-z_][A-Za-z0-9_.-]{0,39}$/.test(name)){if(paragraph)paragraph._anchor??=name;else pendingAnchor??=name;}}skipFallback=0;if(!stack.length)rootClosed=true;continue;}
    if(c==='\r'||c==='\n')continue;
    if(c!=='\\'){if(c.charCodeAt(0)<32&&c!=='\t')throw new Error('Unsupported control character in RTF text.');character(c);continue;}
    if(at>=source.length)throw new Error('Incomplete RTF escape.');const next=source[at++];
    if(next==="'"){const hex=source.slice(at,at+2);if(!/^[0-9a-f]{2}$/i.test(hex))throw new Error('Invalid RTF byte escape.');at+=2;character(decoder.decode(Uint8Array.of(parseInt(hex,16))));continue;}
    if(!/[a-z]/i.test(next)){if(next==='*')state.star=true;else if(next==='\\'||next==='{'||next==='}')character(next);else if(next==='~')character('\u00a0');else if(next==='_')character('\u2011');else if(next==='-')character('\u00ad');else if(next==='\n'||next==='\r')control('par');continue;}
    let word=next;while(at<source.length&&/[a-z]/i.test(source[at])){if(word.length>=64)throw new Error('Invalid RTF control word.');word+=source[at++];}
    let digits='';if(source[at]==='-')digits+=source[at++];while(at<source.length&&/[0-9]/.test(source[at])){if(digits.length>=12)throw new Error('Invalid RTF control value.');digits+=source[at++];}
    const n=digits?Number(digits):undefined;if(digits==='-'||digits&&!Number.isSafeInteger(n))throw new Error('Invalid RTF control value.');if(source[at]===' ')at++;control(word,n);
  }
  if(stack.length||!rootClosed)throw new Error('The RTF document is incomplete.');flush();if(rowCells.length||cellParagraphs.length)endRow();closeTable();if(!content.length)push({type:'paragraph'});
  const doc={type:'doc',content:rebuildLists(content)};if(JSON.stringify(doc).length>LIMIT)throw new Error('The formatted RTF document is larger than PDFix can edit.');
  const bands={header:null,footer:null};for(const location of ['header','footer']){const entries=sourceBands[location];if(!entries.length)continue;if(sectionBreaks||entries.length!==1){warn(`Original ${location} omitted: multiple sections or default declarations are unsupported.`);continue;}const item=entries[0];try{if(item.reason)throw new Error(item.reason);const text=item.text.split('\n').filter((line,index)=>!item.fieldLines.has(index)).join('\n').replace(/\n+$/,'');if(!text&&item.fieldLines.size)continue;const band={text,align:item.align??'left'};importedBandLayout(defaultDocumentLayout(),{header:location==='header'?band:null,footer:location==='footer'?band:null});bands[location]=band;warn(`Imported plain default ${location} text/alignment; source fonts, colors, spacing and placement are simplified to Page setup.`);}catch(error){warn(`Original ${location} omitted: ${String(error.message).slice(0,400)}.`);}}
  warn('Original header/footer page-number fields and cached field values are omitted. Add numbering in Page setup.');
  warn('Fonts are mapped to Arial, Times New Roman or Consolas. Original page layout and unsupported features are simplified. Review before exporting.');
  // Document-level page size and side margins, when they match a listed paper size and there is one section.
  let page=null;if(Object.hasOwn(pageSetup,'paperw')&&Object.hasOwn(pageSetup,'paperh')){const matched=sectionBreaks?null:documentPageFromTwips(pageSetup.paperw,pageSetup.paperh,pageSetup.margl,pageSetup.margr,pageSetup.margt,pageSetup.margb);if(matched){page=matched.page;warn(matched.margins==='imported'?'Imported page size, orientation and side margins.':'Imported page size and orientation; side margins use the default.');}else warn('Original page size omitted: it is not a listed paper size or the document has several sections.');}
  return {doc,bands,...(page?{page}:{}),warnings:[...warnings]};
}

// Consecutive paragraphs with a list marker become lists: a number marker ("3." or "3)") an ordered list starting
// there, anything else a bulleted list. A deeper left indent nests a list in the previous item, and an unmarked
// paragraph at an open item's indent continues that item. Anything else ends the lists.
function rebuildLists(nodes){
  const out=[];let stack=[];
  const plainParagraph=node=>{if(node.type==='heading'){node.type='paragraph';delete node.attrs.level;}if(node.attrs){delete node.attrs.indent;delete node.attrs.firstLine;}return node;};
  for(const node of nodes){
    const marker=node._list,li=node._li;delete node._list;delete node._li;
    if(marker!==undefined){
      const number=/^(\d{1,7})[.)]$/.exec(marker),type=number?'orderedList':'bulletList';
      while(stack.length&&stack.at(-1).li>li)stack.pop();
      if(stack.length&&stack.at(-1).li===li&&stack.at(-1).list.type!==type)stack.pop();
      let top=stack.at(-1);
      if(!top||top.li<li){const start=number?Number(number[1]):1,list={type,...(type==='orderedList'&&start>1&&start<=1000000?{attrs:{start}}:{}),content:[]};if(top)top.item.content.push(list);else out.push(list);top={li,list,item:null};stack.push(top);}
      const item={type:'listItem',content:[plainParagraph(node)]};top.list.content.push(item);top.item=item;continue;
    }
    const open=li===undefined||node.type!=='paragraph'?-1:stack.findIndex(entry=>entry.li===li);
    if(open>=0){stack[open].item.content.push(plainParagraph(node));stack=stack.slice(0,open+1);continue;}
    stack=[];out.push(node);
  }
  return out;
}
// Builds a table node from collected RTF rows, or returns null when the rows cannot form a rectangular table.
function tableFromRows(rows,colors){
  const width=rows[0]?.defs.length??0;if(!width||rows.some(row=>row.defs.length!==width||row.cells.length!==width))return null;
  const grid=rows.map(()=>Array(width).fill(null)),edges=rows[0].defs.map(def=>def.right),weights=edges.map((right,index)=>right-(index?edges[index-1]:0)),out=[];
  for(let y=0;y<rows.length;y++){const row=rows[y],content=[];
    for(let x=0;x<width;x++){const def=row.defs[x];
      if(def.clmrg&&x>0&&grid[y][x-1]){const left=grid[y][x-1];grid[y][x]=left;if(left._y===y)left.attrs.colspan++;continue;}
      if(def.clvmrg&&y>0&&grid[y-1][x]){const above=grid[y-1][x];grid[y][x]=above;if(above._x===x)above.attrs.rowspan++;continue;}
      const cell={type:row.header?'tableHeader':'tableCell',attrs:{colspan:1,rowspan:1,colwidth:null,background:colors[def.shade]??null},content:rebuildLists(row.cells[x].length?row.cells[x]:[{type:'paragraph'}]),_x:x,_y:y};grid[y][x]=cell;content.push(cell);}
    out.push({type:'tableRow',content});}
  for(const row of out)for(const cell of row.content){delete cell._x;delete cell._y;}
  const node={type:'table',attrs:{columnGridTwips:weights.every(weight=>Number.isInteger(weight)&&weight>=1&&weight<=30000)?weights:null},content:out};
  try{tableGeometry(node);}catch{return null;}return node;
}
function escapeRtf(text){let result='';for(let i=0;i<text.length;i++){const c=text[i],n=text.charCodeAt(i);result+=c==='\\'||c==='{'||c==='}'?'\\'+c:c==='\n'?'\\line ':c==='\t'?'\\tab ':c==='\f'?'\\page ':n>=32&&n<=126?c:'\\u'+(n>32767?n-65536:n)+'?';}return result;}
export function exportRtf(doc,settings=defaultDocumentLayout()){
  validateDocumentTables(doc);validateDocumentImages(doc);const layout=documentLayout(settings),colors=[],fontIds={sans:0,serif:1,mono:2};let nodes=0;
  const bounded=(node,depth)=>{if(++nodes>LIMITS.DOCUMENT_NODES||depth>64)throw new Error('Document exceeds RTF export limits.');if(!node||typeof node.type!=='string')throw new Error('Invalid document element.');};
  const colorId=color=>{if(!/^#[0-9a-f]{6}$/i.test(color))throw new Error('Invalid text color.');color=color.toLowerCase();if(!colors.includes(color)){if(colors.length>=255)throw new Error('RTF supports up to 255 chosen text colors.');colors.push(color);}return colors.indexOf(color)+1;};
  function inline(node,depth,baseSize){bounded(node,depth);if(node.type==='documentImage'){const a=validateDocumentImage(node.attrs),{bytes,mime}=imageDataBytes(a.src);let hex='';for(const byte of bytes)hex+=byte.toString(16).padStart(2,'0');
      // A real PNG picture at its displayed size (96 pixels per inch); the alt text rides in a starred group other readers skip.
      return '{\\pict'+(mime==='image/jpeg'?'\\jpegblip':'\\pngblip')+'\\picw'+a.pixelWidth+'\\pich'+a.pixelHeight+'\\picwgoal'+Math.round(a.width*15)+'\\pichgoal'+Math.round(a.height*15)+(a.alt?'{\\*\\pdfixalt '+escapeRtf(a.alt)+'}':'')+'\n'+hex.replace(/(.{128})/g,'$1\n')+'}';}if(node.type==='hardBreak')return '\\line ';if(node.type!=='text')throw new Error('Unsupported RTF inline element.');if(typeof node.text!=='string')throw new Error('Invalid document text.');let control='',link=null;
    for(const mark of node.marks??[]){if(['bold','italic','underline','strike','code'].includes(mark.type))control+={bold:'\\b ',italic:'\\i ',underline:'\\ul ',strike:'\\strike ',code:'\\f2 '}[mark.type];else if(mark.type==='superscript'||mark.type==='subscript')control+=mark.type==='superscript'?'\\super ':'\\sub ';else if(mark.type==='highlight')control+='\\highlight'+colorId(HIGHLIGHTS[validHighlight(mark.attrs?.color)].hex)+' ';else if(mark.type==='documentTextStyle'){const a=mark.attrs??{};if(a.font){if(!Object.hasOwn(fontIds,a.font))throw new Error('Invalid RTF font.');control+='\\f'+fontIds[a.font]+' ';}if(a.size!==undefined&&a.size!==null){if(!Number.isFinite(a.size)||a.size<8||a.size>72)throw new Error('Invalid RTF text size.');control+='\\fs'+Math.round(a.size*2)+' ';}if(a.color)control+='\\cf'+colorId(a.color)+' ';}else if(mark.type==='documentLink')link=validLinkTarget(mark.attrs?.href);else throw new Error('Unsupported RTF text formatting.');}
    if(link)return '{\\field{\\*\\fldinst HYPERLINK '+(isInternalLink(link)?'\\\\l "'+escapeRtf(link.slice(1)):'"'+escapeRtf(link))+'"}{\\fldrslt {\\fs'+Math.round(baseSize*2)+' \\ul '+control+escapeRtf(node.text)+'}}}';
    return '{\\fs'+Math.round(baseSize*2)+' '+control+escapeRtf(node.text)+'}';
  }
  function block(node,depth=0,prefix='',indent=0){bounded(node,depth);if(node.type==='table'){
      // A real RTF table: per row, cell definitions (merges, shading, borders, right edge) then each cell's paragraphs
      // marked \intbl, the last ending the cell. Column widths follow the document's column grid across the text width.
      const geometry=tableGeometry(node),entries=new Map(geometry.cells.map(e=>[e.cell,e])),paper=documentPaperSize(layout),margins=documentPageMargins(layout),available=Math.max(geometry.width,Math.min(100000,Math.round((paper[0]-margins.left-margins.right)*1440/25.4))),widths=tableColumnWidths(node,available),edges=[];
      widths.reduce((sum,width,index)=>edges[index]=sum+width,0);const border='\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10';
      return geometry.grid.map((row,y)=>{let defs='\\trowd\\trgaph108\\trleft0'+(row.every(cell=>cell.type==='tableHeader')?'\\trhdr':''),cells='';
        row.forEach((cell,x)=>{const entry=entries.get(cell);defs+=(entry.cols>1?(x===entry.x?'\\clmgf':'\\clmrg'):'')+(entry.rows>1?(y===entry.y?'\\clvmgf':'\\clvmrg'):'')+(cell.attrs?.background?'\\clcbpat'+colorId(cell.attrs.background):'')+border+'\\cellx'+edges[x];
          if(x===entry.x&&y===entry.y)cells+=(cell.content??[]).map(child=>block(child,depth+2)).join('').replace(/^\\pard/gm,'\\pard\\intbl').replace(/\\par\n$/,'\\cell\n');else cells+='\\pard\\intbl\\cell\n';});
        return defs+'\n'+cells+'\\row\n';}).join('');}if(node.type==='pageBreak')return '\\page\n';
    if(['paragraph','heading','codeBlock'].includes(node.type)){const size=node.type==='heading'?Math.min(72,layout.size*({1:1.9,2:1.5,3:1.2}[node.attrs?.level]??1)):layout.size;const align={left:'ql',center:'qc',right:'qr',justify:'qj'}[node.attrs?.textAlign??'left'];if(!align)throw new Error('Invalid RTF paragraph alignment.');const format=node.type==='codeBlock'?{indent:0,lineSpacing:null,spaceBefore:null,spaceAfter:null,firstLine:null,rightIndent:0}:validParagraphFormat(node.attrs),offsets=paragraphOffsets(format);return '\\pard\\'+align+'\\li'+(Math.min(indent,8)*360+offsets.left*INDENT_TWIPS)+(offsets.firstLine?'\\fi'+offsets.firstLine*INDENT_TWIPS:'')+(offsets.right?'\\ri'+offsets.right*INDENT_TWIPS:'')+'\\f'+(node.type==='codeBlock'?2:fontIds[layout.font])+'\\fs'+Math.round(size*2)+(node.type==='heading'?'\\outlinelevel'+Math.max(0,Math.min(5,(node.attrs?.level??1)-1)):'')+'\\sl'+Math.round(layout.size*20*(format.lineSpacing??layout.lineHeight))+'\\slmult0'+(format.spaceBefore!==null?'\\sb'+format.spaceBefore*20:'')+(format.spaceAfter!==null?'\\sa'+format.spaceAfter*20:'')+' '+(node.type==='heading'&&node.attrs?.anchor?'{\\*\\bkmkstart '+validDocumentAnchor(node.attrs.anchor)+'}{\\*\\bkmkend '+node.attrs.anchor+'}':'')+(prefix?'{\\listtext '+escapeRtf(prefix)+'}':'')+(node.content??[]).map(child=>inline(child,depth+1,size)).join('')+'\\par\n';}
    if(node.type==='bulletList'||node.type==='orderedList'){const start=node.attrs?.start??1;if(!Number.isSafeInteger(start)||start<1||start>1000000)throw new Error('Invalid list start.');return (node.content??[]).map((item,i)=>{bounded(item,depth+1);if(item.type!=='listItem')throw new Error('Invalid list item.');return (item.content??[]).map((child,j)=>block(child,depth+2,j?'':node.type==='bulletList'?'•\t':`${start+i}.\t`,indent+1)).join('');}).join('');}
    if(node.type==='doc'||node.type==='blockquote')return (node.content??[]).map(child=>block(child,depth+1,prefix,indent+(node.type==='blockquote'?1:0))).join('');
    if(node.type==='horizontalRule')return '\\pard '+escapeRtf('——————————')+'\\par\n';throw new Error('Unsupported document element for RTF export.');
  }
  if(JSON.stringify(doc).length>LIMIT)throw new Error('RTF export is limited to 2 MB of editor content.');const body=block(doc),dimensions=documentPaperSize(layout).map(mm=>Math.round(mm*1440/25.4));  const pageMargins=documentPageMargins(layout),twips=value=>Math.round(value*1440/25.4),band=location=>{const paragraphs=documentBandParagraphs(layout,location),numbers=layout.pageNumbers&&layout.pageNumberPlacement===location;if(!paragraphs.length&&!numbers)return '';const align={left:'ql',center:'qc',right:'qr'};const content=paragraphs.map(paragraph=>'\\pard\\'+align[paragraph.align]+'\\sl'+Math.ceil(Math.max(...paragraph.runs.map(run=>run.size))*25)+'\\slmult0 '+paragraph.runs.map(run=>'{\\f'+fontIds[run.font]+'\\fs'+Math.round(run.size*2)+'\\cf'+colorId(run.color)+(run.bold?'\\b ':'\\b0 ')+(run.italic?'\\i ':'\\i0 ')+(run.underline?'\\ul ':'\\ul0 ')+escapeRtf(run.text)+'}').join('')+'\\par ').join('');const pages=numbers?'\\pard\\'+align[layout.pageNumberAlign]+'\\f'+fontIds[layout.font]+'\\fs18\\sl225\\slmult0 {\\field{\\*\\fldinst PAGE}{\\fldrslt 1}} / {\\field{\\*\\fldinst NUMPAGES}{\\fldrslt 1}}\\par ':'';return '{\\'+location+' '+content+pages+'}';};
  const header=band('header'),footer=band('footer');
  const colorTable='{\\colortbl;'+colors.map(color=>'\\red'+parseInt(color.slice(1,3),16)+'\\green'+parseInt(color.slice(3,5),16)+'\\blue'+parseInt(color.slice(5,7),16)+';').join('')+'}';
  const result='{\\rtf1\\ansi\\ansicpg1252\\deff'+fontIds[layout.font]+'\\uc1{\\fonttbl{\\f0\\fswiss\\fcharset0 Arial;}{\\f1\\froman\\fcharset0 Times New Roman;}{\\f2\\fmodern\\fcharset0 Consolas;}}'+colorTable+'\\paperw'+dimensions[0]+'\\paperh'+dimensions[1]+(layout.landscape?'\\landscape':'')+'\\margl'+twips(pageMargins.left)+'\\margr'+twips(pageMargins.right)+'\\margt'+twips(pageMargins.top)+'\\margb'+twips(pageMargins.bottom)+'\\headery'+twips(pageMargins.header)+'\\footery'+twips(pageMargins.footer)+' '+header+footer+'\n'+body+'}';
  if(result.length>LIMITS.RTF_OUTPUT_BYTES)throw new Error('The RTF copy would be too large. Export a DOCX copy instead.');return new TextEncoder().encode(result);
}
