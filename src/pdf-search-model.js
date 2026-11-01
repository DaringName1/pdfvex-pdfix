const MAX_CHARACTERS=2*1024*1024,MAX_RUNS=50_000;
const collapse=text=>text.replace(/\s+/gu,' ').trim();
export const normalizePdfSearch=text=>collapse(text).toLowerCase();

// PDF.js supplies actual spacing as text items, and line endings as hasEOL.
// A font/style boundary may split a word without introducing a space.
export function pdfSearchText(content){
  if(!Array.isArray(content?.items))throw new Error('Selectable PDF text is unavailable.');
  const parts=[];let characters=0,runs=0;
  for(const item of content.items){
    if(typeof item?.str!=='string')continue;
    if(++runs>MAX_RUNS||(characters+=item.str.length+(item.hasEOL?1:0))>MAX_CHARACTERS)throw new Error('This page has too much selectable text. Search a smaller extracted PDF.');
    parts.push(item.str);if(item.hasEOL)parts.push('\n');
  }
  return parts.join('').trim();
}

export function pdfSearchModel(content){
  pdfSearchText(content);
  const parts=[],segments=[];let length=0,run=0,pendingSpace=false;
  for(const item of content.items){
    if(typeof item?.str!=='string')continue;
    const index=run++,text=collapse(item.str);
    if(!text){if(length&&(item.str.length||item.hasEOL))pendingSpace=true;continue;}
    if(length&&(pendingSpace||/^\s/u.test(item.str))){parts.push(' ');length++;}
    // Lowercase can expand a character (for example U+0130). Its length is
    // recorded here; case folding is applied to the complete page below so
    // contextual characters also work across adjacent source runs.
    const end=length+text.toLowerCase().length;
    segments.push({run:index,start:length,end,raw:item.str});
    parts.push(text);length=end;pendingSpace=!!item.hasEOL||/\s$/u.test(item.str);
  }
  return {text:parts.join('').toLowerCase(),segments};
}
