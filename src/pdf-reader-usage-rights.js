import {PDFName,PDFDict,PDFArray,PDFRef,PDFStream} from 'pdf-lib';

const name=PDFName.of;
const changed=new WeakSet();
export const removedReaderUsageRights=doc=>changed.has(doc);

// Reader usage rights sign the original bytes. Remove only their exclusive
// signature object so it cannot be mistaken for a valid signature on the copy.
export function removeReaderUsageRights(doc){
  const raw=doc.catalog.get(name('Perms'));
  if(!raw)return;
  const permissions=doc.context.lookup(raw);
  const refuse=()=>{throw Error('Certified or permission-controlled PDFs cannot be changed here.');};
  if(!(permissions instanceof PDFDict)||permissions.keys().length!==1||!permissions.has(name('UR3')))refuse();
  const signatureRef=permissions.get(name('UR3')),signature=doc.context.lookup(signatureRef);
  if(!(signature instanceof PDFDict)||String(signature.get(name('Type')))!=='/Sig'||signature.has(name('DocMDP'))||signature.has(name('FT')))refuse();
  const references=doc.context.lookup(signature.get(name('Reference')));
  if(!(references instanceof PDFArray)||!references.size())refuse();
  for(const entry of references.asArray()){
    const reference=doc.context.lookup(entry);
    if(!(reference instanceof PDFDict)||String(reference.get(name('TransformMethod')))!=='/UR3')refuse();
  }
  const seen=new WeakSet();let count=0;
  const visit=(value,depth=0)=>{
    if(++count>300000||depth>80)refuse();
    if(value instanceof PDFRef){if([signatureRef,raw].some(ref=>ref instanceof PDFRef&&String(value)===String(ref)))refuse();return;}
    if(!value||typeof value!=='object'||seen.has(value))return;
    if(value===signature)refuse();
    seen.add(value);
    const dict=value instanceof PDFStream?value.dict:value;
    if(dict instanceof PDFDict){
      for(const [key,child]of dict.entries()){
        if(dict===permissions&&key===name('UR3'))continue;
        if(dict===doc.catalog&&key===name('Perms'))continue;
        visit(child,depth+1);
      }
    }else if(value instanceof PDFArray)for(const child of value.asArray())visit(child,depth+1);
  };
  for(const [,value]of doc.context.enumerateIndirectObjects())if(value!==signature)visit(value);
  visit(doc.catalog);
  const form=doc.context.lookup(doc.catalog.get(name('AcroForm')));
  if(form&&!(form instanceof PDFDict))refuse();
  if(form?.has(name('XFA'))){
    const fields=doc.context.lookup(form.get(name('Fields')));
    if(!(fields instanceof PDFArray)||!fields.size()||String(doc.context.lookup(doc.catalog.get(name('NeedsRendering'))))==='true'||String(doc.context.lookup(form.get(name('NeedsRendering'))))==='true')throw Error('This dynamic XFA form cannot be changed here.');
    // Keep the regular AcroForm fields. The obsolete XFA packet is no longer
    // reachable from the form, as with pdf-lib's normal getForm() conversion.
    form.delete(name('XFA'));
  }
  doc.catalog.delete(name('Perms'));
  if(signatureRef instanceof PDFRef)doc.context.delete(signatureRef);
  if(raw instanceof PDFRef)doc.context.delete(raw);
  changed.add(doc);
}
