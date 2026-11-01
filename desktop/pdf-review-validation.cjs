const {createHash}=require('node:crypto');
const {validColumns,validValues}=require('./pdf-review-columns.cjs');
const MAX_SOURCE=100*1024*1024,MAX_REVIEW=8*1024*1024,MAX_PAGES=500,MAX_ANNOTATIONS=10000,MAX_CONTENTS=16384,MAX_METADATA=4096;
const MAX_FILE_SOURCE=256*1024*1024;
const HASH=/^[a-f0-9]{64}$/, REF=/^ref:(0|[1-9]\d{0,15}):(0|[1-9]\d{0,4})$/;
function reviewPages(value){if(value===null||value===undefined)return null;if(!Array.isArray(value)||!value.length||value.length>MAX_PAGES||value.some(page=>!Number.isInteger(page)||page<1||page>MAX_PAGES)||new Set(value).size!==value.length)throw new Error('Choose distinct physical PDF pages from 1 to 500.');return [...value].sort((a,b)=>a-b);}
function reviewSource(id,source){if(typeof id!=='string'||!id||id.length>256||/[\x00-\x1f]/.test(id)||source?.ext!=='pdf'||!(source.bytes instanceof Uint8Array)||!source.bytes.length||source.bytes.length>MAX_SOURCE)throw new Error('Choose an opened PDF under 100 MB for its review inventory.');return Uint8Array.from(source.bytes);}
function reviewFileSource(id,source){
 if(source?.fileBacked&&Number.isSafeInteger(source.size)&&source.size>MAX_FILE_SOURCE)throw new Error('Source comment inventory currently admits PDFs up to 256 MiB within a fixed isolated parser budget. This PDF can still be read; split it into smaller PDFs to inventory comments. No partial inventory was returned.');
 if(typeof id!=='string'||!id||id.length>256||/[\x00-\x1f]/.test(id)||source?.ext!=='pdf'||source.fileBacked!==true||!Number.isSafeInteger(source.size)||source.size<=MAX_SOURCE||source.size>MAX_FILE_SOURCE||!HASH.test(source.fingerprint)||typeof source.reviewInput!=='function')throw new Error('Source-backed comment inventory requires an immutable opened PDF snapshot larger than 100 MiB and no larger than 256 MiB.');
 const input=source.reviewInput();
 if(!input||Object.getPrototypeOf(input)!==Object.prototype||Object.keys(input).sort().join(',')!=='length,sha256,stage,validate'||input.length!==source.size||input.sha256!==source.fingerprint||typeof input.stage!=='function'||typeof input.validate!=='function'||!Object.isFrozen(input))throw new Error('The source-backed review capability does not match the opened snapshot.');
 return input;
}
function canonicalJSON(value,depth=0){if(depth>32)throw new Error('Review data exceeds its canonical nesting limit.');if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(item=>canonicalJSON(item,depth+1)).join(',')+']';if(value&&typeof value==='object'&&Object.getPrototypeOf(value)===Object.prototype)return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonicalJSON(value[key],depth+1)).join(',')+'}';throw new Error('Review data contains an unsupported canonical value.');}
function inventorySha256(report){const {inventorySha256:ignored,...data}=report;return createHash('sha256').update(canonicalJSON(data)).digest('hex');}
const REPORT_FIELDS=['version','sourceSha256','pageCount','pages','annotations','warnings','sourceAnnotationCount','popupCount','signaturePresent','signatureValidity','scope','inventorySha256'];
const ROW_FIELDS=['key','objectRef','page','rect','subtype','nm','contents','author','subject','created','modified','parentKey','parentRef','replyType','state','stateModel','flags','locked','lockedContents','readOnly','hasAppearance','unknownFields','hasPopup','popupKey','hasRichText','richerTextUnavailable','replyResolution','sourceArrayIndex','sharedOccurrences'];
function exactFields(value,fields){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype&&Object.keys(value).length===fields.length&&fields.every(field=>Object.hasOwn(value,field));}
function text(value,max){return typeof value==='string'&&value.length<=max;}
function integer(value,min,max){return Number.isInteger(value)&&value>=min&&value<=max;}
function reference(value){const match=typeof value==='string'&&REF.exec(value);return !!match&&Number.isSafeInteger(Number(match[1]))&&Number(match[2])<=65535;}
function validReviewColor(value,field){
 if(!exactFields(value,['field','status','space','components','notice'])||value.field!==field||!['absent','valid','malformed','unavailable'].includes(value.status)||!text(value.notice,500))throw new Error('The review color descriptor is unsupported.');
 if(value.status==='valid'){const counts={transparent:0,DeviceGray:1,DeviceRGB:3,DeviceCMYK:4};if(!Object.hasOwn(counts,value.space)||!Array.isArray(value.components)||value.components.length!==counts[value.space]||value.components.some(number=>typeof number!=='number'||!Number.isFinite(number)||number<0||number>1))throw new Error('The standard review color components are unsupported.');}
 else if(value.space!==''||value.components!==null)throw new Error('Unavailable review colors must not infer a color space or components.');
 return value;
}
function rowFields(value){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype&&ROW_FIELDS.every(field=>Object.hasOwn(value,field))&&Object.keys(value).every(field=>ROW_FIELDS.includes(field)||['color','interiorColor','customColumnValues','richTextEditable'].includes(field));}
function validReviewReport(report,{sourceSha256,pages=null}){
 const fail=()=>{throw new Error('The review inventory contains unsupported source-bound review data. No partial inventory was returned.');};
 if(!exactFields(report,[...REPORT_FIELDS,...(report&&Object.hasOwn(report,'customColumns')?['customColumns']:[])])||report.version!==1||!HASH.test(report.sourceSha256)||report.sourceSha256!==sourceSha256||!HASH.test(report.inventorySha256)||!integer(report.pageCount,1,MAX_PAGES)||!integer(report.sourceAnnotationCount,0,MAX_ANNOTATIONS)||!integer(report.popupCount,0,report.sourceAnnotationCount)||typeof report.signaturePresent!=='boolean'||report.signatureValidity!=='unable to verify'||!text(report.scope,8000)||!Array.isArray(report.annotations)||report.annotations.length>report.sourceAnnotationCount-report.popupCount||!Array.isArray(report.warnings)||report.warnings.length>MAX_ANNOTATIONS*4+10||report.warnings.some(warning=>!text(warning,4096)))fail();
 if(Object.hasOwn(report,'customColumns'))validColumns(report.customColumns);
 const expected=reviewPages(pages)||Array.from({length:report.pageCount},(_,index)=>index+1);
 if(expected.some(page=>page>report.pageCount)||!Array.isArray(report.pages)||report.pages.length!==expected.length||report.pages.some((page,index)=>page!==expected[index]))fail();
 const selected=new Set(expected),identities=new Set(),locations=new Set(),rows=new Map();
 for(const row of report.annotations){
  if(!rowFields(row)||!text(row.key,256)||!row.key||identities.has(row.key)||!integer(row.page,1,report.pageCount)||!selected.has(row.page)||!integer(row.sourceArrayIndex,0,MAX_ANNOTATIONS-1)||!integer(row.sharedOccurrences,1,report.sourceAnnotationCount)||!integer(row.flags,0,0x7fffffff))fail();
  if(Object.hasOwn(row,'color'))validReviewColor(row.color,'C');if(Object.hasOwn(row,'interiorColor'))validReviewColor(row.interiorColor,'IC');
  if(Object.hasOwn(row,'customColumnValues'))validValues(row.customColumnValues);if(Object.hasOwn(row,'richTextEditable')&&(row.richTextEditable!==true||row.subtype!=='FreeText'||row.hasRichText!==true))fail();
  const location=row.page+':'+row.sourceArrayIndex;if(locations.has(location))fail();locations.add(location);identities.add(row.key);rows.set(row.key,row);
  if(row.objectRef!==null&&!reference(row.objectRef)||row.parentRef!==null&&!reference(row.parentRef)||row.popupKey!==null&&!reference(row.popupKey)||row.parentKey!==null&&!reference(row.parentKey))fail();
  const expectedKey=row.objectRef?(row.sharedOccurrences===1?row.objectRef:row.objectRef+'@'+row.page+':'+row.sourceArrayIndex):'direct:'+row.page+':'+row.sourceArrayIndex;
  if(row.key!==expectedKey||row.objectRef===null&&row.sharedOccurrences!==1)fail();
  if(row.rect!==null&&(!Array.isArray(row.rect)||row.rect.length!==4||row.rect.some(number=>typeof number!=='number'||!Number.isFinite(number)||Math.abs(number)>1e6)||row.rect[0]>row.rect[2]||row.rect[1]>row.rect[3]))fail();
  for(const field of ['subtype','replyType','state','stateModel'])if(!text(row[field],field==='subtype'?512:MAX_METADATA))fail();
  for(const field of ['nm','author','subject','created','modified'])if(!text(row[field],MAX_METADATA))fail();if(!text(row.contents,MAX_CONTENTS))fail();
  for(const field of ['locked','lockedContents','readOnly','hasAppearance','hasPopup','hasRichText','richerTextUnavailable'])if(typeof row[field]!=='boolean')fail();
  if(row.locked!==!!(row.flags&(128|512))||row.lockedContents!==!!(row.flags&512)||row.readOnly!==!!(row.flags&64)||row.richerTextUnavailable!==row.hasRichText||row.popupKey!==null&&!row.hasPopup||!Array.isArray(row.unknownFields)||row.unknownFields.length>64||new Set(row.unknownFields).size!==row.unknownFields.length||row.unknownFields.some(name=>!text(name,512))||row.unknownFields.some((name,index)=>index&&row.unknownFields[index-1]>name))fail();
  if(!['none','resolved','outside-selection','orphan','unsupported','ambiguous'].includes(row.replyResolution))fail();
  if(['resolved','outside-selection'].includes(row.replyResolution)){if(!row.parentRef||row.parentKey!==row.parentRef)fail();}else if(row.parentKey!==null)fail();
  if(['none','unsupported'].includes(row.replyResolution)&&row.parentRef!==null||['orphan','ambiguous'].includes(row.replyResolution)&&row.parentRef===null)fail();
 }
 for(const row of report.annotations){if(row.replyResolution==='resolved'){const parent=rows.get(row.parentKey);if(!parent||parent.objectRef!==row.parentRef||parent.sharedOccurrences!==1)fail();}else if(row.replyResolution==='outside-selection'&&rows.has(row.parentKey))fail();}
 const {inventorySha256:ignored,...body}=report;if(Buffer.byteLength(canonicalJSON(body),'utf8')>MAX_REVIEW||report.inventorySha256!==inventorySha256(report))fail();
 return report;
}
module.exports={MAX_SOURCE,MAX_FILE_SOURCE,MAX_REVIEW,MAX_PAGES,MAX_ANNOTATIONS,MAX_CONTENTS,MAX_METADATA,reviewPages,reviewSource,reviewFileSource,canonicalJSON,inventorySha256,validReviewReport,validReviewColor};
