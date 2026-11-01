const {PDFDocument,PDFName,PDFString,PDFRawStream}=require('pdf-lib');
const {deflateSync}=require('node:zlib');
const n=PDFName.of;
async function fixture(image=false){const doc=await PDFDocument.create();doc.setTitle('Keep this metadata');doc.setAuthor('PDFix fixture');const page=doc.addPage([360,480]);page.drawText('Keep selectable text',{x:30,y:430,size:16});const field=doc.getForm().createTextField('Name');field.setText('Saved value');field.addToPage(page,{x:30,y:350,width:160,height:30});
 const link=doc.context.obj({Type:'Annot',Subtype:'Link',Rect:[30,400,180,420],A:{Type:'Action',S:'URI',URI:PDFString.of('https://example.com/fixture')}});page.node.addAnnot(doc.context.register(link));
 const outlines=doc.context.obj({Type:'Outlines',Count:1}),outlinesRef=doc.context.register(outlines),item=doc.context.obj({Title:PDFString.of('Kept chapter'),Parent:outlinesRef,Dest:[page.ref,'Fit']});const itemRef=doc.context.register(item);outlines.set(n('First'),itemRef);outlines.set(n('Last'),itemRef);doc.catalog.set(n('Outlines'),outlinesRef);
 doc.catalog.set(n('Metadata'),doc.context.register(doc.context.stream('<metadata>Private metadata stays</metadata>',{Type:'Metadata',Subtype:'XML'})));await doc.attach(Buffer.from('attachment remains'),'notes.txt');
 if(image){const pixels=Buffer.alloc(256*256*3);for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*3;pixels[i]=x;pixels[i+1]=y;pixels[i+2]=(x+y)%256;}const stream=PDFRawStream.of(doc.context.obj({Type:'XObject',Subtype:'Image',Width:256,Height:256,ColorSpace:'DeviceRGB',BitsPerComponent:8,Filter:'FlateDecode'}),deflateSync(pixels,{level:0}));page.node.Resources().set(n('XObject'),doc.context.obj({Im0:doc.context.register(stream)}));page.node.addContentStream(doc.context.register(doc.context.stream('q 240 0 0 240 30 60 cm /Im0 Do Q')));}
 else page.node.addContentStream(doc.context.register(doc.context.stream('q\nQ\n'.repeat(20000))));
 return Buffer.from(await doc.save({useObjectStreams:false}));}
module.exports={fixture};
