// Pure inert model shared by the document renderer and native export validators.
const FONTS={sans:'Arial',serif:'Times New Roman',mono:'Consolas'};
const ALIGN=['left','center','right'];
const fail=()=>{throw new Error('Formatted headers/footers support six paragraphs, 800 characters, and text runs from 8 to 24 pt with chosen fonts and colors.');};
function shape(value,keys){if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join(',')!==[...keys].sort().join(','))fail();}
function validDocumentBand(value){
 if(value===null||value===undefined)return null;shape(value,['version','paragraphs']);if(value.version!==1||!Array.isArray(value.paragraphs)||!value.paragraphs.length||value.paragraphs.length>6)fail();let characters=0;
 const paragraphs=value.paragraphs.map(paragraph=>{shape(paragraph,['align','runs']);if(!ALIGN.includes(paragraph.align)||!Array.isArray(paragraph.runs)||!paragraph.runs.length||paragraph.runs.length>16)fail();return {align:paragraph.align,runs:paragraph.runs.map(run=>{shape(run,['text','font','size','color','bold','italic','underline']);if(typeof run.text!=='string'||run.text.length>200||!run.text.isWellFormed()||/[\x00-\x1f\x7f-\x9f\ufffe\uffff]/u.test(run.text)||!Object.hasOwn(FONTS,run.font)||!Number.isFinite(run.size)||run.size<8||run.size>24||!Number.isInteger(run.size*2)||typeof run.color!=='string'||!/^#[a-f0-9]{6}$/i.test(run.color)||['bold','italic','underline'].some(key=>typeof run[key]!=='boolean'))fail();characters+=run.text.length;if(characters>800)fail();return {...run,color:run.color.toLowerCase()};})};});return {version:1,paragraphs};
}
function documentBandParagraphs(layout,location){
 if(!['header','footer'].includes(location))fail();const rich=validDocumentBand(layout[location+'Band']);if(rich)return rich.paragraphs;
 const text=layout[location+'Text'];return text?text.split('\n').map(text=>({align:layout[location+'Align'],runs:[{text,font:layout.font,size:9,color:'#172c3e',bold:false,italic:false,underline:false}]})):[];
}
function documentBandText(value){const band=validDocumentBand(value);return band?band.paragraphs.map(p=>p.runs.map(r=>r.text).join('')).join('\n'):'';}
// Page margins per side: "sides" when the document sets them separately, otherwise the one margin for all four.
function sideMargins(layout){const sides=layout.sides;return sides?{top:sides.top,right:sides.right,bottom:sides.bottom,left:sides.left}:{top:layout.margin,right:layout.margin,bottom:layout.margin,left:layout.margin};}
function documentBandHeight(layout,location,widthMm){
 const margins=sideMargins(layout),base=location==='header'?margins.top:margins.bottom,paragraphs=documentBandParagraphs(layout,location),widthPt=(widthMm-margins.left-margins.right)*72/25.4;let points=0;
 for(const paragraph of paragraphs){const size=Math.max(...paragraph.runs.map(run=>run.size)),units=paragraph.runs.reduce((sum,run)=>sum+Array.from(run.text).reduce((n,c)=>n+run.size*(c.codePointAt(0)>127?2:1),0),0);points+=Math.max(1,Math.ceil(units/Math.max(1,widthPt)))*size*1.25;}
 if(layout.pageNumbers&&layout.pageNumberPlacement===location)points+=11.25;
 return points?Math.max(base,8+points*25.4/72):base;
}
module.exports={validDocumentBand,documentBandParagraphs,documentBandText,documentBandHeight,sideMargins,FONTS};
