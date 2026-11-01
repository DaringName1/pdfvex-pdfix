import {quantizePressure,pressureWidth} from './markup-pressure.js';
import {inkBounds,inkStyle,validateMarks} from './markup-model.js';
const EPS=1e-8;
const intersection=(a,b)=>[Math.max(a[0],b[0]),Math.min(a[1],b[1])];
function linearInterval(offset,slope,low,high){if(Math.abs(slope)<EPS)return offset>=low&&offset<=high?[0,1]:null;const a=(low-offset)/slope,b=(high-offset)/slope;return [Math.min(a,b),Math.max(a,b)];}
function atMost(offset,slope){if(Math.abs(slope)<EPS)return offset<=0?[0,1]:null;const root=-offset/slope;return slope>0?[-Infinity,root]:[root,Infinity];}
function circleIntervals(a,b,center,radius,endRadius){const dx=b[0]-a[0],dy=b[1]-a[1],x=a[0]-center[0],y=a[1]-center[1],dr=endRadius-radius,A=dx*dx+dy*dy-dr*dr,B=2*(x*dx+y*dy-radius*dr),C=x*x+y*y-radius*radius;if(Math.abs(A)<EPS){const interval=atMost(C,B);return interval?[interval]:[];}const disc=B*B-4*A*C;if(disc<0)return A<0?[[0,1]]:[];const root=Math.sqrt(disc),r1=(-B-root)/(2*A),r2=(-B+root)/(2*A),low=Math.min(r1,r2),high=Math.max(r1,r2);return A>0?[[low,high]]:[[-Infinity,low],[high,Infinity]];}
function capsuleIntervals(a,b,c,d,radius,endRadius=radius){const values=[...circleIntervals(a,b,c,radius,endRadius),...circleIntervals(a,b,d,radius,endRadius)],dx=d[0]-c[0],dy=d[1]-c[1],length=Math.hypot(dx,dy);if(length>EPS){const ux=dx/length,uy=dy/length,x=a[0]-c[0],y=a[1]-c[1],ax=b[0]-a[0],ay=b[1]-a[1],along=linearInterval(x*ux+y*uy,ax*ux+ay*uy,0,length),offset=-x*uy+y*ux,slope=-ax*uy+ay*ux,dr=endRadius-radius,one=atMost(offset-radius,slope-dr),two=atMost(-offset-radius,-slope-dr);if(along&&one&&two)values.push(intersection(along,intersection(one,two)));}return values.filter(Boolean).map(v=>intersection(v,[0,1])).filter(v=>v[1]-v[0]>EPS);}
function merge(values){values.sort((a,b)=>a[0]-b[0]);const result=[];for(const value of values){const last=result.at(-1);if(last&&value[0]<=last[1]+EPS)last[1]=Math.max(last[1],value[1]);else result.push([...value]);}return result;}
// Cut straight InkList segments against the entire eraser sweep, including its
// rounded ends. Remaining geometry is interpolated, not resampled or guessed.
export function reviewInkErasure(marks,page,trail,radius,pages,makeId=()=> 'pdfix-'+crypto.randomUUID()){
 if(!Array.isArray(trail)||!trail.length||trail.length>250||trail.some(p=>!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n)||Math.abs(n)>1e7))||!Number.isFinite(radius)||radius<=0||radius>1e7)throw new Error('Use a bounded eraser stroke on this page.');
 const capsules=trail.length===1?[[trail[0],trail[0]]]:trail.slice(1).map((point,i)=>[trail[i],point]),next=[];let changed=0,fragments=0,work=0;
 for(const mark of marks){if(mark.kind!=='ink'||mark.page!==page){next.push(mark);continue;}const runs=[],pressureRuns=[];let run=[],pressureRun=[],pressureAt=null,touched=false;const r=radius+inkStyle(mark).width/2;
  const append=(point,t)=>{const pressure=mark.inkPressure?pressureAt(t):null;if(!run.length||Math.hypot(run.at(-2)-point[0],run.at(-1)-point[1])>EPS||pressure!==null&&Math.abs(pressure-pressureRun.at(-1))>EPS){run.push(...point);if(pressure!==null)pressureRun.push(pressure);}};const finish=()=>{if(run.length>=4){runs.push(run);pressureRuns.push(pressureRun);}run=[];pressureRun=[];};
  for(let i=2;i<mark.path.length;i+=2){const a=mark.path.slice(i-2,i),b=mark.path.slice(i,i+2),intervals=[],startRadius=radius+pressureWidth(mark,i/2-1)/2,endRadius=radius+pressureWidth(mark,i/2)/2;if(mark.inkPressure){const from=mark.inkPressure[i/2-1],to=mark.inkPressure[i/2];pressureAt=t=>quantizePressure(from+(to-from)*t);}
   for(const [c,d]of capsules){if(++work>2_000_000)throw new Error('This eraser sweep crosses too much ink. Use a shorter stroke or fewer markups; the draft is unchanged.');if(Math.max(a[0],b[0])<Math.min(c[0],d[0])-r||Math.min(a[0],b[0])>Math.max(c[0],d[0])+r||Math.max(a[1],b[1])<Math.min(c[1],d[1])-r||Math.min(a[1],b[1])>Math.max(c[1],d[1])+r)continue;intervals.push(...capsuleIntervals(a,b,c,d,startRadius,endRadius));}
   const erased=merge(intervals),at=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];if(!erased.length){append(a,0);append(b,1);continue;}touched=true;let cursor=0;
   for(const [start,end]of erased){if(start-cursor>EPS){append(at(cursor),cursor);append(at(start),start);}finish();cursor=end;}if(1-cursor>EPS){append(at(cursor),cursor);append(b,1);}
  }finish();if(!touched){next.push(mark);continue;}changed++;
  for(let i=0;i<runs.length;i++){const copy={...structuredClone(mark),id:i===0?mark.id:makeId(),path:runs[i]};if(mark.inkPressure)copy.inkPressure=pressureRuns[i];copy.rect=inkBounds(copy.path,inkStyle(copy).width,pages[page].box);next.push(copy);fragments++;}
 }
 return {marks:validateMarks(next,pages),changed,fragments};
}
