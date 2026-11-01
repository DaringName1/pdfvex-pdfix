const MAX_PAGES=500,MAX_ITEMS=50000,MAX_PROPOSALS=500,MAX_TEXT=5_000_000;
const normalize=value=>value.normalize('NFKC').toLowerCase().replace(/[\s\u00a0]+/g,' ').replace(/[\u2010-\u2015]/g,'-').trim();
const check=signal=>{if(signal?.aborted)throw new DOMException('Heading analysis canceled.','AbortError');};

/** Analyze selectable PDF text only. The result is a review list, never a PDF edit. */
export async function analyzePdfBookmarkProposals(doc,start,end,{signal,onProgress=()=>{}}={}){
  if(!doc||!Number.isInteger(start)||!Number.isInteger(end)||start<1||end<start||end>doc.numPages)throw new Error('Choose a valid physical page range.');
  if(end-start+1>MAX_PAGES)throw new Error(`Analyze at most ${MAX_PAGES} pages at a time.`);
  const pages=[], frequencies=new Map();let itemsRead=0,textRead=0;
  for(let pageNumber=start;pageNumber<=end;pageNumber++){
    check(signal);const page=await doc.getPage(pageNumber);check(signal);const content=await page.getTextContent({includeMarkedContent:false,disableNormalization:false});check(signal);
    const entries=[];for(const item of content.items||[]){if(!item.str?.trim()||!item.transform)continue;if(++itemsRead>MAX_ITEMS)throw new Error(`Text item limit reached (${MAX_ITEMS}). Narrow the page range.`);textRead+=item.str.length;if(textRead>MAX_TEXT)throw new Error('Text limit reached (5 MB). Narrow the page range.');
      const [a,b,c,d,x,y]=item.transform,size=Math.max(Number(item.height)||0,Math.hypot(c,d),Math.hypot(a,b));if(!Number.isFinite(size)||size<1||size>200)continue;
      const viewport=page.view||[0,0,612,792],pageHeight=Math.max(1,viewport[3]-viewport[1]),top=Math.max(0,Math.min(1,(viewport[3]-y)/pageHeight));
      entries.push({x,y,top,str:item.str,size,width:Math.max(0,Number(item.width)||0),font:item.fontName||''});
    }
    entries.sort((a,b)=>b.y-a.y||a.x-b.x);const lines=[];for(const entry of entries){let line=lines.at(-1);if(!line||Math.abs(line.y-entry.y)>Math.max(2,entry.size*.22)){line={y:entry.y,top:entry.top,parts:[]};lines.push(line);}line.parts.push(entry);}
    const output=[];for(const line of lines){line.parts.sort((a,b)=>a.x-b.x);let joined='',previous=null;for(const part of line.parts){if(previous&&part.x-(previous.x+previous.width)>Math.min(previous.size,part.size)*.12&&!/\s$/.test(joined)&&!/^\s/.test(part.str))joined+=' ';joined+=part.str;previous=part;}const text=joined.replace(/\s+/g,' ').trim();if(!text)continue;const sizes=line.parts.map(part=>part.size).sort((a,b)=>a-b);const size=sizes[Math.floor(sizes.length/2)];const fonts=line.parts.map(part=>part.font).join(' ');const record={text,size,top:line.top,font:fonts,page:pageNumber};output.push(record);if(record.top<.14||record.top>.86){const key=normalize(text);if(key.length>=4)frequencies.set(key,(frequencies.get(key)||0)+1);}}
    pages.push({pageNumber,lines:output});onProgress({current:pageNumber-start+1,total:end-start+1,stage:'Reading selectable text'});await new Promise(resolve=>setTimeout(resolve,0));
  }
  check(signal);
  const all=pages.flatMap(page=>page.lines),sizes=all.map(line=>line.size).sort((a,b)=>a-b),median=sizes.length?sizes[Math.floor(sizes.length/2)]:0;
  const repeatThreshold=Math.max(3,Math.ceil(pages.length*.3)),candidates=[];
  for(const page of pages)for(const line of page.lines){check(signal);const text=line.text,key=normalize(text);if(text.length<3||text.length>180||/^\d{1,4}$/.test(text)||frequencies.get(key)>=repeatThreshold&&(line.top<.14||line.top>.86))continue;
    const numbered=/^(?:(?:chapter|part|section|appendix)\s+)?(?:\d+(?:\.\d+){0,5}|[IVXLC]+)[.)\s:—-]+\S/i.test(text);
    const named=/^(chapter|part|section|appendix|introduction|conclusion|abstract|references|bibliography|contents|acknowledg(?:e)?ments|executive summary)\b/i.test(text);
    const relative=median?line.size/median:1;const bold=/bold|black|heavy|demi|semibold/i.test(line.font);
    const likelyBody=/[.!?]$/.test(text)&&text.length>85;
    let confidence=0.16+(numbered?.3:0)+(named?.25:0)+(relative>=1.7?.32:relative>=1.35?.23:relative>=1.15?.1:0)+(bold?.09:0)+(text.length<=70?.08:0)+(line.top>.04&&line.top<.94?.04:0)-(likelyBody?.22:0);
    confidence=Math.max(0,Math.min(.99,confidence));if(confidence<.39)continue;
    candidates.push({title:text,page:line.page,depth:relative>=1.65||numbered&&/^\s*(?:chapter|part|appendix)\b/i.test(text)?0:relative>=1.25?1:2,confidence,signals:[numbered&&'numbered heading',named&&'heading label',relative>=1.35&&'larger text',bold&&'bold font'].filter(Boolean)});
  }
  candidates.sort((a,b)=>a.page-b.page);const distinct=[];for(const item of candidates){const previous=distinct.at(-1);if(previous&&previous.page===item.page&&normalize(previous.title)===normalize(item.title))continue;distinct.push(item);}
  return {proposals:distinct.slice(0,MAX_PROPOSALS),pages:end-start+1,itemsRead,medianFontSize:median,scannedLike:all.length<Math.max(4,pages.length*.25),truncated:distinct.length>MAX_PROPOSALS};
}
