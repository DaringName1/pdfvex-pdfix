export function restrictedPdfJob(owner,kind,phase,draft){
 const previous=owner.restrictedToken,token=crypto.randomUUID();owner.restrictedToken=token;let canceled=false;
 const promise=Promise.resolve(owner.restrictedQueue).catch(()=>{}).then(async()=>{
  if(previous)await window.pdfix.discardRestrictedPdfEdit(owner.file.id,previous);
  if(canceled||owner.closed||owner.restrictedToken!==token)throw Error('Protected PDF editing canceled. No copy was saved.');
  const result=phase==='inspect'?await window.pdfix.inspectRestrictedPdfEdit(owner.file.id,token,kind):await window.pdfix.buildRestrictedPdfEdit(owner.file.id,token,kind,draft);
  if(canceled||owner.closed||owner.restrictedToken!==token)throw Error('Protected PDF editing canceled. No copy was saved.');
  if(result?.restricted){owner.restricted=true;owner.restrictionPolicy=result.restrictionPolicy;}
  return result;
 });owner.restrictedQueue=promise.catch(()=>{});
 return {promise,cancel(){canceled=true;window.pdfix.cancelRestrictedPdfEdit(owner.file.id,token).catch(error=>owner.announce(error.message,true));}};
}
export function discardRestrictedPdfJob(owner){const token=owner.restrictedToken;owner.restrictedToken=null;if(!token)return;const discard=window.pdfix.discardRestrictedPdfEdit(owner.file.id,token);owner.restrictedQueue=Promise.allSettled([owner.restrictedQueue,discard]);discard.catch(error=>owner.announce(error.message,true));}
export function showRestrictedEditNote(panel,policy){if(!policy||panel.querySelector('[data-protected-copy-note]'))return;const note=panel.ownerDocument.createElement('p');note.dataset.protectedCopyNote='';note.textContent="Your copy keeps this PDF's password protection and permissions.";if(!policy.content&&!policy.annotations)note.textContent+=' Only its existing form fields can be filled.';(panel.querySelector('.reader-options-body')||panel).prepend(note);}
export async function verifyRestrictedAnnotations(reader,expected){
 if(!expected?.length)return;const pages=new Map();for(const item of expected){if(!pages.has(item.page))pages.set(item.page,await (await reader.doc.getPage(item.page+1)).getAnnotations({intent:'display'}));const annotations=pages.get(item.page),index=annotations.findIndex(a=>a.id===item.id&&a.subtype===item.subtype&&a.contentsObj?.str===item.text&&Array.isArray(a.rect)&&a.rect.length===4&&a.rect.every((v,i)=>Math.abs(v-item.rect[i])<.01));if(index<0)throw Error('The added text could not be independently read from the protected copy. Nothing was saved.');annotations.splice(index,1);}
}
