import {PDFDocument,PDFName,PDFDict,PDFArray,PDFNumber,PDFHexString,PDFRawStream,PDFRef,PDFInvalidObject,PDFTextField,PDFCheckBox,PDFRadioGroup,PDFDropdown,PDFOptionList,StandardFonts,pushGraphicsState,popGraphicsState,concatTransformationMatrix,setStrokingRgbColor,setLineWidth,setLineCap,moveTo,lineTo,stroke} from 'pdf-lib';
import {validateFormDraft,pngBytes} from './form-model.js';
import {evaluateFormCalculations} from './form-calculation-model.js';
import {validateFormTabOrders} from './form-tab-order-model.js';
const n=PDFName.of,MAX=100*1024*1024;
const decode=(dict,key)=>{const value=dict.context.lookup(dict.get(n(key)));return value?.decodeText?.()||'';};
async function load(bytes){
  if(!bytes?.length||bytes.length>MAX)throw new Error('Fill and sign needs a PDF under 100 MB.');
  let doc;try{doc=await PDFDocument.load(bytes,{throwOnInvalidObject:true,updateMetadata:false,capNumbers:false});}catch{throw new Error('This PDF is damaged or protected. Obtain an owner-authorized unrestricted copy.');}
  if(doc.isEncrypted||doc.context.trailerInfo.Encrypt||!doc.getPageCount()||doc.getPageCount()>500)throw new Error('Encrypted writing or more than 500 pages is unsupported.');
  if(doc.catalog.get(n('Perms')))throw new Error('Certified or permission-controlled PDFs cannot be changed here.');
  const objects=doc.context.enumerateIndirectObjects();if(objects.length>100000)throw new Error('This PDF exceeds the safe object limit.');
  const stack=objects.map(([,value])=>({value,depth:0})),seen=new WeakSet(),refs=new Set();let traversed=0;
  while(stack.length){let {value,depth}=stack.pop();if(++traversed>300000||depth>80)throw new Error('This PDF exceeds the bounded form traversal limit.');
    if(value instanceof PDFRef){const key=String(value);if(refs.has(key))continue;refs.add(key);value=doc.context.lookup(value);if(!value)throw new Error('An unresolved PDF object cannot be preserved.');}
    if(!value||typeof value!=='object'||seen.has(value))continue;seen.add(value);
    if(value instanceof PDFInvalidObject||value instanceof PDFNumber&&(!Number.isFinite(value.asNumber())||Math.abs(value.asNumber())>1e15))throw new Error('Malformed PDF objects cannot be preserved.');
    if(value instanceof PDFRawStream){stack.push({value:value.dict,depth:depth+1});continue;}
    if(value instanceof PDFDict){if(value.has(n('ByteRange'))||value.has(n('DocMDP'))||value.has(n('UR3'))||String(doc.context.lookup(value.get(n('Type'))))==='/Sig'||String(doc.context.lookup(value.get(n('FT'))))==='/Sig'&&value.get(n('V')))throw new Error('An existing digital signature cannot be changed by fill and sign.');
      if(value.has(n('XFA')))throw new Error('XFA forms are unsupported. Request a regular fillable PDF.');
      for(const [,child]of value.entries())stack.push({value:child,depth:depth+1});
    }else if(value instanceof PDFArray){if(value.size()>100000)throw new Error('A PDF array exceeds its bounded form limit.');for(let index=0;index<value.size();index++)stack.push({value:value.get(index),depth:depth+1});}
  }
  const form=doc.catalog.lookupMaybe(n('AcroForm'),PDFDict);if(form?.get(n('XFA')))throw new Error('XFA forms are unsupported. Request a regular fillable PDF.');
  return doc;
}
function pagesOf(doc){return doc.getPages().map(page=>{const c=page.getCropBox(),m=page.getMediaBox(),box=[Math.max(c.x,m.x),Math.max(c.y,m.y),Math.min(c.x+c.width,m.x+m.width),Math.min(c.y+c.height,m.y+m.height)],rotation=((page.getRotation().angle%360)+360)%360;if(box.some(v=>!Number.isFinite(v)||Math.abs(v)>1e7)||box[2]<=box[0]||box[3]<=box[1]||![0,90,180,270].includes(rotation))throw new Error('A page has an invalid visible boundary or rotation.');return {box,rotation};});}
function fieldActions(dict,widgets){
 const actions=[],seen=new Set();let count=0;
 const walk=(raw,trigger,scope,depth=0)=>{
  if(!raw)return;if(depth>16||++count>64)throw new Error('A form action chain exceeds the bounded inventory limit.');
  const value=dict.context.lookup(raw);if(value instanceof PDFArray){for(const item of value.asArray())walk(item,trigger,scope,depth+1);return;}
  if(!(value instanceof PDFDict)){actions.push({trigger,scope,kind:'Unsupported action structure'});return;}if(seen.has(value))return;seen.add(value);
  const kind=value.context.lookup(value.get(n('S')));actions.push({trigger,scope,kind:kind instanceof PDFName?kind.decodeText().slice(0,80):'Unspecified',scriptPresent:!!value.get(n('JS'))});walk(value.get(n('Next')),trigger,scope,depth+1);
 };
 for(const[item,scope]of [[dict,'field'],...widgets.map(widget=>[widget.dict,'widget'])]){
  walk(item.get(n('A')),'Activate',scope);const aa=item.lookupMaybe(n('AA'),PDFDict);if(!aa)continue;
  for(const trigger of ['K','F','V','C','E','X','D','U','Fo','Bl','PO','PC','PV','PI'])walk(aa.get(n(trigger)),trigger,scope);
 }
 return actions;
}
function schema(doc){
  const form=doc.getForm(),fields=form.getFields();if(fields.length>500)throw new Error('Fill and sign supports up to 500 fields.');if(new Set(fields.map(field=>field.getName())).size!==fields.length)throw new Error('Duplicate form field names are ambiguous.');
  const widgetPages=new Map();let widgets=0;
  doc.getPages().forEach((page,index)=>{const annotations=page.node.lookupMaybe(n('Annots'),PDFArray);if(annotations?.size()>2000)throw new Error('A page has too many annotations.');for(const ref of annotations?.asArray()||[]){const dict=doc.context.lookup(ref,PDFDict);if(String(doc.context.lookup(dict.get(n('Subtype'))))==='/Widget'){if(++widgets>2000)throw new Error('This form has too many widgets.');if(widgetPages.has(dict))throw new Error('A widget is shared between pages. Its location is ambiguous.');widgetPages.set(dict,index);}}});
  return fields.map(field=>{
    const name=field.getName();if(!name||name.length>512)throw new Error('A form field name exceeds its limit.');
    const dict=field.acroField.dict,type=field instanceof PDFTextField?'text':field instanceof PDFCheckBox?'checkbox':field instanceof PDFRadioGroup?'radio':field instanceof PDFDropdown?'dropdown':field instanceof PDFOptionList?'list':'unsupported';
    const sensitive=type==='text'&&field.isPassword(),actions=fieldActions(dict,field.acroField.getWidgets());
    const result={name,label:decode(dict,'TU').slice(0,512)||name,type,required:field.isRequired(),readOnly:field.isReadOnly()||sensitive,sensitive,valueWithheld:sensitive,locations:[],value:sensitive?null:'',options:[],actions,reason:''};
    for(const widget of field.acroField.getWidgets()){
      const page=widgetPages.get(widget.dict),r=widget.getRectangle(),flags=widget.dict.lookupMaybe(n('F'),PDFNumber)?.asNumber()||0;
      if(page!==undefined&&!(flags&(1|2|32))&&[r.x,r.y,r.width,r.height].every(Number.isFinite)&&r.width>0&&r.height>0)result.locations.push({page,rect:[r.x,r.y,r.x+r.width,r.y+r.height]});
    }
    if(!result.locations.length)result.reason='No visible supported field location.';
    if(type==='text'){if(!sensitive)result.value=field.getText()||'';result.multiline=field.isMultiline();result.maxLength=Math.min(field.getMaxLength()??2000,2000);if(field.isFileSelector()||field.isRichFormatted())result.reason='File-selector or rich-text fields are not edited here.';}
    if(type==='checkbox')result.value=field.isChecked();
    if(type==='radio'){result.options=field.getOptions().map(value=>({value,label:value}));result.value=field.getSelected()||'';result.canClear=field.isOffToggleable();}
    if(type==='dropdown'||type==='list'){
      result.options=field.acroField.getOptions().map(option=>({value:option.value.decodeText(),label:(option.display||option.value).decodeText()}));result.value=field.getSelected();result.multi=field.isMultiselect();result.editable=type==='dropdown'&&field.isEditable();
    }
    if(type==='unsupported')result.reason=String(doc.context.lookup(dict.get(n('FT'))))==='/Sig'?'Certificate signature field; visual signing does not complete this field.':'This field type cannot be filled here.';
    const aa=dict.lookupMaybe(n('AA'),PDFDict);if(aa?.get(n('C')))result.reason='Calculated field; PDF calculations are not run.';
    if(result.readOnly)result.reason='Read-only field.';
    if(JSON.stringify(result.value).length>20000||result.options.length>500||result.options.some(o=>o.value.length>512||o.label.length>512))throw new Error('A field value or option list exceeds its limit.');
    if(new Set(result.options.map(o=>o.value)).size!==result.options.length)result.reason='Duplicate export values make this choice field ambiguous.';
    if(sensitive)result.reason='Password field: its value is withheld, not read or edited, and excluded from field-data export and recovery.';
    result.supported=!result.reason;return result;
  });
}
const widgetId=ref=>`pdfix-widget-${ref.objectNumber}-${ref.generationNumber}`;
function tabOrderPages(doc,fields){
 const boundaries=pagesOf(doc),owners=new Map(),ambiguous=new Set();for(const field of doc.getForm().getFields())for(const widget of field.acroField.getWidgets()){if(owners.has(widget.dict))ambiguous.add(widget.dict);owners.set(widget.dict,fields.find(item=>item.name===field.getName()));}
 const allRefs=new Set(),repeated=new Set();for(const page of doc.getPages())for(const ref of page.node.lookupMaybe(n('Annots'),PDFArray)?.asArray()||[]){const key=String(ref);if(allRefs.has(key))repeated.add(key);allRefs.add(key);}
 const version=doc.catalog.get(n('Version')),versionValue=version?String(doc.context.lookup(version)):'';
 return doc.getPages().map((page,index)=>{
  const raw=page.node.get(n('Tabs')),tabs=raw?doc.context.lookup(raw):null,mode=tabs instanceof PDFName?tabs.decodeText():tabs?'unsupported':'',annotations=page.node.lookupMaybe(n('Annots'),PDFArray)?.asArray()||[],widgets=[];let reason='';
  if(doc.catalog.get(n('StructTreeRoot'))||page.node.has(n('StructParents'))||mode==='S')reason='Tagged or structure-ordered pages need a tag-tree-aware navigation editor.';
  else if(versionValue&&!/^\/(?:1\.[0-7]|2\.0)$/.test(versionValue))reason='An unsupported declared PDF version cannot be upgraded safely.';
  else if(!['','R','C','A','W'].includes(mode))reason='This page has an unsupported keyboard order declaration.';
  for(const ref of annotations){
   const dict=doc.context.lookup(ref,PDFDict),owner=owners.get(dict),flags=dict.lookupMaybe(n('F'),PDFNumber)?.asNumber()||0,location=owner?.locations.find(item=>item.page===index),parent=dict.get(n('P'));
   if(String(doc.context.lookup(dict.get(n('Subtype'))))!=='/Widget'){reason ||= 'Pages mixing widgets with links, comments or other annotations are not reordered.';continue;}
   if(!(ref instanceof PDFRef)||repeated.has(String(ref))||ambiguous.has(dict)||!owner||!owner.supported||owner.sensitive||!location||!Number.isInteger(flags)||flags<0||flags>2147483647||flags&(1|2|32)||parent&&String(parent)!==String(page.ref)||dict.has(n('StructParent'))){reason ||= 'This page contains direct, shared, orphaned, protected, hidden or unsupported widgets.';continue;}
   if(!Number.isInteger(ref.objectNumber)||ref.objectNumber<1||ref.objectNumber>9999999999||!Number.isInteger(ref.generationNumber)||ref.generationNumber<0||ref.generationNumber>65535){reason ||= 'A widget reference exceeds the supported identity limits.';continue;}
   const rectangle=dict.lookupMaybe(n('Rect'),PDFArray)?.asArray().map(value=>doc.context.lookup(value));if(!rectangle||rectangle.length!==4||rectangle.some(value=>!(value instanceof PDFNumber)||!Number.isFinite(value.asNumber()))){reason ||= 'A widget has an unsupported rectangle.';continue;}
   const rect=rectangle.map(value=>value.asNumber());if(rect[2]<=rect[0]||rect[3]<=rect[1]||rect.some(value=>Math.abs(value)>1e7)){reason ||= 'A widget has an unsupported rectangle.';continue;}
   const box=boundaries[index].box;if(rect[0]<box[0]||rect[1]<box[1]||rect[2]>box[2]||rect[3]>box[3]){reason ||= 'A widget is outside the visible source page.';continue;}
   widgets.push({id:widgetId(ref),name:owner.name,label:owner.label,page:index,rect});
  }
  if(annotations.length<2)reason ||= 'A custom keyboard order needs at least two widgets on the page.';
  return {page:index,mode,supported:!reason,reason,widgets};
 });
}
function applyTabOrders(doc,orders,info){
 const valid=validateFormTabOrders(orders,info);for(const order of valid){const page=doc.getPage(order.page),refs=page.node.lookup(n('Annots'),PDFArray).asArray(),byId=new Map(refs.map(ref=>[widgetId(ref),ref]));page.node.set(n('Annots'),doc.context.obj(order.widgets.map(id=>byId.get(id))));page.node.set(n('Tabs'),n('A'));}
 if(valid.length)doc.catalog.set(n('Version'),n('2.0'));return valid;
}
export async function inspectFormPdf(bytes){const doc=await load(bytes),pages=pagesOf(doc),fields=schema(doc);return {pages,fields,tabOrderPages:tabOrderPages(doc,fields),pageCount:pages.length,hasCalculations:!!doc.getForm().acroForm.dict.get(n('CO'))||fields.some(field=>field.actions.some(action=>action.trigger==='C')),values:fields.filter(f=>f.supported&&!f.sensitive).map(f=>({name:f.name,value:f.value}))};}
function validValue(item,field){
  const v=item.value;if(field.type==='text'&&(typeof v!=='string'||v.length>field.maxLength||!field.multiline&&/[\r\n]/.test(v)))throw new Error(`Check the length/line breaks for “${field.label}”.`);
  if(field.type==='checkbox'&&typeof v!=='boolean')throw new Error('A checkbox value is invalid.');
  if(field.type==='radio'&&(typeof v!=='string'||v&&!field.options.some(o=>o.value===v)||!v&&!field.canClear&&field.value))throw new Error('Choose a supported radio value.');
  if(['dropdown','list'].includes(field.type)&&(!Array.isArray(v)||!field.multi&&v.length>1||new Set(v).size!==v.length||v.some(value=>!field.options.some(o=>o.value===value)&&!field.editable)))throw new Error('Choose only supported form options.');
}
function transform(rect,rotation){const [l,b,r,t]=rect,w=r-l,h=t-b;return rotation===90?[0,1,-1,0,r,b]:rotation===180?[-1,0,0,-1,r,t]:rotation===270?[0,-1,1,0,l,t]:[1,0,0,1,l,b];}
async function overlay(doc,item,fonts){
  const page=doc.getPage(item.page),w=item.rect[2]-item.rect[0],h=item.rect[3]-item.rect[1],vertical=item.rotation%180!==0,width=vertical?h:w,height=vertical?w:h;
  page.pushOperators(pushGraphicsState(),concatTransformationMatrix(...transform(item.rect,item.rotation)));
  if(item.asset.type==='text'){
    const font=item.kind==='signature'||item.kind==='initials'?fonts.signature:fonts.text,lines=item.asset.text.split(/\r\n?|\n/),size=Math.min(32,(height-4)/Math.max(1,lines.length*1.2),...lines.map(line=>{let measured;try{measured=font.widthOfTextAtSize(line,1);}catch{throw new Error('Typed text currently uses a Western font. Draw or import an image for other scripts.');}return (width-4)/Math.max(1,measured);}));
    if(size<6)throw new Error('This placement is too small to read. Draw a larger rectangle.');for(let i=0;i<lines.length;i++)page.drawText(lines[i],{x:2,y:height-2-size-i*size*1.2,size,font});
  }else if(item.asset.type==='image'){
    const image=await doc.embedPng(pngBytes(item.asset.data)),factor=Math.min(width/image.width,height/image.height);page.drawImage(image,{x:(width-image.width*factor)/2,y:(height-image.height*factor)/2,width:image.width*factor,height:image.height*factor});
  }else{
    page.pushOperators(setStrokingRgbColor(.06,.12,.2),setLineWidth(Math.min(2,Math.max(.6,height/70))),setLineCap(1));for(const path of item.asset.strokes){page.pushOperators(moveTo(path[0]*width,(1-path[1])*height));for(let i=2;i<path.length;i+=2)page.pushOperators(lineTo(path[i]*width,(1-path[i+1])*height));page.pushOperators(stroke());}
  }
  page.pushOperators(popGraphicsState());
}
function formRetention(doc,hash,changedNames=new Set()){
  const changedWidgets=new Set();for(const field of doc.getForm().getFields())if(changedNames.has(field.getName()))for(const widget of field.acroField.getWidgets())changedWidgets.add(widget.dict);
  const dictionaries=new Map(),fields=new Map();
  let resourceVisits=0;const resourceHash=raw=>{const stack=[{value:raw,depth:0}],refs=new Set(),seen=new WeakSet(),parts=[];while(stack.length){let {value,depth}=stack.pop();if(++resourceVisits>300000||depth>80)throw new Error('Page resource preservation exceeds its bounded traversal limit.');if(value instanceof PDFRef){const key=String(value);if(refs.has(key))continue;refs.add(key);parts.push(key);value=doc.context.lookup(value);}if(!value)continue;if(typeof value==='object'){if(seen.has(value))continue;seen.add(value);}if(typeof value?.getContents==='function'){parts.push(value.dict.toString(),hash(value.getContents()));stack.push({value:value.dict,depth:depth+1});}else if(value instanceof PDFDict){parts.push(value.toString());for(const [,child]of value.entries())stack.push({value:child,depth:depth+1});}else if(value instanceof PDFArray){parts.push(value.toString());for(const child of value.asArray())stack.push({value:child,depth:depth+1});}else parts.push(String(value));}return hash(new TextEncoder().encode(JSON.stringify(parts)));};
  const pages=doc.getPages().map(page=>{// A page with one content stream stores a reference, not an array; keep that reference so it can be matched after saving.
  const entry=page.node.get(n('Contents')),raw=entry instanceof PDFRef?doc.context.lookup(entry):entry,items=raw instanceof PDFArray?raw.asArray():entry?[entry]:[],contents=items.map(ref=>{const stream=doc.context.lookup(ref);if(typeof stream?.getContents!=='function')throw new Error('An unsupported page stream cannot be preserved.');return {ref:String(ref),sha256:hash(stream.getContents())};});const annotations=page.node.lookupMaybe(n('Annots'),PDFArray)?.asArray()||[];for(const ref of annotations){const dict=doc.context.lookup(ref,PDFDict);if(!changedWidgets.has(dict))dictionaries.set(String(ref),dict.toString());}const resources=[];for(const [category,rawValue]of page.node.Resources()?.entries()||[]){const value=doc.context.lookup(rawValue);if(value instanceof PDFDict)for(const [key,item]of value.entries())resources.push({key:String(category)+'/'+String(key),sha256:resourceHash(item)});else resources.push({key:String(category),sha256:resourceHash(rawValue)});}resources.sort((a,b)=>a.key.localeCompare(b.key));return {media:page.getMediaBox(),crop:page.getCropBox(),rotation:page.getRotation().angle,contents,annotations:annotations.map(String),tabs:String(page.node.get(n('Tabs'))||''),resources};});
  const appearance=field=>{const result=[],stack=field.acroField.getWidgets().map(widget=>widget.dict.get(n('AP'))),seen=new Set();let visited=0;while(stack.length){let value=stack.pop();if(++visited>20000)throw new Error('Field appearance preservation exceeds its bounded traversal limit.');if(value instanceof PDFRef){const key=String(value);if(seen.has(key))continue;seen.add(key);value=doc.context.lookup(value);}if(value instanceof PDFRawStream||typeof value?.getContents==='function'){result.push(hash(value.getContents()));stack.push(value.dict);}else if(value instanceof PDFDict){for(const [,child]of value.entries())stack.push(child);}else if(value instanceof PDFArray)stack.push(...value.asArray());}return result;};
  for(const field of doc.getForm().getFields())fields.set(field.getName(),{dictionary:field.acroField.dict.toString(),widgets:field.acroField.getWidgets().map(widget=>widget.dict.toString()),appearances:appearance(field)});
  const catalog=doc.catalog.clone();catalog.delete(n('Version'));return {pages,dictionaries,fields,catalog:catalog.toString(),version:String(doc.catalog.get(n('Version'))||'')};
}
function verifyRetention(before,expected,actual,changedNames,tabOrders=[]){
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);if(actual.pages.length!==before.pages.length||actual.fields.size!==before.fields.size)throw new Error('The filled copy changed its page or field inventory.');
  if(before.catalog!==actual.catalog||expected.catalog!==actual.catalog||expected.version!==actual.version||(!tabOrders.length&&before.version!==actual.version)||tabOrders.length&&actual.version!=='/2.0')throw new Error('The catalog or intended PDF version changed.');
  for(let index=0;index<before.pages.length;index++){const a=before.pages[index],b=actual.pages[index],wanted=expected.pages[index],order=tabOrders.find(item=>item.page===index);if(!same({...a,contents:null,resources:null,annotations:order?null:a.annotations,tabs:order?null:a.tabs},{...b,contents:null,resources:null,annotations:order?null:b.annotations,tabs:order?null:b.tabs})||!same(wanted,b)||order&&(!same([...a.annotations].sort(),[...b.annotations].sort())||b.tabs!=='/A'))throw new Error('Page geometry, annotation order or generated overlay streams/resources changed on reopen.');let position=0;for(const content of a.contents){while(position<b.contents.length&&!same(b.contents[position],content))position++;if(position===b.contents.length)throw new Error('Original page artwork was not preserved.');position++;}for(const resource of a.resources)if(!b.resources.some(item=>same(item,resource)))throw new Error('An original page artwork resource changed.');}
  for(const [ref,value]of before.dictionaries)if(actual.dictionaries.get(ref)!==value)throw new Error('An unrelated page annotation changed.');
  for(const [name,value]of before.fields)if(!changedNames.has(name)&&!same(value,actual.fields.get(name)))throw new Error('An untouched or protected field changed.');
  for(const [name,value]of expected.fields)if(!same(value,actual.fields.get(name)))throw new Error('A saved field dictionary, widget or appearance stream changed on reopen.');
}
export async function filledPdf(bytes,draft,progress=()=>{},hash){
  if(typeof hash!=='function')throw new Error('Fill and sign output requires the contained native retention verifier.');
  const doc=await load(bytes),pages=pagesOf(doc),fields=schema(doc),valid=validateFormDraft(draft,pages),form=doc.getForm(),expected=[];
  const tabInfo={sourceSha256:hash(bytes),tabOrderPages:tabOrderPages(doc,fields)},tabOrders=validateFormTabOrders(valid.tabOrders,tabInfo);
  const changedNames=new Set(valid.values.filter(item=>JSON.stringify(item.value)!==JSON.stringify(fields.find(field=>field.name===item.name)?.value)).map(item=>item.name)),before=formRetention(doc,hash,changedNames);
  for(const result of evaluateFormCalculations(valid.calculations,fields,valid.values)){const value=valid.values.find(item=>item.name===result.target)?.value??fields.find(field=>field.name===result.target)?.value;if(value!==result.value)throw new Error('Review and apply current calculation results before writing the copy.');}
  const fonts={text:await doc.embedFont(StandardFonts.Helvetica),signature:await doc.embedFont(StandardFonts.TimesRomanItalic)};
  for(const item of valid.values){const field=fields.find(f=>f.name===item.name);if(!field?.supported)throw new Error('An unsupported or read-only field cannot be changed.');validValue(item,field);if(JSON.stringify(item.value)===JSON.stringify(field.value))continue;const f=form.getField(item.name);
    try{
      if(field.type==='text'){f.setText(item.value);f.updateAppearances(fonts.text);}
      if(field.type==='checkbox'){item.value?f.check():f.uncheck();if(f.needsAppearancesUpdate())f.updateAppearances();}
      if(field.type==='radio'){item.value?f.select(item.value):f.clear();if(f.needsAppearancesUpdate())f.updateAppearances();}
      if(['dropdown','list'].includes(field.type)){
        const labels=item.value.map(value=>field.options.find(o=>o.value===value)?.label??value);labels.length?f.select(labels):f.clear();f.updateAppearances(fonts.text);
        const values=item.value.map(PDFHexString.fromText);if(!values.length)f.acroField.dict.delete(n('V'));else f.acroField.dict.set(n('V'),values.length===1?values[0]:doc.context.obj(values));
        if(values.length>1)f.acroField.dict.set(n('I'),doc.context.obj(item.value.map(v=>field.options.findIndex(o=>o.value===v)).sort((a,b)=>a-b)));else f.acroField.dict.delete(n('I'));
      }
    }catch(error){if(error.message.includes('WinAnsi'))throw new Error(`“${field.label}” needs a supported Western font. Other scripts are not supported in edited form appearances yet.`);throw error;}
    expected.push({name:item.name,type:field.type,value:item.value,pdfValue:field.type==='radio'?f.acroField.getValue().decodeText():null});progress({stage:'Filling supported fields',current:expected.length,total:valid.values.length});
  }
  for(let i=0;i<valid.overlays.length;i++){await overlay(doc,valid.overlays[i],fonts);progress({stage:'Placing confirmed visual content',current:i+1,total:valid.overlays.length});}
  applyTabOrders(doc,tabOrders,tabInfo);
  const output=await doc.save({updateFieldAppearances:false});if(output.length>MAX)throw new Error('The filled copy exceeds 100 MB.');
  const intended=formRetention(doc,hash,changedNames),reopened=await load(output),actual=schema(reopened);verifyRetention(before,intended,formRetention(reopened,hash,changedNames),changedNames,tabOrders);if(reopened.getPageCount()!==pages.length||fields.length!==actual.length)throw new Error('Form output verification failed.');
  const reopenedOrders=tabOrderPages(reopened,actual);for(const order of tabOrders){const saved=reopenedOrders.find(page=>page.page===order.page);if(!saved?.supported||saved.mode!=='A'||JSON.stringify(saved.widgets.map(widget=>widget.id))!==JSON.stringify(order.widgets))throw new Error('The saved page keyboard order could not be independently verified.');}
  for(const field of fields){const saved=actual.find(f=>f.name===field.name),expectedValue=valid.values.find(v=>v.name===field.name)?.value??field.value;if(JSON.stringify(saved?.value)!==JSON.stringify(expectedValue))throw new Error('A saved field value could not be verified.');if(JSON.stringify({...field,value:null})!==JSON.stringify({...saved,value:null}))throw new Error('A field type, protection, choice mapping, action inventory or placement changed.');}
  return {bytes:output,pageCount:pages.length,expected,tabOrders,overlays:valid.overlays.map(o=>({page:o.page,rect:o.rect,text:o.asset.type==='text'?o.asset.text:null})),fieldCount:fields.length};
}
