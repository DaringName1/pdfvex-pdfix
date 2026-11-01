import { PDFDocument, StandardFonts, degrees } from 'pdf-lib';
import { organizePdf, inspectPdf } from './pdf-operations.js';
import { requireOcrLanguage } from './ocr-languages.js';

export function inversePoint(transform,x,y){
  if(!Array.isArray(transform)||transform.length!==6||!transform.every(Number.isFinite))throw new Error('Invalid OCR page coordinates.');
  const [a,b,c,d,e,f]=transform,det=a*d-b*c;
  if(Math.abs(det)<.000001)throw new Error('Invalid OCR page scale.');
  return [(d*(x-e)-c*(y-f))/det,(-b*(x-e)+a*(y-f))/det];
}
export async function searchablePdf(bytes,recognized,progress=()=>{}) {
  const info=await inspectPdf(bytes);
  if(info.pages.length>20)throw new Error('Local OCR supports up to 20 pages. Extract a smaller PDF first.');
  if(!Array.isArray(recognized)||!recognized.length||recognized.length>20)throw new Error('Recognize and review at least one scanned page.');
  const seen=new Set();let chars=0,totalLines=0,selectedLanguage;
  for(const page of recognized){
    if(!Number.isInteger(page.index)||page.index<0||page.index>=info.pages.length||seen.has(page.index))throw new Error('Invalid OCR page selection.');seen.add(page.index);
    const language=requireOcrLanguage(page.language);
    if(page.languageSource!=='user-selected'||page.languageName!==language.name)throw new Error('OCR language provenance is missing. Restart recognition with a bundled language.');
    if(selectedLanguage&&selectedLanguage!==language.code)throw new Error('Each OCR run must use one selected language.');selectedLanguage=language.code;
    if(!Number.isFinite(page.width)||!Number.isFinite(page.height)||page.width<=0||page.height<=0||page.width*page.height>16000000)throw new Error('OCR page exceeds its pixel limit.');
    inversePoint(page.transform,0,0);
    if(!Array.isArray(page.lines)||page.lines.length>5000)throw new Error('Too many OCR lines on a page.');
    for(const line of page.lines){
      const b=line.bbox;
      if(typeof line.text!=='string'||line.text.length>2000||/[\r\n\x00-\x1f]/.test(line.text))throw new Error('Each OCR line must be plain text on one line.');
      chars+=line.text.length;totalLines++;
      if(!b||![b.x0,b.x1,b.y0,b.y1].every(Number.isFinite)||b.x0<0||b.y0<0||b.x1<=b.x0||b.y1<=b.y0||b.x1>page.width||b.y1>page.height)throw new Error('An OCR text position is outside the page.');
    }
  }
  if(!chars)throw new Error('No recognized text remains. Nothing was saved.');
  if(chars>2*1024*1024||totalLines>10000)throw new Error('Reviewed OCR text exceeds this build’s limit.');
  const copy=await organizePdf([{bytes}],info.pages.map(p=>({source:0,index:p.index,turn:0})),progress);
  const doc=await PDFDocument.load(copy.bytes),font=await doc.embedFont(StandardFonts.Helvetica);
  doc.setCreator('PDFix reviewed local OCR');
  for(const record of recognized){
    const page=doc.getPage(record.index);const [a,b,c,d]=record.transform,det=a*d-b*c;
    const scale=Math.hypot(d/det,-b/det),angle=Math.atan2(-b/det,d/det)*180/Math.PI;
    for(const line of record.lines){
      const text=line.text.trim();if(!text)continue;
      try{font.encodeText(text);}catch{throw new Error('The searchable PDF font cannot encode a character in this reviewed line. Export reviewed text to TXT, CSV, or the document editor to preserve Unicode.');}
      const bbox=line.bbox,[x,y]=inversePoint(record.transform,bbox.x0,bbox.y1);
      const height=(bbox.y1-bbox.y0)*scale,width=(bbox.x1-bbox.x0)*scale;
      const size=Math.min(height*.92,width/Math.max(.01,font.widthOfTextAtSize(text,1)));
      page.drawText(text,{x,y,size,font,rotate:degrees(angle),opacity:0});
    }
    progress({stage:'Adding reviewed text',current:record.index+1,total:info.pages.length});
  }
  const output=await doc.save();if(output.length>100*1024*1024)throw new Error('The searchable copy exceeds 100 MB. Extract fewer pages.');
  return {bytes:output,pageCount:doc.getPageCount()};
}
