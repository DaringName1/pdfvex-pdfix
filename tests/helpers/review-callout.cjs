const {PDFDocument,PDFName,PDFArray,PDFDict}=require('pdf-lib');
const {freeTextSource}=require('./review-freetext.cjs');
async function calloutSource({points=3,ending='OpenArrow',rotation=0,flags=4}={}){
 const doc=await PDFDocument.load(await freeTextSource({flags})),page=doc.getPage(0),c=doc.context,k=PDFName.of;
 page.setRotation({type:'degrees',angle:rotation});
 const note=page.node.lookup(k('Annots'),PDFArray).lookup(0,PDFDict),ap=note.lookup(k('AP'),PDFDict),old=ap.lookup(k('N'));
 note.set(k('Rect'),c.obj([40,330,320,430]));note.set(k('IT'),k('FreeTextCallout'));
 note.set(k('CL'),c.obj(points===2?[60,340,120,365]:[60,340,90,365,120,365]));
 note.set(k('RD'),c.obj([80,20,10,20]));note.set(k('LE'),k(ending));note.set(k('BS'),c.obj({W:1,S:'S'}));note.set(k('C'),c.obj([1,1,.8]));
 const line=points===2?'20 10 m 80 35 l S':'20 10 m 50 35 l 80 35 l S';
 const normal=c.stream(Buffer.from(`q\n0 G 1 w ${line}\n1 1 0.8 rg 80 20 190 60 re f\n0 G 1 w 80.5 20.5 189 59 re S\nBT /Helv 12 Tf 0 g 88 60 Td (Original free text) Tj ET\nQ\n`),{Type:'XObject',Subtype:'Form',FormType:1,BBox:[0,0,280,100],Matrix:[1,0,0,1,0,0],Resources:old.dict.get(k('Resources'))});
 normal.updateDict();const copy=ap.clone(c);copy.set(k('N'),c.register(normal));note.set(k('AP'),copy);
 return Buffer.from(await doc.save({useObjectStreams:false}));
}
module.exports={calloutSource};
