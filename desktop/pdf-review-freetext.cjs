'use strict';
const {PDFName,PDFDict,PDFArray,PDFRawStream,PDFRef,PDFString,PDFHexString,PDFNumber,StandardFonts}=require('pdf-lib');
const {createHash}=require('node:crypto');
const {freeTextLayout,calloutCommands}=require('./pdf-review-callout.cjs');
const {inspectUniformRichText}=require('./pdf-review-richtext.cjs');
const {paintRichText}=require('./pdf-review-rich-runs.cjs');
const k=PDFName.of,fail=message=>{throw new Error('FreeText appearance: '+message);};
const number=(dict,name,g,fallback)=>{const v=g.get(dict,name);if(v===undefined)return fallback;if(!(v instanceof PDFNumber)||!Number.isFinite(v.asNumber()))fail('unsupported '+name+'.');return v.asNumber();};
const fixed=value=>Number(value.toFixed(5)).toString();

// This adapter deliberately rebuilds a plain rectangular text box from its
// declared standard font/style. Original appearance objects remain untouched.
// It does not claim to reproduce proprietary appearance decorations.
async function buildFreeTextAppearance(doc,dict,row,contents,g){
  for(const name of ['DS','BE'])if(dict.has(k(name)))fail('default rich styles and border effects need another reviewed adapter.');
  if(number(dict,'Rotate',g,0)!==0||number(dict,'CA',g,1)!==1)fail('rotated or translucent text boxes need a separate appearance adapter.');
  const page=doc.getPage(row.page-1),unit=page.node.getInheritableAttribute(k('UserUnit'));
  if(unit&&g.resolve(unit).toString()!=='1'||![0,90,180,270].includes(((page.getRotation().angle%360)+360)%360))fail('unsupported page scale or rotation.');
  const rect=row.rect;if(!Array.isArray(rect)||rect.length!==4||rect.some(v=>!Number.isFinite(v)))fail('a finite source rectangle is required.');
  const width=rect[2]-rect[0],height=rect[3]-rect[1];if(width<12||height<12||width>14400||height>14400)fail('the text box is outside supported dimensions.');
  const layout=freeTextLayout(dict,rect,g),box=layout.box;
  const ap=g.get(dict,'AP'),old=ap instanceof PDFDict?g.get(ap,'N'):null;
  if(!(ap instanceof PDFDict)||!(ap.get(k('N')) instanceof PDFRef)||!(old instanceof PDFRawStream)||g.name(g.get(old.dict,'Subtype'))!=='Form')fail('an indirect normal Form appearance is required.');
  const da=g.get(dict,'DA');if(!(da instanceof PDFString||da instanceof PDFHexString)||da.sizeInBytes()>512)fail('a bounded declared standard font/style is required.');
  const match=/^\s*\/([A-Za-z0-9_.+\-]{1,64})\s+(\d+(?:\.\d+)?)\s+Tf\s+((?:\d+(?:\.\d+)?\s+){1,3})(g|rg)\s*$/.exec(da.decodeText());
  if(!match)fail('only a declared standard font with gray or RGB text is supported.');
  const [,alias,sizeText,colorText,operator]=match,size=Number(sizeText),color=colorText.trim().split(/\s+/).map(Number);
  if(size<1||size>144||color.length!==(operator==='g'?1:3)||color.some(v=>v<0||v>1))fail('unsupported declared font size or text color.');
  const resources=g.get(old.dict,'Resources'),fonts=resources instanceof PDFDict?g.get(resources,'Font'):null,fontDict=fonts instanceof PDFDict?g.get(fonts,alias):null;
  const base=fontDict instanceof PDFDict?g.name(g.get(fontDict,'BaseFont')):'';
  if(!(fontDict instanceof PDFDict)||g.name(g.get(fontDict,'Subtype'))!=='Type1'||!Object.values(StandardFonts).includes(base)||base==='Symbol'||base==='ZapfDingbats'||fontDict.has(k('ToUnicode'))||fontDict.has(k('FontDescriptor'))||fontDict.has(k('Widths'))||fontDict.has(k('FirstChar'))||fontDict.has(k('LastChar'))||fontDict.has(k('Encoding'))&&g.name(g.get(fontDict,'Encoding'))!=='WinAnsiEncoding')fail('the source font needs an unsupported embedded, custom or nonstandard adapter.');
  const alignment=number(dict,'Q',g,0);if(![0,1,2].includes(alignment))fail('unsupported alignment.');
  const rich=dict.has(k('RC'))?inspectUniformRichText(dict,g,row.contents,{runs:true}):null;
  const richEdited=rich?.edit(contents),styled=richEdited?.runs.some(r=>r.base!==base||r.size!==size||r.underline||JSON.stringify(r.color.length===1?[r.color[0],r.color[0],r.color[0]]:r.color)!==JSON.stringify(color.length===1?[color[0],color[0],color[0]]:color));
  let border=0;const bs=g.get(dict,'BS'),ba=g.get(dict,'Border');
  if(bs!==undefined){if(!(bs instanceof PDFDict)||bs.has(k('D'))||bs.has(k('S'))&&g.name(g.get(bs,'S'))!=='S')fail('only a solid rectangular border is supported.');border=number(bs,'W',g,1);}
  else if(ba!==undefined){if(!(ba instanceof PDFArray)||ba.size()!==3||g.resolve(ba.get(0)).toString()!=='0'||g.resolve(ba.get(1)).toString()!=='0'||!(g.resolve(ba.get(2)) instanceof PDFNumber))fail('rounded/dashed borders remain read-only.');border=g.resolve(ba.get(2)).asNumber();}
  if(!Number.isFinite(border)||border<0||border>12)fail('unsupported border width.');
  if(layout.points.length&&(!bs||border<=0||color.some(v=>v!==0)))fail('callouts currently require an explicit positive solid border and black declared text.');
  let fill='';const bg=g.get(dict,'C');if(bg!==undefined){if(!(bg instanceof PDFArray)||![0,1,3,4].includes(bg.size()))fail('unsupported background color.');const values=[];for(let i=0;i<bg.size();i++){const v=g.resolve(bg.get(i));if(!(v instanceof PDFNumber)||v.asNumber()<0||v.asNumber()>1)fail('unsupported background color.');values.push(v.asNumber());}if(values.length)fill=values.map(fixed).join(' ')+' '+({1:'g',3:'rg',4:'k'}[values.length])+`\n${fixed(box.x)} ${fixed(box.y)} ${fixed(box.width)} ${fixed(box.height)} re f\n`;}
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(contents))fail('unsupported control characters.');
  const fontCache=g.reviewStandardFonts??=new Map();if(!styled&&!fontCache.has(base))fontCache.set(base,await doc.embedFont(base));
  const font=styled?null:fontCache.get(base),padding=Math.max(4,border+2),available=box.width-2*padding,leading=size*1.2,lines=[];
  const commands=['q\n',calloutCommands(layout,rect,border),fill];if(border)commands.push(` 0 G ${fixed(border)} w ${fixed(box.x+border/2)} ${fixed(box.y+border/2)} ${fixed(box.width-border)} ${fixed(box.height-border)} re S\n`);
  let appearanceResources,fontRef,fontRefs,appearanceText;
  if(styled){const painted=await paintRichText(doc,richEdited.runs,box,alignment,padding,fontCache);commands.push(painted.commands);({resources:appearanceResources,fontRef,fontRefs,appearanceText}=painted);}
  else{
  try{font.encodeText(contents.replace(/[\r\n\t]/g,''));}catch{fail('this source standard font cannot represent every character. Use a reply for Unicode text.');}
  const push=line=>{if(lines.length>=400||[...line].reduce((n,c)=>n+font.widthOfTextAtSize(c,size),0)>available+.001)fail('text exceeds the supported line width or count.');lines.push(line);};
  for(const paragraph of contents.replace(/\r\n?/g,'\n').replace(/\t/g,'    ').split('\n')){
    let line='',used=0;
    for(const character of paragraph){const w=font.widthOfTextAtSize(character,size);if(w>available)fail('a glyph cannot fit this text box.');if(used+w>available&&line){push(line);line='';used=0;}line+=character;used+=w;}
    push(line);
  }
  if(box.height-padding-size-(lines.length-1)*leading<padding+size*.2)fail('the replacement text does not fit. Enlarge it in the owning editor or use a reply; no clipped copy was created.');
  commands.push(`BT\n0 Tc\n0 Tw\n100 Tz\n0 Ts\n0 Tr\n/${alias} ${fixed(size)} Tf\n${color.map(fixed).join(' ')} ${operator}\n`);
  for(let i=0;i<lines.length;i++){const text=lines[i],lineWidth=[...text].reduce((n,c)=>n+font.widthOfTextAtSize(c,size),0),x=box.x+(alignment===1?(box.width-lineWidth)/2:alignment===2?box.width-padding-lineWidth:padding),y=box.y+box.height-padding-size-i*leading;commands.push(`1 0 0 1 ${fixed(x)} ${fixed(y)} Tm ${font.encodeText(text).toString()} Tj\n`);}commands.push('ET\n');appearanceResources={[alias]:font.ref};fontRef=font.ref.toString();appearanceText=lines.join('\n');
  }
  commands.push('Q\n');
  if(rich&&!Object.hasOwn(appearanceResources,alias))appearanceResources[alias]=fonts.get(k(alias));
  const c=doc.context,bytes=Buffer.from(commands.join(''),'ascii'),stream=c.stream(bytes,{Type:k('XObject'),Subtype:k('Form'),FormType:1,BBox:[0,0,width,height],Matrix:[1,0,0,1,0,0],Resources:{Font:appearanceResources}});stream.updateDict();
  const appearanceRef=c.register(stream),copy=ap.clone(c);copy.set(k('N'),appearanceRef);dict.set(k('AP'),copy);
  await doc.flush();
  if(rich){dict.set(k('RC'),PDFHexString.fromText(rich.replace(contents)));if(inspectUniformRichText(dict,g,contents,{runs:true}).styleSeal!==rich.styleSeal)fail('the retained rich formatting changed.');}
  return {appearanceRef:appearanceRef.toString(),appearanceSha256:createHash('sha256').update(bytes).digest('hex'),fontRef,...(fontRefs?{fontRefs}:{}),appearanceText};
}
module.exports={buildFreeTextAppearance};
