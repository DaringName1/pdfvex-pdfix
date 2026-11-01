'use strict';
// V1 audit, area 5: hostile TIFF files. Each file below is built to break one limit; each must be refused (or its page
// marked unsupported and refused on decode) within seconds, without large allocations or reading past the file.
const {test}=require('node:test'),assert=require('node:assert/strict'),{deflateSync}=require('node:zlib');
const {inspectTiff,decodeTiffPage}=require('../desktop/tiff-codec.cjs'),{tiffFixture}=require('./helpers/converter-tiff-fixture.cjs');
// Value positions in the fixture's first directory (little-endian): width, height, strip offset, strip byte count.
const AT={width:18,height:30,stripOffset:78,stripBytes:126};
const patched=(changes,options)=>{const bytes=tiffFixture(options);for(const [field,value] of Object.entries(changes))bytes.writeUInt32LE(value,AT[field]);return bytes;};
function refused(label,bytes){
 const started=Date.now(),before=process.memoryUsage().arrayBuffers;let report,error;
 try{report=inspectTiff(bytes);}catch(e){error=e;}
 if(!error){const page=report.pages[0];if(page?.supported!==false){try{decodeTiffPage(bytes,0);}catch(e){error=e;}}else{assert.throws(()=>decodeTiffPage(bytes,0),label+': unsupported page must not decode');error=true;}}
 assert.ok(error,label+' must be refused');assert.ok(Date.now()-started<5000,label+' took too long');
 assert.ok(process.memoryUsage().arrayBuffers-before<200*1024*1024,label+' allocated too much');
}
test('a well-formed TIFF still decodes (each case below differs only in the hostile part)',()=>{assert.equal(inspectTiff(tiffFixture()).pages[0].supported,true);assert.ok(decodeTiffPage(tiffFixture(),0).bytes.length);});
test('wrong header, truncated files and directories pointing outside the file are refused',()=>{
 refused('empty',new Uint8Array());refused('7 bytes',new Uint8Array(7));
 const bad=tiffFixture();bad.write('XX',0);refused('wrong byte-order mark',bad);
 const magic=tiffFixture();magic.writeUInt16LE(43,2);refused('BigTIFF marker',magic);
 const outside=tiffFixture();outside.writeUInt32LE(0x7ffffff0,4);refused('first directory past the end',outside);
 const odd=tiffFixture();odd.writeUInt32LE(9,4);refused('odd directory offset',odd);
 refused('truncated mid-directory',tiffFixture().subarray(0,40));
});
test('giant page sizes, strips outside the file and lying byte counts are refused',()=>{
 refused('100,000 x 100,000 page',patched({width:100000,height:100000}));
 refused('8,193 pixels wide',patched({width:8193}));
 refused('zero width',patched({width:0}));
 refused('strip offset past the end',patched({stripOffset:0x7ffffff0}));
 refused('strip byte count of 4 GB',patched({stripBytes:0xffffffff}));
});
test('a compressed strip that expands far past its page (a decompression bomb) is refused',()=>{
 const bomb=deflateSync(Buffer.alloc(80*1024*1024));
 const bytes=tiffFixture({compression:8});const header=bytes.subarray(0,bytes.readUInt32LE(AT.stripOffset)),file=Buffer.concat([header,bomb]);file.writeUInt32LE(bomb.length,AT.stripBytes);
 refused('deflate bomb in a 3 x 2 page',file);
});
test('more than 100 pages and directories with thousands of entries are refused',()=>{
 const pages=Buffer.alloc(8+102*8);pages.write('II');pages.writeUInt16LE(42,2);pages.writeUInt32LE(8,4);
 for(let i=0;i<102;i++){const at=8+i*8;pages.writeUInt16LE(0,at);pages.writeUInt32LE(i<101?at+8:0,at+2);}
 refused('102 directories',pages);
 const crowded=Buffer.alloc(8+2+65535*12+4);crowded.write('II');crowded.writeUInt16LE(42,2);crowded.writeUInt32LE(8,4);crowded.writeUInt16LE(65535,8);
 refused('65,535 entries in one directory',crowded);
});
