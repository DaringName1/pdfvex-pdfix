import {orderVisualText} from './pdf-selection.js';
export function validTableMerges(value,cells){
 if(!Array.isArray(value)||value.length>100||!Array.isArray(cells)||!cells.length||cells.length>100||!Array.isArray(cells[0])||cells[0].length<1||cells[0].length>32)throw new Error('Use at most 100 rectangular table merges.');
 const rows=cells.length,columns=cells[0].length,occupied=new Set();
 const result=Array.from(value).map(item=>{
  if(!item||Object.getPrototypeOf(item)!==Object.prototype||Object.keys(item).sort().join(',')!=='column,columnSpan,row,rowSpan'||![item.row,item.column,item.rowSpan,item.columnSpan].every(Number.isInteger)||item.row<0||item.column<0||item.rowSpan<1||item.columnSpan<1||item.rowSpan*item.columnSpan<2||item.row+item.rowSpan>rows||item.column+item.columnSpan>columns)throw new Error('Keep each merged rectangle within the table grid.');
  for(let r=item.row;r<item.row+item.rowSpan;r++)for(let c=item.column;c<item.column+item.columnSpan;c++){const key=r+':'+c;if(occupied.has(key))throw new Error('Merged table rectangles cannot overlap.');occupied.add(key);if((r!==item.row||c!==item.column)&&cells[r]?.[c]!=='')throw new Error('Covered cells must be empty. Deliberately move needed text into the top-left cell and clear covered cells before merging.');}
  return {row:item.row,column:item.column,rowSpan:item.rowSpan,columnSpan:item.columnSpan};
 });return result.sort((a,b)=>a.row-b.row||a.column-b.column);
}
export const tableMergeAt=(merges,row,column)=>merges?.find(item=>row>=item.row&&row<item.row+item.rowSpan&&column>=item.column&&column<item.column+item.columnSpan)??null;
export function tableEdges(value,count){
 if(!Number.isInteger(count)||count<1||count>100)throw new Error('Choose a bounded row/column count.');
 const cuts=String(value??'').trim()?String(value).split(',').map(part=>Number(part.trim())):Array.from({length:count-1},(_,i)=>(i+1)*100/count);
 if(cuts.length!==count-1||cuts.some((n,i)=>!Number.isFinite(n)||n<=0||n>=100||i&&n<=cuts[i-1]))throw new Error(`Enter ${count-1} increasing breaks inside 0–100%, or leave blank for equal cells.`);
 return [0,...cuts.map(n=>n/100),1];
}
export function tableRegion(values){const [left,top,width,height]=values.map(Number);if(![left,top,width,height].every(Number.isFinite)||left<0||top<0||width<=0||height<=0||left+width>100||top+height>100)throw new Error('Keep the table rectangle inside the page.');return {left:left/100,top:top/100,right:(left+width)/100,bottom:(top+height)/100};}
export function assignTableWords(words,region,rowEdges,columnEdges){
 if(!Array.isArray(words)||!words.length||words.length>20000)throw new Error('Choose an area with 1–20,000 words.');const groups=Array.from({length:rowEdges.length-1},()=>Array.from({length:columnEdges.length-1},()=>[])),flagged=groups.map(row=>row.map(()=>false));let selected=0,crossings=0,uncertain=0,chars=0;
 for(const word of words){if(typeof word.text!=='string'||word.text.length>4096||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(word.text)||![word.left,word.top,word.width,word.height].every(Number.isFinite)||word.width<=0||word.height<=0)throw new Error('A selected word has unsupported text or geometry.');chars+=word.text.length;if(chars>500000)throw new Error('The selected table exceeds its text budget.');const x=(word.left+word.width/2-region.left)/(region.right-region.left),y=(word.top+word.height/2-region.top)/(region.bottom-region.top);if(x<0||x>1||y<0||y>1)continue;const c=Math.min(columnEdges.length-2,columnEdges.findIndex(edge=>edge>x)-1),r=Math.min(rowEdges.length-2,rowEdges.findIndex(edge=>edge>y)-1),column=c<0?columnEdges.length-2:c,row=r<0?rowEdges.length-2:r;
  const bounds={left:region.left+columnEdges[column]*(region.right-region.left),right:region.left+columnEdges[column+1]*(region.right-region.left),top:region.top+rowEdges[row]*(region.bottom-region.top),bottom:region.top+rowEdges[row+1]*(region.bottom-region.top)},crossed=word.left<bounds.left-.002||word.left+word.width>bounds.right+.002||word.top<bounds.top-.002||word.top+word.height>bounds.bottom+.002,low=word.confidence!==undefined&&(!Number.isFinite(word.confidence)||word.confidence<80);if(crossed)crossings++;if(low)uncertain++;flagged[row][column] ||= crossed||low;groups[row][column].push(word);selected++;
 }
 if(!selected)throw new Error('No selected word centers fall inside the table rectangle.');return {cells:groups.map(row=>row.map(group=>orderVisualText(group.map(word=>({...word,left:word.left*10000,top:word.top*10000,width:word.width*10000,height:word.height*10000}))).join('\n'))),flagged,selected,crossings,uncertain};
}
// Column breaks where no word in the table area reaches across: each run of overlapping word spans is one column,
// and each break sits in the middle of the empty strip between two runs.
export function suggestedTableColumns(words,region){
  const spans=[];for(const word of words){const middle=word.top+word.height/2;if(middle<region.top||middle>region.bottom)continue;const left=Math.max(region.left,word.left),right=Math.min(region.right,word.left+word.width);if(right>left)spans.push([left,right]);}
  spans.sort((a,b)=>a[0]-b[0]);const blocks=[];for(const [left,right] of spans){const last=blocks.at(-1);if(last&&left<=last[1]+.004)last[1]=Math.max(last[1],right);else blocks.push([left,right]);}
  if(!blocks.length)throw new Error('No words in this area. Read the words first, or choose the area around the table.');if(blocks.length>32)throw new Error('Column suggestions exceed 32 columns. Choose a smaller table area.');
  const width=region.right-region.left;return {count:blocks.length,cuts:blocks.slice(1).map((block,i)=>((blocks[i][1]+block[0])/2-region.left)/width*100).map(n=>n.toFixed(3)).join(', ')};
}
export function suggestedTableRows(words,region){
 const rows=[];for(const word of [...words].sort((a,b)=>a.top-b.top)){const center=word.top+word.height/2;if(center<region.top||center>region.bottom)continue;let row=rows.find(item=>Math.abs(item.center-center)<=Math.max(.002,Math.min(item.height,word.height)*.5));if(!row){row={center,height:word.height};rows.push(row);}}
 rows.sort((a,b)=>a.center-b.center);if(!rows.length||rows.length>100)throw new Error('Row suggestions exceed 100 rows. Choose a smaller table area.');return {count:rows.length,cuts:rows.slice(1).map((row,i)=>(row.center+rows[i].center)/2).map(center=>(center-region.top)/(region.bottom-region.top)*100).map(n=>n.toFixed(3)).join(', ')};
}
