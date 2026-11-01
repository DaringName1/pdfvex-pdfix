import {pdfReadableSequence} from './pdf-readable-sequence.js';
function lines(runs,table=false){
 const rows=[];
 for(const run of [...runs].sort((a,b)=>a.top-b.top)){let row=rows.at(-1);if(!row||Math.abs(row.top-run.top)>Math.max(2,Math.min(row.height,run.height)*.45)){row={top:run.top,height:run.height,runs:[]};rows.push(row);}row.runs.push(run);}
 return rows.sort((a,b)=>a.top-b.top).map(row=>{
  const rtl=row.runs.filter(run=>run.dir==='rtl').length>row.runs.length/2,sorted=row.runs.sort((a,b)=>rtl?b.left-a.left:a.left-b.left),sourceFragments=[];let text='',previous=null;
  for(const run of sorted){
   const gap=previous?(rtl?previous.left-run.left-run.width:run.left-previous.left-previous.width):0;
   const separated=previous&&(previous.afterSpace||run.beforeSpace||gap>Math.max(.5,Math.min(previous.height,run.height)*.08));
   const fragment=run.text.replace(/\s+/gu,' ').trim();text+=table&&previous&&gap>Math.max(12,Math.min(previous.height,run.height)*1.5)?'\t':separated?' ':'';sourceFragments.push({run:run.sourceRun,start:text.length,text:fragment});text+=fragment;previous=run;
  }
  return {text,sourceFragments,sourceRuns:sorted.map(run=>run.sourceRun),top:row.top};
 });
}
function chooseGutter(runs,width){
 if(runs.length<12||!Number.isFinite(width)||width<=0)return null;
 // A low-overlap central gap is a layout proposal, never a semantic verdict.
 let best=null;
 for(let bin=20;bin<=44;bin++){
  const x=width*bin/64,left=runs.filter(run=>run.left+run.width<x-width*.01),right=runs.filter(run=>run.left>x+width*.01),cross=runs.filter(run=>run.left<x+width*.01&&run.left+run.width>x-width*.01);
  if(left.length<4||right.length<4||cross.length>Math.max(2,runs.length*.08))continue;
  const extent=items=>({top:Math.min(...items.map(run=>run.top)),bottom:Math.max(...items.map(run=>run.top+run.height))}),l=extent(left),r=extent(right),overlap=Math.min(l.bottom,r.bottom)-Math.max(l.top,r.top);
  if(overlap<Math.min(l.bottom-l.top,r.bottom-r.top)*.5)continue;
  const score=(2*cross.length+Math.abs(left.length-right.length))/runs.length+Math.abs(x-width/2)/width;
  if(!best||score<best.score)best={x,score};
 }
 return best?.x??null;
}
function verticalColumns(runs){
 const columns=[];
 for(const run of [...runs].sort((a,b)=>b.left-a.left)){let column=columns.at(-1);if(!column||Math.abs(column.left-run.left)>Math.max(2,Math.min(column.width,run.width)*.45)){column={left:run.left,width:run.width,runs:[]};columns.push(column);}column.runs.push(run);}
 return columns.map(column=>{let text='',previous=null;const sourceFragments=[],sorted=column.runs.sort((a,b)=>a.top-b.top);for(const run of sorted){const gap=previous?run.top-previous.top-previous.height:0;if(previous&&(previous.afterSpace||run.beforeSpace||gap>Math.max(2,Math.min(run.width,previous.width)*.5)))text+=' ';const fragment=run.text.replace(/\s+/gu,' ').trim();sourceFragments.push({run:run.sourceRun,start:text.length,text:fragment});text+=fragment;previous=run;}return {text,sourceFragments,sourceRuns:sorted.map(run=>run.sourceRun)};});
}
export function readableRegions(value){
 if(typeof value!=='string'||value.length>2000)throw new Error('Enter at most 20 regions, one per line: left top right bottom percentages.');
 const rows=value.trim().split(/\r?\n/u).filter(row=>row.trim());
 if(!rows.length||rows.length>20)throw new Error('Choose 1–20 ordered page regions.');
 return rows.map(row=>{const box=row.trim().split(/\s+/u).map(Number);if(box.length!==4||box.some(v=>!Number.isFinite(v)||v<0||v>100)||box[0]>=box[2]||box[1]>=box[3])throw new Error('Each region needs left < right and top < bottom, between 0 and 100.');return box;});
}
export function pdfReadableText(content,page,order='auto',columnSplit=50,regions=[]){const s={order};
  if(!Number.isInteger(columnSplit)||columnSplit<20||columnSplit>80)throw new Error('Choose a column split between 20 and 80 percent.');
  const sequence=pdfReadableSequence(content);
  if(order==='content')return {output:sequence.output,sourceRuns:sequence.sourceRuns,sourceFragments:sequence.sourceFragments,method:'PDF content sequence; this can differ from visual or semantic order',omitted:false};
  const items=[];let pendingSpace=false;
  for(let sourceRun=0;sourceRun<sequence.items.length;sourceRun++){
   const item=sequence.items[sourceRun];
   if(!item.str.trim()){if(item.str.length||item.hasEOL)pendingSpace=true;continue;}
   items.push({...item,sourceRun,beforeSpace:pendingSpace||/^\s/u.test(item.str),afterSpace:!!item.hasEOL||/\s$/u.test(item.str)});pendingSpace=!!item.hasEOL||/\s$/u.test(item.str);
  }
  const viewport=page.getViewport({scale:1,rotation:page.rotate}),runs=[];
  for(const item of items){
   if(!(Array.isArray(item.transform)||ArrayBuffer.isView(item.transform))||item.transform.length!==6||Array.from(item.transform).some(value=>!Number.isFinite(value))||!Number.isFinite(item.width)||!Number.isFinite(item.height))continue;
   const [a,b,,,x,y]=item.transform,magnitude=Math.hypot(a,b)||1,dx=a/magnitude,dy=b/magnitude,w=Math.abs(item.width)||1,h=Math.abs(item.height)||12;
   const corners=[[x,y],[x+dx*w,y+dy*w],[x-dy*h,y+dx*h],[x+dx*w-dy*h,y+dy*w+dx*h]].map(point=>viewport.convertToViewportPoint(...point));
   if(corners.some(point=>point.some(value=>!Number.isFinite(value))))continue;
   const left=Math.min(...corners.map(point=>point[0])),top=Math.min(...corners.map(point=>point[1]));
   runs.push({text:item.str,sourceRun:item.sourceRun,beforeSpace:item.beforeSpace,afterSpace:item.afterSpace,dir:item.dir,left,top,width:Math.max(...corners.map(point=>point[0]))-left,height:Math.max(...corners.map(point=>point[1]))-top||12});
  }
  let output=[],method='Visible rows';
  if(s.order==='vertical'){output=verticalColumns(runs);method='Reviewed vertical columns, right to left and top to bottom; displayed as horizontal readable text. Ruby, mixed orientations and semantic groups require source review';}
  else if(s.order==='regions'){
   if(!Number.isFinite(viewport.height)||viewport.height<=0)throw new Error('Page height is unavailable for region ordering.');
   const boxes=readableRegions(regions.map(box=>box.join(' ')).join('\n')),used=new Set();
   for(const box of boxes){const chosen=runs.filter(run=>{const x=(run.left+run.width/2)/viewport.width*100,y=(run.top+run.height/2)/viewport.height*100;return x>=box[0]&&x<box[2]&&y>=box[1]&&y<box[3];});for(const run of chosen){if(used.has(run.sourceRun))throw new Error('Regions select the same text run more than once. Adjust the overlapping regions.');used.add(run.sourceRun);}output.push(...lines(chosen,true));}
   method=`Reviewed region order; ${runs.length-used.size} text runs outside the regions omitted; each run is selected by its center`;
  }
  else if(s.order==='left'||s.order==='right'){output=lines(runs.filter(run=>s.order==='left'?run.left+run.width/2<viewport.width/2:run.left+run.width/2>=viewport.width/2));method=s.order==='left'?'Left half only; other page text omitted from this view':'Right half only; other page text omitted from this view';}
  else {
   const gutter=s.order==='auto'?chooseGutter(runs,viewport.width):null,count=['three','three-rtl'].includes(s.order)?3:['two','two-rtl'].includes(s.order)||gutter!==null?2:1;
   if(count===1){output=lines(runs,s.order==='table');if(s.order==='table')method='Visible table rows with tabs at wide gaps; gaps are proposals, not verified cells or headers';}
   else {
    const breaks=count===3?[viewport.width/3,viewport.width*2/3]:[gutter??viewport.width*columnSplit/100],columns=Array.from({length:count},()=>[]),spanning=[];
    for(const run of runs){if(breaks.some(x=>run.left<x&&run.left+run.width>x))spanning.push(run);else columns[breaks.filter(x=>run.left+run.width/2>=x).length].push(run);}
    // Full-width rows divide the columns into vertical sections. A heading in
    // the middle of a page stays between its sections rather than at the end.
    const columnRows=columns.map(column=>lines(column)),separators=lines(spanning),positions=columnRows.map(()=>0),columnOrder=columnRows.map((_,i)=>i);if(s.order.endsWith('-rtl'))columnOrder.reverse();
    for(const separator of separators){for(const column of columnOrder){const rows=columnRows[column];while(positions[column]<rows.length&&rows[positions[column]].top<separator.top)output.push(rows[positions[column]++]);}output.push(separator);}
    for(const column of columnOrder)output.push(...columnRows[column].slice(positions[column]));
    method=`${count} column proposal${s.order.endsWith('-rtl')?', right to left':''}, split into sections by spanning rows; captions and tables may still need a different order`;
   }
  }
 return {output:output.map(block=>block.text),sourceRuns:output.map(block=>block.sourceRuns),sourceFragments:output.map(block=>block.sourceFragments),method,omitted:order!=='content'&&(runs.length<items.length||order==='regions'&&output.flatMap(block=>block.sourceRuns).length<runs.length)};
}
