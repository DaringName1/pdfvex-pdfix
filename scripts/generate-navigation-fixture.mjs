import fs from 'node:fs/promises';
import {PDFDocument,PDFName,PDFNumber,PDFString} from 'pdf-lib';
const doc=await PDFDocument.create(),ctx=doc.context,pages=[];
for(const [index,text]of ['Introduction','Maintenance instructions','Service history'].entries()){const page=doc.addPage([612,792]);page.drawText(text,{x:48,y:700,size:24});page.drawText(`Synthetic navigation fixture, physical page ${index+1}`,{x:48,y:660,size:12});pages.push(page);}
const root=ctx.register(ctx.obj({Type:'Outlines'})),entries=[];
for(const [index,title]of ['Introduction','Maintenance','Service history'].entries())entries.push(ctx.register(ctx.obj({Title:PDFString.of(title),Parent:root,Dest:[pages[index].ref,'Fit']})));
const external=ctx.register(ctx.obj({Title:PDFString.of('<script>source content only</script>'),Parent:root,A:{S:'URI',URI:PDFString.of('https://example.invalid/never-open')}}));
ctx.lookup(root).set(PDFName.of('First'),entries[0]);ctx.lookup(root).set(PDFName.of('Last'),external);ctx.lookup(root).set(PDFName.of('Count'),PDFNumber.of(4));
ctx.lookup(entries[0]).set(PDFName.of('Next'),entries[1]);ctx.lookup(entries[1]).set(PDFName.of('Prev'),entries[0]);ctx.lookup(entries[1]).set(PDFName.of('Next'),external);ctx.lookup(external).set(PDFName.of('Prev'),entries[1]);
ctx.lookup(entries[1]).set(PDFName.of('First'),entries[2]);ctx.lookup(entries[1]).set(PDFName.of('Last'),entries[2]);ctx.lookup(entries[1]).set(PDFName.of('Count'),PDFNumber.of(1));ctx.lookup(entries[2]).set(PDFName.of('Parent'),entries[1]);
doc.catalog.set(PDFName.of('Outlines'),root);doc.catalog.set(PDFName.of('PageLabels'),ctx.obj({Nums:[0,{S:'r'},1,{S:'D',St:1}]}));
await fs.writeFile('tests/fixtures/navigation-sample.pdf',await doc.save());
