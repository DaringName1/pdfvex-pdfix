import {inkStyle} from './markup-model.js';
export const quantizePressure=value=>Math.round(Math.max(0,Math.min(1,value))*1000)/1000;
export function pressureWidth(mark,index){const p=mark.inkPressure?.[index];return inkStyle(mark).width*(p===undefined?1:.25+.75*p);}
export function inkOutline(mark){
 if(!mark.inkPressure||mark.path.length<4)return null;const points=Array.from({length:mark.path.length/2},(_,i)=>[mark.path[i*2],mark.path[i*2+1]]),units=[];
 for(let i=1;i<points.length;i++){const dx=points[i][0]-points[i-1][0],dy=points[i][1]-points[i-1][1],length=Math.hypot(dx,dy);units.push(length>1e-8?[dx/length,dy/length]:units.at(-1)||[1,0]);}
 const left=[],right=[];for(let i=0;i<points.length;i++){const before=units[Math.max(0,i-1)],after=units[Math.min(units.length-1,i)],nx=-before[1]-after[1],ny=before[0]+after[0],length=Math.hypot(nx,ny),normal=length>1e-8?[nx/length,ny/length]:[-after[1],after[0]],dot=normal[0]*-after[1]+normal[1]*after[0],radius=pressureWidth(mark,i)/2,offset=radius/Math.max(.5,Math.abs(dot));left.push([points[i][0]+normal[0]*offset,points[i][1]+normal[1]*offset]);right.push([points[i][0]-normal[0]*offset,points[i][1]-normal[1]*offset]);}
 const outline=[...left],cap=(center,radius,startAngle)=>{for(let i=1;i<=8;i++){const angle=startAngle-Math.PI*i/8;outline.push([center[0]+Math.cos(angle)*radius,center[1]+Math.sin(angle)*radius]);}};
 const end=units.at(-1);cap(points.at(-1),pressureWidth(mark,points.length-1)/2,Math.atan2(end[0],-end[1]));outline.push(...right.slice(0,-1).reverse());const start=units[0];cap(points[0],pressureWidth(mark,0)/2,Math.atan2(-start[0],start[1]));return outline.flat();
}
