export function markupPointerAllowed(mode,event){
 const type=event.pointerType||'mouse';return mode==='pen'?type==='pen':mode==='touch'?type==='touch':mode==='pen-mouse'&&(type==='pen'||type==='mouse');
}
// The paper can be scaled by browser zoom or a containing layout. Pointer
// coordinates and measured text use screen pixels; PDF.js uses viewport units.
export function markupViewportPoint(event,box,viewport){
 if(![event.clientX,event.clientY,box.left,box.top,box.width,box.height,viewport.width,viewport.height].every(Number.isFinite)||box.width<=0||box.height<=0||viewport.width<=0||viewport.height<=0)throw new Error('The drawing page is not ready. Wait for the page and try again.');
 return {x:Math.max(0,Math.min(viewport.width,(event.clientX-box.left)*viewport.width/box.width)),y:Math.max(0,Math.min(viewport.height,(event.clientY-box.top)*viewport.height/box.height))};
}
export function translateMarkup(mark,dx,dy){
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.abs(dx)>1e7||Math.abs(dy)>1e7)throw new Error('Choose a finite movement inside this PDF page.');
 const next=structuredClone(mark);for(const name of ['rect','path','quads','textRect'])if(Array.isArray(next[name]))next[name]=next[name].map((value,index)=>value+(index%2?dy:dx));return next;
}
// Distance is measured in displayed pixels so zoom, rotation and UserUnit do
// not change the selection tolerance. Later strokes win equal-distance ties.
export function nearestInkStroke(marks,page,point,convert,tolerance=8){
 let selected=null,best=Infinity;
 for(const mark of marks){
  if(mark.kind!=='ink'||mark.page!==page)continue;
  const origin=convert(mark.path[0],mark.path[1]),edge=convert(mark.path[0]+(mark.inkWidth??2)/2,mark.path[1]),limit=Math.max(tolerance,Math.hypot(edge[0]-origin[0],edge[1]-origin[1])+2)**2;
  for(let i=2;i<mark.path.length;i+=2){
   const a=convert(mark.path[i-2],mark.path[i-1]),b=convert(mark.path[i],mark.path[i+1]),dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
   const t=length?Math.max(0,Math.min(1,((point.x-a[0])*dx+(point.y-a[1])*dy)/length)):0;
   const distance=(point.x-a[0]-t*dx)**2+(point.y-a[1]-t*dy)**2;
   if(distance<=limit&&distance<=best){best=distance;selected=mark;}
  }
 }
 return selected;
}
