import {validateRichText} from './pdf-content-rich-layout.js';
import {validatePdfMetadata} from './pdf-metadata.js';
import {inspectImage} from './image-header.js';
export const CONTENT_FONTS={sans:'Helvetica',serif:'Times-Roman',mono:'Courier'};
export function contentPng(data){
  if(typeof data!=='string'||data.length>6*1024*1024||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(data))throw new Error('Use an image whose normalized PNG is under 4 MB.');
  const bytes=Uint8Array.from(atob(data.slice(22)),c=>c.charCodeAt(0));inspectImage(bytes,'png',{bytes:4*1024*1024,side:8192,pixels:16_000_000});return bytes;
}
export function validateContent(draft,pages,{validateImages=true}={}){
  if(!draft||draft.kind!=='pdf-content'||draft.version!==1||!Array.isArray(draft.objects)||draft.objects.length>200||!Array.isArray(draft.assets)||draft.assets.length>20)throw new Error('Use up to 200 additions and 20 images per PDF.');
  validatePdfMetadata(draft.metadata??{});
  const replacements=draft.replacements??[];if(!Array.isArray(replacements)||replacements.length>200)throw new Error('Use up to 200 existing-text changes per PDF.');const changed=new Set();for(const edit of replacements){if(!edit||!/^pdfix-original-\d{1,3}-\d{1,5}-\d{1,8}(?:-n-[a-f0-9]{64})?$/.test(edit.id)||changed.has(edit.id)||typeof edit.text!=='string'||edit.text.length>2000||/[\x00-\x1f\x7f]/.test(edit.text))throw new Error('Use a single line of supported text for each original text run.');changed.add(edit.id);}
  const assets=new Map();let total=0;
  for(const asset of draft.assets){if(!asset||!/^pdfix-image-[a-f0-9-]{36}$/.test(asset.id)||assets.has(asset.id)||typeof asset.name!=='string'||asset.name.length>200)throw new Error('An image asset is invalid.');if(validateImages){const bytes=contentPng(asset.data),size=inspectImage(bytes,'png',{bytes:4*1024*1024,side:8192,pixels:16_000_000});if(size.width!==asset.width||size.height!==asset.height||(total+=bytes.length)>32*1024*1024)throw new Error('Image content exceeds its limits.');}assets.set(asset.id,asset);}
  const imageChanges=draft.imageReplacements??[],imageIds=new Set();if(!Array.isArray(imageChanges)||imageChanges.length>200)throw new Error('Use up to 200 existing-image changes per PDF.');for(const change of imageChanges){if(!change||!/^pdfix-original-image-\d{1,3}-\d{1,5}(?:-n-[a-f0-9]{64})?$/.test(change.id)||imageIds.has(change.id)||!assets.has(change.asset))throw new Error('Choose a supported original image and replacement artwork.');imageIds.add(change.id);}
  const ids=new Set();for(const item of draft.objects){
    if(!item||!/^pdfix-content-[a-f0-9-]{36}$/.test(item.id)||ids.has(item.id)||!['text','image'].includes(item.type)||!Number.isInteger(item.page)||item.page<0||item.page>499||pages&&item.page>=pages.length||!['left','top','width','height'].every(k=>typeof item[k]==='number'&&Number.isFinite(item[k]))||item.left<0||item.top<0||item.width<.1||item.height<.1||item.left+item.width>100.00001||item.top+item.height>100.00001)throw new Error('Keep each addition inside a supported page.');
    ids.add(item.id);if(item.richText!==undefined){if(item.type!=='text')throw Error('Text formatting belongs only to text.');validateRichText(item.richText,item.text);}
    if(item.type==='text'&&(typeof item.text!=='string'||!item.text.trim()&&!item.richText||item.text.length>2000||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(item.text)||!CONTENT_FONTS[item.font]||typeof item.size!=='number'||!Number.isFinite(item.size)||item.size<6||item.size>96||!/^#[a-f0-9]{6}$/i.test(item.color)))throw new Error('Enter text, a supported font, a size from 6 to 96 points, and a color.');
    if(item.type==='image'&&!assets.has(item.asset))throw new Error('An image addition has no matching artwork.');
  }
  return draft;
}
export function wrapContentText(text,width,font,size){
  const lines=[];const measure=s=>font.widthOfTextAtSize(s,size);
  for(const paragraph of text.replace(/\r\n?/g,'\n').split('\n')){
    let line='';for(const word of paragraph.split(/[\t ]+/)){
      if(!word)continue;const next=line?line+' '+word:word;if(measure(next)<=width){line=next;continue;}if(line){lines.push(line);line='';}
      let part='';for(const letter of word){if(measure(letter)>width)throw new Error('This text box is too narrow for its font size.');if(measure(part+letter)>width){lines.push(part);part='';}part+=letter;}line=part;
    }lines.push(line);
  }return lines;
}
export function pngData(bytes){let binary='';for(let index=0;index<bytes.length;index+=32768)binary+=String.fromCharCode(...bytes.subarray(index,index+32768));return 'data:image/png;base64,'+btoa(binary);}
