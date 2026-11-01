import {PDFName,PDFDict,PDFArray,PDFNumber,PDFRawStream,PDFRef,decodePDFRawStream} from 'pdf-lib';
const n=PDFName.of;
export const imageDigest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),byte=>byte.toString(16).padStart(2,'0')).join('');
export const imagePathKey=(page,path)=>JSON.stringify([page,path]);
export function assertImageCopyBudget(doc,roots){
  const seen=new WeakSet();let nodes=0,bytes=0,refs=0;const visit=(value,depth=0)=>{if(++nodes>20000||depth>32)throw new Error('Original image preview graph exceeds limits');if(value instanceof PDFRef){if(++refs>2000)throw new Error('Original image preview reference limit');value=doc.context.lookup(value);}
    if(value instanceof PDFRawStream||value instanceof PDFDict||value instanceof PDFArray){if(seen.has(value))return;seen.add(value);if(value instanceof PDFRawStream){if((bytes+=value.contents.length)>32*1024*1024)throw new Error('Original image artwork exceeds the preview budget');visit(value.dict,depth+1);}else if(value instanceof PDFDict){for(const [,child]of value.entries())visit(child,depth+1);}else for(const child of value.asArray())visit(child,depth+1);}
  };for(const root of roots)visit(root);
}
export function supportedForm(doc,stream){
  if(!(stream instanceof PDFRawStream)||stream.dict.lookupMaybe(n('Subtype'),PDFName)?.decodeText()!=='Form'||['F','FFilter','FDecodeParms','Ref'].some(key=>stream.dict.get(n(key))))throw new Error('Unsupported or external Form XObject');
  const type=stream.dict.lookupMaybe(n('FormType'),PDFNumber);if(type&&type.asNumber()!==1)throw new Error('Unsupported Form type');
  const box=stream.dict.lookup(n('BBox'),PDFArray);if(box.size()!==4)throw new Error('Unsupported Form box');const bounds=box.asArray().map(value=>doc.context.lookup(value,PDFNumber).asNumber());if(bounds.some(value=>!Number.isFinite(value)||Math.abs(value)>1e7)||bounds[2]<=bounds[0]||bounds[3]<=bounds[1]||bounds[2]-bounds[0]>14400||bounds[3]-bounds[1]>14400)throw new Error('Unsupported Form geometry');
  const matrix=stream.dict.lookupMaybe(n('Matrix'),PDFArray);if(matrix){if(matrix.size()!==6)throw new Error('Unsupported Form matrix');const values=matrix.asArray().map(value=>doc.context.lookup(value,PDFNumber).asNumber());if(values.some(value=>!Number.isFinite(value)||Math.abs(value)>1e7))throw new Error('Unsupported Form transform');const determinant=values[0]*values[3]-values[1]*values[2];if(!Number.isFinite(determinant)||Math.abs(determinant)<1e-12||Math.max(...values.slice(0,4).map(Math.abs))>1e6)throw new Error('Degenerate Form transform');}
  const resources=stream.dict.lookup(n('Resources'),PDFDict),objects=resources.lookupMaybe(n('XObject'),PDFDict);if(objects&&(objects.entries().length>20000||objects.entries().some(([,value])=>!(value instanceof PDFRef))))throw new Error('Direct or oversized Form XObject resources');return {resources,objects,geometry:{box:bounds,matrix:matrix?matrix.asArray().map(value=>doc.context.lookup(value,PDFNumber).asNumber()):[1,0,0,1,0,0],formType:type?.asNumber()??1}};
}
export function resolveImagePath(doc,page,path){
  if(!Array.isArray(path)||!path.length||path.length>9||path.some(name=>typeof name!=='string'||!name||name.length>200||/[\x00-\x1f\x7f]|#[a-f0-9]{2}/i.test(name)))throw new Error('Unsupported or ambiguous resource path');let resources=doc.getPage(page).node.Resources(),object,ref;
  for(let index=0;index<path.length;index++){const objects=resources?.lookupMaybe(n('XObject'),PDFDict);ref=objects?.get(n(path[index]));if(!ref)throw new Error('The image resource path is unavailable');object=doc.context.lookup(ref);if(index<path.length-1)resources=supportedForm(doc,object).resources;}
  return {ref,stream:object};
}
function dictionaryText(dict,omitted=[]){
  const active=new WeakSet();let nodes=0,size=0;const visit=(value,depth=0)=>{if(++nodes>10000||depth>32)throw new Error('Image resource proof limits');if(value instanceof PDFRawStream)throw new Error('Direct stream resource proofs are unsupported');if(value instanceof PDFDict||value instanceof PDFArray){if(active.has(value))throw new Error('Cyclic direct image resources');active.add(value);const result=value instanceof PDFArray?['array',value.asArray().map(item=>visit(item,depth+1))]:['dict',value.entries().map(([key,item])=>[key.toString(),visit(item,depth+1)]).sort(([a],[b])=>a<b?-1:a>b?1:0)];active.delete(value);return result;}const text=value?.toString();if(typeof text!=='string'||(size+=text.length)>2*1024*1024)throw new Error('Image resource proof size limit');return ['value',text];};
  return JSON.stringify(dict.entries().filter(([key])=>!omitted.includes(key.decodeText())).map(([key,value])=>[key.toString(),visit(value)]).sort(([a],[b])=>a<b?-1:a>b?1:0));
}
async function streamProof(stream,omitResources=false){if(!(stream instanceof PDFRawStream))throw new Error('An original image or Form stream is unavailable');return {dictionary:dictionaryText(stream.dict,omitResources?['Length','Resources']:['Length']),length:stream.contents.length,sha256:await imageDigest(stream.contents)};}
const mapping=objects=>objects.entries().map(([key,value])=>[key.decodeText(),value.toString()]).sort(([a],[b])=>a<b?-1:a>b?1:0);
export async function createFormEditSession(doc){
  const session={doc,pages:new Map(),forms:new Map(),originals:new Map(),expected:[],changedRoots:new Set(),sourcePages:[],clonedBytes:0,textStreams:[]};let rootNodes=0;
  for(let page=0;page<doc.getPageCount();page++){const objects=doc.getPage(page).node.Resources()?.lookupMaybe(n('XObject'),PDFDict);if(objects){if((rootNodes+=objects.entries().length)>20000||objects.entries().some(([key])=>key.decodeText().length>200||/#[a-f0-9]{2}/i.test(key.decodeText())))throw new Error('Page resource proof limits');const refs=objects.entries().filter(([,value])=>value instanceof PDFRef).map(([key,value])=>[key.decodeText(),value.toString()]);if(refs.length)session.sourcePages.push({page,refs});}}
  return session;
}
async function retainOriginal(session,ref){
  if(!(ref instanceof PDFRef))throw new Error('Original Form/image objects need indirect identities');const key=ref.toString();if(!session.originals.has(key))session.originals.set(key,{ref:key,proof:await streamProof(session.doc.context.lookup(ref,PDFRawStream))});
}
function editPageObjects(session,pageIndex){
  if(!session.pages.has(pageIndex)){const doc=session.doc,page=doc.getPage(pageIndex),resources=page.node.Resources().clone(doc.context),objects=resources.lookup(n('XObject'),PDFDict).clone(doc.context);resources.set(n('XObject'),objects);page.node.set(n('Resources'),resources);session.pages.set(pageIndex,{resources,objects});}return session.pages.get(pageIndex).objects;
}
export async function cloneFormPath(session,page,path){
  if(!Array.isArray(path)||!path.length||path.length>8||path.some(name=>typeof name!=='string'||!name||name.length>200||/[\x00-\x1f\x7f]|#[a-f0-9]{2}/i.test(name)))throw new Error('Original Form edit path limit');const doc=session.doc;let objects=editPageObjects(session,page),form;
  session.changedRoots.add(imagePathKey(page,[path[0]]));
  for(let depth=0;depth<path.length;depth++){const prefix=path.slice(0,depth+1),key=imagePathKey(page,prefix);if(!session.forms.has(key)){
      const ref=objects.get(n(path[depth]));if(!(ref instanceof PDFRef))throw new Error('Original Form editing needs indirect objects');const source=doc.context.lookup(ref,PDFRawStream),supported=supportedForm(doc,source);await retainOriginal(session,ref);
      if((session.clonedBytes+=source.contents.length)>64*1024*1024||source.contents.length>16*1024*1024||session.forms.size>=1000)throw new Error('Cloned Form budget exceeded');const resources=supported.resources.clone(doc.context),children=supported.objects?supported.objects.clone(doc.context):doc.context.obj({}),dictionary=source.dict.clone(doc.context);if(supported.objects)resources.set(n('XObject'),children);dictionary.set(n('Resources'),resources);const copy=PDFRawStream.of(dictionary,new Uint8Array(source.contents)),copyRef=doc.context.register(copy);objects.set(n(path[depth]),copyRef);session.forms.set(key,{page,path:prefix,ref:copyRef,stream:copy,objects:children,resources,geometryProof:supported.geometry,dictionaryProof:dictionaryText(source.dict,['Length','DL','Filter','DecodeParms','Resources']),resourceProof:dictionaryText(supported.resources,['XObject'])});
    }form=session.forms.get(key);objects=form.objects;
  }return form;
}
export async function replaceFormProgram(session,page,path,bytes){
  const form=await cloneFormPath(session,page,path),doc=session.doc,compressed=doc.context.flateStream(bytes),dictionary=form.stream.dict.clone(doc.context);dictionary.delete(n('Length'));dictionary.delete(n('DL'));dictionary.delete(n('DecodeParms'));dictionary.set(n('Filter'),n('FlateDecode'));const stream=PDFRawStream.of(dictionary,compressed.contents);doc.context.assign(form.ref,stream);form.stream=stream;session.textStreams.push({page,path:[...path],length:bytes.length,sha256:await imageDigest(bytes)});
}
export async function sealFormEditSession(session){
  const forms=[];for(const form of session.forms.values()){const objects=form.resources.lookupMaybe(n('XObject'),PDFDict);forms.push({page:form.page,path:[...form.path],ref:form.ref.toString(),mapping:objects?mapping(objects):null,sourceProof:await streamProof(form.stream,true),geometryProof:form.geometryProof,dictionaryProof:form.dictionaryProof,resourceProof:form.resourceProof});}
  return {expected:session.expected,originals:[...session.originals.values()],sourcePages:session.sourcePages,changedRoots:[...session.changedRoots],forms,textStreams:session.textStreams};
}
export async function replaceImagesOnPaths(doc,changes,inventory,embedded,sharedSession=null){
  const found=new Map(inventory.map(image=>[image.id,image])),session=sharedSession??await createFormEditSession(doc),expected=[];
  for(const change of changes){const original=found.get(change.id),replacement=embedded.get(change.asset);if(!original||!replacement)throw new Error('This original image or replacement is unavailable');const path=original.path??[original.name],resolved=resolveImagePath(doc,original.page,path);if(resolved.ref.toString()!==original.ref.toString())throw new Error('The original image resource path changed');await retainOriginal(session,original.ref);
    let objects;if(path.length>1){const form=await cloneFormPath(session,original.page,path.slice(0,-1));if(!form.resources.lookupMaybe(n('XObject'),PDFDict))throw new Error('The source Form image resource dictionary is unavailable');objects=form.objects;}else{objects=editPageObjects(session,original.page);session.changedRoots.add(imagePathKey(original.page,[path[0]]));}
    objects.set(n(path.at(-1)),replacement.ref);const item={page:original.page,resourcePath:[...path],image:{ref:replacement.ref.toString(),width:replacement.width,height:replacement.height}};expected.push(item);session.expected.push(item);
  }
  return sharedSession?{expected,session}:sealFormEditSession(session);
}
export async function verifyImagesOnPaths(doc,plan){
  const refs=new Map(doc.context.enumerateIndirectObjects().map(([ref,object])=>[ref.toString(),object]));
  for(const original of plan.originals)if(JSON.stringify(await streamProof(refs.get(original.ref)))!==JSON.stringify(original.proof))throw new Error('An original image or shared Form object changed while saving.');
  const roots=new Set(plan.changedRoots);for(const source of plan.sourcePages){const objects=doc.getPage(source.page).node.Resources()?.lookupMaybe(n('XObject'),PDFDict);for(const [name,ref]of source.refs)if(!roots.has(imagePathKey(source.page,[name]))&&objects?.get(n(name))?.toString()!==ref)throw new Error('An unrelated page image/Form resource changed while saving.');}
  for(const form of plan.forms){const resolved=resolveImagePath(doc,form.page,form.path);if(resolved.ref.toString()!==form.ref||JSON.stringify(await streamProof(resolved.stream,true))!==JSON.stringify(form.sourceProof))throw new Error('A cloned Form changed its declared content or geometry.');const supported=supportedForm(doc,resolved.stream),resources=supported.resources,objects=resources.lookupMaybe(n('XObject'),PDFDict);if(JSON.stringify(supported.geometry)!==JSON.stringify(form.geometryProof)||dictionaryText(resolved.stream.dict,['Length','DL','Filter','DecodeParms','Resources'])!==form.dictionaryProof)throw new Error('The original Form geometry or unrelated dictionary fields changed.');if(dictionaryText(resources,['XObject'])!==form.resourceProof||JSON.stringify(objects?mapping(objects):null)!==JSON.stringify(form.mapping))throw new Error('A cloned Form changed unrelated resources.');}
  for(const text of plan.textStreams??[]){const resolved=resolveImagePath(doc,text.page,text.path),bytes=decodePDFRawStream(resolved.stream).getBytes(8*1024*1024+1);if(bytes.length!==text.length||bytes.length>8*1024*1024||await imageDigest(bytes)!==text.sha256)throw new Error('The reopened nested text Form differs from the declared edited program.');}
  for(const item of plan.expected){const resolved=resolveImagePath(doc,item.page,item.resourcePath),stream=resolved.stream;if(resolved.ref.toString()!==item.image.ref||!(stream instanceof PDFRawStream)||stream.dict.lookupMaybe(n('Subtype'),PDFName)?.decodeText()!=='Image'||stream.dict.lookup(n('Width'),PDFNumber).asNumber()!==item.image.width||stream.dict.lookup(n('Height'),PDFNumber).asNumber()!==item.image.height)throw new Error('The nested image replacement could not be reopened at its actual resource path.');}
}
