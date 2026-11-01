'use strict';
const {deflateRawSync}=require('node:zlib');
const table=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc32=bytes=>{let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
// A plain ZIP writer for test files; `declared` lets a file lie about its expanded size (a zip bomb).
function zip(entries){
 const locals=[],centrals=[];let offset=0;
 for(const {name,data,declared,store}of entries){const raw=Buffer.from(data),body=store?raw:deflateRawSync(raw),method=store?0:8,size=declared??raw.length,crc=crc32(raw),n=Buffer.from(name);
  const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(method,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(body.length,18);local.writeUInt32LE(size,22);local.writeUInt16LE(n.length,26);
  const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(method,10);central.writeUInt32LE(crc,16);central.writeUInt32LE(body.length,20);central.writeUInt32LE(size,24);central.writeUInt16LE(n.length,28);central.writeUInt32LE(offset,42);
  locals.push(local,n,body);centrals.push(central,n);offset+=30+n.length+body.length;}
 const dir=Buffer.concat(centrals),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(dir.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...locals,dir,end]);
}
module.exports={zip,crc32};
