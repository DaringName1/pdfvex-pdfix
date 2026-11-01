const {test}=require('node:test');const assert=require('node:assert/strict');const zlib=require('node:zlib');
const {validRtfImport}=require('../desktop/rich-document-validation.cjs');
function png(width,height){const table=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;}),crc=bytes=>{let c=0xffffffff;for(const x of bytes)c=table[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
  const chunk=(type,data)=>{const length=Buffer.alloc(4);length.writeUInt32BE(data.length);const body=Buffer.concat([Buffer.from(type),data]),sum=Buffer.alloc(4);sum.writeUInt32BE(crc(body));return Buffer.concat([length,body,sum]);};
  const raw=Buffer.alloc((width*3+1)*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++)raw[y*(width*3+1)+1+x*3]=x;const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
test('RTF copies embed PNG pictures with size and alt text and reopen them as images',async()=>{
  const {exportRtf,importRtf}=await import('../src/rtf-codec.js'),bytes=png(64,48),src='data:image/png;base64,'+bytes.toString('base64');
  const doc={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Photo: '},{type:'documentImage',attrs:{src,alt:'Test chart',width:128,height:96,pixelWidth:64,pixelHeight:48}},{type:'text',text:' done'}]}]};
  const rtf=Buffer.from(exportRtf(doc)).toString('latin1');assert.ok(rtf.includes('{\\pict\\pngblip\\picw64\\pich48\\picwgoal1920\\pichgoal1440{\\*\\pdfixalt Test chart}'),rtf.slice(0,600));assert.ok(rtf.includes(bytes.subarray(0,16).toString('hex')));
  const back=importRtf(Buffer.from(rtf,'latin1'));validRtfImport(back);const content=back.doc.content[0].content,image=content.find(node=>node.type==='documentImage');
  assert.deepEqual({...image.attrs,src:image.attrs.src===src},{src:true,alt:'Test chart',width:128,height:96,pixelWidth:64,pixelHeight:48});assert.ok(JSON.stringify(content).includes('Photo: ')&&JSON.stringify(content).includes(' done'));
});
test('Word-style pictures: PNG inside shppict is read, the nonshppict fallback and other formats are not',async()=>{
  const {importRtf}=await import('../src/rtf-codec.js'),hex=png(20,10).toString('hex');
  const word='{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\pard Before {\\*\\shppict{\\pict{\\*\\picprop{\\sp{\\sn x}{\\sv y}}}{\\*\\blipuid 0123abcd}\\pngblip\\picw20\\pich10\\picwgoal600\\pichgoal300 '+hex+'}}{\\nonshppict{\\pict\\wmetafile8 0102}} after\\par\\pard {\\pict\\jpegblip\\picwgoal600\\pichgoal300 ffd8ffd9}\\par}';
  const back=importRtf(Buffer.from(word,'latin1'));validRtfImport(back);const images=JSON.stringify(back.doc).match(/documentImage/g)||[];assert.equal(images.length,1);
  const image=back.doc.content[0].content.find(node=>node.type==='documentImage');assert.equal(image.attrs.pixelWidth,20);assert.equal(image.attrs.width,40);assert.equal(image.attrs.height,20);
  assert.ok(JSON.stringify(back.doc.content[1]).includes('[Image]'));assert.ok(back.warnings.some(text=>/placeholders/.test(text)));
});
