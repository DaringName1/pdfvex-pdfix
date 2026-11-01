import {cropBounds,imageSettings,deskewBounds} from './image-settings.js';
import {inspectImage} from './image-header.js';
export function applyImageAdjustments(context,width,height,settings){
 const {brightness,contrast}=imageSettings(settings);if(!brightness&&!contrast)return;
 const gain=1+brightness/100,factor=1+contrast/100,table=new Uint8ClampedArray(256);
 for(let value=0;value<256;value++)table[value]=((value-127.5)*factor+127.5)*gain;
 const pixels=context.getImageData(0,0,width,height);for(let index=0;index<pixels.data.length;index+=4){pixels.data[index]=table[pixels.data[index]];pixels.data[index+1]=table[pixels.data[index+1]];pixels.data[index+2]=table[pixels.data[index+2]];}context.putImageData(pixels,0,0);
}
export async function preparedImage(image,settings){
 const valid=imageSettings(settings),crop=cropBounds(image.width,image.height,valid),artwork=deskewBounds(crop.width,crop.height,valid.deskew);
 if(!valid.deskew&&!valid.brightness&&!valid.contrast&&!Object.values(valid.crop).some(Boolean))return image;
 let bitmap,canvas;try{bitmap=await createImageBitmap(new Blob([image.bytes]));if(bitmap.width!==image.width||bitmap.height!==image.height)throw new Error('The image dimensions changed before editing.');canvas=new OffscreenCanvas(artwork.width,artwork.height);const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw new Error('This device could not create an image editing canvas.');if(valid.deskew){context.fillStyle='white';context.fillRect(0,0,artwork.width,artwork.height);}context.translate(artwork.width/2,artwork.height/2);context.rotate(artwork.radians);context.drawImage(bitmap,crop.left,crop.top,crop.width,crop.height,-crop.width/2,-crop.height/2,crop.width,crop.height);context.setTransform(1,0,0,1,0,0);applyImageAdjustments(context,artwork.width,artwork.height,valid);const blob=await canvas.convertToBlob({type:'image/png'});if(blob.type!=='image/png')throw new Error('This device could not encode the edited image as PNG.');if(blob.size>64*1024*1024)throw new Error('The edited image exceeds 64 MB.');const bytes=new Uint8Array(await blob.arrayBuffer()),size=inspectImage(bytes,'png',{bytes:64*1024*1024,side:8192,pixels:16_000_000});if(size.width!==artwork.width||size.height!==artwork.height)throw new Error('The encoded image dimensions changed during editing.');return {bytes,width:artwork.width,height:artwork.height};}finally{bitmap?.close();if(canvas){canvas.width=0;canvas.height=0;}}
}
