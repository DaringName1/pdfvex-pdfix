'use strict';
// V1 audit, area 5: hostile PNG and JPEG pictures. The header is checked before any decoding, so a picture that lies
// about its size, hides data after its end, animates, or loops its segments is refused at once without large memory.
const {test}=require('node:test'),assert=require('node:assert/strict'),zlib=require('node:zlib');
const {sourceHeader}=require('../desktop/document-image-validation.cjs');
const crc=bytes=>{let c=~0;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=c>>>1^(0xedb88320&-(c&1));}return ~c>>>0;};
const chunk=(type,data=Buffer.alloc(0))=>{const head=Buffer.alloc(8);head.writeUInt32BE(data.length);head.write(type,4);const tail=Buffer.alloc(4);tail.writeUInt32BE(crc(Buffer.concat([Buffer.from(type),data])));return Buffer.concat([head,data,tail]);};
function png(width=4,height=3,{extra=[],after=Buffer.alloc(0),idat=true}={}){const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width);ihdr.writeUInt32BE(height,4);ihdr.set([8,2,0,0,0],8);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),...extra,...(idat?[chunk('IDAT',zlib.deflateSync(Buffer.alloc(Math.min(height*(width*3+1),4096))))]:[]),chunk('IEND'),after]);}
function jpeg(width=4,height=3,{sof=0xc0,precision=8,segments=[]}={}){const sofData=Buffer.from([0xff,sof,0,11,precision,height>>8,height&255,width>>8,width&255,1,1,0x11,0]);
 return Buffer.concat([Buffer.from([0xff,0xd8]),...segments,sofData,Buffer.from([0xff,0xda,0,8,1,1,0,0,63,0]),Buffer.from([1,2,3]),Buffer.from([0xff,0xd9])]);}
const refused=(label,bytes,mime,pattern=/picture|supported/i)=>{const started=Date.now();assert.throws(()=>sourceHeader(bytes,mime),pattern,label);assert.ok(Date.now()-started<2000,label+' took too long');};
test('ordinary PNG and JPEG headers are read (each case below differs only in the hostile part)',()=>{
 assert.deepEqual(sourceHeader(png(),'image/png'),{width:4,height:3});assert.deepEqual(sourceHeader(jpeg(),'image/jpeg'),{width:4,height:3});
});
test('PNG: lying sizes, hidden data after the end, animation, missing parts and chunk floods are refused',()=>{
 refused('100,000 x 100,000 PNG',png(100000,100000),'image/png');refused('zero-wide PNG',png(0,3),'image/png');refused('2^31 wide PNG',png(0x80000000,1),'image/png');
 refused('data after IEND',png(4,3,{after:Buffer.from('<script>alert(1)</script>')}),'image/png');
 refused('animated PNG',png(4,3,{extra:[chunk('acTL',Buffer.alloc(8))]}),'image/png',/Animated/);
 refused('no picture data',png(4,3,{idat:false}),'image/png');
 const lying=png();lying.writeUInt32BE(0x7fffffff,33);refused('chunk length past the end',lying,'image/png');
 refused('a PNG that is really a JPEG',jpeg(),'image/png');refused('truncated after the header',png().subarray(0,30),'image/png');
 refused('200,001 empty chunks',png(4,3,{extra:Array(200001).fill(chunk('tEXt'))}),'image/png');
});
test('JPEG: lying sizes, unusual coding modes, segments past the end and marker floods are refused',()=>{
 refused('65,535 x 65,535 JPEG',jpeg(65535,65535),'image/jpeg');refused('zero-high JPEG',jpeg(4,0),'image/jpeg');
 refused('12-bit JPEG',jpeg(4,3,{precision:12}),'image/jpeg');refused('lossless JPEG',jpeg(4,3,{sof:0xc3}),'image/jpeg',/coding mode/);
 const past=jpeg(4,3,{segments:[Buffer.from([0xff,0xe1,0xff,0xff])]});refused('segment longer than the file',past,'image/jpeg');
 refused('no end marker',jpeg().subarray(0,-2),'image/jpeg');refused('scan before size',Buffer.from([0xff,0xd8,0xff,0xda,0,8,1,1,0,0,63,0,0xff,0xd9]),'image/jpeg');
 refused('20,001 comment segments',jpeg(4,3,{segments:Array(20001).fill(Buffer.from([0xff,0xfe,0,2]))}),'image/jpeg');
 refused('a run of fill bytes with no marker',Buffer.concat([Buffer.from([0xff,0xd8]),Buffer.alloc(1e6,0xff),Buffer.from([0xff,0xd9])]),'image/jpeg');
});
test('pictures over the 40 MB source limit are refused before they are scanned',()=>{
 const big=Buffer.concat([png(),Buffer.alloc(41*1024*1024)]);refused('41 MB PNG',big,'image/png');
});
