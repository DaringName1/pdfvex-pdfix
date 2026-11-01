// Pixel planning is independent of canvas encoding and native copy saving.
export function pdfImageExportPages({mode,count,current,range}={}){
 if(!Number.isSafeInteger(count)||count<1)throw new Error('The PDF page count is unavailable.');
 if(mode==='current'){if(!Number.isInteger(current)||current<1||current>count)throw new Error('The current PDF page is unavailable.');return [current-1];}
 if(mode==='all'){if(count>100)throw new Error('Choose up to 100 pages; use a smaller page range for larger PDFs.');return Array.from({length:count},(_,index)=>index);}
 if(mode!=='range'||typeof range!=='string'||!range.trim()||range.length>2000)throw new Error('Choose current/all pages or a page range such as 1–3, 5.');
 const selected=[],seen=new Set();
 for(const token of range.replaceAll('–','-').split(',')){
  const match=token.trim().match(/^(\d{1,9})(?:\s*-\s*(\d{1,9}))?$/);if(!match)throw new Error('Use ascending page ranges separated by commas.');
  const start=Number(match[1]),end=Number(match[2]??match[1]);if(start<1||end>count||end<start)throw new Error(`Page ranges must be between 1 and ${count}, in ascending order.`);
  if(selected.length+end-start+1>100)throw new Error('Choose up to 100 pages; use a smaller page range for larger PDFs.');
  for(let page=start;page<=end;page++){if(seen.has(page))throw new Error('Remove overlapping or repeated image-export pages.');seen.add(page);selected.push(page-1);}
 }
 return selected;
}
export function pdfImagePageLayout(page,{dpi,rotation=0}={}){
 if(![72,144,216,300].includes(dpi)||![0,90,180,270].includes(rotation))throw new Error('Choose supported image resolution and rotation.');
 if(!page||!Number.isInteger(page.pageNumber)||page.pageNumber<1||!Number.isFinite(page.rotate)||page.rotate%90!==0)throw new Error('This PDF page has unsupported image geometry.');
 const viewport=page.getViewport({scale:dpi/72,rotation:((page.rotate+rotation)%360+360)%360});
 if(![viewport.width,viewport.height].every(value=>Number.isFinite(value)&&value>0))throw new Error('This PDF page has unsupported image geometry.');
 const width=Math.ceil(viewport.width),height=Math.ceil(viewport.height);
 if(width>8192||height>8192||width*height>16_000_000)throw new Error('This page exceeds the image pixel limit. Choose a lower resolution.');
 return {page:page.pageNumber,viewport,width,height};
}
export function pdfImagePlanPixels(layouts){
 if(!Array.isArray(layouts)||!layouts.length||layouts.length>100)throw new Error('Choose up to 100 PDF pages for image export.');
 let pixels=0;
 for(const layout of layouts){if(!layout||![layout.width,layout.height].every(value=>Number.isInteger(value)&&value>0&&value<=8192)||layout.width*layout.height>16_000_000||(pixels+=layout.width*layout.height)>100_000_000)throw new Error('This range exceeds the image pixel limit. Choose fewer pages or a lower resolution.');}
 return pixels;
}
