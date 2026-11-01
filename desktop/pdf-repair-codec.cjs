// Runs only in the pinned document AppContainer; never parse a PDF in the parent.
'use strict';
const {PDFDict,PDFArray,PDFRef,PDFName,PDFRawStream,PDFString,PDFHexString}=require('pdf-lib');
const {preservingPdf:P}=require('./pdf-review-edit-codec.cjs');
const {SCOPE,hash,inventory,preserved}=require('./pdf-repair-validation.cjs');
const key=PDFName.of;
async function inspect(bytes){
 const doc=await P.load(bytes);P.graph(doc);const objects=doc.context.enumerateIndirectObjects();
 const structural=value=>value instanceof PDFRawStream&&['ObjStm','XRef'].includes(value.dict.get(key('Type'))?.toString().slice(1));
 // Sorted dictionaries and deterministic reference IDs ignore qpdf renumbering,
 // while retaining sharing, cycles, scalar values and encoded stream bytes.
 let visits=0;const allReachable=new Set();
 function canonical(root,collect){const refs=new Map();function walk(value,depth){
  if(++visits>300000||depth>80)throw new Error('Repair preservation inventory exceeds its 300,000-visit/80-depth budget.');
  if(value instanceof PDFRef){const name=value.toString();if(collect)allReachable.add(name);if(refs.has(name))return ['ref',refs.get(name)];const id=refs.size+1;refs.set(name,id);return ['object',id,walk(doc.context.lookup(value),depth+1)];}
  if(value===undefined)throw new Error('Repair baseline contains an unresolved value.');
  if(value instanceof PDFRawStream)return ['stream',walkDict(value.dict,depth,['Length']),hash(value.contents),value.contents.length];
  if(value instanceof PDFDict)return walkDict(value,depth,[]);
  if(value instanceof PDFArray)return ['array',value.asArray().map(v=>walk(v,depth+1))];
  if(value instanceof PDFString||value instanceof PDFHexString)return ['string',hash(value.asBytes())];
  return ['scalar',value.toString()];
 }
 function walkDict(dict,depth,omit){return ['dict',dict.entries().filter(([k])=>!omit.includes(k.decodeText())).sort(([a],[b])=>a.decodeText()<b.decodeText()?-1:a.decodeText()>b.decodeText()?1:0).map(([k,v])=>[k.decodeText(),walk(v,depth+1)])];}
 return JSON.stringify(walk(root,0));}
 const root=doc.context.trailerInfo.Root,info=doc.context.trailerInfo.Info;
 const reachableSha256=hash(JSON.stringify([canonical(root,true),info?canonical(info,true):null]));
 const orphans=objects.filter(([ref,value])=>!allReachable.has(ref.toString())&&!structural(value)).map(([ref])=>hash(canonical(ref,false))).sort();
 const streams=objects.filter(([,value])=>value instanceof PDFRawStream&&!structural(value)).map(([,value])=>hash(value.contents)).sort();
 const pages=P.geometry(doc);const body={version:1,sha256:hash(bytes),bytes:bytes.length,pageCount:pages.length,pages,reachableSha256,orphanSha256:hash(JSON.stringify(orphans)),streamSha256:hash(JSON.stringify(streams)),objectCount:objects.length,scope:SCOPE};
 return inventory({...body,inventorySha256:hash(JSON.stringify(body))},body.sha256,bytes.length);
}
async function verify(bytes,options){if(!options||Object.keys(options).join(',')!=='baseline')throw new Error('Repair verification requires only its retained baseline.');const b=options.baseline;inventory(b,b?.sha256,b?.bytes);const current=await inspect(bytes);if(!preserved(b,current))throw new Error('The rebuilt copy changed available page, object graph or encoded stream evidence. No copy can be saved.');return current;}
module.exports={inspect,verify};
