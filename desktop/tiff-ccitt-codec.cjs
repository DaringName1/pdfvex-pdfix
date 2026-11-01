'use strict';
// Contained TIFF-only fax decoder. Codewords are normative numeric data from
// TIFF 6 section 10 / ITU-T T.4 tables 2–3 and T.6 table 1, not a copied engine.
const {TIFF_LIMITS:L}=require('./tiff-validation.cjs');
const fail=message=>{throw new Error('CCITT TIFF strip: '+message);};
const WHITE_TERMINATING=`00110101 000111 0111 1000 1011 1100 1110 1111
10011 10100 00111 01000 001000 000011 110100 110101
101010 101011 0100111 0001100 0001000 0010111 0000011 0000100
0101000 0101011 0010011 0100100 0011000 00000010 00000011 00011010
00011011 00010010 00010011 00010100 00010101 00010110 00010111 00101000
00101001 00101010 00101011 00101100 00101101 00000100 00000101 00001010
00001011 01010010 01010011 01010100 01010101 00100100 00100101 01011000
01011001 01011010 01011011 01001010 01001011 00110010 00110011 00110100`;
const BLACK_TERMINATING=`0000110111 010 11 10 011 0011 0010 00011
000101 000100 0000100 0000101 0000111 00000100 00000111 000011000
0000010111 0000011000 0000001000 00001100111 00001101000 00001101100 00000110111 00000101000
00000010111 00000011000 000011001010 000011001011 000011001100 000011001101 000001101000 000001101001
000001101010 000001101011 000011010010 000011010011 000011010100 000011010101 000011010110 000011010111
000001101100 000001101101 000011011010 000011011011 000001010100 000001010101 000001010110 000001010111
000001100100 000001100101 000001010010 000001010011 000000100100 000000110111 000000111000 000000100111
000000101000 000001011000 000001011001 000000101011 000000101100 000001011010 000001100110 000001100111`;
const WHITE_MAKEUP=`11011 10010 010111 0110111 00110110 00110111 01100100 01100101
01101000 01100111 011001100 011001101 011010010 011010011 011010100 011010101
011010110 011010111 011011000 011011001 011011010 011011011 010011000 010011001
010011010 011000 010011011`;
const BLACK_MAKEUP=`0000001111 000011001000 000011001001 000001011011 000000110011 000000110100 000000110101
0000001101100 0000001101101 0000001001010 0000001001011 0000001001100 0000001001101
0000001110010 0000001110011 0000001110100 0000001110101 0000001110110 0000001110111
0000001010010 0000001010011 0000001010100 0000001010101 0000001011010 0000001011011
0000001100100 0000001100101`;
const SHARED_MAKEUP=`00000001000 00000001100 00000001101 000000010010 000000010011
000000010100 000000010101 000000010110 000000010111 000000011100 000000011101 000000011110 000000011111`;
function trie(entries){const root={};for(const [word,value]of entries){let node=root;for(const bit of word){if(Object.hasOwn(node,'value'))throw new Error('Invalid bundled CCITT prefix table.');node=node[bit]??=( {} );}if(Object.hasOwn(node,'value')||node[0]||node[1])throw new Error('Invalid bundled CCITT code table.');node.value=value;}return root;}
const words=text=>text.trim().split(/\s+/);
function runTable(terminating,makeup){const terminal=words(terminating),extra=words(makeup),shared=words(SHARED_MAKEUP);if(terminal.length!==64||extra.length!==27||shared.length!==13)throw new Error('Invalid bundled CCITT table size.');return trie([...terminal.map((word,index)=>[word,index]),...extra.map((word,index)=>[word,(index+1)*64]),...shared.map((word,index)=>[word,1792+index*64])]);}
const RUN_TABLES=[runTable(WHITE_TERMINATING,WHITE_MAKEUP),runTable(BLACK_TERMINATING,BLACK_MAKEUP)];
const MODES=trie([['0001','pass'],['001','horizontal'],['1',0],['011',1],['010',-1],['000011',2],['000010',-2],['0000011',3],['0000010',-3],['0000001','extension']]);
class FaxBits{
 constructor(bytes,fillOrder,check){this.bytes=bytes;this.fillOrder=fillOrder;this.check=check;this.position=0;this.ticks=0;}
 get remaining(){return this.bytes.length*8-this.position;}
 bit(){if(!this.remaining)fail('compressed data ended before the declared rows were complete.');if((++this.ticks&1023)===0)this.check();const at=this.position++,shift=this.fillOrder===1?7-(at&7):at&7;return (this.bytes[at>>3]>>shift)&1;}
 read(table,maximum){let node=table;for(let depth=0;depth<maximum;depth++){node=node[this.bit()];if(!node)fail('invalid Huffman or 2D mode code.');if(Object.hasOwn(node,'value'))return node.value;}fail('code exceeds its bounded bit length.');}
 eol(aligned){let zeros=0;while(!this.bit())if(++zeros>4096)fail('end-of-line fill exceeds 4,096 bits.');if(zeros<11)fail('missing Group 3 end-of-line marker.');if(aligned&&(this.position&7))fail('T4Options requires byte-aligned end-of-line markers.');}
 align(){const padding=(8-(this.position&7))&7;if(padding>this.remaining)fail('row byte padding is truncated.');this.position+=padding;}
 padding(){if(this.remaining>7)fail('unexpected trailing data after the declared image ending.');while(this.remaining)if(this.bit())fail('nonzero trailing byte padding.');}
}
function decodeCcittStrip(input,{width,rows,compression,fillOrder=1,t4Options=0,t6Options=0,check=()=>{}}={}){
 if(!(input instanceof Uint8Array)||!input.length||input.length>L.sourceBytes||!Number.isInteger(width)||width<1||width>L.pageDimension||!Number.isInteger(rows)||rows<1||rows>L.pageDimension||width*rows>L.pagePixels||![2,3,4].includes(compression)||![1,2].includes(fillOrder)||!Number.isInteger(t4Options)||t4Options<0||t4Options>0xffffffff||!Number.isInteger(t6Options)||t6Options<0||t6Options>0xffffffff)fail('request exceeds its fixed TIFF page or input limits.');
 if(compression===3&&![0,1,4,5].includes(t4Options))fail('unsupported T4Options (uncompressed extensions and reserved bits are refused).');if(compression===4&&t6Options!==0)fail('unsupported T6Options (uncompressed extensions and reserved bits are refused).');
 const rowBytes=Math.ceil(width/8),length=rowBytes*rows;if(length>L.decodedBytes)fail('decoded strips exceed 64 MiB.');const output=Buffer.alloc(length),row=new Uint8Array(width),bits=new FaxBits(input,fillOrder,check),mixed=compression===3&&(t4Options&1)!==0,aligned=(t4Options&4)!==0;let reference=[width,width],codes=0;
 const budget=()=>{if(++codes>3*width+128)fail('row exceeds its bounded code/transition count.');};
 function run(color,remaining){let total=0,count=0;while(true){budget();if(++count>Math.ceil(width/64)+1)fail('run exceeds its bounded makeup-code count.');const value=bits.read(RUN_TABLES[color],13);total+=value;if(total>remaining)fail('run length exceeds the declared row width.');if(value<64)return total;}}
 function oneDimensional(){let x=0,color=0,first=true;while(x<width){const length=run(color,width-x);if(!length&&!(first&&color===0))fail('zero-length run occurs inside a scan line.');if(color)row.fill(1,x,x+length);x+=length;color^=1;first=false;}}
 function changingPair(a0,color,initial){let low=0,high=reference.length;while(low<high){const mid=(low+high)>>1;if(initial?reference[mid]<a0:reference[mid]<=a0)low=mid+1;else high=mid;}if((low&1)!==color)low++;return [reference[low]??width,reference[low+1]??width];}
 function twoDimensional(){let a0=0,color=0,initial=true;while(a0<width){budget();const mode=bits.read(MODES,7);if(mode==='extension')fail('uncompressed and reserved 2D extension modes are unsupported.');const [b1,b2]=changingPair(a0,color,initial);if(mode==='pass'){if(b2<=a0||b2>width)fail('pass mode does not advance inside the declared row.');if(color)row.fill(1,a0,b2);a0=b2;}else if(mode==='horizontal'){const first=run(color,width-a0),a1=a0+first,second=run(color^1,width-a1),a2=a1+second;if(a2<=a0||!first&&!(initial&&color===0)||!second&&a2!==width)fail('horizontal mode has invalid zero-length runs.');if(color)row.fill(1,a0,a1);else row.fill(1,a1,a2);a0=a2;}else{const a1=b1+mode;if(a1<a0||a1>width||a1===a0&&!(initial&&color===0))fail('vertical mode has an out-of-range or nonadvancing changing element.');if(color)row.fill(1,a0,a1);a0=a1;color^=1;}initial=false;}}
 function remember(y){const changes=[];let color=0;for(let x=0;x<width;x++){if(row[x]!==color){changes.push(x);color=row[x];}if(row[x])output[y*rowBytes+(x>>3)]|=1<<(7-(x&7));}changes.push(width,width);reference=changes;}
 function group3Ending(){// TIFF strips may omit transmission-only RTC; no row data is guessed or repaired.
  if(bits.remaining<=7){bits.padding();return;}if(bits.remaining>256)fail('Group 3 ending exceeds its 256-bit marker budget.');let markers=0;while(bits.remaining>7){bits.eol(aligned);markers++;if(markers>7)fail('too many Group 3 ending markers.');if(mixed){const tag=bits.bit();if(markers>1&&tag!==1)fail('RTC contains a two-dimensional line tag.');}}if(![1,6,7].includes(markers))fail('incomplete Group 3 return-to-control ending.');bits.padding();
 }
 const deadline=Date.now()+L.milliseconds,userCheck=check;check=()=>{userCheck();if(Date.now()>deadline)fail('30-second fax processing deadline exceeded.');};bits.check=check;
 try{check();for(let y=0;y<rows;y++){check();codes=0;row.fill(0);let oneD=compression!==4;if(compression===3){bits.eol(aligned);if(mixed)oneD=bits.bit()===1;if(y===0&&!oneD)fail('each mixed Group 3 strip must start with a 1D row.');}oneD?oneDimensional():twoDimensional();remember(y);if(compression===2)bits.align();}
  if(compression===2){if(bits.remaining)fail('Modified Huffman strip has bytes after its final row.');}else if(compression===3)group3Ending();else{for(const expected of '000000000001000000000001')if(bits.bit()!==Number(expected))fail('missing or malformed Group 4 end-of-facsimile-block marker.');bits.padding();}check();return output;
 }catch(error){output.fill(0);throw error;}finally{row.fill(0);}
}
module.exports={decodeCcittStrip};
