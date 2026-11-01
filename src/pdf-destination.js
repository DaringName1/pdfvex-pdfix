import {viewportRectangle} from './pdf-viewport-geometry.js';

const sizes={XYZ:5,Fit:2,FitB:2,FitH:3,FitBH:3,FitV:3,FitBV:3,FitR:6};
const number=value=>Number.isFinite(value)&&Math.abs(value)<=1e8;
const stale=()=>new Error('The PDF view changed. Choose the destination again.');
async function limited(promise){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('The PDF destination did not finish loading. Try again.')),20000);})]);}finally{clearTimeout(timer);}}

function waitForDestinationView(reader,current,intent){
  return new Promise((resolve,reject)=>{
    const deadline=Date.now()+20000;let stable=0;
    const check=()=>{
      if(!current()||reader.navigationIntent!==intent||!reader.root.isConnected||reader.viewNavigation?.closed){reject(stale());return;}
      if(Date.now()>=deadline){reject(new Error('The PDF view did not finish loading. Try the destination again.'));return;}
      const ready=reader.paper.dataset.ready==='true'&&!reader.activePageRenders&&!reader.multiPage?.updating&&!reader.viewNavigation?.busy;
      // Give resize observations a chance to invalidate an old ready page.
      stable=ready?stable+1:0;if(stable>=3){resolve();return;}setTimeout(check,25);
    };
    check();
  });
}

export async function resolvePdfDestination(doc,raw){
  if(typeof raw==='string'){
    if(!raw.length||raw.length>4096||/[\x00-\x1f]/.test(raw))throw new Error('This PDF destination has an unsupported name.');
    raw=await limited(doc.getDestination(raw));
  }
  const kind=raw?.[1]?.name;
  if(!Array.isArray(raw)||!Object.hasOwn(sizes,kind)||raw.length!==sizes[kind])throw new Error('This PDF destination has an unsupported view type.');
  if(raw.slice(2).some(value=>value!==null&&!number(value))||kind==='FitR'&&raw.slice(2).some(value=>value===null)||kind==='XYZ'&&raw[4]!==null&&(raw[4]<0||raw[4]>64))throw new Error('This PDF destination has invalid coordinates or zoom.');
  const first=raw[0];let index;
  if(Number.isInteger(first))index=first;
  else if(first&&Number.isInteger(first.num)&&first.num>0&&Number.isInteger(first.gen)&&first.gen>=0&&first.gen<=65535)index=await limited(doc.getPageIndex(first));
  else throw new Error('This PDF destination has an unsupported page reference.');
  if(!Number.isInteger(index)||index<0||index>=doc.numPages)throw new Error('This PDF destination points outside the document.');
  return {page:index+1,kind,args:raw.slice(2)};
}

// All sizing and positioning use the same rotated/cropped/UserUnit-aware
// viewport as the renderer. The reader's existing canvas limits still apply.
export function pdfDestinationView(page,destination,{rotation=0,width,height,zoom=1,currentPoint=null,pixelLimit=16000000}={}){
  if(![width,height,pixelLimit].every(value=>Number.isFinite(value)&&value>0))throw new Error('The PDF destination has no usable viewing area.');
  const base=page.getViewport({scale:1,rotation:(page.rotate+rotation)%360}),box=page.view;
  if(!Array.isArray(box)||box.length!==4||!box.every(number)||![base.width,base.height].every(value=>Number.isFinite(value)&&value>0))throw new Error('This PDF destination has unsupported page geometry.');
  const {kind,args}=destination,previous=Array.isArray(currentPoint)&&currentPoint.length===2&&currentPoint.every(number)?currentPoint:[box[0],box[3]];
  let scale=zoom,point=[box[0],box[3]],rectangle=null;
  if(kind==='XYZ'){point=[args[0]??previous[0],args[1]??previous[1]];scale=args[2]||zoom;}
  else if(kind==='Fit'||kind==='FitB'){scale=Math.min(width/base.width,height/base.height);point=null;}
  else if(kind==='FitH'||kind==='FitBH'){scale=width/base.width;point=[args[0]===null?previous[0]:box[0],args[0]??previous[1]];}
  else if(kind==='FitV'||kind==='FitBV'){scale=height/base.height;point=[args[0]??previous[0],box[3]];}
  else if(kind==='FitR'){
    rectangle=args;const mapped=viewportRectangle(base,rectangle),w=mapped[2]-mapped[0],h=mapped[3]-mapped[1];
    if(args[2]<=args[0]||args[3]<=args[1]||!w||!h)throw new Error('This PDF destination has an empty or reversed rectangle.');
    scale=Math.min(width/w,height/h);
  }else throw new Error('This PDF destination has an unsupported view type.');
  if(!Number.isFinite(scale)||scale<=0)throw new Error('This PDF destination has invalid zoom.');
  scale=Math.min(Math.max(.05,Math.min(3,scale)),Math.sqrt(pixelLimit/(base.width*base.height)),16383/base.width,16383/base.height);
  const viewport=page.getViewport({scale,rotation:(page.rotate+rotation)%360});
  let left=0,top=0;
  if(rectangle){const mapped=viewportRectangle(viewport,rectangle);left=mapped[0]-(width-(mapped[2]-mapped[0]))/2;top=mapped[1]-(height-(mapped[3]-mapped[1]))/2;}
  else if(point)[left,top]=viewport.convertToViewportPoint(...point);
  if(![left,top].every(Number.isFinite))throw new Error('This PDF destination could not be positioned.');
  return {zoom:scale,left:Math.max(0,left),top:Math.max(0,top),viewport};
}

export async function navigatePdfDestination(reader,raw,{expectedDoc=reader.doc}={}){
  const doc=expectedDoc,file=reader.file,intent=reader.navigationIntent,rotation=reader.viewRotation;
  if(!doc||reader.disposed||reader.doc!==doc)throw stale();
  const current=()=>!reader.disposed&&reader.doc===doc&&reader.file===file&&reader.viewRotation===rotation;
  const destination=await resolvePdfDestination(doc,raw);
  if(!current()||reader.navigationIntent!==intent)throw stale();
  // Opening the outline can refit the displayed page. In on-demand mode that
  // render supersedes other page extractions, so settle it before loading the
  // destination's geometry, not only before applying its final view.
  await waitForDestinationView(reader,current,intent);
  const page=await limited(doc.getPage(destination.page));
  if(!current()||reader.navigationIntent!==intent)throw stale();
  await waitForDestinationView(reader,current,intent);
  const work=async()=>{
    if(!current()||reader.navigationIntent!==intent)throw stale();
    const currentViewport=reader.viewNavigation?.current?.viewport,stage=reader.stage,paper=reader.paper,style=getComputedStyle(stage);
    const bounds=paper.getBoundingClientRect(),stageBounds=stage.getBoundingClientRect();
    const currentPoint=currentViewport&&!paper.hidden?currentViewport.convertToPdfPoint(stageBounds.left+stage.clientLeft-bounds.left,stageBounds.top+stage.clientTop-bounds.top):null;
    const width=Math.max(1,stage.clientWidth-parseFloat(style.paddingLeft||0)-parseFloat(style.paddingRight||0)-24),height=Math.max(1,stage.clientHeight-parseFloat(style.paddingTop||0)-parseFloat(style.paddingBottom||0)-24);
    const view=pdfDestinationView(page,destination,{rotation,width,height,zoom:reader.zoom,currentPoint,pixelLimit:reader.pagePixelLimit});
    reader.fit=false;reader.fitPage=false;reader.zoom=view.zoom;reader.viewNavigation?.syncFit();reader.pageNumber=destination.page;reader.pageInput.value=destination.page;
    const control=reader.root.querySelector('.reading-view');
    if(control.value!=='page'){control.value='page';await reader.changeReadingView('page');}else await reader.go(destination.page);
    if(!current()||reader.navigationIntent!==intent+1||reader.pageNumber!==destination.page||reader.zoom!==view.zoom||paper.dataset.ready!=='true')throw stale();
    const rendered=reader.viewNavigation?.current;
    if(rendered&&(rendered.doc!==doc||rendered.page!==destination.page||rendered.rotation!==rotation))throw stale();
    const pageBounds=paper.getBoundingClientRect(),container=stage.getBoundingClientRect();
    stage.scrollLeft+=pageBounds.left-container.left-stage.clientLeft+view.left;stage.scrollTop+=pageBounds.top-container.top-stage.clientTop+view.top;
    stage.focus({preventScroll:true});
  };
  return reader.viewNavigation?reader.viewNavigation.navigate(work):work();
}
