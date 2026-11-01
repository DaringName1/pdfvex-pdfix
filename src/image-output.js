import {PDFDocument,degrees,PDFName,PDFDict,PDFRawStream} from 'pdf-lib';
import {inspectImage} from './image-header.js';import {imageLayout,imageSettings} from './image-settings.js';
import {preparedImage} from './image-adjustments.js';
function validateImageSource(image){
 if(!image||typeof image!=='object')throw new Error('Choose a prepared source image before conversion.');
 const size=inspectImage(image.bytes,'png',{bytes:64*1024*1024,side:8192,pixels:16_000_000});
 if(size.width!==image.width||size.height!==image.height)throw new Error('Image dimensions changed before conversion.');
 return size;
}
export async function imagePdf(image,settings){
 validateImageSource(image);settings=imageSettings(settings);
 image=await preparedImage(image,settings);
 const {width,height}=inspectImage(image.bytes,'png',{bytes:64*1024*1024,side:8192,pixels:16_000_000});if(width!==image.width||height!==image.height)throw new Error('Image dimensions changed before conversion.');
 const layout=imageLayout(width,height,settings),doc=await PDFDocument.create(),asset=await doc.embedPng(image.bytes),page=doc.addPage(layout.page),r=layout.rotation;
 page.drawImage(asset,{x:layout.left+(r===180||r===270?layout.drawWidth:0),y:layout.bottom+(r===90||r===180?layout.drawHeight:0),width:width*layout.scale,height:height*layout.scale,rotate:degrees(-r)});
 const bytes=await doc.save();if(bytes.length>100*1024*1024)throw new Error('The PDF exceeds 100 MB. Try a smaller image.');
 const verified=await PDFDocument.load(bytes);if(verified.getPageCount()!==1)throw new Error('The generated page count could not be verified.');const saved=verified.getPage(0),box=saved.getMediaBox();if(Math.abs(box.width-layout.page[0])>.001||Math.abs(box.height-layout.page[1])>.001)throw new Error('The generated page size could not be verified.');
 const resources=saved.node.lookup(PDFName.of('Resources'),PDFDict),objects=resources.lookup(PDFName.of('XObject'),PDFDict);let found=false;for(const [,ref] of objects.entries()){const stream=verified.context.lookup(ref,PDFRawStream);if(stream.dict.get(PDFName.of('Subtype'))?.toString()==='/Image'&&stream.dict.lookup(PDFName.of('Width')).asNumber()===width&&stream.dict.lookup(PDFName.of('Height')).asNumber()===height)found=true;}if(!found)throw new Error('The full-resolution image was not found after reopening.');
 return {bytes,layout,width,height};
}
export async function imagePagesPdf(images,pages,progress=()=>{}){
 if(!Array.isArray(images)||!images.length||images.length>10||!Array.isArray(pages)||!pages.length||pages.length>100)throw new Error('Choose up to 10 source images and 100 PDF pages.');
 let bytesTotal=0,pixels=0;const doc=await PDFDocument.create(),assets=new Map();
 for(const image of images){const size=validateImageSource(image);if((bytesTotal+=image.bytes.length)>100*1024*1024||(pixels+=size.width*size.height)>64_000_000)throw new Error('This image collection exceeds its 100 MB / 64 million pixel limit. Use fewer or smaller images.');}
 // Validate every page before decoding/editing the first source. A bad later
 // recipe must not dispatch expensive canvas work or partial progress.
 const plan=pages.map(item=>{if(!item||!Number.isInteger(item.source)||item.source<0||!images[item.source])throw new Error('A PDF page has no matching source image.');return {source:item.source,settings:imageSettings(item.settings)};});
 let editedBytes=0,editedPixels=0;
 const layouts=[];
 for(let index=0;index<plan.length;index++){
  const item=plan[index];const key=JSON.stringify([item.source,item.settings.crop,item.settings.brightness,item.settings.contrast,item.settings.deskew]);let prepared=assets.get(key);
  if(!prepared){const image=await preparedImage(images[item.source],item.settings);if((editedBytes+=image.bytes.length)>100*1024*1024||(editedPixels+=image.width*image.height)>64_000_000)throw new Error('Distinct edited images exceed 100 MB / 64 million pixels. Use fewer edits or smaller images.');prepared={image,asset:await doc.embedPng(image.bytes)};assets.set(key,prepared);}
  const {image,asset}=prepared,layout=imageLayout(image.width,image.height,item.settings),page=doc.addPage(layout.page),r=layout.rotation;page.drawImage(asset,{x:layout.left+(r===180||r===270?layout.drawWidth:0),y:layout.bottom+(r===90||r===180?layout.drawHeight:0),width:image.width*layout.scale,height:image.height*layout.scale,rotate:degrees(-r)});layouts.push(layout);progress({stage:'Creating image pages',current:index+1,total:plan.length});
 }
 const bytes=await doc.save();if(bytes.length>100*1024*1024)throw new Error('The image PDF exceeds the 100 MB save limit.');const reopened=await PDFDocument.load(bytes);if(reopened.getPageCount()!==plan.length)throw new Error('The generated image page count could not be reopened.');
 for(let index=0;index<plan.length;index++){const page=reopened.getPage(index),box=page.getMediaBox(),layout=layouts[index];if(Math.abs(box.width-layout.page[0])>.001||Math.abs(box.height-layout.page[1])>.001)throw new Error('A generated image page changed size.');const objects=page.node.lookup(PDFName.of('Resources'),PDFDict).lookup(PDFName.of('XObject'),PDFDict);if(!objects.entries().some(([,ref])=>{const stream=reopened.context.lookup(ref,PDFRawStream);return stream.dict.get(PDFName.of('Subtype'))?.toString()==='/Image'&&stream.dict.lookup(PDFName.of('Width')).asNumber()===layout.width&&stream.dict.lookup(PDFName.of('Height')).asNumber()===layout.height;}))throw new Error('An edited image was missing from the reopened PDF.');}
 return {bytes,pageCount:plan.length,layouts};
}
