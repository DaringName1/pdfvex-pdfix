import {sourceHeader,validateDocumentImage,DOCUMENT_IMAGE_LIMIT} from './document-image-model.js';
import LIMITS from '../desktop/document-limits.cjs';
// Prepares a picture for the document. Photos (JPEG) stay JPEG and other pictures stay PNG, so transparency is kept.
// The long side is kept within the stored-picture size, enough for full-page printing; a picture that still exceeds
// the stored-picture limit is encoded at lower quality (JPEG) or reduced further.
// An edit (when changing a picture already in the document) turns it by a quarter turn and/or trims its edges:
// {rotate:0|90|180|270, crop:{left,top,right,bottom}} with each edge a fraction of the picture to remove.
export function imageEdit(edit){
 if(edit==null)return {rotate:0,crop:{left:0,top:0,right:0,bottom:0}};if(typeof edit!=='object')throw new Error('Invalid picture change.');
 const rotate=edit.rotate??0,crop={left:0,top:0,right:0,bottom:0,...edit.crop};if(![0,90,180,270].includes(rotate))throw new Error('Pictures turn by quarter turns only.');
 if(Object.keys(crop).length!==4||Object.values(crop).some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0||v>.95)||crop.left+crop.right>.95||crop.top+crop.bottom>.95)throw new Error('Keep at least 5% of the picture in each direction when cropping.');
 return {rotate,crop};
}
export async function normalizeDocumentImage(input,mime,alt='',edit=null){
 const bytes=new Uint8Array(input),header=sourceHeader(bytes,mime),change=imageEdit(edit);if(typeof alt!=='string')alt='';alt=alt.replace(/[\x00-\x1f\x7f]/g,' ').slice(0,500);
 if(typeof createImageBitmap!=='function'||typeof OffscreenCanvas!=='function')throw new Error('The local document image decoder is unavailable.');
 const bitmap=await createImageBitmap(new Blob([bytes],{type:mime}));let canvas;try{
  if(!((bitmap.width===header.width&&bitmap.height===header.height)||(bitmap.width===header.height&&bitmap.height===header.width)))throw new Error('Decoded image dimensions do not match the bounded source header.');
  // The part of the picture kept after cropping, in source pixels; a quarter turn swaps the output sides.
  const {crop,rotate}=change,sx=Math.round(bitmap.width*crop.left),sy=Math.round(bitmap.height*crop.top),sw=Math.max(1,Math.round(bitmap.width*(1-crop.left-crop.right))),sh=Math.max(1,Math.round(bitmap.height*(1-crop.top-crop.bottom))),turned=rotate===90||rotate===270;
  const fit=Math.min(1,LIMITS.IMAGE_STORED_SIDE/Math.max(sw,sh));let width=Math.max(1,Math.round((turned?sh:sw)*fit)),height=Math.max(1,Math.round((turned?sw:sh)*fit));
  canvas=new OffscreenCanvas(width,height);const context=canvas.getContext('2d');if(!context)throw new Error('The local image canvas is unavailable.');
  const type=mime==='image/jpeg'?'image/jpeg':'image/png',draw=()=>{canvas.width=width;canvas.height=height;context.setTransform(1,0,0,1,0,0);context.translate(width/2,height/2);context.rotate(rotate*Math.PI/180);const w=turned?height:width,h=turned?width:height;context.drawImage(bitmap,sx,sy,sw,sh,-w/2,-h/2,w,h);};draw();
  let quality=.9,blob=await canvas.convertToBlob({type,quality});
  for(let attempt=0;blob.size>DOCUMENT_IMAGE_LIMIT&&attempt<6;attempt++){
   if(type==='image/jpeg'&&quality>.7){quality-=.1;}else{const scale=Math.min(.85,Math.sqrt(DOCUMENT_IMAGE_LIMIT/blob.size)*.9);width=Math.max(1,Math.floor(width*scale));height=Math.max(1,Math.floor(height*scale));draw();}
   blob=await canvas.convertToBlob({type,quality});
  }
  if(blob.size>DOCUMENT_IMAGE_LIMIT)throw new Error('The picture could not be prepared within 4 MB. Resize it in the image workspace first.');
  const prepared=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<prepared.length;i+=16384)binary+=String.fromCharCode(...prepared.subarray(i,i+16384));
  const scale=Math.min(1,480/canvas.width,600/canvas.height),attrs={src:'data:'+type+';base64,'+btoa(binary),alt,width:Math.max(8,Math.round(canvas.width*scale)),height:Math.max(8,Math.round(canvas.height*scale)),pixelWidth:canvas.width,pixelHeight:canvas.height};validateDocumentImage(attrs);
  const reduced=edit==null&&canvas.width<bitmap.width&&canvas.height<bitmap.height;
  return {attrs,notice:reduced?`The picture was prepared at ${canvas.width}×${canvas.height} pixels (from ${bitmap.width}×${bitmap.height}), enough for printing at its size in the document.`:''};
 }finally{bitmap.close();if(canvas){canvas.width=1;canvas.height=1;}}
}
