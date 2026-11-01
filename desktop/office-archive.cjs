const {inflateRawSync,deflateRawSync}=require('node:zlib');
const {DOMParser,XMLSerializer}=require('@xmldom/xmldom');
const table=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=table[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
function fail(message){throw new Error(message);}
function readArchive(input,{size:maxSize=10*1024*1024,expanded:maxExpanded=30*1024*1024,part:maxPart=10*1024*1024,names=null}={}){
 const bytes=Buffer.from(input);if(bytes.length>maxSize||bytes.length<22)fail('Office imports are limited to valid ZIP files under '+Math.round(maxSize/1024/1024)+' MB.');let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(bytes.readUInt32LE(i)===0x06054b50){end=i;break;}
 if(end<0||end+22+bytes.readUInt16LE(end+20)!==bytes.length||bytes.readUInt16LE(end+4)||bytes.readUInt16LE(end+6)||bytes.readUInt16LE(end+8)!==bytes.readUInt16LE(end+10))fail('Damaged or multipart Office archive.');
 const count=bytes.readUInt16LE(end+10),start=bytes.readUInt32LE(end+16),size=bytes.readUInt32LE(end+12);if(!count||count>2000||start+size!==end)fail('Unsupported Office archive index.');
 const entries=new Map(),ranges=[];let at=start,expanded=0;
 for(let i=0;i<count;i++){
  if(at+46>end||bytes.readUInt32LE(at)!==0x02014b50)fail('Damaged Office file index.');const flags=bytes.readUInt16LE(at+8),method=bytes.readUInt16LE(at+10),crc=bytes.readUInt32LE(at+16),compressed=bytes.readUInt32LE(at+20),length=bytes.readUInt32LE(at+24),nameLength=bytes.readUInt16LE(at+28),extra=bytes.readUInt16LE(at+30),comment=bytes.readUInt16LE(at+32),offset=bytes.readUInt32LE(at+42);
  if(flags&~0x808||![0,8].includes(method)||bytes.readUInt16LE(at+34)||at+46+nameLength+extra+comment>end||(expanded+=length)>maxExpanded||length>maxPart)fail('Encrypted, oversized or unsupported Office archive.');
  const rawName=bytes.subarray(at+46,at+46+nameLength);let name;try{name=new TextDecoder('utf-8',{fatal:true}).decode(rawName);}catch{fail('Unsupported ZIP filename encoding.');}
  if(!name||name.length>240||name.includes('\\')||name.startsWith('/')||name.split('/').some(p=>p==='..'||p==='.')||/[\x00-\x1f:]/.test(name)||entries.has(name)||/vbaProject|\/embeddings\//i.test(name))fail('Unsafe, duplicate or embedded active Office content.');
  if(offset+30>start||bytes.readUInt32LE(offset)!==0x04034b50||bytes.readUInt16LE(offset+6)!==flags||bytes.readUInt16LE(offset+8)!==method)fail('Damaged Office member header.');
  const localName=bytes.readUInt16LE(offset+26),localExtra=bytes.readUInt16LE(offset+28),payload=offset+30+localName+localExtra;if(payload+compressed>start||!bytes.subarray(offset+30,offset+30+localName).equals(rawName))fail('Damaged Office member bounds.');ranges.push([offset,payload+compressed]);
  if(names&&!names.has(name)&&name!=='[Content_Types].xml'){at+=46+nameLength+extra+comment;continue;}
  let data;try{data=method===0?Buffer.from(bytes.subarray(payload,payload+compressed)):inflateRawSync(bytes.subarray(payload,payload+compressed),{maxOutputLength:Math.max(1,length)});}catch{fail('Office archive data could not be decompressed within its limit.');}
  if(data.length!==length||crc32(data)!==crc)fail('Office member checksum does not match.');entries.set(name,data);at+=46+nameLength+extra+comment;
 }
 if(at!==end)fail('Damaged Office index length.');ranges.sort((a,b)=>a[0]-b[0]);for(let i=1;i<ranges.length;i++)if(ranges[i][0]<ranges[i-1][1])fail('Overlapping Office archive members.');if(!entries.has('[Content_Types].xml'))fail('This is not an Office document.');return entries;
}
function writeArchive(entries){
 const local=[],central=[];let offset=0,expanded=0;
 for(const [name,input] of entries){const data=Buffer.from(input);if((expanded+=data.length)>30*1024*1024||data.length>10*1024*1024)fail('Office output exceeds its content limit.');const filename=Buffer.from(name),packed=deflateRawSync(data),crc=crc32(data),header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(8,8);header.writeUInt16LE(33,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(packed.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(filename.length,26);local.push(header,filename,packed);
  const item=Buffer.alloc(46);item.writeUInt32LE(0x02014b50);item.writeUInt16LE(20,4);item.writeUInt16LE(20,6);item.writeUInt16LE(0x800,8);item.writeUInt16LE(8,10);item.writeUInt16LE(33,14);item.writeUInt32LE(crc,16);item.writeUInt32LE(packed.length,20);item.writeUInt32LE(data.length,24);item.writeUInt16LE(filename.length,28);item.writeUInt32LE(offset,42);central.push(item,filename);offset+=header.length+filename.length+packed.length;
 }
 const index=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.size,8);end.writeUInt16LE(entries.size,10);end.writeUInt32LE(index.length,12);end.writeUInt32LE(offset,16);const result=Buffer.concat([...local,index,end]);if(result.length>10*1024*1024)fail('Office output exceeds the 10 MB reopening limit.');return result;
}
function xml(bytes){
 if(!bytes)fail('A required Office XML part is missing.');let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{fail('Only UTF-8 Office XML is supported in this adapter.');}
 if(/<!DOCTYPE|<!ENTITY/i.test(text)||/<\?xml[^>]*encoding\s*=\s*['"](?!utf-8['"])/i.test(text))fail('Unsupported Office XML encoding or entities.');
 let malformed=false;const doc=new DOMParser({errorHandler:()=>{malformed=true;}}).parseFromString(text,'application/xml');if(malformed||!doc.documentElement)fail('Office XML is malformed.');let count=0;const pending=[[doc,0]];while(pending.length){const [node,depth]=pending.pop();if(++count>200000||depth>64)fail('Office XML exceeds its structure limit.');for(let child=node.lastChild;child;child=child.previousSibling)pending.push([child,depth+1]);}return doc;
}
const all=(node,name)=>Array.from(node.getElementsByTagNameNS('*',name));
const children=(node,name)=>Array.from(node.childNodes).filter(n=>n.nodeType===1&&n.localName===name);
const serialized=doc=>Buffer.from(new XMLSerializer().serializeToString(doc),'utf8');
module.exports={readArchive,writeArchive,xml,all,children,serialized};
