// Paragraph layout and character formatting a Word file sets directly on its body paragraphs and runs, which the
// HTML import drops: alignment, indent, first-line or hanging indent, line spacing, space before/after, and run font
// family, size, color and highlight. Only values the editor offers are kept; anything else (style-inherited values,
// theme fonts, odd amounts) stays with the document defaults.
const {all,children,xml}=require('./office-archive.cjs');
const {INDENT_TWIPS,MAX_INDENT,LINE_SPACINGS,PARAGRAPH_SPACES}=require('./document-paragraph-model.cjs');
const MAX_PARAGRAPHS=20000,MAX_RUNS=500,TEXT_KEY=120,ALIGN={center:'center',right:'right',end:'right',both:'justify',distribute:'justify'};
const WORD_HIGHLIGHTS={yellow:'yellow',green:'green',cyan:'turquoise',magenta:'pink'};
// Whitespace is left out of the key because tabs and breaks are not text runs in the XML but are spaces in the HTML.
const textKey=text=>text.replace(/\s+/g,'').slice(0,TEXT_KEY);
const value=(node,name)=>{if(!node)return null;for(const attribute of Array.from(node.attributes))if(attribute.localName===name)return attribute.value;return null;};
const number=raw=>{if(raw===null||!/^-?\d+$/.test(raw))return null;return Number(raw);};
function paragraphAttrs(properties){
 const attrs={};if(!properties)return attrs;
 const align=ALIGN[value(children(properties,'jc')[0],'val')];if(align)attrs.textAlign=align;
 const ind=children(properties,'ind')[0];
 if(ind){
  let left=number(value(ind,'left')??value(ind,'start'))??0;const first=number(value(ind,'firstLine')),hanging=number(value(ind,'hanging')),near=(amount,target)=>amount!==null&&Math.abs(amount-target)<=60;
  if(near(hanging,INDENT_TWIPS)&&left>=INDENT_TWIPS-60){attrs.firstLine='hanging';left-=INDENT_TWIPS;}else if(near(first,INDENT_TWIPS))attrs.firstLine='first';
  const steps=Math.round(left/INDENT_TWIPS);if(steps>=1&&steps<=MAX_INDENT&&Math.abs(left-steps*INDENT_TWIPS)<=120)attrs.indent=steps;
  const right=number(value(ind,'right')??value(ind,'end'))??0,rightSteps=Math.round(right/INDENT_TWIPS);if(rightSteps>=1&&rightSteps<=4&&Math.abs(right-rightSteps*INDENT_TWIPS)<=120)attrs.rightIndent=rightSteps;
 }
 const spacing=children(properties,'spacing')[0];
 if(spacing){
  for(const [name,key] of [['before','spaceBefore'],['after','spaceAfter']]){const twentieths=number(value(spacing,name));if(twentieths===null)continue;const points=PARAGRAPH_SPACES.find(item=>Math.abs(item-twentieths/20)<=1);if(points!==undefined)attrs[key]=points;}
  const line=number(value(spacing,'line')),rule=value(spacing,'lineRule');if(line!==null&&(rule===null||rule==='auto')){const multiple=LINE_SPACINGS.find(item=>Math.abs(item-line/240)<=.03);if(multiple)attrs.lineSpacing=multiple;}
 }
 return attrs;
}
// A named font becomes one of the editor's three families; theme fonts are left to the document default.
function fontFamily(name){if(!name)return null;if(/consolas|courier|mono|menlo|lucida console|lucida sans typewriter/i.test(name))return 'mono';if(/times|georgia|cambria|garamond|book antiqua|palatino|baskerville|minion|century schoolbook|serif/i.test(name))return 'serif';return 'sans';}
function runStyle(properties){
 const style={};if(!properties)return style;
 const fonts=children(properties,'rFonts')[0],font=fontFamily(value(fonts,'ascii')??value(fonts,'hAnsi'));if(font)style.font=font;
 const halfPoints=number(value(children(properties,'sz')[0],'val'));if(halfPoints!==null&&halfPoints>=16&&halfPoints<=144)style.size=halfPoints/2;
 const color=value(children(properties,'color')[0],'val');if(color&&/^[0-9a-f]{6}$/i.test(color)&&color!=='000000')style.color='#'+color.toLowerCase();
 const highlight=WORD_HIGHLIGHTS[value(children(properties,'highlight')[0],'val')];if(highlight)style.highlight=highlight;
 return style;
}
// Runs as [character count, direct style]; neighbors with the same style are merged. Tabs and line breaks are not
// counted: in Word they are not run text, so they cannot shift the ranges.
function paragraphRuns(paragraph){
 const runs=[];for(const run of all(paragraph,'r')){const count=all(run,'t').map(node=>node.textContent).join('').replace(/[\t\r\n]/g,'').length;if(!count)continue;const style=runStyle(children(run,'rPr')[0]),last=runs.at(-1);if(last&&JSON.stringify(last.style)===JSON.stringify(style))last.n+=count;else runs.push({n:count,style});}
 return runs.some(run=>Object.keys(run.style).length)&&runs.length<=MAX_RUNS?runs:null;
}
// Body paragraphs in order, with the text used to line them up against the imported HTML. List items and table
// cells are left out because the import turns them into list and table content of their own.
function docxParagraphLayout(documentXml){
 const body=all(xml(documentXml),'body')[0];if(!body)return [];const result=[],blocks=[];
 // Document order, as the HTML import writes it. List items and table cells (inner) carry run formatting only: the
 // import makes them list and table content, which has no paragraph layout of its own in the editor.
 const collect=(parent,inner,depth)=>{if(depth>8)return;for(const node of Array.from(parent.childNodes)){if(node.nodeType!==1)continue;
  if(node.localName==='p')blocks.push({paragraph:node,inner});else if(node.localName==='sdt')for(const content of children(node,'sdtContent'))collect(content,inner,depth+1);
  else if(node.localName==='tbl')for(const row of children(node,'tr'))for(const cell of children(row,'tc'))collect(cell,true,depth+1);}};
 collect(body,false,0);
 for(const {paragraph,inner} of blocks){
  if(result.length>=MAX_PARAGRAPHS)break;const properties=children(paragraph,'pPr')[0],listItem=!!(properties&&children(properties,'numPr').length);
  const text=textKey(all(paragraph,'t').map(node=>node.textContent).join(''));if(!text)continue;const runs=paragraphRuns(paragraph);
  if(inner||listItem){if(runs)result.push({text,attrs:{},runs});continue;}
  result.push({text,attrs:paragraphAttrs(properties),...(runs?{runs}:{})});
 }
 return result;
}
module.exports={docxParagraphLayout,paragraphAttrs,runStyle,fontFamily,textKey,MAX_PARAGRAPHS,MAX_RUNS,TEXT_KEY};
