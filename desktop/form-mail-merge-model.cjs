// Shared inert model mirrored from src/form-mail-merge-model.js.
// Bounded inert CSV and explicit mappings. No spreadsheet expressions are evaluated.
const MAIL_MERGE_LIMITS=Object.freeze({bytes:2*1024*1024,rows:200,columns:64,cell:2000});
const fail=message=>{throw new Error(message);};
const plain=value=>value&&Object.getPrototypeOf(value)===Object.prototype;
function text(value,max=2000){if(typeof value!=='string'||value.length>max||!value.isWellFormed()||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u202a-\u202e\u2066-\u2069]/.test(value))fail('CSV contains an oversized or unsupported text value.');return value;}
function parseMailMergeCsv(bytes){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>MAIL_MERGE_LIMITS.bytes)fail('Choose a UTF-8 CSV under 2 MiB.');
 let content;try{content=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{fail('CSV must use UTF-8 text encoding.');}
 const records=[];let record=[],cell='',quoted=false,closed=false,started=false;
 const finishCell=()=>{text(cell);record.push(cell);cell='';closed=false;started=false;if(record.length>MAIL_MERGE_LIMITS.columns)fail('CSV supports at most 64 columns.');};
 const finishRecord=()=>{finishCell();records.push(record);record=[];if(records.length>MAIL_MERGE_LIMITS.rows+1)fail('CSV supports at most 200 data rows. Split this CSV before importing.');};
 for(let i=0;i<content.length;i++){
  const c=content[i];if(quoted){if(c==='"'){if(content[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;}
  else if(c===',')finishCell();else if(c==='\r'||c==='\n'){if(c==='\r'&&content[i+1]==='\n')i++;finishRecord();}
  else if(c==='"'){if(started||closed||cell)fail('CSV has an unexpected quote. Quote the complete cell and double embedded quotes.');quoted=true;started=true;}
  else{if(closed)fail('CSV has text after a closing quote.');cell+=c;started=true;}
  if(cell.length>MAIL_MERGE_LIMITS.cell)fail('CSV cells support at most 2,000 characters.');
 }
 if(quoted)fail('CSV has an unclosed quoted cell.');if(record.length||cell||started||closed)finishRecord();
 if(records.length<2)fail('CSV needs a header and at least one data row.');
 const headers=records.shift().map(value=>text(value,128));if(headers.some(value=>!value.trim()||/[\r\n\t]/.test(value))||new Set(headers.map(value=>value.trim().toLowerCase())).size!==headers.length)fail('Use unique nonblank CSV headers of at most 128 characters.');
 const rows=records.map((cells,index)=>{if(cells.length!==headers.length)fail('CSV row '+(index+2)+' has a different number of columns than its header.');return {id:index+1,cells};});
 return {headers,rows};
}
function eligibleMailMergeField(field){const label=(field?.name+' '+field?.label).toLowerCase().normalize('NFKC').replace(/[^a-z0-9]/g,'');return !!field?.supported&&!field.sensitive&&!field.valueWithheld&&!field.readOnly&&!/password|passwd|passphrase|privatekey|secretkey|apikey|accesstoken|securitycode|cardcvv/.test(label);}
function mailMergeFieldValue(field,value){
 text(value);if(!eligibleMailMergeField(field))fail('The mapped PDF field is protected, sensitive or unsupported.');
 if(field.type==='text'){if(value.length>field.maxLength||!field.multiline&&/[\r\n]/.test(value))fail('Check text length or line breaks for '+field.label+'.');return value;}
 if(field.type==='checkbox'){if(/^(true|yes|checked|1)$/i.test(value.trim()))return true;if(/^(false|no|unchecked|0)$/i.test(value.trim()))return false;fail('Use yes/no or true/false for '+field.label+'.');}
 if(['radio','dropdown','list'].includes(field.type)){
  if(!value){if(field.type==='radio'&&!field.canClear&&field.value)fail('This radio field cannot be cleared.');return field.type==='radio'?'':[];}
  const matches=field.options.filter(option=>option.value===value);if(matches.length!==1)fail('Use one exact PDF option value for '+field.label+'.');return field.type==='radio'?matches[0].value:[matches[0].value];
 }
 fail('The mapped PDF field type is unsupported.');
}
function mailMergeFilename(value){
 let stem=String(value??'').normalize('NFKC').replace(/\.pdf$/i,'').replace(/[<>:"/\\|?*\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/g,'_').replace(/[. ]+$/,'').trim().slice(0,110).replace(/[. ]+$/,'');
 if(!stem)stem='Merged-row';if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(stem))stem='_'+stem;return stem+'.pdf';
}
function validateMailMergeRequest(value,session,info){
 if(!plain(value)||Object.keys(value).sort().join(',')!=='csvToken,mappings,previewRow,rows'||value.csvToken!==session.token||!Array.isArray(value.mappings)||!value.mappings.length||value.mappings.length>64||!Array.isArray(value.rows)||value.rows.length!==session.rows.length)fail('Review an explicit CSV mapping and every row from this import.');
 const fields=new Set(),mappings=value.mappings.map(item=>{if(!plain(item)||Object.keys(item).sort().join(',')!=='column,field'||!Number.isInteger(item.column)||item.column<0||item.column>=session.headers.length||typeof item.field!=='string'||fields.has(item.field)||!eligibleMailMergeField(info.fields.find(field=>field.name===item.field)))fail('Map each supported nonsensitive PDF field at most once.');fields.add(item.field);return {column:item.column,field:item.field};});
 const names=new Set(),rows=value.rows.map((row,index)=>{
  if(!plain(row)||Object.keys(row).sort().join(',')!=='cells,filename,id,selected'||row.id!==session.rows[index].id||typeof row.selected!=='boolean'||!Array.isArray(row.cells)||row.cells.length!==session.headers.length)fail('CSV row identities or column counts changed. Import the CSV again.');
  const cells=row.cells.map(value=>text(value)),filename=text(row.filename,120);if(filename!==mailMergeFilename(filename))fail('Review a safe PDF output filename for row '+row.id+'.');
  if(row.selected){const key=filename.toLowerCase();if(names.has(key))fail('Selected rows need different output filenames.');names.add(key);}
  return {id:row.id,selected:row.selected,cells,filename};
 });
 const picked=rows.filter(row=>row.selected);if(!picked.length||!Number.isInteger(value.previewRow)||!picked.some(row=>row.id===value.previewRow))fail('Select rows and choose one selected row to preview.');
 return {csvToken:value.csvToken,mappings,rows,previewRow:value.previewRow};
}
function mailMergeDraft(row,mappings,info){return {kind:'form',version:1,values:mappings.map(item=>({name:item.field,value:mailMergeFieldValue(info.fields.find(field=>field.name===item.field),row.cells[item.column])})),overlays:[],composer:null,calculations:[],tabOrders:[]};}

module.exports={MAIL_MERGE_LIMITS,parseMailMergeCsv,eligibleMailMergeField,mailMergeFieldValue,mailMergeFilename,validateMailMergeRequest,mailMergeDraft};

