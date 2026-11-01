const test=require('node:test'),assert=require('node:assert/strict'),{PDFDocument,PDFName,PDFArray,PDFDict,PDFStream}=require('pdf-lib'),{validMarkupDraft}=require('../desktop/markup-validation.cjs');
const mark=()=>({id:'pdfix-12345678-1234-4234-8234-123456789012',kind:'ink',page:0,color:'blue',text:'',fontSize:12,rotation:0,rect:[30,30,180,110],path:[40,50,80,70,150,80]});
test('legacy ink keeps its defaults; styled ink is bounded in renderer and recovery',async()=>{
 const {inkStyle,validateMarks}=await import('../src/markup-model.js'),base=mark(),pages=[{box:[0,0,400,600]}];assert.deepEqual(inkStyle(base),{width:2,opacity:1});assert.deepEqual(validateMarks([base],pages),[base]);
 const styled={...base,inkWidth:8,inkOpacity:.25};assert.deepEqual(validateMarks([styled],pages),[styled]);assert.equal(validMarkupDraft({kind:'markup',version:1,marks:[styled]}).marks[0].inkWidth,8);
 for(const change of [{inkWidth:0},{inkWidth:13},{inkWidth:NaN},{inkWidth:'8'},{inkOpacity:0},{inkOpacity:1.1},{inkOpacity:null},{inkOpacity:Infinity},{kind:'note',inkWidth:2}]){const bad={...base,...change};assert.throws(()=>validateMarks([bad],pages),/Ink|ink/);assert.throws(()=>validMarkupDraft({kind:'markup',version:1,marks:[bad]}),/ink/);}
});
test('ink width and opacity persist in standard annotation, appearance, editable metadata and flatten output',async()=>{
 const {markedPdf,inspectMarkupPdf}=await import('../src/markup-output.js'),pdf=await PDFDocument.create();pdf.addPage([400,600]);const original=await pdf.save(),styled={...mark(),inkWidth:8,inkOpacity:.25},output=await markedPdf(original,[styled]),doc=await PDFDocument.load(output.bytes),ink=doc.getPage(0).node.lookup(PDFName.of('Annots'),PDFArray).lookup(0,PDFDict);
 assert.equal(ink.lookup(PDFName.of('BS'),PDFDict).lookup(PDFName.of('W')).asNumber(),8);assert.equal(ink.lookup(PDFName.of('CA')).asNumber(),.25);const ap=ink.lookup(PDFName.of('AP'),PDFDict).lookup(PDFName.of('N'),PDFStream),state=ap.dict.lookup(PDFName.of('Resources'),PDFDict).lookup(PDFName.of('ExtGState'),PDFDict).lookup(PDFName.of('GSInk'),PDFDict);assert.equal(state.lookup(PDFName.of('CA')).asNumber(),.25);assert.match(require('node:zlib').inflateSync(Buffer.from(ap.getContents())).toString(),/8 w/);assert.deepEqual((await inspectMarkupPdf(output.bytes)).marks,[styled]);const flat=await markedPdf(output.bytes,[styled],true);assert.equal(flat.flattened,1);assert.equal((await inspectMarkupPdf(flat.bytes)).marks.length,0);
 ink.set(PDFName.of('CA'),doc.context.obj(.75));const externallyChanged=await inspectMarkupPdf(await doc.save());assert.equal(externallyChanged.marks.length,0);assert.equal(externallyChanged.foreign,1);
});

test('wide ink at crop edges gets contained bounds that retain its declared width',async()=>{
 const {inkBounds}=await import('../src/markup-model.js'),box=[-10,20,190,320];for(const path of [[-10,20,180,20],[-10,320,180,320],[-10,20,-10,300],[190,20,190,300]]){const r=inkBounds(path,12,box);assert.ok(r[0]>=box[0]&&r[1]>=box[1]&&r[2]<=box[2]&&r[3]<=box[3]);assert.ok(r[2]-r[0]>=26&&r[3]-r[1]>=26);}assert.throws(()=>inkBounds([0,0,1,1],12,[0,0,20,20]),/thinner/);
});
