// Exact PDF text highlighting for engines without CSS Custom Highlight.
// Only marks created here are unwrapped; text and PDF source offsets are kept.
export function clearPdfSearchFallback(root){
 const parents=new Set();for(const mark of root?.querySelectorAll('mark[data-pdfix-search-fallback]')??[]){const parent=mark.parentNode;if(!parent)continue;parents.add(parent);mark.replaceWith(...mark.childNodes);}for(const parent of parents)parent.normalize();
}
export function paintPdfSearchFallback(ranges,activeRanges){
 const selected=new Set(activeRanges),nodes=new Map(),paintedActive=[];
 for(const range of ranges){const node=range.startContainer;if(node.nodeType!==3||range.endContainer!==node||range.startOffset>=range.endOffset)continue;if(!nodes.has(node))nodes.set(node,[]);nodes.get(node).push({start:range.startOffset,end:range.endOffset,active:selected.has(range)});}
 for(const [node,intervals]of nodes){const text=node.textContent,events=new Map([[0,[0,0]],[text.length,[0,0]]]);for(const interval of intervals){for(const [offset,delta]of [[interval.start,1],[interval.end,-1]]){if(!events.has(offset))events.set(offset,[0,0]);const event=events.get(offset);event[0]+=delta;if(interval.active)event[1]+=delta;}}const cuts=[...events.keys()].sort((a,b)=>a-b),fragment=node.ownerDocument.createDocumentFragment();let hits=0,active=0;for(let i=0;i<cuts.length-1;i++){const start=cuts[i],end=cuts[i+1],delta=events.get(start);hits+=delta[0];active+=delta[1];if(end<=start)continue;const part=text.slice(start,end);if(!hits){fragment.append(node.ownerDocument.createTextNode(part));continue;}const mark=node.ownerDocument.createElement('mark');mark.dataset.pdfixSearchFallback='';mark.className=active?'search-hit search-active':'search-hit';mark.textContent=part;fragment.append(mark);if(active){const range=node.ownerDocument.createRange();range.selectNodeContents(mark);paintedActive.push(range);}}node.replaceWith(fragment);}
 return paintedActive;
}
