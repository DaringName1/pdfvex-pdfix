'use strict';
// Fixed AppContainer form parser/writer; Electron imports validators only.
const {createHash}=require('node:crypto');
const {PDFDocument,PDFName,PDFDict,PDFArray,PDFRawStream,PDFRef,PDFNumber,PDFInvalidObject,PDFTextField,PDFCheckBox,PDFDropdown,PDFOptionList,PDFRadioGroup,PDFHexString,StandardFonts,rgb}=require('pdf-lib');
const {validFormBuilderDraft,builderLocations,builderChoiceOptions}=require('./form-builder-validation.cjs');
const n=PDFName.of,hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function guardStructures(doc){
 const objects=doc.context.enumerateIndirectObjects();if(objects.length>100000)throw new Error('The source PDF exceeds 100,000 objects.');const stack=objects.map(([,value])=>({value,depth:0})),seen=new WeakSet(),refs=new Set();stack.push({value:doc.catalog,depth:0});let count=0;
 while(stack.length){let {value,depth}=stack.pop();if(++count>300000||depth>80)throw new Error('The PDF exceeds form creation traversal limits.');if(value instanceof PDFRef){const id=value.toString();if(refs.has(id))continue;refs.add(id);value=doc.context.lookup(value);if(!value)throw new Error('An unresolved PDF object cannot be preserved safely.');}if(!value||typeof value!=='object'||seen.has(value))continue;seen.add(value);if(value instanceof PDFInvalidObject)throw new Error('Malformed PDF objects cannot be preserved safely.');if(value instanceof PDFNumber&&(!Number.isFinite(value.asNumber())||Math.abs(value.asNumber())>1e15))throw new Error('Unsupported PDF numbers cannot be preserved safely.');if(value instanceof PDFRawStream){stack.push({value:value.dict,depth:depth+1});continue;}if(value instanceof PDFDict){const type=doc.context.lookup(value.get(n('Type'))),fieldType=doc.context.lookup(value.get(n('FT')));if(type instanceof PDFName&&type.decodeText()==='Sig'||fieldType instanceof PDFName&&fieldType.decodeText()==='Sig'||['ByteRange','DocMDP','UR3'].some(key=>value.has(n(key))))throw new Error('Signature-bearing or certified PDFs cannot receive new fields here.');if(value.has(n('XFA')))throw new Error('XFA form creation is unsupported. Request a regular PDF.');for(const [,child]of value.entries())stack.push({value:child,depth:depth+1});}else if(value instanceof PDFArray){if(value.size()>100000)throw new Error('An oversized PDF array cannot be preserved safely.');for(let index=0;index<value.size();index++)stack.push({value:value.get(index),depth:depth+1});}}
}
async function load(bytes){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>100*1024*1024)throw new Error('Form creation needs an opened PDF under 100 MB.');
 let doc;try{doc=await PDFDocument.load(bytes,{throwOnInvalidObject:true,updateMetadata:false,capNumbers:false});}catch{throw new Error('This PDF is damaged or encrypted. Obtain an owner-authorized unrestricted copy.');}
 if(doc.isEncrypted||doc.context.trailerInfo.Encrypt||!doc.getPageCount()||doc.getPageCount()>500)throw new Error('Encrypted documents and PDFs above 500 pages cannot receive new fields.');
 if(doc.catalog.get(n('Perms')))throw new Error('Certified or permission-controlled PDFs cannot receive new fields.');
 guardStructures(doc);
 return doc;
}
function inspectDocument(doc){
 const fields=doc.getForm().getFields();if(fields.length>500)throw new Error('The source has more than 500 existing fields.');
 const pages=doc.getPages().map(page=>{const c=page.getCropBox(),m=page.getMediaBox(),box=[Math.max(c.x,m.x),Math.max(c.y,m.y),Math.min(c.x+c.width,m.x+m.width),Math.min(c.y+c.height,m.y+m.height)],rotation=((page.getRotation().angle%360)+360)%360;if(!box.every(Number.isFinite)||box[2]<=box[0]||box[3]<=box[1]||![0,90,180,270].includes(rotation))throw new Error('A source page has unsupported geometry.');return {box,rotation};});
 const widgets=[];for(const [index,page]of doc.getPages().entries()){const annotations=page.node.lookupMaybe(n('Annots'),PDFArray);if(annotations?.size()>2000)throw new Error('A page exceeds 2,000 annotations.');for(const ref of annotations?.asArray()||[]){const dict=doc.context.lookup(ref,PDFDict);if(String(doc.context.lookup(dict.get(n('Subtype'))))==='/Widget'){const rect=dict.lookupMaybe(n('Rect'),PDFArray)?.asArray().map(value=>doc.context.lookup(value)?.asNumber?.());if(!rect||rect.length!==4||!rect.every(Number.isFinite))throw new Error('An existing widget has invalid geometry.');widgets.push({page:index,rect});if(widgets.length>2000)throw new Error('The source exceeds 2,000 widgets.');}}}
 const fieldNames=fields.map(field=>field.getName());if(fieldNames.some(name=>name.length>512)||new Set(fieldNames).size!==fieldNames.length)throw new Error('Existing field names are ambiguous or too long.');
 return {pages,widgets,fieldNames,pageCount:pages.length};
}
// Adding a widget makes pdf-lib wrap a page's existing content between two tiny streams holding only "q" and "Q"
// (save and restore graphics state). That pair changes nothing that is drawn, so it is recognised and allowed;
// the original streams must still be present, unchanged and in order between them.
function neutralWrapper(stream){
 try{const raw=stream.getContents();if(raw.length>64)return null;const filter=String(stream.dict.get(n('Filter'))||''),bytes=filter==='/FlateDecode'?require('node:zlib').inflateSync(Buffer.from(raw)):filter===''?Buffer.from(raw):null,text=bytes?.toString('latin1').trim();return text==='q'||text==='Q'?text:null;}catch{return null;}
}
function sameArtwork(before,after){
 const original=JSON.stringify(before.contentHashes);if(JSON.stringify(after.contentHashes)===original)return true;
 return after.wrappers.length===before.contentHashes.length+2&&after.wrappers[0]==='q'&&after.wrappers.at(-1)==='Q'&&JSON.stringify(after.contentHashes.slice(1,-1))===original;
}
const pageGeometry=page=>JSON.stringify({...page,annotations:undefined,contentHashes:undefined,wrappers:undefined});
function preservation(doc){
 const dictionaryRefs=new Map(),pages=doc.getPages().map(page=>{
  const contents=page.node.Contents(),streams=contents instanceof PDFArray?contents.asArray():contents?[contents]:[];
  const contentHashes=streams.map(ref=>{const stream=doc.context.lookup(ref);if(!(stream instanceof PDFRawStream))throw new Error('A source page content stream is unsupported.');return hash(stream.getContents());}),wrappers=streams.map(ref=>neutralWrapper(doc.context.lookup(ref)));
  const annotations=page.node.lookupMaybe(n('Annots'),PDFArray)?.asArray()||[];for(const ref of annotations){const dict=doc.context.lookup(ref);if(ref instanceof PDFRef)dictionaryRefs.set(String(ref),{ref,text:dict.toString()});}
  return {media:page.getMediaBox(),crop:page.getCropBox(),rotation:page.getRotation().angle,contentHashes,wrappers,annotations:annotations.map(String)};
 });
 for(const field of doc.getForm().getFields())dictionaryRefs.set(String(field.ref),{ref:field.ref,text:field.acroField.dict.toString()});
 return {pages,dictionaryRefs};
}
async function create(bytes,draft){
 const doc=await load(bytes),info=inspectDocument(doc);validFormBuilderDraft(draft,info);if(info.fieldNames.length+draft.fields.length>500)throw new Error('The completed copy supports at most 500 total fields.');if(!draft.fields.length)throw new Error('Add at least one reviewed field.');const before=preservation(doc),form=doc.getForm(),font=await doc.embedFont(StandardFonts.Helvetica);
 for(const item of draft.fields){
  if(item.type==='radio'&&item.widgets.length<2)throw new Error('Confirm at least two separately placed buttons for every radio group.');
  const factory={text:'createTextField',checkbox:'createCheckBox',dropdown:'createDropdown',list:'createOptionList',radio:'createRadioGroup'},field=form[factory[item.type]](item.name);
  field.acroField.dict.set(n('TU'),PDFHexString.fromText(item.label));if(item.required)field.enableRequired();if(item.readOnly)field.enableReadOnly();
  if(['dropdown','list'].includes(item.type)){
   const options=builderChoiceOptions(item),width=item.rect[2]-item.rect[0]-8;
   for(const option of options){try{font.encodeText(option.label);}catch{throw new Error('Choice labels need Western-font characters; export values and tooltips can use Unicode.');}if(font.widthOfTextAtSize(option.label,item.fontSize)>width)throw new Error('A choice label exceeds the reviewed field width. Enlarge the field, shorten its label or choose a smaller font.');}
   field.acroField.setOptions(options.map(option=>({value:PDFHexString.fromText(option.value),display:PDFHexString.fromText(option.label)})));field.disableMultiselect();field.disableSorting();if(item.type==='dropdown')field.disableEditing();field.clear();
  }
  if(item.type==='radio')field.enableMutualExclusion();
  for(const location of builderLocations(item)){
   const [l,b,r,t]=location.rect,options={x:l+.5,y:b+.5,width:r-l-1,height:t-b-1,borderWidth:1,borderColor:rgb(.12,.35,.43),backgroundColor:undefined,textColor:rgb(.05,.1,.15),font};
   if(item.type==='radio'){field.addOptionToPage(location.value,doc.getPage(location.page),options);field.acroField.getWidgets().at(-1).dict.set(n('TU'),PDFHexString.fromText(location.label));}else{field.addToPage(doc.getPage(location.page),options);field.acroField.getWidgets().at(-1).dict.set(n('TU'),PDFHexString.fromText(item.label));}
  }
  if(item.type==='text'){field.setMaxLength(2000);field.setFontSize(item.fontSize);field.updateAppearances(font);}
  if(item.type==='checkbox')field.uncheck();
  if(item.type==='radio')field.clear();
  if(['dropdown','list'].includes(item.type)){
   field.setFontSize(item.fontSize);if(item.type==='dropdown')field.select('Choose an option');field.updateAppearances(font);
   if(item.type==='dropdown'){field.acroField.dict.set(n('V'),PDFHexString.fromText(''));field.acroField.dict.delete(n('I'));field.disableEditing();}
  }
 }
 const output=await doc.save({updateFieldAppearances:false});if(output.length>100*1024*1024)throw new Error('The fillable copy exceeds 100 MB.');
 const reopened=await load(output),actual=inspectDocument(reopened),after=preservation(reopened);if(actual.pageCount!==info.pageCount||actual.fieldNames.length!==info.fieldNames.length+draft.fields.length)throw new Error('The created form field/page count changed on reopen.');
 for(let index=0;index<before.pages.length;index++){const a=before.pages[index],b=after.pages[index];if(pageGeometry(a)!==pageGeometry(b)||!sameArtwork(a,b)||a.annotations.some((ref,i)=>b.annotations[i]!==ref))throw new Error('Existing page artwork, geometry or annotation order changed unexpectedly.');}
 for(const {ref,text}of before.dictionaryRefs.values())if(reopened.context.lookup(ref)?.toString()!==text)throw new Error('An existing field or annotation changed unexpectedly.');
 for(const item of draft.fields){
  const field=reopened.getForm().getField(item.name),widgets=field.acroField.getWidgets(),label=field.acroField.dict.lookup(n('TU')).decodeText(),types={text:PDFTextField,checkbox:PDFCheckBox,dropdown:PDFDropdown,list:PDFOptionList,radio:PDFRadioGroup},locations=builderLocations(item);
  if(!(field instanceof types[item.type])||label!==item.label||field.isRequired()!==item.required||field.isReadOnly()!==item.readOnly||widgets.length!==locations.length)throw new Error('A created field lost its type, label, flags or widget count.');
  for(const [index,widget]of widgets.entries()){const location=locations[index],rect=widget.getRectangle();if([rect.x,rect.y,rect.x+rect.width,rect.y+rect.height].some((value,i)=>Math.abs(value-location.rect[i])>.01)||String(widget.dict.get(n('P')))!==String(reopened.getPage(location.page).ref)||!widget.dict.get(n('AP')))throw new Error('A field appearance or reviewed location changed.');if(widget.dict.lookup(n('TU')).decodeText()!==(item.type==='radio'?location.label:item.label))throw new Error('A widget tooltip changed after reopening.');if(item.type==='radio'&&String(widget.dict.get(n('AS')))!=='/Off')throw new Error('A radio option changed its initial unselected state.');}
  if(['text','dropdown','list'].includes(item.type)){const appearance=field.acroField.getDefaultAppearance()||'',size=Number([...appearance.matchAll(/([0-9]+(?:\.[0-9]+)?)\s+Tf/g)].at(-1)?.[1]);if(!Number.isFinite(size)||Math.abs(size-item.fontSize)>.001)throw new Error('A field changed its reviewed font size.');}
  if(item.type==='text'&&(field.getMaxLength()!==2000||(field.getText()||'')))throw new Error('A new text field changed its empty value or length limit.');
  if(item.type==='checkbox'&&field.isChecked())throw new Error('A new checkbox must remain unchecked.');
  if(item.type==='radio'&&(field.getSelected()!==undefined||!field.isMutuallyExclusive()||JSON.stringify(field.getOptions())!==JSON.stringify(item.widgets.map(widget=>widget.value))))throw new Error('A radio group changed its export values, exclusivity or initial unselected value.');
  if(['dropdown','list'].includes(item.type)){const options=field.acroField.getOptions().map(option=>({value:option.value.decodeText(),label:(option.display||option.value).decodeText()}));if(JSON.stringify(options)!==JSON.stringify(builderChoiceOptions(item))||field.isMultiselect()||item.type==='dropdown'&&field.isEditable()||JSON.stringify(field.getSelected())!==JSON.stringify(item.type==='dropdown'?['']:[]))throw new Error('A choice field changed its label/export pairs, selection mode or initial value.');}
 }
 const sourceSha256=hash(bytes),sha256=hash(output);return {bytes:output,pageCount:info.pageCount,expected:draft.fields,sha256,report:{version:1,verified:true,sourceSha256,sha256,sourceBytes:bytes.length,outputBytes:output.length,pageCount:info.pageCount,addedFields:draft.fields.length,addedWidgets:draft.fields.reduce((sum,item)=>sum+builderLocations(item).length,0),originalFields:info.fieldNames.length,originalWidgets:info.widgets.length,outputFields:actual.fieldNames.length,outputWidgets:actual.widgets.length,retainedDictionaries:before.dictionaryRefs.size,scope:'The copy was independently reopened. Reviewed new field types, tooltips, flags, initial values, choice/export pairs, fonts and widget rectangles were checked. Original page content stream payloads, crop/media boxes, rotation, annotation ordering, field dictionaries and annotation dictionaries matched. This is form-field creation, not sanitation, script removal, accessibility certification or signature validation.'}};
}
async function inspect(bytes){const result=inspectDocument(await load(bytes));return {...result,sourceSha256:hash(bytes)};}
module.exports={inspect,create};
