'use strict';
const {validSecuritySource,MAX_BYTES,hash}=require('./pdf-security-validation.cjs');
function object(value,keys){if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).some(key=>!keys.includes(key)))throw new Error('Print-mark settings contain unsupported fields.');}
function number(value,min,max,label){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new Error(`Choose ${label} between ${min} and ${max}.`);return value;}
function validPrintMarksDraft(value){
 object(value,['version','pages','units','bleed','offset','lineWidth','color','cropMarks','bleedMarks','registrationMarks','acknowledgeExpandedPageBoxes']);
 if(value.version!==1||!Array.isArray(value.pages)||!value.pages.length||value.pages.length>100||value.pages.some(page=>!Number.isInteger(page)||page<0||page>=500)||new Set(value.pages).size!==value.pages.length)throw new Error('Choose 1–100 distinct physical pages.');
 if(!['mm','pt'].includes(value.units)||typeof value.cropMarks!=='boolean'||typeof value.bleedMarks!=='boolean'||typeof value.registrationMarks!=='boolean'||(!value.cropMarks&&!value.bleedMarks&&!value.registrationMarks)||typeof value.acknowledgeExpandedPageBoxes!=='boolean'||!value.acknowledgeExpandedPageBoxes||typeof value.color!=='string'||!/^#[0-9a-f]{6}$/i.test(value.color))throw new Error('Choose supported units, ink color and marks, and acknowledge that output page boxes can expand.');
 object(value.bleed,['top','right','bottom','left']);for(const side of ['top','right','bottom','left'])number(value.bleed[side],0,100,`the ${side} bleed`);
 number(value.offset,0,100,'the mark offset');number(value.lineWidth,.1,5,'the mark line width');
 return {version:1,pages:[...value.pages],units:value.units,bleed:{...value.bleed},offset:value.offset,lineWidth:value.lineWidth,color:value.color.toLowerCase(),cropMarks:value.cropMarks,bleedMarks:value.bleedMarks,registrationMarks:value.registrationMarks,acknowledgeExpandedPageBoxes:true};
}
function validPrintMarksSource(id,source){return validSecuritySource(id,source);}
function validPrintMarksToken(token){if(typeof token!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token))throw new Error('Invalid print-mark preview token.');return token;}
function shape(value,keys){object(value,keys);if(Object.keys(value).sort().join(',')!==[...keys].sort().join(','))throw new Error('The print-mark receipt contains unsupported or missing fields.');}
function validPrintMarksResult(result,draftValue,sourceSha256,byteLength){
 shape(result,['bytes','report']);const draft=validPrintMarksDraft(draftValue),bytes=result.bytes;
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>MAX_BYTES||!Buffer.from(bytes.buffer,bytes.byteOffset,Math.min(1024,bytes.length)).includes(Buffer.from('%PDF-')))throw new Error('The contained output is not a bounded PDF copy.');
 const report=result.report;shape(report,['version','sourceSha256','sha256','originalBytes','outputBytes','pageCount','pages','records','verified','scope']);
 if(report.version!==1||report.verified!==true||report.sourceSha256!==sourceSha256||!/^[a-f0-9]{64}$/.test(sourceSha256)||report.sha256!==hash(bytes)||report.originalBytes!==byteLength||report.outputBytes!==bytes.length||!Number.isInteger(report.pageCount)||report.pageCount<1||report.pageCount>500||JSON.stringify(report.pages)!==JSON.stringify(draft.pages.map(x=>x+1))||draft.pages.some(x=>x>=report.pageCount)||!Array.isArray(report.records)||report.records.length!==draft.pages.length)throw new Error('The print-mark receipt does not match the reviewed source and settings.');
 for(const [i,row] of report.records.entries()){
  shape(row,['page','trim','trimMaterialized','outputMedia','outputCrop','marks','sourceContentRefs','outputContentRefs']);if(row.page!==draft.pages[i]+1||typeof row.trimMaterialized!=='boolean'||!['crop','bleed','registration'].every(k=>Number.isInteger(row.marks[k])&&row.marks[k]>=0)||!row.marks.crop&&!row.marks.bleed&&!row.marks.registration)throw new Error('The print-mark receipt has an unexpected page or mark count.');
  for(const box of [row.trim,row.outputMedia,row.outputCrop]){shape(box,['x','y','width','height']);for(const k of ['x','y','width','height'])number(box[k],-1e6,14400,'page geometry');if(box.width<=0||box.height<=0)throw new Error('The print-mark receipt has invalid page geometry.');}
  if(!Array.isArray(row.sourceContentRefs)||!Array.isArray(row.outputContentRefs)||row.outputContentRefs.length!==row.sourceContentRefs.length+3||JSON.stringify(row.outputContentRefs.slice(1,-2))!==JSON.stringify(row.sourceContentRefs))throw new Error('The print-mark receipt changed the original content stream sequence.');
  for(const ref of [...row.sourceContentRefs,...row.outputContentRefs])if(typeof ref!=='string'||!/^[0-9]{1,10} [0-9]{1,5} R$/.test(ref))throw new Error('The print-mark receipt has invalid content references.');
 }
 if(typeof report.scope!=='string'||report.scope.length>4000||Buffer.byteLength(JSON.stringify(report))>2*1024*1024)throw new Error('The print-mark receipt is too large.');return result;
}
module.exports={validPrintMarksDraft,validPrintMarksSource,validPrintMarksToken,validPrintMarksResult,MAX_BYTES,hash};
