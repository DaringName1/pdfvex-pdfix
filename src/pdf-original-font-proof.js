import {PDFArray,PDFDict,PDFRawStream,PDFRef} from 'pdf-lib';
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),byte=>byte.toString(16).padStart(2,'0')).join('');
// Fingerprint the font dictionary and every referenced object without decoding font programs.
export async function originalFontProof(doc,font){
  const references=new Map(),pending=[],active=new WeakSet();let nodes=0,streamBytes=0;
  const visit=async(value,depth=0)=>{
    if(++nodes>20000||depth>32)throw new Error('The source font exceeds preservation limits.');
    if(value instanceof PDFRef){const key=value.toString();if(!references.has(key)){references.set(key,null);pending.push([key,value]);}return ['ref',key];}
    if(value instanceof PDFRawStream){streamBytes+=value.contents.length;if(streamBytes>100*1024*1024)throw new Error('Source font programs exceed preservation limits.');return ['stream',await dictionary(value.dict,depth+1,true),value.contents.length,await digest(value.contents)];}
    if(value instanceof PDFDict)return dictionary(value,depth+1,false);
    if(value instanceof PDFArray){if(active.has(value))throw new Error('Cyclic direct font object');active.add(value);const items=[];for(const item of value.asArray())items.push(await visit(item,depth+1));active.delete(value);return ['array',items];}
    if(!value||typeof value.toString!=='function')throw new Error('Missing source font object');return ['literal',value.toString()];
  };
  const dictionary=async(dict,depth,stream)=>{if(active.has(dict))throw new Error('Cyclic direct font dictionary');active.add(dict);const entries=[];for(const [key,value]of dict.entries().sort(([a],[b])=>a.toString().localeCompare(b.toString()))){if(stream&&key.decodeText()==='Length')continue;entries.push([key.toString(),await visit(value,depth+1)]);}active.delete(dict);return ['dictionary',entries];};
  const root=await visit(font);for(let index=0;index<pending.length;index++){if(pending.length>2000)throw new Error('Source font reference limit');const [key,ref]=pending[index];references.set(key,await visit(doc.context.lookup(ref)));}
  return digest(new TextEncoder().encode(JSON.stringify({root,indirect:[...references].sort(([a],[b])=>a.localeCompare(b))})));
}
