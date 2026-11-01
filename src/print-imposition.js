const MODES=new Set(['single','two','four','booklet']);
function positive(value,name){if(typeof value!=='number'||!Number.isFinite(value)||value<=0)throw new Error(`Choose a valid ${name}.`);return value;}
/** Indices are physical, zero-based source pages in the user's selected order.
 * Every returned side is one output sheet side; front/back pairs are adjacent.
 * No source mutation, page-label interpretation or driver duplex assumptions. */
export function printImposition({indices,width,height,margin=8,gap=4,mode='single'}){
  if(!MODES.has(mode)||!Array.isArray(indices)||!indices.length||indices.length>100||indices.some(index=>!Number.isInteger(index)||index<0||index>=500))throw new Error('Choose an imposition mode and 1–100 physical PDF pages.');
  positive(width,'paper width');positive(height,'paper height');
  if(!Number.isFinite(margin)||margin<0||margin>30||!Number.isFinite(gap)||gap<0||gap>30)throw new Error('Choose margins and a page gap between 0 and 30 mm.');
  if(mode==='booklet'&&width<=height)throw new Error('Booklet printing needs landscape paper.');
  const cols=mode==='single'?1:2,rows=mode==='four'?2:1,usableWidth=width-2*margin,usableHeight=height-2*margin,cellWidth=(usableWidth-(cols-1)*gap)/cols,cellHeight=(usableHeight-(rows-1)*gap)/rows;
  if(cellWidth<10||cellHeight<10)throw new Error('Paper, margins and page gaps leave too little printable space.');
  const cell=(index,slot,logicalPage)=>({index,sourcePage:index===null?null:index+1,logicalPage,slot,left:margin+(slot%cols)*(cellWidth+gap),top:margin+Math.floor(slot/cols)*(cellHeight+gap),width:cellWidth,height:cellHeight,blank:index===null});
  const sides=[];let blankPages=0;
  if(mode==='booklet'){
    const padded=Math.ceil(indices.length/4)*4,pages=[...indices,...Array(padded-indices.length).fill(null)];blankPages=padded-indices.length;
    for(let sheet=0;sheet<padded/4;sheet++){
      const frontPositions=[padded-1-2*sheet,2*sheet],backPositions=[2*sheet+1,padded-2-2*sheet];
      sides.push({number:sides.length+1,sheet:sheet+1,face:'front',cells:frontPositions.map((position,slot)=>cell(pages[position],slot,position+1))});
      sides.push({number:sides.length+1,sheet:sheet+1,face:'back',cells:backPositions.map((position,slot)=>cell(pages[position],slot,position+1))});
    }
  }else{
    const count=cols*rows;
    for(let start=0;start<indices.length;start+=count){const cells=[];for(let slot=0;slot<count;slot++){const position=start+slot,index=position<indices.length?indices[position]:null;if(index===null)blankPages++;cells.push(cell(index,slot,index===null?null:position+1));}sides.push({number:sides.length+1,sheet:sides.length+1,face:'single',cells});}
  }
  return {mode,width,height,margin,gap,columns:cols,rows,sides,sideCount:sides.length,sourcePages:[...indices].map(index=>index+1),blankPages,sheetCount:mode==='booklet'?sides.length/2:sides.length,fitOnly:mode!=='single',duplexRequest:mode==='booklet'?'shortEdge':null,bookletNotice:mode==='booklet'?'Left-bound booklet: alternating front/back sides, folded through the center. Request landscape short-edge duplex in Windows; driver orientation, flipping and physical output remain unverified. Review the side preview before printing.':null};
}
export function fitImpositionCell(originalWidth,originalHeight,cell){
  positive(originalWidth,'source width');positive(originalHeight,'source height');positive(cell?.width,'cell width');positive(cell?.height,'cell height');
  const scale=Math.min(cell.width/originalWidth,cell.height/originalHeight),width=originalWidth*scale,height=originalHeight*scale;
  return {scale,width,height,left:cell.left+(cell.width-width)/2,top:cell.top+(cell.height-height)/2};
}
export function impositionSideLabel(side){return `${side.face==='single'?'Sheet':'Sheet '+side.sheet+' · '+side.face} ${side.face==='single'?side.sheet:''}`.trim()+' · '+side.cells.map(cell=>cell.blank?'Blank':`Source page ${cell.sourcePage}`).join(' | ');}
/** Compose per-page raster records into positioned output sides.
 * Render each source using fitImpositionCell before calling this helper; source
 * records require {src,width,height,scale}, preserving root's raster budgets. */
export function composeImposition(plan,rendered){
  const map=rendered instanceof Map?rendered:new Map(rendered.map(value=>[value.page-1,value]));
  return plan.sides.map(side=>({...side,label:impositionSideLabel(side),placements:side.cells.filter(cell=>!cell.blank).map(cell=>{const image=map.get(cell.index);if(!image||typeof image.src!=='string'||!Number.isFinite(image.width)||image.width<=0||!Number.isFinite(image.height)||image.height<=0)throw new Error(`Source page ${cell.sourcePage} has no prepared print image.`);if(image.width>cell.width+.01||image.height>cell.height+.01)throw new Error(`Source page ${cell.sourcePage} exceeds its imposed print cell. Prepare using the cell's Fit scale.`);return {...image,page:cell.sourcePage,left:cell.left+(cell.width-image.width)/2,top:cell.top+(cell.height-image.height)/2};})}));
}
