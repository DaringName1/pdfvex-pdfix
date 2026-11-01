const kinds=['highlight','underline','note','text','ink','line','arrow','cloud','callout'];
const finite=n=>Number.isFinite(n)&&Math.abs(n)<=10000000;
function validMarkupDraft(draft){
  if(!draft||draft.kind!=='markup'||draft.version!==1||!Array.isArray(draft.marks)||draft.marks.length>500)throw new Error('Invalid markup recovery.');
  let points=0,chars=0;const ids=new Set();
  for(const mark of draft.marks){
    if(!mark||!/^pdfix-[a-f0-9-]{36}$/.test(mark.id)||ids.has(mark.id)||!kinds.includes(mark.kind)||!Number.isInteger(mark.page)||mark.page<0||mark.page>=500||!['yellow','green','blue','red','black'].includes(mark.color)||typeof mark.text!=='string'||mark.text.length>2000||![0,90,180,270].includes(mark.rotation)||!finite(mark.fontSize)||mark.fontSize<8||mark.fontSize>48||!Array.isArray(mark.rect)||mark.rect.length!==4||!mark.rect.every(finite)||mark.rect[2]-mark.rect[0]<.1||mark.rect[3]-mark.rect[1]<.1)throw new Error('Invalid markup recovery.');
    if(mark.kind==='ink'){
      const width=Object.hasOwn(mark,'inkWidth')?mark.inkWidth:2,opacity=Object.hasOwn(mark,'inkOpacity')?mark.inkOpacity:1;
      if(!Number.isFinite(width)||width<.5||width>12||!Number.isFinite(opacity)||opacity<.1||opacity>1)throw new Error('Invalid ink style in markup recovery.');
    }else if(Object.hasOwn(mark,'inkWidth')||Object.hasOwn(mark,'inkOpacity')||Object.hasOwn(mark,'inkPressure'))throw new Error('Invalid ink style in markup recovery.');
    if(Object.hasOwn(mark,'highlightOpacity')&&(mark.kind!=='highlight'||!Number.isFinite(mark.highlightOpacity)||mark.highlightOpacity<.1||mark.highlightOpacity>1))throw new Error('Invalid highlighter opacity in markup recovery.');
    ids.add(mark.id);chars+=mark.text.length;
    const point=(x,y)=>finite(x)&&finite(y)&&x>=mark.rect[0]-.01&&x<=mark.rect[2]+.01&&y>=mark.rect[1]-.01&&y<=mark.rect[3]+.01;
    const coords=(value,min,max,multiple=2)=>Array.isArray(value)&&value.length>=min&&value.length<=max&&value.length%multiple===0&&value.every(finite)&&value.every((n,i)=>i%2||point(n,value[i+1]));
    if(['highlight','underline'].includes(mark.kind)&&!coords(mark.quads,8,400,8))throw new Error('Invalid markup selected-area coordinates.');
    if(['ink','line','arrow','callout'].includes(mark.kind)){
      const limit=['line','arrow'].includes(mark.kind)?4:mark.kind==='callout'?6:2000;
      if(!coords(mark.path,mark.kind==='callout'?6:4,limit))throw new Error('Invalid markup drawing coordinates.');
      if(Object.hasOwn(mark,'inkPressure')&&(mark.kind!=='ink'||!Array.isArray(mark.inkPressure)||mark.inkPressure.length!==mark.path.length/2||mark.inkPressure.some(p=>!Number.isFinite(p)||p<0||p>1||Math.round(p*1000)/1000!==p)))throw new Error('Invalid ink pressure in markup recovery.');
      points+=mark.path.length/2;
      if(['line','arrow','callout'].includes(mark.kind)&&Math.hypot(mark.path[2]-mark.path[0],mark.path[3]-mark.path[1])<2)throw new Error('Invalid markup line / leader endpoints.');
      if(['arrow','callout'].includes(mark.kind)){
        const start=mark.kind==='callout',tip=start?mark.path.slice(0,2):mark.path.slice(-2),other=start?mark.path.slice(2,4):mark.path.slice(-4,-2),dx=other[0]-tip[0],dy=other[1]-tip[1],length=Math.hypot(dx,dy),size=Math.min(8,length*.3),ux=dx/length,uy=dy/length;
        if(!point(tip[0]+ux*size-uy*size*.5,tip[1]+uy*size+ux*size*.5)||!point(tip[0]+ux*size+uy*size*.5,tip[1]+uy*size-ux*size*.5))throw new Error('Invalid markup arrowhead bounds.');points+=3;
      }
    }
    if(mark.kind==='callout'){
      const r=mark.textRect;if(!Array.isArray(r)||r.length!==4||!r.every(finite)||r[2]-r[0]<20||r[3]-r[1]<20||!point(r[0],r[1])||!point(r[2],r[3]))throw new Error('Invalid callout text rectangle.');
      const attach=mark.path.slice(-2),onEdge=Math.abs(attach[0]-r[0])<.01||Math.abs(attach[0]-r[2])<.01||Math.abs(attach[1]-r[1])<.01||Math.abs(attach[1]-r[3])<.01;
      if(!onEdge||attach[0]<r[0]-.01||attach[0]>r[2]+.01||attach[1]<r[1]-.01||attach[1]>r[3]+.01||mark.path[0]>r[0]&&mark.path[0]<r[2]&&mark.path[1]>r[1]&&mark.path[1]<r[3])throw new Error('Invalid callout leader attachment.');
    }
    if(mark.kind==='cloud'){
      const w=mark.rect[2]-mark.rect[0],h=mark.rect[3]-mark.rect[1];if(w<16||h<16)throw new Error('Invalid revision cloud rectangle.');
      const radius=Math.min(6,w/8,h/8),inset=radius+2,steps=d=>Math.max(2,Math.min(64,Math.ceil(d/(radius*2))));points+=(steps(w-2*inset)*2+steps(h-2*inset)*2)*3+1;
    }
  }
  if(points>20000||chars>1000000)throw new Error('Markup recovery is too large.');return draft;
}
module.exports={validMarkupDraft};
