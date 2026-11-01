// Inert checks for pictures in editable documents, shared by the editor (through src/document-image-model.js), the
// contained engine, recovery and the PDF writer. Prepared pictures are PNG, or JPEG for photos, stored as data URIs.
const LIMITS=require('./document-limits.cjs');
const DOCUMENT_IMAGE_LIMIT=LIMITS.IMAGE_STORED_BYTES;
const MAX_PIXELS=LIMITS.IMAGE_SOURCE_PIXELS;
// Picture sizes already checked, by data URI, so a document with many pictures is not decoded again on every save.
const assetHeaders=new Map();
const fail=()=>{throw new Error('Use a PNG, JPEG, GIF, BMP or WebP picture up to 40 MB and 60 million pixels. Prepared pictures are limited to 4 MB each.');};
function dimensions(width,height){if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>LIMITS.IMAGE_SOURCE_SIDE||height>LIMITS.IMAGE_SOURCE_SIDE||width*height>MAX_PIXELS)fail();return {width,height};}
function rasterHeader(input,mime){
 const bytes=new Uint8Array(input);if(bytes.length<24||bytes.length>LIMITS.IMAGE_SOURCE_BYTES)fail();const d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(mime==='image/png'){
  if(![137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)||d.getUint32(8)!==13||String.fromCharCode(...bytes.subarray(12,16))!=='IHDR')fail();
  const size=dimensions(d.getUint32(16),d.getUint32(20));let at=8,chunks=0,idat=false,end=false;
  while(at+12<=bytes.length){if(++chunks>200000)fail();const length=d.getUint32(at);if(length>bytes.length-at-12)fail();const type=String.fromCharCode(...bytes.subarray(at+4,at+8));if(type==='acTL')throw new Error('Animated PNG images are not supported. Choose a static PNG or JPEG.');if(type==='IDAT')idat=true;at+=12+length;if(type==='IEND'){if(length!==0||at!==bytes.length)fail();end=true;break;}}
  if(!idat||!end)fail();return size;
 }
 if(mime!=='image/jpeg'||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)fail();
 let at=2,size=null,segments=0;while(at<bytes.length-2){if(++segments>20000||bytes[at++]!==255)fail();while(bytes[at]===255)at++;const marker=bytes[at++];if(marker===0||marker===216||marker===217)fail();if(marker===1||marker>=208&&marker<=215)continue;
  if(at+2>bytes.length)fail();const length=d.getUint16(at);if(length<2||at+length>bytes.length)fail();
  if([192,193,194].includes(marker)){if(length<8||bytes[at+2]!==8)fail();size=dimensions(d.getUint16(at+5),d.getUint16(at+3));}
  else if(marker>=192&&marker<=207&&![196,200,204].includes(marker))throw new Error('This JPEG coding mode is not supported. Choose a standard PNG or JPEG.');
  if(marker===218){if(!size)fail();return size;}at+=length;
 }fail();
}
// Pictures accepted when inserting (GIF, BMP, WebP) besides PNG and JPEG: their size is read from the header before
// any decoding, under the same limits. They are always prepared as PNG; only the first frame of a GIF is used.
const SOURCE_TYPES=['image/png','image/jpeg','image/gif','image/bmp','image/webp'];
function sourceHeader(input,mime){
 if(mime==='image/png'||mime==='image/jpeg')return rasterHeader(input,mime);
 const bytes=new Uint8Array(input);if(bytes.length<30||bytes.length>LIMITS.IMAGE_SOURCE_BYTES)fail();const d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),text=(at,n)=>String.fromCharCode(...bytes.subarray(at,at+n));
 if(mime==='image/gif'){if(!/^GIF8[79]a$/.test(text(0,6)))fail();return dimensions(d.getUint16(6,true),d.getUint16(8,true));}
 if(mime==='image/bmp'){if(text(0,2)!=='BM')fail();const info=d.getUint32(14,true);if(info===12)return dimensions(d.getUint16(18,true),d.getUint16(20,true));if(info<40)fail();return dimensions(d.getInt32(18,true),Math.abs(d.getInt32(22,true)));}
 if(mime==='image/webp'){
  if(text(0,4)!=='RIFF'||text(8,4)!=='WEBP')fail();const chunk=text(12,4);
  if(chunk==='VP8 '){if(bytes[23]!==0x9d||bytes[24]!==0x01||bytes[25]!==0x2a)fail();return dimensions(d.getUint16(26,true)&0x3fff,d.getUint16(28,true)&0x3fff);}
  if(chunk==='VP8L'){if(bytes[20]!==0x2f)fail();const [b0,b1,b2,b3]=bytes.subarray(21,25);return dimensions(1+(((b1&0x3f)<<8)|b0),1+(((b3&0x0f)<<10)|(b2<<2)|((b1&0xc0)>>6)));}
  if(chunk==='VP8X'){if(bytes[20]&0x02)throw new Error('Animated WebP pictures are not supported. Choose a still picture.');const u24=at=>bytes[at]|bytes[at+1]<<8|bytes[at+2]<<16;return dimensions(1+u24(24),1+u24(27));}
  fail();
 }
 fail();
}
// The bytes and type of a prepared picture's data URI (PNG or JPEG, within the stored-picture limit).
const DATA_URI=/^data:(image\/(?:png|jpeg));base64,/;
function imageDataBytes(src){
 const prefix=typeof src==='string'?DATA_URI.exec(src):null;if(!prefix||src.length>Math.ceil(DOCUMENT_IMAGE_LIMIT/3)*4+prefix[0].length)fail();
 const data=src.slice(prefix[0].length);if(data.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(data))fail();
 let decoded;try{decoded=atob(data);}catch{fail();}if(decoded.length>DOCUMENT_IMAGE_LIMIT)fail();const bytes=new Uint8Array(decoded.length);for(let i=0;i<decoded.length;i++)bytes[i]=decoded.charCodeAt(i);return {bytes,mime:prefix[1]};
}
// Kept for callers that only need the bytes; the picture may be PNG or JPEG.
function pngDataBytes(src){return imageDataBytes(src).bytes;}
function validateDocumentImage(attrs){
 if(!attrs||Object.keys(attrs).some(k=>!['src','alt','width','height','pixelWidth','pixelHeight'].includes(k)))fail();
 let size=assetHeaders.get(attrs.src);if(!size){const {bytes,mime}=imageDataBytes(attrs.src);size=Object.freeze(rasterHeader(bytes,mime));assetHeaders.set(attrs.src,size);if(assetHeaders.size>LIMITS.IMAGE_COUNT*2)assetHeaders.delete(assetHeaders.keys().next().value);}if(size.width!==attrs.pixelWidth||size.height!==attrs.pixelHeight)fail();
 if(!['width','height'].every(k=>Number.isFinite(attrs[k])&&attrs[k]>=8&&attrs[k]<=2000)||typeof attrs.alt!=='string'||attrs.alt.length>500||/[\x00-\x1f\x7f]/.test(attrs.alt))throw new Error('Choose image dimensions from 8 to 2,000 pixels and alternative text up to 500 characters.');return attrs;
}
function validateDocumentImages(doc){let images=0,pixels=0,nodes=0;const walk=(node,depth,parent)=>{if(!node||depth>64||++nodes>LIMITS.DOCUMENT_NODES)throw new Error('Document exceeds editing/recovery limits.');if(node.type==='documentImage'){if(node.content!==undefined||node.marks?.length)throw new Error('Inline images cannot contain hidden child content or text marks.');if(!['paragraph','heading'].includes(parent))throw new Error('Inline images belong inside a paragraph or heading.');validateDocumentImage(node.attrs);if(++images>LIMITS.IMAGE_COUNT||(pixels+=node.attrs.pixelWidth*node.attrs.pixelHeight)>LIMITS.IMAGE_TOTAL_PIXELS)throw new Error('Use at most 500 pictures per document.');}if(node.content!==undefined){if(!Array.isArray(node.content))fail();node.content.forEach(child=>walk(child,depth+1,node.type));}};walk(doc,0,null);return images;}

module.exports={DOCUMENT_IMAGE_LIMIT,SOURCE_TYPES,rasterHeader,sourceHeader,imageDataBytes,pngDataBytes,validateDocumentImage,validateDocumentImages};
