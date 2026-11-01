const {validTableMerges}=require('./table-merge-validation.cjs');
const {createHash}=require('node:crypto');
const MAX_XLSX_BYTES=10*1024*1024;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const keys=(value,fields)=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype&&Object.keys(value).sort().join(',')===fields.split(',').sort().join(',');
const fail=()=>{throw new Error('Review a bounded table from the exact opened PDF before exporting a literal XLSX copy.');};
function validTableXlsxDraft(value,sourceSha256){
 if(!(keys(value,'version,sourceSha256,page,mode,region,cells,reviewed')||keys(value,'version,sourceSha256,page,mode,region,cells,reviewed,merges'))||value.version!==1||typeof value.sourceSha256!=='string'||!/^[a-f0-9]{64}$/.test(value.sourceSha256)||value.sourceSha256!==sourceSha256||value.reviewed!==true||!Number.isInteger(value.page)||value.page<1||value.page>500||!['selectable','ocr-eng'].includes(value.mode)||!keys(value.region,'left,top,right,bottom'))fail();
 const r=value.region;if(!Object.values(r).every(Number.isFinite)||r.left<0||r.top<0||r.right>1||r.bottom>1||r.right<=r.left||r.bottom<=r.top||!Array.isArray(value.cells)||!value.cells.length||value.cells.length>100)fail();
 const columns=value.cells[0]?.length;if(!Number.isInteger(columns)||columns<1||columns>32)fail();let chars=0;
 const cells=Array.from(value.cells).map(row=>{if(!Array.isArray(row)||row.length!==columns)fail();return Array.from(row).map(text=>{if(typeof text!=='string'||text.length>10000||text.length>32767||text!==text.toWellFormed()||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f\ufffe\uffff]/u.test(text))fail();chars+=text.length;if(chars>500000)fail();return text;});});
 const draft={version:1,sourceSha256,page:value.page,mode:value.mode,region:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},cells,merges:validTableMerges(Object.hasOwn(value,'merges')?value.merges:[],cells),reviewed:true};
 if(Buffer.byteLength(JSON.stringify({draft}),'utf8')>2*1024*1024-1000)throw new Error('This table exceeds the contained XLSX request limit. Reduce its text or split the extraction.');return draft;
}
const tableCellFingerprint=cells=>hash(Buffer.from(JSON.stringify(cells),'utf8'));
const tableMergeFingerprint=merges=>hash(Buffer.from(JSON.stringify(merges),'utf8'));
function validTableXlsxResult(value,draft){
 if(!keys(value,'bytes,report')||!(value.bytes instanceof Uint8Array)||value.bytes.length<22||value.bytes.length>MAX_XLSX_BYTES||Buffer.from(value.bytes.subarray(0,4)).toString('hex')!=='504b0304')throw new Error('The contained table XLSX output exceeded its byte bounds.');
 const r=value.report;if(!keys(r,'version,sourceSha256,page,mode,region,rows,columns,cellsSha256,sha256,outputBytes,format,cellType,formulaCells,externalRelationships,macroParts,mergedRanges,mergesSha256,verified')||r.version!==1||r.sourceSha256!==draft.sourceSha256||r.page!==draft.page||r.mode!==draft.mode||!keys(r.region,'left,top,right,bottom')||Object.keys(draft.region).some(key=>r.region[key]!==draft.region[key])||r.rows!==draft.cells.length||r.columns!==draft.cells[0].length||r.cellsSha256!==tableCellFingerprint(draft.cells)||r.mergedRanges!==draft.merges.length||r.mergesSha256!==tableMergeFingerprint(draft.merges)||r.sha256!==hash(value.bytes)||r.outputBytes!==value.bytes.length||r.format!=='xlsx'||r.cellType!=='inlineStr'||r.formulaCells!==0||r.externalRelationships!==0||r.macroParts!==0||r.verified!==true)throw new Error('The contained XLSX receipt does not match the reviewed source table.');return true;
}
module.exports={MAX_XLSX_BYTES,validTableXlsxDraft,validTableXlsxResult,tableCellFingerprint,tableMergeFingerprint};
