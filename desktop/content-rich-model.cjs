'use strict';
const FONTS=['sans','serif','mono'],ALIGN=['left','center','right','justify'];
const fail=()=>{throw Error('Use supported text formatting within 32 paragraphs, 128 text parts and 2,000 characters.');};
const keys=(v,names)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>names.includes(k));
const number=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
const color=v=>typeof v==='string'&&/^#[a-f\d]{6}$/i.test(v);
function validateRichText(value,plain){
 if(!Array.isArray(value)||!value.length||value.length>32)fail();let count=0,chars=0;
 for(const p of value){
  if(!keys(p,['runs','align','indent','rightIndent','firstLine','lineSpacing','spaceBefore','spaceAfter','list','level'])||!Array.isArray(p.runs)||!p.runs.length||p.runs.length>128)fail();
  for(const key of ['indent','rightIndent'])if(p[key]!==undefined&&(!Number.isInteger(p[key])||!number(p[key],0,4)))fail();
  if(p.align!==undefined&&!ALIGN.includes(p.align)||p.firstLine!==undefined&&![null,'first','hanging'].includes(p.firstLine)||p.lineSpacing!==undefined&&![1,1.15,1.2,1.5,2].includes(p.lineSpacing)||p.spaceBefore!==undefined&&![0,6,12,18,24].includes(p.spaceBefore)||p.spaceAfter!==undefined&&![0,6,12,18,24].includes(p.spaceAfter)||p.list!==undefined&&!['none','bullet','number'].includes(p.list)||p.level!==undefined&&(!Number.isInteger(p.level)||!number(p.level,0,3)))fail();
  for(const r of p.runs){
   if(++count>128||!keys(r,['text','font','size','color','highlight','bold','italic','underline','strike','script'])||typeof r.text!=='string'||/[\r\n\x00-\x1f\x7f]/.test(r.text)||(chars+=r.text.length)>2000)fail();
   if(r.font!==undefined&&!FONTS.includes(r.font)||r.size!==undefined&&!number(r.size,8,72)||r.color!==undefined&&!color(r.color)||r.highlight!==undefined&&r.highlight!==null&&!['#ffff00','#00ff00','#00ffff','#ff00ff'].includes(r.highlight)||r.script!==undefined&&![null,'super','sub'].includes(r.script))fail();
   for(const k of ['bold','italic','underline','strike'])if(r[k]!==undefined&&typeof r[k]!=='boolean')fail();
  }
 }
 const text=value.map(p=>p.runs.map(r=>r.text).join('')).join('\n');if(plain!==undefined&&text!==plain)fail();return value;
}
function richFontName(run,base){const family=run.font||base.font;return family==='serif'?(run.bold?run.italic?'Times-BoldItalic':'Times-Bold':run.italic?'Times-Italic':'Times-Roman'):(family==='mono'?'Courier':'Helvetica')+(run.bold?run.italic?'-BoldOblique':'-Bold':run.italic?'-Oblique':'');}
module.exports={validateRichText,richFontName};
