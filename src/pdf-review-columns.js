function validColumns(value){
 const exact=(v,fields)=>v&&Object.getPrototypeOf(v)===Object.prototype&&Object.keys(v).sort().join(',')===[...fields].sort().join(','),text=(v,max)=>typeof v==='string'&&v.length<=max;
 if(!exact(value,['version','association','definitions','warnings'])||value.version!==1||value.association!=='array-slot-unverified'||!Array.isArray(value.definitions)||value.definitions.length>64||!Array.isArray(value.warnings)||value.warnings.length>130||value.warnings.some(v=>!text(v,512)))throw new Error('Unsupported literal column definition data.');
 const slots=new Set();for(const d of value.definitions){if(!exact(d,['slot','name','subtype','displayOrder','choices'])||!Number.isInteger(d.slot)||d.slot<0||d.slot>63||slots.has(d.slot)||!text(d.name,512)||!text(d.subtype,80)||d.displayOrder!==null&&(!Number.isInteger(d.displayOrder)||d.displayOrder<0||d.displayOrder>1000)||!Array.isArray(d.choices)||d.choices.length>64||d.choices.some(c=>!Array.isArray(c)||c.length>8||c.some(v=>!text(v,512))))throw new Error('Unsupported literal column definition.');slots.add(d.slot);}return value;
}
function validValues(value){if(!Array.isArray(value)||value.length>64||value.some((v,i)=>!v||Object.getPrototypeOf(v)!==Object.prototype||Object.keys(v).sort().join(',')!=='notice,slot,value'||v.slot!==i||v.value!==null&&(typeof v.value!=='string'||v.value.length>4096)||typeof v.notice!=='string'||v.notice.length>512))throw new Error('Unsupported literal custom-column values.');return value;}

export {validColumns,validValues};
