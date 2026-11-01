// Bounded rectangular table geometry, shared with native recovery/PDF adapters.
const LIMITS=require('./document-limits.cjs');
function tableGeometry(table){
 const fail=()=>{throw new Error('Use rectangular tables with at most 1,000 rows, 32 columns and 32,000 grid cells. Nested tables are not supported.');};
 if(table?.type!=='table'||!Array.isArray(table.content)||!table.content.length||table.content.length>LIMITS.TABLE_ROWS)fail();
 const grid=Array.from({length:table.content.length},()=>[]),cells=[];let width=0;
 table.content.forEach((row,y)=>{if(row?.type!=='tableRow'||row.content!==undefined&&!Array.isArray(row.content)||(row.content??[]).length>32)fail();let x=0;
  (row.content??[]).forEach(cell=>{while(grid[y][x])x++;if(!['tableCell','tableHeader'].includes(cell?.type))fail();const a=cell.attrs??{},cols=a.colspan??1,rows=a.rowspan??1;
   if(!Number.isInteger(cols)||cols<1||cols>32||!Number.isInteger(rows)||rows<1||rows>LIMITS.TABLE_ROWS||x+cols>32||y+rows>grid.length)fail();
   if(a.colwidth!==undefined&&a.colwidth!==null&&(!Array.isArray(a.colwidth)||a.colwidth.length!==cols||a.colwidth.some(w=>!Number.isInteger(w)||w<24||w>1200)))fail();
   if(a.background!==undefined&&a.background!==null&&!/^#[0-9a-f]{6}$/i.test(a.background))fail();
   if(!Array.isArray(cell.content)||!cell.content.length||cell.content.some(n=>!['paragraph','heading','bulletList','orderedList','blockquote','codeBlock'].includes(n?.type)))fail();
   for(let dy=0;dy<rows;dy++)for(let dx=0;dx<cols;dx++){if(grid[y+dy][x+dx])fail();grid[y+dy][x+dx]=cell;}
   cells.push({cell,x,y,cols,rows});x+=cols;width=Math.max(width,x);
  });
 });
 if(!width||width*grid.length>LIMITS.TABLE_CELLS||grid.some(row=>row.length!==width||Array.from({length:width},(_,x)=>row[x]).some(v=>!v)))fail();
 const weights=table.attrs?.columnGridTwips;if(weights!==undefined&&weights!==null&&(!Array.isArray(weights)||weights.length!==width||weights.some(v=>!Number.isInteger(v)||v<1||v>30000)))throw new Error('Column widths need one bounded positive width per logical column.');
 return {width,height:grid.length,cells,grid};
}
function validateDocumentTables(doc){
 let count=0,tables=0,slots=0;const walk=(node,depth,inTable=false,parent=null)=>{if(!node||depth>64||++count>LIMITS.DOCUMENT_NODES||typeof node.type!=='string')throw new Error('Document exceeds the 20,000 element editing/recovery limit.');
  if(node.type==='tableRow'&&parent!=='table'||['tableCell','tableHeader'].includes(node.type)&&parent!=='tableRow')throw new Error('Table rows and cells must stay inside their table.');
  if(node.type==='table'){if(inTable||++tables>50)throw new Error('Use up to 50 tables without nested tables.');const size=tableGeometry(node);slots+=size.width*size.height;if(slots>LIMITS.TABLE_TOTAL_CELLS)throw new Error('The document exceeds 200,000 table grid cells.');inTable=true;}
  if(node.content!==undefined){if(!Array.isArray(node.content))throw new Error('Invalid document content.');node.content.forEach(n=>walk(n,depth+1,inTable,node.type));}
 };walk(doc,0);if(new TextEncoder().encode(JSON.stringify(doc)).length>LIMITS.DOCUMENT_BYTES)throw new Error('The document is larger than PDFix can edit.');return doc;
}

function tableColumnWidths(table,availableTwips){
 const geometry=tableGeometry(table),weights=table.attrs?.columnGridTwips??Array.from({length:geometry.width},()=>1500);
 if(availableTwips===undefined)return [...weights];if(!Number.isInteger(availableTwips)||availableTwips<geometry.width||availableTwips>100000)throw new Error('Unsupported printable table width.');
 const total=weights.reduce((sum,w)=>sum+w,0),space=availableTwips-weights.length,values=weights.map(w=>1+Math.floor(space*w/total));let remainder=availableTwips-values.reduce((a,b)=>a+b,0);const order=weights.map((w,i)=>({i,fraction:space*w/total-Math.floor(space*w/total)})).sort((a,b)=>b.fraction-a.fraction||a.i-b.i);for(let i=0;i<remainder;i++)values[order[i].i]++;return values;
}
function tableSignatureValue(table){
 const geometry=tableGeometry(table),text=node=>node.type==='text'?node.text:node.type==='documentImage'?'':node.type==='hardBreak'?'\n':(node.content??[]).map(text).join(['paragraph','heading','codeBlock'].includes(node.type)?'':'\n'),normalize=value=>value.replace(/\s+/gu,' ').trim().normalize('NFC');
 return {rows:geometry.height,columns:geometry.width,cells:geometry.cells.map(({cell,x,y,cols,rows})=>({row:y,column:x,rowspan:rows,colspan:cols,text:normalize(cell.content.map(text).join('\n'))}))};
}

module.exports={tableGeometry,validateDocumentTables,tableColumnWidths,tableSignatureValue};
