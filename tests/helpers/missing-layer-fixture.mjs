import {PDFDocument,PDFName,PDFString} from 'pdf-lib';
export async function missingLayerFixture(kind){
 const doc=await PDFDocument.create(),page=doc.addPage([100,100]),c=doc.context,resources=c.obj({});
 if(kind==='missing-entry')resources.set(PDFName.of('Properties'),c.obj({}));
 if(kind.startsWith('malformed'))resources.set(PDFName.of('Properties'),c.obj(kind==='malformed-zero'?0:kind==='malformed-false'?false:17));
 if(kind==='defined-off'){
  const group=c.register(c.obj({Type:'OCG',Name:PDFString.of('Defined hidden layer')}));
  resources.set(PDFName.of('Properties'),c.obj({Ghost:group}));
  doc.catalog.set(PDFName.of('OCProperties'),c.obj({OCGs:[group],D:{BaseState:'OFF',OFF:[group],Order:[group]}}));
 }
 page.node.set(PDFName.of('Resources'),resources);page.node.set(PDFName.of('Contents'),c.register(c.flateStream('/OC /Ghost BDC 0 1 0 rg 10 10 80 80 re f EMC')));
 return Buffer.from(await doc.save({useObjectStreams:false}));
}
