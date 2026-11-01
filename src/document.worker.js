import {normalizeDocumentImage} from './document-image-codec.js';
import LIMITS from '../desktop/document-limits.cjs';
const escape=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const MARKER=/<img\s+[^>]*\bsrc="pdfix-import-asset-(\d+)"[^>]*>/g;
self.onmessage=async({data})=>{try{
 if(data.action==='image'){const prepared=await normalizeDocumentImage(data.bytes,data.mime,data.alt,data.edit);self.postMessage({value:prepared});}
 else if(data.action==='normalize-imported-images'){
  if(typeof data.html!=='string'||data.html.length>LIMITS.HTML_BYTES||!Array.isArray(data.assets)||data.assets.length>LIMITS.IMAGE_COUNT||!Array.isArray(data.warnings))throw new Error('Invalid contained document import.');
  // Every picture is prepared first, then all import markers are swapped in one pass over the text.
  let pixels=0,reduced=0;const warnings=[...data.warnings],tags=new Map();
  for(const asset of data.assets){
   try{
    const prepared=await normalizeDocumentImage(asset.bytes,asset.mime,asset.alt),a=prepared.attrs;
    if(pixels+a.pixelWidth*a.pixelHeight>LIMITS.IMAGE_TOTAL_PIXELS)throw new Error('The document picture limit was reached.');pixels+=a.pixelWidth*a.pixelHeight;if(prepared.notice)reduced++;
    tags.set(String(asset.id),'<img src="'+a.src+'" alt="'+escape(a.alt)+'" width="'+a.width+'" height="'+a.height+'" data-pdfix-image="true" data-pdfix-image-width="'+a.pixelWidth+'" data-pdfix-image-height="'+a.pixelHeight+'">');
   }catch(error){if(warnings.length<100)warnings.push('Inline image '+asset.id+' omitted: '+String(error.message).slice(0,400));}
   finally{asset.bytes?.fill(0);}
  }
  const placed=new Set(),html=data.html.replace(MARKER,(match,id)=>{placed.add(id);return tags.get(id)??'';});
  for(const id of tags.keys())if(!placed.has(id)&&warnings.length<100)warnings.push('Inline image '+id+' omitted: its import marker was unavailable.');
  if(reduced)warnings.push(reduced+(reduced===1?' picture was':' pictures were')+' prepared at up to '+LIMITS.IMAGE_STORED_SIDE+' pixels on the long side, enough for printing at their size in the document.');
  if(html.length>LIMITS.HTML_BYTES)throw new Error('The imported document with its pictures is larger than PDFix can edit.');
  self.postMessage({value:{html,warnings:warnings.length>100?[...warnings.slice(0,99),'Additional image/import notes omitted from this bounded report.']:warnings}});
 }else throw new Error('Unknown document image operation.');
}catch(error){self.postMessage({error:error.message});}};
