'use strict';
// Fixed contained child only. The parent sends an immutable clear snapshot and
// an independently obtained permission policy; no caller paths are accepted.
const {createHash}=require('node:crypto');
const {PDFDocument,PDFName,PDFDict,PDFArray,PDFRef,PDFStream,PDFNumber,PDFHexString}=require('pdf-lib');
const {inspectFormPdf}=require('../src/form-output.js');
const Form=require('./form-fill-codec.cjs');
const FV=require('./form-fill-validation.cjs');
const {inspectMarkupPdf,markedPdf}=require('../src/markup-output.js');
const {inspectContentPdf,contentPdf}=require('../src/pdf-content-output.js');
const n=PDFName.of,hash=b=>createHash('sha256').update(b).digest('hex');
function options(o){if(!o||Object.keys(o).some(k=>!['tool','policy','draft','run'].includes(k))||!['form','markup','content'].includes(o.tool)||!o.policy||Object.keys(o.policy).sort().join(',')!=='annotations,content,fill'||Object.values(o.policy).some(v=>typeof v!=='boolean'))throw Error('Choose a supported restricted-PDF editing operation.');return o;}
async function inspect(bytes,o){options(o);let info;if(o.tool==='form'){if(!o.policy.fill)throw Error('This PDF does not allow filling form fields. Your original is unchanged.');info=await Form.inspect(bytes);}else if(o.tool==='markup'){if(!o.policy.annotations)throw Error('This PDF does not allow comments or drawing. Your original is unchanged.');info=await inspectMarkupPdf(bytes);}else{if(!o.policy.content&&!o.policy.annotations)throw Error('This PDF does not allow adding text. Use Fill form for any permitted form answers.');info=await inspectContentPdf(bytes);if(!o.policy.content){info.originalText=[];info.originalImages=[];}}
 const baseline=o.tool==='markup'&&info.marks.length?info.bytes:null;delete info.bytes;return {sourceSha256:hash(bytes),tool:o.tool,info,...(baseline?{bytes:baseline}:{})};}
async function markOutput(bytes,expected,run){
 if(!Number.isSafeInteger(run)||run<1||run>0x7fffffff)throw Error('A valid native annotation run is required.');const doc=await PDFDocument.load(bytes,{updateMetadata:false});
 for(const [index,item]of expected.entries()){const match=/^(\d+)R(\d*)$/.exec(item.id);if(!match)throw Error('The checked annotation identity is invalid.');const dict=doc.context.lookup(PDFRef.of(Number(match[1]),Number(match[2]||0)),PDFDict);dict.set(n('PDFixRestrictedRun'),PDFNumber.of(run));dict.set(n('PDFixRestrictedIndex'),PDFNumber.of(index));}
 return doc.save({updateFieldAppearances:false});
}
async function annotationAdditions(source,additions,pages,texts,run){
 const doc=await PDFDocument.load(source,{updateMetadata:false}),art=await PDFDocument.load(additions,{updateMetadata:false}),expected=[];
 for(const pageIndex of pages){const page=doc.getPage(pageIndex),crop=page.getCropBox(),media=page.getMediaBox(),l=Math.max(crop.x,media.x),b=Math.max(crop.y,media.y),r=Math.min(crop.x+crop.width,media.x+media.width),t=Math.min(crop.y+crop.height,media.y+media.height),ap=await doc.embedPage(art.getPage(pageIndex),{left:l,bottom:b,right:r,top:t});
  const text=texts.get(pageIndex)||'Added visual signature',dict=doc.context.obj({Type:'Annot',Subtype:'FreeText',Rect:[l,b,r,t],P:page.ref,F:4,Contents:PDFHexString.fromText(text),DA:PDFHexString.fromText('/Helv 12 Tf 0 g'),AP:{N:ap.ref},PDFixRestrictedRun:run,PDFixRestrictedIndex:expected.length}),ref=doc.context.register(dict);
  // A page's /Annots array may be shared even when its leaf is unique.
  const annots=page.node.lookupMaybe(n('Annots'),PDFArray);page.node.set(n('Annots'),doc.context.obj([...(annots?.asArray()||[]),ref]));expected.push({id:`${ref.objectNumber}R`,page:pageIndex,subtype:'FreeText',text,rect:[l,b,r,t]});
 }
 return {bytes:await doc.save({updateFieldAppearances:false}),annotationsExpected:expected};
}
async function blankLike(bytes){const source=await PDFDocument.load(bytes,{updateMetadata:false}),blank=await PDFDocument.create();for(const page of source.getPages()){const media=page.getMediaBox(),crop=page.getCropBox(),p=blank.addPage();p.setMediaBox(media.x,media.y,media.width,media.height);p.setCropBox(crop.x,crop.y,crop.width,crop.height);p.setRotation(page.getRotation());}return blank.save();}
async function build(bytes,o){options(o);const sourceSha256=hash(bytes);let output;
 if(o.tool==='form'){
  if(!o.policy.fill)throw Error('This PDF does not allow filling form fields. Your original is unchanged.');const info=await inspectFormPdf(bytes),draft=FV.validFormFillDraft(o.draft,info);
  if(!o.policy.annotations&&!o.policy.content&&(draft.overlays.length||draft.tabOrders?.length))throw Error('This PDF allows form answers, but not adding text, signatures or changing field order. Use its existing fields.');
  output=await Form.build(bytes,o.policy.content?draft:{...draft,overlays:[]});
  if(!o.policy.content&&draft.overlays.length){const overlay=await Form.build(await blankLike(bytes),{kind:'form',version:1,values:[],overlays:draft.overlays});const pages=[...new Set(draft.overlays.map(item=>item.page))],texts=new Map(pages.map(page=>[page,draft.overlays.filter(item=>item.page===page&&item.asset.type==='text').map(item=>item.asset.text).join('\n')]));const added=await annotationAdditions(output.bytes,overlay.bytes,pages,texts,o.run);output.bytes=added.bytes;output.annotationsExpected=added.annotationsExpected;output.report.overlays=draft.overlays.map(FV.overlayReceipt);output.report.draftSha256=hash(Buffer.from(JSON.stringify(draft)));}
 }else if(o.tool==='markup'){
  if(!o.policy.annotations)throw Error('This PDF does not allow comments or drawing. Your original is unchanged.');if(o.draft?.flatten&&!o.policy.content)throw Error('This PDF allows editable comments, but not making them permanent page artwork.');output=await markedPdf(bytes,o.draft?.marks,o.draft?.flatten??false,undefined,{preservePageContents:true});output.bytes=await markOutput(output.bytes,output.expected,o.run);
 }else{
  if(!o.policy.content&&!o.policy.annotations)throw Error('This PDF does not allow adding text. Use Fill form for any permitted form answers.');
  if(o.policy.content)output=await contentPdf(bytes,o.draft);else{
   const d=o.draft;if(!d||d.objects?.some(item=>item.type!=='text')||d.assets?.length||d.replacements?.length||d.imageReplacements?.length||Object.keys(d.metadata??{}).length)throw Error('This PDF allows added text notes, but not changing existing text, pictures or document properties.');
   const art=await contentPdf(await blankLike(bytes),d),pages=[...new Set(d.objects.map(item=>item.page))],texts=new Map(pages.map(page=>[page,d.objects.filter(item=>item.page===page).map(item=>item.text).join('\n')]));const added=await annotationAdditions(bytes,art.bytes,pages,texts,o.run);output={...art,...added,expected:[],annotationMode:true};
  }
 }
 if(output.report){output.report.sha256=hash(output.bytes);output.report.outputBytes=output.bytes.length;}
 const {bytes:result,...details}=output;return {bytes:result,sourceSha256,tool:o.tool,output:details};
}
async function preserve(bytes){if(bytes.length<10)throw Error('The encryption retention check is incomplete.');const view=Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength),length=view.readUInt32LE(0),other=view.readUInt32LE(4);if(!length||!other||length+other+8!==bytes.length)throw Error('The encryption retention sources do not match their bounded envelope.');const before=bytes.subarray(8,8+length),after=bytes.subarray(8+length);const report=await require('./compression-inspect.cjs').verify(before,after,false,true);return {sourceSha256:hash(bytes),originalSha256:hash(before),outputSha256:hash(after),verified:true,...report};}
module.exports={inspect,build,preserve};
