'use strict';
const {permutation}=require('./pdf-page-order-validation.cjs');
const {validDecorationDraft}=require('./pdf-decoration-validation.cjs');
const MAX_STEPS=2;
const exact=(value,fields)=>value&&Object.getPrototypeOf(value)===Object.prototype&&Object.keys(value).sort().join(',')===[...fields].sort().join(',');
function validWorkflowSteps(value){
 if(!Array.isArray(value)||!value.length||value.length>MAX_STEPS)throw new Error('Choose one or two workflow steps.');
 const kinds=new Set();
 return value.map(step=>{
  if(!step||typeof step.kind!=='string'||kinds.has(step.kind))throw new Error('Each workflow step must occur only once.');
  kinds.add(step.kind);
  if(step.kind==='reorder'){
   if(!exact(step,['kind','order']))throw new Error('Page reorder has unsupported settings.');
   return {kind:'reorder',order:permutation(step.order)};
  }
  if(step.kind==='bates'){
   if(!exact(step,['kind','pages','start','prefix','suffix','padding','font','position','size','color','opacity','marginMm']))throw new Error('Bates numbering has unsupported settings.');
   if(!Array.isArray(step.pages)||!step.pages.length||step.pages.length>100||new Set(step.pages).size!==step.pages.length||step.pages.some(n=>!Number.isInteger(n)||n<1||n>500))throw new Error('Choose 1–100 distinct physical pages for Bates numbering.');
   const draft=batesDraft(step);
   return {kind:'bates',pages:[...step.pages],draft};
  }
  throw new Error('This workflow step is unsupported.');
 });
}
function batesDraft(step){
 const blank=(text,position)=>({enabled:false,text,size:10,color:'#193246',opacity:1,position});
 return validDecorationDraft({
  version:1,pages:step.pages.map(page=>page-1),font:step.font,marginMm:step.marginMm,
  pageNumbers:{enabled:true,text:'',size:step.size,color:step.color,opacity:step.opacity,position:step.position,mode:'bates',start:step.start,prefix:step.prefix,suffix:step.suffix,padding:step.padding},
  header:blank('Document header','top-center'),footer:blank('Document footer','bottom-left'),watermark:{...blank('DRAFT','center'),angle:45},stamp:blank('DRAFT','top-right')
 });
}
function validWorkflowSource(id,source){
 if(typeof id!=='string'||!id||id.length>100||/[\x00-\x1f]/.test(id)||source?.ext!=='pdf'||!(source.bytes instanceof Uint8Array)||!source.bytes.length||source.bytes.length>100*1024*1024||typeof source.fingerprint!=='string'||!/^[a-f0-9]{64}$/.test(source.fingerprint))throw new Error('Open a selected PDF under 100 MiB for this workflow.');
 return source;
}
module.exports={validWorkflowSteps,validWorkflowSource,batesDraft,MAX_STEPS};
