import snapshotModel from '../desktop/document-snapshot-model.cjs';
import {validateDocumentImage} from './document-image-model.js';
import {documentLayout} from './document-layout-model.js';
export const SNAPSHOT_PROPERTY=snapshotModel.SNAPSHOT_PROPERTY,SHA_PROPERTY=snapshotModel.SHA_PROPERTY,documentSnapshot=snapshotModel.documentSnapshot;
const squeeze=text=>text.replace(/\s+/gu,'');
function modelText(node){let text='';const visit=item=>{if(item.type==='text')text+=item.text??'';for(const child of item.content??[])visit(child);};visit(node);return text;}
// Editor side: use the saved model only when the generic import of the same file shows the same text and the
// same images in the same order. Anything else means the file changed after PDFix wrote it.
export function restoreDocumentSnapshot(snapshot,importedHtml){
 const parsed=new DOMParser().parseFromString(importedHtml,'text/html'),images=[...parsed.querySelectorAll('img[data-pdfix-image="true"]')];
 if(squeeze(parsed.body.textContent)!==squeeze(modelText(snapshot.content)))throw new Error('The document text changed after PDFix saved it.');
 const content=structuredClone(snapshot.content);let index=0;
 const fill=node=>{if(node.type==='documentImage'){const image=images[index++];if(!image)throw new Error('An image is missing.');const pixelWidth=Number(image.getAttribute('data-pdfix-image-width')),pixelHeight=Number(image.getAttribute('data-pdfix-image-height'));if(pixelWidth!==node.attrs.pixelWidth||pixelHeight!==node.attrs.pixelHeight)throw new Error('An image changed after PDFix saved it.');node.attrs=validateDocumentImage({...node.attrs,src:image.getAttribute('src')});}for(const child of node.content??[])fill(child);};
 fill(content);if(index!==images.length)throw new Error('The images changed after PDFix saved the document.');
 return {content,layout:documentLayout(snapshot.layout)};
}
