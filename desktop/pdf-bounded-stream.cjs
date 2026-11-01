'use strict';
// Decode in small requests: PDF-lib reserves the requested length before it
// discovers EOF. Requesting the whole ceiling eagerly wastes that ceiling for
// every tiny stream and consumes the contained engine's aggregate budget.
const {decodePDFRawStream}=require('pdf-lib/cjs/core/streams/decode.js');
function decodeBounded(stream,limit){
 if(!Number.isSafeInteger(limit)||limit<0)throw new Error('Invalid PDF decoding bound.');
 const decoder=decodePDFRawStream(stream),parts=[];let size=0;
 while(true){const chunk=decoder.getBytes(Math.min(65536,limit-size+1));if(!chunk.length)break;size+=chunk.length;if(size>limit)throw new Error('Decoded PDF stream exceeds its size limit.');parts.push(Buffer.from(chunk));}
 return Buffer.concat(parts,size);
}
module.exports={decodeBounded};
