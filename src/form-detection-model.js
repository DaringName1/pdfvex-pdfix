// Inert geometry/text heuristics. Suggestions are never a form-writing recipe.
export const FORM_DETECTION_LIMITS=Object.freeze({pages:20,operators:100000,pathValues:250000,textItems:15000,primitives:4000,proposals:100,pixels:4000000});
const identity=()=>[1,0,0,1,0,0];
const multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const point=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
const bounds=points=>[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
const clean=text=>String(text??'').replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim();
const overlap=(a,b,inset=0)=>Math.min(a[2]-inset,b[2])-Math.max(a[0]+inset,b[0])>.5&&Math.min(a[3]-inset,b[3])-Math.max(a[1]+inset,b[1])>.5;
const width=r=>r[2]-r[0],height=r=>r[3]-r[1];
const inside=(r,box)=>r.every(Number.isFinite)&&r[0]>=box[0]&&r[1]>=box[1]&&r[2]<=box[2]&&r[3]<=box[3];
const similar=(a,b,tolerance=3)=>a.every((v,i)=>Math.abs(v-b[i])<=tolerance);
const line=(a,b,source)=>({a,b,source});
function splitPrintedBlanks(texts){return texts.flatMap(item=>{const runs=[...item.text.matchAll(/_{3,}/g)];if(!runs.length||!item.horizontal)return [item];const segments=[];let cursor=0;for(const run of runs){if(run.index>cursor)segments.push([cursor,run.index]);segments.push([run.index,run.index+run[0].length]);cursor=run.index+run[0].length;}if(cursor<item.text.length)segments.push([cursor,item.text.length]);return segments.map(([start,end])=>({...item,text:clean(item.text.slice(start,end)),rect:[item.rect[0]+width(item.rect)*start/item.text.length,item.rect[1],item.rect[0]+width(item.rect)*end/item.text.length,item.rect[3]]})).filter(item=>item.text);});}

export function pdfFormText(content){
 if((content?.items?.length||0)>FORM_DETECTION_LIMITS.textItems)throw new Error('This page exceeds the 15,000 text-item detection limit. Use manual placement.');
 return (content?.items||[]).filter(item=>item.str?.trim()&&item.transform?.length===6).map(item=>{
  const t=item.transform,size=Math.max(1,Math.hypot(t[2],t[3])),style=content.styles?.[item.fontName]||{},ascent=Number.isFinite(style.ascent)?style.ascent:.8,descent=Number.isFinite(style.descent)?style.descent:-.2,advance=Math.hypot(t[0],t[1])||size,ux=t[0]/advance,uy=t[1]/advance,vx=t[2]/size,vy=t[3]/size,w=Math.abs(item.width||0),rect=bounds([[t[4]+vx*size*descent,t[5]+vy*size*descent],[t[4]+ux*w+vx*size*descent,t[5]+uy*w+vy*size*descent],[t[4]+vx*size*ascent,t[5]+vy*size*ascent],[t[4]+ux*w+vx*size*ascent,t[5]+uy*w+vy*size*ascent]]);
  return {text:clean(item.str),rect,size,source:'PDF text',confidence:1,horizontal:Math.abs(uy)<.1&&!style.vertical};
 });
}

export function ocrFormText(result,viewport){
 return (result.lines||[]).slice(0,5000).map(item=>{const b=item.bbox,rect=bounds([viewport.convertToPdfPoint(b.x0,b.y0),viewport.convertToPdfPoint(b.x1,b.y0),viewport.convertToPdfPoint(b.x0,b.y1),viewport.convertToPdfPoint(b.x1,b.y1)]);return {text:clean(item.text),rect,size:height(rect),source:'Local OCR',confidence:Math.max(0,Math.min(1,(item.confidence||0)/100)),horizontal:true};}).filter(item=>item.text);
}

export function pdfFormPrimitives(list,OPS){
 if(list.fnArray.length>FORM_DETECTION_LIMITS.operators)throw new Error('This page exceeds the 100,000 vector-operator detection limit. Use manual placement.');
 const lines=[],boxes=[],warnings=[];let matrix=identity(),stack=[],values=0,clipped=false,lineWidth=1;
 const pushLine=(a,b)=>{if(lines.length+boxes.length>=FORM_DETECTION_LIMITS.primitives)throw new Error('This page exceeds the 4,000 geometry-primitive detection limit.');if(a.every(Number.isFinite)&&b.every(Number.isFinite))lines.push(line(a,b,'Vector artwork'));};
 for(let index=0;index<list.fnArray.length;index++){
  const fn=list.fnArray[index],args=list.argsArray[index]||[];
  if(fn===OPS.save||fn===OPS.paintFormXObjectBegin){stack.push({matrix:[...matrix],clipped,lineWidth});if(stack.length>128)throw new Error('This page has excessive nested vector transforms.');if(fn===OPS.paintFormXObjectBegin&&args[0])matrix=multiply(matrix,args[0]);}
  else if(fn===OPS.restore||fn===OPS.paintFormXObjectEnd){const state=stack.pop();if(state)({matrix,clipped,lineWidth}=state);}
  else if(fn===OPS.transform)matrix=multiply(matrix,args);
  else if(fn===OPS.setLineWidth)lineWidth=args[0];
  else if(fn===OPS.clip||fn===OPS.eoClip)clipped=true;
  else if(fn===OPS.constructPath){
   // PDF.js 6 packs DrawOPS into args[1][0]; do not mutate its cached buffers.
   const paint=args[0],path=args[1]?.[0];if(!path||!ArrayBuffer.isView(path)&&!Array.isArray(path))continue;
   values+=path.length;if(values>FORM_DETECTION_LIMITS.pathValues)throw new Error('This page exceeds the 250,000 path-value detection limit.');
   if(clipped){if(!warnings.includes('Clipped vector paths were skipped.'))warnings.push('Clipped vector paths were skipped.');continue;}
   if(![OPS.stroke,OPS.closeStroke,OPS.fillStroke,OPS.eoFillStroke,OPS.closeFillStroke,OPS.closeEOFillStroke].includes(paint))continue;
   const effective=lineWidth*Math.max(Math.hypot(matrix[0],matrix[1]),Math.hypot(matrix[2],matrix[3]));if(effective>4)continue;
   let sub=[],curved=false,start=null,current=null;
   const finish=closed=>{if(closed&&sub.length===4&&!curved){const r=bounds(sub);if(sub.every((p,i)=>Math.abs(p[0]-sub[(i+1)%4][0])<1||Math.abs(p[1]-sub[(i+1)%4][1])<1))boxes.push({rect:r,source:'Vector box',strength:.9});}sub=[];curved=false;};
   for(let j=0;j<path.length;){const code=path[j++];
    if(code===0){finish(false);current=start=point(matrix,path[j++],path[j++]);sub=[current];}
    else if(code===1){const next=point(matrix,path[j++],path[j++]);if(current)pushLine(current,next);current=next;sub.push(next);}
    else if(code===2){j+=4;current=point(matrix,path[j++],path[j++]);curved=true;}
    else if(code===3){j+=2;current=point(matrix,path[j++],path[j++]);curved=true;}
    else if(code===4){if(current&&start&&!curved)pushLine(current,start);finish(true);current=start=null;}
    else break;
   }finish(false);
  }
 }
 return {lines,boxes,warnings};
}

// Bounded dark-run analysis for scanned outlines and underlines; OCR provides labels.
export function rasterFormPrimitives(image,viewport){
 const {data,width:w,height:h}=image;if(w*h>FORM_DETECTION_LIMITS.pixels)throw new Error('Scan detection exceeds the four-million-pixel limit.');
 const horizontal=[],vertical=[],buckets=new WeakMap();const dark=(x,y)=>{const i=(y*w+x)*4;return data[i+3]>128&&data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722<150;};
 const add=(items,a,b,fixed)=>{let bucket=buckets.get(items);if(!bucket){bucket=new Map();buckets.set(items,bucket);}const key=`${Math.round(a/4)}:${Math.round(b/4)}`,last=bucket.get(key);if(last&&Math.abs(last.lastFixed-fixed)<=4&&Math.abs(last.a-a)<=3&&Math.abs(last.b-b)<=3){last.fixed=(last.fixed*last.count+fixed)/(last.count+1);last.lastFixed=fixed;last.count++;return;}const item={a,b,fixed,lastFixed:fixed,count:1};items.push(item);bucket.set(key,item);if(items.length>2000)throw new Error('This scan has too many line fragments for bounded detection.');};
 const min=Math.max(8,Math.ceil(viewport.scale*8));
 for(let y=0;y<h;y+=2){let start=-1;for(let x=0;x<=w;x++){if(x<w&&dark(x,y)){if(start<0)start=x;}else if(start>=0){if(x-start>=min)add(horizontal,start,x,y);start=-1;}}}
 for(let x=0;x<w;x+=2){let start=-1;for(let y=0;y<=h;y++){if(y<h&&dark(x,y)){if(start<0)start=y;}else if(start>=0){if(y-start>=min)add(vertical,start,y,x);start=-1;}}}
 const lines=[...horizontal.map(r=>line(viewport.convertToPdfPoint(r.a,r.fixed),viewport.convertToPdfPoint(r.b,r.fixed),'Scanned line')),...vertical.map(r=>line(viewport.convertToPdfPoint(r.fixed,r.a),viewport.convertToPdfPoint(r.fixed,r.b),'Scanned line'))];
 const blank=rect=>{if(!viewport.convertToViewportPoint)return true;const a=viewport.convertToViewportPoint(rect[0]+3,rect[1]+3),b=viewport.convertToViewportPoint(rect[2]-3,rect[3]-3),x0=Math.max(0,Math.ceil(Math.min(a[0],b[0]))),x1=Math.min(w-1,Math.floor(Math.max(a[0],b[0]))),y0=Math.max(0,Math.ceil(Math.min(a[1],b[1]))),y1=Math.min(h-1,Math.floor(Math.max(a[1],b[1])));let count=0,ink=0;const step=Math.max(1,Math.ceil(Math.sqrt(Math.max(1,(x1-x0)*(y1-y0))/1600)));for(let y=y0;y<=y1;y+=step)for(let x=x0;x<=x1;x+=step){count++;if(dark(x,y))ink++;}return !count||ink/count<.025;};
 return {lines,boxes:[],blank,warnings:['Scan geometry uses dark straight-line estimates; faint, broken, skewed or handwritten areas may be missed.']};
}

function assembledBoxes(lines){
 const horizontal=lines.filter(l=>Math.abs(l.a[1]-l.b[1])<1.5&&Math.abs(l.a[0]-l.b[0])>=8).map(l=>({x0:Math.min(l.a[0],l.b[0]),x1:Math.max(l.a[0],l.b[0]),y:(l.a[1]+l.b[1])/2,source:l.source}));
 const vertical=lines.filter(l=>Math.abs(l.a[0]-l.b[0])<1.5&&Math.abs(l.a[1]-l.b[1])>=8).map(l=>({y0:Math.min(l.a[1],l.b[1]),y1:Math.max(l.a[1],l.b[1]),x:(l.a[0]+l.b[0])/2}));
 const boxes=[];if(horizontal.length>800||vertical.length>800)return {boxes,horizontal,limited:true};
 for(let i=0;i<horizontal.length;i++)for(let j=i+1;j<horizontal.length;j++){
  const a=horizontal[i],b=horizontal[j],h=Math.abs(a.y-b.y);if(h<8||h>100||Math.abs(a.x0-b.x0)>3||Math.abs(a.x1-b.x1)>3)continue;
  const low=Math.min(a.y,b.y),high=Math.max(a.y,b.y),edge=x=>vertical.some(v=>Math.abs(v.x-x)<3&&v.y0<=low+3&&v.y1>=high-3);
  if(edge(a.x0)&&edge(a.x1)){boxes.push({rect:[a.x0,low,a.x1,high],source:a.source==='Scanned line'?'Scanned box':'Joined vector box',strength:a.source==='Scanned line'?.66:.8});if(boxes.length>=200)return {boxes,horizontal,limited:true};}
 }return {boxes,horizontal,limited:false};
}

function nearestLabels(rect,texts,checkbox){
 const matches=[];for(const item of texts){const label=clean(item.text.replace(/[_\u2014\u2013]{3,}/g,' ')).replace(/[:\s]+$/,'');if(!label||label.length>200||!item.horizontal)continue;const t=item.rect;
  let score=Infinity;const row=Math.abs((t[1]+t[3])/2-(rect[1]+rect[3])/2),left=rect[0]-t[2],right=t[0]-rect[2],above=t[1]-rect[3],below=rect[1]-t[3],horizontal=Math.max(0,Math.max(rect[0],t[0])-Math.min(rect[2],t[2]));
  if(row<Math.max(height(rect),height(t))*.8){if(left>=-2&&left<=160)score=left+row*2;if(checkbox&&right>=-2&&right<=180)score=Math.min(score,right+row*2-5);}
  if(above>=-2&&above<=42&&horizontal<=30)score=Math.min(score,above*1.5+horizontal+18);
  if(below>=-2&&below<=32&&horizontal<=30)score=Math.min(score,below*1.6+horizontal+28);
  if(score<150)matches.push({label,score,source:item.source,confidence:item.confidence});
 }matches.sort((a,b)=>a.score-b.score);return matches.slice(0,3);
}

export function suggestFormName(label,used){let base=clean(label).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,52)||'DetectedField';if(!/^[A-Za-z]/.test(base))base='Field_'+base;let name=base,number=2;while([...used].some(existing=>existing===name||existing.startsWith(name+'.')))name=base+'_'+number++;used.add(name);return name;}

export function proposeFormFields({page,box,texts,primitives,occupied=[],usedNames=new Set()}){
 texts=splitPrintedBlanks(texts);
 const warnings=[...(primitives.warnings||[])],assembled=assembledBoxes(primitives.lines);if(assembled.limited)warnings.push('Joined-box analysis reached its bounded line budget; some boxes may be missed.');
 const shapes=[...(primitives.boxes||[]),...assembled.boxes],proposals=[];
 const offer=(raw,source,strength)=>{
  if(proposals.length>=FORM_DETECTION_LIMITS.proposals)return;
  const r=raw.map(v=>Math.round(v*100)/100),w=width(r),h=height(r),checkbox=w>=8&&w<=32&&h>=8&&h<=32&&w/h>=.7&&w/h<=1.4;
  if(!inside(r,box)||w<8||h<8||w>500||h>100||!checkbox&&(w<30||h<12)||occupied.some(item=>overlap(r,item.rect||item))||proposals.some(p=>similar(p.rect,r)||overlap(p.rect,r))||primitives.blank&&!primitives.blank(r))return;
  if(texts.some(item=>overlap(r,item.rect,3)&&!/^[\s_\u2610\u25a1\[\]]+$/.test(item.text)))return;
  const matches=nearestLabels(r,texts,checkbox),match=matches[0],label=match?.label||`Unlabeled ${checkbox?'checkbox':'field'} on page ${page+1}`,ambiguous=!match||matches.length>1&&matches[1].score-match.score<12||match?.source==='Local OCR'&&match.confidence<.8;
  const kind=checkbox?'checkbox':/\b(sign(?:ature|ed)?|initials?)\b/i.test(label)?'signature':/\b(date|dob|birth)\b/i.test(label)?'date':'text';
  const confidence=Math.max(.2,Math.min(.96,strength+(match?.score<35?.05:-.1)-(ambiguous?.15:0)-(match?.source==='Local OCR'?(1-match.confidence)*.2:0)));
  const fontSize=Math.max(6,Math.min(12,Math.floor(h-4)));
  proposals.push({id:`detected-${page}-${proposals.length}`,page,rect:r,type:kind,name:suggestFormName(label,usedNames),label,confidence,ambiguous,alternatives:matches.slice(1).map(m=>m.label),source,reason:!match?'No nearby label found.':`Nearby ${match.source.toLowerCase()}: ${match.label}`,fontSize,selected:false,reviewed:false,order:0});
 };
 for(const shape of shapes.sort((a,b)=>width(a.rect)*height(a.rect)-width(b.rect)*height(b.rect)))offer(shape.rect,shape.source,shape.strength);
 for(const item of texts.filter(t=>t.horizontal)){const match=/(?<!_)_{3,}(?!_)/.exec(item.text);if(match){const character=width(item.rect)/item.text.length,x=item.rect[0]+match.index*character;offer([x,item.rect[1],x+match[0].length*character,item.rect[1]+Math.max(18,item.size+4)],'Printed blank underline',.72);}}
 for(const l of assembled.horizontal){const w=l.x1-l.x0;if(w<35||w>500||shapes.some(shape=>(Math.abs(l.y-shape.rect[1])<3||Math.abs(l.y-shape.rect[3])<3)&&l.x0>=shape.rect[0]-3&&l.x1<=shape.rect[2]+3))continue;offer([l.x0,l.y+1,l.x1,l.y+21],l.source==='Scanned line'?'Scanned underline':'Vector underline',l.source==='Scanned line'?.55:.68);}
 proposals.sort((a,b)=>Math.abs(a.rect[3]-b.rect[3])<10?a.rect[0]-b.rect[0]:b.rect[3]-a.rect[3]);proposals.forEach((p,i)=>p.order=i+1);
 if(proposals.length===FORM_DETECTION_LIMITS.proposals)warnings.push('Reached 100 suggestions on this page; additional locations were omitted.');
 return {proposals,warnings};
}

export function detectionBuilderFields(proposals){
 return [...proposals].sort((a,b)=>a.order-b.order||a.page-b.page||b.rect[3]-a.rect[3]||a.rect[0]-b.rect[0]).map(p=>({name:clean(p.name),label:clean(p.label),type:p.type==='checkbox'?'checkbox':'text',page:p.page,rect:[...p.rect],required:false,readOnly:false,fontSize:p.fontSize}));
}
