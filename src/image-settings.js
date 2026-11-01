export const defaultImageSettings=()=>({rotation:0,paper:'a4',orientation:'auto',margin:10,crop:{left:0,top:0,right:0,bottom:0},brightness:0,contrast:0,deskew:0});
export function imageSettings(settings){
 if(!settings||![0,90,180,270].includes(settings.rotation)||!['a4','letter','image'].includes(settings.paper)||!['auto','portrait','landscape'].includes(settings.orientation)||!Number.isFinite(settings.margin)||settings.margin<0||settings.margin>50)throw new Error('Choose supported page settings and a margin from 0 to 50 mm.');
 const crop=settings.crop??{left:0,top:0,right:0,bottom:0},brightness=settings.brightness??0,contrast=settings.contrast??0,deskew=settings.deskew??0;
 if(['left','top','right','bottom'].some(side=>!Number.isFinite(crop[side])||crop[side]<0||crop[side]>=100)||crop.left+crop.right>=99.9||crop.top+crop.bottom>=99.9||![brightness,contrast].every(value=>Number.isFinite(value)&&value>=-100&&value<=100))throw new Error('Crop edges must leave part of the image; brightness and contrast range from -100 to 100.');
 if(!Number.isFinite(deskew)||deskew<-15||deskew>15)throw new Error('Choose a scan deskew angle from -15 to 15 degrees.');
 return {rotation:settings.rotation,paper:settings.paper,orientation:settings.orientation,margin:settings.margin,crop:{left:crop.left,top:crop.top,right:crop.right,bottom:crop.bottom},brightness,contrast,deskew};
}
export function cropBounds(width,height,settings){const {crop}=imageSettings(settings),left=Math.floor(width*crop.left/100),top=Math.floor(height*crop.top/100),right=Math.ceil(width*(1-crop.right/100)),bottom=Math.ceil(height*(1-crop.bottom/100));return {left,top,width:Math.max(1,right-left),height:Math.max(1,bottom-top)};}
export function imageLayout(width,height,settings){
 const s=imageSettings(settings);if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>8192||height>8192||width*height>16_000_000)throw new Error('The image dimensions exceed the conversion limit.');
 const rotated=s.rotation%180!==0,w=rotated?height:width,h=rotated?width:height,margin=s.margin*72/25.4;
 let page=s.paper==='letter'?[612,792]:s.paper==='a4'?[595.275590551,841.88976378]:[w*.75+margin*2,h*.75+margin*2];
 if(s.paper!=='image'&&(s.orientation==='landscape'||s.orientation==='auto'&&w>h))page=page.reverse();
 if(page[0]<=margin*2||page[1]<=margin*2)throw new Error('The margins leave no space for the image. Choose smaller margins.');
 const scale=Math.min((page[0]-margin*2)/w,(page[1]-margin*2)/h),drawWidth=w*scale,drawHeight=h*scale;
 return {page,scale,drawWidth,drawHeight,left:(page[0]-drawWidth)/2,bottom:(page[1]-drawHeight)/2,rotation:s.rotation,width,height};
}

export function deskewBounds(width,height,angle=0){
 if(!Number.isFinite(angle)||angle<-15||angle>15)throw new Error('Choose a scan deskew angle from -15 to 15 degrees.');
 const radians=angle*Math.PI/180,cos=Math.abs(Math.cos(radians)),sin=Math.abs(Math.sin(radians)),w=angle?Math.ceil(width*cos+height*sin):width,h=angle?Math.ceil(height*cos+width*sin):height;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>8192||h>8192||w*h>16_000_000)throw new Error('Deskewed artwork exceeds 8192 pixels per side or 16 million pixels. Crop or resize the scan first.');
 return {width:w,height:h,radians};
}
