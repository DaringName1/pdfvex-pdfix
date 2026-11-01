import {showContentRecoveryNotice} from './reader-content-recovery.js';
import {installReaderPanelPolicy} from './reader-panel-policy.js';
import {readerErrorDetail} from './pdf-reader-errors.js';
import {readerImageOptions,isImageMemoryFailure,SCAN_MEMORY_MESSAGE,readerCanvasContext} from './pdf-reader-image-policy.js';
import './pdf-reader-image-policy.css';
import {RedactionWorkspace} from './redaction-workspace.js';
import {installReaderTextTool} from './pdf-reader-text-tool.js';
import {PageWorkspace} from './page-workspace.js';
import {MarkupWorkspace} from './markup-workspace.js';
import {installReaderToolstrip,installPreviewOptions} from './pdf-reader-toolstrip.js';
import {PdfTextTools} from './pdf-text-tools.js';
import {PdfViewNavigation} from './pdf-view-navigation.js';
import {PdfCanvasNavigation} from './pdf-canvas-navigation.js';
import {PdfArtworkFullscreen} from './pdf-artwork-fullscreen.js';
import {PdfTableExtractionWorkspace} from './pdf-table-extraction-workspace.js';
import {SheetLabelNavigation} from './sheet-label-navigation.js';
import {PDFReviewPanel} from './pdf-review-panel.js';
import {PdfMarkupNavigation} from './pdf-markup-navigation.js';
import {PdfBookmarkWorkspace} from './pdf-bookmark-workspace.js';
import {PdfPageBoxWorkspace} from './pdf-page-box-workspace.js';
import {PdfPrintMarksWorkspace} from './pdf-print-marks-workspace.js';
import {PdfThinLineWorkspace} from './pdf-thin-line-workspace.js';
import {SignatureRequestWorkspace} from './signature-request-workspace.js';
import {SmartFileNameWorkspace} from './smart-file-name-workspace.js';
import {PdfDecorationWorkspace} from './pdf-decoration-workspace.js';
import {PdfCombineWorkspace} from './pdf-combine-workspace.js';
import {DocumentWorkflowWorkspace} from './document-workflow-workspace.js';
import {PdfFdfWorkspace,PdfFdfImportWorkspace} from './pdf-fdf-workspace.js';
import {PdfAttachments} from './pdf-attachments.js';
import {PdfPortfolioWorkspace} from './pdf-portfolio-workspace.js';
import {PdfTagsWorkspace} from './pdf-tags-workspace.js';
import {PdfReadableView} from './pdf-readable-view.js';
import {PdfAreaSelection} from './pdf-area-selection.js';
import {PdfRepairWorkspace} from './pdf-repair-workspace.js';
import {PdfGeospatialWorkspace} from './pdf-geospatial-workspace.js';
import {PdfPreflightWorkspace} from './pdf-preflight-workspace.js';
import {PdfAccessibilityAuditWorkspace} from './pdf-accessibility-audit-workspace.js';
import {showPdfCertificateSigning} from './pdf-certificate-signing-workspace.js';
import {PdfMultiPageView} from './pdf-multi-page-view.js';
import {PdfSanitizeWorkspace} from './pdf-sanitize-workspace.js';
import {PdfPrintWorkspace} from './pdf-print-workspace.js';
import {PdfFileDetails} from './pdf-file-details.js';
import {PdfLayers} from './pdf-layers.js';
import {DrawingMeasurements} from './drawing-measurements.js';
import {AnnotationSummary} from './annotation-summary.js';
import {PdfLinkReview} from './pdf-link-review.js';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { orderVisualText, rectangleRuns } from './pdf-selection.js';
import { layoutPreference, saveLayoutPreference } from './layout-controls.js';
import { ReaderNavigation } from './reader-navigation.js';
import {createPdfReaderKeyHandler} from './pdf-reader-keyboard.js';
import {PdfSearch,pdfSearchText} from './pdf-search.js';
import {createPdfSource,pdfSourceCapabilities,LARGE_PDF_TOOL_MESSAGE} from './pdf-source.js';
import {openPagedPdfDocument,PAGED_PDF_UNAVAILABLE} from './paged-pdf-document.js';
import './reader-navigation.css';
pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
const MAX_PAGES=500, MAX_PIXELS=16_000_000, MAX_PRINT_PAGES=100;
const MAX_CANVAS_DIMENSION=16384;
const renderDetail=readerErrorDetail;
const WHOLE_SOURCE_ACTIONS=new Set(['pages','export-images','edit-content','redact','compress','sheet-set','compare','blank-pages','create-forms','forms','markup','edit-outline','decorate','sanitize','attachments','portfolio','tags','geospatial','certificate-sign','preflight','accessibility-audit','repair','document-workflow','fdf-export','fdf-import','table-extraction','links']);

export class PdfReader {
  constructor(root,file,ui) {
    this.root=root;this.file=file;Object.assign(this,ui);this.pageNumber=1;this.readingView='page';this.zoom=1;this.fit=true;this.fitPage=false;this.viewRotation=0;this.disposed=false;this.version=0;this.index=new Map();this.thumbnailQueue=Promise.resolve();this.copyAllowed=true;this.printAllowed=true;this.annotationsVisible=true;this.printAnnotations=true;this.navigationIntent=0;this.thumbnailCandidates=new Set();this.thumbnailLive=new Map();
    this.pagePixelLimit=[8000000,16000000].includes(file.readingProfile?.pagePixelLimit)?file.readingProfile.pagePixelLimit:MAX_PIXELS;this.normalPagePixelLimit=this.pagePixelLimit;this.lowMemoryReading=Boolean((file.rangeSource||file.pagedSource)&&file.readingProfile?.conservativeReading);if(this.lowMemoryReading)this.pagePixelLimit=4_000_000;this.sourceCapabilities=pdfSourceCapabilities(file);this.sourceVersion=0;this.recentPages=new Map();this.activePageRenders=0;this.activeThumbnailRenders=0;this.build();
  }
  build(){
    this.headerCopy=!this.keyboardWithinRoot&&this.file.id?this.root.ownerDocument.querySelector('.file-header>.original-copy'):null;this.headerCopyTitle=this.headerCopy?.title||'Save a new copy; your original is unchanged.';this.queryId=`pdf-query-${crypto.randomUUID()}`;this.root.dataset.pdfReaderRoot=this.queryId;
    this.root.innerHTML=`<div class="pdf-toolbar" role="toolbar" aria-label="PDF reading controls">
      <div class="reader-main-controls"><button class="secondary compact" data-action="previous" aria-label="Previous page" title="Previous page; unavailable on the first page">‹</button><label class="page-control">Page <input aria-label="Page number" type="number" min="1" value="1"><span class="page-total">/ —</span></label><button class="secondary compact" data-action="next" aria-label="Next page" title="Next page; unavailable on the last page">›</button><span class="toolbar-separator"></span>
      <button class="secondary compact" data-action="zoom-out" aria-label="Zoom out" title="Zoom out">−</button><output class="zoom-value">100%</output><button class="secondary compact" data-action="zoom-in" aria-label="Zoom in" title="Zoom in">+</button><button class="text-button" data-action="fit" aria-pressed="true">Fit width</button><button class="text-button" data-action="fit-page" aria-pressed="false">Fit page</button>
      <details class="reader-view-options"><summary class="secondary compact">Tools &amp; view</summary><div class="view-options-panel"><button class="secondary compact" data-action="read-aloud">Read aloud</button><button class="secondary compact" data-action="text-statistics">Word count</button><button class="secondary compact" data-action="spell-check">Review spelling</button><label>View<select class="reading-view" aria-label="Reading view"><option value="page">Page view</option>${this.file.id?'<option value="continuous">Continuous scroll</option><option value="facing">Facing pages</option>':''}<option value="text">Readable text</option></select></label><label>Selection<select class="selection-mode" aria-label="Selection mode"><option value="text">Text selection</option><option value="area">Rectangle selection</option></select></label>${this.onExportImages?'<button class="secondary compact" data-action="export-images">Export pages as images</button>':''}${this.onEditContent?'<button class="secondary compact" data-action="edit-content">Add text and images</button>':''}${this.onRedact?'<button class="secondary compact" data-action="redact">Redact private information</button>':''}${this.onCompress?'<button class="secondary compact" data-action="compress">Compress PDF</button>':''}${this.onSheetSet?'<button class="secondary compact" data-action="sheet-set">Drawing sheet sets</button>':''}${this.onCompare?'<button class="secondary compact" data-action="compare">Compare with another PDF</button>':''}${this.onBlankPages?'<button class="secondary compact" data-action="blank-pages">Review possible blank pages</button>':''}${this.onCreateForms?'<button class="secondary compact" data-action="create-forms">Create fillable fields</button>':''}${this.onForms?'<button class="secondary compact" data-action="forms">Fill and sign</button>':''}${this.onMarkup?'<button class="secondary compact" data-action="markup">Mark up PDF</button>':''}<button class="secondary compact" data-action="notes">Notes on this page</button><button class="secondary compact" data-action="links">Review page links</button><button class="secondary compact" data-action="details">File details</button><button class="secondary compact" data-action="health-check">Document health report</button>${this.file.id?'<button class="secondary compact" data-action="sheet-label">Go to sheet label</button><button class="secondary compact" data-action="review-comments">Review drawing comments</button><button class="secondary compact" data-action="edit-outline">Edit document outline</button><button class="secondary compact" data-action="decorate">Page numbers, Bates and stamps</button><button class="secondary compact" data-action="sanitize">Clean PDF data</button><button class="secondary compact" data-action="attachments">Review embedded files</button><button class="secondary compact" data-action="portfolio">PDF portfolio</button><button class="secondary compact" data-action="tags">Accessibility tag tree</button><button class="secondary compact" data-action="repair">Repair PDF to a copy</button><button class="secondary compact" data-action="native-combine">Combine PDF originals</button><button class="secondary compact" data-action="document-workflow">Editable PDF workflow</button><button class="secondary compact" data-action="fdf-export">Export FDF comments</button><button class="secondary compact" data-action="fdf-import">Import FDF comments</button><button class="secondary compact" data-action="preflight">Print preflight</button><button class="secondary compact" data-action="page-boxes">Edit PDF page boxes</button><button class="secondary compact" data-action="print-marks">Print-production marks</button><button class="secondary compact" data-action="thin-lines">Inspect and repair thin lines</button><button class="secondary compact" data-action="smart-name">Name and save unchanged copy</button><button class="secondary compact" data-action="signature-request">Prepare signing request</button><button class="secondary compact" data-action="accessibility-audit">Accessibility audit</button><button class="secondary compact" data-action="geospatial">Map coordinates and distances</button><button class="secondary compact" data-action="certificate-sign">Sign with a Windows certificate</button>':''}${this.file.id?'<button class="secondary compact" data-action="table-extraction">Extract a table</button><button class="secondary compact" data-action="annotation-summary">Export annotation summary</button>':''}<label><input class="show-annotations" type="checkbox" checked> Show annotations</label><label><input class="print-annotations" type="checkbox" checked> Include annotations in print</label><button class="secondary compact" data-action="rotate-view" title="Rotate only the view; the saved PDF stays unchanged">Rotate view</button><span class="reader-pane-controls"><button class="secondary compact" data-action="thumbnails" aria-pressed="true">Pages panel</button><button class="secondary compact" data-action="inspector" aria-pressed="false">Search panel</button></span></div></details></div>
      <div class="reader-tools"><button class="text-button" data-action="find">Find in PDF</button><button class="text-button" data-action="copy">Copy page text</button>${this.onOrganize?'<button class="text-button" data-action="pages">Organize pages</button>':''}<button class="text-button" data-action="bookmark">Save page</button><button class="secondary compact print-button" data-action="print">Print</button></div>
    </div>
    <div class="pdf-message" role="status" aria-live="polite">Opening your PDF locally…</div>
    <div class="pdf-body"><aside class="pdf-navigation" aria-label="PDF navigation"><div class="navigation-tabs" role="tablist" aria-label="Page navigation"><button role="tab" data-navigation="pages" aria-selected="true" aria-controls="${this.queryId}-pages" id="${this.queryId}-pages-tab" aria-label="Pages" title="Page thumbnails">${this.icon("grid")}<span>Pages</span></button><button role="tab" data-navigation="outline" aria-selected="false" aria-controls="${this.queryId}-outline" id="${this.queryId}-outline-tab" aria-label="Outline" title="Document outline">${this.icon("files")}<span>Outline</span></button><button role="tab" data-navigation="saved" aria-selected="false" aria-controls="${this.queryId}-saved" id="${this.queryId}-saved-tab" aria-label="Saved" title="Saved page bookmarks">${this.icon("star")}<span>Saved</span></button></div><div class="thumbnails" aria-label="Page thumbnails" role="tabpanel" data-navigation-panel="pages" id="${this.queryId}-pages" aria-labelledby="${this.queryId}-pages-tab"></div><div class="navigation-panel outline-list" data-navigation-panel="outline" role="tabpanel" id="${this.queryId}-outline" aria-labelledby="${this.queryId}-outline-tab" hidden></div><div class="navigation-panel saved-pages" data-navigation-panel="saved" role="tabpanel" id="${this.queryId}-saved" aria-labelledby="${this.queryId}-saved-tab" hidden><label>Bookmark name <input class="bookmark-name" aria-label="Bookmark name" maxlength="80"></label><button class="secondary compact" data-save-bookmark>Save current page</button><p class="bookmark-status" role="status" aria-live="polite"></p><div class="bookmark-list"></div></div></aside><div class="page-stage" tabindex="0" aria-label="PDF page view"><div class="pdf-paper"><canvas aria-label="Rendered PDF page"></canvas><div class="textLayer"></div><div class="region-layer" hidden><div class="region-box" hidden></div></div></div><article class="readable-page" hidden></article></div>
    <aside class="reader-inspector"><div class="inspector-title">${this.icon('search')}<h2>Find in this file</h2></div><form class="pdf-search"><label for="${this.queryId}">Search selectable text</label><div><input id="${this.queryId}" class="pdf-query" type="search" placeholder="A word or phrase" maxlength="200"><button class="primary compact" type="submit" aria-label="Search PDF">Find</button></div></form><p class="search-status">Results include page references.</p><div class="search-results"></div>
    </aside><aside class="pdf-notes" aria-label="Page annotations" hidden><div class="notes-heading"><b>Notes on this page</b><button class="icon-button" data-action="close-notes" aria-label="Close page notes" title="Close page notes">×</button></div><div class="page-notes-list"></div></aside><div class="selection-panel" hidden><button class="icon-button selection-close" data-action="clear-area" aria-label="Clear area selection" title="Clear area selection">×</button><label>Selected area text<textarea readonly aria-label="Selected area text"></textarea></label><button class="secondary compact" data-action="copy-area">Copy selected area</button></div></div>
    <div class="pdf-bottom"><span class="page-status">Loading…</span></div>`;
    if(this.sourceCapabilities.rangeLoading){const label=document.createElement('label'),toggle=document.createElement('input');toggle.type='checkbox';toggle.className='low-memory-reading';toggle.checked=this.lowMemoryReading;label.append(toggle,document.createTextNode(' Low-memory reading'));this.root.querySelector('.view-options-panel').prepend(label);toggle.addEventListener('change',()=>this.setLowMemoryReading(toggle.checked));}
    this.canvas=this.root.querySelector('canvas');this.layer=this.root.querySelector('.textLayer');this.paper=this.root.querySelector('.pdf-paper');this.stage=this.root.querySelector('.page-stage');this.message=this.root.querySelector('.pdf-message');this.pageInput=this.root.querySelector('.page-control input');this.results=this.root.querySelector('.search-results');
    this.root.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>this.action(b.dataset.action).catch(e=>this.announce(e.message,true))));
    this.readable=this.root.querySelector('.readable-page');this.region=this.root.querySelector('.region-layer');this.regionBox=this.root.querySelector('.region-box');
    this.readableView=new PdfReadableView(this);this.textTools=new PdfTextTools(this);
    this.setPane('thumbnails',!this.keyboardWithinRoot&&layoutPreference('thumbnails',false));this.setPane('inspector',!this.keyboardWithinRoot&&layoutPreference('inspector',false));
    this.navigation=new ReaderNavigation(this);this.sheetLabels=new SheetLabelNavigation(this);if(!this.file.id){this.root.querySelector('[data-navigation=saved]').hidden=true;this.root.querySelector('[data-action=bookmark]').hidden=true;}
    this.root.querySelector('.show-annotations').onchange=e=>{this.annotationsVisible=e.target.checked;this.options.open=false;this.renderPage().catch(error=>this.announce(error.message,true));};this.root.querySelector('.print-annotations').onchange=e=>{this.printAnnotations=e.target.checked;};
    this.options=this.root.querySelector('.reader-view-options');this.outsideOptions=event=>{if(!this.options.contains(event.target))this.options.open=false;};document.addEventListener('pointerdown',this.outsideOptions);
    this.root.querySelector('.reading-view').addEventListener('change',event=>{this.changeReadingView(event.target.value).catch(error=>{this.announce(error.message,true);this.singlePageView().catch(()=>{});});});
    this.root.querySelector('.selection-mode').addEventListener('change',event=>{(async()=>{if(event.target.value==='area')await this.singlePageView();this.region.hidden=event.target.value!=='area';this.areaSelection?.clear();this.options.open=false;})().catch(error=>this.announce(error.message,true));});
    this.areaSelection=new PdfAreaSelection(this).init();
    this.pageInput.addEventListener('change',()=>this.go(Number(this.pageInput.value)).catch(e=>this.announce(e.message,true)));
    this.root.querySelector('.pdf-search').addEventListener('submit',event=>{event.preventDefault();this.search(this.root.querySelector('.pdf-query').value).catch(e=>this.announce(e.message,true));});
    this.find=new PdfSearch(this);
    this.keyHandler=createPdfReaderKeyHandler(this,{unavailableMessage:PAGED_PDF_UNAVAILABLE});document.addEventListener('keydown',this.keyHandler);
    this.lastStageWidth=this.stage.clientWidth;this.lastStageHeight=this.stage.clientHeight;this.resize=new ResizeObserver(()=>{const width=this.stage.clientWidth,height=this.stage.clientHeight,widthChanged=width!==this.lastStageWidth,heightChanged=height!==this.lastStageHeight;this.lastStageWidth=width;this.lastStageHeight=height;if(!widthChanged&&(!this.fitPage||!heightChanged))return;if(this.doc&&this.fit)this.paper.dataset.ready='false';clearTimeout(this.resizeTimer);this.resizeTimer=setTimeout(()=>{if(this.doc&&this.fit&&!this.disposed)this.renderPage().catch(e=>this.announce(e.message,true));},180);});this.resize.observe(this.stage);
    this.root.querySelectorAll('.pdf-toolbar button,.reader-job-tools button:not([data-reader-shell-disabled])').forEach(b=>b.disabled=true);
    this.multiPage=new PdfMultiPageView(this);this.markupNavigation=new PdfMarkupNavigation(this);if(this.file.id)this.reviewPanel=new PDFReviewPanel(this,{announce:this.announce,onNavigate:(row,options)=>this.markupNavigation.locate(row,options),onReturnView:()=>this.markupNavigation.restore()}).mount();
    this.measurements=new DrawingMeasurements(this);const measurementToggle=this.measurements.toggle.bind(this.measurements);this.measurements.toggle=(value=!this.measurements.active)=>{if(!value)return measurementToggle(false);return this.singlePageView().then(()=>measurementToggle(true)).catch(error=>this.announce(error.message,true));};
    this.layers=new PdfLayers(this);
    this.fileDetails=new PdfFileDetails(this);
    this.linkReview=new PdfLinkReview(this,{reviewExternal:request=>window.pdfix.reviewPdfLink(request),cancelExternal:request=>window.pdfix.cancelPdfLink(request)});
    // Keep page navigation and zoom on one compact row; all secondary tools remain accessible.
    const toolMenu=this.root.querySelector('.view-options-panel');toolMenu.append(this.root.querySelector('[data-action=fit-page]'));
    for(const button of [...this.root.querySelector('.reader-tools').children])if(!['find','print'].includes(button.dataset.action))toolMenu.append(button);
    if(this.compactPreviewToolbar){this.root.classList.add('pdf-preview-controls');for(const action of ['fit','find'])toolMenu.append(this.root.querySelector('[data-action='+action+']'));const close=this.element('button','×','icon-button');close.type='button';close.setAttribute('aria-label','Close preview search');close.title='Close preview search (Escape)';close.onclick=()=>{this.setPane('inspector',false);this.stage.focus();};this.root.querySelector('.inspector-title').append(close);}
    this.artworkFullscreen=new PdfArtworkFullscreen(this);this.canvasNavigation=new PdfCanvasNavigation(this);this.viewNavigation=new PdfViewNavigation(this);if(this.file.id&&!this.keyboardWithinRoot){installReaderToolstrip(this,toolMenu);installReaderTextTool(this);this.panelPolicy=installReaderPanelPolicy(this);}else installPreviewOptions(this,toolMenu);
    this.setDocumentAvailable(false);
  }
  setDocumentAvailable(available){
    this.root.dataset.documentAvailable=String(available);if(this.headerCopy){this.headerCopy.disabled=!available;this.headerCopy.title=available?this.headerCopyTitle:'Open a readable PDF before saving a copy.';}const print=this.root.querySelector('[data-action=print]');if(print){print.disabled=!available||!this.printAllowed;print.title=!available?'Open a readable PDF before printing.':!this.printAllowed?'This PDF does not allow printing.':'Print this PDF';}
  }
  async open(){
    if(this.disposed||this.disposing)return;
    const assets=new URL('pdf-assets/',document.baseURI).href;
    const sourceVersion=++this.sourceVersion;this.sourceError=null;
    const current=()=>!this.disposed&&!this.disposing&&!this.sourceError&&sourceVersion===this.sourceVersion;
    let openingTask;
    try{
      if(!this.file.pagedSource&&this.file.rangeSource&&window.pdfix?.readingCapacity){
        const capacity=await window.pdfix.readingCapacity();if(!current())return;
        if(Number.isFinite(capacity?.availableMiB)&&capacity.availableMiB*1024*1024<3*this.file.size+(768+140)*1024*1024){this.file.pagedSource=true;this.lowMemoryReading=true;this.pagePixelLimit=4_000_000;this.sourceCapabilities={rangeLoading:false,pagedReading:true,wholeFileTools:false};}
      }
      if(this.file.pagedSource){
        const pagedDoc=await this.preparePagedDocument(assets,sourceVersion);
        if(!current()){await pagedDoc.destroy();return;}
        this.doc=pagedDoc;this.task=openingTask={destroy:()=>pagedDoc.destroy()};
        this.sourceCapabilities={rangeLoading:false,pagedReading:true,wholeFileTools:false};
      }else{
      this.pdfSource=createPdfSource(this.file,{readRange:window.pdfix?.readPdfRange?.bind(window.pdfix),onError:error=>{if(!this.disposed&&sourceVersion===this.sourceVersion)this.rangeFailed(error);}});
      this.task=openingTask=pdfjs.getDocument({...this.pdfSource.documentOptions,password:this.initialPassword,cMapUrl:assets+'cmaps/',cMapPacked:true,standardFontDataUrl:assets+'standard_fonts/',wasmUrl:assets+'wasm/',iccUrl:assets+'iccs/',isEvalSupported:false,enableXfa:false,...readerImageOptions()});this.initialPassword=undefined;
      openingTask.onPassword=(update,reason)=>{if(current())this.password(update,reason);};
      const doc=await openingTask.promise;if(!current()){await openingTask.destroy();return;}this.doc=doc;
      if(this.doc.numPages>MAX_PAGES){
        this.pdfSource?.abort();this.doc=null;await openingTask.destroy();this.pdfSource=null;this.file.pagedSource=true;this.lowMemoryReading=true;this.pagePixelLimit=4_000_000;
        if(!current())return;
        const pagedDoc=await this.preparePagedDocument(assets,sourceVersion);if(!current()){await pagedDoc.destroy();return;}
        this.doc=pagedDoc;this.task=openingTask={destroy:()=>pagedDoc.destroy()};this.sourceCapabilities={rangeLoading:false,pagedReading:true,wholeFileTools:false};
      }
      }
      if(!current()){await openingTask?.destroy();return;}
      if(this.sourceCapabilities.rangeLoading){
        const doc=this.doc,getPage=doc.getPage.bind(doc);
        doc.getData=async()=>{throw new Error(LARGE_PDF_TOOL_MESSAGE);};
        doc.getPage=async(...args)=>{const page=await getPage(...args);if(!this.disposed&&this.doc===doc){this.recentPages.delete(page.pageNumber);this.recentPages.set(page.pageNumber,page);this.releasePageResources();}return page;};
      }
      if(!this.file.pagedSource&&this.doc.numPages>MAX_PAGES)throw new Error(`This PDF has ${this.doc.numPages} pages. This build supports up to ${MAX_PAGES}; split it with a trusted tool before opening.`);
      const permissions=await this.doc.getPermissions();
      if(!current())return;
      this.copyAllowed=!permissions||permissions.has(pdfjs.PermissionFlag.COPY);
      this.printAllowed=!permissions||permissions.has(pdfjs.PermissionFlag.PRINT)||permissions.has(pdfjs.PermissionFlag.PRINT_HIGH_QUALITY);
      this.root.querySelector('.page-total').textContent=`/ ${this.doc.numPages}`;this.pageInput.max=this.doc.numPages;
      this.root.querySelectorAll('.pdf-toolbar button,.reader-job-tools button:not([data-reader-shell-disabled])').forEach(b=>b.disabled=false);this.viewNavigation?.sync();
      for(const action of ['read-aloud','text-statistics','spell-check'])this.root.querySelector(`[data-action="${action}"]`).disabled=!this.copyAllowed;
      this.root.querySelector('[data-action="copy"]').disabled=!this.copyAllowed;if(this.onExportImages)this.root.querySelector('[data-action=export-images]').disabled=!this.copyAllowed||!this.printAllowed;this.root.querySelector('[data-action=notes]').disabled=!this.copyAllowed;if(this.file.id)this.root.querySelector('[data-action=table-extraction]').disabled=!this.copyAllowed;if(this.reviewPanel){this.root.querySelector('[data-action=review-comments]').disabled=!this.copyAllowed;this.reviewPanel.button.disabled=!this.copyAllowed;this.reviewPanel.controls();}
      this.setDocumentAvailable(true);
      this.root.querySelector('.pdf-query').disabled=!this.copyAllowed;
      this.root.querySelector('.pdf-search button').disabled=!this.copyAllowed;
      this.root.querySelector('.selection-mode').disabled=!this.copyAllowed;this.root.querySelector('.reading-view').disabled=!this.copyAllowed;
      if(!this.sourceCapabilities.wholeFileTools)for(const action of WHOLE_SOURCE_ACTIONS){const button=this.root.querySelector(`[data-action="${action}"]`);if(button){button.disabled=true;button.title=LARGE_PDF_TOOL_MESSAGE;}}
      if(this.file.pagedSource)this.configurePagedReading();
      if(!this.copyAllowed)this.root.querySelector('.search-status').textContent='This PDF restricts text copying. Text search and selection are disabled.';
      const restoreIntent=this.navigationIntent;try{
        this.root.dataset.sourceMode=this.doc.mode==='paged'?'paged':'full';
        this.root.dataset.continuousPageLimit=String(this.multiPage.pageLimit);
        if(this.file.pagedSource&&this.doc.numPages<=this.multiPage.pageLimit){this.readingView='continuous';this.root.querySelector('.reading-view').value='continuous';await this.multiPage.setMode('continuous');}
        else await this.renderPage();
      }catch(error){if(!this.file.pagedSource)throw error;this.announce(renderDetail(error),true);}if(!current()||!this.doc)return;this.contentRecoveryCheck=showContentRecoveryNotice(this).catch(error=>{if(!this.disposed)this.announce('Saved additions could not be checked. '+error.message,true);});this.createThumbnails();this.navigationLoading=this.navigation.load({restoreIntent}).catch(error=>{if(current())this.announce('Page navigation metadata is unavailable. '+error.message,true);});
    }catch(e){
      if(!current()){await openingTask?.destroy().catch(()=>{});return;}
      if(this.sourceError){await this.task?.destroy().catch(()=>{});return;}
      this.doc=null;this.setDocumentAvailable(false);
      this.message.hidden=false;this.message.classList.add('warning');
      this.message.textContent=e.name==='PasswordException'?'Opening canceled. Reopen the PDF and enter its password.':e.name==='InvalidPDFException'?'This PDF could not be read. It may be damaged or have the wrong file ending. Try getting a new copy.':renderDetail(e);
      this.root.querySelector('.page-status').textContent='PDF unavailable';this.setDocumentAvailable(false);
      this.clearPageDisplay('PDF unavailable');this.canvas.width=this.canvas.height=0;
      this.pdfSource?.abort();await this.task?.destroy().catch(()=>{});this.doc=null;
      if(e.name!=='PasswordException')this.announce(this.message.textContent,true);
    }
  }
  rangeFailed(error){
    if(this.disposed||this.sourceError)return;this.sourceError=error;this.pdfSource?.abort();
    this.setDocumentAvailable(false);this.version++;this.renderTask?.cancel();this.thumbTask?.cancel();this.thumbObserver?.disconnect();this.doc=null;
    this.textLayer?.cancel();this.clearPageDisplay('PDF unavailable');this.canvas.width=this.canvas.height=0;
    this.root.querySelectorAll('.pdf-toolbar button,.reader-job-tools button:not([data-reader-shell-disabled])').forEach(button=>button.disabled=true);
    this.message.hidden=false;this.message.classList.add('warning');this.message.textContent=error.message;this.root.querySelector('.page-status').textContent='PDF unavailable';
    this.announce(error.message,true);void this.task?.destroy().catch(()=>{});
  }
  releasePageResources(){
    if(this.file.pagedSource){if(!this.disposed&&!this.activePageRenders&&!this.multiPage?.active)void this.doc?.releaseUnused(this.pageNumber).catch(()=>{});return;}
    if(!this.sourceCapabilities.rangeLoading||this.disposed||this.activePageRenders||this.activeThumbnailRenders||this.multiPage?.active||this.printRoot||(this.printWorkspace&&!this.printWorkspace.closed))return;
    const keep=new Set([this.pageNumber-1,this.pageNumber,this.pageNumber+1]);
    for(const number of [...this.recentPages.keys()].reverse()){if(keep.size>=8)break;keep.add(number);}
    // PDF.js keeps its own page proxies and worker byte buffer. cleanup releases
    // display resources; it does not promise a constant total memory footprint.
    for(const [number,page]of this.recentPages){if(!keep.has(number)&&page.cleanup())this.recentPages.delete(number);}
  }
  password(update,reason){
    this.passwordDialog?.remove();
    const dialog=this.element('dialog',undefined,'password-dialog');const heading=this.element('h2','This PDF needs a password');const hint=this.element('p',reason===pdfjs.PasswordResponses.INCORRECT_PASSWORD?'That password did not unlock the file. Try again.':'Use the password supplied by the document owner. It is kept only for this reading session.');const form=this.element('form');const label=this.element('label','PDF password');const input=this.element('input');input.type='password';input.autocomplete='off';input.setAttribute('aria-label','PDF password');label.append(input);const buttons=this.element('div',undefined,'dialog-actions');const cancel=this.element('button','Cancel','secondary');cancel.type='button';const unlock=this.element('button','Unlock','primary');unlock.type='submit';buttons.append(cancel,unlock);form.append(label,buttons);dialog.append(heading,hint,form);document.body.append(dialog);this.passwordDialog=dialog;
    let submitted=false;
    form.addEventListener('submit',event=>{event.preventDefault();if(!input.value)return;submitted=true;const value=input.value;input.value='';dialog.close();dialog.remove();this.passwordDialog=null;update(value);});
    const abort=()=>{if(submitted)return;this.pdfSource?.abort();this.task?.destroy().catch(()=>{});this.message.textContent='Opening canceled. Reopen the PDF to enter its password.';this.message.classList.add('warning');this.root.querySelector('.page-status').textContent='PDF unavailable';dialog.remove();this.passwordDialog=null;};cancel.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',abort);dialog.showModal();input.focus();
  }
  createThumbnails(){
    if(this.file.pagedSource){this.root.querySelector('.thumbnails').textContent='Scroll through the pages, or use the page number, Previous / Next, or Saved pages. Background thumbnails are unavailable.';return;}
    const rail=this.root.querySelector('.thumbnails');this.thumbnailEvents=new AbortController();rail.addEventListener('scroll',()=>this.scheduleThumbnails(),{passive:true,signal:this.thumbnailEvents.signal});
    this.thumbObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)this.thumbnailCandidates.add(entry.target);else this.thumbnailCandidates.delete(entry.target);}this.scheduleThumbnails();},{root:rail,rootMargin:'180px'});
    const fragment=document.createDocumentFragment();for(let i=1;i<=this.doc.numPages;i++){const button=this.element('button',undefined,'thumbnail');button.setAttribute('aria-label',`Go to page ${i}`);button.dataset.page=i;button.style.height='146px';button.style.boxSizing='border-box';const canvas=this.element('canvas');canvas.width=canvas.height=0;button.append(canvas,this.element('span',String(i)));button.addEventListener('click',()=>this.go(i).catch(e=>this.announce(e.message,true)));fragment.append(button);this.thumbObserver.observe(button);}rail.append(fragment);
  }
  pageReadingBusy(label,busy){
    if(this.disposed||this.disposing)return;
    if(!this.cancelPageButton){const button=this.element('button','Cancel loading','secondary compact');button.type='button';button.hidden=true;this.root.querySelector('.pdf-bottom').append(button);this.cancelPageButton=button;
      button.onclick=async()=>{
        button.disabled=true;const number=this.pageNumber,version=++this.version,doc=this.doc;
        const current=()=>!this.disposed&&!this.disposing&&version===this.version;
        this.renderTask?.cancel();this.textLayer?.cancel();this.clearPageDisplay('Stopping page loading');this.message.hidden=false;this.message.classList.add('warning');this.message.textContent='Stopping page preparation…';this.root.querySelector('.page-status').textContent='Cancellation requested';this.layers?.renderFailed();
        try{
          if(doc?.mode==='paged')await doc.cancelCurrent();else{this.sourceVersion++;await window.pdfix.releasePagedPdf(this.file.id);}
          if(current()){this.canvas.setAttribute('aria-label','Page loading canceled');this.message.textContent='Loading canceled. Choose another page or reopen the PDF.';this.root.querySelector('.page-status').textContent=doc?`Page ${number} of ${doc.numPages} · loading canceled`:'Opening canceled';}
        }catch(error){if(current()){this.message.textContent=renderDetail(error);this.root.querySelector('.page-status').textContent='Page preparation termination unconfirmed';this.announce(this.message.textContent,true);}}
        finally{if(current())button.hidden=true;button.disabled=false;}
      };
    }
    this.cancelPageButton.hidden=!busy;if(busy)this.root.querySelector('.page-status').textContent=label;
  }
  async preparePagedDocument(assets,sourceVersion=this.sourceVersion){
    this.pagedPreparation=sourceVersion;
    this.pageReadingBusy('Preparing disk-backed PDF…',true);
    try{const doc=await openPagedPdfDocument(this.file,pdfjs,{cMapUrl:assets+'cmaps/',cMapPacked:true,standardFontDataUrl:assets+'standard_fonts/',wasmUrl:assets+'wasm/',iccUrl:assets+'iccs/',isEvalSupported:false,enableXfa:false,...readerImageOptions()});
      doc.onPageLoading=(number,busy)=>{if(sourceVersion===this.sourceVersion&&this.doc===doc&&number===this.pageNumber)this.pageReadingBusy('Preparing physical page '+number+' of '+doc.numPages+'…',busy);};return doc;
    }finally{if(this.pagedPreparation===sourceVersion)this.pagedPreparation=null;if(sourceVersion===this.sourceVersion)this.pageReadingBusy('',false);}
  }
  configurePagedReading(){
    const memoryToggle=this.root.querySelector('.low-memory-reading');if(memoryToggle)memoryToggle.checked=this.lowMemoryReading;
    this.pagedUnsupportedActions=new Set([...WHOLE_SOURCE_ACTIONS,'print','sheet-label','review-comments','annotation-summary','health-check','details','native-combine','read-aloud','text-statistics','spell-check']);
    if(this.doc.pageLabelsAvailable)this.pagedUnsupportedActions.delete('sheet-label');
    if(this.doc.nativeLinkReadingAvailable){this.pagedUnsupportedActions.delete('links');const links=this.root.querySelector('[data-action="links"]');if(links){links.disabled=false;links.title='Review bounded original-page internal destinations.';}}
    for(const action of this.pagedUnsupportedActions){const button=this.root.querySelector(`[data-action="${action}"]`);if(button){button.disabled=true;button.title=PAGED_PDF_UNAVAILABLE;}}
    this.root.querySelectorAll('.reading-view option').forEach(option=>{if(['continuous','facing'].includes(option.value)){option.disabled=this.doc.numPages>this.multiPage.pageLimit;option.title=option.disabled?'Use Page view for sets above '+this.multiPage.pageLimit.toLocaleString()+' pages.':'Scroll through nearby pages with bounded memory.';}});
    const outline=this.root.querySelector('[data-navigation="outline"]');outline.disabled=!this.doc.navigationAvailable;outline.title=this.doc.navigationAvailable?'Bounded original-file bookmarks; unsupported actions remain unavailable.':'Document outline is unavailable during on-demand reading.';
    this.navigation.outlineLoaded=!this.doc.navigationAvailable;this.navigation.labelsLoaded=!this.doc.pageLabelsAvailable;
    this.root.querySelector('.outline-list').textContent=this.doc.navigationAvailable?'Open Outline to load original-file bookmarks.':outline.title;
    this.find.configurePagedScope();
    this.setPane('inspector',false);
    this.layers.observe.disconnect();this.layers.button.disabled=true;this.layers.button.title=PAGED_PDF_UNAVAILABLE;
    this.layers.sync=()=>{};this.layers.toggle=async()=>{throw new Error(PAGED_PDF_UNAVAILABLE);};
    if(this.reviewPanel)this.reviewPanel.button.disabled=true;
    this.root.querySelector('.print-annotations').disabled=true;
  }
  setLowMemoryReading(enabled){this.lowMemoryReading=enabled;this.pagePixelLimit=enabled?4_000_000:this.normalPagePixelLimit;const keep=enabled?8:32;for(const [button,canvas]of this.thumbnailLive){if(this.thumbnailLive.size<=keep)break;canvas.width=canvas.height=0;button.dataset.rendered='false';this.thumbnailLive.delete(button);}this.renderPage().catch(error=>this.announce(error.message,true));}
  thumbnailNearby(button){const rail=this.root.querySelector('.thumbnails');if(this.disposed||!this.doc||this.root.querySelector('.pdf-navigation').hidden||rail.hidden||!button.isConnected)return false;const b=button.getBoundingClientRect(),r=rail.getBoundingClientRect();return b.bottom>=r.top-180&&b.top<=r.bottom+180;}
  scheduleThumbnails(){if(this.disposed||this.activePageRenders||this.multiPage?.updating)return;cancelAnimationFrame(this.thumbnailFrame);this.thumbnailFrame=requestAnimationFrame(()=>{this.thumbnailFrame=null;if(this.thumbButton&&!this.thumbnailNearby(this.thumbButton))this.thumbTask?.cancel();if(this.thumbnailDraining)return;this.thumbnailDraining=true;this.thumbnailQueue=this.drainThumbnails().catch(()=>{}).finally(()=>{this.thumbnailDraining=false;});});}
  async drainThumbnails(){if(this.activePageRenders||this.multiPage?.updating||this.disposed||!this.doc)return;const nearby=[...this.thumbnailCandidates].filter(button=>this.thumbnailNearby(button));nearby.sort((a,b)=>Math.abs(Number(a.dataset.page)-this.pageNumber)-Math.abs(Number(b.dataset.page)-this.pageNumber));const button=nearby.slice(0,this.lowMemoryReading?8:32).find(item=>item.dataset.rendered!=='true'&&item.dataset.failed!=='true');if(!button)return;try{await this.renderThumbnail(button);}catch(error){if(error.name!=='RenderingCancelledException'&&!this.disposed)button.dataset.failed='true';}if(!this.activePageRenders&&!this.disposed&&this.doc)setTimeout(()=>this.scheduleThumbnails(),80);}
  async renderThumbnail(button){
    if(this.activePageRenders||!this.thumbnailNearby(button))return;const doc=this.doc;this.activeThumbnailRenders++;this.thumbButton=button;
    try{const page=await doc.getPage(Number(button.dataset.page));if(doc!==this.doc||this.activePageRenders||this.multiPage?.updating||!this.thumbnailNearby(button))return;
      const base=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(85/base.width,110/base.height)}),canvas=button.querySelector('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);const task=page.render({canvasContext:readerCanvasContext(canvas),viewport});this.thumbTask=task;try{await task.promise;}finally{if(this.thumbTask===task)this.thumbTask=null;}if(doc!==this.doc||this.disposed)return;button.dataset.rendered='true';this.thumbnailLive.delete(button);this.thumbnailLive.set(button,canvas);
      for(const [old,cached]of this.thumbnailLive){if(this.thumbnailLive.size<=(this.lowMemoryReading?8:32))break;if(old===button)continue;cached.width=cached.height=0;old.dataset.rendered='false';this.thumbnailLive.delete(old);}
    }finally{if(button.dataset.rendered!=='true'){const canvas=button.querySelector('canvas');canvas.width=canvas.height=0;}if(this.thumbButton===button)this.thumbButton=null;this.activeThumbnailRenders--;this.releasePageResources();}
  }
  async changeReadingView(value){
    if(this.disposed)return;this.navigationIntent++;const history=this.viewNavigation?.begin();this.readingView=value;this.options.open=false;this.markupNavigation?.invalidate();
    if(value==='continuous'||value==='facing'){this.version++;if(this.file.pagedSource){this.find.clear();this.root.querySelector('.search-status').textContent='Find searches only the displayed page and switches to Page view.';}else this.find.clearHighlights();this.root.querySelector('.selection-mode').value='text';this.region.hidden=true;await this.multiPage.setMode(value);this.viewNavigation?.commit(history);return;}
    await this.multiPage.setMode('single');this.paper.hidden=value==='text';this.readable.hidden=value!=='text';await this.renderPage();this.viewNavigation?.commit(history);
  }
  async singlePageView(){if(!this.multiPage?.active)return;this.root.querySelector('.reading-view').value='page';await this.changeReadingView('page');}
  async go(number){if(!this.doc||this.disposed)return;this.navigationIntent++;const history=this.viewNavigation?.begin();this.pageNumber=Math.max(1,Math.min(this.doc.numPages,Math.trunc(number)||1));this.pageInput.value=this.pageNumber;await this.renderPage();this.viewNavigation?.commit(history);}
  clearPageDisplay(label,{preserveArea=false}={}){
    this.scanFailureNode?.remove();this.scanFailureNode=null;this.stage?.classList.remove('reader-scan-failed');
    this.find?.pageChanged();
    this.paper.dataset.ready='false';delete this.paper.dataset.page;delete this.paper.dataset.rotation;this.paper.style.visibility='hidden';this.canvas.setAttribute('aria-label',label);this.layer.replaceChildren();this.readable.replaceChildren();this.readableView?.resetPage();if(preserveArea)this.areaSelection?.suspend();else this.areaSelection?.clear();this.find?.clearHighlights();
  }
  async renderPage(){
    if(!this.root.isConnected||!this.doc||this.disposed||this.disposing||this.root.dataset.inlineProof==='true'||this.pagesWorkspace&&!this.pagesWorkspace.closed&&this.interactionMode==='build')return;
    const version=++this.version,number=this.pageNumber,doc=this.doc,hadRenderedPage=this.paintedDocuments?.has(doc)===true;
    const current=()=>!this.disposed&&!this.disposing&&version===this.version&&doc===this.doc;
    this.activePageRenders++;const thumbnailTask=this.thumbTask;thumbnailTask?.cancel();this.renderTask?.cancel();this.textLayer?.cancel();
    // Preserve the previous banner's geometry while replacing a rendered page.
    // Toggling it on every fit-page render changes the stage height and causes
    // ResizeObserver to request another render indefinitely. Status still loads.
    if(!this.multiPage?.active){this.clearPageDisplay(`Loading PDF page ${number}`,{preserveArea:true});this.pageTextError=null;this.pageSelectionError=null;this.index.delete(number);this.root.querySelector('[data-action="copy"]').disabled=!this.copyAllowed;this.root.querySelector('.selection-mode').disabled=!this.copyAllowed;if(!hadRenderedPage){this.message.hidden=false;this.message.classList.remove('warning');this.message.textContent=`Loading page ${number}…`;}this.root.querySelector('.page-status').textContent=`Page ${number} of ${doc.numPages} · loading`;this.root.querySelector('[data-action="previous"]').disabled=number===1;this.root.querySelector('[data-action="next"]').disabled=number===doc.numPages;}
    try{if(thumbnailTask)await thumbnailTask.promise.catch(()=>{});if(!current())return;if(this.multiPage?.active)return await this.multiPage.render(number);return await this.renderPageContent(version,number,doc,!hadRenderedPage);}
    catch(error){
      if(!current())return;
      this.layers?.renderFailed();
      if(!this.multiPage?.active){const canceled=error.name==='RenderingCancelledException';this.clearPageDisplay(canceled?'Page loading canceled':`PDF page ${number} unavailable`);this.canvas.width=this.canvas.height=0;this.root.querySelector('[data-action="copy"]').disabled=true;this.root.querySelector('.selection-mode').disabled=true;this.message.hidden=false;this.message.classList.add('warning');this.message.textContent=isImageMemoryFailure(error)?SCAN_MEMORY_MESSAGE:canceled?'Loading canceled. Choose another page or reopen the PDF.':`Page ${number} could not be displayed. ${renderDetail(error)} Choose another physical page to continue.`;this.root.querySelector('.page-status').textContent=`Page ${number} of ${doc.numPages} · ${canceled?'loading canceled':'not displayed'}`;if(isImageMemoryFailure(error)){this.scanFailureNode=this.element('p',SCAN_MEMORY_MESSAGE);this.scanFailureNode.setAttribute('role','alert');this.scanFailureNode.className='reader-scan-failure';this.stage.classList.add('reader-scan-failed');this.stage.prepend(this.scanFailureNode);return;}if(canceled)return;}
      throw error;
    }finally{this.activePageRenders--;this.releasePageResources();if(!this.activePageRenders)this.scheduleThumbnails();}
  }
  async renderPageContent(version,number,doc,showLoadingMessage=true){
    const current=()=>this.root.isConnected&&!this.disposed&&!this.disposing&&version===this.version&&doc===this.doc&&this.root.dataset.inlineProof!=='true'&&!this.multiPage?.active;
    if(!current())return;this.areaSelection?.suspend();this.markupNavigation?.invalidate();this.layers?.rendering();this.measurements?.invalidate();this.linkReview?.pageChanged();this.fileDetails?.pageChanged();clearTimeout(this.resizeTimer);
    const previous=this.renderTask;if(previous){previous.cancel();await previous.promise.catch(()=>{});}this.textLayer?.cancel();this.textLayer=null;if(!current())return;
    const page=await doc.getPage(number);if(!current())return;
    const rotation=(page.rotate+this.viewRotation)%360,base=page.getViewport({scale:1,rotation});const padding=getComputedStyle(this.stage),availableWidth=Math.max(1,this.stage.clientWidth-(parseFloat(padding.paddingLeft)||0)-(parseFloat(padding.paddingRight)||0)-1),availableHeight=Math.max(1,this.stage.clientHeight-(parseFloat(padding.paddingTop)||0)-(parseFloat(padding.paddingBottom)||0)-1);let scale=this.fit?Math.min(2,Math.max(.05,this.fitPage?Math.min(availableWidth/base.width,availableHeight/base.height):availableWidth/base.width)):this.zoom;
    if(!Number.isFinite(base.width)||!Number.isFinite(base.height)||base.width<=0||base.height<=0)throw new Error('This page has invalid dimensions.');
    scale=Math.min(scale,Math.sqrt(this.pagePixelLimit/(base.width*base.height)),MAX_CANVAS_DIMENSION/base.width,MAX_CANVAS_DIMENSION/base.height);
    this.zoom=scale;const viewport=page.getViewport({scale,rotation});
    // Reserve rounding headroom for ceil(), including long, narrow drawing sheets.
    const area=viewport.width*viewport.height,perimeter=viewport.width+viewport.height,maxRatio=2*(this.pagePixelLimit-1)/(perimeter+Math.sqrt(perimeter*perimeter+4*area*(this.pagePixelLimit-1)));
    const ratio=Math.min(window.devicePixelRatio||1,2,maxRatio,(MAX_CANVAS_DIMENSION-1)/viewport.width,(MAX_CANVAS_DIMENSION-1)/viewport.height);
    this.canvas.width=this.paper.hidden?0:Math.ceil(viewport.width*ratio);this.canvas.height=this.paper.hidden?0:Math.ceil(viewport.height*ratio);this.canvas.style.width=`${viewport.width}px`;this.canvas.style.height=`${viewport.height}px`;
    this.paper.style.width=`${viewport.width}px`;this.paper.style.height=`${viewport.height}px`;this.paper.style.setProperty('--scale-factor',scale);this.paper.style.setProperty('--total-scale-factor',viewport.scale*viewport.userUnit);this.paper.style.setProperty('--user-unit',viewport.userUnit);
    this.layer.replaceChildren();this.layer.style.width=`${viewport.width}px`;this.layer.style.height=`${viewport.height}px`;
    if(!this.paper.hidden){
      this.renderTask=page.render({canvasContext:readerCanvasContext(this.canvas),viewport,optionalContentConfigPromise:this.layers?.optionalContentConfigPromise,annotationMode:this.annotationsVisible?pdfjs.AnnotationMode.ENABLE:pdfjs.AnnotationMode.DISABLE,transform:ratio!==1?[ratio,0,0,ratio,0,0]:null});
      const task=this.renderTask;try{await task.promise;}finally{if(this.renderTask===task)this.renderTask=null;}
    }else{this.renderTask=null;this.canvas.width=this.canvas.height=0;}
    if(!current())return;
    // Show finished artwork while the optional text layer is being prepared.
    // Text-heavy drawing sheets must not leave an already rendered page hidden.
    if(!this.paper.hidden){(this.paintedDocuments??=new WeakSet()).add(doc);this.paper.style.visibility='visible';this.canvas.setAttribute('aria-label',`Rendered PDF page ${number}`);if(showLoadingMessage)this.message.textContent=`Page ${number} artwork loaded. Preparing selectable text…`;this.root.querySelector('.page-status').textContent=`Page ${number} of ${doc.numPages} · artwork loaded · preparing text`;}
    let content={items:[],styles:{}},text='',textError=null,selectionError=null;
    try{content=await page.getTextContent();if(!current())return;text=pdfSearchText(content);this.cacheText(number,text);}
    catch(error){if(!current())return;textError=renderDetail(error);content={items:[],styles:{}};this.index.delete(number);}
    if(!textError&&this.copyAllowed&&!this.paper.hidden){
      try{this.textLayer=new pdfjs.TextLayer({textContentSource:content,container:this.layer,viewport});await this.textLayer.render();}
      catch(error){if(!current())return;selectionError=renderDetail(error);this.textLayer?.cancel();this.textLayer=null;this.layer.replaceChildren();}
    }
    if(!current())return;
    this.pageTextError=textError;this.pageSelectionError=textError||selectionError;this.root.querySelector('[data-action="copy"]').disabled=!this.copyAllowed||!!textError;this.root.querySelector('.selection-mode').disabled=!this.copyAllowed||!!this.pageSelectionError;this.region.hidden=!!this.pageSelectionError||this.root.querySelector('.selection-mode').value!=='area';
    this.readableView.render(content,page,number);
    if(textError&&!this.readable.hidden)this.readable.append(this.element('p',`Readable text is unavailable for this page. ${textError} Use Return to page artwork to view the drawing.`));
    this.areaSelection?.restore();
    if(document.activeElement!==this.pageInput)this.pageInput.value=number;this.root.querySelector('.zoom-value').textContent=`${Math.round(scale*100)}%`;this.root.querySelector('.page-status').textContent=`Page ${number} of ${this.doc.numPages}${this.navigation.labels?.[number-1]&&this.navigation.labels[number-1]!==String(number)?` · Label ${this.navigation.labels[number-1]}`:""}${this.viewRotation?` · View rotated ${this.viewRotation}°`:""}`;
    this.root.querySelector('[data-action="previous"]').disabled=number===1;this.root.querySelector('[data-action="next"]').disabled=number===this.doc.numPages;
    if(this.sourceCapabilities.rangeLoading||this.file.pagedSource)this.root.querySelector('.page-status').textContent+=' · Large PDF · On-demand reading';
    this.root.querySelectorAll('.thumbnail').forEach(b=>{const selected=Number(b.dataset.page)===number;b.classList.toggle('current',selected);b.setAttribute('aria-current',selected?'page':'false');});
    const selected=this.root.querySelector(`.thumbnail[data-page="${number}"]`);selected?.scrollIntoView({block:'nearest'});
    this.message.hidden=!!text&&!textError&&!selectionError;this.message.classList.toggle('warning',!text||!!textError||!!selectionError);this.message.textContent=textError?`${this.paper.hidden?'Selectable text is unavailable. Return to page artwork to try viewing this page.':'Page artwork is available, but selectable text is unavailable.'} ${textError}`:selectionError?`Page artwork is available, but text selection on the page is unavailable. ${selectionError} Copy page text and readable text remain available.`:`No selectable text was found on this page. It may be a scan or a blank page.${this.file.pagedSource?' Text recognition is unavailable during on-demand page reading.':' Choose Make scan searchable to recognize English text locally.'}`;
    if(textError||selectionError)this.root.querySelector('.page-status').textContent+=' · text selection unavailable';
    if(!this.root.querySelector('.pdf-notes').hidden)this.showNotes().catch(error=>this.announce(error.message,true));
    this.paper.style.visibility='visible';this.canvas.setAttribute('aria-label',`Rendered PDF page ${number}`);this.paper.dataset.page=number;this.paper.dataset.rotation=String(this.viewRotation);this.paper.dataset.ready='true';this.measurements?.rendered({page,viewport});this.layers?.rendered();this.find.rendered(content);this.markupNavigation?.rendered({page,viewport});this.reviewPanel?.rendered();this.navigation.rememberPage();this.viewNavigation?.rendered({page,viewport});this.currentPage=page;this.currentViewport=viewport;if(this.onRendered)this.onRendered({page,viewport});
  }
  setPane(name,visible,{persist=!this.keyboardWithinRoot}={}){
    const panel=this.root.querySelector(name==='thumbnails'?'.pdf-navigation':'.reader-inspector'),button=this.root.querySelector(`[data-action="${name}"]`);
    panel.hidden=!visible;button.setAttribute('aria-pressed',String(visible));button.title=`${visible?'Hide':'Show'} ${name==='thumbnails'?'page thumbnails':'search and selection panel'}`;
    if(persist)saveLayoutPreference(name,visible);if(name==='thumbnails')this.scheduleThumbnails();
  }
  async action(action,options={}){
    if(this.file.pagedSource&&this.pagedUnsupportedActions?.has(action))throw new Error(PAGED_PDF_UNAVAILABLE);
    this.navigationIntent++;
    if(['read-aloud','text-statistics','spell-check'].includes(action)){this.options.open=false;return this.textTools.open(action==='read-aloud'?'speech':action==='spell-check'?'spelling':'statistics');}
    if(action==='thumbnails'||action==='inspector'){this.setPane(action,this.root.querySelector(`[data-action="${action}"]`).getAttribute('aria-pressed')!=='true');return;}
    if(!this.sourceCapabilities.wholeFileTools&&WHOLE_SOURCE_ACTIONS.has(action)&&!(action==='links'&&this.doc.nativeLinkReadingAvailable))throw new Error(LARGE_PDF_TOOL_MESSAGE);
    if(action==='repair'){
      this.options.open=false;
      if(!this.file.id||this.file.ext!=='pdf')throw new Error('Open a native PDF before inspecting repair options.');
      if(this.repairWorkspace&&!this.repairWorkspace.closed)return;
      if(document.querySelector('dialog[open]'))throw new Error('Finish the current workspace before inspecting repair.');
      const workspace=new PdfRepairWorkspace(this,{announce:this.announce,onClosed:()=>{if(this.repairWorkspace===workspace)this.repairWorkspace=null;}});this.repairWorkspace=workspace;
      try{return await workspace.open();}catch(error){await workspace.close().catch(()=>{});if(this.repairWorkspace===workspace)this.repairWorkspace=null;throw error;}
    }
    if(['signature-request','page-boxes','print-marks','thin-lines','smart-name'].includes(action)){
      this.options.open=false;if(!this.file.id)throw new Error('Open a native source PDF for this tool.');
      if(action!=='smart-name'&&!this.sourceCapabilities.wholeFileTools)throw new Error('This writer currently requires a complete PDF within the native 100 MiB budget.');
      const field={ 'signature-request':'signatureRequestWorkspace','page-boxes':'pageBoxWorkspace','print-marks':'printMarksWorkspace','thin-lines':'thinLineWorkspace','smart-name':'smartNameWorkspace'}[action];if(this[field]&&!this[field].closed)return;if(document.querySelector('dialog[open]'))throw new Error('Finish the current workspace before opening this tool.');
      let workspace;const ui={element:this.element,icon:this.icon,announce:this.announce,setGuard:this.setGuard,owner:this,onClosed:()=>{if(this[field]===workspace)this[field]=null;}};
      workspace=action==='signature-request'?new SignatureRequestWorkspace(this,ui):action==='page-boxes'?new PdfPageBoxWorkspace(this.file,ui):action==='print-marks'?new PdfPrintMarksWorkspace(this,ui):action==='thin-lines'?new PdfThinLineWorkspace(this,ui):new SmartFileNameWorkspace(this,ui);this[field]=workspace;
      try{return await workspace.open();}catch(error){await workspace.close().catch(()=>{});if(this[field]===workspace)this[field]=null;throw error;}
    }
    if(!this.doc)return;
    if(action==='fdf-export'||action==='fdf-import'){
      this.options.open=false;if(!this.file.id)throw new Error('Open a native PDF before exchanging FDF comments.');
      const field=action==='fdf-export'?'fdfExportWorkspace':'fdfImportWorkspace';
      if(this[field]&&!this[field].closed)return;
      if(document.querySelector('dialog[open]'))throw new Error('Finish the current workspace before exchanging FDF comments.');
      const Workspace=action==='fdf-export'?PdfFdfWorkspace:PdfFdfImportWorkspace;
      const workspace=new Workspace(this,{announce:this.announce,onClosed:()=>{if(this[field]===workspace)this[field]=null;}});this[field]=workspace;
      try{return await workspace.open();}catch(error){await workspace.close().catch(()=>{});if(this[field]===workspace)this[field]=null;throw error;}
    }
    if(action==='native-combine'){this.options.open=false;if(this.combineWorkspace&&!this.combineWorkspace.closed)return;if(document.querySelector('dialog[open]'))throw new Error('Finish the current workspace before combining PDFs.');const workspace=new PdfCombineWorkspace(this,{announce:this.announce,onClosed:()=>{if(this.combineWorkspace===workspace)this.combineWorkspace=null;}});this.combineWorkspace=workspace;try{return await workspace.open();}catch(error){await workspace.close().catch(()=>{});if(this.combineWorkspace===workspace)this.combineWorkspace=null;throw error;}}
    if(action==='document-workflow'){
      this.options.open=false;if(!this.file.id)throw new Error('Open a native PDF before running a workflow.');
      if(this.documentWorkflowWorkspace&&!this.documentWorkflowWorkspace.closed)return;
      if(document.querySelector('dialog[open]'))throw new Error('Finish the current workspace before running a workflow.');
      const workspace=new DocumentWorkflowWorkspace(this,{announce:this.announce,onClosed:()=>{if(this.documentWorkflowWorkspace===workspace)this.documentWorkflowWorkspace=null;}});this.documentWorkflowWorkspace=workspace;
      try{return await workspace.open();}catch(error){await workspace.close().catch(()=>{});if(this.documentWorkflowWorkspace===workspace)this.documentWorkflowWorkspace=null;throw error;}
    }
    if(action==='preflight'||action==='accessibility-audit'){
      this.options.open=false;
      if(!this.file.id)throw new Error('Open a source PDF before inspecting it.');
      const field=action==='preflight'?'preflightWorkspace':'accessibilityAuditWorkspace';
      if(this[field]&&!this[field].closed)return;
      if(document.querySelector('dialog[open]'))throw new Error('Finish the current workspace before this inspection.');
      const ui={announce:this.announce,onClosed:()=>{if(this[field]===workspace)this[field]=null;},openTags:async nodeId=>{await this.action('tags');if(nodeId&&this.tagsWorkspace?.inventory?.nodes?.some(node=>node.id===nodeId))this.tagsWorkspace.select(nodeId);}};
      const workspace=action==='preflight'?new PdfPreflightWorkspace(this,ui):new PdfAccessibilityAuditWorkspace(this,ui);this[field]=workspace;
      try{return await workspace.open();}catch(error){await workspace.close().catch(()=>{});if(this[field]===workspace)this[field]=null;throw error;}
    }
    if(action==='certificate-sign'){

      this.options.open=false;
      if(!this.file.id)throw new Error('Open the source PDF before signing a new copy.');
      if(this.certificateSigningDialog?.isConnected)return;
      if(document.querySelector('dialog[open]'))throw new Error('Finish the current workspace before certificate signing.');
      this.certificateSigningDialog=showPdfCertificateSigning(this.file,{announce:this.announce});return;
    }
    if(action==='geospatial'){
      this.options.open=false;
      if(!this.file.id)throw new Error('Open a source PDF before inspecting geospatial registration.');
      if(this.geospatialWorkspace&&!this.geospatialWorkspace.closed)return;
      if(document.querySelector('dialog[open]'))throw new Error('Finish the current workspace before geospatial inspection.');
      const workspace=new PdfGeospatialWorkspace(this,{announce:this.announce,onClosed:()=>{if(this.geospatialWorkspace===workspace)this.geospatialWorkspace=null;}});this.geospatialWorkspace=workspace;
      try{return await workspace.open();}catch(error){await workspace.close().catch(()=>{});if(this.geospatialWorkspace===workspace)this.geospatialWorkspace=null;throw error;}
    }
    if(action==='pdf-fullscreen')return this.artworkFullscreen.enter();
    if(action==='previous-view'||action==='next-view')return this.viewNavigation.move(action==='previous-view'?-1:1);
    if(action==='zoom-region')return this.viewNavigation.startRegion();
    if(action==='details'){this.options.open=false;return this.fileDetails.open();}
    if(action==='health-check'){this.options.open=false;if(document.querySelector('dialog[open]'))throw new Error('Close the current dialog before inspecting document health.');return this.fileDetails.open({health:true});}
    if(action==='links'){this.options.open=false;return this.linkReview.show();}
    if(action==='attachments'){this.options.open=false;if(this.attachmentsWorkspace&&!this.attachmentsWorkspace.closed)return;this.attachmentsWorkspace=new PdfAttachments(this,{announce:this.announce});return this.attachmentsWorkspace.open();}
    if(action==='portfolio'||action==='tags'){
      this.options.open=false;
      if(this.disposed||!this.file.id||this.file.ext!=='pdf')throw new Error('Open a native PDF before using this document workspace.');
      const field=action==='portfolio'?'portfolioWorkspace':'tagsWorkspace';
      if(this[field]&&!this[field].closed)return;
      if(document.querySelector('dialog[open]'))throw new Error('Finish the current workspace before opening '+(action==='portfolio'?'the PDF portfolio.':'the accessibility tag tree.'));
      const ui={announce:this.announce,onClosed:()=>{if(this[field]===workspace)this[field]=null;}};
      if(action==='portfolio')ui.openedFiles=()=>{
        const candidates=typeof this.openedFiles==='function'?this.openedFiles():typeof this.getOpenedFiles==='function'?this.getOpenedFiles():this.files||[];
        return Array.isArray(candidates)?candidates.filter(file=>file&&typeof file.id==='string'&&typeof file.name==='string'&&!file.largeFile):[];
      };
      const workspace=action==='portfolio'?new PdfPortfolioWorkspace(this,ui):new PdfTagsWorkspace(this,ui);
      this[field]=workspace;
      try{return await workspace.open();}catch(error){
        if(workspace.dialog&&!workspace.closed)await workspace.close().catch(()=>{});
        if(this[field]===workspace)this[field]=null;
        throw error;
      }
    }
    if(action==='sheet-label'){this.options.open=false;return this.sheetLabels.toggle();}
    if(action==='review-comments'){await this.commentWorkspace?.requestClose();this.options.open=false;return this.reviewPanel?.toggle(true);}
    if(action==='edit-outline'){this.options.open=false;if(this.bookmarkWorkspace&&!this.bookmarkWorkspace.closed)return;this.bookmarkWorkspace=new PdfBookmarkWorkspace(this,{announce:this.announce});return this.bookmarkWorkspace.open();}
    if(action==='decorate'){this.options.open=false;if(this.decorationWorkspace&&!this.decorationWorkspace.closed)return;this.decorationWorkspace=new PdfDecorationWorkspace(this,{announce:this.announce});return this.decorationWorkspace.open();}
    if(action==='sanitize'){this.options.open=false;if(this.sanitizeWorkspace&&!this.sanitizeWorkspace.closed)return;this.sanitizeWorkspace=new PdfSanitizeWorkspace(this,{announce:this.announce});return this.sanitizeWorkspace.open();}
    if(action==='blank-pages'){this.options.open=false;return this.onBlankPages?.();}
    if(action==='create-forms'){this.options.open=false;return this.onCreateForms?.();}
    if(action==='table-extraction'){if(this.hasToolStrip&&this.root.dataset.toolGroup!=='Export')await this.showToolGroup('Export');this.options.open=false;if(!this.copyAllowed)throw new Error('This PDF restricts copying. Use an owner-authorized copy.');if(this.tableExtractionWorkspace&&!this.tableExtractionWorkspace.closed)return;if(document.querySelector('dialog[open]'))throw new Error('Finish the current workspace before extracting a table.');this.tableExtractionWorkspace=new PdfTableExtractionWorkspace(this);return await this.tableExtractionWorkspace.open();}
    if(action==='annotation-summary'){this.options.open=false;await this.annotationSummary?.close();this.annotationSummary=new AnnotationSummary(this,{announce:this.announce});return this.annotationSummary.open();}
    if(action==='previous')return this.go(this.pageNumber-1);if(action==='next')return this.go(this.pageNumber+1);
    if(action==='zoom-in'||action==='zoom-out'){const history=this.viewNavigation?.begin();this.fit=false;this.root.querySelector('[data-action=fit]').setAttribute('aria-pressed','false');this.root.querySelector('[data-action=fit-page]').setAttribute('aria-pressed','false');this.zoom=Math.max(.25,Math.min(3,this.zoom+(action==='zoom-in'?.15:-.15)));await this.renderPage();this.viewNavigation?.commit(history);return;}
    if(action==='fit'||action==='fit-page'){const history=this.viewNavigation?.begin();this.fit=true;this.fitPage=action==='fit-page';this.root.querySelector('[data-action=fit]').setAttribute('aria-pressed',String(!this.fitPage));this.root.querySelector('[data-action=fit-page]').setAttribute('aria-pressed',String(this.fitPage));await this.renderPage();this.viewNavigation?.commit(history);return;}
    if(action==='rotate-view'){const history=this.viewNavigation?.begin();this.viewRotation=(this.viewRotation+90)%360;await this.renderPage();this.viewNavigation?.commit(history);return;}
    if(action==='bookmark'){this.navigation.showBookmarks();return;}
    if(action==='clear-area'){this.areaSelection?.clear();return;}
    if(action==='find'){this.searchReturnFocus=this.root.ownerDocument.activeElement;if(this.compactPreviewToolbar)this.options.open=false;this.setPane('inspector',true);this.root.querySelector('.pdf-query').focus();return;}
    if(action==='copy'){if(!this.copyAllowed)return;const text=this.index.get(this.pageNumber)||'';if(!text)return this.announce('This page has no selectable text. OCR is needed for scanned words.');await navigator.clipboard.writeText(text);this.announce(`Copied text from page ${this.pageNumber}.`);}
    if(action==='print')return this.print();
    if(action==='copy-area'){if(this.copyAllowed&&this.areaText){await navigator.clipboard.writeText(this.areaText);this.announce('Copied only the text inside your selected area.');}else this.announce('No selectable words in this area. Scanned text needs OCR.');return;}
    if(action==='pages')return this.hasToolStrip?this.openPagesMode():this.onOrganize();
    if(action==='export-images'){this.options.open=false;if(!this.copyAllowed||!this.printAllowed)throw new Error('This PDF restricts image copying or printing.');return this.onExportImages();}
    if(action==='edit-content'){this.options.open=false;return this.onEditContent();}
    if(action==='redact'){this.options.open=false;return this.hasToolStrip?this.openRedactMode():this.onRedact();}
    if(action==='compress'){this.options.open=false;return this.onCompress();}
    if(action==='forms'){this.options.open=false;return this.onForms();}
    if(action==='markup'){this.options.open=false;return this.file.id&&!this.keyboardWithinRoot?this.openCommentMode(options.initialTool,options.initialPage):this.onMarkup?.(options);}
    if(action==='close-notes'){this.root.querySelector('.pdf-notes').hidden=true;return;}
    if(action==='notes'){this.options.open=false;const panel=this.root.querySelector('.pdf-notes');panel.hidden=false;return this.showNotes();}
    if(action==='sheet-set'){this.options.open=false;return this.onSheetSet?.();}
    if(action==='compare'){this.options.open=false;return this.onCompare();}
  }
  visualLines(content,viewport){return orderVisualText(content.items.filter(i=>'str'in i).map(i=>{const point=viewport.convertToViewportPoint(i.transform[4],i.transform[5]);return {text:i.str,left:point[0],top:point[1]-i.height,width:i.width,height:i.height||12};}));}
  async editableText(){
    if(this.file.pagedSource)throw new Error(PAGED_PDF_UNAVAILABLE);
    if(!this.doc)throw new Error('Wait until the PDF is open.');if(!this.copyAllowed)throw new Error('This PDF restricts copying. Use an owner-authorized, unrestricted copy to import text for editing.');
    const content=[];let words=0;
    for(let number=1;number<=this.doc.numPages;number++){if(this.disposed)throw new Error('The PDF workspace closed.');const page=await this.doc.getPage(number),text=await page.getTextContent(),lines=this.visualLines(text,page.getViewport({scale:1}));content.push({type:'heading',attrs:{level:2},content:[{type:'text',text:`Source page ${number}`}]});for(const line of lines){words+=line.length;if(words>2*1024*1024)throw new Error('Extracted text exceeds the 2 MB document editor limit.');content.push({type:'paragraph',content:[{type:'text',text:line}]});}}
    if(!words)throw new Error('This PDF has no selectable text. OCR is needed before it can become an editable document.');return {type:'doc',content};
  }
  cacheText(number,text){
    if(this.file.pagedSource){
      if(!this.multiPage?.active)this.index.clear();
      else for(const page of this.index.keys())if(!this.multiPage.livePages.has(page))this.index.delete(page);
    }
    this.index.set(number,text);let total=0;for(const value of this.index.values())total+=value.length;
    for(const [page,value] of this.index){if(total<=16*1024*1024)break;if(page===this.pageNumber)continue;this.index.delete(page);total-=value.length;}
  }
  async search(query){return this.find.search(query);}
  highlightMatches(){this.find.highlight();}
  async showNotes(){
    if(!this.doc||!this.copyAllowed||this.disposed||this.disposing)return;const number=this.pageNumber,version=this.version,doc=this.doc,list=this.root.querySelector('.page-notes-list');list.textContent='Reading annotations…';
    const current=()=>!this.disposed&&!this.disposing&&doc===this.doc&&this.pageNumber===number&&this.version===version;
    let annotations;try{const page=await doc.getPage(number);if(!current())return;annotations=await page.getAnnotations({intent:'display'});}catch(error){if(!current()||error.name==='RenderingCancelledException')return;throw error;}
    if(!current())return;list.replaceChildren();
    const notes=annotations.filter(item=>['Text','FreeText','Highlight','Underline','Ink','Square','Circle','StrikeOut'].includes(item.subtype)).slice(0,100);
    for(const note of notes){const entry=this.element('div',undefined,'page-note');entry.append(this.element('b',note.subtype==='Text'?'Note':note.subtype==='FreeText'?'Text box':note.subtype),this.element('p',String(note.contentsObj?.str||'No written comment.').slice(0,2000)));list.append(entry);}
    if(!notes.length)list.append(this.element('p','No readable markup notes on this page.'));if(annotations.length>100)list.append(this.element('p','Showing up to 100 notes on this page.'));
  }
  async preparePrint(){
    if(!this.doc||!this.printAllowed)throw new Error('Printing is not permitted for this PDF.');
    if(this.doc.numPages>MAX_PRINT_PAGES)throw new Error(`Printing is limited to ${MAX_PRINT_PAGES} pages in this preview to protect memory. Extract a smaller range before printing.`);
    this.printRoot?.remove();this.printRoot=this.element('div',undefined,'print-pages');document.body.append(this.printRoot);let totalPixels=0;
    for(let number=1;number<=this.doc.numPages;number++){
      if(this.disposed||this.cancelPrint)throw new Error('Print preparation canceled.');
      this.message.hidden=false;this.message.textContent=`Preparing page ${number} of ${this.doc.numPages} for printing…`;
      const page=await this.doc.getPage(number);const viewport=page.getViewport({scale:1.5});const pixels=Math.ceil(viewport.width)*Math.ceil(viewport.height);totalPixels+=pixels;
      if(pixels>MAX_PIXELS||totalPixels>80_000_000)throw new Error('This print job exceeds the preview memory limit. Use a smaller document.');
      const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
      this.printTask=page.render({canvasContext:readerCanvasContext(canvas),viewport,intent:'print',annotationMode:this.printAnnotations?pdfjs.AnnotationMode.ENABLE:pdfjs.AnnotationMode.DISABLE});await this.printTask.promise;
      const image=this.element('img');image.src=canvas.toDataURL('image/png');image.alt=`Page ${number}`;const sheet=this.element('div',undefined,'print-sheet');sheet.append(image);this.printRoot.append(sheet);canvas.width=canvas.height=0;await image.decode();
    }
    this.printRoot.dataset.ready='true';return this.doc.numPages;
  }
  async print(){if(this.redactionWorkspace&&!this.redactionWorkspace.closed){const redaction=this.redactionWorkspace;if(redaction.busy||!redaction.output||!redaction.showingOutput)throw new Error('Prepare and review the clean copy before printing it. The original still contains the information you marked.');return redaction.previewReader.print();}if(this.file.pagedSource)throw new Error(PAGED_PDF_UNAVAILABLE);if(this.printWorkspace&&!this.printWorkspace.closed)return;if(!this.printAllowed)throw new Error('This PDF does not permit printing.');let source=this;const editing=this.commentWorkspace&&!this.commentWorkspace.closed?this.commentWorkspace:this.pagesWorkspace&&!this.pagesWorkspace.closed?this.pagesWorkspace:null;if(editing){if(editing.busy||editing.saving)throw new Error('Finish the current page or comment operation before printing.');await editing.run(()=>editing.preview());if(!editing.output||!editing.previewReader?.doc)throw new Error('The current changes could not be prepared for printing. Nothing was printed.');source=editing.previewReader;}this.printWorkspace=new PdfPrintWorkspace(source);try{this.printWorkspace.open();if(editing)this.printWorkspace.dialog.querySelector('.print-policy').textContent='This preview includes your current '+(editing===this.commentWorkspace?'comments':'page arrangement')+'. Nothing has been saved or sent to the printer. Confirm paper, scale and copies in the Windows dialog.';}catch(error){this.printWorkspace=null;throw error;}}
  async openRedactMode(){if(this.root.dataset.toolGroup!=='Protect')await this.showToolGroup('Protect');if(!this.sourceCapabilities.wholeFileTools)throw new Error(LARGE_PDF_TOOL_MESSAGE);if(!this.doc||this.disposed)return;if(this.redactionWorkspace&&!this.redactionWorkspace.closed)return;const workspace=new RedactionWorkspace(this.file,{inlineOwner:this,element:this.element,icon:this.icon,announce:this.announce,onClosed:()=>{if(this.redactionWorkspace===workspace)this.redactionWorkspace=null;}});this.redactionWorkspace=workspace;try{await workspace.open();}catch(error){workspace.dispose();throw error;}}
  async openPagesMode(){if(this.hasToolStrip&&this.root.dataset.toolGroup!=='Pages')await this.showToolGroup('Pages');if(!this.sourceCapabilities.wholeFileTools)throw new Error(LARGE_PDF_TOOL_MESSAGE);if(!this.doc||this.disposed)return;if(this.pagesWorkspace&&!this.pagesWorkspace.closed)return;await this.reviewPanel?.toggle(false);for(const host of this.pageToolHosts||[])host.suspend();const workspace=new PageWorkspace(this.file,{inlineOwner:this,element:this.element,icon:this.icon,announce:this.announce,onClosed:()=>{if(this.pagesWorkspace===workspace)this.pagesWorkspace=null;}});this.pagesWorkspace=workspace;try{await workspace.open();const cancel=this.element('button','Cancel','secondary');cancel.type='button';cancel.dataset.cancel='';cancel.onclick=()=>workspace.close();workspace.dialog.append(cancel);}catch(error){workspace.dispose();throw error;}}
  async openCommentMode(tool='read',page=this.pageNumber){
    if(this.hasToolStrip&&this.root.dataset.toolGroup!=='Comment')await this.showToolGroup('Comment');
    if(!this.sourceCapabilities.wholeFileTools)throw new Error(LARGE_PDF_TOOL_MESSAGE);if(!this.doc||this.disposed)return;await this.singlePageView();if(Number.isInteger(page)&&page>=1&&page<=this.doc.numPages&&page!==this.pageNumber)await this.go(page);
    if(this.commentWorkspace&&!this.commentWorkspace.closed){if(tool!=='read')this.commentWorkspace.palette.querySelector('[data-comment-tool="'+tool+'"]').click();return;}
    // In short/narrow windows three side panes can squeeze the artwork to a
    // sliver. Make temporary room for markup without changing saved preferences.
    const folded=this.root.clientWidth<850?['thumbnails','inspector'].filter(name=>!this.root.querySelector(name==='thumbnails'?'.pdf-navigation':'.reader-inspector').hidden):[];
    for(const name of folded)this.setPane(name,false,{persist:false});
    const workspace=new MarkupWorkspace(this.file,{inlineOwner:this,element:this.element,icon:this.icon,announce:this.announce,initialTool:tool,initialPage:this.pageNumber,onClosed:()=>{if(this.commentWorkspace===workspace)this.commentWorkspace=null;if(!this.disposed&&!this.disposing)for(const name of folded)this.setPane(name,true,{persist:false});}});this.commentWorkspace=workspace;try{await workspace.open();}catch(error){workspace.dispose();throw error;}
  }
  async prepareDeparture(){
    await this.compressionWorkspace?.prepareDeparture();await this.printWorkspace?.prepareDeparture();await this.redactionWorkspace?.prepareDeparture();await this.pagesWorkspace?.prepareDeparture();await this.commentWorkspace?.prepareDeparture();
    await this.textTool?.prepareDeparture();await this.textTools?.prepareDeparture();
    await this.repairWorkspace?.prepareDeparture();
    await this.documentWorkflowWorkspace?.prepareDeparture();
    await this.combineWorkspace?.prepareDeparture();
    await this.fdfExportWorkspace?.prepareDeparture();
    await this.fdfImportWorkspace?.prepareDeparture();
    await this.signatureRequestWorkspace?.prepareDeparture();
    await this.pageBoxWorkspace?.prepareDeparture();await this.printMarksWorkspace?.prepareDeparture();await this.thinLineWorkspace?.prepareDeparture();await this.smartNameWorkspace?.prepareDeparture();
    await this.preflightWorkspace?.prepareDeparture();
    await this.accessibilityAuditWorkspace?.prepareDeparture();
    await this.geospatialWorkspace?.prepareDeparture();
    if(this.certificateSigningDialog?.isConnected)await this.certificateSigningDialog.prepareDeparture();
    this.certificateSigningDialog=null;
    await this.portfolioWorkspace?.prepareDeparture();
    await this.tagsWorkspace?.prepareDeparture();
  }
  async dispose(){
    if(this.disposed||this.disposing)return;this.disposing=true;
    try{
      await this.prepareDeparture();
      await this.tableExtractionWorkspace?.prepareDeparture();await this.measurements?.prepareDeparture?.();await this.reviewPanel?.prepareDeparture();await this.bookmarkWorkspace?.prepareDeparture();await this.decorationWorkspace?.prepareDeparture();await this.sanitizeWorkspace?.prepareDeparture();await this.attachmentsWorkspace?.prepareDeparture();await this.printWorkspace?.prepareDeparture();await this.annotationSummary?.prepareDeparture();
    }catch(error){this.disposing=false;throw error;}
    await this.textTool?.dispose();this.compressionWorkspace?.dispose();this.redactionWorkspace?.dispose();this.pagesWorkspace?.dispose();this.commentWorkspace?.dispose();this.panelPolicy?.dispose();this.toolStrip?.dispose();this.disposed=true;this.sourceVersion++;this.version++;this.pdfSource?.abort();this.recentPages.clear();this.renderTask?.cancel();this.thumbTask?.cancel();this.printTask?.cancel();this.textLayer?.cancel();
    if(this.pagedPreparation)void window.pdfix.releasePagedPdf(this.file.id).catch(()=>{});
    await this.reviewPanel?.dispose();this.areaSelection?.dispose();this.readableView?.dispose();this.viewNavigation?.dispose();this.canvasNavigation?.dispose();await this.artworkFullscreen?.dispose();await this.multiPage?.dispose();this.markupNavigation?.dispose();this.sheetLabels?.dispose();this.measurements?.dispose();this.layers?.dispose();this.fileDetails?.dispose();this.linkReview?.dispose();this.find.dispose();CSS.highlights?.delete('pdfix-area');this.searchVersion++;clearTimeout(this.resizeTimer);this.resize?.disconnect();this.thumbObserver?.disconnect();this.thumbnailEvents?.abort();cancelAnimationFrame(this.thumbnailFrame);for(const canvas of this.thumbnailLive.values())canvas.width=canvas.height=0;this.thumbnailLive.clear();this.thumbnailCandidates.clear();document.removeEventListener('keydown',this.keyHandler);document.removeEventListener('pointerdown',this.outsideOptions);this.passwordDialog?.remove();this.printRoot?.remove();await this.navigation?.pending.catch(()=>{});await this.task?.destroy().catch(()=>{});this.canvas.width=this.canvas.height=0;this.index.clear();
  }
}
