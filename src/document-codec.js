import LIMITS from '../desktop/document-limits.cjs';
import {documentBandParagraphs,documentBandFonts} from './document-band-model.js';
import {validateDocumentImages,validateDocumentImage,imageDataBytes} from './document-image-model.js';
import {tableGeometry,validateDocumentTables,tableColumnWidths} from './document-table-model.js';
import {documentLayout,defaultDocumentLayout,documentPageMargins,documentPaperSize} from './document-layout-model.js';
import {validLinkTarget,validDocumentAnchor,isInternalLink} from './document-link-model.js';
import {HIGHLIGHTS,validHighlight} from './document-mark-model.js';
import {validParagraphFormat,paragraphOffsets,INDENT_TWIPS} from './document-paragraph-model.js';
import {documentSnapshot,SNAPSHOT_PROPERTY,SHA_PROPERTY} from './document-snapshot.js';

export function textDocument(text){const content=[];text.split(/\r?\n/).forEach(line=>line.split('\f').forEach((part,index)=>{if(index)content.push({type:'pageBreak'});content.push({type:'paragraph',...(part?{content:[{type:'text',text:part}]}:{})});}));return {type:'doc',content};}
export function plainText(doc){
  function inline(node){if(node.type==='documentImage')return '[Image'+(node.attrs?.alt?': '+node.attrs.alt:'')+']';return node.type==='text'?node.text:node.type==='hardBreak'?'\n':(node.content||[]).map(inline).join('');}
  function blocks(node){if(node.type==='table'){const g=tableGeometry(node),origins=new Map(g.cells.map(e=>[e.cell,e]));return g.grid.map((row,y)=>row.map((cell,x)=>{const entry=origins.get(cell);return entry.x===x&&entry.y===y?(cell.content||[]).map(blocks).join(' / '):'';}).join('\t')).join('\n');}if(node.type==='pageBreak')return '\f';if(['paragraph','heading','codeBlock'].includes(node.type))return inline(node);return (node.content||[]).map(blocks).join('\n');}
  return blocks(doc);
}
export function checkDocxArchive(bytes){
  if(bytes.length>LIMITS.WORD_IMPORT_BYTES)throw new Error('DOCX files up to 100 MB can be opened for editing.');
  const data=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(data.getUint32(i,true)===0x06054b50){end=i;break;}
  if(end<0||end+22+data.getUint16(end+20,true)!==bytes.length)throw new Error('This DOCX archive is damaged or unsupported.');
  const count=data.getUint16(end+10,true),offset=data.getUint32(end+16,true),size=data.getUint32(end+12,true);
  if(data.getUint16(end+4,true)||data.getUint16(end+6,true)||count>2000||offset+size>end)throw new Error('Multipart, large or unsupported DOCX archive.');
  let at=offset,expanded=0;const names=new Set();
  for(let i=0;i<count;i++){
    if(at+46>end||data.getUint32(at,true)!==0x02014b50)throw new Error('The DOCX file index is damaged.');
    const flags=data.getUint16(at+8,true),method=data.getUint16(at+10,true),length=data.getUint16(at+28,true),extra=data.getUint16(at+30,true),comment=data.getUint16(at+32,true);expanded+=data.getUint32(at+24,true);
    if(at+46+length+extra+comment>end||flags&1||![0,8].includes(method)||expanded>LIMITS.DOCX_EXPANDED_BYTES)throw new Error('Encrypted or excessively expanded DOCX content is not supported.');
    const name=new TextDecoder().decode(bytes.subarray(at+46,at+46+length));
    if(names.has(name)||name.includes('..')||name.includes('\\')||name.startsWith('/')||/vbaProject|\.bin$/i.test(name))throw new Error('This DOCX has unsafe or unsupported embedded content.');
    names.add(name);at+=46+length+extra+comment;
  }
  if(at!==offset+size||!names.has('word/document.xml')||!names.has('[Content_Types].xml'))throw new Error('The archive does not contain a supported Word document.');
  return true;
}
export async function exportDocx(json,settings=defaultDocumentLayout()){
  const layout=documentLayout(settings);validateDocumentTables(json);validateDocumentImages(json);
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, LevelFormat, PageBreak,PageOrientation,Header,Footer,PageNumber,Table,TableRow,TableCell,WidthType,TableLayoutType,ImageRun,ExternalHyperlink,InternalHyperlink,Bookmark }=await import('docx');
  const paragraphs=[];const paper=documentPaperSize({paper:layout.paper,customSize:layout.customSize}).map(mm=>Math.round(mm*1440/25.4)),sides=documentPageMargins(layout),available=(layout.landscape?paper[1]:paper[0])-Math.round((sides.left+sides.right)*1440/25.4);let counter=0;const font={sans:'Arial',serif:'Times New Roman',mono:'Consolas'}[layout.font];
  function runs(node,baseSize=node.type==='heading'?layout.size*({1:1.9,2:1.5,3:1.2}[node.attrs?.level]??1):layout.size,header=false,imageWidth=available/15){return (node.content||[]).flatMap(child=>{
    if(child.type==='documentImage'){const a=validateDocumentImage(child.attrs),width=Math.max(8,Math.min(a.width,imageWidth));return [new ImageRun({...(picture=>({type:picture.mime==='image/jpeg'?'jpg':'png',data:picture.bytes}))(imageDataBytes(a.src)),transformation:{width,height:Math.max(8,a.height*width/a.width)},altText:{name:'PDFix inline image',description:a.alt}})];}
    if(child.type==='hardBreak')return [new TextRun({break:1})];
    if(child.type!=='text')return runs(child,baseSize,header,imageWidth);
    const marks=new Set((child.marks||[]).map(m=>m.type)),style=(child.marks||[]).find(mark=>mark.type==='documentTextStyle')?.attrs??{};if(style.color&&!/^#[0-9a-f]{6}$/i.test(style.color)||style.font&&!['sans','serif','mono'].includes(style.font)||style.size!==undefined&&style.size!==null&&(!Number.isFinite(style.size)||style.size<8||style.size>72))throw new Error('Unsupported text formatting.');const linkMark=(child.marks||[]).find(mark=>mark.type==='documentLink'),link=linkMark?validLinkTarget(linkMark.attrs?.href):null,highlightMark=(child.marks||[]).find(mark=>mark.type==='highlight'),highlight=highlightMark?HIGHLIGHTS[validHighlight(highlightMark.attrs?.color)].word:undefined;const run=new TextRun({text:child.text,superScript:marks.has('superscript')||undefined,subScript:marks.has('subscript')||undefined,highlight,bold:header||marks.has('bold'),italics:marks.has('italic'),underline:marks.has('underline')||link?{}:undefined,strike:marks.has('strike'),font:marks.has('code')?'Consolas':style.font?{sans:'Arial',serif:'Times New Roman',mono:'Consolas'}[style.font]:font,size:Math.round((style.size??baseSize)*2),color:style.color?.slice(1)??(link?'0B57D0':undefined)});return [link?isInternalLink(link)?new InternalHyperlink({anchor:link.slice(1),children:[run]}):new ExternalHyperlink({link,children:[run]}):run];
  });}
  function visit(node,list,level=0,sink=paragraphs,header=false,imageWidth=available/15){
    if(++counter>30000)throw new Error('This document has too many elements to export in this build.');
    if(node.type==='table'){
      const geometry=tableGeometry(node),columnWidths=tableColumnWidths(node,available);
      const origins=new Map(geometry.cells.map(e=>[e.cell,e]));const rows=node.content.map(row=>new TableRow({tableHeader:(row.content??[]).length>0&&(row.content??[]).every(cell=>cell.type==='tableHeader')||undefined,children:(row.content??[]).map(cell=>{const children=[];for(const child of cell.content)visit(child,undefined,0,children,cell.type==='tableHeader',Math.max(8,(columnWidths.slice(origins.get(cell).x,origins.get(cell).x+(cell.attrs?.colspan??1)).reduce((a,b)=>a+b,0)-200)/15));if(!children.length)children.push(new Paragraph(''));return new TableCell({children,width:{size:columnWidths.slice(origins.get(cell).x,origins.get(cell).x+(cell.attrs?.colspan??1)).reduce((a,b)=>a+b,0),type:WidthType.DXA},columnSpan:cell.attrs?.colspan??1,rowSpan:cell.attrs?.rowspan??1,shading:cell.attrs?.background?{fill:cell.attrs.background.slice(1)}:cell.type==='tableHeader'?{fill:'E9F3EF'}:undefined,margins:{top:80,bottom:80,left:100,right:100},verticalAlign:'top'});})}));
      sink.push(new Table({rows,columnWidths,width:{size:available,type:WidthType.DXA},layout:TableLayoutType.FIXED,margins:{top:80,bottom:80,left:100,right:100}}));return;
    }
    if(node.type==='pageBreak'){sink.push(new Paragraph({children:[new PageBreak()]}));return;}
    if(node.type==='paragraph'||node.type==='heading'||node.type==='codeBlock'){const format=node.type==='codeBlock'||list?{indent:0,lineSpacing:null,spaceBefore:null,spaceAfter:null,firstLine:null,rightIndent:0}:validParagraphFormat(node.attrs),offsets=paragraphOffsets(format),spacing={...(format.lineSpacing?{line:Math.round(format.lineSpacing*240)}:{}),...(format.spaceBefore!==null?{before:format.spaceBefore*20}:{}),...(format.spaceAfter!==null?{after:format.spaceAfter*20}:{})};sink.push(new Paragraph({children:node.type==='heading'&&node.attrs?.anchor?[new Bookmark({id:validDocumentAnchor(node.attrs.anchor),children:runs(node,undefined,header,imageWidth)})]:runs(node,undefined,header,imageWidth),indent:offsets.left||offsets.firstLine||offsets.right?{...(offsets.left?{left:offsets.left*INDENT_TWIPS}:{}),...(offsets.right?{right:offsets.right*INDENT_TWIPS}:{}),...(offsets.firstLine>0?{firstLine:INDENT_TWIPS}:offsets.firstLine<0?{hanging:INDENT_TWIPS}:{})}:undefined,spacing:Object.keys(spacing).length?spacing:undefined,alignment:['left','center','right','justify'].includes(node.attrs?.textAlign)?node.attrs.textAlign==='justify'?'both':node.attrs.textAlign:undefined,heading:node.type==='heading'?HeadingLevel[`HEADING_${Math.min(6,node.attrs?.level||1)}`]:undefined,bullet:list==='bulletList'?{level:Math.min(level,8)}:undefined,numbering:list==='orderedList'?{reference:'numbers',level:Math.min(level,8)}:undefined}));}
    else if(['bulletList','orderedList'].includes(node.type))for(const item of node.content||[])visit(item,node.type,list?level+1:level,sink,header,imageWidth);
    else for(const child of node.content||[])visit(child,list,level,sink,header,imageWidth);
  }
  visit(json);if(!paragraphs.length)paragraphs.push(new Paragraph(''));
  const pageMargins=documentPageMargins(layout),twips=value=>Math.round(value*1440/25.4);
  const band=location=>{const paragraphs=documentBandParagraphs(layout,location),numbers=layout.pageNumbers&&layout.pageNumberPlacement===location;if(!paragraphs.length&&!numbers)return undefined;const children=paragraphs.map(paragraph=>new Paragraph({alignment:paragraph.align,spacing:{before:0,after:0,line:Math.ceil(Math.max(...paragraph.runs.map(run=>run.size))*25),lineRule:'atLeast'},children:paragraph.runs.map(run=>new TextRun({text:run.text,font:documentBandFonts[run.font],size:Math.round(run.size*2),color:run.color.slice(1),bold:run.bold,italics:run.italic,underline:run.underline?{}:undefined}))}));if(numbers)children.push(new Paragraph({alignment:layout.pageNumberAlign,spacing:{before:0,after:0,line:225,lineRule:'exact'},children:[new TextRun({children:[PageNumber.CURRENT,' / ',PageNumber.TOTAL_PAGES],font,size:18})]}));return location==='header'?new Header({children}):new Footer({children});};
  const header=band('header'),footer=band('footer');
  const snapshot=documentSnapshot(json,layout);
  const doc=new Document({creator:'PDFix',...(snapshot?{customProperties:[{name:SHA_PROPERTY,value:'0'.repeat(64)},{name:SNAPSHOT_PROPERTY,value:snapshot}]}:{}),styles:{default:{document:{run:{font,size:layout.size*2},paragraph:{spacing:{line:Math.round(layout.lineHeight*240),after:120}}}}},numbering:{config:[{reference:'numbers',levels:Array.from({length:9},(_,level)=>({level,format:LevelFormat.DECIMAL,text:`%${level+1}.`,alignment:'left'}))}]},sections:[{properties:{page:{size:{width:paper[0],height:paper[1],orientation:layout.landscape?PageOrientation.LANDSCAPE:PageOrientation.PORTRAIT},margin:{top:twips(pageMargins.top),bottom:twips(pageMargins.bottom),left:twips(pageMargins.left),right:twips(pageMargins.right),header:twips(pageMargins.header),footer:twips(pageMargins.footer)}}},headers:header?{default:header}:undefined,footers:footer?{default:footer}:undefined,children:paragraphs}]});
  const packed=new Uint8Array(await Packer.toArrayBuffer(doc));if(!snapshot)return packed;
  // Bind the saved model to the exact body just written, so a later edit in another program invalidates it.
  const {default:JSZip}=await import('jszip'),zip=await JSZip.loadAsync(packed),custom=zip.file('docProps/custom.xml'),body=zip.file('word/document.xml');if(!custom||!body)return packed;
  const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await body.async('uint8array'))),byte=>byte.toString(16).padStart(2,'0')).join(''),properties=await custom.async('string'),placeholder='>'+'0'.repeat(64)+'<';
  if(properties.split(placeholder).length!==2)return packed;zip.file('docProps/custom.xml',properties.replace(placeholder,'>'+sha+'<'));
  return await zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
}
