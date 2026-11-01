const {PDFDocument,PDFName,PDFString}=require('pdf-lib');
async function freeTextSource({flags=4,rich=false}={}){
  const pdf=await PDFDocument.create(),page=pdf.addPage([400,600]),c=pdf.context;
  page.drawText('Original drawing artwork',{x:40,y:500,size:12});
  const font=c.register(c.obj({Type:'Font',Subtype:'Type1',BaseFont:'Helvetica'}));
  const appearance=c.register(c.stream(Buffer.from('q\n1 1 0 rg 0 0 220 40 re f\nBT /Helv 12 Tf 0 g 8 16 Td (Original free text) Tj ET\nQ\n'),{Type:'XObject',Subtype:'Form',BBox:[0,0,220,40],Resources:{Font:{Helv:font}},PrivateAppearance:PDFString.of('Retain appearance metadata')}));
  const note=c.obj({Type:'Annot',Subtype:'FreeText',Rect:[40,390,260,430],Contents:PDFString.of('Original free text'),T:PDFString.of('Original author'),NM:PDFString.of('source-freetext'),DA:PDFString.of('/Helv 12 Tf 0 g'),F:flags,AP:{N:appearance},PrivateFixture:PDFString.of('Retain private parent data')});
  if(rich)note.set(PDFName.of('RC'),PDFString.of('<body><p>Original rich text</p></body>'));
  page.node.addAnnot(c.register(note));
  return Buffer.from(await pdf.save({useObjectStreams:false}));
}
module.exports={freeTextSource};
