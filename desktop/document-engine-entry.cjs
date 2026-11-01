// Fixed, bundled child entry point. The broker supplies no operation/path CLI arguments.
// This file is never required by Electron: it runs only as the AppContainer child.
const fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto');
const MAX_SOURCE=100*1024*1024,MAX_FILE_SOURCE=256*1024*1024,MAX_REQUEST=36*1024*1024,MAX_RESULT=32*1024*1024;
const LIMITS=require('./document-limits.cjs'),WORD=new Set(LIMITS.WORD_OPERATIONS);
const requestLimit=operation=>WORD.has(operation)?LIMITS.WORD_REQUEST_BYTES:operation==='form-fill-build'?3*1024*1024:operation==='portfolio-build'?MAX_REQUEST:IMPORT_OPERATIONS.has(operation)?12*1024*1024:2*1024*1024;
const FILE_SOURCE_OPERATIONS=new Set(['review-inventory-file']);
const IMPORT_OPERATIONS=new Set(['xfdf-import-inspect','xfdf-import-build','fdf-import-inspect','fdf-import-build']);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const DecodeStream=require('pdf-lib/cjs/core/streams/DecodeStream.js').default;
const ensure=DecodeStream.prototype.ensureBuffer;let decoded=0;
DecodeStream.prototype.ensureBuffer=function(size){
 if(!Number.isSafeInteger(size)||size<0||size>16*1024*1024)throw new Error('An object stream exceeds the isolated decoding limit.');
 const value=ensure.call(this,size),capacity=this.buffer?.length||0;
 if(capacity>16*1024*1024)throw new Error('An object stream exceeds the isolated allocation limit.');
 decoded+=Math.max(0,capacity-(this.pdfixContainedCapacity||0));this.pdfixContainedCapacity=capacity;
 if(decoded>64*1024*1024)throw new Error('The isolated job exceeds its compressed-object decoding budget.');return value;
};
const {inspectReview,inspectReviewSourceFile}=require('./pdf-review-codec.cjs');
const {writeReviewEdits}=require('./pdf-review-edit-codec.cjs');
const {writeTakeoffs}=require('./pdf-takeoff-codec.cjs');
const {inspectTakeoffs}=require('./pdf-takeoff-recovery-codec.cjs');
const {writeXfdf}=require('./pdf-xfdf-codec.cjs');
const {inspectTiff,decodeTiffPage}=require('./tiff-codec.cjs');
const {inspectCombine,writeCombine}=require('./pdf-combine-codec.cjs');
const {inspectWorkflowSource}=require('./document-workflow-source-codec.cjs');
const {writeFdf,inspectFdfImport,writeFdfImport}=require('./pdf-fdf-codec.cjs');
const {fdfBytes,validFdfInspection,validFdfImportDraft}=require('./pdf-fdf-validation.cjs');
const {readWorkbook,writeWorkbook}=require('./workbook-codec.cjs');
const {readPresentation,writePresentation}=require('./presentation-codec.cjs');
const {readEmailMessage}=require('./email-message-codec.cjs');
const {inspectDocumentTableGrids}=require('./document-grid-import.cjs');
const {validDocumentGridReport}=require('./document-grid-validation.cjs');
const {inspect:inspectSecurity}=require('./pdf-security-codec.cjs');
const {inspect:inspectSanitize,sanitize}=require('./pdf-sanitize-codec.cjs');
const {inspectXfdfImport,writeXfdfImport}=require('./pdf-xfdf-import-codec.cjs');
const {xfdfBytes,validXfdfImportInspection,validXfdfImportDraft}=require('./pdf-xfdf-import-validation.cjs');
const {inspect:inspectRedaction,verify:verifyRedaction}=require('./redaction-codec.cjs');
const {inspectPageOrder,writePageOrder}=require('./pdf-page-order-codec.cjs');
const {inspectPageBoxes,writePageBoxes}=require('./pdf-page-box-codec.cjs');
const {buildPrintMarks}=require('./pdf-print-marks-codec.cjs');
const {buildSignatureRequest}=require('./signature-request-codec.cjs');
const {inspectThinLines,writeThinLines}=require('./pdf-thin-line-codec.cjs');
const {inspectPageRevision,writePageRevision}=require('./pdf-page-revision-codec.cjs');
const {validPageOrderDraft}=require('./pdf-page-order-validation.cjs');
const {readRtf,writeRich,readDocx}=require('./rich-document-codec.cjs');
const {inspectLink}=require('./pdf-link-codec.cjs');
const {inventory:attachmentInventory}=require('./pdf-attachment-codec.cjs');
const {writeTableXlsx}=require('./table-xlsx-codec.cjs');
const {build:buildDecoration}=require('./pdf-decoration-codec.cjs');
const {inspect:inspectBookmarks,write:writeBookmarks}=require('./pdf-bookmark-codec.cjs');
const {extractBatchPdfText}=require('./batch-pdf-text-codec.cjs');
const {inspect:inspectFormBuilder,create:createFormBuilder}=require('./form-builder-codec.cjs');
const {inspectDocumentOutput}=require('./document-output-codec.cjs');
const {inspect:inspectCertificates}=require('./pdf-certificate-codec.cjs');
const {inspect:inspectCertificateSigning,prepare:prepareCertificateSigning,finalize:finalizeCertificateSigning}=require('./pdf-certificate-signing-codec.cjs');
const {inspect:inspectGeospatial,query:queryGeospatial}=require('./pdf-geospatial-codec.cjs');
const {inspect:inspectPreflight}=require('./pdf-preflight-codec.cjs');
const {inspect:inspectFormFill,build:buildFormFill}=require('./form-fill-codec.cjs');
const {inspect:inspectRepair,verify:verifyRepair}=require('./pdf-repair-codec.cjs');
const {inspect:inspectAccessibilityAudit}=require('./pdf-accessibility-audit-codec.cjs');
const {inspect:inspectTags,write:writeTags}=require('./pdf-tags-codec.cjs');
const {inspect:inspectPortfolio,build:buildPortfolio,select:selectPortfolio}=require('./pdf-portfolio-codec.cjs');
const operations=Object.freeze({
 'page-box-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Page-box inspection has no options.');return inspectPageBoxes(bytes);},
 'page-box-build':(bytes,o)=>{if(Object.keys(o).join(',')!=='draft')throw new Error('Page-box editing requires only its reviewed draft.');return writePageBoxes(bytes,o.draft);},
 'signature-request-build':(bytes,o)=>{if(Object.keys(o).join(',')!=='draft')throw new Error('Signing request preparation requires only its reviewed draft.');return buildSignatureRequest(bytes,o.draft);},
 'print-marks-build':(bytes,o)=>{if(Object.keys(o).join(',')!=='draft')throw new Error('Print marks require only its reviewed draft.');return buildPrintMarks(bytes,o.draft);},
 'thin-line-inspect':(bytes,o)=>{if(Object.keys(o).join(',')!=='thresholdPt')throw new Error('Thin-line inspection requires only a width threshold.');return inspectThinLines(bytes,o);},
 'thin-line-build':(bytes,o)=>{if(Object.keys(o).join(',')!=='draft')throw new Error('Thin-line repair requires only its reviewed draft.');return writeThinLines(bytes,o.draft);},
 'page-revision-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Sheet revision inspection has no operation/path options.');return inspectPageRevision(bytes);},
 'page-revision-build':(bytes,o)=>{if(Object.keys(o).join(',')!=='draft')throw new Error('Sheet revision requires only its exact reviewed draft.');return writePageRevision(bytes,o.draft);},
 'repair-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Repair inventory has no path/options.');return inspectRepair(bytes);},
 'repair-verify':(bytes,o)=>verifyRepair(bytes,o),
 'form-fill-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Form fill inspection has no path/options.');return inspectFormFill(bytes);},
 'form-fill-build':(bytes,o)=>{if(Object.keys(o).join(',')!=='draft')throw new Error('Form filling requires only the reviewed draft.');return buildFormFill(bytes,o.draft);},
 'preflight-inspect':(bytes,o)=>{if(Object.keys(o).join(',')!=='profileId')throw new Error('Preflight requires only a declared profile identity.');return inspectPreflight(bytes,o);},
 'accessibility-audit-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Accessibility audit has no path/options.');return inspectAccessibilityAudit(bytes);},
 'geospatial-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Geospatial inventory has no path/options.');return inspectGeospatial(bytes);},
 'geospatial-query':(bytes,o)=>queryGeospatial(bytes,o),
 'certificate-sign-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Certificate signing inspection has no path/options.');return inspectCertificateSigning(bytes);},
 'certificate-sign-prepare':(bytes,o)=>prepareCertificateSigning(bytes,o),
 'certificate-sign-finalize':(bytes,o)=>finalizeCertificateSigning(bytes,o),
 'tags-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Tag inspection has no path/options.');return inspectTags(bytes);},
 'tags-build':(bytes,o)=>{if(Object.keys(o).join(',')!=='selection')throw new Error('Tag editing requires only its source-bound selection.');return writeTags(bytes,o.selection);},
 'portfolio-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Portfolio inspection has no path/options.');return inspectPortfolio(bytes);},
 'portfolio-build':(bytes,o)=>buildPortfolio(bytes,o),
 'portfolio-select':(bytes,o)=>{if(Object.keys(o).join(',')!=='entryId')throw new Error('Portfolio extraction requires only a reviewed entry identity.');return selectPortfolio(bytes,o);},
 'certificate-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Certificate inspection has no path/options.');return inspectCertificates(bytes);},
 'document-output-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Document PDF output inspection has no path/options.');return inspectDocumentOutput(bytes);},
 'form-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Form inspection has no path/options.');return inspectFormBuilder(bytes);},
 'form-create':(bytes,o)=>{if(Object.keys(o).join(',')!=='draft')throw new Error('Form creation requires only its reviewed draft.');return createFormBuilder(bytes,o.draft);},
 'batch-pdf-text':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Batch text export has no path/options.');return extractBatchPdfText(bytes,o);},
 'decoration-build':(bytes,o)=>{if(Object.keys(o).join(',')!=='draft')throw new Error('Decoration requires only its reviewed draft.');return buildDecoration(bytes,o.draft);},
 'bookmark-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Bookmark inventory has no path/options.');return inspectBookmarks(bytes);},
 'bookmark-build':(bytes,o)=>{if(Object.keys(o).join(',')!=='selection')throw new Error('Bookmark copy requires only its reviewed selection.');return writeBookmarks(bytes,o.selection);},
 'table-xlsx-write':(bytes,o)=>{if(Object.keys(o).join(',')!=='draft')throw new Error('Table XLSX requires only a reviewed table draft.');return writeTableXlsx(bytes,o.draft);},
 'link-resolve':(bytes,o)=>{if(Object.keys(o).join(',')!=='request')throw new Error('Link inspection requires only its source-bound request.');return inspectLink(bytes,o.request);},
 'attachment-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Attachment inventory has no path/options.');return attachmentInventory(bytes);},
 'attachment-select':(bytes,o)=>{if(Object.keys(o).join(',')!=='attachmentId'||typeof o.attachmentId!=='string'||!/^[a-f0-9]{64}$/.test(o.attachmentId))throw new Error('Attachment decoding requires one reviewed attachment identity.');return attachmentInventory(bytes,o.attachmentId);},
 'rich-docx-read':(bytes,o)=>readDocx(bytes,o),
 'rich-rtf-read':(bytes,o)=>readRtf(bytes,o),
 'rich-docx-write':(bytes,o)=>writeRich(bytes,o,'docx'),
 'rich-rtf-write':(bytes,o)=>writeRich(bytes,o,'rtf'),
 'review-inventory':(bytes,o)=>inspectReview(bytes,o.pages??null),
 'review-inventory-file':(bytes,o)=>{if(Object.keys(o).join(',')!=='pages')throw new Error('File-backed comment inspection requires only physical page selection.');return inspectReviewSourceFile(bytes,o.pages);},
 'review-edit':(bytes,o)=>writeReviewEdits(bytes,o.draft),
 'takeoff-write':(bytes,o)=>writeTakeoffs(bytes,o.draft),
 'takeoff-recovery':(bytes,o)=>inspectTakeoffs(bytes,o.name),
 'xfdf-export':(bytes,o)=>writeXfdf(bytes,o.draft),
 'tiff-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('TIFF inspection accepts no settings.');return inspectTiff(bytes);},
 'tiff-page':(bytes,o)=>{if(Object.keys(o).join(',')!=='page')throw new Error('TIFF decoding requires only the chosen page index.');return decodeTiffPage(bytes,o.page);},
 'combine-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Combination inspection accepts only chosen source packets.');return inspectCombine(bytes);},
 'combine-build':(bytes,o)=>{if(Object.keys(o).join(',')!=='draft')throw new Error('Combination needs its reviewed source/page draft.');return writeCombine(bytes,o.draft);},
 'workflow-source-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Workflow source inspection accepts no settings.');return inspectWorkflowSource(bytes);},
 'fdf-export':(bytes,o)=>{if(Object.keys(o).join(',')!=='draft')throw new Error('FDF export requires only its reviewed draft.');return writeFdf(bytes,o.draft);},
 'fdf-import-inspect':(bytes,o)=>{const request=validFdfInspection(o);return inspectFdfImport(bytes,fdfBytes(request.fdf));},
 'fdf-import-build':(bytes,o)=>{if(Object.keys(o).join(',')!=='draft')throw new Error('FDF import requires only its explicit source-bound draft.');return writeFdfImport(bytes,validFdfImportDraft(o.draft));},
 'workbook-read':bytes=>readWorkbook(bytes).model,
 'workbook-write':(bytes,o)=>Uint8Array.from(writeWorkbook(bytes,o.draft)),
 'presentation-read':bytes=>readPresentation(bytes).model,
 'presentation-write':(bytes,o)=>Uint8Array.from(writePresentation(bytes,o.draft)),
 'email-message-read':(bytes,o)=>{if(bytes.length>10*1024*1024||Object.keys(o).length)throw new Error('Email import requires at most 10 MiB and no path/options.');return readEmailMessage(bytes);},
 'document-table-grids':async(bytes,o)=>{if(bytes.length>LIMITS.WORD_IMPORT_BYTES||Object.keys(o).length)throw new Error('DOCX table-grid import requires at most 10 MiB and no path/options.');return validDocumentGridReport(await inspectDocumentTableGrids(bytes),hash(bytes));},
 'security-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Security inspection has no operation/path options.');return inspectSecurity(bytes);},
 'sanitize-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Cleanup inspection has no operation/path options.');return inspectSanitize(bytes);},
 'sanitize-build':(bytes,o)=>{if(Object.keys(o).join(',')!=='selection')throw new Error('Cleanup requires only the explicit selected categories.');return sanitize(bytes,o.selection);},
 'xfdf-import-inspect':(bytes,o)=>{const request=validXfdfImportInspection(o);return inspectXfdfImport(bytes,xfdfBytes(request.xfdf));},
 'xfdf-import-build':(bytes,o)=>{if(Object.keys(o).join(',')!=='draft')throw new Error('XFDF import requires only its explicit source-bound draft.');return writeXfdfImport(bytes,validXfdfImportDraft(o.draft));},
 'redaction-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Redaction source inspection has no operation/path options.');return inspectRedaction(bytes);},
 'redaction-verify':(bytes,o)=>verifyRedaction(bytes,o),
 'page-order-inspect':(bytes,o)=>{if(Object.keys(o).length)throw new Error('Page-order inspection has no operation/path options.');return inspectPageOrder(bytes);},
 'page-order-build':(bytes,o)=>{if(Object.keys(o).join(',')!=='draft')throw new Error('Page reorder requires only its explicit source-bound draft.');return writePageOrder(bytes,validPageOrderDraft(o.draft));}
});
async function read(name,max){const file=path.join(process.cwd(),name),stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size<1||stat.size>max)throw new Error('Invalid isolated job input.');const bytes=await fs.readFile(file);if(bytes.length!==stat.size)throw new Error('The isolated input changed.');return bytes;}
async function write(name,bytes,max){if(bytes.length>max)throw new Error('The isolated output exceeds its size budget.');const file=path.join(process.cwd(),name),stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink())throw new Error('Invalid isolated output slot.');const handle=await fs.open(file,'r+');try{await handle.truncate(0);await handle.writeFile(bytes);await handle.sync();}finally{await handle.close();}}
(async()=>{try{
 const raw=await read('request.json',Math.max(MAX_REQUEST,LIMITS.WORD_REQUEST_BYTES)),request=JSON.parse(raw.toString('utf8'));
 if(!request||request.version!==1||!Object.hasOwn(operations,request.operation)||!Number.isSafeInteger(request.sourceLength)||request.sourceLength<1||request.sourceLength>(FILE_SOURCE_OPERATIONS.has(request.operation)?MAX_FILE_SOURCE:MAX_SOURCE)||!/^([a-f0-9]{64})$/.test(request.sourceSha256)||!request.options||Object.getPrototypeOf(request.options)!==Object.prototype)throw new Error('Unsupported isolated operation.');
 if(raw.length>requestLimit(request.operation))throw new Error('The isolated operation exceeds its fixed request limit.');
 const bytes=await read('input.bin',FILE_SOURCE_OPERATIONS.has(request.operation)?MAX_FILE_SOURCE:MAX_SOURCE);if(bytes.length!==request.sourceLength||hash(bytes)!==request.sourceSha256)throw new Error('The isolated source does not match its immutable request.');
 let result=await operations[request.operation](bytes,request.options),output=new Uint8Array(),kind='value';
 if(result instanceof Uint8Array){output=result;result=null;kind='bytes';}
 else if(result&&result.bytes instanceof Uint8Array){output=result.bytes;result={...result};delete result.bytes;kind='record';}
 if(output.length>MAX_SOURCE)throw new Error('The isolated copy exceeds 100 MiB.');
 let embedded=0;
 const envelope=JSON.stringify({version:1,operation:request.operation,sourceSha256:request.sourceSha256,outputLength:output.length,outputSha256:hash(output),kind,result},(key,value)=>{
  if(value instanceof Uint8Array){embedded+=value.length;if(embedded>(WORD.has(request.operation)?LIMITS.WORD_EMBEDDED_BYTES:8*1024*1024))throw new Error('Embedded previews exceed the isolated output budget.');return {wireType:'PDFix.ByteArray.v1',base64:Buffer.from(value).toString('base64')};}
  return value;
 });
 const serialized=Buffer.from(envelope,'utf8');if(serialized.length>(WORD.has(request.operation)?LIMITS.WORD_RESULT_BYTES:MAX_RESULT))throw new Error('The isolated result exceeds its size budget.');
 await write('output.bin',output,MAX_SOURCE);await write('result.json',serialized,WORD.has(request.operation)?LIMITS.WORD_RESULT_BYTES:MAX_RESULT);
 process.exitCode=0;
 }catch(error){
  // Only bounded text is exported. Stack traces, keys, environment and source paths stay private.
  const message=String(error?.message||'The isolated document operation failed.').replace(/[\x00-\x1f]/g,' ').slice(0,700);
  try{await write('error.json',Buffer.from(JSON.stringify({version:1,message})),4096);}catch{}
  process.exitCode=1;
 }
})();
