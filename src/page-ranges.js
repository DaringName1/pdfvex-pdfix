const validCount=n=>Number.isInteger(n)&&n>=1&&n<=500;
export function pageRange(text,count){
 if(!validCount(count))throw new Error('Keep between 1 and 500 output pages.');
 if(typeof text!=='string'||!text.trim()||text.length>2000)throw new Error('Enter page numbers or ranges, such as 1–3, 5.');
 const selected=[],seen=new Set();
 for(const token of text.replaceAll('–','-').split(',')){
  const match=token.trim().match(/^(\d{1,3})(?:\s*-\s*(\d{1,3}))?$/);if(!match)throw new Error('Use page numbers and ascending ranges separated by commas, such as 1–3, 5.');
  const start=Number(match[1]),end=Number(match[2]??match[1]);if(start<1||end>count||end<start)throw new Error(`Page ranges must be between 1 and ${count}, in ascending order.`);
  for(let n=start;n<=end;n++){if(seen.has(n))throw new Error(`Output page ${n} is selected more than once. Remove overlapping ranges.`);seen.add(n);selected.push(n-1);}
 }
 return selected;
}
export function splitGroups(settings,count){
 if(!validCount(count)||count<2)throw new Error('Splitting needs at least two output pages.');
 let groups;
 if(settings?.mode==='every'){
  const n=settings.every;if(!Number.isInteger(n)||n<1||n>=count)throw new Error(`Choose between 1 and ${count-1} pages per file.`);
  groups=Array.from({length:Math.ceil(count/n)},(_,part)=>Array.from({length:Math.min(n,count-part*n)},(_,i)=>part*n+i));
 }else if(settings?.mode==='ranges'){
  if(typeof settings.ranges!=='string'||settings.ranges.length>4000)throw new Error('Enter bounded split ranges.');
  groups=settings.ranges.split(';').map(text=>pageRange(text,count));
 }else throw new Error('Choose a supported split rule.');
 validateGroups(groups,count);const used=new Set(groups.flat());return {groups,omitted:Array.from({length:count},(_,i)=>i).filter(i=>!used.has(i))};
}
export function validateGroups(groups,count){
 if(!validCount(count)||!Array.isArray(groups)||groups.length<2||groups.length>500)throw new Error('Choose between 2 and 500 split files.');
 const used=new Set();for(const group of groups){if(!Array.isArray(group)||!group.length||group.length>500)throw new Error('Each split file needs at least one page.');for(const index of group){if(!Number.isInteger(index)||index<0||index>=count)throw new Error('A split page is outside the current output list.');if(used.has(index))throw new Error('Split ranges overlap. Each output page can appear in only one split file.');used.add(index);}}
 return groups;
}
export function rangeLabel(indices){
 const runs=[];for(let i=0;i<indices.length;i++){let end=i;while(end+1<indices.length&&indices[end+1]===indices[end]+1)end++;runs.push(end===i?String(indices[i]+1):`${indices[i]+1}–${indices[end]+1}`);i=end;}return runs.join(', ');
}
