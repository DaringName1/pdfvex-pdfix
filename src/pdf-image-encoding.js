import {inspectImage} from './image-header.js';

export function pdfImageBlobSize(blob,ext,total=0){
 if(!['png','jpg'].includes(ext))throw new Error('Choose PNG or JPEG image output.');
 const mime=ext==='png'?'image/png':'image/jpeg';
 if(!blob||blob.type!==mime)throw new Error(`This device could not encode ${ext==='png'?'PNG':'JPEG'} page images. Choose another format.`);
 if(!Number.isSafeInteger(blob.size)||blob.size<1||!Number.isSafeInteger(total)||total<0)throw new Error('The page image could not be encoded.');
 if(blob.size>32*1024*1024||total+blob.size>100*1024*1024)throw new Error('Image output exceeds 32 MB per page or 100 MB total. Choose fewer pages or JPEG/lower resolution.');
 return total+blob.size;
}

export function pdfImageEncodedBytes(bytes,ext,layout,expectedSize){
 if(!(bytes instanceof Uint8Array)||bytes.length!==expectedSize)throw new Error('The encoded page image size changed while reading.');
 const size=inspectImage(bytes,ext);
 if(size.width!==layout.width||size.height!==layout.height)throw new Error('The encoded page image dimensions changed. Build image previews again.');
 return bytes;
}
