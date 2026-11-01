// Content order follows PDF.js text items, including explicit whitespace and
// empty items with hasEOL. Font/style changes do not create word boundaries.
export function pdfReadableSequence(content){
  if(!Array.isArray(content?.items))throw new Error('Readable PDF text is unavailable. Use page artwork.');
  const items=[],output=[],sourceRuns=[],sourceFragments=[];let characters=0,current='',currentRuns=[],fragments=[];
  const flush=()=>{const text=current.trim(),leading=current.length-current.trimStart().length;if(text){output.push(text);sourceRuns.push(currentRuns);sourceFragments.push(fragments.map(fragment=>({run:fragment.run,start:Math.max(0,fragment.start-leading),text:current.slice(Math.max(leading,fragment.start),Math.min(leading+text.length,fragment.end))})).filter(fragment=>fragment.text.length));}current='';currentRuns=[];fragments=[];};
  for(const item of content.items){
    if(typeof item?.str!=='string')continue;
    if(items.length>=20000||(characters+=item.str.length+(item.hasEOL?1:0))>200000)throw new Error('This page exceeds the bounded readable-text budget. Use page artwork and a smaller rectangle selection.');
    currentRuns.push(items.length);fragments.push({run:items.length,start:current.length,end:current.length+item.str.length});items.push(item);current+=item.str;
    if(item.hasEOL)flush();
  }
  flush();
  return {items,output,sourceRuns,sourceFragments};
}
