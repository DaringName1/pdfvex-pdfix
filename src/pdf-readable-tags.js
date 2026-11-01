import {pdfReadableSequence} from './pdf-readable-sequence.js';
const groups=new Set(['P','H','H1','H2','H3','H4','H5','H6','TD','TH','Caption','Lbl']);
export function pdfTaggedReadable(content,tree,originalContent=content){
 if(!Array.isArray(content?.items)||content.items.length>60000)throw new Error('Marked-content items exceed the readable budget.');
 const sequence=pdfReadableSequence(content),byId=new Map(),stack=[];let run=0;
 const original=pdfReadableSequence(originalContent);
 if(original.items.length!==sequence.items.length||sequence.items.some((item,index)=>item.str!==original.items[index].str||JSON.stringify(item.transform??null)!==JSON.stringify(original.items[index].transform??null)))throw new Error('Tagged text boundaries differ from the artwork/search source. Use content sequence or reviewed regions for reliable character mapping.');
 if(!tree||!Array.isArray(tree.children))throw new Error('This page has no usable declared tag order. Choose content sequence or a reviewed geometry view.');
 for(const item of content.items){
  if(typeof item?.str==='string'){for(const id of new Set(stack.filter(Boolean))){if(!byId.has(id))byId.set(id,[]);byId.get(id).push(run);}run++;continue;}
  if(item?.type==='beginMarkedContent'||item?.type==='beginMarkedContentProps'){if(stack.length>=64)throw new Error('Marked-content nesting exceeds the readable budget.');const id=item.id;if(id!==undefined&&(typeof id!=='string'||id.length>256))throw new Error('A marked-content identity is invalid.');stack.push(id??null);}
  else if(item?.type==='endMarkedContent'){if(!stack.length)throw new Error('Marked-content boundaries are incomplete.');stack.pop();}
 }
 if(stack.length)throw new Error('Marked-content boundaries are incomplete.');
 const blocks=[],used=new Set(),seen=new WeakSet();let nodes=0,unavailable=0;
 const ids=(node,depth)=>{if(!node||typeof node!=='object'||depth>32||++nodes>10000||seen.has(node))throw new Error('The declared tag tree exceeds the readable budget or repeats a node.');seen.add(node);if(node.type==='content'){if(typeof node.id!=='string'||node.id.length>256)throw new Error('A tag content identity is invalid.');return [node.id];}if(!Array.isArray(node.children))return [];if(node.children.length>1000)throw new Error('The declared tag tree exceeds the readable budget.');return node.children.flatMap(child=>ids(child,depth+1));};
 const add=identities=>{const indices=[];for(const id of identities){const source=byId.get(id);if(!source){unavailable++;continue;}for(const index of source){if(used.has(index))throw new Error('The declared tag order selects the same text run twice. Use a reviewed geometry view.');used.add(index);indices.push(index);}}if(indices.length)blocks.push(indices);};
 const visit=(node,depth)=>{if(groups.has(node?.role)||node?.type==='content'){add(ids(node,depth));return;}if(!node||typeof node!=='object'||depth>32||++nodes>10000||seen.has(node))throw new Error('The declared tag tree exceeds the readable budget or repeats a node.');seen.add(node);if(Array.isArray(node.children)){if(node.children.length>1000)throw new Error('The declared tag tree exceeds the readable budget.');for(const child of node.children)visit(child,depth+1);}};
 visit(tree,0);const output=[],sourceRuns=[],sourceFragments=[];
 for(const indices of blocks){const block=pdfReadableSequence({items:indices.map(index=>sequence.items[index])});output.push(...block.output);sourceRuns.push(...block.sourceRuns.map(row=>row.map(index=>indices[index])));sourceFragments.push(...block.sourceFragments.map(row=>row.map(fragment=>({...fragment,run:indices[fragment.run]}))));}
 const omitted=sequence.items.filter((item,index)=>item.str.trim()&&!used.has(index)).length;
 return {output,sourceRuns,sourceFragments,omitted:omitted>0,method:`Declared PDF tag order; ${omitted} untagged text runs omitted, ${unavailable} tag references without page text. Tags are supplied by the file and need review against artwork`};
}
