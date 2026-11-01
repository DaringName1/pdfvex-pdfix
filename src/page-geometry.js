import {paperSize,paperPoints} from './paper-sizes.js';
const PT=72/25.4;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
export function visibleBox(media,crop=media){
 for(const box of [media,crop])if(!box||!['x','y','width','height'].every(k=>finite(box[k]))||box.width<=0||box.height<=0||box.width>14400||box.height>14400||Math.abs(box.x)>1e6||Math.abs(box.y)>1e6)throw new Error('This page has unsupported or invalid page bounds.');
 const x=Math.max(media.x,crop.x),y=Math.max(media.y,crop.y),right=Math.min(media.x+media.width,crop.x+crop.width),top=Math.min(media.y+media.height,crop.y+crop.height);
 if(right<=x||top<=y)throw new Error('This page has an empty visible area.');return {x,y,width:right-x,height:top-y};
}
export function pageGeometry(info,row){
 if(![0,90,180,270].includes(row.turn))throw new Error('A page rotation is invalid.');
 const rotation=((info.rotation+row.turn)%360+360)%360;if(![0,90,180,270].includes(rotation))throw new Error('This page has an unsupported rotation.');
 const box=visibleBox(info.media,info.crop),crop=row.crop??{top:0,right:0,bottom:0,left:0};
 if(!crop||!['top','right','bottom','left'].every(k=>finite(crop[k])&&crop[k]>=0&&crop[k]<=5000))throw new Error('Crop margins must be numbers between 0 and 5,000 mm.');
 const [top,right,bottom,left]=['top','right','bottom','left'].map(k=>crop[k]*PT);
 const visualWidth=rotation%180?box.height:box.width,visualHeight=rotation%180?box.width:box.height;
 if(visualWidth-left-right<1||visualHeight-top-bottom<1)throw new Error('Crop margins must leave at least 1 point of visible page. Reduce the margins.');
 // Visual top/right/bottom/left map to raw PDF top/right/bottom/left at each clockwise rotation.
 const raw=[[top,right,bottom,left],[right,bottom,left,top],[bottom,left,top,right],[left,top,right,bottom]][rotation/90];
 const cropped={x:box.x+raw[3],y:box.y+raw[2],width:box.width-raw[1]-raw[3],height:box.height-raw[0]-raw[2]};
 const width=visualWidth-left-right,height=visualHeight-top-bottom;
 let paper=null,scale=1,x=0,y=0;
 if(row.resize){const r=row.resize;
  if((r.paper!=='custom'&&!paperSize(r.paper))||!['portrait','landscape'].includes(r.orientation)||!finite(r.margin)||r.margin<0||r.margin>50)throw new Error('Choose a valid paper size, orientation and margin from 0 to 50 mm.');
  if(r.paper==='custom'&&(!finite(r.width)||!finite(r.height)||r.width<10||r.height<10||r.width>2000||r.height>2000))throw new Error('Custom page dimensions must be between 10 and 2,000 mm.');
  // Custom width/height are final output dimensions, as in existing recovery recipes.
  // Only named presets swap dimensions for the chosen orientation.
  paper=r.paper==='custom'?[r.width*PT,r.height*PT]:paperPoints(r.paper,r.orientation);
  const margin=r.margin*PT;if(paper[0]-2*margin<1||paper[1]-2*margin<1)throw new Error('The paper margin leaves no room for this page.');
  scale=Math.min((paper[0]-2*margin)/width,(paper[1]-2*margin)/height);x=(paper[0]-width*scale)/2;y=(paper[1]-height*scale)/2;
 }
 return {rotation,box,cropped,width,height,paper,scale,x,y,viewport:paper??[width,height]};
}
