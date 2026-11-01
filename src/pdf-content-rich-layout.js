import richModel from '../desktop/content-rich-model.cjs';
export const {validateRichText,richFontName}=richModel;

// One measured layout is used by the saved appearance and the on-page preview.
export function layoutRichText(paragraphs,base,width,height,fonts){
 validateRichText(paragraphs);let top=0,ordinal=0;const lines=[];
 for(const p of paragraphs){
  const list=p.list&&p.list!=='none',prefix=list?(p.list==='number'?String(++ordinal)+'. ':'• '):'';if(!list)ordinal=0;
  const left=(p.indent||0)*36+(list?18:0)+(p.firstLine==='hanging'?36:0),right=(p.rightIndent||0)*36;
  top+=p.spaceBefore||0;let first=true,line=[],used=0,maxSize=base.size;
  const offset=()=>left+(first?(p.firstLine==='first'?36:p.firstLine==='hanging'?-36:0):0);
  const available=()=>width-right-offset();
  function finish(last=false){
   const lineHeight=maxSize*(p.lineSpacing||1.2);if(available()<=0||top+lineHeight>height+.001)throw Error('This formatted text does not fit. Enlarge the box or reduce its spacing or size.');
   const align=p.align||'left',extra=Math.max(0,available()-used),spaces=line.filter(t=>/^ +$/.test(t.text)).length;
   let x=offset()+(align==='center'?extra/2:align==='right'?extra:0);const tokens=[];
   for(const token of line){tokens.push({...token,x,y:top+maxSize});x+=token.width+(align==='justify'&&!last&&spaces&&/^ +$/.test(token.text)?extra/spaces:0);}
   lines.push({tokens,top,height:lineHeight});top+=lineHeight;line=[];used=0;maxSize=base.size;first=false;
  }
  const runs=prefix?[{...p.runs[0],text:prefix},...p.runs]:p.runs;
  for(const r of runs){const font=fonts.get(richFontName(r,base)),originalSize=r.size||base.size,size=originalSize*(r.script ? .65 : 1);if(!font)throw Error('A formatted font is unavailable.');
   for(const word of r.text.match(/ +|[^ ]+/g)||[]){let parts=[word];if(font.widthOfTextAtSize(word,size)>available()){parts=Array.from(word);}
    for(const text of parts){const w=font.widthOfTextAtSize(text,size);if(w>available()+.001)throw Error('This text box is too narrow for the chosen font.');if(line.length&&used+w>available()+.001)finish();if(!line.length&&/^ +$/.test(text))continue;line.push({text,width:w,size,originalSize,fontName:richFontName(r,base),color:r.color||base.color,highlight:r.highlight,underline:r.underline,strike:r.strike,script:r.script});used+=w;maxSize=Math.max(maxSize,originalSize);}
   }
  }
  finish(true);top+=p.spaceAfter||0;if(top>height+.001)throw Error('This formatted text does not fit. Enlarge the box or reduce paragraph spacing.');
 }
 return {lines,height:top};
}
