const {validTableMerges}=require('./table-merge-validation.cjs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {readChosenJson,MAX_JSON_BYTES}=require('./chosen-json-reader.cjs');
const {FileError}=require('./file-store.cjs');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
const keys=(value,expected)=>object(value)&&Object.keys(value).sort().join(',')===expected.split(',').sort().join(',');
function validateTableCorrectionDraft(value,source){
 const fail=message=>{throw new FileError('TABLE_DRAFT',message||'Choose a bounded PDFix table correction draft for this exact original PDF.');};
 if(!source||source.ext!=='pdf'||!(keys(value,'kind,version,sourceSha256,page,mode,region,rowEdges,columnEdges,cells,flagged')||keys(value,'kind,version,sourceSha256,page,mode,region,rowEdges,columnEdges,cells,flagged,merges'))||value.kind!=='pdfix-table-corrections'||value.version!==1)fail();
 if(typeof value.sourceSha256!=='string'||!/^[a-f0-9]{64}$/.test(value.sourceSha256)||value.sourceSha256!==source.fingerprint)fail('This table draft belongs to different PDF bytes. Open its exact original PDF.');
 if(!Number.isInteger(value.page)||value.page<1||value.page>500||!['selectable','ocr-eng'].includes(value.mode)||!keys(value.region,'left,top,right,bottom'))fail();
 const r=value.region;if(!Object.values(r).every(Number.isFinite)||r.left<0||r.top<0||r.right>1||r.bottom>1||r.right<=r.left||r.bottom<=r.top)fail();
 const edges=(list,max)=>Array.isArray(list)&&list.length>=2&&list.length<=max+1&&list[0]===0&&list.at(-1)===1&&Array.from(list).every((n,i)=>Number.isFinite(n)&&n>=0&&n<=1&&(!i||n>list[i-1]));
 if(!edges(value.rowEdges,100)||!edges(value.columnEdges,32))fail();
 const rows=value.rowEdges.length-1,columns=value.columnEdges.length-1;
 if(!Array.isArray(value.cells)||value.cells.length!==rows||!Array.isArray(value.flagged)||value.flagged.length!==rows)fail();let chars=0;
 const cells=Array.from(value.cells).map(row=>{if(!Array.isArray(row)||row.length!==columns)fail();return Array.from(row).map(text=>{if(typeof text!=='string'||text.length>10000||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/.test(text)||text!==text.toWellFormed())fail();chars+=text.length;if(chars>500000)fail('The correction draft exceeds its 500,000 character limit.');return text;});});
 const flagged=Array.from(value.flagged).map(row=>{if(!Array.isArray(row)||row.length!==columns||Array.from(row).some(flag=>typeof flag!=='boolean'))fail();return [...row];});
 const draft={kind:value.kind,version:1,sourceSha256:value.sourceSha256,page:value.page,mode:value.mode,region:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},rowEdges:[...value.rowEdges],columnEdges:[...value.columnEdges],cells,flagged,merges:validTableMerges(Object.hasOwn(value,'merges')?value.merges:[],cells)};
 if(Buffer.byteLength(JSON.stringify(draft),'utf8')>MAX_JSON_BYTES)fail('The correction draft exceeds its 2 MB JSON limit.');return draft;
}
function createTableCorrectionDraftIO({store,dialog,getWindow,inspectSource}){
 const current=(id,source)=>{if(store.source(id)!==source||hash(source.bytes)!==source.fingerprint)throw new FileError('CHANGED','The opened table source changed. Reopen its exact original PDF.');};
 const permission=async(id,source)=>{current(id,source);if(source.ext!=='pdf')throw new FileError('FORMAT','Open the original PDF before using table drafts.');const report=await inspectSource(id,source);current(id,source);if(report.encrypted)throw new FileError('TABLE_DRAFT','Create an owner-authorized unprotected PDF copy before using table drafts.');if(report.sha256!==source.fingerprint)throw new FileError('CHANGED','The inspected source changed. Reopen the original PDF.');};
 return {
  async save(id,value){const source=store.source(id);await permission(id,source);const draft=validateTableCorrectionDraft(value,source),bytes=Buffer.from(JSON.stringify(draft,null,2)+'\n','utf8');if(bytes.length>MAX_JSON_BYTES)throw new FileError('TABLE_DRAFT','The correction draft exceeds its 2 MB JSON limit.');const chosen=await dialog.showSaveDialog(getWindow(),{title:'Save table correction draft copy',defaultPath:path.join(path.dirname(source.path),path.basename(source.name,path.extname(source.name))+'-page-'+draft.page+'-table-corrections.json'),filters:[{name:'PDFix table corrections',extensions:['json']}]});if(chosen.canceled)return null;await permission(id,source);const saved=await store.saveCopy(id,chosen.filePath,bytes,'json',hash(bytes));return {...saved,rows:draft.cells.length,columns:draft.cells[0].length,mergedRanges:draft.merges.length};},
  async load(id){const source=store.source(id);await permission(id,source);const chosen=await dialog.showOpenDialog(getWindow(),{title:'Load table corrections for this original PDF',properties:['openFile'],filters:[{name:'PDFix table corrections',extensions:['json']}]});if(chosen.canceled)return null;const picked=await readChosenJson(chosen.filePaths[0],'table correction draft');await permission(id,source);let value;try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(picked.bytes).replace(/^\uFEFF/,''));}catch{throw new FileError('TABLE_DRAFT','The table correction draft is not valid JSON.');}const draft=validateTableCorrectionDraft(value,source);current(id,source);return {name:picked.name,draft};}
 };
}
module.exports={createTableCorrectionDraftIO,validateTableCorrectionDraft};
