import {PDFDocument} from 'pdf-lib';
import {organizePdf} from './pdf-operations.js';
import {visibleBox} from './page-geometry.js';
import {validateGroups} from './page-ranges.js';
const MAX_BYTES=100*1024*1024,MAX_ENCODING_WORK=1024*1024*1024,MAX_CANDIDATES=2000;

export async function splitPdfBySize(sources,plan,maximumBytes,progress=()=>{}){
 if(!Number.isInteger(maximumBytes)||maximumBytes<256*1024||maximumBytes>MAX_BYTES)throw new Error('Choose a maximum split size between 0.25 and 100 MiB.');
 if(!Array.isArray(plan)||plan.length<2||plan.length>500)throw new Error('Size splitting needs 2–500 output pages.');
 const organized=await organizePdf(sources,plan,progress),source=await PDFDocument.load(organized.bytes,{updateMetadata:false,throwOnInvalidObject:true});
 const parts=[];let encodingWork=0,candidates=0,totalBytes=0;
 const encode=async(start,end)=>{
  if(++candidates>MAX_CANDIDATES)throw new Error('Size splitting exceeded its encoding-work limit. Use a larger maximum or split a smaller range.');
  const doc=await PDFDocument.create();doc.setProducer('PDFix');doc.setCreator('PDFix local size split workspace');
  const positions=Array.from({length:end-start},(_,index)=>start+index),copied=await doc.copyPages(source,positions);for(const page of copied)doc.addPage(page);
  const bytes=await doc.save();encodingWork+=bytes.length;
  if(encodingWork>MAX_ENCODING_WORK){bytes.fill(0);throw new Error('Size splitting exceeded its 1 GiB serialization-work budget. Use a larger maximum or split a smaller range.');}
  progress({stage:'Measuring actual encoded split size',current:start+1,total:plan.length});return {bytes,positions};
 };
 for(let start=0;start<plan.length;){
  let best=await encode(start,start+1),bestEnd=start+1;
  if(best.bytes.length>maximumBytes){const required=best.bytes.length;best.bytes.fill(0);throw new Error(`Output page ${start+1} alone needs ${(required/1024/1024).toFixed(2)} MiB. Raise the maximum above that size; this rule cannot divide one physical page.`);}
  let high=plan.length+1,span=2;
  while(bestEnd<plan.length){
   const end=Math.min(plan.length,start+span),candidate=await encode(start,end);
   if(candidate.bytes.length>maximumBytes){candidate.bytes.fill(0);high=end;break;}
   best.bytes.fill(0);best=candidate;bestEnd=end;if(end===plan.length)break;span*=2;
  }
  // We verify every accepted byte length. PDF encoding need not be monotonic;
  // binary search chooses a fitting contiguous group without promising a maximal one.
  while(high-bestEnd>1&&high<=plan.length){
   const end=Math.floor((bestEnd+high)/2),candidate=await encode(start,end);
   if(candidate.bytes.length<=maximumBytes){best.bytes.fill(0);best=candidate;bestEnd=end;}
   else {candidate.bytes.fill(0);high=end;}
  }
  totalBytes+=best.bytes.length;if(totalBytes>MAX_BYTES){best.bytes.fill(0);throw new Error('The size-split copies exceed the combined 100 MiB output budget. Shared resources can be repeated across files; choose fewer/larger parts.');}
  const verified=await PDFDocument.load(best.bytes,{updateMetadata:false,throwOnInvalidObject:true}),geometry=best.positions.map(index=>organized.geometry[index]);
  if(verified.getPageCount()!==best.positions.length)throw new Error('An encoded size-split file has the wrong physical page count. Nothing was saved.');
  verified.getPages().forEach((page,index)=>{const box=visibleBox(page.getMediaBox(),page.getCropBox()),rotation=page.getRotation().angle,dimensions=rotation%180?[box.height,box.width]:[box.width,box.height];if(Math.abs(dimensions[0]-geometry[index].width)>.01||Math.abs(dimensions[1]-geometry[index].height)>.01)throw new Error('A size-split page has unexpected geometry. Nothing was saved.');});
  parts.push({...best,pageCount:best.positions.length,geometry});start=bestEnd;
 }
 if(parts.length<2)throw new Error('The complete output already fits this maximum. Choose a smaller size to create separate PDFs.');
 validateGroups(parts.map(part=>part.positions),plan.length);
 if(parts.some(part=>part.bytes.length>maximumBytes)||parts.reduce((sum,part)=>sum+part.pageCount,0)!==plan.length)throw new Error('The size-split output did not satisfy its exact byte/page limits. Nothing was saved.');
 return {parts,size:totalBytes,pageCount:plan.length,maximumBytes,sizeRule:'Each actual encoded file fits the chosen limit; all output pages occur once in their original output order.'};
}
