export const IMAGE_LIMITS={bytes:32*1024*1024,pixels:16_000_000,side:8192};
const ascii=(bytes,start,length)=>String.fromCharCode(...bytes.subarray(start,start+length));
export function inspectImage(bytes,ext,limits=IMAGE_LIMITS){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>limits.bytes)throw new Error(`Choose an image under ${limits.bytes/1024/1024} MB.`);
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let width=0,height=0;
 const fail=()=>{throw new Error('This picture is damaged or in a type PDFix cannot read. Try getting a new copy.');};
 if(ext==='png'){
  if(bytes.length<33||![137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n)||v.getUint32(8)!==13||ascii(bytes,12,4)!=='IHDR')fail();
  width=v.getUint32(16);height=v.getUint32(20);let offset=8,count=0;
  while(offset+12<=bytes.length){if(++count>20000)fail();const length=v.getUint32(offset),kind=ascii(bytes,offset+4,4);if(length>bytes.length-offset-12)fail();if(kind==='acTL')throw new Error('Animated PNG is unsupported. Export a still image first.');offset+=length+12;if(kind==='IEND')break;}
 }else if(['jpg','jpeg'].includes(ext)){
  if(bytes.length<4||bytes[0]!==255||bytes[1]!==216)fail();let offset=2,count=0;
  while(offset+3<bytes.length){if(++count>4096||bytes[offset++]!==255)fail();while(bytes[offset]===255)offset++;const marker=bytes[offset++];if(marker===217||marker===218)break;if(marker===216||marker===1||marker>=208&&marker<=215)continue;if(offset+2>bytes.length)fail();const length=v.getUint16(offset);if(length<2||offset+length>bytes.length)fail();if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){if(length<8)fail();height=v.getUint16(offset+3);width=v.getUint16(offset+5);break;}offset+=length;}
 }else if(ext==='webp'){
  if(bytes.length<25||ascii(bytes,0,4)!=='RIFF'||ascii(bytes,8,4)!=='WEBP'||v.getUint32(4,true)+8!==bytes.length)fail();const tag=ascii(bytes,12,4),length=v.getUint32(16,true);if(length>bytes.length-20)fail();
  if(tag==='VP8X'){if(bytes.length<30||length<10)fail();if(bytes[20]&2)throw new Error('Animated WebP is unsupported. Export a still image first.');width=1+bytes[24]+bytes[25]*256+bytes[26]*65536;height=1+bytes[27]+bytes[28]*256+bytes[29]*65536;}
  else if(tag==='VP8 '){if(bytes.length<30||length<10||ascii(bytes,23,3)!=='\x9d\x01\x2a')fail();width=v.getUint16(26,true)&16383;height=v.getUint16(28,true)&16383;}
  else if(tag==='VP8L'){if(length<5||bytes[20]!==47)fail();width=1+((bytes[21]|bytes[22]<<8)&16383);height=1+((bytes[22]>>6|bytes[23]<<2|bytes[24]<<10)&16383);}else fail();
 }else if(ext==='bmp'){
  if(bytes.length<54||ascii(bytes,0,2)!=='BM')fail();const dib=v.getUint32(14,true),compression=v.getUint32(30,true);if(![40,108,124].includes(dib)||14+dib>bytes.length||v.getUint16(26,true)!==1||![24,32].includes(v.getUint16(28,true))||compression!==0)throw new Error('Use an uncompressed 24-bit or 32-bit BMP, or export PNG first.');
  width=v.getInt32(18,true);height=Math.abs(v.getInt32(22,true));const stride=Math.ceil(width*v.getUint16(28,true)/32)*4,offset=v.getUint32(10,true);if(offset<14+dib||offset+stride*height>bytes.length)fail();
 }else throw new Error('Choose PNG, JPEG, static WebP or supported BMP.');
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>limits.side||height>limits.side||width*height>limits.pixels)throw new Error(`Keep image dimensions under ${limits.side} pixels per side and ${limits.pixels/1_000_000} million pixels.`);
 return {width,height};
}
