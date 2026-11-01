// Inert compact descriptor validation; no Office ZIP/XML/document parsing here.
const LIMITS=require('./document-limits.cjs');
const SHA=/^[a-f0-9]{64}$/;
const {validDocumentBand}=require('./document-band-model.cjs');
const {validDocumentPage}=require('./document-layout-validation.cjs');
const fail=()=>{throw new Error('The contained DOCX table-grid result failed its source/shape limits.');};
function shape(value,keys){if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join(',')!==keys.split(',').sort().join(','))fail();}
function literal(value){if(typeof value!=='string'||!value||value.length>1000||!value.isWellFormed()||/[\x00-\x1f\x7f]/.test(value))fail();}
function validDocumentGridReport(report,sourceSha256){
 const keys=Object.hasOwn(report||{},'bands')?'version,sourceSha256,tables,notices,bands':'version,sourceSha256,tables,notices';
 if(Object.hasOwn(report||{},'page')){shape(report,keys+',page');try{validDocumentPage(report.page);}catch{fail();}}else shape(report,keys);
 if(report.version!==1||typeof sourceSha256!=='string'||!SHA.test(sourceSha256)||report.sourceSha256!==sourceSha256||!Array.isArray(report.tables)||report.tables.length>LIMITS.TABLE_COUNT||!Array.isArray(report.notices)||report.notices.length>100)fail();
 let slots=0;
 for(let index=0;index<report.tables.length;index++){
  const table=report.tables[index];shape(table,'key,rows,columns,widthsTwips,signature,reason');
  if(table.key!=='table-'+(index+1)||!Number.isInteger(table.rows)||table.rows<0||table.rows>LIMITS.TABLE_ROWS||!Number.isInteger(table.columns)||table.columns<0||table.columns>32)fail();
  if(table.reason!==null)literal(table.reason);
  if(table.rows===0||table.columns===0){if(table.rows!==0||table.columns!==0||table.widthsTwips!==null||table.signature!==null||table.reason===null)fail();continue;}
  slots+=table.rows*table.columns;if(slots>LIMITS.TABLE_TOTAL_CELLS)fail();
  if(table.signature!==null&&(typeof table.signature!=='string'||!SHA.test(table.signature)))fail();
  if(table.widthsTwips!==null&&(!Array.isArray(table.widthsTwips)||table.widthsTwips.length!==table.columns||table.widthsTwips.some(w=>!Number.isInteger(w)||w<1||w>30000)))fail();
  // Missing matching identity/widths must remain a disclosed omission, never a guessed grid.
  if((table.signature===null||table.widthsTwips===null)&&table.reason===null)fail();
 }
 for(const notice of report.notices)literal(notice);
 if(Object.hasOwn(report,'bands')){shape(report.bands,'header,footer');for(const band of Object.values(report.bands)){if(band===null)continue;if(Object.hasOwn(band||{},'version')){try{validDocumentBand(band);}catch{fail();}continue;}shape(band,'text,align');if(typeof band.text!=='string'||band.text.length>120||!band.text.isWellFormed()||band.text.split('\n').length>2||/[\x00-\x09\x0b-\x1f\x7f-\x9f\ufffe\uffff]/.test(band.text)||!['left','center','right'].includes(band.align))fail();}}
 if(Buffer.byteLength(JSON.stringify(report),'utf8')>256*1024)fail();return report;
}
module.exports={validDocumentGridReport};
