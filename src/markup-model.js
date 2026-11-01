export const MARKUP_KINDS = ['highlight','underline','note','text','ink','line','arrow','cloud','callout'];
export const MARKUP_COLORS = {black:[0,0,0],yellow:[1,.82,.2],green:[.02,.62,.49],blue:[.12,.37,.65],red:[.85,.12,.14]};
export const INK_WIDTHS=[.5,1,2,4,8,12];
export function inkStyle(mark){
 const width=Object.hasOwn(mark,'inkWidth')?mark.inkWidth:2,opacity=Object.hasOwn(mark,'inkOpacity')?mark.inkOpacity:1;
 if(!Number.isFinite(width)||width<.5||width>12||!Number.isFinite(opacity)||opacity<.1||opacity>1)throw new Error('Ink width must be 0.5–12 pt and opacity 10–100%.');
 return {width,opacity};
}
export function highlightOpacity(mark){const value=Object.hasOwn(mark,'highlightOpacity')?mark.highlightOpacity:.3;if(!Number.isFinite(value)||value<.1||value>1)throw new Error('Highlighter opacity must be 10–100%.');return value;}
const finite = n => Number.isFinite(n) && Math.abs(n) <= 10_000_000;
export function validateMarks(marks,pages) {
  if(!Array.isArray(marks)||marks.length>500)throw new Error('Keep at most 500 markups in one PDF.');
  const ids=new Set();let points=0,chars=0;
  return marks.map(mark=>{
    if(!mark||!/^pdfix-[a-f0-9-]{36}$/.test(mark.id)||ids.has(mark.id)||!MARKUP_KINDS.includes(mark.kind)||!Number.isInteger(mark.page)||mark.page<0||mark.page>=pages.length||!Object.hasOwn(MARKUP_COLORS,mark.color)||typeof mark.text!=='string'||mark.text.length>2000||![0,90,180,270].includes(mark.rotation)||!finite(mark.fontSize)||mark.fontSize<8||mark.fontSize>48)throw new Error('A markup has invalid contents, type or page.');
    ids.add(mark.id);chars+=mark.text.length;
    const rect=mark.rect,box=pages[mark.page].box;
    if(!Array.isArray(rect)||rect.length!==4||!rect.every(finite)||rect[2]-rect[0]<.1||rect[3]-rect[1]<.1||rect[0]<box[0]-.01||rect[1]<box[1]-.01||rect[2]>box[2]+.01||rect[3]>box[3]+.01)throw new Error('A markup is outside the visible page boundary.');
    const point=(x,y)=>finite(x)&&finite(y)&&x>=rect[0]-.01&&x<=rect[2]+.01&&y>=rect[1]-.01&&y<=rect[3]+.01;
    const value={id:mark.id,kind:mark.kind,page:mark.page,color:mark.color,text:mark.text,rotation:mark.rotation,fontSize:mark.fontSize,rect:[...rect]};
    if(mark.kind==='ink'){inkStyle(mark);for(const key of ['inkWidth','inkOpacity'])if(Object.hasOwn(mark,key))value[key]=mark[key];}
    else if(Object.hasOwn(mark,'inkWidth')||Object.hasOwn(mark,'inkOpacity')||Object.hasOwn(mark,'inkPressure'))throw new Error('Ink style belongs only to an ink stroke.');
    if(mark.kind==='highlight'){highlightOpacity(mark);if(Object.hasOwn(mark,'highlightOpacity'))value.highlightOpacity=mark.highlightOpacity;}else if(Object.hasOwn(mark,'highlightOpacity'))throw new Error('Highlighter opacity belongs only to a highlight.');
    if(['highlight','underline'].includes(mark.kind)){
      if(!Array.isArray(mark.quads)||!mark.quads.length||mark.quads.length%8||mark.quads.length>400)throw new Error('A text markup needs valid selected-area coordinates.');
      for(let i=0;i<mark.quads.length;i+=2)if(!point(mark.quads[i],mark.quads[i+1]))throw new Error('Selected words fall outside the markup boundary.');
      value.quads=[...mark.quads];
    }
    if(['ink','line','arrow','callout'].includes(mark.kind)){
      if(!Array.isArray(mark.path)||mark.path.length<4||['line','arrow'].includes(mark.kind)&&mark.path.length!==4||mark.kind==='callout'&&mark.path.length!==6||mark.path.length%2||mark.path.length>2000)throw new Error('A drawing needs between 2 and 1,000 points.');
      for(let i=0;i<mark.path.length;i+=2)if(!point(mark.path[i],mark.path[i+1]))throw new Error('A drawing falls outside the markup boundary.');
      if(Object.hasOwn(mark,'inkPressure')){if(mark.kind!=='ink'||!Array.isArray(mark.inkPressure)||mark.inkPressure.length!==mark.path.length/2||mark.inkPressure.some(p=>!Number.isFinite(p)||p<0||p>1||Math.round(p*1000)/1000!==p))throw new Error('An ink stroke has invalid pressure samples.');value.inkPressure=[...mark.inkPressure];}
      points+=mark.path.length/2;value.path=[...mark.path];if(['line','arrow','callout'].includes(mark.kind)&&Math.hypot(mark.path[2]-mark.path[0],mark.path[3]-mark.path[1])<2)throw new Error('A line or leader needs separated endpoints.');if(['arrow','callout'].includes(mark.kind)){const head=markupArrowHead(mark.path,mark.kind==='callout');for(let i=0;i<head.length;i+=2)if(!point(head[i],head[i+1]))throw new Error('Move the arrowhead farther inside the visible page.');points+=3;}
    }
    if(mark.kind==='callout'){const r=mark.textRect;if(!Array.isArray(r)||r.length!==4||!r.every(finite)||r[2]-r[0]<20||r[3]-r[1]<20||!point(r[0],r[1])||!point(r[2],r[3]))throw new Error('A callout needs a readable inner text box.');const attach=mark.path.slice(-2),onEdge=Math.abs(attach[0]-r[0])<.01||Math.abs(attach[0]-r[2])<.01||Math.abs(attach[1]-r[1])<.01||Math.abs(attach[1]-r[3])<.01;if(!onEdge||attach[0]<r[0]-.01||attach[0]>r[2]+.01||attach[1]<r[1]-.01||attach[1]>r[3]+.01||mark.path[0]>r[0]&&mark.path[0]<r[2]&&mark.path[1]>r[1]&&mark.path[1]<r[3])throw new Error('The callout tip must be outside its text box and the leader must attach to its border.');value.textRect=[...r];}if(mark.kind==='cloud'){if(rect[2]-rect[0]<16||rect[3]-rect[1]<16)throw new Error('Draw a revision cloud at least 16 points wide and tall.');points+=markupCloudPath(rect).curves.length*3+1;}
    if(points>20000||chars>1_000_000)throw new Error('The markup content exceeds its recovery/output limit.');
    return value;
  });
}
export function areaQuad(viewport,rect){return [[rect.left,rect.top],[rect.right,rect.top],[rect.left,rect.bottom],[rect.right,rect.bottom]].flatMap(([x,y])=>viewport.convertToPdfPoint(x,y));}
export function boundsOf(coordinates,padding=0,box=null){const x=coordinates.filter((_,i)=>i%2===0),y=coordinates.filter((_,i)=>i%2===1);let rect=[Math.min(...x)-padding,Math.min(...y)-padding,Math.max(...x)+padding,Math.max(...y)+padding];if(box)rect=[Math.max(box[0],rect[0]),Math.max(box[1],rect[1]),Math.min(box[2],rect[2]),Math.min(box[3],rect[3])];return rect;}
export function inkBounds(path,width,box){
 const rect=boundsOf(path,width+1,box),minimum=2*width+2;
 for(let axis=0;axis<2;axis++){
  if(box[axis+2]-box[axis]<minimum)throw new Error('Choose thinner ink for this small visible page.');
  const span=Math.max(minimum,rect[axis+2]-rect[axis]);rect[axis]=Math.max(box[axis],Math.min(rect[axis],box[axis+2]-span));rect[axis+2]=rect[axis]+span;
 }
 return rect;
}

export function markupArrowHead(path,atStart=false){
 const tip=atStart?path.slice(0,2):path.slice(-2),other=atStart?path.slice(2,4):path.slice(-4,-2),dx=other[0]-tip[0],dy=other[1]-tip[1],length=Math.hypot(dx,dy),size=Math.min(8,length*.3),ux=dx/length,uy=dy/length;
 return [tip[0]+ux*size-uy*size*.5,tip[1]+uy*size+ux*size*.5,...tip,tip[0]+ux*size+uy*size*.5,tip[1]+uy*size-ux*size*.5];
}
export function markupCloudPath(rect){
 const [l,b,r,t]=rect,w=r-l,h=t-b,radius=Math.min(6,w/8,h/8),inset=radius+2,x0=l+inset,x1=r-inset,y0=b+inset,y1=t-inset,curves=[],start=[x0,y0];
 const edge=(a,z,normal)=>{const dx=z[0]-a[0],dy=z[1]-a[1],steps=Math.max(2,Math.min(64,Math.ceil(Math.hypot(dx,dy)/(radius*2))));for(let i=0;i<steps;i++){const p=[a[0]+dx*i/steps,a[1]+dy*i/steps],q=[a[0]+dx*(i+1)/steps,a[1]+dy*(i+1)/steps],cx=(q[0]-p[0])/3,cy=(q[1]-p[1])/3,ox=normal[0]*radius*4/3,oy=normal[1]*radius*4/3;curves.push([p[0]+cx+ox,p[1]+cy+oy,p[0]+cx*2+ox,p[1]+cy*2+oy,...q]);}};
 edge([x0,y0],[x1,y0],[0,-1]);edge([x1,y0],[x1,y1],[1,0]);edge([x1,y1],[x0,y1],[0,1]);edge([x0,y1],[x0,y0],[-1,0]);return {start,curves,inset};
}
