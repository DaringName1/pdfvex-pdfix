import {documentLayout} from './document-layout-model.js';
import {validDocumentBand} from './document-band-model.js';
// Inert source bands never carry HTML, URLs, XML or cached page-number fields.
export function importedBandLayout(layout,bands){
 if(!bands||typeof bands!=='object'||Array.isArray(bands)||Object.keys(bands).length!==2||!Object.hasOwn(bands,'header')||!Object.hasOwn(bands,'footer'))throw new Error('Imported header/footer data is invalid.');
 const values={};for(const location of ['header','footer']){const band=bands[location];if(band===null)continue;if(Object.hasOwn(band||{},'version')){values[location+'Band']=validDocumentBand(band);values[location+'Text']='';continue;}if(!band||typeof band!=='object'||Array.isArray(band)||Object.keys(band).length!==2||typeof band.text!=='string'||!Object.hasOwn(band,'align'))throw new Error('Imported header/footer data is invalid.');values[location+'Band']=null;values[location+'Text']=band.text;values[location+'Align']=band.align;}
 // Original fields are deliberately omitted, never frozen to their cached value.
 return documentLayout({...layout,...values,pageNumbers:false});
}
