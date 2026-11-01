const {deflateSync}=require('node:zlib');
// Small deterministic classic TIFFs, built independently of the production decoder.
function tiffFixture({width=3,height=2,pixels=[10,20,30,40,50,60],orientation=1,compression=1,little=true,photometric=1,bits=8,predictor=1,cycle=false}={}){
 const raw=Buffer.from(pixels),encoded=compression===8||compression===32946?deflateSync(raw):compression===32773?Buffer.concat([Buffer.from([raw.length-1]),raw]):compression===5?lzwLiteral(raw):raw;
 const tags=[[256,4,[width]],[257,4,[height]],[258,3,[bits]],[259,3,[compression]],[262,3,[photometric]],[273,4,[0]],[274,3,[orientation]],[277,3,[1]],[278,4,[height]],[279,4,[encoded.length]],[317,3,[predictor]]];
 const offset=8+2+tags.length*12+4;tags.find(t=>t[0]===273)[2][0]=offset;
 const bytes=Buffer.alloc(offset+encoded.length),u16=(n,o)=>little?bytes.writeUInt16LE(n,o):bytes.writeUInt16BE(n,o),u32=(n,o)=>little?bytes.writeUInt32LE(n,o):bytes.writeUInt32BE(n,o);
 bytes.write(little?'II':'MM');u16(42,2);u32(8,4);u16(tags.length,8);
 for(const [index,[tag,type,values]]of tags.entries()){const at=10+index*12;u16(tag,at);u16(type,at+2);u32(values.length,at+4);if(type===3)u16(values[0],at+8);else u32(values[0],at+8);}
 u32(cycle?8:0,offset-4);encoded.copy(bytes,offset);return bytes;
}
function lzwLiteral(raw){const codes=[256,...raw,257],bytes=Buffer.alloc(Math.ceil(codes.length*9/8));let bit=0;for(const code of codes)for(let i=8;i>=0;i--,bit++)bytes[bit>>3]|=((code>>i)&1)<<(7-(bit&7));return bytes;}
module.exports={tiffFixture};
