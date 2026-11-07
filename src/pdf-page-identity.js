export const sharedPdfPageMessage='This PDF reuses one page in several places. This tool cannot change those pages separately. Your original is unchanged.';
export const conflictingPdfObjectMessage="This PDF contains conflicting versions of an internal object, so this tool can't safely change it. Your original is unchanged.";
export function assertEditablePdfIdentity(doc){
  const objects=new Set();for(const [ref]of doc.context.enumerateIndirectObjects()){
    if(objects.has(ref.objectNumber))throw new Error(conflictingPdfObjectMessage);objects.add(ref.objectNumber);
  }
  assertDistinctPdfPages(doc);
}
export function assertDistinctPdfPages(doc){
  const seen=new Set();for(const page of doc.getPages()){
    const key=String(page.ref);if(seen.has(key))throw new Error(sharedPdfPageMessage);seen.add(key);
  }
}
