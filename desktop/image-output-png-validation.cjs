'use strict';
const table=Uint32Array.from({length:256},(_,n)=>{for(let bit=0;bit<8;bit++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const fail=()=>{throw new Error('A generated PNG is damaged or incomplete. Rebuild the image previews.');};
// Framing/checksum validation only. Pixel decoding remains in the bounded codec.
function validImageOutputPng(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length<57||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))fail();
 let offset=8,count=0,data=false,ended=false;
 while(offset<bytes.length){
  if(++count>20000||offset+12>bytes.length)fail();const length=bytes.readUInt32BE(offset),end=offset+length+12;if(end>bytes.length)fail();
  const type=bytes.toString('ascii',offset+4,offset+8);if(!/^[A-Za-z]{4}$/.test(type))fail();
  let crc=0xffffffff;for(let at=offset+4;at<end-4;at++)crc=table[(crc^bytes[at])&255]^(crc>>>8);if(((crc^0xffffffff)>>>0)!==bytes.readUInt32BE(end-4))fail();
  if(count===1){if(type!=='IHDR'||length!==13)fail();}else if(type==='IHDR')fail();
  if(type==='acTL')throw new Error('Animated PNG output is unsupported. Export a still image.');
  if(type==='IDAT'&&length)data=true;
  if(type==='IEND'){if(length||!data||end!==bytes.length)fail();ended=true;}
  offset=end;
 }
 if(!ended)fail();return bytes;
}
module.exports={validImageOutputPng};
