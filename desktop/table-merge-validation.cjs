function validTableMerges(value,cells){
 if(!Array.isArray(value)||value.length>100||!Array.isArray(cells)||!cells.length||cells.length>100||!Array.isArray(cells[0])||cells[0].length<1||cells[0].length>32)throw new Error('Use at most 100 rectangular table merges.');
 const rows=cells.length,columns=cells[0].length,occupied=new Set();
 const result=Array.from(value).map(item=>{
  if(!item||Object.getPrototypeOf(item)!==Object.prototype||Object.keys(item).sort().join(',')!=='column,columnSpan,row,rowSpan'||![item.row,item.column,item.rowSpan,item.columnSpan].every(Number.isInteger)||item.row<0||item.column<0||item.rowSpan<1||item.columnSpan<1||item.rowSpan*item.columnSpan<2||item.row+item.rowSpan>rows||item.column+item.columnSpan>columns)throw new Error('Keep each merged rectangle within the table grid.');
  for(let r=item.row;r<item.row+item.rowSpan;r++)for(let c=item.column;c<item.column+item.columnSpan;c++){const key=r+':'+c;if(occupied.has(key))throw new Error('Merged table rectangles cannot overlap.');occupied.add(key);if((r!==item.row||c!==item.column)&&cells[r]?.[c]!=='')throw new Error('Covered cells must be empty. Deliberately move needed text into the top-left cell and clear covered cells before merging.');}
  return {row:item.row,column:item.column,rowSpan:item.rowSpan,columnSpan:item.columnSpan};
 });return result.sort((a,b)=>a.row-b.row||a.column-b.column);
}
module.exports={validTableMerges};
