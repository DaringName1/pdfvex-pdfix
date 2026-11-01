// Mirrors the bounded native Bates sequence model; native validation remains authoritative.
export const MAX_BATES_NUMBER=999999999999;
export function validBatesSettings(item){
 if(item.mode!=='bates'||typeof item.prefix!=='string'||typeof item.suffix!=='string'||item.prefix.length>40||item.suffix.length>40||/[^\x20-\x7e]/.test(item.prefix+item.suffix)||!Number.isInteger(item.start)||item.start<0||item.start>MAX_BATES_NUMBER||!Number.isInteger(item.padding)||item.padding<1||item.padding>12)throw new Error('Bates numbering needs exact ASCII prefix/suffix up to 40 characters, an integer start from 0 to 999,999,999,999 and 1–12 fixed digits.');
 return {mode:'bates',prefix:item.prefix,suffix:item.suffix,start:item.start,padding:item.padding};
}
export function batesSequence(item,pages){
 const settings=validBatesSettings(item);if(!Array.isArray(pages)||!pages.length||pages.length>100||Array.from(pages).some(n=>!Number.isInteger(n)||n<0||n>499)||new Set(pages).size!==pages.length)throw new Error('Bates numbering needs 1–100 distinct physical pages in the chosen order.');
 const last=settings.start+pages.length-1;if(last>MAX_BATES_NUMBER||String(last).length>settings.padding)throw new Error('The complete Bates sequence exceeds its fixed numeric width. Increase the digit count or reduce the start/range.');
 return pages.map((page,index)=>({page:page+1,number:settings.start+index,text:settings.prefix+String(settings.start+index).padStart(settings.padding,'0')+settings.suffix}));
}
