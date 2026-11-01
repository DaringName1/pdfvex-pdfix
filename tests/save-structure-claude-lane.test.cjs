const {test}=require('node:test'),assert=require('node:assert/strict');
const {compareStructure}=require('./helpers/pdf-structure.cjs'),{richPdf}=require('./helpers/rich-pdf.cjs');
// V1 audit, area 3 (data integrity), Claude's lane: each PDF save keeps everything it did not set out to change.
// The source carries a calculated form, a comment, a bookmark, an attached file, a tag tree and document details.
const routine=[/^info\.(ModDate|Producer|Creator)/,/^xmp:/];
test('Fill and sign: changing one field value keeps the other field, its calculation, comments, bookmarks, attachments and tags',async()=>{
 const before=Buffer.from(await richPdf()),{build}=require('../desktop/form-fill-codec.cjs');
 const result=await build(before,{kind:'form',version:1,values:[{name:'Qty',value:'5'}],overlays:[]});
 const diff=await compareStructure(before,Buffer.from(result.bytes),[...routine,/^fields\[0\]/]);
 assert.deepEqual(diff.unexpected,[],'only the Qty value may change');assert.equal(diff.after.fields[0].value,'5');assert.equal(diff.after.fields[1].calculation,true);
});
test('Create fillable fields: adding a field keeps every existing field, calculation, comment, bookmark, attachment and tag',async()=>{
 const before=Buffer.from(await richPdf()),{create}=require('../desktop/form-builder-codec.cjs');
 const result=await create(before,{kind:'form-builder',version:1,fields:[{name:'Approved',label:'Approved by',type:'text',page:1,rect:[72,300,312,324],required:false,readOnly:false,fontSize:12}]});
 const diff=await compareStructure(before,Buffer.from(result.bytes??result),[...routine,/^fields: 2 -> 3 items/,/^annotations: \d+ -> \d+ items/,/^calculationOrder/]);
 assert.deepEqual(diff.unexpected,[],'only the new field and its widget may be added');assert.deepEqual(diff.after.fields.map(f=>f.name),['Qty','Total','Approved']);
 assert.deepEqual(diff.after.annotations.slice(0,diff.before.annotations.length),diff.before.annotations,'existing annotations unchanged and in order');
});
test('Protect then unlock: the unlocked copy carries the same fields, calculations, comments, bookmarks, attachments and tags',async t=>{
 const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{randomUUID}=require('node:crypto'),{PasswordEngine}=require('../desktop/password-engine.cjs');
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-protect-structure-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const engine=new PasswordEngine(path.join(root,'jobs'),path.resolve('dist/native/qpdf'));await engine.init();
 const before=Buffer.from(await richPdf()),owner='Owner-example-962';
 const locked=(await engine.process('file',randomUUID(),before,{mode:'protect',currentPassword:'',openPassword:'Open-example-741',ownerPassword:owner,allowPrint:true,allowCopy:true,allowChanges:false})).bytes;
 const unlocked=(await engine.process('file',randomUUID(),Buffer.from(locked),{mode:'remove',currentPassword:owner})).bytes;
 const diff=await compareStructure(before,Buffer.from(unlocked),[...routine]);assert.deepEqual(diff.unexpected,[],'nothing but routine details may differ after a protect and unlock round trip');
});
test('Signing request: adding a signing location keeps every field, calculation, comment, bookmark, attachment and tag',async()=>{
 const before=Buffer.from(await richPdf()),{buildSignatureRequest}=require('../desktop/signature-request-codec.cjs');
 const result=await buildSignatureRequest(before,{version:1,recipient:'Robot Signer',email:'robot@example.test',subject:'Please sign',message:'Thanks',acknowledgeNotes:true,placements:[{id:'p1',page:1,kind:'sign',x:0.1,y:0.7,width:0.3,height:0.08}]});
 const diff=await compareStructure(before,Buffer.from(result.bytes),[...routine,/^annotations: \d+ -> \d+ items/]);
 assert.deepEqual(diff.unexpected,[],'only the new signing note may be added');assert.equal(diff.after.annotations.length,diff.before.annotations.length+1);
 assert.deepEqual(diff.after.annotations.slice(0,diff.before.annotations.length),diff.before.annotations,'existing annotations unchanged');
});
test('Edit PDF text: adding a line of text keeps every field, calculation, comment, bookmark, attachment and tag',async()=>{
 const before=Buffer.from(await richPdf()),{contentPdf}=await import('../src/pdf-content-output.js'),{CONTENT_FONTS}=await import('../src/pdf-content-model.js');
 const font=Object.keys(CONTENT_FONTS)[0],draft={kind:'pdf-content',version:1,objects:[{id:'pdfix-content-11111111-2222-4333-8444-555555555555',type:'text',page:0,left:10,top:70,width:60,height:6,text:'Checked on site',font,size:12,color:'#203040'}],assets:[]};
 const output=await contentPdf(new Uint8Array(before),draft,()=>{}),bytes=Buffer.from(output.bytes??output);assert.ok(bytes.length>before.length&&!bytes.equals(before),'the text addition must be written');
 const diff=await compareStructure(before,bytes,[...routine]);assert.deepEqual(diff.unexpected,[],'added text must not change any other part of the PDF');
});
test('Redact: the copy keeps the same pages and removes every hidden part on purpose (fields, comments, bookmarks, attachments, tags, details)',async()=>{
 const {pathToFileURL}=require('node:url'),path=require('node:path'),{randomUUID}=require('node:crypto'),load=file=>import(pathToFileURL(path.resolve(file)).href);
 const {inspectRedactionSource,RedactionWriter}=await load('src/redaction-output.js'),{redactionLayout,redactionMasks}=await load('src/redaction-model.js');
 const before=Buffer.from(await richPdf()),info=await inspectRedactionSource(before),settings={dpi:144,cleanupOnly:false},draft={kind:'redaction',version:1,settings,marks:[{id:'pdfix-redact-'+randomUUID(),page:0,rect:[25,200,190,235]}]};
 const layout=redactionLayout(info.pages,settings),masks=redactionMasks(info.pages,draft),writer=new RedactionWriter();await writer.begin(info.pages,draft);
 for(let i=0;i<layout.length;i++){const {width,height}=layout[i],rgb=new Uint8Array(width*height*3).fill(255);for(const m of masks[i])for(let y=m.top;y<m.bottom;y++)rgb.fill(0,(y*width+m.left)*3,(y*width+m.right)*3);writer.page(i,rgb);}
 const diff=await compareStructure(before,Buffer.from((await writer.finish()).bytes),[/^info\./]);
 assert.deepEqual(diff.unexpected.sort(),['annotations: 3 -> 0 items','attachments: 1 -> 0 items','fields: 2 -> 0 items','outline: 1 -> 0 items','tags.elements: 2 -> 0','tags.marked: true -> false','tags.present: true -> false'],'only the hidden parts go; pages, sizes and page count stay');
});
test('Fill and sign: placing a typed signature keeps every field, calculation, comment, bookmark, attachment and tag',async()=>{
 const before=Buffer.from(await richPdf()),{build}=require('../desktop/form-fill-codec.cjs'),{randomUUID}=require('node:crypto');
 const signature={id:'pdfix-form-'+randomUUID(),kind:'signature',page:0,rect:[180,60,360,100],rotation:0,confirmed:true,asset:{type:'text',text:'Reviewed Person'}};
 const result=await build(before,{kind:'form',version:1,values:[],overlays:[signature]}),after=Buffer.from(result.bytes);
 assert.ok(!after.equals(before),'the signature must be written');
 const diff=await compareStructure(before,after,[...routine]);assert.deepEqual(diff.unexpected,[],'a placed signature is page drawing only; nothing else may change');
});
