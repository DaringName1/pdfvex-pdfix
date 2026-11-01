import {validateGroups,rangeLabel} from './page-ranges.js';

const titleText=value=>String(value??'Untitled bookmark').replace(/[\p{Cc}\p{Cf}\p{Cs}]/gu,' ').trim().slice(0,200)||'Untitled bookmark';
export async function bookmarkSplitRecipe(doc,plan,source,depth,{read,alive}){
 if(!Array.isArray(plan)||plan.length<2||plan.length>500||!Number.isInteger(source)||source<0||![1,2,3].includes(depth))throw new Error('Choose a bounded bookmark split scope and at least two output pages.');
 if(!Number.isInteger(doc.numPages)||doc.numPages<1||doc.numPages>500)throw new Error('Bookmark splitting supports source PDFs with up to 500 physical pages.');
 const outline=await read(doc.getOutline());alive();
 if(!Array.isArray(outline)||!outline.length)throw new Error('This source has no document bookmarks. Choose another source or split rule.');
 if(outline.length>2000)throw new Error('This outline exceeds 2,000 entries. Use a custom range split instead.');
 const positions=new Map();plan.forEach((row,index)=>{if(row.source===source){const list=positions.get(row.index)||[];list.push(index);positions.set(row.index,list);}});
 const queue=outline.map(item=>({item,level:1})),starts=new Map(),notes=[];
 let nodes=0,scoped=0,invalid=0,removed=0,duplicate=0,repeated=0,nested=0;
 const note=value=>{if(notes.length<50)notes.push(value);};
 for(let cursor=0;cursor<queue.length;cursor++){
  alive();if(++nodes>2000)throw new Error('This outline exceeds 2,000 entries. Use a custom range split instead.');
  const {item,level}=queue[cursor];if(level>20)throw new Error('This outline exceeds 20 hierarchy levels. Use a custom range split instead.');
  if(!item||typeof item!=='object'){invalid++;note('An invalid outline entry was skipped.');continue;}
  if(Array.isArray(item.items)){if(queue.length+item.items.length>2000)throw new Error('This outline exceeds 2,000 entries. Use a custom range split instead.');for(const child of item.items)queue.push({item:child,level:level+1});}
  if(level>depth){nested++;continue;}scoped++;
  const title=titleText(item.title);
  if(item.url||item.unsafeUrl||item.action||item.newWindow||!item.dest){invalid++;note(`Skipped “${title}”: no supported internal page destination.`);continue;}
  let index;
  try{
   const dest=typeof item.dest==='string'&&item.dest.length<=2000?await read(doc.getDestination(item.dest)):item.dest;alive();
   if(!Array.isArray(dest)||!dest.length)throw new Error('missing destination');
   const first=dest[0];
   if(Number.isInteger(first))index=first;
   else if(first&&Number.isSafeInteger(first.num)&&first.num>0&&first.num<=2147483647&&Number.isInteger(first.gen)&&first.gen>=0&&first.gen<=65535)index=await read(doc.getPageIndex(first));
   if(!Number.isInteger(index)||index<0||index>=doc.numPages)throw new Error('destination outside physical pages');
  }catch(error){alive();if(error.bookmarkReadLimit)throw error;invalid++;note(`Skipped “${title}”: its physical page could not be resolved.`);continue;}
  const matches=positions.get(index);
  if(!matches?.length){removed++;note(`Skipped “${title}”: source page ${index+1} is absent from the current arrangement.`);continue;}
  if(matches.length>1){repeated+=matches.length-1;note(`“${title}”: source page ${index+1} appears ${matches.length} times; each occurrence starts a section.`);}
  for(const position of matches){if(starts.has(position)){duplicate++;note(`Merged “${title}” with an existing section start at output page ${position+1}.`);}else starts.set(position,{title,sourcePage:index+1,position});}
 }
 alive();
 if(!starts.size)throw new Error(`No usable bookmark starts remain in the chosen scope (${invalid} invalid, ${removed} absent-page entries). Choose another source/scope or split rule.`);
 const prefix=!starts.has(0);if(prefix)starts.set(0,{title:'Prefix / pages before the first bookmark',sourcePage:null,position:0});
 const boundaries=[...starts.keys()].sort((a,b)=>a-b),groups=boundaries.map((start,i)=>Array.from({length:(boundaries[i+1]??plan.length)-start},(_,offset)=>start+offset));
 if(groups.length<2)throw new Error('The usable bookmarks produce only one file. Choose a deeper scope or another split rule.');
 validateGroups(groups,plan.length);
 if(groups.flat().length!==plan.length)throw new Error('The bookmark split did not account for every current output page.');
 const parts=groups.map((positions,i)=>({name:`part-${String(i+1).padStart(3,'0')}.pdf`,...starts.get(positions[0]),positions,label:rangeLabel(positions)}));
 const ranges=groups.map(group=>rangeLabel(group)).join('; ');
 if(ranges.length>4000)throw new Error('The resolved recipe exceeds the saved range limit.');
 const otherSourcePages=plan.filter(row=>row.source!==source).length;
 return {groups,parts,ranges,notes,summary:`${groups.length} files · all ${plan.length} current output pages included. ${scoped} bookmarks in scope; ${nested} deeper entries ignored; ${invalid} invalid/external entries skipped; ${removed} starts on removed pages skipped; ${duplicate} duplicate starts merged; ${repeated} extra repeated-page starts. ${prefix?'A separate prefix group is included.':'The first section starts at output page 1.'} ${otherSourcePages?`${otherSourcePages} pages from other sources stay in their current positions inside these groups.`:''} Boundaries follow the current output order, using actual physical source pages; printed labels and bookmark text are not used as page numbers.`};
}
