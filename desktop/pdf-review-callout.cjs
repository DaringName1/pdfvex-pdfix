'use strict';
const {PDFArray,PDFNumber}=require('pdf-lib');
const fail=message=>{throw new Error('FreeText appearance: '+message);};
// ISO 32000-1, Table 174: RD insets the text box; CL is in page coordinates.
// All retained dictionary fields stay unchanged. This describes new AP geometry.
function freeTextLayout(dict,rect,g){
 const width=rect[2]-rect[0],height=rect[3]-rect[1];
 const numbers=(value,counts,title)=>{
  if(!(value instanceof PDFArray)||!counts.includes(value.size()))fail('unsupported '+title+'.');
  const values=Array.from({length:value.size()},(_,i)=>g.resolve(value.get(i)));
  if(values.some(v=>!(v instanceof PDFNumber)||!Number.isFinite(v.asNumber())))fail('unsupported '+title+'.');
  return values.map(v=>v.asNumber());
 };
 const rd=g.get(dict,'RD'),insets=rd===undefined?[0,0,0,0]:numbers(rd,[4],'text-box insets');
 if(insets.some(n=>n<0)||insets[0]+insets[2]>width-12||insets[1]+insets[3]>height-12)fail('the inset text box is too small or outside the annotation.');
 const box={x:insets[0],y:insets[1],width:width-insets[0]-insets[2],height:height-insets[1]-insets[3]};
 const cl=g.get(dict,'CL'),it=g.get(dict,'IT'),ending=g.get(dict,'LE');
 if(cl===undefined){if(it!==undefined||ending!==undefined)fail('a callout needs its declared line and supported intent.');return {box,points:[],ending:'None'};}
 if(g.name(it)!=='FreeTextCallout'||rd===undefined)fail('callouts need FreeTextCallout intent and explicit text-box insets.');
 const line=numbers(cl,[4,6],'callout line'),points=[];
 for(let i=0;i<line.length;i+=2){const x=line[i]-rect[0],y=line[i+1]-rect[1];if(x<0||x>width||y<0||y>height)fail('the callout line is outside its annotation rectangle.');points.push([x,y]);}
 for(let i=1;i<points.length;i++)if(Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1])<.01)fail('the callout line has an empty segment.');
 if(points.slice(0,-1).some(([x,y])=>x>=box.x&&x<=box.x+box.width&&y>=box.y&&y<=box.y+box.height))fail('the callout tip and knee must be outside the text box.');
 const [x,y]=points.at(-1),tolerance=.05;
 if(x<box.x-tolerance||x>box.x+box.width+tolerance||y<box.y-tolerance||y>box.y+box.height+tolerance||
    Math.min(Math.abs(x-box.x),Math.abs(x-box.x-box.width),Math.abs(y-box.y),Math.abs(y-box.y-box.height))>tolerance)fail('the callout line must end on the declared text-box edge.');
 const style=ending===undefined?'None':g.name(ending);
 if(!['None','OpenArrow','ClosedArrow'].includes(style))fail('this callout line ending needs another reviewed adapter.');
 return {box,points,ending:style};
}
function calloutCommands(layout,rect,border){
 if(!layout.points.length)return '';
 const width=rect[2]-rect[0],height=rect[3]-rect[1],stroke=Math.max(1,border),points=layout.points;
 const fixed=n=>Number(n.toFixed(5)).toString(),pair=p=>p.map(fixed).join(' '),margin=stroke/2;
 const inside=p=>p[0]>=margin&&p[0]<=width-margin&&p[1]>=margin&&p[1]<=height-margin;
 if(points.some(p=>!inside(p)))fail('the callout stroke would be clipped at its annotation edge.');
 let commands=`0 G 0 g ${fixed(stroke)} w 1 J 1 j\n${pair(points[0])} m\n`;
 for(const point of points.slice(1))commands+=pair(point)+' l\n';
 commands+='S\n';
 if(layout.ending!=='None'){
  const tip=points[0],next=points[1],length=Math.hypot(next[0]-tip[0],next[1]-tip[1]),size=Math.max(6,stroke*3);
  if(length<size)fail('the callout arrow does not fit its first segment.');
  const dx=(next[0]-tip[0])/length,dy=(next[1]-tip[1])/length;
  const left=[tip[0]+dx*size-dy*size/2,tip[1]+dy*size+dx*size/2],right=[tip[0]+dx*size+dy*size/2,tip[1]+dy*size-dx*size/2];
  if(!inside(left)||!inside(right))fail('the callout arrow would be clipped at its annotation edge.');
  commands+=`${pair(left)} m ${pair(tip)} l ${pair(right)} l ${layout.ending==='ClosedArrow'?'h B':'S'}\n`;
 }
 return commands;
}
module.exports={freeTextLayout,calloutCommands};
