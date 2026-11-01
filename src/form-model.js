import {validateFormCalculations} from './form-calculation-model.js';
import {validateFormTabOrders} from './form-tab-order-model.js';
const finite=n=>Number.isFinite(n)&&Math.abs(n)<=10_000_000;
const text=(s,max=2000)=>typeof s==='string'&&s.length<=max&&!s.includes('\0');
export function pngBytes(url){
  if(typeof url!=='string'||url.length>1_400_000||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(url))throw new Error('Use a PNG signature under 1 MB.');
  const bytes=Uint8Array.from(atob(url.slice(22)),c=>c.charCodeAt(0));
  if(bytes.length<33||bytes.length>1024*1024||![137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n)||String.fromCharCode(...bytes.slice(12,16))!=='IHDR')throw new Error('The signature image is invalid.');
  const view=new DataView(bytes.buffer),width=view.getUint32(16),height=view.getUint32(20);
  if(!width||!height||width>4096||height>4096||width*height>4_000_000)throw new Error('Keep signature images under four million pixels.');return bytes;
}
export function validateSignature(asset){
  if(!asset||!['text','ink','image'].includes(asset.type))throw new Error('Choose typed, drawn or image signature content.');
  if(asset.type==='text'){if(!text(asset.text,500)||!asset.text.trim())throw new Error('Enter signature or overlay text (up to 500 characters).');return {type:'text',text:asset.text};}
  if(asset.type==='image'){pngBytes(asset.data);return {type:'image',data:asset.data};}
  if(!Array.isArray(asset.strokes)||!asset.strokes.length||asset.strokes.length>50)throw new Error('Draw a signature with up to 50 strokes.');let points=0;
  for(const path of asset.strokes){if(!Array.isArray(path)||path.length<4||path.length%2||path.length>2000||!path.every(n=>Number.isFinite(n)&&n>=0&&n<=1))throw new Error('A signature stroke is invalid.');points+=path.length/2;}
  if(points>5000)throw new Error('Keep a drawn signature under 5,000 points.');return {type:'ink',strokes:asset.strokes.map(p=>[...p])};
}
export function validateFormDraft(draft,pages=null){
  if(!draft||draft.kind!=='form'||draft.version!==1||!Array.isArray(draft.values)||draft.values.length>500||!Array.isArray(draft.overlays)||draft.overlays.length>50)throw new Error('Form recovery or placements exceed their limits.');
  const names=new Set(),ids=new Set();const values=draft.values.map(item=>{
    if(!item||!text(item.name,512)||!item.name||names.has(item.name)||!(text(item.value)||typeof item.value==='boolean'||Array.isArray(item.value)&&item.value.length<=500&&item.value.every(s=>text(s,512))))throw new Error('A form value is invalid.');names.add(item.name);return {name:item.name,value:structuredClone(item.value)};
  });
  const overlays=draft.overlays.map(item=>{
    if(!item||!/^pdfix-form-[a-f0-9-]{36}$/.test(item.id)||ids.has(item.id)||!['signature','initials','date','text'].includes(item.kind)||!Number.isInteger(item.page)||item.page<0||item.page>499||pages&&item.page>=pages.length||![0,90,180,270].includes(item.rotation)||item.confirmed!==true||!Array.isArray(item.rect)||item.rect.length!==4||!item.rect.every(finite)||item.rect[2]-item.rect[0]<1||item.rect[3]-item.rect[1]<1)throw new Error('Confirm a valid placement on a supported page.');
    ids.add(item.id);if(pages){const box=pages[item.page].box;if(item.rect[0]<box[0]||item.rect[1]<box[1]||item.rect[2]>box[2]||item.rect[3]>box[3])throw new Error('A placement is outside the visible page.');}
    return {id:item.id,kind:item.kind,page:item.page,rotation:item.rotation,confirmed:true,rect:[...item.rect],asset:validateSignature(item.asset)};
  });
  const calculations=validateFormCalculations(draft.calculations??[]);
  const tabOrders=validateFormTabOrders(draft.tabOrders??[]);
  // Text still in the on-page typing box when PDFix closed (S5); placed only when the person chooses to.
  let typing=null;if(draft.typing!=null){const x=draft.typing;if(!x||!['signature','initials','date','text'].includes(x.kind)||!Number.isInteger(x.page)||x.page<0||x.page>499||pages&&x.page>=pages.length||!Array.isArray(x.rect)||x.rect.length!==4||!x.rect.every(finite)||typeof x.text!=='string'||x.text.length>500)throw new Error('Invalid unplaced typing.');typing={kind:x.kind,page:x.page,rect:[...x.rect],text:x.text};}
  let composer=null;if(draft.composer){if(!['signature','initials','date','text'].includes(draft.composer.kind))throw new Error('Invalid staged signature kind.');composer={kind:draft.composer.kind,asset:validateSignature(draft.composer.asset)};}
  if(new TextEncoder().encode(JSON.stringify({values,overlays,composer,calculations,tabOrders})).length>2*1024*1024)throw new Error('Form edits exceed the 2 MB recovery limit. Reduce signature images or save a copy.');return {kind:'form',version:1,values,overlays,composer,typing,calculations,tabOrders};
}
export const emptyFormValue=value=>Array.isArray(value)?!value.length:typeof value==='boolean'?!value:!String(value??'').trim();
