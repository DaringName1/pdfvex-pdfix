'use strict';
const {PDFDocument,PDFName,PDFString,PDFNumber}=require('pdf-lib');
const k=n=>PDFName.of(n);
// A small PDF carrying every kind of object the audit checks: a form with a calculated total, a comment, a bookmark,
// an attached file, a tag tree and document details.
async function richPdf({attachment=true}={}){const doc=await PDFDocument.create();doc.setTitle('Parts order');const page=doc.addPage([400,500]);doc.addPage([400,500]);
 const form=doc.getForm(),qty=form.createTextField('Qty');qty.setText('3');qty.addToPage(page,{x:20,y:400,width:80,height:20});const total=form.createTextField('Total');total.addToPage(page,{x:20,y:360,width:80,height:20});
 const ctx=doc.context;total.acroField.dict.set(k('AA'),ctx.obj({C:ctx.obj({S:'JavaScript',JS:PDFString.of('event.value=this.getField("Qty").value*2')})}));
 const note=ctx.register(ctx.obj({Type:'Annot',Subtype:'Text',Rect:[200,400,220,420],Contents:PDFString.of('Check the qty')}));page.node.set(k('Annots'),ctx.obj([...page.node.Annots().asArray(),note]));
 const outline=ctx.nextRef(),item=ctx.register(ctx.obj({Title:PDFString.of('Order'),Parent:outline,Dest:[page.ref,k('Fit')]}));ctx.assign(outline,ctx.obj({Type:'Outlines',First:item,Last:item,Count:PDFNumber.of(1)}));doc.catalog.set(k('Outlines'),outline);
 if(attachment)await doc.attach(Buffer.from('supplier quote'),'quote.txt',{mimeType:'text/plain'});
 const root=ctx.nextRef(),p=ctx.register(ctx.obj({S:'P',P:root,Pg:page.ref}));ctx.assign(root,ctx.obj({Type:'StructTreeRoot',K:ctx.obj([ctx.register(ctx.obj({S:'Document',P:root,K:ctx.obj([p])}))])}));doc.catalog.set(k('StructTreeRoot'),root);doc.catalog.set(k('MarkInfo'),ctx.obj({Marked:true}));
 return doc.save();}
module.exports={richPdf};
