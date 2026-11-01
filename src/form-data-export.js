const MAX_BYTES=2*1024*1024,MAX_FIELDS=500;
const encoder=new TextEncoder();
function plain(value,max,label){if(typeof value!=='string'||value.length>max||value.includes('\0'))throw new Error(`${label} exceeds the form-data export limits.`);return value;}
function validateValue(value,field){
  if(field.type==='text'){plain(value,2000,'A field value');if(value.length>(field.maxLength??2000)||!field.multiline&&/[\r\n]/.test(value))throw new Error(`Check the supported text length and line breaks for “${field.label}” before exporting.`);return value;}
  if(field.type==='checkbox'){if(typeof value!=='boolean')throw new Error('A checkbox does not contain a valid boolean value.');return value;}
  if(field.type==='radio'){plain(value,512,'A radio value');if(value&&!field.options.some(option=>option.value===value)||!value&&!field.canClear&&field.value)throw new Error('Choose a supported radio value before exporting.');return value;}
  if(field.type==='dropdown'||field.type==='list'){
    if(!Array.isArray(value)||value.length>500||!field.multi&&value.length>1||new Set(value).size!==value.length)throw new Error('A choice field contains unsupported values.');
    for(const item of value){plain(item,512,'A choice value');if(!field.editable&&!field.options.some(option=>option.value===item))throw new Error('Choose supported field options before exporting.');}return [...value];
  }
  throw new Error('This field type cannot be exported as supported form data.');
}
export function formDataSnapshot(info,values,{sourceName,labels=[],placementCount=0}={}){
  if(!info||!Array.isArray(info.fields)||info.fields.length>MAX_FIELDS||!Array.isArray(values)||values.length>MAX_FIELDS)throw new Error('Form-data export supports up to 500 fields.');
  const allowed=new Set(info.fields.filter(field=>field.supported&&!field.sensitive&&!field.valueWithheld&&!field.readOnly&&['text','checkbox','radio','dropdown','list'].includes(field.type)).map(field=>field.name));
  const current=new Map();for(const item of values){if(!item||!allowed.has(item.name))continue;if(current.has(item.name))throw new Error('The current form values are ambiguous.');plain(item.name,512,'A field name');current.set(item.name,item.value);}
  const fields=[],seen=new Set();
  for(const field of info.fields){
    if(!field.supported||field.sensitive||field.valueWithheld||!['text','checkbox','radio','dropdown','list'].includes(field.type)||field.readOnly)continue;
    const name=plain(field.name,512,'A field name');if(seen.has(name))throw new Error('Duplicate field names cannot be exported reliably.');seen.add(name);
    // Unsupported fields (including passwords, file selectors, rich text,
    // calculated fields and certificate signatures) never enter the snapshot.
    const value=validateValue(current.has(name)?current.get(name):field.value,field);
    const locations=field.locations;if(!Array.isArray(locations)||locations.length>2000)throw new Error('A field has too many page locations.');
    const pages=[...new Set(locations.map(location=>location.page))].map(index=>{if(!Number.isInteger(index)||index<0||index>=info.pageCount)throw new Error('A field has an unsupported page location.');return {physical:index+1,printedLabel:typeof labels[index]==='string'?labels[index].slice(0,100):null};});
    fields.push({name,label:plain(field.label||name,512,'A field label'),type:field.type,required:!!field.required,pages,value,edited:JSON.stringify(value)!==JSON.stringify(field.value)});
  }
  if(!fields.length)throw new Error('This document has no supported editable form fields to export. Visual placements and unsupported fields are excluded.');
  const snapshot={format:'PDFix supported-form-data',version:1,sourceName:plain(sourceName||'PDF',512,'The source name'),exportedAt:new Date().toISOString(),scope:'Current supported AcroForm values, including unsaved PDFix edits. This export does not fill, modify or save the PDF.',omittedFields:info.fields.length-fields.length,omittedVisualPlacements:Number.isSafeInteger(placementCount)?placementCount:0,calculationsPresent:!!info.hasCalculations,limitations:['Only supported editable text, checkbox, radio, dropdown and list fields are included.','Password, file-selector, rich-text, read-only, calculated, unsupported and certificate-signature fields are excluded.','Visual signatures, initials, typed placements, images, pen strokes and saved-signature assets are excluded.','PDF calculations and scripts do not run. Values may need manual review.','Choice values are original PDF export values; labels can differ. JSON preserves strings, booleans and choice arrays.','Author/date/signature validity and complete form interchange are not established. Local recovery is kept.'],fields};
  formDataBytes(snapshot,'json');return snapshot;
}
const safeCell=value=>{const string=typeof value==='string'?value:String(value);const safe=/^[\s\uFEFF]*[=+\-@]/u.test(string)||/^[\t\r\n]/.test(string)?"'"+string:string;return '"'+safe.replaceAll('"','""')+'"';};
export function formDataBytes(snapshot,format){
  if(!snapshot||snapshot.format!=='PDFix supported-form-data'||!Array.isArray(snapshot.fields)||snapshot.fields.length>MAX_FIELDS)throw new Error('Build a supported form-data snapshot before exporting.');
  let output;
  if(format==='json')output=JSON.stringify(snapshot,null,2)+'\n';
  else if(format==='csv'){
    const rows=[['source','scope','omitted_fields','omitted_visual_placements','calculations_present','name','label','type','required','physical_pages','printed_page_labels','edited','value']];
    for(const field of snapshot.fields)rows.push([snapshot.sourceName,'Current supported values including unsaved edits',snapshot.omittedFields,snapshot.omittedVisualPlacements,snapshot.calculationsPresent,field.name,field.label,field.type,field.required,field.pages.map(page=>page.physical).join('; '),JSON.stringify(field.pages.map(page=>page.printedLabel)),field.edited,Array.isArray(field.value)?JSON.stringify(field.value):field.value]);
    output='\uFEFF'+rows.map(row=>row.map(safeCell).join(',')).join('\r\n')+'\r\n';
  }else throw new Error('Choose JSON or CSV for supported form data.');
  const bytes=encoder.encode(output);if(bytes.length>MAX_BYTES)throw new Error('The form-data copy exceeds 2 MB. Reduce long field values before exporting.');return {bytes,text:output};
}
export function reviewFormData(snapshot){
  return new Promise(resolve=>{
    const dialog=document.createElement('dialog');dialog.className='recovery-cleanup';dialog.style.width='min(760px, calc(100vw - 40px))';dialog.style.maxHeight='calc(100dvh - 40px)';dialog.style.overflow='auto';
    const heading=document.createElement('h2');heading.textContent='Review supported form data';const headingId='form-data-'+crypto.randomUUID();heading.id=headingId;dialog.setAttribute('aria-labelledby',headingId);
    const notice=document.createElement('p');notice.textContent=`${snapshot.fields.length} supported fields, including current unsaved values. ${snapshot.omittedFields} unsupported/read-only fields and ${snapshot.omittedVisualPlacements} visual placements are excluded. This text copy may contain private personal information. The PDF and recovery drafts are kept.`;
    const policy=document.createElement('p');policy.textContent='JSON preserves exact field strings, checkbox booleans and choice arrays. CSV stores arrays as JSON text and prefixes formula-looking cells with an apostrophe for spreadsheet safety. Calculations are not run; review the values manually.';
    const formatLabel=document.createElement('label');formatLabel.textContent='Format ';const format=document.createElement('select');format.setAttribute('aria-label','Form data output format');for(const value of ['json','csv']){const option=document.createElement('option');option.value=value;option.textContent=value.toUpperCase();format.append(option);}formatLabel.append(format);
    const preview=document.createElement('textarea');preview.readOnly=true;preview.setAttribute('aria-label','Supported field data export preview');preview.style.cssText='display:block;box-sizing:border-box;width:100%;min-height:240px;max-height:45dvh;margin:12px 0;font:12px/1.5 ui-monospace,monospace';
    const reviewLabel=document.createElement('label'),review=document.createElement('input');review.type='checkbox';reviewLabel.append(review,document.createTextNode(' I reviewed the included field values and exclusions.'));
    const actions=document.createElement('div');actions.className='cleanup-actions';const cancel=document.createElement('button'),save=document.createElement('button');cancel.type=save.type='button';cancel.className='secondary';save.className='primary';cancel.textContent='Keep editing';save.textContent='Choose filename and save';save.disabled=true;actions.append(cancel,save);
    const status=document.createElement('p');status.setAttribute('role','status');let selected=null;
    const refresh=()=>{review.checked=false;save.disabled=true;try{selected=formDataBytes(snapshot,format.value);preview.value=selected.text;status.textContent='A new JSON or CSV copy will be saved. The original PDF is unchanged.';}catch(error){selected=null;preview.value='';status.textContent=error.message;}};
    format.onchange=refresh;review.onchange=()=>{save.disabled=!selected||!review.checked;};cancel.onclick=()=>dialog.close();save.onclick=()=>{if(selected&&review.checked){const result={ext:format.value,bytes:selected.bytes};dialog.close();resolve(result);}};
    dialog.addEventListener('close',()=>{dialog.remove();resolve(null);},{once:true});dialog.append(heading,notice,policy,formatLabel,preview,reviewLabel,actions,status);document.body.append(dialog);refresh();dialog.showModal();
  });
}
