const MAX_SIDES=100,MAX_DIMENSION=10000,EPSILON=1e-7;
function dimension(value,name){if(typeof value!=='number'||!Number.isFinite(value)||value<1||value>MAX_DIMENSION)throw new Error(`Choose a finite ${name} from 1 to 10,000 mm.`);return value;}
function numeric(value,name,min,max){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new Error(`Choose ${name} between ${min} and ${max} mm.`);return value;}
function axisCount(source,usable,overlap){return source<=usable+EPSILON?1:1+Math.ceil((source-usable-EPSILON)/(usable-overlap));}
/** All dimensions and coordinates are millimeters. Physical source pages are
 * zero-based indices, in the user's selected order. Rows/columns are one-based.
 * Tiles use a fixed pitch (printable span minus overlap); a partial final tile
 * keeps its source origin and is never stretched/centered back over other tiles.
 * Source crop coordinates refer to the rotated/cropped viewport used by root. */
export function printTiling({pages,width,height,margin=8,overlap=10,marks=true}={}){
 dimension(width,'paper width');dimension(height,'paper height');numeric(margin,'margins',0,30);numeric(overlap,'tile overlap',0,25);
 if(typeof marks!=='boolean')throw new Error('Choose whether to include tile registration marks.');if(marks&&margin<6)throw new Error('Registration marks need at least 6 mm margins to remain outside the artwork. Increase margins or turn marks off.');
 if(!Array.isArray(pages)||!pages.length||pages.length>MAX_SIDES)throw new Error('Choose 1 to 100 physical source pages for tiling.');
 const usableWidth=width-2*margin,usableHeight=height-2*margin;if(usableWidth<10||usableHeight<10)throw new Error('Paper and margins leave less than 10 mm of printable artwork.');if(overlap>=usableWidth||overlap>=usableHeight)throw new Error('Tile overlap must be smaller than both printable dimensions.');
 const pitchX=usableWidth-overlap,pitchY=usableHeight-overlap,sides=[],pagePlans=[],indices=new Set();
 for(const page of pages){if(!page||!Number.isInteger(page.index)||page.index<0||page.index>=500||indices.has(page.index))throw new Error('Choose distinct physical PDF pages from 1 to 500.');indices.add(page.index);dimension(page.width,'source page width');dimension(page.height,'source page height');
  const columns=axisCount(page.width,usableWidth,overlap),rows=axisCount(page.height,usableHeight,overlap),count=columns*rows;if(!Number.isSafeInteger(count)||count+sides.length>MAX_SIDES)throw new Error('This tiled job exceeds 100 output sides. Choose fewer pages, larger paper, smaller margins or less overlap.');
  pagePlans.push({index:page.index,sourcePage:page.index+1,width:page.width,height:page.height,columns,rows,sideCount:count,startSide:sides.length+1});
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
   const x=column*pitchX,y=row*pitchY,cropWidth=Math.min(usableWidth,page.width-x),cropHeight=Math.min(usableHeight,page.height-y);if(cropWidth<=0||cropHeight<=0)throw new Error('The source geometry produced an empty tile.');
   const sourceCrop={left:x,top:y,width:cropWidth,height:cropHeight,right:x+cropWidth,bottom:y+cropHeight},clip={left:margin,top:margin,width:cropWidth,height:cropHeight};
   const cell={index:page.index,sourcePage:page.index+1,logicalPage:page.index+1,slot:0,left:margin,top:margin,width:usableWidth,height:usableHeight,blank:false};
   const tile={number:sides.length+1,sheet:sides.length+1,face:'single',index:page.index,sourcePage:page.index+1,row:row+1,column:column+1,rows,columns,scale:1,sourceWidth:page.width,sourceHeight:page.height,sourceCrop,clip,cells:[cell],overlap:{left:column?overlap:0,right:column<columns-1?overlap:0,top:row?overlap:0,bottom:row<rows-1?overlap:0},registrationMarks:[],trimLines:[]};
   if(marks){
    tile.printedLabel={x:width/2,y:height-margin/2,text:`P${page.index+1} R${row+1}/${rows} C${column+1}/${columns} S${tile.number}`,fontMm:1.6,maxWidth:Math.max(8,usableWidth-8)};
    const half=1.25,topY=margin/2,bottomY=height-margin/2,leftX=margin/2,rightX=width-margin/2;
    const cross=(x,y,pair,edge)=>{tile.registrationMarks.push({x,y,size:half*2,pair,edge,lines:[{x1:x-half,y1:y,x2:x+half,y2:y},{x1:x,y1:y-half,x2:x,y2:y+half}]});};
    // Shared vertical seams use the SAME source-world x position in the
    // overlap band, translated to a different paper x on adjacent tiles.
    if(column>0){const xMark=margin+overlap/2,pair=`p${page.index+1}-r${row+1}-v${column}`;cross(xMark,topY,pair+'-top','left');cross(xMark,bottomY,pair+'-bottom','left');}
    if(column<columns-1){const xMark=margin+usableWidth-overlap/2,pair=`p${page.index+1}-r${row+1}-v${column+1}`;cross(xMark,topY,pair+'-top','right');cross(xMark,bottomY,pair+'-bottom','right');}
    if(row>0){const yMark=margin+overlap/2,pair=`p${page.index+1}-c${column+1}-h${row}`;cross(leftX,yMark,pair+'-left','top');cross(rightX,yMark,pair+'-right','top');}
    if(row<rows-1){const yMark=margin+usableHeight-overlap/2,pair=`p${page.index+1}-c${column+1}-h${row+1}`;cross(leftX,yMark,pair+'-left','bottom');cross(rightX,yMark,pair+'-right','bottom');}
    // Small outside-artwork corner strokes show the actual partial-tile crop.
    const left=margin,right=margin+cropWidth,top=margin,bottom=margin+cropHeight,gap=.8,length=2;
    for(const [cx,cy,signX,signY]of[[left,top,-1,-1],[right,top,1,-1],[left,bottom,-1,1],[right,bottom,1,1]]){
     const horizontal={x1:cx+signX*gap,y1:cy,x2:cx+signX*(gap+length),y2:cy},vertical={x1:cx,y1:cy+signY*gap,x2:cx,y2:cy+signY*(gap+length)};
     // A partial tile's bottom/right blank region belongs to the paper margin
     // for these marks. Every returned stroke remains on the physical sheet.
     for(const line of[horizontal,vertical])if([line.x1,line.x2].every(n=>n>=0&&n<=width)&&[line.y1,line.y2].every(n=>n>=0&&n<=height))tile.trimLines.push(line);
    }
   }
   tile.label=tilingSideLabel(tile);sides.push(tile);
  }
 }
 return {mode:'tiled',width,height,margin,overlap,marks,usableWidth,usableHeight,pitchX,pitchY,sides,sideCount:sides.length,sheetCount:sides.length,sourcePages:pages.map(page=>page.index+1),pagePlans,blankPages:0,fitOnly:false,scale:1,duplexRequest:'simplex',notice:`Actual size 100%. Adjacent tiles repeat exactly ${overlap} mm of source artwork in each tiled direction. Order is source page, top-to-bottom rows, then left-to-right columns. Final row/column tiles can contain blank paper. Review every output side and match row/column labels${marks?' and paired seam marks':''}. Printer scaling and physical alignment require confirmation in Windows and on the printer.`};
}
export function tilingSideLabel(side){return `Sheet ${side.number} · source page ${side.sourcePage} · row ${side.row}/${side.rows}, column ${side.column}/${side.columns} · 100%`;} 
/** Root prepares full source images within its existing raster budgets.
 * Returned images intentionally extend beyond their clip wrappers. Clip first,
 * then draw the registration marks outside that artwork wrapper. */
export function composeTiling(plan,rendered){
 if(plan?.mode!=='tiled'||!Array.isArray(plan.sides)||plan.sides.length>MAX_SIDES)throw new Error('Prepare a valid tiled print plan.');
 const images=rendered instanceof Map?rendered:new Map(rendered.map(image=>[image.page-1,image]));
 return plan.sides.map(side=>{const image=images.get(side.index);if(!image||typeof image.src!=='string'||!image.src.startsWith('data:image/png;base64,')||!Number.isFinite(image.width)||!Number.isFinite(image.height)||Math.abs(image.width-side.sourceWidth)>.01||Math.abs(image.height-side.sourceHeight)>.01||image.scale!==1)throw new Error(`Prepare source page ${side.sourcePage} at exactly 100% size before tiling.`);
  return {...side,label:tilingSideLabel(side),placements:[{...image,page:side.sourcePage,left:side.clip.left-side.sourceCrop.left,top:side.clip.top-side.sourceCrop.top,width:side.sourceWidth,height:side.sourceHeight,scale:1,clip:{...side.clip},sourceCrop:{...side.sourceCrop}}]};
 });
}
/** Draw inert SVG line artwork for both on-screen previews and printed pages.
 * Only numeric plan coordinates enter attributes; no source-file text/HTML. */
export function tilingMarksSvg(side,paperWidth,paperHeight){
 dimension(paperWidth,'paper width');dimension(paperHeight,'paper height');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${paperWidth} ${paperHeight}`);svg.setAttribute('width','100%');svg.setAttribute('height','100%');svg.setAttribute('aria-hidden','true');svg.classList.add('print-tile-marks');Object.assign(svg.style,{position:'absolute',inset:'0',pointerEvents:'none'});
 const lines=[...(side.registrationMarks||[]).flatMap(mark=>mark.lines),...(side.trimLines||[])];if(lines.length>48)throw new Error('Too many tile registration strokes.');for(const coords of lines){if(['x1','x2'].some(k=>!Number.isFinite(coords[k])||coords[k]<0||coords[k]>paperWidth)||['y1','y2'].some(k=>!Number.isFinite(coords[k])||coords[k]<0||coords[k]>paperHeight))throw new Error('A registration mark lies outside its sheet.');const line=document.createElementNS('http://www.w3.org/2000/svg','line');for(const attr of['x1','y1','x2','y2'])line.setAttribute(attr,String(coords[attr]));line.setAttribute('stroke','#111');line.setAttribute('stroke-width','.2');svg.append(line);}if(side.printedLabel){const label=side.printedLabel;if(!Number.isFinite(label.x)||!Number.isFinite(label.y)||label.x<0||label.x>paperWidth||label.y<0||label.y>paperHeight||typeof label.text!=='string'||label.text.length>64)throw new Error('An invalid printed tile label was supplied.');const text=document.createElementNS('http://www.w3.org/2000/svg','text');text.setAttribute('x',String(label.x));text.setAttribute('y',String(label.y));text.setAttribute('text-anchor','middle');text.setAttribute('dominant-baseline','middle');text.setAttribute('font-size',String(label.fontMm));text.setAttribute('font-family','Arial, sans-serif');text.setAttribute('fill','#111');if(label.text.length*label.fontMm*.6>label.maxWidth){text.setAttribute('textLength',String(label.maxWidth));text.setAttribute('lengthAdjust','spacingAndGlyphs');}text.textContent=label.text;svg.append(text);}return svg;
}
