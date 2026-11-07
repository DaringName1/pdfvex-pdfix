const {preferredCopyBase}=require('./copy-name.cjs');
const {PdfOutputCheckService}=require('./pdf-output-check-service.cjs');
let pdfOutputCheck;
const {PagedPdfService}=require('./paged-pdf-service.cjs');
let pagedPdf;
const {registerLocalTextTools}=require('./register-local-text-tools.cjs');
let localTextTools;
const { app, BrowserWindow, dialog, ipcMain, protocol, session, shell, safeStorage, clipboard, Menu } = require('electron');
const graphicsStartup=require('./graphics-startup.cjs').install({app});
const path = require('node:path');
const {createHash}=require('node:crypto');
const fs = require('node:fs/promises');
const { FileStore, FileError, MAX_BYTES, validateFile } = require('./file-store.cjs');
const { readMarkdownImage } = require('./markdown-image-reader.cjs');
const {getReadingCapacity}=require('./reading-capacity.cjs');
const {officeJob,cancelOfficeJob,disposeOfficeService,restartOfficeService,officeStatus}=require('./office-service.cjs');
const {richDocumentJob,cancelRichDocumentJob,disposeRichDocumentService,restartRichDocumentService,richDocumentStatus}=require('./rich-document-service.cjs');
const {createTableCorrectionDraftIO}=require('./table-correction-draft.cjs');
const {TableXlsxService}=require('./table-xlsx-service.cjs');
let tableXlsx=new TableXlsxService();
const tableXlsxRequests=new Map();
const {SearchSources}=require('./search-sources.cjs');
const searchSources=new SearchSources();
const {readChosenBoundedFile,regularChosenPath}=require('./chosen-bounded-file.cjs');
const {FileFingerprintService,expectedHash}=require('./file-fingerprint-service.cjs');
const fileFingerprints=new FileFingerprintService();
const {FileAvailability}=require('./file-availability.cjs');
const fileAvailability=new FileAvailability(),cloudFileSelections=new Map();
const {WatchedFolderManager}=require('./watched-folder-manager.cjs');let watchedFolders;
const {SignatureRequestService}=require('./signature-request-service.cjs');let signatureRequests=new SignatureRequestService();
const {WindowsContextTools}=require('./windows-context-tools.cjs');let windowsContextTools;
const {WindowsContextRequests,seedWindowsContextCombineInputs}=require('./windows-context-requests.cjs');const windowsContextRequests=new WindowsContextRequests();
const {readEmailMessage,cancelEmailMessage,disposeEmailMessageService,restartEmailMessageService}=require('./email-message-service.cjs');
const {FormMailMergeService}=require('./form-mail-merge-service.cjs');
let formMailMerge=new FormMailMergeService(),emailPicking=false,clipboardReading=false;
const pendingMailMergeSaves=new Map();

const {BatchCompression}=require('./batch-compression.cjs');
let batchCompression,batchRestart=null;
const {BatchDocumentActions}=require('./batch-document-actions.cjs');
let batchDocumentActions=new BatchDocumentActions();
const {inspectDocumentTableGrids,cancelDocumentTableGrids,disposeDocumentTableGrids,restartDocumentTableGrids,documentTableGridStatus}=require('./document-grid-service.cjs');
const {validPresentationDraft}=require('./presentation-validation.cjs');
const {validWorkbookDraft}=require('./workbook-validation.cjs');
const {ImageExportError,imageParts,writeImageCopies}=require('./image-export-writer.cjs');
const {DocumentPdfService,DocumentPdfError}=require('./document-pdf.cjs');
const { SignatureError } = require('./signature-store.cjs');
const {FormAutofillStore,AutofillError}=require('./form-autofill-store.cjs');
const { RecoveryError } = require('./recovery-store.cjs');
const {CompressionEngine,CompressionError}=require('./compression-engine.cjs');
const {RedactionService,RedactionError}=require('./redaction-service.cjs');
const {PasswordEngine,PasswordError}=require('./password-engine.cjs');
const {SandboxError,setSandboxReporter}=require('./native-sandbox.cjs');
const {contextSources,contextText}=require('./ai-source-context.cjs');
const {registerAi,AiError}=require('./ai-register.cjs');
const {WindowsOpenQueue}=require('./windows-integration.cjs');
const windowsOpenQueue=new WindowsOpenQueue();if(!windowsContextRequests.enqueue(process.argv,{defaultApp:!!process.defaultApp}))windowsOpenQueue.enqueue(process.argv,{defaultApp:!!process.defaultApp});
const {PageWorkflows,PageWorkflowError}=require('./page-workflows.cjs');
const {SheetSets,SheetSetError}=require('./sheet-sets.cjs');
let sheetSets;
let pageWorkflows;
const {formRecoveryInfo,clearFormRecovery}=require('./form-builder-privacy.cjs');
const {FormBuilderService}=require('./form-builder-service.cjs');
let formBuilder;
const {PdfAttachmentService}=require('./pdf-attachment-service.cjs');
const {saveAttachment}=require('./pdf-attachment-writer.cjs');
let pdfAttachments=new PdfAttachmentService();
const {PdfSanitizeService}=require('./pdf-sanitize-service.cjs');
let pdfSanitize=new PdfSanitizeService(),sanitizeRestart=null;
const {PdfBookmarkService,PdfBookmarkError}=require('./pdf-bookmark-service.cjs');
let pdfBookmarks=new PdfBookmarkService();
const {PdfDecorationService}=require('./pdf-decoration-service.cjs');
let pdfDecorations=new PdfDecorationService();
const {PdfReviewService}=require('./pdf-review-service.cjs');
let pdfReview=new PdfReviewService(),reviewRestart=null;
const {PdfReviewEditService}=require('./pdf-review-edit-service.cjs');
const {readReviewDraft}=require('./pdf-review-draft-reader.cjs');
const {readChosenJson}=require('./chosen-json-reader.cjs');
let pdfReviewEdits=new PdfReviewEditService(),reviewEditRestart=null;
const {PdfXfdfService}=require('./pdf-xfdf-service.cjs');
let pdfXfdf=new PdfXfdfService(),xfdfRestart=null;
const {PdfPageOrderService}=require('./pdf-page-order-service.cjs');
let pdfPageOrder=new PdfPageOrderService(),pageOrderRestart=null;
const {PdfPageBoxService}=require('./pdf-page-box-service.cjs');
const {PdfPrintMarksService}=require('./pdf-print-marks-service.cjs');
const {PdfThinLineService}=require('./pdf-thin-line-service.cjs');
let pdfPageBoxes=new PdfPageBoxService(),pdfPrintMarks=new PdfPrintMarksService(),pdfThinLines=new PdfThinLineService();
const {safePdfFilename}=require('./smart-file-name-model.cjs');
const namedPdfCopies=new Map();
const {PdfPageRevisionService}=require('./pdf-page-revision-service.cjs');
let pdfPageRevision=new PdfPageRevisionService();
const {PdfXfdfImportService}=require('./pdf-xfdf-import-service.cjs');
const {readChosenXfdf}=require('./chosen-xfdf-reader.cjs');
let pdfXfdfImport=new PdfXfdfImportService(),xfdfImportRestart=null,chosenXfdf=null,xfdfPickGeneration=0;
const {PdfFdfService}=require('./pdf-fdf-service.cjs');
const {readChosenFdf}=require('./chosen-fdf-reader.cjs');
let pdfFdf=new PdfFdfService(),chosenFdf=null,fdfPickGeneration=0;
function clearChosenFdf(){fdfPickGeneration++;chosenFdf?.bytes.fill(0);chosenFdf=null;}
function boundChosenFdf(id,value){const picked=chosenFdf;if(!picked||typeof value?.fdf!=='string'||value.fdf!==picked.base64||picked.sourceId&&picked.sourceId!==id)throw new FileError('FDF_IMPORT','Choose this exact FDF for the current PDF before continuing.');picked.sourceId=id;return picked;}
function clearChosenXfdf(){xfdfPickGeneration++;chosenXfdf?.bytes.fill(0);chosenXfdf=null;}
function boundChosenXfdf(id,value){const picked=chosenXfdf;if(!picked||typeof value?.xfdf!=='string'||value.xfdf!==picked.base64||picked.sourceId&&picked.sourceId!==id)throw new FileError('XFDF_IMPORT','Choose and inspect this exact XFDF for the current PDF before continuing.');picked.sourceId=id;return picked;}

const {PdfTakeoffService}=require('./pdf-takeoff-service.cjs');
let pdfTakeoffs=new PdfTakeoffService(),takeoffRestart=null;
const {PdfTakeoffRecoveryService}=require('./pdf-takeoff-recovery-service.cjs');
let pdfTakeoffRecovery=new PdfTakeoffRecoveryService(),takeoffRecoveryRestart=null;
const {printSettings}=require('./print-settings.cjs');
const {PdfSecurityService}=require('./pdf-security-service.cjs');
let pdfSecurity=new PdfSecurityService(),securityRestart=null;
const {PdfCertificateService}=require('./pdf-certificate-service.cjs');
let pdfCertificates=new PdfCertificateService();
const {PdfCertificateSigningService}=require('./pdf-certificate-signing-service.cjs');
let pdfCertificateSigning=new PdfCertificateSigningService();
const {PdfGeospatialService}=require('./pdf-geospatial-service.cjs');
let pdfGeospatial=new PdfGeospatialService();
const {PdfPreflightService}=require('./pdf-preflight-service.cjs');
let pdfPreflight=new PdfPreflightService();
const {PdfAccessibilityAuditService}=require('./pdf-accessibility-audit-service.cjs');
let pdfAccessibilityAudit=new PdfAccessibilityAuditService();
const {FormFillService}=require('./form-fill-service.cjs');
let formFill=new FormFillService();
const {RestrictedEditService}=require('./restricted-edit-service.cjs');
let restrictedEdits=new RestrictedEditService();
const {DocumentWorkflowService}=require('./document-workflow-service.cjs');
let documentWorkflow=new DocumentWorkflowService();
const {PdfCombineService}=require('./pdf-combine-service.cjs');
const {PdfCombineInputs}=require('./pdf-combine-inputs.cjs');
const {BatchBatesService}=require('./batch-bates-service.cjs');
const {PdfCombineWorkflowService}=require('./pdf-combine-workflow-service.cjs');
let batchBates=new BatchBatesService(),pdfCombineWorkflow=new PdfCombineWorkflowService(),batesPicking=false;
let pdfCombine=new PdfCombineService(),combinePicking=false,combinePickGeneration=0;
const {TiffService}=require('./tiff-service.cjs');
let tiff=new TiffService(),tiffImporting=null,tiffGeneration=0;
const combineInputs=new PdfCombineInputs();
const {DocumentWorkflowLibrary}=require('./document-workflow-library.cjs');
const {DocumentWorkflowSourceService}=require('./document-workflow-source-service.cjs');
let documentWorkflowLibrary,workflowSource=new DocumentWorkflowSourceService();
const workflowSourceIdentities=new Map();
const {PdfRepairService}=require('./pdf-repair-service.cjs');
let pdfRepair=new PdfRepairService();
const {InspectionReportStore}=require('./inspection-report-store.cjs');
const inspectionReports=new InspectionReportStore();
const {PdfTagsService}=require('./pdf-tags-service.cjs');
let pdfTags=new PdfTagsService();
const {PdfPortfolioService}=require('./pdf-portfolio-service.cjs');
let pdfPortfolio=new PdfPortfolioService();
const {PortfolioInputs}=require('./portfolio-inputs.cjs');
const portfolioInputs=new PortfolioInputs();
const {registerScanner}=require('./scanner-register.cjs');
let scannerAdapter;
const {PdfLinkService,validateLinkRequest}=require('./pdf-link-service.cjs');
let pdfLinks=new PdfLinkService();
const pdfToolRestarts=new Map();
async function pdfTool(key,get,job){if(pdfToolRestarts.has(key))await pdfToolRestarts.get(key);return job(get());}
function restartPdfTool(key,old,replace){if(pdfToolRestarts.has(key))return pdfToolRestarts.get(key);const task=old.dispose().then(()=>replace(old.options),()=>{/* Unsafe termination or cleanup keeps this service closed. */}).finally(()=>{if(pdfToolRestarts.get(key)===task)pdfToolRestarts.delete(key);});pdfToolRestarts.set(key,task);return task;}
let nativeLinkReview=null;
const sameLink=(a,b)=>['sourceID','sourceSha256','page','annotationID'].every(key=>a[key]===b[key]);
async function cancelLinkReview(){if(nativeLinkReview){nativeLinkReview.controller.abort();return await pdfLinks.cancel(nativeLinkReview.request.sourceID);}return false;}

app.setPath('userData',path.join(app.getPath('appData'),'pdfix-document-workspace'));
app.setName('PDFix');
if(process.platform==='win32')app.setAppUserModelId('com.pdfix.documentworkspace');
app.enableSandbox();
const APP_CSP="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; worker-src 'self' blob:; font-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const APP_HEADERS={'X-Content-Type-Options':'nosniff','Content-Security-Policy':APP_CSP,'Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=(), usb=(), serial=()','Cache-Control':'no-store'};
function appURL(value){try{const url=new URL(value);return url.protocol==='pdfix:'&&url.host==='app'&&!url.username&&!url.password;}catch{return false;}}

protocol.registerSchemesAsPrivileged([{ scheme: 'pdfix', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
if (process.env.PDFIX_TEST_DATA) app.setPath('userData', path.resolve(process.env.PDFIX_TEST_DATA));
// Isolated automated profiles render without showing or focusing native windows.
const hiddenTest=Boolean(process.env.PDFIX_TEST_DATA)&&process.env.PDFIX_TEST_VISIBLE!=='1';
if(hiddenTest)app.disableHardwareAcceleration();
// Test-only: keep the GPU in the main process while the separate GPU process cannot start on a test PC (A-R4).
if(process.env.PDFIX_TEST_IN_PROCESS_GPU==='1')app.commandLine.appendSwitch('in-process-gpu');
const ownsInstance=app.requestSingleInstanceLock();
if(!ownsInstance)app.quit();
let window, store,compression,redaction,redactionRestart=null,passwords,documentPdf,aiService,closeGuard=false,splitSaves=0,rendererAvailable=false,closeAuthorized=false,closeRequestedAt=0,savedNewDocument=null;
app.on('second-instance',(_event,argv,cwd)=>{if(!windowsContextRequests.enqueue(argv,{defaultApp:!!process.defaultApp}))windowsOpenQueue.enqueue(argv,{defaultApp:!!process.defaultApp,workingDirectory:cwd});window?.webContents.send('pdfix:windows-context-requests');window?.webContents.send('pdfix:windows-open-requests');if(window&&!hiddenTest){if(window.isMinimized())window.restore();window.show();window.focus();}});
function authorize(event) {
  const url = new URL(event.senderFrame?.url || 'about:blank');
  if (event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame || !appURL(url.href) || !['/','/index.html'].includes(url.pathname)) throw new Error('Untrusted application request.');
  graphicsStartup.markInteractive();
}
async function officeForSource(action,id,source,draft){const result=await officeJob(action,source.bytes,draft,{sourceId:id,sourceSha256:source.fingerprint});if(store.source(id)!==source)throw new FileError('CHANGED','The opened Office source changed during processing. Reopen it before continuing.');return result;}
// Technical engine wording becomes plain words on screen; the original goes into the private problem report.
const {plainMessage,scrubPaths}=require('./plain-message.cjs');
function plainFor(e){const plain=plainMessage(e.message);if(plain.technical)noteProblem('technical-error',(e.code||'ERROR')+': '+plain.technical);return plain.message;}
function register(name, callback) {
  ipcMain.handle(`pdfix:${name}`, async (event, ...args) => {
    try { authorize(event); return { ok: true, value: await callback(...args) }; }
    catch (e) { return { ok: false, error: { code: e.code || 'ERROR', message: e instanceof ImageExportError || e instanceof DocumentPdfError || e instanceof FileError || e instanceof RecoveryError || e instanceof SignatureError || e instanceof AutofillError || e instanceof CompressionError || e instanceof RedactionError || e instanceof PasswordError || e instanceof SandboxError || e instanceof AiError || e instanceof PageWorkflowError || e instanceof SheetSetError || e instanceof PdfBookmarkError ? plainFor(e) : 'This action could not finish. Please try again.' } }; }
  });
}
// Problem report: a private diary of notable events the person can save and send by choice (desktop/problem-log.cjs).
const {ProblemLog,systemSummary}=require('./problem-log.cjs');let problems=null;const problemQueue=[];
const noteProblem=(kind,detail)=>{if(problems)problems.note(kind,detail);else if(problemQueue.length<50)problemQueue.push([kind,detail]);};setSandboxReporter(detail=>noteProblem('sandbox',detail));
process.on('uncaughtException',error=>{noteProblem('app error',error?.stack||error);problems?.flushNow();});
process.on('unhandledRejection',error=>{noteProblem('app error',error?.stack||error);});
app.on('child-process-gone',(_event,details)=>{noteProblem('helper stopped',`${details.type} ${details.reason} (exit ${details.exitCode})`);problems?.flushNow();});
app.on('before-quit',()=>{problems?.note('closed','PDFix closed');problems?.flushNow();});
app.on('render-process-gone',(_event,_contents,details)=>{noteProblem('window stopped',`${details.reason} (exit ${details.exitCode})`);problems?.flushNow();});
if(ownsInstance)app.whenReady().then(async () => {
  // The default menu's Reload (Ctrl+R) restarts the interface without the departure checks, losing Undo history and running jobs, and Word users press Ctrl+R for right alignment. Developer tools only when asked for.
  Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'File',submenu:[{role:'quit'}]},{label:'Edit',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'delete'},{type:'separator'},{role:'selectAll'}]},{label:'View',submenu:[{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{type:'separator'},{role:'togglefullscreen'},...(process.env.PDFIX_DEVTOOLS==='1'?[{role:'toggleDevTools'}]:[])]},{label:'Window',submenu:[{role:'minimize'},{role:'close'}]}]));
  store = new FileStore(app.getPath('userData')); await store.init();
  problems=new ProblemLog(app.getPath('userData'));await problems.init();for(const [kind,detail] of problemQueue.splice(0))problems.note(kind,detail);problems.note('started','PDFix '+app.getVersion()+(app.isPackaged?'':' (development run)')+' on Windows '+require('node:os').release());
  register('app-info',()=>({version:app.getVersion(),packaged:app.isPackaged}));
  let problemNotes=0;register('note-problem',text=>{if(typeof text!=='string')return false;if(++problemNotes>500)return false;problems.note('message',text);return true;});
  register('save-problem-report',async()=>{splitSaves++;try{const stamp=new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');const choice=await dialog.showSaveDialog(window,{title:'Save a problem report',defaultPath:path.join(app.getPath('documents'),`PDFix problem report ${stamp}.txt`),filters:[{name:'Text file',extensions:['txt']}]});if(choice.canceled||!choice.filePath)return null;await problems.flush();await fs.writeFile(choice.filePath,problems.report(systemSummary(app)),{encoding:'utf8',flag:'w'});return {name:path.basename(choice.filePath)};}finally{splitSaves--;}});
  store.beforeOpen=async(selected,{storageApproval}={})=>{const inspected=await fileAvailability.inspect(selected);if(inspected.downloadRequired&&!storageApproval){splitSaves++;try{const answer=await dialog.showMessageBox(window,{type:'question',title:'Download the selected synchronized file?',message:inspected.name,detail:'Windows reports this file is offline or needs provider recall. Opening will ask the storage provider already installed on this PC to download it. Only this file is selected; the original will stay unchanged. If the provider cannot supply it, make it available offline and try again.',buttons:['Download and open','Cancel'],defaultId:1,cancelId:1,noLink:true});if(answer.response!==0)throw new FileError('CANCELED','Synchronized file opening canceled.');}finally{splitSaves--;}}return inspected;};
  register('pick-cloud-file',async()=>{splitSaves++;try{const selected=await dialog.showOpenDialog(window,{title:'Choose a synchronized file to inspect',properties:['openFile'],filters:[{name:'PDF and supported documents',extensions:['pdf','docx','pptx','xlsx','rtf','txt','md','png','jpg','jpeg','tif','tiff']}]});if(selected.canceled)return null;const inspected=await fileAvailability.inspect(selected.filePaths[0]),token=require('node:crypto').randomUUID();cloudFileSelections.clear();cloudFileSelections.set(token,{...inspected,expires:Date.now()+10*60*1000});return {...inspected,token};}finally{splitSaves--;}});
  register('discard-cloud-file',token=>cloudFileSelections.delete(token));
  register('open-cloud-file',async(token,approval)=>{const selected=cloudFileSelections.get(token);if(!selected||selected.expires<Date.now()||approval?.reviewed!==true||typeof approval.allowDownload!=='boolean'||(selected.downloadRequired&&!approval.allowDownload))throw new FileError('STORAGE','Choose and review this file again, including any required download.');const current=await fileAvailability.inspect(selected.location);if(['dev','ino','size','mtimeMs','ctimeMs'].some(key=>current.identity[key]!==selected.identity[key]))throw new FileError('CHANGED','The selected synchronized file changed after review. Choose it again.');splitSaves++;try{if(!rendererAvailable)throw new FileError('CANCELED','The file-opening window ended.');const opened=await store.open(selected.location,{storageApproval:approval.allowDownload});cloudFileSelections.delete(token);return opened;}finally{splitSaves--;}});
  const formAutofill=new FormAutofillStore(app.getPath('userData'),safeStorage);
  register('form-autofill-profiles',()=>formAutofill.list());
  register('save-form-autofill-profile',value=>formAutofill.save(value));
  register('remove-form-autofill-profile',id=>formAutofill.remove(id));
  register('clear-form-autofill-profiles',()=>formAutofill.clear());
  documentWorkflowLibrary=new DocumentWorkflowLibrary(path.join(app.getPath('userData'),'document-workflows'));
  pageWorkflows=new PageWorkflows(path.join(app.getPath('userData'),'page-workflows'),store);
  sheetSets=new SheetSets(path.join(app.getPath('userData'),'sheet-sets'),store);
  formBuilder=new FormBuilderService(app.getPath('userData'));
  const root = path.resolve(__dirname, '../dist');
  watchedFolders=new WatchedFolderManager({directory:app.getPath('userData'),safeStorage,runtimeDirectory:path.join(root,'native/document-engine')});await watchedFolders.init();if(watchedFolders.startupProblem)noteProblem('watched-folders',scrubPaths(watchedFolders.startupProblem));
  // Remove document-job copies left in TEMP by an earlier PDFix that was killed mid-job. Delayed so opening stays quick.
  setTimeout(()=>{require('./contained-staging-sweep.cjs').sweepContainedStaging({runtimeDirectory:path.join(root,'native/document-engine')}).then(result=>{if(result.removed||result.failed)console.log('[PDFix] Leftover document jobs: '+result.removed+' removed, '+result.failed+' could not be removed.');}).catch(()=>{});},20000).unref();
  // Packaged layout: Windows entry points (right-click tools) must start the outer graphics launcher (app/PDFix.exe),
  // not the Electron runtime it starts (app/runtime/PDFix.exe), so the one-time graphics retry still applies.
  const outerLauncher=app.isPackaged&&path.basename(path.dirname(process.execPath)).toLowerCase()==='runtime'?path.join(path.dirname(path.dirname(process.execPath)),'PDFix.exe'):null;
  windowsContextTools=new WindowsContextTools({isPackaged:app.isPackaged,executable:outerLauncher&&require('node:fs').existsSync(outerLauncher)?outerLauncher:process.execPath,resourcesPath:process.resourcesPath,appPath:app.getAppPath()});
  const watchedJob=async task=>{try{return await task();}catch(error){throw new FileError('WATCHED_FOLDER',error.message);}};
  register('watched-folder-status',()=>watchedFolders.status());
  register('pick-watched-folder',options=>watchedJob(async()=>{splitSaves++;try{const source=await dialog.showOpenDialog(window,{title:'Choose the exact source folder to watch',properties:['openDirectory']});if(source.canceled)return null;const output=await dialog.showOpenDialog(window,{title:'Choose a disjoint output folder for new copies',properties:['openDirectory']});if(output.canceled)return null;return await watchedFolders.propose(source.filePaths[0],output.filePaths[0],options);}finally{splitSaves--;}}));
  register('approve-watched-folder',(token,approval)=>watchedJob(()=>watchedFolders.approve(token,approval)));
  register('pause-watched-folder',id=>watchedJob(()=>watchedFolders.pause(id)));
  register('resume-watched-folder',(id,review)=>watchedJob(()=>watchedFolders.resume(id,review)));
  register('revoke-watched-folder',id=>watchedJob(()=>watchedFolders.revoke(id)));
  register('review-watched-folder-job',(id,review)=>watchedJob(()=>watchedFolders.reviewJob(id,review)));
  register('skip-watched-folder-job',id=>watchedJob(()=>watchedFolders.skipJob(id)));
  register('save-watched-folder-report',()=>watchedJob(async()=>{const bytes=Buffer.from(JSON.stringify(watchedFolders.report(),null,2));splitSaves++;try{const chosen=await dialog.showSaveDialog(window,{title:'Save watched-folder receipts',defaultPath:'PDFix-watched-folder-receipts.json',filters:[{name:'JSON',extensions:['json']}]});return chosen.canceled?null:await store.saveCopy(null,chosen.filePath,bytes,'json',createHash('sha256').update(bytes).digest('hex'));}finally{bytes.fill(0);splitSaves--;}}));
  register('windows-context-tools-status',()=>windowsContextTools.status());
  register('install-windows-context-tools',()=>windowsContextTools.install());
  register('remove-windows-context-tools',()=>windowsContextTools.remove());
  register('windows-context-requests',()=>windowsContextRequests.list());
  register('dismiss-windows-context-requests',ids=>windowsContextRequests.dismiss(ids));
  register('review-windows-context-requests',async(action,ids)=>{splitSaves++;try{const result=await windowsContextRequests.review(action,ids,{store,dialog,window:()=>window,check:()=>{if(!rendererAvailable)throw new FileError('CANCELED','The reviewing window ended.');}});if(!result.canceled&&action==='merge'){if(pdfCombine.active||pdfCombineWorkflow.active)throw new FileError('BUSY','Finish the current PDF combination operation first.');result.combineSelection=seedWindowsContextCombineInputs(combineInputs,store,result.files.map(f=>f.id));}return result;}finally{splitSaves--;}});
  restrictedEdits=new RestrictedEditService({engineDirectory:path.join(root,'native/qpdf'),runtimeDirectory:path.join(root,'native/document-engine'),stagingDirectory:path.join(app.getPath('userData'),'restricted-edit-staging')});
  try{await restrictedEdits.init();}catch(error){store.recoveryWarning=[store.recoveryWarning,error.message].filter(Boolean).join(' ');}
  pdfRepair=new PdfRepairService({engineDirectory:path.join(root,'native/qpdf'),runtimeDirectory:path.join(root,'native/document-engine'),stagingDirectory:path.join(app.getPath('userData'),'repair-staging')});
  pdfOutputCheck=new PdfOutputCheckService({engineDirectory:path.join(root,'native/qpdf'),runtimeDirectory:path.join(root,'native/document-engine'),stagingDirectory:path.join(app.getPath('userData'),'output-check-staging')});
  pagedPdf=new PagedPdfService({engineDirectory:path.join(root,'native/qpdf'),stagingDirectory:path.join(app.getPath('userData'),'paged-reading')});
  store.onReleaseSource=id=>{restrictedEdits.forget(id);return pagedPdf.release(id);};
  store.verifyUnsealedPdf=value=>pdfTool('outputCheck',()=>pdfOutputCheck,service=>service.verify(value));
  compression=new CompressionEngine(path.join(app.getPath('userData'),'compression'),path.join(root,'native/qpdf'));
  batchCompression=new BatchCompression(compression);
  documentPdf=new DocumentPdfService(BrowserWindow);
  redaction=new RedactionService();
  passwords=new PasswordEngine(path.join(app.getPath('userData'),'password-jobs'),path.join(root,'native/qpdf'));
  try{await passwords.init();}catch(error){store.recoveryWarning=[store.recoveryWarning,error.message].filter(Boolean).join(' ');}
  try{await compression.init();}catch(error){store.recoveryWarning=[store.recoveryWarning,error.message].filter(Boolean).join(' ');}
  const realRoot=await fs.realpath(root);
  protocol.handle('pdfix', async request => {
    const url = new URL(request.url);
    if (!appURL(request.url)) return new Response('Unavailable', { status: 404 });
    if(!['GET','HEAD'].includes(request.method))return new Response('Method unavailable',{status:405,headers:APP_HEADERS});
    const printHtml=documentPdf.response(url.pathname);if(printHtml!==null)return new Response(request.method==='HEAD'?null:printHtml,{headers:{...APP_HEADERS,'Content-Type':'text/html; charset=utf-8'}});
    let file;
    try { file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)); } catch { return new Response('Invalid path', {status:400}); }
    const relative=path.relative(root,file);
    if(!relative||relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep)[0].toLowerCase()==='native')return new Response('Forbidden',{status:403,headers:APP_HEADERS});
    const types = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.wasm':'application/wasm', '.bcmap':'application/octet-stream', '.ttf':'font/ttf', '.pfb':'application/octet-stream' };
    try {
      const realFile=await fs.realpath(file),realRelative=path.relative(realRoot,realFile);
      if(!realRelative||realRelative.startsWith('..')||path.isAbsolute(realRelative)||(await fs.lstat(file)).isSymbolicLink())return new Response('Forbidden',{status:403,headers:APP_HEADERS});
      return new Response(request.method==='HEAD'?null:await fs.readFile(realFile),{headers:{...APP_HEADERS,'Content-Type':types[path.extname(file)] || 'application/octet-stream'}});
    } catch { return new Response('Not found', {status:404,headers:APP_HEADERS}); }
  });
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.setDevicePermissionHandler(() => false);
  session.defaultSession.on('will-download',event=>event.preventDefault());
  // Settings kept in localStorage reach disk lazily; a sudden close lost them (spare PC, Oct 31). Write them every 2 s.
  setInterval(()=>{try{session.defaultSession.flushStorageData();}catch{}},2000).unref?.();
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    // Bundled resources only; document links cannot download files or contact the network.
    callback({ cancel: !appURL(details.url)&&!details.url.startsWith('devtools:') });
  });
  window = new BrowserWindow({ width: 1380, height: 920, minWidth: 800, minHeight: 620, backgroundColor: '#f6f8f6', title: 'PDFix', icon:path.join(root,'brand/pdfix.ico'), show: false, autoHideMenuBar: true, webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, spellcheck: false, backgroundThrottling: !hiddenTest, offscreen: hiddenTest } });
  require('./pdfix-window-branding.cjs').configureWindowBranding(window,{app,root});
  if(hiddenTest)window.webContents.setFrameRate(60);
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.on('will-frame-navigate',event=>event.preventDefault());
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  let hiddenFullscreen=false;
  // Hidden test runs keep their window off screen: Windows shows any window that enters native fullscreen, so hidden
  // runs record the state and report it to the page instead. Normal and visible runs use real fullscreen.
  const windowState=()=>({fullscreen:hiddenTest?hiddenFullscreen:window.isFullScreen()});
  window.on('enter-full-screen',()=>window.webContents.send('pdfix:window-state',{fullscreen:true}));
  window.on('leave-full-screen',()=>window.webContents.send('pdfix:window-state',{fullscreen:false}));
  register('review-pdf-link',async value=>{
    let request;try{request=validateLinkRequest(value);}catch(error){throw new FileError('LINK',error.message);}
    const source=store.source(request.sourceID);
    if(nativeLinkReview)throw new FileError('LINK','Finish or cancel the current destination review first.');
    const review={request,source,controller:new AbortController()};nativeLinkReview=review;
    const unchanged=()=>{if(review.controller.signal.aborted||store.source(request.sourceID)!==source||source.fingerprint!==request.sourceSha256)throw new FileError('CHANGED','Destination review ended or the opened PDF changed. No browser was opened.');};
    try{
      let destination;try{destination=await pdfTool('links',()=>pdfLinks,service=>service.resolve(request,source));}catch(error){throw new FileError('LINK',error.message);}
      unchanged();
      const answer=await dialog.showMessageBox(window,{type:'question',title:'Review PDF web destination',message:'Open this destination in your browser?',detail:'Source: '+source.name+'\nPhysical page: '+request.page+'\nHost: '+destination.host+'\n\nVerified destination:\n'+destination.url+'\n\nThis URL comes from the PDF. Your browser will connect to that website. Website safety, identity and content have not been verified. PDFix has not executed a document script or opened an attachment.',buttons:['Cancel','Open in browser'],defaultId:0,cancelId:0,noLink:true,signal:review.controller.signal});
      if(answer.response!==1||review.controller.signal.aborted)return {opened:false,message:'Browser opening canceled.'};
      unchanged();await shell.openExternal(destination.url,{activate:true});return {opened:true};
    }finally{if(nativeLinkReview===review)nativeLinkReview=null;}
  });
  register('cancel-pdf-link',async value=>{let request;try{request=validateLinkRequest(value);}catch{return false;}if(nativeLinkReview&&sameLink(nativeLinkReview.request,request)){await cancelLinkReview();return true;}return false;});
  register('read-pdf-security',async id=>{const source=store.source(id);try{if(securityRestart)await securityRestart;const report=await pdfSecurity.inspect(id,source);if(store.source(id)!==source||report.sha256!==source.fingerprint)throw new FileError('CHANGED','Reopen the unchanged PDF before inspecting it.');return report;}catch(error){throw error instanceof FileError?error:new FileError('SECURITY',error.message);}});
  register('cancel-pdf-security',id=>pdfSecurity.cancel(id));
  aiService=await registerAi({folder:app.getPath('userData'),safeStorage,source:id=>store.source(id),register,dialog,window:()=>window});
  register('ai-context-sources',()=>contextSources(store));
  register('ai-context-text',id=>{try{return contextText(store,id);}catch(error){throw new FileError('AI_CONTEXT',error.message);}});
  register('windows-open-requests',()=>windowsOpenQueue.list());
  register('windows-discard-request',id=>windowsOpenQueue.discard(id));
  register('windows-open-request',async id=>{splitSaves++;try{return await windowsOpenQueue.open(id,{store,dialog,window:()=>window});}catch(error){throw new FileError('OPEN',error.message);}finally{splitSaves--;}});
  const cleanupJob=async(id,job)=>{const source=store.source(id);try{const result=await job(source);if(store.source(id)!==source)throw new FileError('CHANGED','The opened PDF changed. Prepare a new cleanup preview.');return result;}catch(error){throw error instanceof FileError?error:new FileError('CLEANUP',error.message);}};
  register('inspect-pdf-certificates',id=>cleanupJob(id,source=>pdfTool('certificates',()=>pdfCertificates,async tool=>{const report=await tool.inspect(id,source);if(report.sourceSha256!==source.fingerprint)throw new FileError('CHANGED','The certificate inspection does not match the opened snapshot.');return report;})));
  register('cancel-pdf-certificates',id=>pdfCertificates.cancel(id));
  register('inspect-pdf-certificate-signing',id=>cleanupJob(id,source=>pdfTool('certificateSigning',()=>pdfCertificateSigning,tool=>tool.inspect(id,source))));
  register('list-pdf-signing-certificates',async()=>{try{return await pdfTool('certificateSigning',()=>pdfCertificateSigning,tool=>tool.listCertificates());}catch(error){throw new FileError('CERTIFICATE_SIGNING',error.message);}});
  register('sign-pdf-with-certificate',(id,token,selection)=>cleanupJob(id,source=>pdfTool('certificateSigning',()=>pdfCertificateSigning,tool=>tool.sign(id,source,token,selection))));
  register('cancel-pdf-certificate-signing',(id,token)=>pdfCertificateSigning.cancel(id,token));
  register('discard-pdf-certificate-signing',(id,token)=>pdfCertificateSigning.discard(id,token));
  register('inspect-pdf-repair',(id,token)=>cleanupJob(id,source=>pdfTool('repair',()=>pdfRepair,tool=>tool.inspect(id,source,token))));
  register('repair-pdf-copy',(id,token,selection)=>cleanupJob(id,source=>pdfTool('repair',()=>pdfRepair,tool=>tool.repair(id,source,token,selection))));
  register('cancel-pdf-repair',(id,token)=>pdfRepair.cancel(id,token));
  register('discard-pdf-repair',(id,token)=>pdfRepair.discard(id,token));
  register('get-pdf-repair-status',()=>pdfRepair.status());
  register('pick-pdf-fdf',()=>pdfTool('fdf',()=>pdfFdf,async service=>{if(service.disposed||service.active)throw new FileError('FDF_IMPORT','Finish or cancel the current FDF job before choosing a comment file.');const previousId=chosenFdf?.sourceId??service.verified?.sourceId??service.inspected?.sourceId;if(previousId)await service.discard(previousId);clearChosenFdf();const generation=fdfPickGeneration;splitSaves++;try{const chosen=await dialog.showOpenDialog(window,{title:'Choose FDF drawing comments to import',properties:['openFile'],filters:[{name:'FDF comments',extensions:['fdf']}]});if(chosen.canceled)return null;if(service!==pdfFdf||service.disposed||generation!==fdfPickGeneration)throw new FileError('CANCELED','The FDF picker ended with its application session.');const picked=await readChosenFdf(chosen.filePaths[0]);if(service!==pdfFdf||service.disposed||generation!==fdfPickGeneration){picked.bytes.fill(0);throw new FileError('CANCELED','The FDF selection ended with its application session.');}chosenFdf={...picked,base64:picked.bytes.toString('base64'),sourceId:null};return {name:picked.name,bytes:Uint8Array.from(picked.bytes),sha256:picked.sha256};}finally{splitSaves--;}}));
  register('inspect-pdf-fdf-import',(id,value)=>cleanupJob(id,source=>pdfTool('fdf',()=>pdfFdf,async service=>{const picked=boundChosenFdf(id,value),report=await service.inspect(id,source,value);if(chosenFdf!==picked||service!==pdfFdf||report.fdfSha256!==picked.sha256)throw new FileError('CHANGED','The chosen FDF changed. Choose and inspect it again.');return report;})));
  register('build-pdf-fdf-import',(id,token,draft)=>cleanupJob(id,source=>pdfTool('fdf',()=>pdfFdf,async service=>{const picked=boundChosenFdf(id,draft),result=await service.buildImport(id,source,token,draft);if(chosenFdf!==picked||service!==pdfFdf||result.report.fdfSha256!==picked.sha256){await service.discard(id,token);throw new FileError('CHANGED','The chosen FDF changed. Prepare a fresh import.');}return result;})));
  register('build-pdf-fdf',(id,token,draft)=>cleanupJob(id,source=>pdfTool('fdf',()=>pdfFdf,service=>service.buildExport(id,source,token,draft))));
  register('cancel-pdf-fdf',(id,token)=>pdfTool('fdf',()=>pdfFdf,async service=>{if(!token&&(!chosenFdf?.sourceId||chosenFdf.sourceId===id))clearChosenFdf();return service.cancel(id,token);}));
  register('discard-pdf-fdf',(id,token)=>pdfTool('fdf',()=>pdfFdf,async service=>{if(!token&&(!chosenFdf?.sourceId||chosenFdf.sourceId===id))clearChosenFdf();return service.discard(id,token);}));
  const workflowIdentity=async(id,source)=>{const cached=workflowSourceIdentities.get(id);if(cached?.fingerprint===source.fingerprint&&cached.size===source.bytes.length&&cached.identity.sourceSha256===source.fingerprint)return cached.identity;const identity=await pdfTool('workflowSource',()=>workflowSource,service=>service.inspect(id,source));if(store.source(id)!==source)throw new FileError('CHANGED','The workflow source changed during inspection.');if(workflowSourceIdentities.size>=20)workflowSourceIdentities.clear();workflowSourceIdentities.set(id,{fingerprint:source.fingerprint,size:source.bytes.length,identity});return identity;};
  const workflowLibraryAction=action=>async(...args)=>{try{return await action(...args);}catch(error){throw error instanceof FileError?error:new FileError('WORKFLOW_LIBRARY',error.message);}};
  register('list-document-workflow-definitions',workflowLibraryAction(()=>documentWorkflowLibrary.listDefinitions()));
  register('save-document-workflow-definition',workflowLibraryAction((name,count,steps)=>documentWorkflowLibrary.saveDefinition(name,count,steps)));
  register('load-document-workflow-definition',workflowLibraryAction((id,count)=>documentWorkflowLibrary.loadDefinition(id,count)));
  register('remove-document-workflow-definition',workflowLibraryAction(id=>documentWorkflowLibrary.removeDefinition(id)));
  register('save-document-workflow-draft',workflowLibraryAction((id,steps)=>cleanupJob(id,async source=>{const identity=await workflowIdentity(id,source);return documentWorkflowLibrary.saveDraft(identity.sourceSha256,identity.pageCount,steps);})));
  register('read-document-workflow-draft',workflowLibraryAction(id=>cleanupJob(id,async source=>{const identity=await workflowIdentity(id,source);return documentWorkflowLibrary.readDraft(identity.sourceSha256,identity.pageCount);})));
  register('clear-document-workflow-draft',workflowLibraryAction(id=>cleanupJob(id,source=>documentWorkflowLibrary.clearDraft(source.fingerprint))));
  register('tiff-inspect',(id,token)=>cleanupJob(id,source=>pdfTool('tiff',()=>tiff,service=>service.inspect(id,source,token))));
  register('tiff-page',(id,token,index)=>cleanupJob(id,source=>pdfTool('tiff',()=>tiff,service=>service.page(id,source,token,index))));
  const stopTiff=async(id,token,discard)=>{tiffGeneration++;await pdfTool('tiff',()=>tiff,service=>discard?service.discard(id,token):service.cancel(id,token));if(tiffImporting)await tiffImporting.done;return true;};
  register('tiff-cancel',(id,token)=>stopTiff(id,token,false));register('tiff-discard',(id,token)=>stopTiff(id,token,true));
  register('tiff-import',async(id,token,indices)=>{if(tiffImporting)throw new FileError('TIFF','Finish or cancel the current TIFF import first.');const source=store.source(id);let finish;const operation={done:new Promise(resolve=>{finish=resolve;})};tiffImporting=operation;const generation=tiffGeneration,service=tiff,pages=[],receipts=[],opened=[],warnings=[];let folder;splitSaves++;const current=()=>{if(generation!==tiffGeneration||tiff!==service||!rendererAvailable||store.source(id)!==source)throw new FileError('TIFF','The TIFF import ended with its selected source session.');};try{if(!Array.isArray(indices)||!indices.length||indices.length>10||new Set(indices).size!==indices.length)throw new Error('Choose one to ten distinct TIFF pages.');for(const index of indices){current();const decoded=await pdfTool('tiff',()=>tiff,tool=>tool.page(id,source,token,index));decoded.bytes.fill(0);current();}const retained=service.output(id,source,token,indices);pages.push(...retained.pages);current();const chosen=await dialog.showOpenDialog(window,{title:'Choose a folder for reviewed TIFF page copies',properties:['openDirectory']});current();if(chosen.canceled)return null;const parent=await fs.realpath(chosen.filePaths[0]);if(!(await fs.lstat(parent)).isDirectory())throw new Error('Choose an available image folder.');folder=path.join(parent,'PDFix TIFF pages '+new Date().toISOString().replace(/[:.]/g,'-')+' '+require('node:crypto').randomUUID().slice(0,8));await fs.mkdir(folder);for(const page of pages){current();receipts.push(await store.saveCopy(id,path.join(folder,'tiff-page-'+String(page.report.page+1).padStart(3,'0')+'.png'),page.bytes,'png',page.report.sha256));current();}for(let i=0;i<receipts.length;i++){if(generation!==tiffGeneration||!rendererAvailable)throw new Error('TIFF import cancelled after saving image copies.');try{opened.push(await store.open(receipts[i].location,{retain:i>0,maxBytes:32*1024*1024,expectedHash:pages[i].report.sha256}));}catch(error){if(!opened.length)throw error;warnings.push('Some verified TIFF images remain in '+folder+' and could not all be opened: '+error.message);break;}}return {...opened[0],capturedImages:opened.slice(1),savedTiffImages:receipts,tiffWarnings:warnings};}catch(error){throw new FileError('TIFF',error.message+(receipts.length?' '+receipts.length+' verified PNG copies remain in '+folder+'. Originals are unchanged.':''));}finally{for(const page of pages)page.bytes.fill(0);if(tiffImporting===operation)tiffImporting=null;finish();splitSaves--;}});
  const combineAction=action=>async(...args)=>{try{return await action(...args);}catch(error){throw error instanceof FileError?error:new FileError('PDF_COMBINE',error.message);}};
  const combineJob=(sessionId,ids,action,key='combine',get=()=>pdfCombine)=>pdfTool('combine',()=>pdfCombine,()=>pdfTool(key,get,async service=>{const sources=combineInputs.resolve(sessionId,ids);if(!combineInputs.current(sessionId,sources))throw new FileError('CHANGED','A selected PDF snapshot changed. Choose the files again.');const result=await action(service,sources);if(!combineInputs.current(sessionId,sources))throw new FileError('CHANGED','The selected combination session changed. Prepare a new preview.');return result;}));
  register('pick-pdf-combine-sources',combineAction(()=>pdfTool('combine',()=>pdfCombine,async service=>{if(combinePicking||service.disposed||service.active)throw new Error('Finish or cancel the current PDF combination first.');combinePicking=true;const generation=++combinePickGeneration;splitSaves++;try{if(combineInputs.sessionId){await service.discard(combineInputs.sessionId);await pdfCombineWorkflow.discard(combineInputs.sessionId);}combineInputs.clear();const chosen=await dialog.showOpenDialog(window,{title:'Choose original PDFs to combine',properties:['openFile','multiSelections'],filters:[{name:'PDF originals',extensions:['pdf']}]});const current=()=>{if(!rendererAvailable||service!==pdfCombine||generation!==combinePickGeneration)throw new Error('The PDF combination picker ended with its session.');};current();if(chosen.canceled)return null;return await combineInputs.pick(chosen.filePaths,current);}finally{combinePicking=false;splitSaves--;}})));
  register('pdf-combine-source',combineAction((sessionId,id)=>combineInputs.source(sessionId,id)));
  register('inspect-pdf-combine',combineAction((sessionId,ids)=>combineJob(sessionId,ids,(service,sources)=>service.inspect(sessionId,sources))));
  register('build-pdf-combine',combineAction((sessionId,ids,token,draft)=>combineJob(sessionId,ids,(service,sources)=>service.build(sessionId,sources,token,draft))));
  register('cancel-pdf-combine',combineAction((sessionId,token)=>pdfTool('combine',()=>pdfCombine,service=>service.cancel(sessionId,token))));
  register('discard-pdf-combine',combineAction((sessionId,token)=>pdfTool('combine',()=>pdfCombine,service=>service.discard(sessionId,token))));
  register('build-document-workflow',(id,token,steps)=>cleanupJob(id,source=>pdfTool('documentWorkflow',()=>documentWorkflow,tool=>tool.build(id,source,token,steps))));
  register('cancel-document-workflow',(id,token)=>pdfTool('documentWorkflow',()=>documentWorkflow,tool=>tool.cancel(id,token)));
  register('discard-document-workflow',(id,token)=>pdfTool('documentWorkflow',()=>documentWorkflow,tool=>tool.discard(id,token)));
  register('inspect-pdf-form-fill',(id,token,restricted=false)=>cleanupJob(id,async source=>{if(typeof restricted!=='boolean')throw Error('Choose a valid form inspection.');if(restricted){const result=await pdfTool('restrictedEdit',()=>restrictedEdits,tool=>tool.inspect(id,source,token,'form'));if(result)return result;}return pdfTool('formFill',()=>formFill,tool=>tool.inspect(id,source,token));}));
  register('build-pdf-form-fill',(id,token,draft)=>cleanupJob(id,source=>restrictedEdits.isRestricted(id,source)?pdfTool('restrictedEdit',()=>restrictedEdits,tool=>tool.build(id,source,token,'form',draft)):pdfTool('formFill',()=>formFill,tool=>tool.build(id,source,token,draft))));
  register('cancel-pdf-form-fill',(id,token)=>Promise.all([formFill.cancel(id,token),restrictedEdits.cancel(id,token)]));
  register('discard-pdf-form-fill',(id,token)=>Promise.all([formFill.discard(id,token),restrictedEdits.discard(id,token)]));
  register('inspect-restricted-pdf-edit',(id,token,kind)=>cleanupJob(id,source=>pdfTool('restrictedEdit',()=>restrictedEdits,tool=>tool.inspect(id,source,token,kind))));
  register('build-restricted-pdf-edit',(id,token,kind,draft)=>cleanupJob(id,source=>pdfTool('restrictedEdit',()=>restrictedEdits,tool=>tool.build(id,source,token,kind,draft))));
  register('cancel-restricted-pdf-edit',(id,token)=>restrictedEdits.cancel(id,token));
  register('discard-restricted-pdf-edit',(id,token)=>restrictedEdits.discard(id,token));
  register('inspect-pdf-preflight',(id,profileId)=>cleanupJob(id,source=>pdfTool('preflight',()=>pdfPreflight,async tool=>{const generation=inspectionReports.begin('preflight'),report=await tool.inspect(id,source,profileId);if(store.source(id)!==source)throw new FileError('CHANGED','The inspection source changed. Inspect again.');return {...report,exportToken:inspectionReports.retain('preflight',generation,id,source,report)};})));
  register('cancel-pdf-preflight',id=>{inspectionReports.clear('preflight',id);return pdfPreflight.cancel(id);});
  register('discard-pdf-preflight',id=>{inspectionReports.clear('preflight',id);return pdfPreflight.discard(id);});
  register('inspect-pdf-accessibility-audit',(id,token)=>cleanupJob(id,source=>pdfTool('accessibilityAudit',()=>pdfAccessibilityAudit,async tool=>{const generation=inspectionReports.begin('accessibilityAudit'),report=await tool.inspect(id,source,token);if(store.source(id)!==source)throw new FileError('CHANGED','The audit source changed. Inspect again.');return {...report,exportToken:inspectionReports.retain('accessibilityAudit',generation,id,source,report)};})));
  register('cancel-pdf-accessibility-audit',(id,token)=>{inspectionReports.clear('accessibilityAudit',id);return pdfAccessibilityAudit.cancel(id,token);});
  register('discard-pdf-accessibility-audit',(id,token)=>{inspectionReports.clear('accessibilityAudit',id);return pdfAccessibilityAudit.discard(id,token);});
  const saveInspectionReport=(family,title,suffix)=>(id,token)=>cleanupJob(id,async source=>{
    const output=inspectionReports.output(family,id,source,token);splitSaves++;
    try{const chosen=await dialog.showSaveDialog(window,{title,defaultPath:path.join(path.dirname(source.path),path.basename(source.name,path.extname(source.name))+suffix+'.json'),filters:[{name:'JSON inspection evidence',extensions:['json']}]});if(chosen.canceled)return null;
      const current=inspectionReports.output(family,id,store.source(id),token);try{if(current.sha256!==output.sha256)throw new FileError('CHANGED','The reviewed report changed. Inspect again.');return await store.saveCopy(id,chosen.filePath,current.bytes,'json',current.sha256);}finally{current.bytes.fill(0);}
    }finally{output.bytes.fill(0);splitSaves--;}
  });
  register('save-pdf-preflight-report',saveInspectionReport('preflight','Save reviewed print inspection report','-preflight-report'));
  register('save-pdf-accessibility-audit-report',saveInspectionReport('accessibilityAudit','Save reviewed accessibility audit evidence','-accessibility-audit'));
  register('inspect-pdf-geospatial',id=>cleanupJob(id,source=>pdfTool('geospatial',()=>pdfGeospatial,tool=>tool.inspect(id,source))));
  register('query-pdf-geospatial',(id,inventoryToken,value)=>cleanupJob(id,source=>pdfTool('geospatial',()=>pdfGeospatial,tool=>tool.query(id,source,inventoryToken,value))));
  register('cancel-pdf-geospatial',id=>pdfGeospatial.cancel(id));
  register('discard-pdf-geospatial',id=>pdfGeospatial.discard(id));
  localTextTools=registerLocalTextTools({register,getWindow:()=>window,userData:app.getPath('userData'),store,dialog,saveLease:delta=>{splitSaves+=delta;},isAvailable:()=>rendererAvailable});
  scannerAdapter=registerScanner({root:path.join(app.getPath('userData'),'scanner-captures'),register,store,dialog,getWindow:()=>window,isAvailable:()=>rendererAvailable,saveLease:delta=>{splitSaves+=delta;}});
  window.webContents.on('render-process-gone',()=>{
    restartPdfTool('geospatial',pdfGeospatial,options=>{pdfGeospatial=new PdfGeospatialService(options);});
    inspectionReports.dispose();
    restartPdfTool('outputCheck',pdfOutputCheck,options=>{pdfOutputCheck=new PdfOutputCheckService(options);});
    restartPdfTool('pagedPdf',pagedPdf,options=>{pagedPdf=new PagedPdfService(options);});
    restartPdfTool('repair',pdfRepair,options=>{pdfRepair=new PdfRepairService(options);});
    restartPdfTool('formFill',formFill,options=>{formFill=new FormFillService(options);});
    restartPdfTool('restrictedEdit',restrictedEdits,options=>{restrictedEdits=new RestrictedEditService(options);});
    restartPdfTool('documentWorkflow',documentWorkflow,options=>{documentWorkflow=new DocumentWorkflowService(options);});
    workflowSourceIdentities.clear();restartPdfTool('workflowSource',workflowSource,options=>{workflowSource=new DocumentWorkflowSourceService(options);});
    tiffGeneration++;restartPdfTool('tiff',tiff,options=>{tiff=new TiffService(options);});
    combinePickGeneration++;const priorCombine=pdfCombine,priorCombineWorkflow=pdfCombineWorkflow;const combinedRestart=Promise.all([priorCombine.dispose(),priorCombineWorkflow.dispose()]).then(()=>{combineInputs.clear();pdfCombine=new PdfCombineService(priorCombine.options);pdfCombineWorkflow=new PdfCombineWorkflowService(priorCombineWorkflow.options);},()=>{/* Both stay closed and original snapshots stay retained after unsafe cleanup. */}).finally(()=>{if(pdfToolRestarts.get('combine')===combinedRestart)pdfToolRestarts.delete('combine');if(pdfToolRestarts.get('combineWorkflow')===combinedRestart)pdfToolRestarts.delete('combineWorkflow');});pdfToolRestarts.set('combine',combinedRestart);pdfToolRestarts.set('combineWorkflow',combinedRestart);restartPdfTool('batchBates',batchBates,options=>{batchBates=new BatchBatesService(options);});
    clearChosenFdf();restartPdfTool('fdf',pdfFdf,options=>{pdfFdf=new PdfFdfService(options);});
    restartPdfTool('preflight',pdfPreflight,options=>{pdfPreflight=new PdfPreflightService(options);});
    restartPdfTool('accessibilityAudit',pdfAccessibilityAudit,options=>{pdfAccessibilityAudit=new PdfAccessibilityAuditService(options);});
    restartPdfTool('certificateSigning',pdfCertificateSigning,options=>{pdfCertificateSigning=new PdfCertificateSigningService(options);});
    portfolioInputs.clear();
    restartPdfTool('portfolio',pdfPortfolio,options=>{pdfPortfolio=new PdfPortfolioService(options);});
    restartPdfTool('pageRevision',pdfPageRevision,options=>{pdfPageRevision=new PdfPageRevisionService(options);});
    restartPdfTool('tags',pdfTags,options=>{pdfTags=new PdfTagsService(options);});
    localTextTools?.disposeOwner().catch(()=>{/* Failed local helper exit keeps these tools closed. */});
    scannerAdapter?.disposeOwner().catch(()=>{/* A failed device cleanup keeps scanner capture closed. */});
  });
  register('inspect-pdf-tags',id=>cleanupJob(id,source=>pdfTool('tags',()=>pdfTags,tool=>tool.inspect(id,source))));
  register('build-pdf-tags',(id,token,selection)=>cleanupJob(id,source=>pdfTool('tags',()=>pdfTags,tool=>tool.build(id,source,token,selection))));
  register('cancel-pdf-tags',(id,token)=>pdfTags.cancel(id,token));
  register('discard-pdf-tags',(id,token)=>pdfTags.discard(id,token));
  register('inspect-pdf-portfolio',id=>cleanupJob(id,source=>pdfTool('portfolio',()=>pdfPortfolio,tool=>tool.inspect(id,source))));
  register('build-pdf-portfolio',(id,inventoryToken,token,draft)=>cleanupJob(id,source=>pdfTool('portfolio',()=>pdfPortfolio,async tool=>{
    if(!Array.isArray(draft?.entries))throw new FileError('PORTFOLIO','Choose explicit portfolio contents before building.');
    const chosen=[...new Set(draft.entries.filter(entry=>entry?.kind==='opened').map(entry=>entry.sourceId))];
    const retained=[],opened=[];
    for(const sourceId of chosen){
      if(portfolioInputs.entries.has(sourceId)){const [entry]=portfolioInputs.resolve(id,[sourceId]);retained.push(entry);opened.push({sourceId,bytes:entry.bytes,fingerprint:entry.sha256});}
      else {const item=store.source(sourceId);if(item.fileBacked)throw new FileError('PORTFOLIO','Each embedded source must fit the 10 MiB portfolio entry limit.');opened.push({sourceId,bytes:item.bytes,fingerprint:item.fingerprint,source:item});}
    }
    const result=await tool.build(id,source,inventoryToken,draft,token,opened);
    if(!portfolioInputs.current(id,retained)||opened.some(item=>item.source&&store.source(item.sourceId)!==item.source)){await tool.discard(id,token);throw new FileError('CHANGED','A chosen portfolio source changed. Rebuild with the retained inputs.');}
    return result;
  })));
  register('select-pdf-portfolio-entry',(id,inventoryToken,entryId,token)=>cleanupJob(id,source=>pdfTool('portfolio',()=>pdfPortfolio,tool=>tool.select(id,source,inventoryToken,entryId,token))));
  register('cancel-pdf-portfolio',(id,token)=>pdfPortfolio.cancel(id,token));
  register('discard-pdf-portfolio',(id,token)=>pdfPortfolio.discard(id,token));
  register('preview-pdf-portfolio-entry',(id,token)=>cleanupJob(id,source=>pdfTool('portfolio',()=>pdfPortfolio,tool=>{
    const output=tool.outputSelection(id,source,token);
    try{validateFile('embedded-preview.pdf',output.bytes);return {bytes:Uint8Array.from(output.bytes),report:output.report};}
    finally{output.bytes.fill(0);}
  })));
  register('discard-pdf-portfolio-inputs',id=>portfolioInputs.clear(id));
  register('pick-pdf-portfolio-source',id=>cleanupJob(id,async source=>{
    splitSaves++;try{
      const chosen=await dialog.showOpenDialog(window,{title:'Choose an inert file to embed in this portfolio',properties:['openFile'],filters:[{name:'Portfolio source files',extensions:['*']}]});
      if(chosen.canceled)return null;
      const current=()=>{if(!rendererAvailable||store.source(id)!==source)throw new FileError('CHANGED','The portfolio source session ended. Choose this file again.');};
      return await portfolioInputs.pick(id,chosen.filePaths[0],current);
    }finally{splitSaves--;}
  }));
  const formBuilderJob=async(id,job)=>{const source=store.source(id);try{const result=await job(source);if(store.source(id)!==source)throw new FileError('CHANGED','The opened PDF changed. Rebuild the form preview.');return result;}catch(error){throw error instanceof FileError?error:new FileError('FORM_BUILD',error.message);}};
  const tableDrafts=createTableCorrectionDraftIO({store,dialog,getWindow:()=>window,inspectSource:async(id,source)=>{if(securityRestart)await securityRestart;return pdfSecurity.inspect(id,source);}});
  register('save-table-correction-draft',(id,value)=>cleanupJob(id,async()=>{splitSaves++;try{return await tableDrafts.save(id,value);}finally{splitSaves--;}}));
  register('pick-table-correction-draft',id=>cleanupJob(id,async()=>{splitSaves++;try{return await tableDrafts.load(id);}finally{splitSaves--;}}));
  register('read-rich-docx',id=>cleanupJob(id,source=>richDocumentJob('read-docx',id,source)));
  register('read-rich-rtf',id=>cleanupJob(id,source=>richDocumentJob('read-rtf',id,source)));
  register('cancel-rich-document-job',id=>cancelRichDocumentJob(id));
  // A new document has no source file, so its chosen name only seeds the Save dialog; the user still confirms the path.
  const newDocumentBase=name=>{const base=typeof name==='string'?name.slice(0,200).replace(/[<>:"/\\|?*\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim().replace(/[. ]+$/,'').slice(0,100):'';return base&&!/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(base)?base:'Untitled';};
  // Save over the opened file (user decision, October 14): DOCX/RTF through the contained writer, text formats as given bytes.
  register('save-rich-document-in-place',async(id,content,layout)=>{const source=store.source(id);if(!['docx','rtf'].includes(source.ext))throw new FileError('FORMAT','Saving over the original is available for DOCX and RTF documents here.');splitSaves++;try{const bytes=await richDocumentJob(source.ext==='docx'?'write-docx':'write-rtf',id,source,{version:1,content,layout});if(store.source(id)!==source)throw new FileError('CHANGED','The original document changed. Reopen it before saving.');return await store.saveInPlace(id,bytes);}finally{splitSaves--;}});
  // A new document's first DOCX/RTF copy becomes the open document, so later saves go back to that file.
  // Continue with saved copy (any tool's newest completed copy): a token from the save result, never a path.
  register('open-saved-copy',async token=>{splitSaves++;try{return await store.openSavedCopy(token);}finally{splitSaves--;}});
  // Show in folder for that copy: same token, location resolved here (file-store savedCopyToReveal), never from the page.
  register('reveal-saved-copy',async token=>{const location=await store.savedCopyToReveal(token);shell.showItemInFolder(location);return {shown:true,name:path.basename(location)};});
  register('open-saved-new-document',async()=>{const saved=savedNewDocument;savedNewDocument=null;if(!saved)throw new FileError('MISSING','Save the new document as DOCX or RTF first.');splitSaves++;try{return await store.open(saved.location,{expectedHash:saved.sha256});}finally{splitSaves--;}});
  // Pictures a Markdown file refers to: its own folder only, PNG or JPEG, up to 5 MB (markdown-image-reader.cjs).
  register('read-markdown-image',async(id,target)=>{const source=store.source(id);if(!['md','markdown'].includes(source.ext))throw new FileError('FORMAT','Pictures are read for Markdown files only.');return readMarkdownImage(source.path,target);});
  register('list-document-backups',id=>store.listBackups(id));
  register('save-document-backup',async(id,name)=>{const source=store.source(id),bytes=await store.readBackup(id,name),base=path.basename(source.name,path.extname(source.name));splitSaves++;try{const chosen=await dialog.showSaveDialog(window,{title:'Save the backup as a copy - the current file stays as it is',defaultPath:path.join(path.dirname(source.path),base+'-backup-'+name.slice(0,10)+'.'+source.ext),filters:[{name:source.ext.toUpperCase(),extensions:[source.ext]}]});if(chosen.canceled)return null;return await store.saveCopy(id,chosen.filePath,bytes,source.ext,createHash('sha256').update(bytes).digest('hex'));}finally{splitSaves--;}});
  register('save-text-in-place',async(id,bytes)=>{const source=store.source(id);if(['docx','rtf','pdf'].includes(source.ext))throw new FileError('FORMAT','Use the document save for this format.');splitSaves++;try{return await store.saveInPlace(id,bytes);}finally{splitSaves--;}});
  register('save-rich-document-copy',async(id,format,content,layout,name)=>{if(!['docx','rtf'].includes(format))throw new FileError('FORMAT','Choose DOCX or RTF for rich document export.');const source=id?store.source(id):null;const unchanged=()=>{if(source&&store.source(id)!==source)throw new FileError('CHANGED','The original document changed. Reopen it before exporting.');};splitSaves++;try{const bytes=await richDocumentJob(format==='docx'?'write-docx':'write-rtf',id,source,{version:1,content,layout});unchanged();const preferred=source?preferredCopyBase(name,format):undefined;const base=source?(preferred??path.basename(source.name,path.extname(source.name))):newDocumentBase(name);const chosen=await dialog.showSaveDialog(window,{title:'Export contained '+format.toUpperCase()+' copy',defaultPath:source?path.join(path.dirname(source.path),base+(preferred?'':'-edited')+'.'+format):base+'.'+format,filters:[{name:format.toUpperCase(),extensions:[format]}]});if(chosen.canceled)return null;unchanged();const saved=await store.saveCopy(id,chosen.filePath,bytes,format,createHash('sha256').update(bytes).digest('hex'));if(!source)savedNewDocument={location:saved.location,sha256:saved.sha256};return saved;}finally{splitSaves--;}});
  register('cancel-table-xlsx',async id=>{const request=tableXlsxRequests.get(id);if(!request)return false;if(request.saving)throw new FileError('BUSY','The verified workbook copy is being written. Let saving finish.');request.canceled=true;if(request.permissionPending&&request.permissionService?.active?.sourceId===id)await request.permissionService.cancel(id);await request.service?.cancel(id);return true;});
  register('save-table-xlsx',(id,value)=>cleanupJob(id,async source=>{
   if(source.ext!=='pdf')throw new FileError('FORMAT','Table export needs an opened PDF.');
   const {validTableXlsxDraft}=require('./table-xlsx-validation.cjs'),draft=validTableXlsxDraft(value,source.fingerprint);
   if(tableXlsxRequests.has(id))throw new FileError('BUSY','Finish or cancel this table export first.');
   const request={canceled:false,source,service:null,permissionPending:false};tableXlsxRequests.set(id,request);const current=()=>{if(request.canceled||tableXlsxRequests.get(id)!==request||store.source(id)!==source)throw new FileError('CANCELED','Table XLSX export stopped. Your reviewed table remains available.');};
   splitSaves++;let result;
   try{
    if(securityRestart)await securityRestart;current();request.permissionService=pdfSecurity;request.permissionPending=true;let permission;try{permission=await request.permissionService.inspect(id,source);}finally{request.permissionPending=false;}current();
    if(permission.encrypted)throw new FileError('TABLE','Create an owner-authorized unprotected PDF copy before exporting a table.');
    if(store.source(id)!==source||permission.sha256!==source.fingerprint)throw new FileError('CHANGED','The table source changed. Review a fresh table.');
    result=await pdfTool('tableXlsx',()=>tableXlsx,service=>{current();request.service=service;return service.build(id,source,draft);});current();
    if(store.source(id)!==source)throw new FileError('CHANGED','The table source changed during export.');
    const chosen=await dialog.showSaveDialog(window,{title:'Save reviewed table as Excel workbook',defaultPath:path.join(path.dirname(source.path),path.basename(source.name,path.extname(source.name))+'-page-'+result.report.page+'-table.xlsx'),filters:[{name:'Excel workbook',extensions:['xlsx']}]});
    if(chosen.canceled||request.canceled)return null;current();
    if(store.source(id)!==source||createHash('sha256').update(source.bytes).digest('hex')!==result.report.sourceSha256)throw new FileError('CHANGED','The table source changed. Review it again.');
    current();request.saving=true;const saved=await store.saveCopy(id,chosen.filePath,result.bytes,'xlsx',result.report.sha256);return {...saved,rows:result.report.rows,columns:result.report.columns,sha256:result.report.sha256,cellType:'inlineStr',mergedRanges:result.report.mergedRanges};
   }finally{result?.bytes.fill(0);if(tableXlsxRequests.get(id)===request)tableXlsxRequests.delete(id);splitSaves--;}
  }));
  register('save-table-csv',(id,value)=>cleanupJob(id,async source=>{if(source.ext!=='pdf')throw new FileError('FORMAT','Table extraction needs an opened PDF.');const {tableExport}=require('./table-export-validation.cjs');let output;try{output=tableExport(value,source);}catch(error){throw new FileError('TABLE',error.message);}splitSaves++;try{if(securityRestart)await securityRestart;const permission=await pdfSecurity.inspect(id,source);if(permission.encrypted)throw new FileError('TABLE','Create an owner-authorized unprotected PDF copy before exporting a table.');if(store.source(id)!==source||permission.sha256!==source.fingerprint)throw new FileError('CHANGED','The table source changed. Review a fresh table.');const chosen=await dialog.showSaveDialog(window,{title:'Save reviewed table CSV',defaultPath:path.join(path.dirname(source.path),path.basename(source.name,path.extname(source.name))+'-page-'+output.page+'-table.csv'),filters:[{name:'CSV table',extensions:['csv']}]});if(chosen.canceled)return null;if(store.source(id)!==source)throw new FileError('CHANGED','The opened table source changed. Review it again.');const saved=await store.saveCopy(id,chosen.filePath,output.bytes,'csv',output.sha256);return {...saved,rows:output.rows,columns:output.columns,sha256:output.sha256,formulaEscaped:output.formulaEscaped,mergedRanges:output.mergedRanges,mergePolicy:output.mergePolicy};}finally{splitSaves--;}}));
  register('form-recovery-info',async()=>{try{return await formRecoveryInfo(formBuilder);}catch(error){throw new FileError('FORM_RECOVERY',error.message);}});
  register('clear-form-recovery',async()=>{if(closeGuard||formBuilder.active)throw new FileError('FORM_RECOVERY','Finish the current editing operation before clearing field-builder recovery.');splitSaves++;try{const info=await formRecoveryInfo(formBuilder),answer=await dialog.showMessageBox(window,{title:'Clear local form-building recipes?',type:'warning',message:'Remove these field-builder recovery files permanently?',detail:`${info.recipes} recipes and ${info.temporaryFiles} temporary files (${info.bytes} bytes).\n\nThese contain field labels, options and page rectangles. Original PDFs, exported copies, other editing drafts/versions, named workflows, saved signatures and AI connections are kept. Export unfinished field work before clearing. This cannot be undone.`,buttons:['Keep recipes','Clear field recipes'],defaultId:0,cancelId:0,noLink:true});if(answer.response!==1)return {cancelled:true};if(closeGuard||formBuilder.active)throw new FileError('FORM_RECOVERY','Field creation started during review. Finish it before clearing recovery.');return await clearFormRecovery(formBuilder);}catch(error){throw error instanceof FileError?error:new FileError('FORM_RECOVERY',error.message);}finally{splitSaves--;}});
  register('inspect-form-builder',id=>formBuilderJob(id,source=>pdfTool('formBuilder',()=>formBuilder,service=>service.inspect(source))));
  register('cancel-form-builder-inspection',id=>formBuilderJob(id,source=>pdfTool('formBuilder',()=>formBuilder,service=>service.cancelInspection(source))));
  register('load-form-builder',id=>formBuilderJob(id,source=>pdfTool('formBuilder',()=>formBuilder,service=>service.loadDraft(source))));
  register('save-form-builder-draft',(id,draft)=>formBuilderJob(id,source=>pdfTool('formBuilder',()=>formBuilder,service=>service.saveDraft(source,draft))));
  register('clear-form-builder',id=>formBuilderJob(id,source=>pdfTool('formBuilder',()=>formBuilder,service=>service.clearDraft(source))));
  register('create-form-builder',(id,token,draft)=>formBuilderJob(id,source=>pdfTool('formBuilder',()=>formBuilder,service=>service.create(id,source,token,draft))));
  register('discard-form-builder',token=>formBuilder.discard(token));
  register('save-form-builder',(id,token)=>formBuilderJob(id,async source=>{const output=formBuilder.output(id,source,token);splitSaves++;try{const result=await dialog.showSaveDialog(window,{title:'Save reviewed fillable PDF copy',defaultPath:path.join(path.dirname(source.path),path.basename(source.name,path.extname(source.name))+'-fillable.pdf'),filters:[{name:'PDF',extensions:['pdf']}]});if(result.canceled)return null;const current=formBuilder.output(id,store.source(id),token);if(current.sha256!==output.sha256)throw new FileError('CHANGED','Form preview changed. Rebuild and review it again.');return await store.saveCopy(id,result.filePath,current.bytes,'pdf',current.sha256);}finally{splitSaves--;}}));
  register('inspect-pdf-attachments',id=>cleanupJob(id,source=>pdfTool('attachments',()=>pdfAttachments,tool=>tool.inspect(id,source))));
  register('select-pdf-attachment',(id,inventoryToken,attachmentId,token)=>cleanupJob(id,source=>pdfTool('attachments',()=>pdfAttachments,tool=>tool.select(id,source,inventoryToken,attachmentId,token))));
  register('cancel-pdf-attachments',(id,token)=>pdfAttachments.cancel(id,token));
  register('discard-pdf-attachment',(id,token)=>pdfAttachments.discard(id,token));
  register('save-pdf-attachment',(id,token)=>cleanupJob(id,async source=>{const output=pdfAttachments.output(id,source,token);splitSaves++;try{const result=await dialog.showSaveDialog(window,{title:'Save unverified attachment bytes as an inert copy',defaultPath:path.join(path.dirname(source.path),output.report.attachment.defaultName),filters:[{name:'Unverified attachment bytes',extensions:['bin']}]});if(result.canceled)return null;const current=pdfAttachments.output(id,store.source(id),token);if(current.report.attachment.sha256!==output.report.attachment.sha256)throw new FileError('CHANGED','Attachment selection changed. Review it again.');return await saveAttachment(store,result.filePath,current.bytes,current.report.attachment.sha256);}finally{splitSaves--;}}));
  register('inspect-pdf-sanitize',id=>cleanupJob(id,async source=>{if(sanitizeRestart)await sanitizeRestart;return pdfSanitize.inspect(id,source);}));
  register('build-pdf-sanitize',(id,token,selection)=>cleanupJob(id,async source=>{if(sanitizeRestart)await sanitizeRestart;return pdfSanitize.build(id,source,token,selection);}));
  register('cancel-pdf-sanitize',(id,token)=>pdfSanitize.cancel(id,token));
  register('discard-pdf-sanitize',(id,token)=>pdfSanitize.discard(id,token));
  register('save-pdf-sanitize',(id,token)=>cleanupJob(id,async source=>{const output=pdfSanitize.output(id,source,token);splitSaves++;try{const result=await dialog.showSaveDialog(window,{title:'Save reviewed cleaned PDF copy',defaultPath:path.join(path.dirname(source.path),path.basename(source.name,path.extname(source.name))+'-cleaned.pdf'),filters:[{name:'PDF',extensions:['pdf']}]});if(result.canceled)return null;const current=pdfSanitize.output(id,store.source(id),token);if(current.report.sha256!==output.report.sha256)throw new FileError('CHANGED','Cleanup preview changed. Prepare and review it again.');return await store.saveCopy(id,result.filePath,current.bytes,undefined,current.report.sha256);}finally{splitSaves--;}}));
  register('inspect-pdf-review',(id,pages)=>cleanupJob(id,async source=>{if(reviewRestart)await reviewRestart;const report=await pdfReview.inspect(id,source,pages);if(report.sourceSha256!==source.fingerprint)throw new FileError('CHANGED','The source PDF changed. Reopen it before inspecting comments.');return report;}));
  register('cancel-pdf-review',id=>pdfReview.cancel(id));
  register('build-pdf-review-edits',(id,token,draft)=>cleanupJob(id,async source=>{if(reviewEditRestart)await reviewEditRestart;return await pdfReviewEdits.build(id,source,token,draft);}));
  register('pick-pdf-xfdf',async()=>{if(xfdfImportRestart)await xfdfImportRestart;const service=pdfXfdfImport;if(service.disposed||service.active)throw new FileError('XFDF_IMPORT','Finish or cancel the current import before choosing another XFDF.');clearChosenXfdf();const generation=xfdfPickGeneration;splitSaves++;try{const chosen=await dialog.showOpenDialog(window,{title:'Choose drawing comments to import',properties:['openFile'],filters:[{name:'XFDF comments',extensions:['xfdf']}]});if(chosen.canceled)return null;if(service!==pdfXfdfImport||service.disposed||generation!==xfdfPickGeneration)throw new FileError('CANCELED','The XFDF picker ended with its application session.');const picked=await readChosenXfdf(chosen.filePaths[0]);if(service!==pdfXfdfImport||service.disposed||generation!==xfdfPickGeneration){picked.bytes.fill(0);throw new FileError('CANCELED','The XFDF selection ended with its application session.');}chosenXfdf={...picked,base64:picked.bytes.toString('base64'),sourceId:null};return {name:picked.name,bytes:Uint8Array.from(picked.bytes),sha256:picked.sha256};}finally{splitSaves--;}});
  register('inspect-pdf-xfdf-import',(id,value)=>cleanupJob(id,async source=>{if(xfdfImportRestart)await xfdfImportRestart;const picked=boundChosenXfdf(id,value),service=pdfXfdfImport,report=await service.inspect(id,source,value);if(chosenXfdf!==picked||service!==pdfXfdfImport||report.xfdfSha256!==picked.sha256)throw new FileError('CHANGED','The chosen comment file changed. Choose and inspect it again.');return report;}));
  register('build-pdf-xfdf-import',(id,token,draft)=>cleanupJob(id,async source=>{if(xfdfImportRestart)await xfdfImportRestart;const picked=boundChosenXfdf(id,draft),service=pdfXfdfImport,result=await service.build(id,source,token,draft);if(chosenXfdf!==picked||service!==pdfXfdfImport||result.report.xfdfSha256!==picked.sha256){await service.discard(id,token);throw new FileError('CHANGED','The chosen comment file changed. Prepare and review a fresh import.');}return result;}));
  register('cancel-pdf-xfdf-import',async(id,token)=>{if(!token&&(!chosenXfdf?.sourceId||chosenXfdf.sourceId===id))clearChosenXfdf();if(xfdfImportRestart)await xfdfImportRestart;return await pdfXfdfImport.discard(id,token);});
  register('discard-pdf-xfdf-import',async(id,token)=>{if(!token&&(!chosenXfdf?.sourceId||chosenXfdf.sourceId===id))clearChosenXfdf();if(xfdfImportRestart)await xfdfImportRestart;return await pdfXfdfImport.discard(id,token);});
  register('build-pdf-xfdf',(id,token,draft)=>cleanupJob(id,async source=>{if(xfdfRestart)await xfdfRestart;return await pdfXfdf.build(id,source,token,draft);}));
  register('cancel-pdf-xfdf',(id,token)=>pdfXfdf.cancel(id,token));
  register('discard-pdf-xfdf',(id,token)=>pdfXfdf.discard(id,token));
  register('build-pdf-takeoffs',(id,token,draft)=>cleanupJob(id,async source=>{if(takeoffRestart)await takeoffRestart;return await pdfTakeoffs.build(id,source,token,draft);}));
  register('inspect-pdf-takeoffs',id=>cleanupJob(id,async source=>{if(takeoffRecoveryRestart)await takeoffRecoveryRestart;const report=await pdfTakeoffRecovery.inspect(id,source);if(report.sourceSha256!==source.fingerprint)throw new FileError('CHANGED','The PDF source changed before takeoff recovery.');return report;}));
  register('cancel-pdf-takeoff-recovery',id=>pdfTakeoffRecovery.cancel(id));
  register('cancel-pdf-takeoffs',(id,token)=>pdfTakeoffs.cancel(id,token));
  register('discard-pdf-takeoffs',(id,token)=>pdfTakeoffs.discard(id,token));
  register('cancel-pdf-review-edits',(id,token)=>pdfReviewEdits.cancel(id,token));
  register('discard-pdf-review-edits',(id,token)=>pdfReviewEdits.discard(id,token));
  const revisionJob=(id,replacementId,action)=>cleanupJob(id,source=>pdfTool('pageRevision',()=>pdfPageRevision,async service=>{const replacement=store.source(replacementId);const result=await action(service,source,replacement);if(store.source(replacementId)!==replacement)throw new FileError('CHANGED','The replacement PDF session changed. Review the drawing revision again.');return result;}));
  register('build-signature-request',(id,token,draft)=>cleanupJob(id,source=>pdfTool('signatureRequest',()=>signatureRequests,tool=>tool.build(id,source,token,draft))));
  register('cancel-signature-request',(id,token)=>signatureRequests.cancel(id,token));
  register('discard-signature-request',(id,token)=>signatureRequests.discard(id,token));
  register('inspect-pdf-page-boxes',id=>cleanupJob(id,source=>pdfTool('pageBoxes',()=>pdfPageBoxes,tool=>tool.inspect(id,source))));
  register('build-pdf-page-boxes',(id,token,draft)=>cleanupJob(id,source=>pdfTool('pageBoxes',()=>pdfPageBoxes,tool=>tool.build(id,source,token,draft))));
  register('cancel-pdf-page-boxes',(id,token)=>pdfPageBoxes.cancel(id,token));
  register('discard-pdf-page-boxes',(id,token)=>pdfPageBoxes.discard(id,token));
  register('build-pdf-print-marks',(id,token,draft)=>cleanupJob(id,source=>pdfTool('printMarks',()=>pdfPrintMarks,tool=>tool.build(id,source,token,draft))));
  register('cancel-pdf-print-marks',(id,token)=>pdfPrintMarks.cancel(id,token));
  register('discard-pdf-print-marks',(id,token)=>pdfPrintMarks.discard(id,token));
  register('inspect-pdf-thin-lines',(id,thresholdPt)=>cleanupJob(id,source=>pdfTool('thinLines',()=>pdfThinLines,tool=>tool.inspect(id,source,thresholdPt))));
  register('prepare-pdf-thin-lines',(id,token,draft)=>cleanupJob(id,source=>pdfTool('thinLines',()=>pdfThinLines,tool=>tool.build(id,source,token,draft))));
  register('cancel-pdf-thin-lines',(id,token)=>pdfThinLines.cancel(id,token));
  register('discard-pdf-thin-lines',(id,token)=>pdfThinLines.discard(id,token));
  register('save-named-pdf-copy',async(id,token,name)=>{const source=store.source(id);if(source.ext!=='pdf'||typeof token!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(token)||typeof name!=='string'||name!==safePdfFilename(name)||name.length>160)throw new FileError('NAME','Review a valid PDF filename before saving.');if(namedPdfCopies.has(id))throw new FileError('BUSY','Finish or cancel this source copy first.');const operation={token,controller:new AbortController(),completed:0,total:source.size??source.bytes.length,stage:'choose'};namedPdfCopies.set(id,operation);splitSaves++;try{const chosen=await dialog.showSaveDialog(window,{title:'Save unchanged PDF as a new file',defaultPath:path.join(path.dirname(source.path),name),filters:[{name:'PDF',extensions:['pdf']}]});if(chosen.canceled)return null;if(operation.controller.signal.aborted||!rendererAvailable||store.source(id)!==source)throw new FileError('CANCELED','Copying canceled before generation.');operation.stage='copy';const saved=await store.saveCopy(id,chosen.filePath,undefined,'pdf',source.fingerprint,{signal:operation.controller.signal,progress:(completed,total)=>{operation.completed=completed;operation.total=total;if(completed===total)operation.stage='verify';}});return saved;}finally{if(namedPdfCopies.get(id)===operation)namedPdfCopies.delete(id);splitSaves--;}});
  register('named-pdf-copy-progress',(id,token)=>{const value=namedPdfCopies.get(id);return value?.token===token?{completed:value.completed,total:value.total,stage:value.stage}:null;});
  register('cancel-named-pdf-copy',(id,token)=>{const value=namedPdfCopies.get(id);if(!value||value.token!==token)return false;value.controller.abort();return true;});
  register('inspect-pdf-page-revision',(id,replacementId)=>revisionJob(id,replacementId,(service,source,replacement)=>service.inspect(id,source,replacementId,replacement)));
  register('build-pdf-page-revision',(id,replacementId,token,draft)=>revisionJob(id,replacementId,(service,source,replacement)=>service.build(id,source,replacementId,replacement,token,draft)));
  register('cancel-pdf-page-revision',id=>pdfPageRevision.cancel(id));
  register('discard-pdf-page-revision',(id,token)=>pdfPageRevision.discard(id,token));
  register('inspect-pdf-page-order',id=>cleanupJob(id,async source=>{if(pageOrderRestart)await pageOrderRestart;return await pdfPageOrder.inspect(id,source);}));
  register('build-pdf-page-order',(id,token,draft)=>cleanupJob(id,async source=>{if(pageOrderRestart)await pageOrderRestart;return await pdfPageOrder.build(id,source,token,draft);}));
  register('cancel-pdf-page-order',async(id,token)=>{if(pageOrderRestart)await pageOrderRestart;return await pdfPageOrder.discard(id,token);});
  register('discard-pdf-page-order',async(id,token)=>{if(pageOrderRestart)await pageOrderRestart;return await pdfPageOrder.discard(id,token);});
  register('inspect-pdf-bookmarks',id=>cleanupJob(id,source=>pdfTool('bookmarks',()=>pdfBookmarks,tool=>tool.inspect(id,source))));
  register('build-pdf-bookmarks',(id,token,value)=>cleanupJob(id,source=>pdfTool('bookmarks',()=>pdfBookmarks,tool=>tool.build(id,source,token,value))));
  register('cancel-pdf-bookmarks',(id,token)=>pdfBookmarks.cancel(id,token));
  register('discard-pdf-bookmarks',(id,token)=>pdfBookmarks.discard(id,token));
  register('build-pdf-decorations',(id,token,draft)=>cleanupJob(id,source=>pdfTool('decorations',()=>pdfDecorations,tool=>tool.build(id,source,token,draft))));
  register('cancel-pdf-decorations',(id,token)=>pdfDecorations.cancel(id,token));
  register('discard-pdf-decorations',(id,token)=>pdfDecorations.discard(id,token));
  const saveReviewedPdf=(serviceValue,title,suffix,ext='pdf')=>(id,token)=>cleanupJob(id,async source=>{
    const service=typeof serviceValue==='function'?serviceValue():serviceValue,output=service.output(id,source,token);splitSaves++;
    try{
      const chosen=await dialog.showSaveDialog(window,{title,defaultPath:path.join(path.dirname(source.path),path.basename(source.name,path.extname(source.name))+suffix+'.'+ext),filters:[{name:ext.toUpperCase(),extensions:[ext]}]});
      if(chosen.canceled)return null;
      const current=service.output(id,store.source(id),token);
      try{if(current.report.sha256!==output.report.sha256)throw new FileError('CHANGED','The prepared export changed. Build and review it again.');return await store.saveCopy(id,chosen.filePath,current.bytes,ext,current.report.sha256,current.report.encryptionPreserved?{provider:'restricted-edit',sha256:current.report.sha256,sourceSha256:source.fingerprint}:undefined);}
      finally{current.bytes.fill(0);}
    }finally{output.bytes.fill(0);splitSaves--;}
  });
  register('save-signature-request',(id,token)=>pdfTool('signatureRequest',()=>signatureRequests,async service=>{const saved=await saveReviewedPdf(()=>service,'Save reviewed signing-location PDF','-signature-request')(id,token);if(saved)service.markSaved(id,store.source(id),token,saved);return saved;}));
  register('save-signature-request-email',(id,token)=>pdfTool('signatureRequest',()=>signatureRequests,service=>saveReviewedPdf({output:(id,source,token)=>service.emailOutput(id,source,token)},'Save editable email draft; attach the prepared PDF before sending','-signature-request-email','eml')(id,token)));
  register('save-pdf-page-boxes',(id,token)=>pdfTool('pageBoxes',()=>pdfPageBoxes,()=>saveReviewedPdf(()=>pdfPageBoxes,'Save reviewed page-box PDF copy','-page-boxes')(id,token)));
  register('save-pdf-print-marks',(id,token)=>pdfTool('printMarks',()=>pdfPrintMarks,()=>saveReviewedPdf(()=>pdfPrintMarks,'Save reviewed print-marks PDF copy','-print-marks')(id,token)));
  register('save-pdf-thin-lines',(id,token)=>pdfTool('thinLines',()=>pdfThinLines,()=>saveReviewedPdf(()=>pdfThinLines,'Save reviewed thin-line PDF copy','-line-widths')(id,token)));
  register('save-pdf-repair-copy',(id,token)=>pdfTool('repair',()=>pdfRepair,()=>saveReviewedPdf(()=>pdfRepair,'Save reviewed repaired PDF copy','-repaired')(id,token)));
  register('save-pdf-combine',combineAction((sessionId,ids,token)=>combineJob(sessionId,ids,async(service,sources)=>{const output=service.output(sessionId,sources,token);splitSaves++;try{const chosen=await dialog.showSaveDialog(window,{title:'Save reviewed combined PDF copy',defaultPath:'combined.pdf',filters:[{name:'PDF',extensions:['pdf']}]});if(chosen.canceled)return null;if(!combineInputs.current(sessionId,sources))throw new Error('The selected PDF session changed before saving.');const destination=path.resolve(chosen.filePath);if(sources.some(source=>source.path.toLowerCase()===destination.toLowerCase()))throw new Error('Choose a new filename; original PDF paths are preserved.');const current=service.output(sessionId,sources,token);try{if(current.report.sha256!==output.report.sha256)throw new Error('The reviewed combination changed. Build it again.');return await store.saveCopy(null,destination,current.bytes,'pdf',current.report.sha256);}finally{current.bytes.fill(0);}}finally{output.bytes.fill(0);splitSaves--;}})));
  register('save-pdf-combine-workflow',combineAction((sessionId,ids,token)=>combineJob(sessionId,ids,async(service,sources)=>{const output=service.output(sessionId,sources,token);splitSaves++;try{const chosen=await dialog.showSaveDialog(window,{title:'Save reviewed combined workflow PDF copy',defaultPath:'combined-workflow.pdf',filters:[{name:'PDF',extensions:['pdf']}]});if(chosen.canceled)return null;if(!combineInputs.current(sessionId,sources))throw new Error('The selected PDF session changed before saving.');const destination=path.resolve(chosen.filePath);if(sources.some(source=>source.path.toLowerCase()===destination.toLowerCase()))throw new Error('Choose a new filename; original PDF paths are preserved.');const current=service.output(sessionId,sources,token);try{if(current.report.sha256!==output.report.sha256)throw new Error('The reviewed combination changed. Build it again.');return await store.saveCopy(null,destination,current.bytes,'pdf',current.report.sha256);}finally{current.bytes.fill(0);}}finally{output.bytes.fill(0);splitSaves--;}},'combineWorkflow',()=>pdfCombineWorkflow)));
  register('build-pdf-combine-workflow',combineAction((sessionId,ids,token,draft)=>combineJob(sessionId,ids,(service,sources)=>service.build(sessionId,sources,token,draft),'combineWorkflow',()=>pdfCombineWorkflow)));
  register('cancel-pdf-combine-workflow',combineAction((sessionId,token)=>pdfTool('combineWorkflow',()=>pdfCombineWorkflow,service=>service.cancel(sessionId,token))));
  register('discard-pdf-combine-workflow',combineAction((sessionId,token)=>pdfTool('combineWorkflow',()=>pdfCombineWorkflow,service=>service.discard(sessionId,token))));
  const fdfOutput=kind=>({output:(id,source,token)=>kind==='import'?pdfFdf.outputImport(id,source,token):pdfFdf.outputExport(id,source,token)});
  register('save-pdf-fdf-import',(id,token)=>pdfTool('fdf',()=>pdfFdf,()=>saveReviewedPdf(()=>fdfOutput('import'),'Save reviewed FDF-comment PDF copy','-imported-fdf-comments')(id,token)));
  register('save-pdf-fdf',(id,token)=>pdfTool('fdf',()=>pdfFdf,()=>saveReviewedPdf(()=>fdfOutput('export'),'Save reviewed FDF comment exchange','-comments','fdf')(id,token)));
  register('save-document-workflow',(id,token)=>pdfTool('documentWorkflow',()=>documentWorkflow,()=>saveReviewedPdf(()=>documentWorkflow,'Save reviewed workflow PDF copy','-workflow')(id,token)));
  register('save-pdf-form-fill',(id,token)=>saveReviewedPdf({output:(id,source,token)=>restrictedEdits.isRestricted(id,source)?restrictedEdits.output(id,source,token,'form'):formFill.output(id,source,token)},'Save reviewed filled PDF copy','-filled')(id,token));
  register('save-restricted-pdf-edit',(id,token,kind)=>{if(!['markup','content'].includes(kind))throw Error('Choose Comment or Type.');return saveReviewedPdf({output:(id,source,token)=>restrictedEdits.output(id,source,token,kind)},'Save protected PDF copy',kind==='markup'?'-commented':'-edited')(id,token);});
  register('save-pdf-certificate-signing',(id,token)=>pdfTool('certificateSigning',()=>pdfCertificateSigning,()=>saveReviewedPdf(()=>pdfCertificateSigning,'Save reviewed certificate-signed PDF copy','-certificate-signed')(id,token)));
  register('save-pdf-tags',(id,token)=>pdfTool('tags',()=>pdfTags,()=>saveReviewedPdf(()=>pdfTags,'Save reviewed accessibility tag-tree copy','-tagged')(id,token)));
  register('save-pdf-portfolio',(id,token)=>pdfTool('portfolio',()=>pdfPortfolio,()=>saveReviewedPdf(()=>pdfPortfolio,'Save reviewed PDF portfolio copy','-portfolio')(id,token)));
  register('save-pdf-portfolio-entry',(id,token)=>cleanupJob(id,source=>pdfTool('portfolio',()=>pdfPortfolio,async tool=>{
    let output=tool.outputSelection(id,source,token);splitSaves++;
    try{
      const chosen=await dialog.showSaveDialog(window,{title:'Save reviewed inert portfolio entry',defaultPath:path.join(path.dirname(source.path),'portfolio-entry.bin'),filters:[{name:'Inert binary copy',extensions:['bin']}]});
      if(chosen.canceled)return null;
      const current=tool.outputSelection(id,store.source(id),token);
      try{if(current.report.entry.sha256!==output.report.entry.sha256)throw new FileError('CHANGED','Review a fresh selected portfolio entry before saving.');return await saveAttachment(store,chosen.filePath,current.bytes,current.report.entry.sha256);}finally{current.bytes.fill(0);}
    }finally{output.bytes.fill(0);splitSaves--;}
  })));
  register('save-pdf-xfdf-report',(id,token)=>cleanupJob(id,async source=>{if(xfdfRestart)await xfdfRestart;const output=pdfXfdf.output(id,source,token),{canonicalJSON,hash}=require('./pdf-xfdf-validation.cjs'),bytes=Buffer.from(canonicalJSON(output.report)+'\n'),fingerprint=hash(bytes);splitSaves++;try{const result=await dialog.showSaveDialog(window,{title:'Save reviewed XFDF export receipt',defaultPath:path.join(path.dirname(source.path),path.basename(source.name,path.extname(source.name))+'-comments-receipt.json'),filters:[{name:'JSON export receipt',extensions:['json']}]});if(result.canceled)return null;const current=pdfXfdf.output(id,store.source(id),token),currentBytes=Buffer.from(canonicalJSON(current.report)+'\n');if(hash(currentBytes)!==fingerprint)throw new FileError('CHANGED','The XFDF export receipt changed. Build and review it again.');return await store.saveCopy(id,result.filePath,currentBytes,'json',fingerprint);}finally{splitSaves--;}}));
  register('save-pdf-page-revision',(id,replacementId,token)=>revisionJob(id,replacementId,async(service,source,replacement)=>{const adapter={output:(sourceId,currentSource,currentToken)=>{if(store.source(replacementId)!==replacement)throw new FileError('CHANGED','The replacement session changed before saving.');return service.output(sourceId,currentSource,replacementId,replacement,currentToken);}};return saveReviewedPdf(adapter,'Save reviewed drawing revision copy','-revised')(id,token);}));
  register('save-pdf-page-order',async(id,token)=>{if(pageOrderRestart)await pageOrderRestart;return await saveReviewedPdf(()=>pdfPageOrder,'Save reviewed preserving page-order copy','-reordered')(id,token);});
  register('save-pdf-xfdf-import',async(id,token)=>{if(xfdfImportRestart)await xfdfImportRestart;return await saveReviewedPdf(()=>pdfXfdfImport,'Save reviewed imported-comment PDF copy','-imported-comments')(id,token);});
  register('save-pdf-xfdf',async(id,token)=>{if(xfdfRestart)await xfdfRestart;return await saveReviewedPdf(()=>pdfXfdf,'Save reviewed XFDF comment exchange','-comments','xfdf')(id,token);});
  register('save-pdf-takeoffs',async(id,token)=>{if(takeoffRestart)await takeoffRestart;return await saveReviewedPdf(()=>pdfTakeoffs,'Save reviewed takeoff PDF copy','-takeoffs')(id,token);});
  register('save-pdf-bookmarks',(id,token)=>pdfTool('bookmarks',()=>pdfBookmarks,()=>saveReviewedPdf(()=>pdfBookmarks,'Save reviewed PDF outline copy','-bookmarks')(id,token)));
  register('save-pdf-decorations',(id,token)=>pdfTool('decorations',()=>pdfDecorations,()=>saveReviewedPdf(()=>pdfDecorations,'Save reviewed decorated PDF copy','-decorated')(id,token)));
  register('save-pdf-review-edits',async(id,token)=>{if(reviewEditRestart)await reviewEditRestart;return await saveReviewedPdf(()=>pdfReviewEdits,'Save reviewed comment and reply PDF copy','-reviewed')(id,token);});
  register('security-status',async()=>({renderer:{sandbox:window.webContents.getLastWebPreferences().sandbox===true,contextIsolation:true,nodeIntegration:false,networkBlocked:true,downloadsBlocked:true},compression:await compression.sandbox.status(),passwords:await passwords.sandbox.status(),xfdf:await pdfXfdf.status(),xfdfImport:await pdfXfdfImport.status(),review:await pdfReview.status(),reviewEdits:await pdfReviewEdits.status(),takeoffs:await pdfTakeoffs.status(),takeoffRecovery:await pdfTakeoffRecovery.status(),office:await officeStatus(),richDocuments:await richDocumentStatus(),tableXlsx:await tableXlsx.status(),batchActions:await batchDocumentActions.status(),formBuilder:await formBuilder.status(),formFill:await formFill.status(),restrictedEditing:await restrictedEdits.status(),documentWorkflow:await documentWorkflow.status(),workflowSource:await workflowSource.status(),combine:await pdfCombine.status(),combineWorkflow:await pdfCombineWorkflow.status(),batchBates:await batchBates.status(),tiff:await tiff.status(),fdf:await pdfFdf.status(),repair:await pdfRepair.status(),documentPdf:await documentPdf.status(),documentGrids:await documentTableGridStatus(),securityReport:await pdfSecurity.status(),certificates:await pdfCertificates.status(),certificateSigning:await pdfCertificateSigning.status(),geospatial:await pdfGeospatial.status(),preflight:await pdfPreflight.status(),accessibilityAudit:await pdfAccessibilityAudit.status(),tags:await pdfTags.status(),portfolio:await pdfPortfolio.status(),scanner:scannerAdapter?.status(),sanitize:await pdfSanitize.status(),redaction:await redaction.status(),pageOrder:await pdfPageOrder.status(),attachments:await pdfAttachments.status(),links:await pdfLinks.status(),bookmarks:await pdfBookmarks.status(),decorations:await pdfDecorations.status(),limits:'Compression/password jobs, XFDF and supported FDF export/import, Office import/copy, DOCX table-grid inspection, structural security reporting/cleanup, clean-image redaction verification, preserving page reordering, comment review/editing, takeoff writing/recovery, attachment inspection/decoding, web-link destination inspection, bookmarks, decorations/Bates and literal table XLSX export and the supported batch PDF text route and fillable-field creation/filling/visual placements, supported diagnostics/repair and document-generated PDF output inspection use fixed Windows-contained routes. Editable page-order/Bates workflows chain these contained operations. Other native parsers and writers still have application privileges; full Security Sandbox coverage and runtime acceptance remain unfinished.'}));
  register('window-state',windowState);
  register('fullscreen',value=>{if(typeof value!=='boolean')throw new FileError('STATE','Invalid fullscreen setting.');if(hiddenTest){hiddenFullscreen=value;window.webContents.send('pdfix:window-state',{fullscreen:value});}else window.setFullScreen(value);return {fullscreen:value};});
  // Every live renderer gets a departure check. Independent workspaces may
  // update editor-guard in any order, so that flag cannot prove all drafts safe.
  window.webContents.on('did-finish-load',()=>{closeAuthorized=false;});
  // A crashed renderer cannot answer the close handshake. If it dies while being asked, the close it was asked about goes ahead (see render-process-gone).
  window.on('close',event=>{if(splitSaves){event.preventDefault();return;}if(rendererAvailable&&!closeAuthorized&&!window.webContents.isCrashed()){event.preventDefault();closeRequestedAt=Date.now();window.webContents.send('pdfix:prepare-close');}});
  window.webContents.on('render-process-gone',()=>{windowsContextRequests.clear();restartPdfTool('signatureRequest',signatureRequests,options=>{signatureRequests=new SignatureRequestService(options);});cloudFileSelections.clear();store.clearSessions().catch(()=>{/* Failed snapshot cleanup remains tracked for shutdown. */});restartRichDocumentService().catch(()=>{/* Unsafe rich-document cleanup keeps the service closed. */});for(const request of tableXlsxRequests.values())request.canceled=true;restartPdfTool('tableXlsx',tableXlsx,options=>{tableXlsx=new TableXlsxService(options);});restartPdfTool('batchActions',batchDocumentActions,options=>{batchDocumentActions=new BatchDocumentActions(options);});for(const operation of namedPdfCopies.values())operation.controller.abort();restartPdfTool('pageBoxes',pdfPageBoxes,options=>{pdfPageBoxes=new PdfPageBoxService(options);});restartPdfTool('printMarks',pdfPrintMarks,options=>{pdfPrintMarks=new PdfPrintMarksService(options);});restartPdfTool('thinLines',pdfThinLines,options=>{pdfThinLines=new PdfThinLineService(options);});const oldPageOrder=pdfPageOrder;pageOrderRestart=oldPageOrder.dispose().then(()=>{if(pdfPageOrder===oldPageOrder)pdfPageOrder=new PdfPageOrderService();},()=>{/* Keep failed reorder containment closed. */}).finally(()=>{pageOrderRestart=null;});const oldRedaction=redaction;redactionRestart=oldRedaction.dispose().then(()=>{if(redaction===oldRedaction)redaction=new RedactionService();},()=>{/* Keep failed redaction containment closed. */}).finally(()=>{redactionRestart=null;});clearChosenXfdf();const oldXfdfImport=pdfXfdfImport;xfdfImportRestart=oldXfdfImport.dispose().then(()=>{if(pdfXfdfImport===oldXfdfImport)pdfXfdfImport=new PdfXfdfImportService();},()=>{/* Keep failed import containment closed. */}).finally(()=>{xfdfImportRestart=null;});searchSources.clear();fileFingerprints.clear();for(const operation of pendingMailMergeSaves.values())operation.canceled=true;restartEmailMessageService().catch(()=>{});restartPdfTool('formMailMerge',formMailMerge,options=>{formMailMerge=new FormMailMergeService(options);});restartOfficeService().catch(()=>{});restartDocumentTableGrids().catch(()=>{});rendererAvailable=false;closeAuthorized=false;if(Date.now()-closeRequestedAt<10000){closeRequestedAt=0;setImmediate(()=>{if(window&&!window.isDestroyed())window.close();});}cancelLinkReview().catch(()=>{});restartPdfTool('links',pdfLinks,options=>{pdfLinks=new PdfLinkService(options);});const oldSecurity=pdfSecurity;securityRestart=oldSecurity.dispose().then(()=>{if(pdfSecurity===oldSecurity)pdfSecurity=new PdfSecurityService();},()=>{/* Keep a failed contained service closed. */}).finally(()=>{securityRestart=null;});const oldSanitize=pdfSanitize;sanitizeRestart=oldSanitize.dispose().then(()=>{if(pdfSanitize===oldSanitize)pdfSanitize=new PdfSanitizeService();},()=>{/* Keep a failed contained service closed. */}).finally(()=>{sanitizeRestart=null;});const oldBatch=batchCompression;if(oldBatch)batchRestart=oldBatch.dispose().then(()=>{if(batchCompression===oldBatch)batchCompression=new BatchCompression(compression);},()=>{/* Keep failed batch cleanup closed. */}).finally(()=>{batchRestart=null;});restartPdfTool('certificates',pdfCertificates,options=>{pdfCertificates=new PdfCertificateService(options);});restartPdfTool('attachments',pdfAttachments,options=>{pdfAttachments=new PdfAttachmentService(options);});restartPdfTool('bookmarks',pdfBookmarks,options=>{pdfBookmarks=new PdfBookmarkService(options);});restartPdfTool('decorations',pdfDecorations,options=>{pdfDecorations=new PdfDecorationService(options);});const oldReview=pdfReview;reviewRestart=oldReview.dispose().then(()=>{if(pdfReview===oldReview)pdfReview=new PdfReviewService();},()=>{/* Keep the failed containment service closed. */}).finally(()=>{reviewRestart=null;});const oldReviewEdits=pdfReviewEdits;reviewEditRestart=oldReviewEdits.dispose().then(()=>{if(pdfReviewEdits===oldReviewEdits)pdfReviewEdits=new PdfReviewEditService();},()=>{/* Keep the failed containment service closed. */}).finally(()=>{reviewEditRestart=null;});const oldTakeoffRecovery=pdfTakeoffRecovery;takeoffRecoveryRestart=oldTakeoffRecovery.dispose().then(()=>{if(pdfTakeoffRecovery===oldTakeoffRecovery)pdfTakeoffRecovery=new PdfTakeoffRecoveryService();},()=>{/* Keep a failed service closed. */}).finally(()=>{takeoffRecoveryRestart=null;});const oldXfdf=pdfXfdf;xfdfRestart=oldXfdf.dispose().then(()=>{if(pdfXfdf===oldXfdf)pdfXfdf=new PdfXfdfService();},()=>{/* Keep a failed service closed. */}).finally(()=>{xfdfRestart=null;});const oldTakeoffs=pdfTakeoffs;takeoffRestart=oldTakeoffs.dispose().then(()=>{if(pdfTakeoffs===oldTakeoffs)pdfTakeoffs=new PdfTakeoffService();},()=>{/* Keep the disposed service when termination cannot be observed. */}).finally(()=>{takeoffRestart=null;});if(formBuilder)restartPdfTool('formBuilder',formBuilder,options=>{formBuilder=new FormBuilderService(app.getPath('userData'),options);});aiService?.dispose();closeGuard=false;restartPdfTool('documentPdf',documentPdf,options=>{documentPdf=new DocumentPdfService(BrowserWindow,options);});if(compression.active)compression.cancel(compression.active.token);if(passwords.active)passwords.cancel(passwords.active.token);passwords.verified=null;});
  register('editor-guard',guard=>{if(typeof guard!=='boolean')throw new FileError('STATE','Invalid editing state.');closeGuard=guard;});
  register('close-handler-ready',()=>{rendererAvailable=true;closeAuthorized=false;});
  register('finish-close',()=>{if(splitSaves)throw new FileError('STATE','Finish the current native file operation before closing.');closeGuard=false;closeAuthorized=true;window.close();});
  register('workspace', () => ({ recents: store.list(), warning: store.recoveryWarning }));
  register('pick', async (kind='file') => {
    if(!['file','pdf','image','document','spreadsheet','presentation'].includes(kind))throw new FileError('PICK','Choose a supported file-opening workspace.');
    const all={name:'All files',extensions:['*']},filters=kind==='spreadsheet'?[{name:'Excel workbooks',extensions:['xlsx']},all]:kind==='presentation'?[{name:'PowerPoint presentations',extensions:['pptx']},all]:kind==='document'?[{name:'Documents and text source',extensions:['docx','rtf','txt','md','markdown','json','xml','yaml','yml','csv']},all]:kind==='pdf'?[{name:'PDF documents',extensions:['pdf']},all]:kind==='image'?[{name:'Supported images',extensions:['png','jpg','jpeg','webp','bmp']},all]:[{name:'Supported files',extensions:['tif','tiff','pdf','pptx','xlsx','docx','rtf','txt','md','markdown','json','xml','yaml','yml','csv','png','jpg','jpeg','webp','bmp']},all];
    const result = await dialog.showOpenDialog(window, { title:kind==='spreadsheet'?'Choose a workbook to edit':kind==='presentation'?'Choose a presentation to edit':kind==='document'?'Choose a document to edit':kind==='pdf'?'Choose a PDF for this workspace':kind==='image'?'Choose an image for this workspace':'Open a file in PDFix', properties:kind==='image'?['openFile','multiSelections']:['openFile'],filters });
    if(result.canceled)return null;
    // Image to PDF: several pictures chosen at once — open the first, keep the rest for the picture workspace to add.
    const opened=await store.open(result.filePaths[0]);if(kind==='image'&&result.filePaths.length>1){const rest=result.filePaths.slice(1,10);pendingPictures.set(opened.id,rest);return {...opened,morePictures:rest.length};}
    return opened;
  });
  register('drop', filePath => store.open(filePath));
  register('pick-additional', async purpose => {
    if(purpose!==undefined&&purpose!=='compare')throw new FileError('FORMAT','Unknown PDF picker action.');
    const result=await dialog.showOpenDialog(window,{title:purpose==='compare'?'Choose a PDF to compare':'Add a PDF to the page workspace',properties:['openFile'],filters:[{name:'PDF',extensions:['pdf']}]});
    if(result.canceled)return null;
    if(path.extname(result.filePaths[0]).toLowerCase()!=='.pdf')throw new FileError('FORMAT',purpose==='compare'?'Choose a PDF to compare.':'Choose a PDF to add pages.');
    return store.open(result.filePaths[0],{retain:true,maxBytes:MAX_BYTES});
  });
  register('reopen', id => store.reopen(id));
  register('set-open-files-mode', mode => store.setOpenFilesMode(mode));
  const pendingPictures=new Map();
  const readingCapacityReport=(pdfBytes=0)=>{let features;try{features=app.getGPUFeatureStatus();}catch{}return getReadingCapacity({pdfBytes,graphics:{status:features?.gpu_compositing||'unavailable',acceleration:features?.canvas||'unavailable',webgl:features?.webgl||'unavailable'}});};
  register('reading-capacity',()=>readingCapacityReport());
  store.readingProfile=size=>{const report=readingCapacityReport(size),limited=report.conservativeReading||report.availableMiB<2048;return {concurrentReads:limited?1:report.concurrentReadLimit,pagePixelLimit:limited?8000000:16000000,rangeAssemblyMiB:report.rangeAssemblyMiB,rangeCacheMiB:report.rangeCacheMiB,conservativeReading:limited};};
  store.onOpenProgress=progress=>{if(window&&!window.isDestroyed())window.webContents.send('pdfix:file-open-progress',progress);};
  register('read-pdf-range',async(id,begin,end)=>{try{return await store.readPdfRange(id,begin,end);}catch(error){throw error instanceof FileError?error:new FileError(error.code||'PDF_RANGE',error.message||'This PDF range could not be read. Reopen the file.');}});
  const pagedRead=async(id,action)=>{const source=store.source(id);try{return await pdfTool('pagedPdf',()=>pagedPdf,tool=>action(tool,source));}catch(error){throw new FileError(error.code||'PAGED_PDF',error.message||'This page could not be prepared. Try another physical page.');}};
  register('open-paged-pdf',id=>pagedRead(id,(tool,source)=>tool.open(id,source)));
  register('read-paged-pdf',(id,page,token)=>pagedRead(id,(tool,source)=>tool.page(id,source,page,token)));
  register('cancel-paged-pdf',(id,token)=>pagedPdf.cancel(id,token));
  register('release-paged-pdf',id=>pagedPdf.release(id));
  register('release-file',id=>store.release(id));
  register('pick-review-draft',async id=>{
    const source=store.source(id);
    if(source.ext!=='pdf')throw new FileError('FORMAT','Open the original PDF before loading its review draft.');
    splitSaves++;
    try{
      const result=await dialog.showOpenDialog(window,{title:'Load a saved PDFix review draft',properties:['openFile'],filters:[{name:'PDFix review draft',extensions:['json']}]});
      if(result.canceled)return null;
      const draft=await readReviewDraft(result.filePaths[0]);
      if(store.source(id)!==source)throw new FileError('CHANGED','The opened PDF changed. Load this draft again for its exact original.');
      return draft;
    }finally{splitSaves--;}
  });
  register('page-workflows',id=>pageWorkflows.list(id));
  register('sheet-sets',()=>sheetSets.list());
  register('save-sheet-set',(name,value)=>sheetSets.save(name,value));
  register('remove-sheet-set',id=>sheetSets.remove(id));
  register('load-sheet-set',async id=>{
    splitSaves++;
    try{return await sheetSets.load(id,async source=>{
      const result=await dialog.showOpenDialog(window,{title:'Choose exact sheet-set source '+(source.index+1)+': '+source.name,message:'Choose this exact original PDF. Size and SHA-256 must match the saved sheet set.',properties:['openFile'],filters:[{name:'Original drawing PDF',extensions:['pdf']}]});
      return result.canceled?null:result.filePaths[0];
    });}finally{splitSaves--;}
  });
  register('pick-sheet-set-source',async id=>{
    const original=store.source(id);
    if(original.ext!=='pdf')throw new FileError('FORMAT','Open a PDF before adding sheet-set sources.');
    splitSaves++;
    try{
      const result=await dialog.showOpenDialog(window,{title:'Add a drawing PDF to the sheet set',properties:['openFile'],filters:[{name:'Drawing PDF',extensions:['pdf']}]});
      if(result.canceled)return null;
      if(store.source(id)!==original)throw new FileError('CHANGED','The original drawing changed. Add the source again.');
      if(path.extname(result.filePaths[0]).toLowerCase()!=='.pdf')throw new FileError('FORMAT','Choose a drawing PDF.');
      const packet=await store.open(result.filePaths[0],{retain:true,maxBytes:MAX_BYTES});
      if(store.source(id)!==original)throw new FileError('CHANGED','The original drawing changed while adding this source.');
      return packet;
    }finally{splitSaves--;}
  });

  register('pick-takeoff-ledger',async id=>{
    const source=store.source(id);
    if(source.ext!=='pdf')throw new FileError('FORMAT','Open the original drawing before loading its takeoff ledger.');
    splitSaves++;
    try{
      const result=await dialog.showOpenDialog(window,{title:'Load a PDFix takeoff ledger',properties:['openFile'],filters:[{name:'Takeoff ledger',extensions:['json']}]});
      if(result.canceled)return null;
      const ledger=await readChosenJson(result.filePaths[0],'takeoff ledger');
      if(store.source(id)!==source)throw new FileError('CHANGED','The opened drawing changed. Load this ledger again for its exact original.');
      return ledger;
    }finally{splitSaves--;}
  });
  register('save-page-workflow',(id,name,value)=>pageWorkflows.save(id,name,value));
  register('remove-page-workflow',(workflowID,id)=>pageWorkflows.remove(workflowID,id));
  register('load-page-workflow',async(workflowID,id)=>{splitSaves++;try{return await pageWorkflows.load(workflowID,id,async source=>{const result=await dialog.showOpenDialog(window,{title:'Choose exact workflow source '+(source.index+1)+': '+source.name,message:'Choose the exact original PDF saved in this workflow. Every source is matched by size and SHA-256.',properties:['openFile'],filters:[{name:'Original PDF',extensions:['pdf']}]});return result.canceled?null:result.filePaths[0];});}finally{splitSaves--;}});
  register('load-page-plan',id=>store.pages.load(id));
  register('load-pdf-content',id=>store.loadContent(id));register('save-pdf-content',(id,draft)=>store.saveContent(id,draft));register('clear-pdf-content',id=>store.clearContent(id));
  register('pick-pdf-image',async()=>{
    const result=await dialog.showOpenDialog(window,{title:'Choose an image to add to the PDF',properties:['openFile'],filters:[{name:'Still images',extensions:['png','jpg','jpeg','webp','bmp']}]});if(result.canceled)return null;
    const filePath=result.filePaths[0],ext=path.extname(filePath).slice(1).toLowerCase();if(!['png','jpg','jpeg','webp','bmp'].includes(ext))throw new FileError('FORMAT','Choose a supported still image.');
    const handle=await fs.open(filePath,'r');try{const stat=await handle.stat();if(!stat.isFile()||!stat.size||stat.size>32*1024*1024)throw new FileError('TOO_LARGE','Choose an image under 32 MB.');const buffer=Buffer.alloc(stat.size+1);let length=0;while(length<buffer.length){const chunk=await handle.read(buffer,length,buffer.length-length,length);if(!chunk.bytesRead)break;length+=chunk.bytesRead;}if(length!==stat.size)throw new FileError('CHANGED','The image changed while opening. Choose it again.');const bytes=buffer.subarray(0,length);validateFile(filePath,bytes);return {name:path.basename(filePath).slice(0,200),ext,bytes:Uint8Array.from(bytes)};}finally{await handle.close();}
  });
  register('save-page-plan',(id,plan)=>store.pages.save(id,plan));
  register('clear-page-plan',id=>store.pages.clear(id));
  register('relink-page-source',async(id,index)=>{store.pages.identity(id);splitSaves++;try{const result=await dialog.showOpenDialog(window,{title:'Locate the original source PDF for this arrangement',properties:['openFile'],filters:[{name:'PDF',extensions:['pdf']}]});return result.canceled?null:await store.pages.relink(id,index,result.filePaths[0]);}finally{splitSaves--;}});
  register('favorite', id => store.favorite(id));
  register('forget', id => store.forget(id));
  register('reading',id=>store.reading(id));register('save-reading',(id,value)=>store.saveReading(id,value));
  register('save-copy', async (id, output, preferredName) => {
    const source = store.source(id);
    if (output !== undefined && (!(output instanceof Uint8Array) || output.length > MAX_BYTES)) throw new FileError('OUTPUT', 'The output exceeds the allowed size.');
    const ext = path.extname(source.name);
    const preferred=preferredCopyBase(preferredName,source.ext);
    const defaultPath = path.join(path.dirname(source.path), (preferred??path.basename(source.name, ext)+'-copy') + ext);
    splitSaves++;try{const result = await dialog.showSaveDialog(window, { title: 'Save a new copy — original stays safe', defaultPath, filters: [{name:source.ext.toUpperCase(),extensions:[source.ext]}] });
    if (result.canceled) return null;
    return await store.saveCopy(id, result.filePath, output);}finally{splitSaves--;}
  });
  register('save-edited-image',async(id,ext,part)=>{const source=store.source(id);if(!['png','jpg','jpeg','webp','bmp'].includes(source.ext))throw new ImageExportError('FORMAT','Choose a supported original image.');imageParts([part],ext);splitSaves++;try{const base=path.basename(source.name,path.extname(source.name)),result=await dialog.showSaveDialog(window,{title:'Save edited image copy',defaultPath:path.join(path.dirname(source.path),`${base}-edited.${ext}`),filters:[{name:ext==='png'?'PNG image':'JPEG image',extensions:[ext]}]});return result.canceled?null:await store.saveCopy(id,result.filePath,part.bytes,ext,createHash('sha256').update(part.bytes).digest('hex'));}finally{splitSaves--;}});
  register('save-pdf-image',async(id,ext,part)=>{const source=store.source(id);if(source.ext!=='pdf')throw new ImageExportError('FORMAT','Choose an opened PDF.');imageParts([part],ext);splitSaves++;try{const base=path.basename(source.name,path.extname(source.name)),result=await dialog.showSaveDialog(window,{title:'Save a PDF page as an image',defaultPath:path.join(path.dirname(source.path),`${base}-page-${part.page}.${ext}`),filters:[{name:ext==='png'?'PNG image':'JPEG image',extensions:[ext]}]});return result.canceled?null:await store.saveCopy(id,result.filePath,part.bytes,ext,createHash('sha256').update(part.bytes).digest('hex'));}finally{splitSaves--;}});
  register('save-pdf-images',async(id,name,ext,parts)=>{const source=store.source(id);if(source.ext!=='pdf')throw new ImageExportError('FORMAT','Choose an opened PDF.');imageParts(parts,ext);splitSaves++;try{const result=await dialog.showOpenDialog(window,{title:'Choose a parent folder for PDF page images',defaultPath:path.dirname(source.path),properties:['openDirectory','createDirectory']});return result.canceled?null:await writeImageCopies(result.filePaths[0],name,parts,ext);}finally{splitSaves--;}});
  register('save-split',async(id,name,parts)=>{
    const source=store.source(id);if(source.ext!=='pdf')throw new FileError('FORMAT','Split saving needs an opened PDF.');const {splitFolderName,splitParts}=require('./split-writer.cjs');try{splitFolderName(name);splitParts(parts);}catch(error){throw new FileError(error.code,error.message);}
    splitSaves++;try{const result=await dialog.showOpenDialog(window,{title:'Choose a parent folder for new split PDF copies',defaultPath:path.dirname(source.path),properties:['openDirectory','createDirectory']});return result.canceled?null:await store.saveSplit(id,result.filePaths[0],name,parts);}finally{splitSaves--;}
  });
  register('compress',async(id,token,options)=>{const source=store.source(id);if(source.ext!=='pdf')throw new FileError('FORMAT','Compression needs an opened PDF.');splitSaves++;try{return await compression.compress(token,source.bytes,options);}finally{splitSaves--;}});
  register('cancel-compression',token=>compression.cancel(token));
  register('password-copy',async(id,token,options)=>{const source=store.source(id);if(source.ext!=='pdf')throw new FileError('FORMAT','Password protection needs an opened PDF.');splitSaves++;try{return await passwords.process(id,token,source.bytes,options);}finally{splitSaves--;}});
  register('discard-password-copy',token=>passwords.discard(token));
  register('save-password-copy',async(id,token)=>{const source=store.source(id),verified=passwords.output(id,token),label=verified.result.mode==='protect'?'protected':'unprotected';if(source.ext!=='pdf')throw new FileError('FORMAT','Choose a PDF.');splitSaves++;try{const result=await dialog.showSaveDialog(window,{title:'Save '+label+' PDF — original stays safe',defaultPath:path.join(path.dirname(source.path),path.basename(source.name,path.extname(source.name))+'-'+label+'.pdf'),filters:[{name:'PDF',extensions:['pdf']}]});if(result.canceled)return null;const saved=await store.saveCopy(id,result.filePath,verified.bytes,undefined,verified.result.sha256,{provider:'password-engine',sha256:verified.result.sha256});verified.saved=saved;return saved;}finally{splitSaves--;}});
  register('open-saved-password-copy',async(id,token)=>{store.source(id);const verified=passwords.output(id,token);if(verified.result.mode!=='remove'||!verified.saved)throw new PasswordError('SAVE','Save the verified unprotected copy before opening it.');splitSaves++;try{return await store.open(verified.saved.location,{expectedHash:verified.result.sha256});}finally{splitSaves--;}});
  register('load-signature-request-draft',id=>store.loadSignatureRequest(id));register('save-signature-request-draft',(id,draft)=>store.saveSignatureRequestDraft(id,draft));register('clear-signature-request-draft',id=>store.clearSignatureRequestDraft(id));
  register('load-redaction',id=>store.loadRedaction(id));register('save-redaction-plan',(id,draft)=>store.saveRedaction(id,draft));register('clear-redaction',id=>store.clearRedaction(id));
  register('verify-redaction',async(id,token,bytes,draft)=>{const source=store.source(id);if(source.ext!=='pdf')throw new FileError('FORMAT','Redaction needs an opened PDF.');splitSaves++;try{if(redactionRestart)await redactionRestart;const service=redaction,result=await service.verify(id,source,token,bytes,draft);if(store.source(id)!==source||service!==redaction){await service.discard(token);throw new FileError('CHANGED','The redaction source changed. Prepare a fresh reviewed copy.');}return result;}finally{splitSaves--;}});
  register('discard-redaction',async token=>{if(redactionRestart)await redactionRestart;return await redaction.discard(token);});
  register('save-redacted-copy',async(id,token)=>{if(redactionRestart)await redactionRestart;const service=redaction,source=store.source(id),bytes=service.output(id,source,token),sha256=service.verified.result.sha256;if(source.ext!=='pdf')throw new FileError('FORMAT','Redaction needs an opened PDF.');splitSaves++;try{const result=await dialog.showSaveDialog(window,{title:'Save verified redacted PDF — original stays safe',defaultPath:path.join(path.dirname(source.path),path.basename(source.name,path.extname(source.name))+'-redacted.pdf'),filters:[{name:'PDF',extensions:['pdf']}]});if(result.canceled)return null;const current=service.output(id,store.source(id),token);if(service!==redaction||service.verified.result.sha256!==sha256)throw new FileError('CHANGED','The redacted preview changed. Prepare and review it again.');return await store.saveCopy(id,result.filePath,current,'pdf',sha256);}finally{splitSaves--;}});
  register('save-compressed',async(id,bytes)=>{const source=store.source(id);if(source.ext!=='pdf'||!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>MAX_BYTES)throw new FileError('OUTPUT','Choose a compressed PDF under 100 MB.');splitSaves++;try{const result=await dialog.showSaveDialog(window,{title:'Save compressed PDF — original stays safe',defaultPath:path.join(path.dirname(source.path),path.basename(source.name,'.pdf')+'-compressed.pdf'),filters:[{name:'PDF',extensions:['pdf']}]});return result.canceled?null:await store.saveCopy(id,result.filePath,bytes);}finally{splitSaves--;}});
  register('print',async value=>{let options;try{options=printSettings(value);}catch(error){throw new FileError('PRINT',error.message);}if(value?.sourceID){const source=store.source(value.sourceID);if(source.ext!=='pdf')throw new FileError('PRINT','PDF print preparation needs an opened PDF.');}splitSaves++;try{return await new Promise((resolve,reject)=>window.webContents.print(options,(success,reason)=>success?resolve(true):/cancel/i.test(reason??'')?resolve(false):reject(new FileError('PRINT','Windows could not print this job. Check the chosen paper and printer settings.'))));}finally{splitSaves--;}});
  register('create-document-pdf',async(id,doc,options)=>{if(id)store.source(id);splitSaves++;try{return await pdfTool('documentPdf',()=>documentPdf,service=>service.create(doc,options));}finally{splitSaves--;}});
  register('cancel-document-pdf',()=>documentPdf.cancel());
  const batesAction=action=>async(...args)=>{try{return await pdfTool('batchBates',()=>batchBates,service=>action(service,...args));}catch(error){throw error instanceof FileError?error:new FileError('BATCH_BATES',error.message);}};
  register('pick-batch-bates',batesAction(async service=>{if(batesPicking)throw new Error('Finish choosing the current Bates sources first.');service.idle();batesPicking=true;splitSaves++;try{const chosen=await dialog.showOpenDialog(window,{title:'Choose PDFs for continuous Bates numbering',properties:['openFile','multiSelections'],filters:[{name:'PDF',extensions:['pdf']}]});const check=()=>{if(!rendererAvailable||service!==batchBates||service.closed)throw new Error('The Bates picker ended with its session.');};check();return chosen.canceled?null:await service.select(chosen.filePaths,check);}finally{batesPicking=false;splitSaves--;}}));
  register('batch-bates-source',batesAction((service,sessionId,id)=>service.source(sessionId,id)));
  register('configure-batch-bates',batesAction((service,sessionId,ids,settings)=>service.configure(sessionId,ids,settings)));
  register('pick-batch-bates-folder',batesAction(async(service,sessionId,name)=>{service.idle();service.check(sessionId);splitSaves++;try{const chosen=await dialog.showOpenDialog(window,{title:'Choose the parent for new Bates copies',properties:['openDirectory']});if(!rendererAvailable||service!==batchBates||service.closed)throw new Error('The Bates folder picker ended with its session.');return chosen.canceled?null:await service.destination(sessionId,chosen.filePaths[0],name);}finally{splitSaves--;}}));
  register('build-batch-bates',batesAction(async(service,sessionId,id,token,pages)=>{splitSaves++;try{return await service.build(sessionId,id,token,pages);}finally{splitSaves--;}}));
  register('save-batch-bates',batesAction(async(service,sessionId,id,token,review)=>{splitSaves++;try{return await service.save(store,sessionId,id,token,review);}finally{splitSaves--;}}));
  register('cancel-batch-bates',batesAction((service,sessionId,token)=>service.cancel(sessionId,token)));
  register('skip-batch-bates',batesAction((service,sessionId,id)=>service.skip(sessionId,id)));
  register('retry-batch-bates',batesAction((service,sessionId,id)=>service.retry(sessionId,id)));
  register('batch-bates-report',batesAction((service,sessionId)=>service.report(sessionId)));
  register('clear-batch-bates',batesAction(async(service,sessionId)=>{service.check(sessionId);await service.reset();return true;}));
  register('save-batch-bates-report',batesAction(async(service,sessionId)=>{service.idle();const bytes=Buffer.from(JSON.stringify(service.report(sessionId),null,2)+'\n'),sha256=createHash('sha256').update(bytes).digest('hex');splitSaves++;try{const chosen=await dialog.showSaveDialog(window,{title:'Save Bates identifier and queue report',defaultPath:path.join(app.getPath('documents'),'bates-queue-report.json'),filters:[{name:'JSON',extensions:['json']}]});if(chosen.canceled)return null;if(!rendererAvailable||service!==batchBates)throw new Error('The report save ended with its session.');service.idle();const current=Buffer.from(JSON.stringify(service.report(sessionId),null,2)+'\n');if(createHash('sha256').update(current).digest('hex')!==sha256)throw new Error('The Bates report changed. Choose Save report again.');return await store.saveCopy(null,chosen.filePath,current,'json',sha256);}finally{splitSaves--;}}));
  register('pick-batch-compression',async()=>{if(batchRestart)await batchRestart;const service=batchCompression;service.idle();splitSaves++;try{const chosen=await dialog.showOpenDialog(window,{title:'Choose PDFs for reviewed batch compression',properties:['openFile','multiSelections'],filters:[{name:'PDF',extensions:['pdf']}]});if(service!==batchCompression||service.closed)throw new FileError('CANCELED','The batch chooser ended with its application session.');return chosen.canceled?null:await service.select(chosen.filePaths);}finally{splitSaves--;}});
  register('batch-compression-source',(token,id)=>batchCompression.bytes(token,id));
  register('pick-batch-compression-folder',async(token,name)=>{const service=batchCompression;service.check(token);service.idle();splitSaves++;try{const chosen=await dialog.showOpenDialog(window,{title:'Choose the parent for a new batch-copy folder',properties:['openDirectory']});if(service!==batchCompression||service.closed)throw new FileError('CANCELED','The batch folder chooser ended with its application session.');return chosen.canceled?null:await service.destination(token,chosen.filePaths[0],name);}finally{splitSaves--;}});
  register('build-batch-compression',async(token,id,jobToken,options)=>{splitSaves++;try{return await batchCompression.build(token,id,jobToken,options);}finally{splitSaves--;}});
  register('cancel-batch-compression',token=>batchCompression.cancel(token));
  register('discard-batch-compression',(token,id,jobToken)=>batchCompression.discard(token,id,jobToken));
  register('clear-batch-compression',token=>batchCompression.clear(token));
  register('save-batch-compression',async(token,id,jobToken,review)=>{splitSaves++;try{return await batchCompression.save(store,token,id,jobToken,review);}finally{splitSaves--;}});
  register('save-batch-compression-report',async token=>{const service=batchCompression;service.idle();const bytes=Buffer.from(JSON.stringify(service.report(token),null,2)+'\n'),sha256=createHash('sha256').update(bytes).digest('hex');splitSaves++;try{const chosen=await dialog.showSaveDialog(window,{title:'Save batch compression queue report',defaultPath:path.join(service.folder?.created?service.folder.target:app.getPath('documents'),'compression-queue-report.json'),filters:[{name:'JSON queue report',extensions:['json']}]});if(chosen.canceled)return null;const current=Buffer.from(JSON.stringify(service.report(token),null,2)+'\n');if(service!==batchCompression||createHash('sha256').update(current).digest('hex')!==sha256)throw new FileError('CHANGED','The batch report changed. Choose Save queue report again.');return store.saveCopy(null,chosen.filePath,current,'json',sha256);}finally{splitSaves--;}});
  register('pick-batch-document-actions',async()=>{if(pdfToolRestarts.has('batchActions'))await pdfToolRestarts.get('batchActions');const service=batchDocumentActions;service.idle();splitSaves++;try{const chosen=await dialog.showOpenDialog(window,{title:'Choose PDFs for reviewed batch actions',properties:['openFile','multiSelections'],filters:[{name:'PDF',extensions:['pdf']}]});if(service!==batchDocumentActions||service.closed)throw new FileError('CANCELED','The batch chooser ended with its application session.');return chosen.canceled?null:await service.select(chosen.filePaths);}finally{splitSaves--;}});
  register('batch-document-action-source',(token,id)=>batchDocumentActions.bytes(token,id));
  register('pick-batch-document-actions-folder',async(token,name)=>{const service=batchDocumentActions;service.check(token);service.idle();splitSaves++;try{const chosen=await dialog.showOpenDialog(window,{title:'Choose the parent for a new batch-copy folder',properties:['openDirectory']});if(service!==batchDocumentActions||service.closed)throw new FileError('CANCELED','The batch folder chooser ended with its application session.');return chosen.canceled?null:await service.destination(token,chosen.filePaths[0],name);}finally{splitSaves--;}});
  register('build-batch-document-action',async(token,id,jobToken,options)=>{splitSaves++;try{return await batchDocumentActions.build(token,id,jobToken,options);}finally{splitSaves--;}});
  register('cancel-batch-document-actions',token=>batchDocumentActions.cancel(token));
  register('discard-batch-document-action',(token,id,jobToken)=>batchDocumentActions.discard(token,id,jobToken));
  register('clear-batch-document-actions',token=>batchDocumentActions.clear(token));
  register('save-batch-document-action',async(token,id,jobToken,review)=>{splitSaves++;try{return await batchDocumentActions.save(store,token,id,jobToken,review);}finally{splitSaves--;}});
  register('save-batch-document-actions-report',async token=>{const service=batchDocumentActions;service.idle();const bytes=Buffer.from(JSON.stringify(service.report(token),null,2)+'\n'),sha256=createHash('sha256').update(bytes).digest('hex');splitSaves++;try{const chosen=await dialog.showSaveDialog(window,{title:'Save batch actions queue report',defaultPath:path.join(service.folder?.created?service.folder.target:app.getPath('documents'),'document-actions-queue-report.json'),filters:[{name:'JSON queue report',extensions:['json']}]});if(chosen.canceled)return null;const current=Buffer.from(JSON.stringify(service.report(token),null,2)+'\n');if(service!==batchDocumentActions||createHash('sha256').update(current).digest('hex')!==sha256)throw new FileError('CHANGED','The batch report changed. Choose Save queue report again.');return store.saveCopy(null,chosen.filePath,current,'json',sha256);}finally{splitSaves--;}});
  register('pick-search-folder',async options=>{splitSaves++;try{if(!options||Object.keys(options).sort().join(',')!=='fileTypes,persistence,purpose,recursive'||typeof options.recursive!=='boolean'||options.purpose!=='search'||options.persistence!=='session'||JSON.stringify(options.fileTypes)!=='["pdf"]')throw new FileError('SEARCH','Review this session-only PDF folder search scope first.');const selected=await dialog.showOpenDialog(window,{title:options.recursive?'Grant PDF search in a folder and its subfolders':'Grant PDF search in one folder',properties:['openDirectory']});return selected.canceled?null:await searchSources.selectFolder(selected.filePaths[0],options);}finally{splitSaves--;}});
  register('search-folder-status',token=>searchSources.folderStatus(token));
  register('cancel-search-folder',token=>searchSources.cancelFolder(token));
  register('release-search-source',(token,id)=>searchSources.release(token,id));
  register('pick-file-fingerprint',async()=>{splitSaves++;try{const selected=await dialog.showOpenDialog(window,{title:'Choose a PDF to verify its SHA-256',properties:['openFile'],filters:[{name:'PDF',extensions:['pdf']}]});return selected.canceled?null:await fileFingerprints.calculate(selected.filePaths[0]);}finally{splitSaves--;}});
  register('file-fingerprint-progress',()=>fileFingerprints.progress());
  register('cancel-file-fingerprint',()=>fileFingerprints.cancel());
  register('clear-file-fingerprint',()=>fileFingerprints.clear());
  register('compare-file-fingerprint',value=>fileFingerprints.compare(value));
  register('import-file-fingerprint-receipt',async()=>{splitSaves++;let selected;try{const chosen=await dialog.showOpenDialog(window,{title:'Import a SHA-256 verification receipt',properties:['openFile'],filters:[{name:'JSON receipt',extensions:['json']}]});if(chosen.canceled)return null;selected=await readChosenBoundedFile(chosen.filePaths[0],['json'],64*1024);let value;try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(selected.bytes));}catch{throw new FileError('HASH','Choose a UTF-8 JSON SHA-256 receipt.');}if(!value||value.version!==1||value.algorithm!=='SHA-256'||typeof value.name!=='string'||value.name.length>512)throw new FileError('HASH','This file is not a supported SHA-256 receipt.');return {sha256:expectedHash(value.sha256),name:value.name};}finally{selected?.bytes.fill(0);splitSaves--;}});
  register('save-file-fingerprint-receipt',async()=>{const bytes=fileFingerprints.export(),sha256=createHash('sha256').update(bytes).digest('hex');splitSaves++;try{const chosen=await dialog.showSaveDialog(window,{title:'Save fingerprint receipt as a new file',defaultPath:path.join(app.getPath('documents'),'PDFix-SHA256-receipt.json'),filters:[{name:'JSON receipt',extensions:['json']}]});if(chosen.canceled)return null;const current=fileFingerprints.export();try{if(createHash('sha256').update(current).digest('hex')!==sha256)throw new FileError('CHANGED','The fingerprint changed. Export the current receipt again.');return await store.saveCopy(null,chosen.filePath,bytes,'json',sha256);}finally{current.fill(0);}}finally{bytes.fill(0);splitSaves--;}});
  register('import-email-message',async()=>{if(emailPicking)throw new FileError('BUSY','Finish choosing or importing the current email first.');emailPicking=true;splitSaves++;let picked;const id=require('node:crypto').randomUUID();try{const chosen=await dialog.showOpenDialog(window,{title:'Create a document from an email message',properties:['openFile'],filters:[{name:'Email message',extensions:['eml']}]});if(chosen.canceled)return null;picked=await readChosenBoundedFile(chosen.filePaths[0],['eml'],10*1024*1024);if(!rendererAvailable)throw new FileError('CANCELED','Email import ended with its app session.');const report=await readEmailMessage(id,{ext:'eml',bytes:picked.bytes,fingerprint:picked.sha256});if(!rendererAvailable)throw new FileError('CANCELED','Email import ended with its app session.');return report;}catch(error){throw error instanceof FileError?error:new FileError('EMAIL',error.message);}finally{picked?.bytes.fill(0);emailPicking=false;splitSaves--;}});
  register('cancel-email-message',()=>cancelEmailMessage());
  // Electron 44 reads the clipboard asynchronously (readText is a promise; pictures come from read() as PNG items).
  // The picture's size is taken from its PNG header, so nothing is decoded here; the editor prepares it as usual.
  register('read-creation-clipboard',async()=>{if(clipboardReading)throw new FileError('BUSY','Finish the current clipboard read first.');clipboardReading=true;try{const text=await clipboard.readText();if(typeof text!=='string'||Buffer.byteLength(text,'utf8')>1024*1024)throw new FileError('CLIPBOARD','The clipboard text exceeds the 1 MiB document budget. Paste a smaller selection.');
    let asset=null;const item=(await clipboard.read().catch(()=>[])).find(entry=>entry.types.includes('image/png'));
    if(item){const blob=await item.getType('image/png');if(!blob||blob.size>5*1024*1024)throw new FileError('CLIPBOARD','The clipboard PNG exceeds 5 MiB. Copy a smaller image.');const bytes=new Uint8Array(await blob.arrayBuffer());
      const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),png=bytes.length>=24&&[137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value)&&String.fromCharCode(...bytes.subarray(12,16))==='IHDR';
      const width=png?view.getUint32(16):0,height=png?view.getUint32(20):0;if(!png||width<1||height<1||width*height>4000000)throw new FileError('CLIPBOARD','The clipboard image exceeds four million pixels or is not a picture. Copy a smaller image.');
      asset={mime:'image/png',bytes};}
    return {version:1,text,image:asset};}finally{clipboardReading=false;}});
  register('pick-form-mail-merge-csv',id=>cleanupJob(id,async source=>{let selected;splitSaves++;try{const chosen=await dialog.showOpenDialog(window,{title:'Choose CSV rows for PDF form mail merge',properties:['openFile'],filters:[{name:'UTF-8 CSV',extensions:['csv']}]});if(chosen.canceled)return null;selected=await readChosenBoundedFile(chosen.filePaths[0],['csv'],2*1024*1024);if(store.source(id)!==source)throw new FileError('CHANGED','The form source changed before CSV import.');return await pdfTool('formMailMerge',()=>formMailMerge,tool=>tool.loadCsv(id,source,require('node:crypto').randomUUID(),selected.name,selected.bytes));}finally{selected?.bytes.fill(0);splitSaves--;}}));
  register('preview-form-mail-merge',(id,token,draft)=>cleanupJob(id,source=>pdfTool('formMailMerge',()=>formMailMerge,tool=>tool.buildPreview(id,source,token,draft))));
  register('form-mail-merge-progress',(id,token)=>formMailMerge.progress(id,token));
  register('cancel-form-mail-merge',async(id,token)=>{const pending=pendingMailMergeSaves.get(id);if(pending&&(!token||pending.token===token))pending.canceled=true;const stopped=await formMailMerge.cancel(id,token);return stopped||!!pending?.canceled;});
  register('discard-form-mail-merge',(id,token)=>formMailMerge.discard(id,token));
  register('save-form-mail-merge-batch',(id,token,approval)=>cleanupJob(id,async source=>{if(pendingMailMergeSaves.has(id))throw new FileError('BUSY','Finish or cancel this mail merge save first.');const operation={token,canceled:false};pendingMailMergeSaves.set(id,operation);splitSaves++;let folder,saved=0;try{const chosen=await dialog.showOpenDialog(window,{title:'Choose a parent for a new mail-merge output folder',properties:['openDirectory']});if(chosen.canceled)return null;if(operation.canceled||!rendererAvailable||store.source(id)!==source)throw new FileError('CANCELED','Mail merge canceled before generation.');const parent=await fs.realpath(chosen.filePaths[0]);if(!(await fs.lstat(parent)).isDirectory()||(await fs.lstat(chosen.filePaths[0])).isSymbolicLink()||parent.toLowerCase()!==path.resolve(chosen.filePaths[0]).toLowerCase())throw new FileError('OUTPUT','Choose an available parent folder with no linked paths.');folder=path.join(parent,'PDFix mail merge '+new Date().toISOString().replace(/[:.]/g,'-')+' '+require('node:crypto').randomUUID().slice(0,8));await fs.mkdir(folder);const report=await pdfTool('formMailMerge',()=>formMailMerge,tool=>tool.batch(id,source,token,approval,async(output,row)=>{if(operation.canceled||!rendererAvailable||store.source(id)!==source)throw new FileError('CHANGED','The mail merge source session ended or was canceled.');if(typeof row.filename!=='string'||path.basename(row.filename)!==row.filename||!row.filename.toLowerCase().endsWith('.pdf'))throw new FileError('OUTPUT','A mail-merge output name is not a PDF leaf name.');const receipt=await store.saveCopy(id,path.join(folder,row.filename),output.bytes,'pdf',output.report.sha256);saved++;return receipt;}));return {...report,folder};}finally{if(folder&&!saved)await fs.rmdir(folder).catch(()=>{});if(pendingMailMergeSaves.get(id)===operation)pendingMailMergeSaves.delete(id);splitSaves--;}}));
  register('pick-search-sources',async()=>{splitSaves++;try{const chosen=await dialog.showOpenDialog(window,{title:'Choose files to search locally',properties:['openFile','multiSelections'],filters:[{name:'Searchable documents and UTF-8 text',extensions:['pdf','docx','rtf','txt','md','markdown','csv','json','xml','yaml','yml']}]});return chosen.canceled?null:await searchSources.select(chosen.filePaths);}finally{splitSaves--;}});
  register('search-source-bytes',(token,id)=>searchSources.bytes(token,id));
  register('discard-search-sources',token=>searchSources.clear(token));
  register('open-search-source',async(token,id)=>{splitSaves++;try{return await searchSources.open(store,token,id);}finally{splitSaves--;}});
  register('cancel-office-job',id=>{store.source(id);return cancelOfficeJob(id);});
  register('inspect-document-table-grids',async id=>{const source=store.source(id);try{const report=await inspectDocumentTableGrids(id,source);if(store.source(id)!==source||report.sourceSha256!==source.fingerprint)throw new FileError('CHANGED','The opened DOCX changed during table-grid import. Reopen it before continuing.');return report;}catch(error){throw error instanceof FileError?error:new FileError('DOCUMENT_GRIDS',error.message);}});
  register('cancel-document-table-grids',id=>{store.source(id);return cancelDocumentTableGrids(id);});
  register('read-presentation',async id=>{const source=store.source(id);if(source.ext!=='pptx')throw new FileError('FORMAT','Choose an opened PPTX presentation.');try{return await officeForSource('read-presentation',id,source);}catch(error){throw new FileError('PRESENTATION',error.message);}});
  register('save-presentation-copy',async(id,draft)=>{const source=store.source(id);if(source.ext!=='pptx')throw new FileError('FORMAT','Choose an opened PPTX presentation.');splitSaves++;try{let bytes;try{validPresentationDraft(draft);bytes=await officeForSource('write-presentation',id,source,draft);}catch(error){throw new FileError('PRESENTATION',error.message);}const base=path.basename(source.name,path.extname(source.name)),result=await dialog.showSaveDialog(window,{title:'Save edited presentation copy',defaultPath:path.join(path.dirname(source.path),`${base}-edited.pptx`),filters:[{name:'PowerPoint presentation',extensions:['pptx']}]});return result.canceled?null:await store.saveCopy(id,result.filePath,bytes,'pptx',createHash('sha256').update(bytes).digest('hex'));}finally{splitSaves--;}});
  register('read-workbook',async id=>{const source=store.source(id);if(source.ext!=='xlsx')throw new FileError('FORMAT','Choose an opened XLSX workbook.');try{return await officeForSource('read',id,source);}catch(error){throw new FileError('WORKBOOK',error.message);}});
  register('save-workbook-copy',async(id,draft)=>{const source=store.source(id);if(source.ext!=='xlsx')throw new FileError('FORMAT','Choose an opened XLSX workbook.');splitSaves++;try{let bytes;try{validWorkbookDraft(draft);bytes=await officeForSource('write',id,source,draft);}catch(error){throw new FileError('WORKBOOK',error.message);}const base=path.basename(source.name,path.extname(source.name)),result=await dialog.showSaveDialog(window,{title:'Save edited workbook copy',defaultPath:path.join(path.dirname(source.path),`${base}-edited.xlsx`),filters:[{name:'Excel workbook',extensions:['xlsx']}]});return result.canceled?null:await store.saveCopy(id,result.filePath,bytes,'xlsx',createHash('sha256').update(bytes).digest('hex'));}finally{splitSaves--;}});
  // The editor shows the full address in its link popup; this opens only a validated web or email target in the system handler.
  register('open-document-link',async href=>{const {validDocumentLink}=require('./document-link-model.cjs');let url;try{url=validDocumentLink(href);}catch(error){throw new FileError('LINK',error.message);}if(url!==href)throw new FileError('LINK','Use the address exactly as shown in the document link.');await shell.openExternal(url,{activate:true});return {opened:true};});
  register('export-document',async(id,ext,bytes,name)=>{
    if(!['pdf','txt','md','markdown','json','xml','yaml','yml','csv'].includes(ext)||!(bytes instanceof Uint8Array)||bytes.length>MAX_BYTES)throw new FileError('OUTPUT','Choose a supported document output under 100 MB.');
    const source=id?store.source(id):null;
    const preferred=source?preferredCopyBase(name,ext):undefined;
    const base=source?(preferred??path.basename(source.name,path.extname(source.name))):newDocumentBase(name);
    splitSaves++;try{const result=await dialog.showSaveDialog(window,{title:'Export a copy - original stays safe',defaultPath:source?path.join(path.dirname(source.path),`${base}${preferred?'':'-edited'}.${ext}`):`${base}.${ext}`,filters:[{name:ext.toUpperCase(),extensions:[ext]}]});
    return result.canceled?null:await store.saveCopy(id,result.filePath,bytes,ext,createHash('sha256').update(bytes).digest('hex'));}finally{splitSaves--;}
  });
  register('load-draft',id=>store.loadDraft(id));register('save-draft',(id,draft)=>store.saveDraft(id,draft));register('clear-draft',id=>store.clearDraft(id));register('discard-new-document',id=>store.discardNewDocument(id));register('list-new-documents',()=>store.listNewDocuments());
  register('recoverable-recents',limit=>store.recoverableRecents(limit));register('load-markup',id=>store.loadMarkup(id));register('save-markup',(id,draft)=>store.saveMarkup(id,draft));register('clear-markup',id=>store.clearMarkup(id));
  register('load-image',id=>store.loadImage(id));register('save-image',(id,draft)=>store.saveImage(id,draft));register('clear-image',id=>store.clearImage(id));
  register('load-image-pages',id=>store.imagePages.load(id));register('save-image-pages',(id,draft)=>store.imagePages.save(id,draft));register('clear-image-pages',id=>store.imagePages.clear(id));
  register('relink-image-page-source',async(id,index)=>{store.imagePages.identity(id);splitSaves++;try{const result=await dialog.showOpenDialog(window,{title:'Locate the original image for this PDF collection',properties:['openFile'],filters:[{name:'Still images',extensions:['png','jpg','jpeg','webp','bmp']}]});return result.canceled?null:await store.imagePages.relink(id,index,result.filePaths[0]);}finally{splitSaves--;}});
  register('pick-image-pages',async(id,options)=>{
    store.imagePages.identity(id);splitSaves++;try{const waiting=options?.pending===true?pendingPictures.get(id):null;if(options?.pending===true){pendingPictures.delete(id);if(!waiting?.length)return null;}const result=waiting?{canceled:false,filePaths:waiting}:await dialog.showOpenDialog(window,{title:'Add images to this PDF',properties:['openFile','multiSelections'],filters:[{name:'Still images',extensions:['png','jpg','jpeg','webp','bmp']}]});if(result.canceled)return null;if(result.filePaths.length+store.handles.size>10)throw new FileError('TOO_LARGE','Choose fewer images. This session supports up to 10 source files.');const files=[],errors=[];
      for(const filePath of result.filePaths){try{if(!['png','jpg','jpeg','webp','bmp'].includes(path.extname(filePath).slice(1).toLowerCase()))throw new FileError('FORMAT','Choose a supported still image.');files.push(await store.open(filePath,{retain:true,maxBytes:32*1024*1024}));}catch(error){errors.push({name:path.basename(filePath),message:error instanceof FileError?error.message:'This image could not be opened.'});}}return {files,errors};
    }finally{splitSaves--;}
  });
  register('export-image-pdf',async(id,bytes)=>{const source=store.source(id);if(!['png','jpg','jpeg','webp','bmp'].includes(source.ext)||!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>MAX_BYTES)throw new FileError('OUTPUT','Choose a supported image and PDF output under 100 MB.');splitSaves++;try{const result=await dialog.showSaveDialog(window,{title:'Save image as PDF — original stays safe',defaultPath:path.join(path.dirname(source.path),path.basename(source.name,path.extname(source.name))+'-images.pdf'),filters:[{name:'PDF',extensions:['pdf']}]});return result.canceled?null:await store.saveCopy(id,result.filePath,bytes,'pdf',createHash('sha256').update(bytes).digest('hex'));}finally{splitSaves--;}});
  register('load-form',id=>store.loadForm(id));register('save-form',(id,draft)=>store.saveForm(id,draft));register('clear-form',id=>store.clearForm(id));
  register('signatures',()=>store.signatures.list());register('save-signature',(name,asset)=>store.signatures.save(name,asset));register('remove-signature',id=>store.signatures.remove(id));register('clear-signatures',()=>store.signatures.clear());
  register('pick-signature',async()=>{
    const result=await dialog.showOpenDialog(window,{title:'Choose a signature image',properties:['openFile'],filters:[{name:'Signature image',extensions:['png','jpg','jpeg','webp']}]});if(result.canceled)return null;
    const sourcePath=result.filePaths[0],ext=path.extname(sourcePath).slice(1).toLowerCase();if(!['png','jpg','jpeg','webp'].includes(ext))throw new FileError('FORMAT','Choose a PNG, JPEG or WebP signature image.');
    let handle;try{handle=await fs.open(sourcePath,'r');const stat=await handle.stat();if(!stat.isFile()||!stat.size||stat.size>4*1024*1024)throw new FileError('FORMAT','Choose a signature image under 4 MB.');const bytes=Buffer.alloc(stat.size+1);let length=0;while(length<bytes.length){const chunk=await handle.read(bytes,length,bytes.length-length,length);if(!chunk.bytesRead)break;length+=chunk.bytesRead;}if(length!==stat.size)throw new FileError('CHANGED','The signature image changed while reading. Choose it again.');const data=bytes.subarray(0,length);validateFile(sourcePath,data);return {name:path.basename(sourcePath),ext,bytes:new Uint8Array(data)};}finally{await handle?.close();}
  });
  register('checkpoint',(id,draft,label)=>store.checkpoint(id,draft,label));register('versions',id=>store.versions(id));register('load-version',(id,versionId)=>store.loadVersion(id,versionId));register('earlier-versions',id=>store.earlierVersions(id));register('document-history',id=>store.documentHistory(id));register('load-earlier-version',(id,versionId)=>store.loadEarlierVersion(id,versionId));register('restore-version',(id,versionId,current)=>store.restoreVersion(id,versionId,current));
  register('recovery-info',()=>store.recoveryInfo());register('clear-recovery',()=>store.clearRecovery());register('clear-recents',()=>store.clearRecents());
  const initialHash=process.argv.includes('--editor')?'#editor':process.argv.includes('--workspaces')?'#workspaces':'';
  await window.loadURL('pdfix://app/' + initialHash); if(!hiddenTest){window.show();window.focus();}
});
// Quit requests (Exit menu, app.quit) must pass the same departure check as the window close button.
// Disposing services first would leave an open editor unable to save its recovery draft.
app.on('before-quit',event=>{if(window&&!window.isDestroyed()&&(splitSaves||rendererAvailable&&!closeAuthorized)){event.preventDefault();window.close();}});
app.on('before-quit',event=>{if(event.defaultPrevented)return;for(const operation of namedPdfCopies.values())operation.controller.abort();pdfPageBoxes.dispose().catch(()=>{});pdfPrintMarks.dispose().catch(()=>{});pdfThinLines.dispose().catch(()=>{});pdfPageRevision.dispose().catch(()=>{});pagedPdf?.dispose().catch(()=>{});pdfOutputCheck?.dispose().catch(()=>{});localTextTools?.dispose().catch(()=>{});portfolioInputs.clear();inspectionReports.dispose();pdfRepair.dispose().catch(()=>{});formFill.dispose().catch(()=>{});restrictedEdits.dispose().catch(()=>{});documentWorkflow.dispose().catch(()=>{});workflowSourceIdentities.clear();workflowSource.dispose().catch(()=>{});tiffGeneration++;tiff.dispose().catch(()=>{});combinePickGeneration++;Promise.all([pdfCombine.dispose(),pdfCombineWorkflow.dispose()]).then(()=>combineInputs.clear()).catch(()=>{});batchBates.dispose().catch(()=>{});clearChosenFdf();pdfFdf.dispose().catch(()=>{});pdfPreflight.dispose().catch(()=>{});pdfAccessibilityAudit.dispose().catch(()=>{});pdfGeospatial.dispose().catch(()=>{});pdfCertificateSigning.dispose().catch(()=>{});pdfPortfolio.dispose().catch(()=>{});pdfTags.dispose().catch(()=>{});scannerAdapter?.dispose().catch(()=>{});});
app.on('window-all-closed', () => app.quit());

app.on('before-quit',event=>{if(event.defaultPrevented)return;windowsContextRequests.clear();watchedFolders?.dispose().catch(()=>{});signatureRequests.dispose().catch(()=>{});cloudFileSelections.clear();fileAvailability.dispose().catch(()=>{});store?.dispose().catch(()=>{});disposeRichDocumentService().catch(()=>{});for(const request of tableXlsxRequests.values())request.canceled=true;tableXlsx.dispose().catch(()=>{});batchDocumentActions.dispose().catch(()=>{});pdfPageOrder.dispose().catch(()=>{});redaction?.dispose().catch(()=>{});clearChosenXfdf();pdfXfdfImport.dispose().catch(()=>{});searchSources.clear();fileFingerprints.clear();disposeEmailMessageService().catch(()=>{});formMailMerge.dispose().catch(()=>{});disposeOfficeService().catch(()=>{});disposeDocumentTableGrids().catch(()=>{});if(compression?.active)compression.cancel(compression.active.token);if(passwords?.active)passwords.cancel(passwords.active.token);documentPdf?.dispose().catch(()=>{});pdfSecurity.dispose().catch(()=>{});pdfCertificates.dispose().catch(()=>{});pdfSanitize.dispose().catch(()=>{});batchCompression?.dispose().catch(()=>{});pdfAttachments.dispose().catch(()=>{});pdfBookmarks.dispose().catch(()=>{});pdfDecorations.dispose().catch(()=>{});pdfReview.dispose().catch(()=>{});pdfReviewEdits.dispose().catch(()=>{});pdfXfdf.dispose().catch(()=>{});pdfTakeoffs.dispose().catch(()=>{});pdfTakeoffRecovery.dispose().catch(()=>{});formBuilder?.dispose().catch(()=>{});aiService?.dispose();cancelLinkReview().catch(()=>{});pdfLinks.dispose().catch(()=>{});});
