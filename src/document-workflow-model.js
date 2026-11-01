import {pageRange} from './page-ranges.js';

export function workflowPages(text,count,{complete=false,max=100}={}){
 const pages=pageRange(text,count).map(index=>index+1);
 if(pages.length>max||complete&&pages.length!==count)throw new Error(complete?`List all ${count} current physical pages exactly once.`:`Choose at most ${max} current physical pages.`);
 return pages;
}
export function workflowSteps(cards,count){
 if(!Array.isArray(cards)||!cards.length||cards.length>2)throw new Error('Choose one or two workflow steps.');
 const seen=new Set();
 return cards.map(card=>{
  if(seen.has(card.kind))throw new Error('Add each type of step once.');seen.add(card.kind);
  if(card.kind==='reorder')return {kind:'reorder',order:workflowPages(card.order.value,count,{complete:true,max:500})};
  if(card.kind!=='bates')throw new Error('Unsupported workflow step.');
  const number=(name,min,max)=>{const value=Number(card[name].value);if(!Number.isInteger(value)||value<min||value>max)throw new Error(`Choose ${name} between ${min} and ${max}.`);return value;};
  const opacity=Number(card.opacity.value),marginMm=Number(card.marginMm.value);
  if(!Number.isFinite(opacity)||opacity<.05||opacity>1||!Number.isFinite(marginMm)||marginMm<2||marginMm>50)throw new Error('Choose opacity 0.05–1 and inset 2–50 mm.');
  return {kind:'bates',pages:workflowPages(card.pages.value,count),start:number('start',0,999999999999),prefix:card.prefix.value,suffix:card.suffix.value,padding:number('padding',1,12),font:card.font.value,position:card.position.value,size:number('size',6,144),color:card.color.value,opacity,marginMm};
 });
}
export async function sha256(bytes){const digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');}
export async function workflowResult(result,steps,originalBytes){
 if(!result||!(result.bytes instanceof Uint8Array)||!result.bytes.length||result.bytes.length>100*1024*1024||!Array.isArray(result.receipts)||result.receipts.length!==steps.length||!result.report||result.report.stepCount!==steps.length)throw new Error('The native workflow output has an invalid receipt.');
 const sourceHash=await sha256(originalBytes),outputHash=await sha256(result.bytes);
 if(result.originalSha256!==sourceHash||result.outputSha256!==outputHash||result.report.sourceSha256!==sourceHash||result.report.sha256!==outputHash)throw new Error('The workflow output is not bound to the selected original.');
 let previous=sourceHash;
 for(let index=0;index<steps.length;index++){
  const row=result.receipts[index];
  if(row.step!==index+1||row.kind!==steps[index].kind||row.inputSha256!==previous||row.report?.sourceSha256!==previous||row.report?.sha256!==row.outputSha256)throw new Error('A workflow step did not consume the previous verified output.');
  previous=row.outputSha256;
 }
 if(previous!==outputHash)throw new Error('The final workflow receipt does not match its output.');
 return result;
}
