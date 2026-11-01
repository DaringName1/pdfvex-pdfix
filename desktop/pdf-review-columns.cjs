'use strict';
const {PDFArray,PDFDict,PDFString,PDFHexString,PDFName,PDFNumber,PDFBool}=require('pdf-lib');
const k=PDFName.of;
function reviewColumns(doc){
 const resolve=value=>doc.context.lookup(value),warnings=[],catalog=resolve(doc.catalog.get(k('BSIAnnotColumns')));let remaining=500000;const warn=text=>{if(warnings.length<128)warnings.push(text);else warnings[127]='Further column-definition warnings omitted at the bounded warning limit.';};
 const literal=(value,max=512)=>{value=resolve(value);let text;if(value instanceof PDFString||value instanceof PDFHexString){if(value.sizeInBytes()>max*12+4)return null;text=value.decodeText();}else if(value instanceof PDFNumber&&Number.isFinite(value.asNumber())&&Math.abs(value.asNumber())<=1e15)text=String(value.asNumber());else if(value instanceof PDFBool)text=value.asBoolean()?'true':'false';else return null;if(text.length>max||text.length>remaining)return null;remaining-=text.length;return text;};
 const definitions=[];
 if(catalog!==undefined){
  warn('Bluebeam column definitions and values are literal source data. Array-slot association is unverified; DisplayOrder is not used to remap data. Formulas and proprietary semantics are not executed.');
  if(!(catalog instanceof PDFArray)||catalog.size()>64)warn('Column definitions are malformed or exceed 64 slots; they were not decoded.');
  else for(let slot=0;slot<catalog.size();slot++){
   const d=resolve(catalog.get(slot));if(!(d instanceof PDFDict)){warn('Definition slot '+slot+' is not a dictionary.');continue;}
   const name=literal(d.get(k('Name'))),subtype=resolve(d.get(k('Subtype'))),order=resolve(d.get(k('DisplayOrder'))),items=resolve(d.get(k('Items'))),choices=[];
   if(name===null||!(subtype instanceof PDFName)){warn('Definition slot '+slot+' has an unsupported name/type.');continue;}
   if(items instanceof PDFArray&&items.size()<=64)for(let i=0;i<items.size();i++){const value=resolve(items.get(i)),values=value instanceof PDFArray&&value.size()<=8?value.asArray():[value],entry=values.map(v=>literal(v));if(entry.every(v=>v!==null))choices.push(entry);else warn('An unsupported choice in definition slot '+slot+' was omitted.');}
   definitions.push({slot,name,subtype:subtype.decodeText().slice(0,80),displayOrder:order instanceof PDFNumber&&Number.isInteger(order.asNumber())&&order.asNumber()>=0&&order.asNumber()<=1000?order.asNumber():null,choices});
  }
 }
 return {catalog:catalog===undefined?null:{version:1,association:'array-slot-unverified',definitions,warnings},values(dict){
  const values=resolve(dict.get(k('BSIColumnData')));if(values===undefined)return undefined;
  if(!(values instanceof PDFArray)||values.size()>64)return [{slot:0,value:null,notice:'Column values are malformed or exceed 64 slots; values were not decoded.'}];
  return values.asArray().map((value,slot)=>{const text=literal(value,4096),definition=definitions.find(d=>d.slot===slot);let notice=text===null?'Unsupported or over-budget literal value; not decoded.':!definition?'No decoded definition at this raw slot; association unavailable.':'Array-slot association is unverified.';if(text&&definition?.subtype==='Choice'&&definition.choices.length&&!definition.choices.some(choice=>choice[0]===text))notice+=' This value is absent from the listed choices; do not infer another column or status.';return {slot,value:text,notice};});
 }};
}
function validColumns(value){
 const exact=(v,fields)=>v&&Object.getPrototypeOf(v)===Object.prototype&&Object.keys(v).sort().join(',')===[...fields].sort().join(','),text=(v,max)=>typeof v==='string'&&v.length<=max;
 if(!exact(value,['version','association','definitions','warnings'])||value.version!==1||value.association!=='array-slot-unverified'||!Array.isArray(value.definitions)||value.definitions.length>64||!Array.isArray(value.warnings)||value.warnings.length>130||value.warnings.some(v=>!text(v,512)))throw new Error('Unsupported literal column definition data.');
 const slots=new Set();for(const d of value.definitions){if(!exact(d,['slot','name','subtype','displayOrder','choices'])||!Number.isInteger(d.slot)||d.slot<0||d.slot>63||slots.has(d.slot)||!text(d.name,512)||!text(d.subtype,80)||d.displayOrder!==null&&(!Number.isInteger(d.displayOrder)||d.displayOrder<0||d.displayOrder>1000)||!Array.isArray(d.choices)||d.choices.length>64||d.choices.some(c=>!Array.isArray(c)||c.length>8||c.some(v=>!text(v,512))))throw new Error('Unsupported literal column definition.');slots.add(d.slot);}return value;
}
function validValues(value){if(!Array.isArray(value)||value.length>64||value.some((v,i)=>!v||Object.getPrototypeOf(v)!==Object.prototype||Object.keys(v).sort().join(',')!=='notice,slot,value'||v.slot!==i||v.value!==null&&(typeof v.value!=='string'||v.value.length>4096)||typeof v.notice!=='string'||v.notice.length>512))throw new Error('Unsupported literal custom-column values.');return value;}
module.exports={reviewColumns,validColumns,validValues};
