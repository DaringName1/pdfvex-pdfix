import {organizerBlankSelection} from './organizer-blank-selection.js';
import {openCancelableWorkspace} from './tool-cancel-button.js';
import {renderRecoverableFiles,draftPreview} from './home-recovery-files.js';
import {askDiscardWork,askCloseWork} from './unsaved-work-dialog.js';
import {OpenFileSessions} from './open-file-sessions.js';
import {installSavedCopyReceipt,isDuplicateSavedAnnouncement} from './saved-copy-receipt.js';
import './saved-copy-receipt.css';
import {closeRecentPreview,syncRecentVisuals,recentPins,recentVisualState,decorateRecentFile,recentPreviewSettings,captureOpenedPreview} from './recent-file-visuals.js';
import {markupDefaultSettings} from './markup-default-controls.js';
import {layoutAnnouncement} from './announcement-layout.js';
import {renderWorkspaceRooms} from './workspace-rooms.js';
import {VirtualPrinterWorkspace} from './virtual-printer-workspace.js';
let virtualPrinterWorkspace=null;
import {BatchBatesWorkspace} from './batch-bates-workspace.js';
import {BatchCompressionWorkspace} from './batch-compression-workspace.js';
import {BatchDocumentActionsWorkspace} from './batch-document-actions-workspace.js';
import {EmailClipboardWorkspace} from './email-clipboard-workspace.js';
import {FileFingerprintWorkspace} from './file-fingerprint-workspace.js';
import {CloudFileWorkspace} from './cloud-file-workspace.js';
import {WatchedFolderWorkspace} from './watched-folder-workspace.js';
import {WindowsContextWorkspace} from './windows-context-workspace.js';
let watchedFolderWorkspace,windowsContextWorkspace;
let cloudFileWorkspace;
import {SelectedFileSearch} from './selected-file-search.js';
import {SheetSetWorkspace} from './sheet-set-workspace.js';
import {workspaceFinder} from './workspace-finder.js';
import {formBuilderPrivacy} from './form-builder-privacy.js';
import {initializeReadingAppearance,readingAppearanceControls} from './reading-appearance.js';
import {initializeInterfaceAccessibility,interfaceAccessibilityControls} from './interface-accessibility.js';
import {ScanBlankReview} from './scan-blank-review.js';
import {chooseAiSourceContext} from './ai-source-context.js';
import {FormBuilderWorkspace} from './form-builder-workspace.js';
import {renderAiConnections} from './ai-connections.js';
import {windowsOpenRequests} from './ai-windows-open.js';
import {PresentationWorkspace} from './presentation-workspace.js';
import {WorkbookWorkspace} from './workbook-workspace.js';
import {ActionPanel} from './action-panel.js';
import './style.css';
import './branding.css';
import './text-layer.css';
import './page-workspace.css';
import './document-editor.css';
import './document-tabs.css';
import {newDocumentKey,listNewDocuments,forgetNewDocument,newDocumentName} from './new-documents.js';
import './pdf-selection.css';
import './ocr-workspace.css';
import './version-history.css';
import './layout-controls.css';
import './polish.css';
import { layoutControls } from './layout-controls.js';
import { formats, formatFor, sizeLabel } from './formats.js';
import {PdfImageExport} from './pdf-image-export.js';
import { PdfReader } from './pdf-reader.js';
import {pdfSourceCapabilities,LARGE_PDF_TOOL_MESSAGE} from './pdf-source.js';
const wholeSourcePdfActions=new Set(['pages','export-images','edit-content','redact','compress','sheet-set','compare','blank-pages','create-forms','forms','markup','edit-outline','decorate','sanitize','attachments','table-extraction','links','portfolio','tags','certificates','geospatial','certificate-sign','preflight','accessibility-audit','repair','document-workflow','fdf-export','fdf-import','signature-request','page-boxes','print-marks','thin-lines']);
import { PageWorkspace } from './page-workspace.js';
import { DocumentEditor } from './document-editor.js';
import { OcrWorkspace } from './ocr-workspace.js';
import { PdfComparison } from './pdf-comparison.js';
import {ImageWorkspace} from './image-workspace.js';
import {TiffWorkspace} from './tiff-workspace.js';
import {ScannerWorkspace} from './scanner-workspace.js';
import {CompressionWorkspace} from './compression-workspace.js';
import {RedactionWorkspace} from './redaction-workspace.js';
import {PasswordWorkspace} from './password-workspace.js';
import { FormWorkspace } from './form-workspace.js';
import {PdfContentWorkspace} from './pdf-content-workspace.js';
import { MarkupWorkspace } from './markup-workspace.js';
import { privacyControls } from './privacy-controls.js';
import {securityStatus} from './security-status.js';
import {readingCapacity} from './reading-capacity.js';
import {showPdfSecurityReport} from './pdf-security-report.js';
import {showPdfCertificateReport} from './pdf-certificate-workspace.js';
import './interface-contrast.css';

let emailClipboardWorkspace=null,fileFingerprintWorkspace=null;
let savedCopyReceipt=null;
let aiDisposer=null,windowsDisposer=null,selectedFileSearch=null,batchCompressionWorkspace=null,batchDocumentActionsWorkspace=null,batchBatesWorkspace=null;
const icons = {
  edit:'<path d="m4 17 12-13 4 4L8 21H4Z"/>',
  home:'<path d="m3 10 9-7 9 7v10H5V10m4 10v-7h6v7"/>',
  files:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  star:'<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1 6.3L12 17.5l-5.6 3 1-6.3-4.6-4.5 6.4-.9Z"/>',
  spark:'<path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3Z"/>',
  convert:'<path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/>',
  scan:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 8h10M7 12h10M7 16h6"/>',
  search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5"/>',
  down:'<path d="M12 3v13m-5-5 5 5 5-5M4 18v3h16v-3"/>',
  grid:'<rect x="3" y="3" width="7" height="8" rx="1"/><rect x="14" y="3" width="7" height="8" rx="1"/><rect x="3" y="15" width="7" height="6" rx="1"/><rect x="14" y="15" width="7" height="6" rx="1"/>',
  shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6Z"/><path d="m8 12 3 3 5-6"/>',
  settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
  arrow:'<path d="M7 17 17 7M7 7h10v10"/>',
  back:'<path d="m10 5-7 7 7 7M3 12h18"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  sidebar:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  focus:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="3"/>',
  fullscreen:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  restore:'<path d="M3 8h5V3m8 0v5h5M3 16h5v5m8 0v-5h5"/>'
};
export const icon = (name, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.files}</svg>`;
const app = document.querySelector('#app');
const state = { view: location.hash==='#workspaces'?'workspaces':'home', recents: [], file: null, query: '', busy: false, tabs: [], activeTab: null };
// Each open file retains its live document controls and recovery while another tab or Home is shown.
const MAX_TABS=10;
// Back from a document returns to the page it was opened from.
const BACK_TARGETS={home:'Home',files:'Files',recent:'Files',favorites:'Favorites',workspaces:'All tools',support:'Format support',settings:'Settings & privacy',ai:'Ask about files'};
function rememberTab(entry){const index=state.tabs.findIndex(tab=>tab.key===entry.key);if(index>=0)state.tabs[index]={...state.tabs[index],...entry};else{state.tabs.push(entry);}state.activeTab=entry.key;}
async function switchTab(key){
  const tab=state.tabs.find(item=>item.key===key);if(!tab||state.busy)return;if(key===state.activeTab&&state.view==='work')return;if(sessionStore().parked.has(key)){await run(async()=>{await parkFile();dismissAnnouncement();savedCopyReceipt.clear();state.activeTab=key;state.file=sessionStore().parked.get(key).file;state.view='work';render();});return;}
  if(tab.isNew){await run(()=>newDocument(null,{key:tab.newKey??null,name:tab.name}));return;}
  await reopen(tab.recentId);
  // A tab whose file was forgotten, moved or deleted cannot reopen; drop it so it does not keep failing.
  if(state.activeTab!==key){tab.missing=true;renderTabs();}
}
function sessionHasChanges(session){return sessionStore().owners(session).some(owner=>['modified','uiModified','dirty','recovered'].some(key=>key in owner)?!!(owner.modified||owner.uiModified||owner.dirty||owner.recovered):!!(owner.history?.length||owner.objects?.length||owner.replacements?.length));}
async function discardSessionRecovery(session){const c=session.controllers,id=session.file.id;if(c.documentEditor)await window.pdfix.clearDraft(c.documentEditor.draftId);if(c.workbookWorkspace||c.presentationWorkspace)await window.pdfix.clearDraft(id);if(c.contentWorkspace)await window.pdfix.clearPdfContent(id);if(c.formWorkspace)await window.pdfix.clearForm(id);if(c.markupWorkspace||c.pdfReader?.commentWorkspace)await window.pdfix.clearMarkup(id);if(c.pdfReader?.pagesWorkspace||c.pageWorkspace)await window.pdfix.clearPagePlan(id);if(c.imageWorkspace)await window.pdfix.clearImagePages(id);}
async function closeTab(key){
 if(state.busy)return;const index=state.tabs.findIndex(tab=>tab.key===key);if(index<0)return;const store=sessionStore(),tab=state.tabs[index],session=store.parked.get(key)||(store.visibleKey===key?{file:state.file,controllers:store.read()}:null);const discard=session&&sessionHasChanges(session);if(discard&&!await askDiscardWork(tab.name))return;
 await run(async()=>{if(store.visibleKey===key)await parkFile();const saved=store.parked.get(key);if(saved){if(discard)await discardSessionRecovery(saved);const activeControllers=store.read();try{store.write(saved.controllers);for(const owner of Object.values(saved.controllers).filter(Boolean))if(!owner.closed&&!owner.disposed)await owner.dispose?.();}finally{store.write(activeControllers);}if(discard&&saved.file.isNew&&saved.file.newKey)forgetNewDocument(saved.file.newKey);store.parked.delete(key);if(saved.file.id)await window.pdfix.releaseFile(saved.file.id);}
 state.tabs=state.tabs.filter(item=>item.key!==key);if(state.activeTab===key){const next=state.tabs[index]||state.tabs[index-1];state.activeTab=next?.key||null;state.file=store.parked.get(next?.key)?.file||null;if(state.view==='work'&&!state.file)state.view='home';}render();});
}
function cycleTab(step){if(!state.tabs.length)return;const index=Math.max(0,state.tabs.findIndex(tab=>tab.key===state.activeTab));switchTab(state.tabs[(index+step+state.tabs.length)%state.tabs.length].key);}
function renderTabs(){
  document.querySelector('.document-tabs')?.remove();
  const active=state.tabs.find(tab=>tab.key===state.activeTab);if(state.view==='work'&&active&&state.file)active.name=state.file.name;for(const tab of state.tabs)if(tab.isNew&&tab.newKey&&tab!==active)tab.name=newDocumentName(tab.newKey)??tab.name;
  const strip=element('nav',undefined,'document-tabs');strip.setAttribute('aria-label','Open documents (Ctrl+Tab switches)');const homeTab=element('button','Home','document-tab-open document-home-tab');homeTab.type='button';homeTab.setAttribute('aria-label','Home tab');homeTab.title='Home; your open files stay in their tabs';homeTab.onclick=()=>go('home');if(state.view!=='work')homeTab.setAttribute('aria-current','page');strip.append(homeTab);
  for(const tab of state.tabs){
    const item=element('div',undefined,'document-tab'),open=element('button',undefined,'document-tab-open'),close=element('button','×','document-tab-close');item.dataset.active=String(state.view==='work'&&tab.key===state.activeTab);
    open.type=close.type='button';open.append(element('small',tab.ext.toUpperCase()),element('span',tab.name));open.title=tab.name;if(state.view==='work'&&tab.key===state.activeTab)open.setAttribute('aria-current','page');open.onclick=()=>switchTab(tab.key);
    close.setAttribute('aria-label','Close '+tab.name);close.title='Close this tab; PDFix asks before discarding unsaved changes';close.onclick=()=>closeTab(tab.key);
    item.append(open);if(tab.missing){open.title='This file could not reopen. Find it or close its tab.';const find=element('button','Find it','text-button');find.type='button';find.onclick=()=>pick();item.append(find);}item.append(close);strip.append(item);
  }
  document.querySelector('.topbar').after(strip);
}
let sheetSetWorkspace,pdfReader,documentEditor,workbookWorkspace,presentationWorkspace,markupWorkspace,blankReview,formWorkspace,formBuilderWorkspace,imageWorkspace,tiffWorkspace,redactionWorkspace,passwordWorkspace,pageWorkspace,contentWorkspace,pdfImageExport;
let scannerWorkspace=null,scannerClose=null;
let appViewControls;
let openSessions;
function sessionStore(){return openSessions??=new OpenFileSessions({main:document.querySelector('#main-content'),headerParent:app.querySelector('.topbar'),read:()=>({sheetSetWorkspace,pdfReader,documentEditor,workbookWorkspace,presentationWorkspace,markupWorkspace,blankReview,formWorkspace,formBuilderWorkspace,imageWorkspace,tiffWorkspace,redactionWorkspace,passwordWorkspace,pageWorkspace,contentWorkspace,pdfImageExport}),write:value=>{({sheetSetWorkspace,pdfReader,documentEditor,workbookWorkspace,presentationWorkspace,markupWorkspace,blankReview,formWorkspace,formBuilderWorkspace,imageWorkspace,tiffWorkspace,redactionWorkspace,passwordWorkspace,pageWorkspace,contentWorkspace,pdfImageExport}=value);}});}
async function prepareFileSwitch(){if(document.querySelector('dialog[open]'))throw Error('Close the current dialog before switching files.');await sessionStore().flush({file:state.file,controllers:sessionStore().read()});}
async function parkFile(){await prepareFileSwitch();await sessionStore().park(state.activeTab,state.file);}

const actionPanel=new ActionPanel(availableActions,{announce});
const activeEditor=()=>imageWorkspace||tiffWorkspace||documentEditor||workbookWorkspace||presentationWorkspace;
export function element(tag, text, cls) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (cls) node.className = cls; return node; }
// Messages use the page's top layer (a manual popover), so they show above an open dialog without being moved into it;
// re-showing a message brings it in front of any dialog opened since.
function toastElement() {
  let toast = document.querySelector('#toast'); if (!toast) { toast = document.createElement('div'); toast.id = 'toast'; toast.className = 'toast'; toast.setAttribute('role','status'); toast.setAttribute('aria-live','polite'); toast.hidden = true; document.body.append(toast); }
  if (!toast.hasAttribute('popover')) toast.setAttribute('popover','manual'); return toast;
}
async function saveProblemReport(){try{const saved=await window.pdfix.saveProblemReport();if(saved)announce(`Saved ${saved.name}. Send it with a note of what you were doing.`);}catch(error){announce(error.message,true);}}
if(window.pdfix?.noteProblem){window.addEventListener('error',event=>window.pdfix.noteProblem('page error: '+(event.message||'')).catch(()=>{}));window.addEventListener('unhandledrejection',event=>window.pdfix.noteProblem('page error: '+(event.reason?.message||String(event.reason))).catch(()=>{}));}
export function announce(message, error=false, ms=8000) {
  if(error)window.pdfix?.noteProblem?.('shown to the person: '+message)?.catch?.(()=>{});
  const toast = toastElement(); toast.textContent = message; toast.classList.toggle('error', error);if(savedCopyReceipt?.isDuplicateAnnouncement(message,error)){clearTimeout(announce.timer);hideToast(toast);return;}toast.hidden = false;
  try { if (toast.matches(':popover-open')) toast.hidePopover(); toast.showPopover(); } catch {}
  layoutAnnouncement(toast);
  clearTimeout(announce.timer); announce.timer = setTimeout(() => hideToast(toast), ms);
}
// A shown popover stays in the top layer until hidePopover(); the hidden attribute alone left old messages on screen.
function hideToast(toast) { toast.hidden = true; layoutAnnouncement(toast); try { if (toast.matches(':popover-open')) toast.hidePopover(); } catch {} }
// Opening another tool clears the last tool's message, so it is never read as being about the new one.
export function dismissAnnouncement() { const toast = document.querySelector('#toast'); if (toast) hideToast(toast); clearTimeout(announce.timer); }
function shell() {
  app.innerHTML = `<a class="skip" href="#main-content">Skip to content</a>
  <aside id="workspace-sidebar" class="sidebar"><div class="brand"><img src="/brand/pdfix-logo.png" alt="PDFix"></div>
  <div class="nav-label">YOUR SPACE</div><nav aria-label="Workspace">
    <button data-view="home">${icon('home')}<span>Home</span></button>
    <button data-view="files">${icon('files')}<span>Files</span></button>
    <button data-view="favorites">${icon('star')}<span>Favorites</span></button>
    <button data-view="workspaces">${icon('grid')}<span>All tools</span></button>
  </nav><div class="nav-label spaced">GET THINGS DONE</div><nav aria-label="Tools">
    <button data-view="ai">${icon('spark')}<span>Ask about files</span></button>
    <button data-view="support">${icon('convert')}<span>Format support</span></button>
  </nav><div class="side-bottom"><button class="nav-button" data-view="settings">${icon('settings')}<span>Settings & privacy</span></button>
  </div></aside>
  <div class="main"><header class="topbar"><span class="crumb">Workspace <span>›</span> <b id="crumb">Home</b></span><label class="global-search">${icon('search')}<input id="file-search" type="search" placeholder="Find a file" aria-label="Find an opened file"><kbd>Ctrl K</kbd></label><button class="secondary compact action-panel-button" data-action-panel aria-label="Find a tool" title="Find a tool or command (F1 / Ctrl Shift P)">${icon('grid')}<span>Find a tool</span></button></header>
  <main id="main-content" tabindex="-1"></main></div>
  <div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
  <dialog id="info-dialog"><div class="dialog-header"><h2></h2><button class="icon-button" aria-label="Close dialog">×</button></div><div class="dialog-body"></div><button class="primary close-dialog">Got it</button></dialog>`;
  app.querySelector('[data-action-panel]').onclick=()=>actionPanel.open();
  document.addEventListener('pointerdown',event=>{const menu=app.querySelector('.workspace-tools[open]');if(menu&&!menu.contains(event.target))menu.open=false;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){const menu=app.querySelector('.workspace-tools[open]');if(menu){menu.open=false;menu.querySelector('summary').focus();}}});
  app.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => go(button.dataset.view)));
  document.querySelector('#file-search').addEventListener('input', event => { state.query = event.target.value; if (!['files','recent','favorites'].includes(state.view)) run(()=>navigate('files')); else render(); });
  const dialog = document.querySelector('dialog'); dialog.querySelectorAll('button').forEach(button => button.addEventListener('click', () => dialog.close()));
  document.addEventListener('keydown', event => {
    if(document.querySelector('dialog[open]'))return;
    if(event.key==='Escape'&&!event.defaultPrevented&&state.view==='settings'&&!document.querySelector('[popover]:popover-open')){event.preventDefault();go(state.settingsReturnView||'home');return;}
    if (event.ctrlKey && event.key.toLowerCase() === 'o') { event.preventDefault(); pick(); }
    if(event.key==='F1'||event.ctrlKey&&event.shiftKey&&event.key.toLowerCase()==='p'){event.preventDefault();actionPanel.open();return;}
    if (event.ctrlKey && event.key.toLowerCase() === 'k') { event.preventDefault(); focusFileSearch(); }
    if (event.ctrlKey && event.key === 'Tab' && state.tabs.length > 0) { event.preventDefault(); cycleTab(event.shiftKey ? -1 : 1); }
  });
  document.addEventListener('dragover', event => { event.preventDefault(); document.querySelector('.drop-zone')?.classList.add('dragging'); });
  document.addEventListener('dragleave', () => document.querySelector('.drop-zone')?.classList.remove('dragging'));
  document.addEventListener('drop', event => {
    event.preventDefault(); document.querySelector('.drop-zone')?.classList.remove('dragging');if(document.querySelector('dialog[open]')){announce('Close the current workspace before opening another file.');return;}
    // Every dropped file opens in its own tab (up to ten at once), the last one shown.
    const files = [...event.dataTransfer.files].slice(0, 10);
    if (!files.length) return;
    if (event.dataTransfer.files.length > 10) announce('Opening the first 10 files. Drop the rest after these.');
    run(async () => {for(const file of files){const editor=activeEditor();try{await prepareFileSwitch();await accept(await window.pdfix.drop(file));}finally{if(activeEditor()===editor)editor?.releaseDeparture();}}if(files.length>1)announce(`Opened ${files.length} files. Switch between them with the tabs at the top.`);});
  });
}
async function run(action) {
  if (state.busy) return;
  state.busy = true; document.body.classList.add('busy');
  try { await action(); } catch (error) { announce(error.message, true); }
  finally { state.busy = false; document.body.classList.remove('busy'); }
  // A page chosen in the sidebar while PDFix was busy (go) is opened as soon as the busy step ends.
  const next=state.requestedView;if(next){state.requestedView=null;return run(()=>navigate(next));}
}
// Sidebar pages: a click while a file is still opening used to be dropped silently, so on a slower PC Home seemed not to
// work. The request is now kept and carried out when the current step ends (see run and pick).
function go(view){if(state.busy){state.requestedView=view;announce('Finishing the current step first. One moment…');return;}return run(()=>navigate(view));}
// A file that finished opening after the person chose another page is kept in the tabs instead of taking over the view.
async function keepOpenedInTabs(file){if(file.largeFile)await window.pdfix.releaseFile(file.id).catch(()=>{});state.recents=(await window.pdfix.workspace()).recents;const recent=state.recents.find(item=>item.name===file.name)||state.recents[0];if(recent)rememberTab({key:'recent:'+recent.id,recentId:recent.id,name:file.name,ext:file.ext||recent.ext||'file'});announce(`Opened ${file.name} in a tab. Your original is unchanged.`,false,3000);}
async function prepareDrawingDeparture({skipPrinter=false,skipCloud=false,skipContext=false}={}){if(!skipContext)await windowsContextWorkspace?.prepareDeparture();await watchedFolderWorkspace?.prepareDeparture();if(!skipCloud)await cloudFileWorkspace?.prepareDeparture();if(!skipPrinter)await virtualPrinterWorkspace?.prepareDeparture();await pdfReader?.prepareDeparture?.();await pdfReader?.tableExtractionWorkspace?.prepareDeparture();await batchCompressionWorkspace?.prepareDeparture();await batchBatesWorkspace?.prepareDeparture();await batchDocumentActionsWorkspace?.prepareDeparture();await selectedFileSearch?.prepareDeparture();await emailClipboardWorkspace?.prepareDeparture();await fileFingerprintWorkspace?.prepareDeparture();await sheetSetWorkspace?.prepareDeparture();await pdfReader?.measurements?.prepareDeparture?.();}
function retainedEditorGuard(){const editor=activeEditor(),ledger=pdfReader?.measurements?.ledger;return !!(editor&&(editor.dirty||editor.draftWrites||editor.writes||editor.saving||editor.imageBusy||editor.cellPending||editor.staged||editor.busy)||ledger&&(ledger.dirty||ledger.busy||ledger.pdfWorkspace));}
function openScanner(){
 if(!window.pdfix?.scannerDevices)return showInfo('Use the desktop app','Direct scanning requires the Windows PDFix desktop app and a compatible WIA scanner driver.');
 if(state.busy||scannerWorkspace||document.querySelector('dialog[open]'))return;
 const focus=document.activeElement,dialog=element('dialog'),header=element('div',undefined,'dialog-header'),title=element('h2','Scan to PDF'),closeButton=element('button','×','icon-button'),area=element('div');dialog.setAttribute('aria-label','Capture pages from a Windows scanner');dialog.style.maxWidth='1050px';dialog.style.width='calc(100vw - 48px)';dialog.style.maxHeight='calc(100vh - 48px)';dialog.style.overflow='auto';closeButton.type='button';closeButton.setAttribute('aria-label','Close scanner and discard pending captures');header.append(title,closeButton);dialog.append(header,area);document.body.append(dialog);
 let preparedEditor=null,importPreparing=false,closing=null;
 const releasePrepared=()=>{if(preparedEditor&&activeEditor()===preparedEditor)preparedEditor.releaseDeparture();preparedEditor=null;};
 const workspace=new ScannerWorkspace(area,{announce,setGuard:async value=>{if(!workspace.busy&&importPreparing){releasePrepared();importPreparing=false;}await window.pdfix.editorGuard(value||retainedEditorGuard());},beforeImport:async()=>{importPreparing=true;preparedEditor=activeEditor();try{await prepareDrawingDeparture();await preparedEditor?.prepareDeparture();await pdfReader?.navigation?.pending.catch(()=>{});await window.pdfix.editorGuard(true);return true;}catch(error){releasePrepared();importPreparing=false;await window.pdfix.editorGuard(true);throw error;}},onImported:async file=>{await close();await run(()=>accept(file));if(file.scannerWarnings?.length)announce(file.scannerWarnings.join(' '),true);}});
 scannerWorkspace=workspace;
 const close=async()=>{if(closing)return closing;if(importPreparing&&workspace.busy)throw new Error('Finish choosing or importing the scan-image copies before closing the scanner.');closing=(async()=>{try{await workspace.prepareDeparture();releasePrepared();await workspace.dispose({prepared:true});dialog.close();dialog.remove();if(scannerWorkspace===workspace){scannerWorkspace=null;scannerClose=null;}await window.pdfix.editorGuard(retainedEditorGuard());if(focus?.isConnected)focus.focus();}catch(error){closing=null;workspace.releaseDeparture();throw error;}})();return closing;};
 scannerClose=close;closeButton.onclick=()=>close().catch(error=>announce(error.message,true));dialog.addEventListener('cancel',event=>{event.preventDefault();close().catch(error=>announce(error.message,true));});dialog.showModal();workspace.open().catch(error=>announce(error.message,true));
}
function openBatchDocumentActions(){if(!window.pdfix)return showInfo('Use the desktop app','Batch actions use native file and folder pickers.');if(state.busy||document.querySelector('dialog[open]'))return;const workspace=new BatchDocumentActionsWorkspace({announce,onClosed:()=>{if(batchDocumentActionsWorkspace===workspace)batchDocumentActionsWorkspace=null;}});batchDocumentActionsWorkspace=workspace;workspace.open();}
function openVirtualPrinter(){if(!window.pdfix?.virtualPrinterStatus)return showInfo('Use Windows PDFix','The optional print destination requires the Windows desktop app.');if(state.busy||document.querySelector('dialog[open]'))return;let preparedEditor;
 const release=()=>{if(activeEditor()===preparedEditor)preparedEditor?.releaseDeparture();preparedEditor=null;};
 const workspace=new VirtualPrinterWorkspace({announce,beforePick:async()=>{preparedEditor=activeEditor();try{await prepareDrawingDeparture({skipPrinter:true});await preparedEditor?.prepareDeparture();await pdfReader?.navigation?.pending.catch(()=>{});}catch(error){release();throw error;}},afterPick:release,onOpen:file=>run(()=>accept(file)),onClosed:()=>{release();if(virtualPrinterWorkspace===workspace)virtualPrinterWorkspace=null;}});virtualPrinterWorkspace=workspace;workspace.open().catch(error=>announce(error.message,true));}
function openBatchBates(){if(!window.pdfix)return showInfo('Use the desktop app','Bates batches use native pickers and contained PDF writers.');if(state.busy||document.querySelector('dialog[open]'))return;const workspace=new BatchBatesWorkspace({announce,onClosed:()=>{if(batchBatesWorkspace===workspace)batchBatesWorkspace=null;}});batchBatesWorkspace=workspace;workspace.open();}
function openBatchCompression(){if(!window.pdfix)return showInfo('Use the desktop app','Batch compression uses native file and folder pickers.');if(state.busy||document.querySelector('dialog[open]'))return;const workspace=new BatchCompressionWorkspace({announce,onClosed:()=>{if(batchCompressionWorkspace===workspace)batchCompressionWorkspace=null;}});batchCompressionWorkspace=workspace;workspace.open();}
function openEmailClipboard(){if(!window.pdfix)return showInfo('Use the desktop app','Email and clipboard creation use local Windows file and clipboard access.');if(state.busy||document.querySelector('dialog[open]'))return;const workspace=new EmailClipboardWorkspace({announce,onClosed:()=>{if(emailClipboardWorkspace===workspace)emailClipboardWorkspace=null;},onCreateDocument:payload=>run(()=>newDocument(payload))});emailClipboardWorkspace=workspace;workspace.open();}
function openWatchedFolders(){if(!window.pdfix)return showInfo('Use the desktop app','Watched folders use Windows local storage and explicit persistent approval.');if(state.busy||document.querySelector('dialog[open]'))return;const workspace=new WatchedFolderWorkspace({announce,onClosed:()=>{if(watchedFolderWorkspace===workspace)watchedFolderWorkspace=null;}});watchedFolderWorkspace=workspace;Promise.resolve().then(()=>workspace.open()).catch(error=>announce(error.message,true));}
function openWindowsContext(){if(!window.pdfix)return showInfo('Use the desktop app','Optional Windows context tools require the packaged desktop app.');if(state.busy||document.querySelector('dialog[open]'))return;let editor;const workspace=new WindowsContextWorkspace({announce,beforeOpen:async()=>{editor=activeEditor();await prepareDrawingDeparture({skipContext:true});await editor?.prepareDeparture();await pdfReader?.navigation?.pending.catch(()=>{});},afterOpen:()=>{if(activeEditor()===editor)editor?.releaseDeparture();editor=null;},onClosed:()=>{if(windowsContextWorkspace===workspace)windowsContextWorkspace=null;},onOpen:async result=>{await run(async()=>{await accept(result.files[0]);await pdfReader?.opening;if(result.action==='convert')await pdfReader.action('export-images');else if(result.action==='compress')await pdfReader.action('compress');else if(result.action==='merge'){await pdfReader.action('native-combine');await pdfReader.combineWorkspace.run(()=>pdfReader.combineWorkspace.seedReviewedSources(result.combineSelection));}});}});windowsContextWorkspace=workspace;workspace.open().catch(error=>announce(error.message,true));}
function openCloudFile(){if(!window.pdfix)return showInfo('Use the desktop app','Synchronized file tools use native file selection and installed Windows storage providers.');if(state.busy||document.querySelector('dialog[open]'))return;let preparedEditor;const workspace=new CloudFileWorkspace({announce,beforeOpen:async()=>{preparedEditor=activeEditor();await prepareDrawingDeparture({skipCloud:true});await preparedEditor?.prepareDeparture();await pdfReader?.navigation?.pending.catch(()=>{});},afterOpen:()=>{if(activeEditor()===preparedEditor)preparedEditor?.releaseDeparture();preparedEditor=null;},onOpen:file=>run(()=>accept(file)),onClosed:()=>{if(cloudFileWorkspace===workspace)cloudFileWorkspace=null;}});cloudFileWorkspace=workspace;workspace.open().catch(error=>announce(error.message,true));}
function openFileFingerprint(){if(!window.pdfix)return showInfo('Use the desktop app','File verification uses a native file picker.');if(state.busy||document.querySelector('dialog[open]'))return;const workspace=new FileFingerprintWorkspace({announce,onClosed:()=>{if(fileFingerprintWorkspace===workspace)fileFingerprintWorkspace=null;}});fileFingerprintWorkspace=workspace;workspace.open();}
function openSelectedFileSearch(){
 if(!window.pdfix)return showInfo('Use the desktop app','Search selected files uses the native PDFix file picker.');
 if(state.busy||document.querySelector('dialog[open]'))return;
 const workspace=new SelectedFileSearch({announce,onClosed:()=>{if(selectedFileSearch===workspace)selectedFileSearch=null;},onOpenResult:async(token,result,phrase)=>{
  const editor=activeEditor();try{await sheetSetWorkspace?.prepareDeparture();await pdfReader?.measurements?.prepareDeparture?.();await editor?.prepareDeparture();await pdfReader?.navigation?.pending.catch(()=>{});
   const opened=await window.pdfix.openSearchSource(token,result.sourceId);await workspace.close(true);await accept(opened);
   if(result.page){const reader=pdfReader;await reader?.opening;if(reader===pdfReader&&reader?.file.id===opened.id&&reader.doc)await reader.go(result.page);}
   if(!result.page){const current=documentEditor;await current?.opening;if(current===documentEditor&&current?.file.id===opened.id&&current.root.dataset.ready==='true'){
    current.find.root.querySelector('[data-query]').value=phrase;current.find.show();
    if(current.sourceMode){const original=new TextDecoder('utf-8',{fatal:true}).decode(opened.bytes);if(current.input.value===original&&current.input.value.slice(result.start,result.end)===result.literal){current.input.focus();current.input.setSelectionRange(result.start,result.end);const lines=current.input.value.slice(0,result.start).split(/\r\n|\r|\n/).length-1;current.input.scrollTop=lines*parseFloat(getComputedStyle(current.input).lineHeight);}}
   }}
   announce(`Opened ${opened.name}${result.page?' · physical page '+result.page:' · '+(['docx','rtf'].includes(result.ext)?'extracted line ':'line ')+result.line}. Search phrase: ${phrase}`);
  }finally{if(activeEditor()===editor)editor?.releaseDeparture();}
 }});selectedFileSearch=workspace;workspace.open();
}
// Looks for the PDF encryption entry near the start and end of the file (where the trailer or a linearized header keeps it).
function pdfLooksLocked(bytes){if(!bytes)return true;const data=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes),key=[47,69,110,99,114,121,112,116],has=(from,to)=>{for(let i=Math.max(0,from);i<=Math.min(data.length,to)-key.length;i++){let j=0;while(j<key.length&&data[i+j]===key[j])j++;if(j===key.length)return true;}return false;};return has(0,1<<20)||has(data.length-(1<<20),data.length);}
function pick(task){
  if(!window.pdfix)return showInfo('Use the desktop app','This browser is a design preview. Run npm start to use native file opening, saved history and local document processing.');
  return run(async()=>{
    const editor=activeEditor();
    try{
      await prepareDrawingDeparture();await editor?.prepareDeparture();await pdfReader?.navigation?.pending.catch(()=>{});
      const pdfTasks=new Set(['read','compare','sheet-set','takeoff','password','images','content','pages','ocr','forms','compress','redact','review','markup','decorate','outline','create-forms','tables','health','signature-request','page-boxes','print-marks','thin-lines','smart-name']);
      const file=await window.pdfix.pick(pdfTasks.has(task)?'pdf':task==='image'?'image':task==='document'?'document':task==='workbook'?'spreadsheet':task==='slides'?'presentation':'file');if(!file)return;if(state.requestedView){await keepOpenedInTabs(file);return;}
      if(!pdfSourceCapabilities(file).wholeFileTools&&pdfTasks.has(task)&&!['read','health','takeoff','smart-name'].includes(task)){await accept(file);announce(LARGE_PDF_TOOL_MESSAGE,true);return;}
      if(task==='password'){
        if(file.ext!=='pdf'){announce('Choose a PDF for password protection.',true);return;}
        // A PDF that opens without a password stays visible behind the Protect window; only a locked one opens over the empty
        // workspace, because its pages cannot be shown before the password is entered.
        if(!pdfLooksLocked(file.bytes)){await accept(file);passwordWorkspace=new PasswordWorkspace(file,{announce,element,icon,hostReader:pdfReader,onOpenedFile:async opened=>{passwordWorkspace=null;await accept(opened);},onClosed:()=>{passwordWorkspace=null;}});await passwordWorkspace.open();return;}
        await accept({...file,passwordWorkspace:true});passwordWorkspace=new PasswordWorkspace(file,{announce,element,icon,hostReader:pdfReader,onOpenedFile:async opened=>{passwordWorkspace=null;await accept(opened);},onClosed:()=>{passwordWorkspace=null;navigate('workspaces');}});await passwordWorkspace.open();return;
      }
      const returnedToOpenTab=await accept(file);
      if(task==='image'&&!['png','jpg','jpeg','webp','bmp'].includes(file.ext))announce('Choose a PNG, JPEG, static WebP or supported BMP for this workspace.',true);
      if(!pdfTasks.has(task))return;
      if(file.ext!=='pdf'){announce('This task needs a PDF. Open a PDF to continue.',true);return;}
      // Organize pages opens the PDF's own Pages tools (one-place layout); the separate window stays for older readers.
      if(task==='pages'){await pdfReader?.opening;if(pdfReader?.doc&&pdfReader.hasToolStrip){await pdfReader.action('pages');return;}await openPageWorkspace(file);return;}
      await pdfReader?.opening;if(!pdfReader?.doc)throw new Error('The PDF could not be opened. Reopen it before starting this workspace.');
      const readerActions={content:'edit-content','signature-request':'signature-request','page-boxes':'page-boxes','print-marks':'print-marks','thin-lines':'thin-lines','smart-name':'smart-name',review:'review-comments',markup:'markup',decorate:'decorate',outline:'edit-outline','create-forms':'create-forms',tables:'table-extraction',health:'health-check'};
      if(readerActions[task]){await pdfReader.action(readerActions[task]);return;}
      if(task==='read')return;
      if(task==='compare'){await openPdfComparison(pdfReader);return;}
      if(task==='sheet-set'){await openSheetSet(file);return;}
      if(task==='takeoff'){await pdfReader.measurements.toggle(true);return;}
      if(task==='images'){await openPdfImageExport(pdfReader);return;}
      if(task==='redact'){redactionWorkspace=new RedactionWorkspace(file,{announce,element,icon,onClosed:()=>{redactionWorkspace=null;}});await redactionWorkspace.open();return;}
      if(task==='compress'){await new CompressionWorkspace(file,pdfReader,{announce,element,icon}).open();return;}
      if(task==='forms'){
        const reader=pdfReader;
        if(!reader.openQuickForm)throw Error('Open the PDF in the reader before filling it.');
        reader.setInteractionMode('quick');
        const workspace=await reader.openQuickForm(undefined,{signIfNoFields:true,stayOnPage:returnedToOpenTab});
        workspace.enableHomeSave();
        reader.root.querySelector('.pdf-body')?.removeAttribute('data-options-folded');
        if(returnedToOpenTab&&!workspace.dialog.contains(document.activeElement)&&!workspace.layer?.contains(document.activeElement)){
          workspace.dialog.querySelector('[aria-label="Close fill and sign"]')?.focus({preventScroll:true});
        }
        return;
      }
      openOcr(file);
    }finally{if(activeEditor()===editor)editor?.releaseDeparture();}
  });
}

function availableActions(){
  const native=!!window.pdfix,ready=!state.busy,reader=pdfReader,editor=documentEditor,image=imageWorkspace,doc=reader?.doc&&!reader.disposed,writing=editor?.root.dataset.ready==='true'&&!editor.saving&&!editor.departing,imaging=image?.ready&&!image.busy&&!image.saving&&!image.departing&&!image.collection.blocked;
  const action=(label,category,shortcut,execute,enabled=true,reason='Wait for the current operation to finish.')=>({label,category,shortcut,action:execute,enabled:ready&&enabled,reason});
  const actions=[action('Open a file','Files','Ctrl O',()=>pick(),native,'Use the native PDFix desktop app to open files.'),action('New document','Documents','',()=>run(newDocument)),action('Find an opened file','Files','Ctrl K',focusFileSearch),action('Open a synchronized file','Files','',openCloudFile,native,'Use the Windows desktop app.'),action('Open All tools','Navigation','',()=>run(()=>navigate('workspaces'))),action('Format support and limits','Help','',()=>run(()=>navigate('support'))),action('Save a problem report','Help','',saveProblemReport,native,'Use the PDFix desktop app.'),action('Collapse or expand sidebar','View','Ctrl Shift B',()=>appViewControls.toggleSidebar()),action('Toggle focus mode','View','Ctrl Shift F',()=>appViewControls.toggleFocus()),action('Toggle fullscreen','View','F11',()=>appViewControls.toggleFullscreen()),action('Windows right-click PDF tools','Windows','',openWindowsContext,native,'Use packaged Windows PDFix.'),action('Watched-folder workflows','Files','',openWatchedFolders,native,'Use Windows desktop PDFix.')];
  actions.push(action('Extract a table','PDF','',()=>pick('tables'),native,'Open a PDF and review its table grid.'));
  actions.push(action('Virtual PDF printer','Windows','',openVirtualPrinter,!!window.pdfix?.virtualPrinterStatus,'Use Windows PDFix for the free optional print destination.'));
  actions.push(action('Scan to PDF','Images','',openScanner,!!window.pdfix?.scannerDevices,'Use Windows PDFix with a compatible WIA scanner driver.'));
  actions.push(action('Bates numbering across PDFs','PDF','',openBatchBates,native,'Use the desktop app for continuous reviewed numbering.'));
  actions.push(action('Compress several PDFs','PDF','',openBatchCompression,native,'Use the desktop app for a reviewed PDF compression queue.'));
  actions.push(action('Batch copy, rename or export text','PDF','',openBatchDocumentActions,native,'Use the desktop app for reviewed batch document actions.'));
  actions.push(action('Create from email or clipboard','Documents','',openEmailClipboard,native,'Use the desktop app for local email or clipboard creation'));
  actions.push(action('Verify PDF fingerprint','Files','',openFileFingerprint,native,'Use the desktop app to calculate and compare a SHA-256 receipt'));
  actions.push(action('Search selected files','Files','',openSelectedFileSearch,native,'Use the desktop app to choose files for local content search.'));
  actions.push(action('PDF security report','PDF','',()=>showPdfSecurityReport(state.file,{announce,hostReader:pdfReader}),!!doc&&!!state.file?.id&&pdfSourceCapabilities(state.file).wholeFileTools, state.file?.largeFile?LARGE_PDF_TOOL_MESSAGE:'Open a PDF to inspect its structural security information.'));
  actions.push(action('Inspect certificate signatures','PDF','',()=>showPdfCertificateReport(state.file,{announce}),!!doc&&!!state.file?.id&&pdfSourceCapabilities(state.file).wholeFileTools,state.file?.largeFile?LARGE_PDF_TOOL_MESSAGE:'Open a PDF to inspect signature integrity and certificate information.'));
  const pdfAction=(label,shortcut,name,extra=true,reason='Open a PDF that supports this action.')=>{const limited=!pdfSourceCapabilities(reader?.file).wholeFileTools&&wholeSourcePdfActions.has(name)&&!(name==='links'&&reader?.doc?.nativeLinkReadingAvailable);actions.push(action(label,'PDF',shortcut,()=>{if(wholeSourcePdfActions.has(name))reader.setInteractionMode?.('build');return reader.action(name);},!!doc&&extra&&!limited,limited?LARGE_PDF_TOOL_MESSAGE:reason));};
  pdfAction('Read PDF aloud','','read-aloud',reader?.copyAllowed);pdfAction('PDF word count','','text-statistics',reader?.copyAllowed);pdfAction('Review PDF spelling','','spell-check',reader?.copyAllowed);
  if(writing){actions.push(action('Read document aloud','Documents','',()=>editor.textTools?.show('speech')));actions.push(action('Check document spelling','Documents','',()=>editor.textTools?.show('spelling')));}
  actions.push(action('Repair PDF to a reviewed copy','PDF','',()=>reader.action('repair'),!!reader?.file.id&&reader.file.ext==='pdf'&&pdfSourceCapabilities(reader.file).wholeFileTools,reader?.file.largeFile?LARGE_PDF_TOOL_MESSAGE:'Open a PDF; repair inspection remains available if its page viewer fails.'));
  pdfAction('Export drawing comments as FDF','','fdf-export',reader?.copyAllowed&&!!reader?.file.id);
  pdfAction('Import drawing comments from FDF','','fdf-import',!!reader?.file.id);
  actions.push({...action('Combine PDFs','PDF','',()=>reader.action('native-combine'),!!doc&&!!window.pdfix,'Open a PDF to combine it with other PDFs.'),keywords:'merge join'});
  actions.push({...action('PDF to Word','PDF','',()=>reader.onEditCopy(),!!doc&&!!reader?.onEditCopy&&reader.copyAllowed,'Open a PDF that allows copying its text.'),keywords:'convert export DOCX'});
  pdfAction('Edit and run a PDF workflow','','document-workflow',!!reader?.file.id);
  pdfAction('Prepare signing request','','signature-request',!!reader?.file.id);pdfAction('Edit PDF page boxes','','page-boxes',!!reader?.file.id);pdfAction('Add print-production marks','','print-marks',!!reader?.file.id);pdfAction('Inspect and repair thin lines','','thin-lines',!!reader?.file.id);pdfAction('Name and save unchanged PDF copy','','smart-name',!!reader?.file.id);
  pdfAction('Inspect print preflight','','preflight',!!reader?.file.id);pdfAction('Inspect accessibility findings','','accessibility-audit',!!reader?.file.id);
  pdfAction('Review PDF portfolio','','portfolio',!!reader?.file.id);pdfAction('Review PDF tags and reading order','','tags',!!reader?.file.id);pdfAction('Map geographic coordinates and distances','','geospatial',!!reader?.file.id);pdfAction('Sign PDF with a Windows certificate','','certificate-sign',!!reader?.file.id);
  actions.push(action('Show PDF layers','PDF','',()=>reader.layers.toggle(true),!!doc,'Open a PDF with optional-content groups.'));pdfAction('Review possible blank scan pages','','blank-pages',!!reader?.onBlankPages&&reader.copyAllowed&&reader.printAllowed);pdfAction('Review embedded PDF files','','attachments',!!reader?.file.id);pdfAction('Clean PDF data','','sanitize',!!reader?.file.id);pdfAction('PDF file details','','details');pdfAction('PDF document health report','','health-check');for(const [label,value]of [['Single PDF page','page'],['Continuous PDF pages','continuous'],['Facing PDF pages','facing']])actions.push(action(label,'View','',()=>{reader.root.querySelector('.reading-view').value=value;return reader.changeReadingView(value);},!!doc&&!!reader?.file.id,'Open a PDF to choose its page view.')); pdfAction('Go to PDF sheet label','','sheet-label',!!reader?.file.id);pdfAction('Manage drawing sheet sets','','sheet-set',!!reader?.onSheetSet);pdfAction('Compare PDF drawings','','compare',!!reader?.onCompare);pdfAction('Review drawing comments and replies','','review-comments',reader?.copyAllowed&&!!reader?.file.id);pdfAction('Edit PDF document outline','','edit-outline',!!reader?.file.id);pdfAction('Add PDF page numbers, Bates, watermarks and stamps','','decorate',!!reader?.file.id);pdfAction('Review PDF page links','','links');pdfAction('Export annotation summary','','annotation-summary',reader?.copyAllowed&&!!reader?.file.id);actions.push(action('Measure drawing and takeoffs','PDF','',()=>reader.measurements.toggle(),!!doc,'Open a PDF drawing.'));pdfAction('Find in PDF','Ctrl F','find',reader?.copyAllowed);pdfAction('Next PDF page','PageDown','next');pdfAction('Previous PDF page','PageUp','previous');pdfAction('Zoom PDF to region','','zoom-region');pdfAction('Previous PDF view','Alt Left','previous-view');pdfAction('Next PDF view','Alt Right','next-view');pdfAction('PDF artwork fullscreen','Ctrl Shift Enter','pdf-fullscreen');pdfAction('Fit PDF page','','fit-page');pdfAction('Fit PDF width','','fit');pdfAction('Rotate PDF view','','rotate-view');pdfAction('Copy PDF page text','','copy',reader?.copyAllowed);pdfAction('Print PDF','Ctrl P','print',reader?.printAllowed);pdfAction('Save PDF page bookmark','Ctrl D','bookmark',!!reader?.file.id);pdfAction('Organize PDF pages','','pages',!!reader?.onOrganize);pdfAction('Edit PDF text, images and properties','','edit-content',!!reader?.onEditContent);pdfAction('Export PDF pages as PNG/JPEG','','export-images',!!reader?.onExportImages&&reader.copyAllowed&&reader.printAllowed);pdfAction('Fill and sign PDF','','forms',!!reader?.onForms);pdfAction('Create fillable PDF fields','','create-forms',!!reader?.onCreateForms);pdfAction('Mark up a PDF','','markup',!!reader?.onMarkup);pdfAction('Redact PDF','','redact',!!reader?.onRedact);pdfAction('Compress PDF','','compress',!!reader?.onCompress);
  const deck=presentationWorkspace,workingDeck=deck?.ready&&!deck.saving&&!deck.departing;actions.push(action('Save presentation copy','Presentations','Ctrl S',()=>deck.save('pptx'),!!workingDeck,'Open a PPTX presentation.'),action('Export presentation text DOCX','Presentations','',()=>deck.save('docx'),!!workingDeck,'Open a PPTX presentation.'),action('Export presentation text PDF','Presentations','',()=>deck.textPdf(),!!workingDeck,'Open a PPTX presentation.'),action('Find presentation text','Presentations','Ctrl F',()=>deck.root.querySelector('[data-search]').focus(),!!workingDeck,'Open a PPTX presentation.'));
  const book=workbookWorkspace,workingBook=book?.ready&&!book.saving&&!book.departing;actions.push(action('Save workbook copy','Workbooks','Ctrl S',()=>book.save('xlsx'),!!workingBook,'Open an XLSX workbook.'),action('Export current sheet CSV','Workbooks','',()=>book.save('csv'),!!workingBook,'Open an XLSX workbook.'),action('Find workbook cell text','Workbooks','Ctrl F',()=>book.root.querySelector('[data-search]').focus(),!!workingBook,'Open an XLSX workbook.'));
  actions.push(action('Preview Markdown or CSV table','Documents','',()=>editor.sourcePreview.setView('preview'),!!writing&&!!editor?.sourcePreview?.kind,'Open Markdown or CSV source text.'),action('Show source and preview','Documents','',()=>editor.sourcePreview.setView('split'),!!writing&&!!editor?.sourcePreview?.kind,'Open Markdown or CSV source text.'));
  actions.push(action('Find and replace document text','Documents','Ctrl F',()=>editor.find.show(),!!writing,'Open a document or source-text editor.'),action('Save text/source copy','Documents','',()=>editor.save(editor.sourceMode?editor.file.ext:'txt'),!!writing,'Open a document or source-text editor.'),action('Export document PDF','Documents','',()=>editor.root.querySelector('[data-pdf]').click(),!!writing,'Open a document or source-text editor.'),action('Export DOCX copy','Documents','',()=>editor.save('docx'),!!writing&&!editor.sourceMode,'Open the rich document editor.'),action('Export RTF copy','Documents','',()=>editor.root.querySelector('[data-rtf]').click(),!!writing&&!editor.sourceMode,'Open the rich document editor.'),action('Insert document page break','Documents','Ctrl Enter',()=>editor.editor.chain().focus().insertPageBreak().run(),!!writing&&!editor.sourceMode,'Open the rich document editor.'),action('Undo document edit','Documents','Ctrl Z',()=>editor.editor.commands.undo(),!!writing&&!editor.sourceMode,'Open the rich document editor.'),action('Redo document edit','Documents','Ctrl Shift Z',()=>editor.editor.commands.redo(),!!writing&&!editor.sourceMode,'Open the rich document editor.'));
  actions.push(action('Rotate image left','Images','',()=>image.change({...image.settings,rotation:(image.settings.rotation+270)%360}),!!imaging,'Open a supported image.'),action('Rotate image right','Images','',()=>image.change({...image.settings,rotation:(image.settings.rotation+90)%360}),!!imaging,'Open a supported image.'),action('Preview image collection PDF','Images','',()=>image.run(()=>image.preview()),!!imaging,'Open a supported image.'),action('Export edited PNG/JPEG','Images','',()=>image.root.querySelector('[data-export-image]').click(),!!imaging,'Open a supported image.'));
  return actions;
}
// Open the exact verified native save only after an explicit choice. Validate the token before
// disturbing a draft; then use the same guarded departure path as opening another file.
savedCopyReceipt=installSavedCopyReceipt({document,subscribe:window.pdfix?.onSavedCopy,getOriginalName:()=>state.view==='work'?state.file?.name:'this screen',onContinue:continueWithSavedCopy,announce,onReceipt:choice=>{const toast=document.querySelector('#toast');if(toast&&isDuplicateSavedAnnouncement(toast.textContent,choice,toast.classList.contains('error')))dismissAnnouncement();}});
async function continueWithSavedCopy(token){
 if(state.busy)throw new Error('Wait for the current operation to finish, then continue with the saved copy.');
 state.busy=true;document.body.classList.add('busy');const editor=activeEditor();
 try{
  const opened=await window.pdfix.openSavedCopy(token);
  const modal=[...document.querySelectorAll('dialog[open]')].at(-1);
  if(modal){
   await new Promise((resolve,reject)=>{const done=()=>{clearTimeout(timer);observer.disconnect();resolve();},observer=new MutationObserver(()=>{if(!modal.isConnected||!modal.open)done();}),timer=setTimeout(()=>{observer.disconnect();reject(new Error('Close the current tool, then choose Continue with this copy again. Your original is still open.'));},30000);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});const canceled=!modal.dispatchEvent(new Event('cancel',{cancelable:true}));if(!canceled)modal.close();if(!modal.isConnected||!modal.open)done();});
  }
  await prepareDrawingDeparture();await editor?.prepareDeparture();await pdfReader?.navigation?.pending.catch(()=>{});
  await accept(opened);const continuedEditor=documentEditor;if(continuedEditor){await continuedEditor.opening;if(documentEditor===continuedEditor&&!continuedEditor.disposed&&!document.querySelector('dialog[open]')){if(continuedEditor.sourceMode)continuedEditor.input?.focus();else continuedEditor.editor?.commands.focus();}}else if(!document.querySelector('dialog[open]'))pdfReader?.stage?.focus();
 }finally{if(activeEditor()===editor)editor?.releaseDeparture();state.busy=false;document.body.classList.remove('busy');const next=state.requestedView;if(next){state.requestedView=null;await run(()=>navigate(next));}}
}
async function accept(file) {
  if(state.tabs.length>=MAX_TABS)throw Error('Close a file tab before opening another file. Your open files are kept.');
  await parkFile();
  savedCopyReceipt?.clear();state.file = file;
  state.recents = (await window.pdfix.workspace()).recents;
  // The file just opened is first in the recent list.
  const recent=state.recents[0],existing=recent&&sessionStore().parked.get('recent:'+recent.id);
  if(existing){
    if(file.id&&file.id!==existing.file.id)await window.pdfix.releaseFile(file.id);
    state.file=existing.file;state.activeTab='recent:'+recent.id;
    await navigate('work');
    announce('Returned to your open '+existing.file.name+'. Page, tool and unsaved work were kept.');
    return true;
  }
  if(recent)rememberTab({key:'recent:'+recent.id,recentId:recent.id,name:file.name,ext:file.ext||recent.ext||'file'});
  navigate('work'); // A routine opened note goes after 3 seconds (it covered the toolbar); a file notice (repair, limits) stays 8.
  announce(file.notice||`Opened ${file.name}. Your original is unchanged.`,false,file.notice?8000:3000);
}
async function openPdfImageExport(reader){const exporter=new PdfImageExport(reader,{announce,element,icon,onClosed:()=>{if(pdfImageExport===exporter)pdfImageExport=null;}});pdfImageExport=exporter;try{await exporter.open();}catch(error){if(exporter.dialog)await exporter.close().catch(()=>{});if(pdfImageExport===exporter)pdfImageExport=null;throw error;}}
// Fill and sign: a panel beside the open PDF when it has the tool bar (owner, October 21), otherwise its window.
async function openFormWorkspace(file){if(formWorkspace&&!formWorkspace.closed&&formWorkspace.file===file){formWorkspace.host?.activate();return formWorkspace;}const hostReader=pdfReader?.hasToolStrip&&pdfReader.file===file?pdfReader:null;if(hostReader&&hostReader.interactionMode!=='quick')hostReader.setInteractionMode?.('build');const opened=new FormWorkspace(file,{announce,element,icon,hostReader,onClosed:()=>{if(formWorkspace===opened)formWorkspace=null;}});formWorkspace=opened;await opened.open();return opened;}
async function openContentWorkspace(file){if(!pdfSourceCapabilities(file).wholeFileTools)throw new Error(LARGE_PDF_TOOL_MESSAGE);if(contentWorkspace&&!contentWorkspace.closed&&contentWorkspace.file===file){contentWorkspace.host?.reader.setInteractionMode?.('build');contentWorkspace.host?.activate();return contentWorkspace;}const hostReader=pdfReader?.hasToolStrip&&pdfReader.file===file?pdfReader:null;if(hostReader)hostReader.setInteractionMode?.('build');const opened=new PdfContentWorkspace(file,{announce,element,icon,hostReader,onClosed:()=>{if(contentWorkspace===opened)contentWorkspace=null;}});contentWorkspace=opened;await opened.open();return opened;}
// Click to type and Edit existing in the shared Text tool (Codex 554b89a) use this editor on the open page. Both
// methods share one editing session; the app already saves its work on leaving, so the session does not.
function registerContentTextMethods(reader,file){if(!reader.registerTextMethod||!pdfSourceCapabilities(file).wholeFileTools)return;
  const activate=async({method})=>{const workspace=await openContentWorkspace(file);if(!workspace?.inline)throw new Error('Text editing needs the PDF open with its tool bar.');workspace.useTextMethod(method);
    return {optionsRoot:workspace.dialog,editorWorkspace:workspace,get closed(){return workspace.closed;},resume:()=>{workspace.host?.activate();workspace.useTextMethod(method);},suspend:()=>{if(workspace.textMethod===method)workspace.useTextMethod(null);},onModeChange:mode=>{if(workspace.inline&&!workspace.suspended)workspace.dialog.hidden=mode!=='build'||!workspace.host?.active;workspace.host?.visibility();},dispose:()=>workspace.closed?undefined:workspace.close()};};
  for(const method of ['click-to-type','edit-existing'])reader.registerTextMethod(method,activate);
}
async function openPageWorkspace(file,reviewedBlankSelection){if(pdfReader?.hasToolStrip&&pdfReader.file===file){await pdfReader.openPagesMode();if(reviewedBlankSelection){const pages=pdfReader.pagesWorkspace;pages.blankSelectionDisposer?.();pages.blankSelectionDisposer=await organizerBlankSelection(pages,reviewedBlankSelection);}return;}if(!pdfSourceCapabilities(file).wholeFileTools)throw new Error(LARGE_PDF_TOOL_MESSAGE);pageWorkspace=new PageWorkspace(file,{announce,element,icon,reviewedBlankSelection,onClosed:()=>{pageWorkspace=null;}});await pageWorkspace.open();}
async function reopen(id) { return run(async () => {const editor=activeEditor();try{await prepareDrawingDeparture();await editor?.prepareDeparture();await pdfReader?.navigation?.pending.catch(()=>{});await accept(await window.pdfix.reopen(id));}finally{if(activeEditor()===editor)editor?.releaseDeparture();}}); }
async function navigate(view) {if(view==='settings'&&state.view!=='settings')state.settingsReturnView=state.view;if(state.view==='work'&&view!=='work')await parkFile();if(view==='work'&&state.view!=='work')state.returnView=state.view;if(view!=='work')savedCopyReceipt?.clear();state.view=view;render();}
// Each new document has its own recovery draft: a fresh key, or the key of an unsaved one reopened from Home or its tab.
// key null reopens the single shared draft kept from before new documents had keys.
async function newDocument(initial=null,{key,name}={}){if(state.tabs.length>=MAX_TABS)throw Error('Close a file tab before creating another document.');await parkFile();savedCopyReceipt?.clear();dismissAnnouncement();state.file={id:null,newKey:key===undefined?newDocumentKey():key,name:name||initial?.title||'Untitled document',ext:'docx',isNew:true,...(initial?.initialContent?{initialContent:initial.initialContent,importWarning:initial.importWarning||''}:{})};rememberTab({key:state.file.newKey??'new',isNew:true,newKey:state.file.newKey,name:state.file.name,ext:'docx'});navigate('work');}
function focusFileSearch(){return run(async()=>{if(state.view==='work'||app.classList.contains('focus-mode')){await navigate('files');if(app.classList.contains('focus-mode'))appViewControls.toggleFocus();}app.querySelector('#file-search').focus();});}
function render() {
  if(sessionStore().visibleKey)sessionStore().capture(sessionStore().visibleKey,sessionStore().visibleFile);closeRecentPreview();syncRecentVisuals(state.recents);
  aiDisposer?.();aiDisposer=null;windowsDisposer?.();windowsDisposer=null;
  const titles = {home:'Home',files:'Files',recent:'Files',favorites:'Favorites',workspaces:'All tools',support:'Format support',settings:'Settings & privacy',ai:'Ask about files',work:state.file?.name || 'Document'};
  document.querySelector('#crumb').textContent = titles[state.view];
  app.querySelectorAll('[data-view]').forEach(button => { const active = button.dataset.view === state.view; button.classList.toggle('active', active); if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
  app.classList.toggle('document-open',state.view==='work');app.querySelector('.topbar .file-header')?.remove();
  const main = document.querySelector('#main-content'); main.replaceChildren(); main.className = state.view === 'work' ? 'workspace' : 'content';renderTabs();
  if (state.view === 'home') renderHome(main);
  else if (['files','recent','favorites'].includes(state.view)) renderFiles(main);
  else if (state.view === 'support') renderSupport(main);
  else if (state.view === 'work'){if(!sessionStore().restore(state.activeTab))renderWorkspace(main);sessionStore().visibleKey=state.activeTab;sessionStore().visibleFile=state.file;}
  else if(state.view==='workspaces')renderWorkspaceHub(main);
  else if (state.view === 'ai') renderAI(main);
  else {renderSettings(main);foldLongCards(main);}
  if(state.view==='support')foldLongCards(main,'td');
  windowsDisposer=windowsOpenRequests(main,{announce,prepareDeparture:async()=>{if(document.querySelector('dialog[open]'))throw new Error('Close the current dialog before opening a requested file.');await prepareDrawingDeparture();await activeEditor()?.prepareDeparture();},releaseDeparture:()=>activeEditor()?.releaseDeparture(),onOpen:accept});
}
function heading(main, title, description) { main.append(element('h1',title),element('p',description,'subtitle')); }
function openButton(text='Open a file') { const button = element('button',undefined,'primary'); button.innerHTML = icon('plus') + `<span>${text}</span>`; button.addEventListener('click',pick); return button; }
// Unsaved new documents with a recovery draft, offered on Home so each can be continued. Entries whose draft is gone
// (saved, or recovery data cleared) are dropped.
async function unsavedDocuments(main){
  const section=element('section',undefined,'unsaved-documents');section.hidden=true;section.setAttribute('aria-label','Unsaved new documents');main.querySelector('.greeting')?.after(section);
  // The main process keeps its own list on disk, so a draft is still offered after PDFix was ended suddenly.
  const listed=listNewDocuments(),durable=await window.pdfix.listNewDocuments?.().catch(()=>[])??[];for(const entry of durable)if(!listed.some(item=>item.key===entry.key))listed.push({key:entry.key,name:'Untitled document',updatedAt:entry.updatedAt});
  const entries=[];for(const entry of listed){const draft=await window.pdfix.loadDraft(entry.key).catch(()=>null);if(draft)entries.push({...entry,preview:draftPreview(draft)});else if(!state.tabs.some(tab=>tab.newKey===entry.key))forgetNewDocument(entry.key);}
  const legacy=await window.pdfix.loadDraft(null).catch(()=>null);if(legacy){let name='Untitled document';try{name=localStorage.getItem('pdfix-new-document-name')||name;}catch{}entries.push({key:null,name,updatedAt:null,preview:draftPreview(legacy)});}
  if(!entries.length||!section.isConnected)return;section.append(element('h2','Unsaved new documents'));const list=element('div',undefined,'unsaved-document-list');
  for(const entry of entries){const button=element('button',undefined,'secondary unsaved-document');button.type='button';button.append(element('b',entry.name),element('span',entry.updatedAt?'Edited '+new Date(entry.updatedAt).toLocaleString():'Recovered draft'));if(entry.preview){button.append(element('p',entry.preview));button.setAttribute('aria-description',entry.preview);}button.setAttribute('aria-label','Continue '+entry.name);button.onclick=()=>run(()=>newDocument(null,{key:entry.key,name:entry.name}));const discard=element('button','Discard','text-button unsaved-document-discard');discard.type='button';discard.setAttribute('aria-label','Discard '+entry.name);discard.onclick=()=>{if(state.tabs.some(tab=>tab.isNew&&(tab.newKey??null)===entry.key)){announce('Close the tab of this document before discarding it.',true);return;}const dialog=element('dialog',undefined,'recovery-cleanup discard-unsaved');dialog.innerHTML='<div class="dialog-header"><h2></h2></div><p>The unsaved text and its local versions are removed from this device. This cannot be undone.</p><div class="cleanup-actions"><button class="secondary" data-keep>Keep it</button><button class="primary" data-discard>Discard</button></div>';dialog.querySelector('h2').textContent='Discard '+entry.name+'?';document.body.append(dialog);dialog.showModal();dialog.addEventListener('close',()=>dialog.remove());dialog.querySelector('[data-keep]').onclick=()=>dialog.close();dialog.querySelector('[data-discard]').onclick=async()=>{try{await window.pdfix.discardNewDocument(entry.key);if(entry.key)forgetNewDocument(entry.key);else try{localStorage.removeItem('pdfix-new-document-name');}catch{}dialog.close();item.remove();if(!list.children.length)section.remove();announce(entry.name+' was discarded.');}catch(error){announce(error.message,true);}};};const item=element('div',undefined,'unsaved-document-item');item.append(button,discard);list.append(item);}
  section.append(list);section.hidden=false;
}
function renderHome(main) {
  const greeting = element('div',undefined,'greeting'), words = element('div');
  heading(words,'What would you like to do?','Open a file or choose a task.');const actions=element('div');actions.append(openButton());const create=element('button','New document','secondary new-document-button');create.addEventListener('click',()=>run(newDocument));actions.append(create);greeting.append(words,actions);main.append(greeting);unsavedDocuments(main);renderRecoverableFiles(main,{onContinue:id=>state.tabs.some(tab=>tab.key==='recent:'+id)?switchTab('recent:'+id):reopen(id)});
  const drop = element('div',undefined,'drop-zone'); drop.innerHTML = `<span class="drop-icon">${icon('upload')}</span><div><b>Drop a file here to get started</b><p>PDFs, Word, Excel and PowerPoint files, text and pictures</p></div>`;
  const browse = element('button','Browse files','secondary'); browse.addEventListener('click',pick); drop.append(browse); main.append(drop);
  const section = element('div',undefined,'section-heading'); section.append(element('h2','Quick actions')); main.append(section);
  // Home is only for starting work (owner-approved one-place layout, October 19): every other tool is in All tools and,
  // once a PDF is open, in its tool bar. Names come from the shared list (src/tool-registry.js).
  const tasks = [
    ['files','New document','Start a blank document, then save it as Word or PDF.','Available','new'],
    ['files','Fill and sign','Choose a form, type into its fields, add your signature, then save a signed copy.','Available','forms'],
    ['grid','Organize pages','Turn, reorder, remove or join pages from one or more PDFs, then save a new PDF.','Available','pages'],
    ['scan','Scan to PDF','Scan pages from a connected scanner, put them in order and save a PDF.','Available','scan'],
    ['convert','Image to PDF','Put pictures into one PDF, in the order you choose, with optional crop.','Available','image'],
    ['files','Compare drawing revisions','Show what changed between two versions of a PDF, side by side.','Available','compare'],
    ['files','Search selected files','Find words in several PDFs and documents at once.','Available','search'],
    ['grid','All tools','Every tool: edit, mark up, protect, redact, measure, export and more.','Available','all']
  ];
  const grid = element('div',undefined,'task-grid'); tasks.forEach(([symbol,title,description,phase,action],index) => {
    const button = element('button',undefined,`task-card accent-${index%3}`); button.innerHTML = `<div class="task-top"><span class="task-icon">${icon(symbol)}</span>${icon('arrow')}</div>`;
    button.append(element('b',title),element('p',description)); button.addEventListener('click', () => (dismissAnnouncement(), action==='new' ? run(()=>newDocument()) : action==='all' ? navigate('workspaces') : action==='search' ? openSelectedFileSearch() : action==='compare' ? pick('compare') : action==='scan' ? openScanner() : action==='content' ? pick('content') : action === 'read' ? pick() : action==='pages' ? pick('pages') : action==='ocr' ? pick('ocr') : action==='images' ? pick('images') : action==='image' ? pick('image') : action==='compress' ? pick('compress') : action==='redact' ? pick('redact') : action==='password' ? pick('password') : action==='forms' ? pick('forms') : action==='markup' ? pick('markup') : showInfo(title,`${title} is still in development. Check Format support to see the operations currently available.`))); grid.append(button);
  }); main.append(grid);
  const recentHeading = element('div',undefined,'section-heading inline'); const words2 = element('div'); words2.append(element('h2','Recently opened'),element('p','Pick up where you left off.')); const all = element('button','View all →','text-button'); all.addEventListener('click',()=>run(()=>navigate('files'))); recentHeading.append(words2,all); main.append(recentHeading);
  if (!state.recents.length) {
    const empty = element('div',undefined,'empty-recents'); empty.innerHTML=icon('clock'); empty.append(element('div','Your next document starts here. Open a file to see it in Files.')); main.append(empty);
  } else {
    // With files to return to, that list comes before the task grid, so reopening one is a single click without scrolling.
    const pins=recentPins(),pinned=state.recents.filter(file=>pins.includes(file.id)),others=state.recents.filter(file=>!pins.includes(file.id)),recent=others.length?fileList(others.slice(0,3)):element('p','Your other recently opened files appear here.','footnote');if(pinned.length){const title=element('h2','Pinned files','pinned-file-heading');main.insertBefore(title,section);main.insertBefore(fileList(pinned),section);}main.insertBefore(recentHeading,section);main.insertBefore(recent,section);
  }

}
function fileList(items) {
  const list=element('div',undefined,'file-list'),visuals=recentVisualState();
  items.forEach(file => {
    const card=element('div',undefined,'file-card'); const open=element('button',undefined,'file-open');
    const badge=element('span',file.ext.toUpperCase(),'file-badge'); const details=element('span',undefined,'file-details'); details.append(element('b',file.name),element('small',`${sizeLabel(file.size)} · ${new Date(file.openedAt).toLocaleDateString()}`)); open.append(badge,details); open.title=file.location; open.addEventListener('click',()=>reopen(file.id));
    const favorite=element('button',undefined,'icon-button favorite'); favorite.innerHTML=icon('star'); favorite.setAttribute('aria-label',`${file.favorite?'Remove':'Add'} favorite: ${file.name}`); favorite.setAttribute('aria-pressed',String(file.favorite)); favorite.addEventListener('click',()=>run(async()=>{state.recents=await window.pdfix.favorite(file.id);render();}));
    const forget=element('button','×','icon-button forget'); forget.setAttribute('aria-label',`Forget ${file.name}`); forget.title='Remove from history (keeps the file)'; forget.addEventListener('click',()=>run(async()=>{state.recents=await window.pdfix.forget(file.id);render();})); card.append(open,favorite,forget);decorateRecentFile(card,open,file,{refresh:render,announce,visuals});list.append(card);
  }); return list;
}
function renderFiles(main) {
  heading(main,state.view==='favorites'?'Your favorites':state.view==='recent'?'Recently opened':'Your opened files',state.view==='favorites'?'Files you starred, so they are easy to find again.':'Files you have chosen to open. PDFix does not scan your folders.');
  const search=element('button','Search selected files','secondary');search.onclick=openSelectedFileSearch;const fileActions=element('div',undefined,'page-actions');fileActions.append(openButton(),search);main.append(fileActions); const items=state.recents.filter(f=>(state.view!=='favorites'||f.favorite)&&`${f.name} ${f.location}`.toLowerCase().includes(state.query.toLowerCase()));
  if (items.length) main.append(fileList(items)); else main.append(element('div',state.query?'No opened files match your search.':state.view==='favorites'?'No favorites yet. Select the star next to a file in Files to keep it here.':'No files here yet. Drop files here, or choose Open a file.',state.query||state.view==='favorites'?'empty-state':'empty-state drop-zone'));
  // Files can be dropped anywhere on this page (and the whole window); say so under the list too.
  if (items.length && !state.query && state.view!=='favorites') main.append(element('p','Drop more files anywhere in this window to open them.','page-help'));
}
function renderSupport(main) {
  heading(main,'Know what each file can do','What PDFix can open, edit and convert. Changes are saved as a new copy, so your original file stays as it is.');
  const wrapper=element('div',undefined,'table-wrap format-table'); const table=element('table'); table.innerHTML='<thead><tr><th scope="col">Format</th><th scope="col">Open</th><th scope="col">Preview</th><th scope="col">Edit</th><th scope="col">Convert</th><th scope="col">Good to know</th></tr></thead>';
  const body=element('tbody'); formats.forEach(f=>{const row=element('tr');row.append(element('th',f.name));for(const key of ['open','preview','edit','convert']){const cell=element('td',typeof f[key]==='string'?f[key]:f[key]?'Available':'Not yet',f[key]?'available':'planned');cell.dataset.label=key[0].toUpperCase()+key.slice(1);row.append(cell);}const note=element('td',f.summary);note.dataset.label='Good to know';if(f.note!==f.summary){const more=element('details',undefined,'tool-details');more.append(element('summary','More about this'),element('p',f.note));note.append(more);}row.append(note);body.append(row);});table.append(body);wrapper.append(table);main.append(wrapper,element('p','PDFix never runs scripts or macros from your files. Very large files have size limits so the app stays responsive.','footnote'));
}
function renderWorkspace(main) {
  if (!state.file) return navigate('home'); const file=state.file;
  const header=element('div',undefined,'file-header'); const back=element('button',undefined,'icon-button');back.innerHTML=icon('back');const returnTo=Object.hasOwn(BACK_TARGETS,state.returnView)?state.returnView:'home';back.setAttribute('aria-label','Back to '+BACK_TARGETS[returnTo]);back.title='Back to '+BACK_TARGETS[returnTo];back.addEventListener('click',()=>run(()=>navigate(returnTo)));
  const title=element('div',undefined,'document-title');title.title=file.name;title.append(element('b',file.name),element('small',file.size===undefined?'New local document':`${file.ext.toUpperCase()} · ${sizeLabel(file.size)}`));
  header.append(back,title);if(file.id){const save=element('button',file.ext==='pdf'?'Save a copy':'Save original copy','secondary original-copy');save.addEventListener('click',()=>run(async()=>{if(file.ext==='pdf'&&!pdfSourceCapabilities(file).wholeFileTools){if(!pdfReader)throw new Error('Wait for the PDF reading workspace to open.');return pdfReader.action('smart-name');}if(file.ext==='pdf'&&contentWorkspace&&!contentWorkspace.closed&&contentWorkspace.file===file&&(contentWorkspace.objects.length||contentWorkspace.replacements.length||contentWorkspace.imageReplacements.length||Object.keys(contentWorkspace.metadata).length)){const workspace=contentWorkspace;if(workspace.busy||workspace.departing)throw Error('Wait for your text changes to finish before saving.');return workspace.reviewOrSave(true);}const result=await window.pdfix.saveCopy(file.id,undefined,file.copyName);if(result)announce(`Saved ${result.name}. Original unchanged.`);else announce('Canceled. No copy was saved, and your original is unchanged.');}));header.append(save);}app.querySelector('.topbar').insertBefore(header,app.querySelector('.global-search'));
  const area=element('div',undefined,'document-area');main.append(area);
  if(file.passwordWorkspace){area.append(element('p','Use the password workspace to review and save a new protected or unprotected copy.'));return;}
  if(file.ext==='pdf'){
    const large=!pdfSourceCapabilities(file).wholeFileTools;if(large){title.querySelector('small').textContent+=' · On-demand reading';title.title=file.notice||'Large or complex drawings may take longer. Whole-file editing remains limited.';}
    const modes=element('details',undefined,'workspace-tools');modes.innerHTML='<summary class="secondary compact">PDF tools</summary><div class="workspace-tools-menu"><button data-security-report>Security report</button><button data-certificates>Certificate signatures</button><button data-edit-content>Edit PDF text &amp; images</button><button data-edit-copy>PDF to Word</button><button data-ocr>Make scan searchable</button></div>';header.insertBefore(modes,header.querySelector('.secondary'));modes.addEventListener('click',event=>{if(event.target.closest('button'))modes.open=false;});
    modes.querySelector('[data-security-report]').onclick=()=>showPdfSecurityReport(file,{announce,hostReader:pdfReader});modes.querySelector('[data-certificates]').onclick=()=>showPdfCertificateReport(file,{announce});
    modes.querySelector('[data-edit-content]').addEventListener('click',()=>run(()=>openContentWorkspace(file)));
    modes.querySelector('[data-ocr]').addEventListener('click',()=>openOcr(file));
    const editCopy=()=>run(async()=>{const reader=pdfReader;const content=await reader.editableText();if(pdfReader!==reader||state.file!==file)throw Error('Open the PDF again before converting it to Word.');await newDocument({title:file.name.replace(/\.pdf$/i,'')+' text copy',initialContent:content,importWarning:'Text extracted from your PDF into an editable copy. Columns, images, tables and page layout do not carry over. Check reading order before exporting.'});});modes.querySelector('[data-edit-copy]').addEventListener('click',editCopy);
    if(large)for(const button of modes.querySelectorAll('button')){button.disabled=true;button.title=LARGE_PDF_TOOL_MESSAGE;}
    /* The old PDF tools menu goes once the reader shows these actions in its own tool bar (it sets hasToolStrip; owner-approved one-place layout). */const dropMenu=()=>{if(pdfReader?.hasToolStrip&&modes.isConnected)modes.remove();};queueMicrotask(dropMenu);setTimeout(dropMenu,0);pdfReader?.dispose();pdfReader=new PdfReader(area,file,{announce,element,icon,setGuard:value=>window.pdfix.editorGuard(value||retainedEditorGuard()),onExportImages:()=>openPdfImageExport(pdfReader),onProtect:()=>{if(passwordWorkspace)return;if(file.ext!=='pdf'||!file.bytes)throw new Error('Protect needs a PDF opened in full. Open it from Protect or unlock a PDF on Home.');passwordWorkspace=new PasswordWorkspace(file,{announce,element,icon,hostReader:pdfReader,onOpenedFile:async opened=>{passwordWorkspace=null;await accept(opened);},onClosed:()=>{passwordWorkspace=null;}});return passwordWorkspace.open();},onFindTool:query=>actionPanel.open(query),...(large?{}:{onSecurityReport:()=>showPdfSecurityReport(file,{announce,hostReader:pdfReader}),onCertificates:()=>showPdfCertificateReport(file,{announce}),onOcr:()=>openOcr(file),onEditCopy:editCopy}),onEditContent:()=>openContentWorkspace(file),onBlankPages:()=>{const reader=pdfReader;blankReview=new ScanBlankReview(file,reader,{element,announce,icon,onClosed:()=>{blankReview=null;},onSelect:async selection=>{if(state.file!==file||pdfReader!==reader||reader.disposed||selection.sourceId!==file.id)throw new Error('The original file changed during blank-page review.');await openPageWorkspace(file,selection);}});return blankReview.open();},onCreateForms:()=>{formBuilderWorkspace=new FormBuilderWorkspace(file,{announce,element,icon,hostReader:pdfReader,onClosed:()=>{formBuilderWorkspace=null;}});return openCancelableWorkspace(formBuilderWorkspace);},onForms:()=>openFormWorkspace(file),onMarkup:(options={})=>{if(markupWorkspace&&!markupWorkspace.closed)return;markupWorkspace=new MarkupWorkspace(file,{announce,element,icon,initialTool:options.initialTool==='note'?'note':undefined,initialPage:Number.isInteger(options.initialPage)?options.initialPage:undefined,onClosed:()=>{markupWorkspace=null;}});return markupWorkspace.open();},onRedact:()=>{redactionWorkspace=new RedactionWorkspace(file,{announce,element,icon,onClosed:()=>{redactionWorkspace=null;}});return redactionWorkspace.open();},onCompress:()=>new CompressionWorkspace(file,pdfReader,{announce,element,icon}).open(),onOrganize:()=>openPageWorkspace(file),onSheetSet:()=>run(()=>openSheetSet(file)),onCompare:()=>run(()=>openPdfComparison(pdfReader))});
    captureOpenedPreview(pdfReader,file);registerContentTextMethods(pdfReader,file);pdfReader.opening=pdfReader.open().catch(error=>announce(error.message,true));return;
  }
  if(file.ext==='pptx'){presentationWorkspace=new PresentationWorkspace(area,file,{announce,element,icon});const opened=presentationWorkspace;opened.open().catch(error=>{if(opened.disposed)return;opened.notice.textContent=error.message;opened.status.textContent='Presentation unavailable';announce(error.message,true);});return;}
  if(file.ext==='xlsx'){workbookWorkspace=new WorkbookWorkspace(area,file,{announce,element,icon});const opened=workbookWorkspace;opened.open().catch(error=>{if(opened.disposed)return;opened.notice.textContent=error.message;opened.status.textContent='Workbook unavailable';announce(error.message,true);});return;}
  if(['docx','rtf','txt','md','markdown','json','xml','yaml','yml','csv'].includes(file.ext)){
    header.querySelector('.original-copy')?.remove();/* The editor's File tab has it; one Save at the top, like Word. */documentEditor?.dispose();documentEditor=new DocumentEditor(area,file,{announce,element,icon,
      // A Markdown or CSV source turned into a formatted document reopens in the rich editor, like text taken from a PDF.
      // New-document copies keep their original draft until the explicit saved-copy choice.
      openFormatted:async(content,importWarning)=>{const current=documentEditor;await current?.dispose();if(documentEditor===current)documentEditor=null;if(file.id)await window.pdfix.clearDraft(file.id).catch(()=>{});state.file={...file,ext:'docx',initialContent:content,importWarning};sessionStore().visibleKey=null;render();}});const openedEditor=documentEditor;openedEditor.opening=documentEditor.open();openedEditor.opening.catch(e=>{if(openedEditor.disposed||openedEditor.departing)return;const warning=area.querySelector('.editor-warning');if(warning)warning.textContent=e.message;const notes=area.querySelector('.editor-import-notes');if(notes){notes.open=true;notes.querySelector('summary').textContent='Document error';}const status=area.querySelector('.draft-status');if(status)status.textContent='Document unavailable';announce(e.message,true);});return;
  }
  if(['tif','tiff'].includes(file.ext)){const workspace=new TiffWorkspace(area,file,{announce,setGuard:value=>window.pdfix.editorGuard(value||retainedEditorGuard()),beforeImport:async()=>{await prepareDrawingDeparture();const editor=activeEditor();if(editor!==workspace)await editor?.prepareDeparture();await window.pdfix.editorGuard(true);return true;},onImported:async opened=>{await accept(opened);if(opened.tiffWarnings?.length)announce(opened.tiffWarnings.join(' '),true);}});tiffWorkspace=workspace;workspace.open().catch(error=>announce(error.message,true));return;}
  if(['png','jpg','jpeg','webp','bmp'].includes(file.ext)){imageWorkspace=new ImageWorkspace(area,file,{announce,element,icon});imageWorkspace.open().catch(error=>announce(error.message,true));return;}
  const panel=element('div',undefined,'file-summary');panel.innerHTML=icon('files');panel.append(element('h1',file.name),element('p','Opened locally. Your original file is unchanged.','subtitle'));
  const chips=element('div',undefined,'capability-chips');const f=formatFor(file.ext);['open','preview','edit','convert'].forEach(k=>chips.append(element('span',`${k[0].toUpperCase()+k.slice(1)} · ${f[k]?'available':'not yet'}`,f[k]?'enabled':'')));panel.append(chips,element('p',f.summary,'footnote'));area.append(panel);
}
async function openSheetSet(file){
  if(!pdfSourceCapabilities(file).wholeFileTools)throw new Error(LARGE_PDF_TOOL_MESSAGE);
  if(sheetSetWorkspace&&!sheetSetWorkspace.closed)return;
  const workspace=new SheetSetWorkspace(file,{announce,element,icon,onClosed:()=>{if(sheetSetWorkspace===workspace)sheetSetWorkspace=null;}});
  sheetSetWorkspace=workspace;
  try{await workspace.open();}catch(error){await workspace.close(true).catch(()=>{});throw error;}
}
async function openPdfComparison(reader){
  if(!reader||reader.disposed||!reader.doc)throw new Error('Open the original PDF before comparing drawings.');
  if(!pdfSourceCapabilities(reader.file).wholeFileTools)throw new Error(LARGE_PDF_TOOL_MESSAGE);const file=reader.file,doc=reader.doc,other=await window.pdfix.pickAdditional('compare');
  if(!other)return;
  if(reader!==pdfReader||reader.disposed||reader.file!==file||reader.doc!==doc)throw new Error('The original drawing changed. Open comparison again.');
  if(other.ext!=='pdf')throw new Error('Choose another PDF to compare.');
  await new PdfComparison([{name:file.name,doc,copyAllowed:reader.copyAllowed}],{name:other.name,bytes:other.bytes},{announce,element,hostReader:reader}).open();
}
async function openOcr(file){if(!pdfSourceCapabilities(file).wholeFileTools){announce(LARGE_PDF_TOOL_MESSAGE,true);return;}await pdfReader.showToolGroup?.('Edit');for(const host of pdfReader.pageToolHosts||[])host.suspend();new OcrWorkspace(file,pdfReader,{announce,element,icon,onEdit:async content=>{await newDocument({title:file.name.replace(/\.pdf$/i,'')+' text copy',initialContent:content,importWarning:'Reviewed OCR and selectable text imported into an editable copy. Scan images, columns, tables and page layout do not carry over. Review before exporting.'});}}).open();}
function renderWorkspaceHub(main){heading(main,'All tools','Every PDFix tool, in the same groups as the tool bar of an open PDF.');renderWorkspaceRooms(main,[['files','Windows right-click PDF tools','Add PDFix to the menu you get when you right-click a PDF in File Explorer.',openWindowsContext],['files','Watched-folder workflows','Pick a folder and a task; PDFix offers to process each new file that arrives there.',openWatchedFolders],['files','Prepare signing request','Mark where others sign, date and initial, then create an email to send it.',()=>pick('signature-request')],['files','Open a synchronized file','Open a file from a OneDrive, Google Drive or Dropbox folder on this PC and check it is fully downloaded.',openCloudFile],['files','Create from email or clipboard','Start a document from a saved email, or paste text or a picture, then edit it and save a PDF.',openEmailClipboard],['shield','Verify PDF fingerprint','Check a PDF is exactly the file you were sent by comparing its fingerprint (SHA-256).',openFileFingerprint],['scan','Scan to PDF','Scan pages from a connected scanner, put them in order and save a PDF.',openScanner],['grid','Extract a table','Draw around a table in a PDF, check the cells, then save it as Excel or CSV.',()=>pick('tables')],['files','Bates numbering across PDFs','Stamp running page numbers (like ABC000123) across several PDFs for legal or audit sets.',openBatchBates],['down','Compress several PDFs','Make several PDFs smaller at once and save the copies to a new folder.',openBatchCompression],['files','Batch copy, rename or export text','Copy, rename or save the text of several PDFs in one go.',openBatchDocumentActions],['search','Search selected files','Search for words in several PDFs and documents at once and jump to each match.',openSelectedFileSearch],['files','Edit slide text','Open a PowerPoint file, change the words on its slides and save a copy.',()=>pick('slides')],['grid','Edit a workbook','Open an Excel file, change cell values and save a copy or a CSV.',()=>pick('workbook')],['files','Read a PDF','Open a PDF to read, search, zoom and print it.',()=>pick('read')],['files','Document health report','Check a PDF for problems such as mixed page sizes, missing text or broken links, and save a report.',()=>pick('health')],['grid','Drawing takeoffs','Set the drawing scale, then measure lengths and areas and count items into a list.',()=>pick('takeoff')],['grid','Drawing sheet sets','Keep the sheets of a drawing set together, move between them and swap in revisions.',()=>pick('sheet-set')],['files','Compare drawing revisions','Review two PDFs side by side or align their drawing overlays.',()=>pick('compare')],['files','Review drawing comments','See every comment on a drawing, follow replies, jump to each one and save a comment list.',()=>pick('review')],['files','Mark up a drawing','Add notes, lines, arrows, revision clouds and callouts, then review a PDF copy.',()=>pick('markup')],['files','Page numbers and stamps','Add page numbers, headers, footers, watermarks or stamps like APPROVED.',()=>pick('decorate')],['grid','Edit PDF page boxes','For print work: check and change a PDF\'s trim, bleed and crop areas.',()=>pick('page-boxes')],['files','Print-production marks','For print work: add crop, bleed and registration marks to pages.',()=>pick('print-marks')],['files','Inspect and repair thin lines','Find lines too thin to print well and thicken them in a copy.',()=>pick('thin-lines')],['files','Name and save unchanged copy','Save a copy of an opened file under a clear new name, without changing it.',()=>pick('smart-name')],['files','Edit the PDF outline','Add, rename and order the bookmarks shown beside a PDF.',()=>pick('outline')],['grid','Create fillable fields','Turn a PDF into a form: draw boxes people can type into, tick or choose from.',()=>pick('create-forms')],['files','Virtual PDF printer','Make a PDF from any program by choosing PDFix as the printer.',openVirtualPrinter],['files','New document','Write a new document with headings, lists, tables and pictures, and save it as Word or PDF.',()=>run(newDocument)],['files','Open a document','Open a Word, RTF or text file to edit it, then save.',()=>pick('document')],['files','Edit PDF text and images','Click the text in a PDF to change it, or add new text and pictures, then save a copy.',()=>pick('content')],['grid','Organize pages','Drag pages into order, turn, remove or pull out pages, or join PDFs into one.',()=>pick('pages')],['files','Fill and sign','Type into a PDF form\'s fields, add your signature, then save a signed copy.',()=>pick('forms')],['shield','Protect or unlock a PDF','Add a password to a PDF, or remove one you know.',()=>pick('password')],['shield','Redact a PDF','Box the parts to hide; PDFix removes them for good in a clean copy.',()=>pick('redact')],['down','Compress a PDF','Compare size and picture quality, then save the smaller copy.',()=>pick('compress')],['convert','PDF to images','Save chosen PDF pages as PNG or JPEG pictures.',()=>pick('images')],['convert','Image to PDF','Put pictures into one PDF, in the order you choose, with optional crop.',()=>pick('image')]],{element,icon});}
function renderAI(main) { aiDisposer=renderAiConnections(main,{announce,getContext:chooseAiSourceContext}); }
// Settings explanations keep their first sentence on screen; the rest opens with "More about this".
function foldLongCards(root,selector='.info-card > p'){for(const p of root.querySelectorAll(selector)){const text=p.textContent;if(p.children.length||text.length<220)continue;const cut=text.search(/[.!?]\s/);if(cut<0||cut>200)continue;const more=document.createElement('details');more.className='tool-details';const summary=document.createElement('summary');summary.textContent='More about this';const rest=document.createElement('p');rest.textContent=text.slice(cut+2);more.append(summary,rest);p.textContent=text.slice(0,cut+1);if(p.tagName==='TD')p.append(more);else p.after(more);}}
function renderSettings(main) { heading(main,'A private place for your files','Your files are worked on here, on this computer. Choose how PDFix looks and behaves.');const card=element('div',undefined,'info-card');const versionLine=element('p','PDFix version …','settings-version');window.pdfix.appInfo?.().then(info=>{versionLine.textContent='PDFix version '+info.version+(info.packaged?'':' (development run)');}).catch(()=>versionLine.remove());card.append(versionLine,element('h2','Local by default'),element('p','File content is processed on your device. The reader blocks online document requests. AI connects only to a local model server after explicit review of the request; online AI providers are disabled. Recent-file names and locations are stored in your local application data, and can be forgotten without deleting files. Editing also stores recovery drafts containing document text on this device; these drafts are not encrypted. Saved visual signatures are also unencrypted and stay on this device until you delete them in Fill and sign. Clearing recovery or recents keeps the saved-signature library. A new document keeps its recovery draft after saving a copy. For an opened file, saving an editable DOCX or matching source-format copy clears the latest draft; simpler exports keep it. Local versions remain until you clear them below.'),element('h2','Saved drawing-review tools'),element('p','Named comment filters and saved drawing styles are stored locally and are not encrypted. Drawing styles can contain default comment text. Delete filters in Review comments, or delete/clear saved tools in Mark up a PDF. Named stamp, watermark, header, footer and page-number templates also store their text and styles locally without encryption. Delete or clear them in Page numbers and stamps. Clearing general recovery or recent files keeps these libraries. Named sheet sets also keep unencrypted original file descriptors, titles and revisions in a separate local library; remove them in Drawing sheet sets. Takeoff quantities are retained only in the current reader until you explicitly export a separate ledger/report or add reviewed annotations into a PDF copy; exported files are not cleared by local recovery controls. Embedded PDFix takeoffs can be recovered after drawing review; names, authors, fingerprints and calibration provenance travel in the recovered ledger. Updating their visible annotations in a copy retains original objects and appearance data, so it is not permanent deletion or redaction. Imported-comment review edits stay in memory unless you explicitly save a portable JSON draft or a reviewed PDF copy. Portable drafts contain unencrypted comment and author text in the file you choose; clearing local recovery does not delete these exported files. Loading requires the exact original and inventory. Save the reviewed copy or explicitly discard the current draft before leaving. XFDF comment exports contain unencrypted source text and geometry; separate JSON receipts preserve the selected source identities, fingerprints and omission notes. Clearing local recovery does not delete those chosen export files. XFDF imports use only an explicitly chosen file and source PDF; imported author/date/identity claims are unverified. Supported new annotations go into a reviewed copy, while private Bluebeam data and custom appearance compatibility remain unsupported.'),element('h2','Copies keep originals safe'),element('p','Save a copy always asks for a new filename. Existing files and opened originals cannot be overwritten.'),element('h2','Keyboard shortcuts'),element('p','F1 / Ctrl Shift P · Search actions and shortcuts. Ctrl O · Open a file. Ctrl K · Find an opened file. F11 · Toggle window fullscreen. Ctrl Shift Enter · Show only the PDF; Escape restores its previous view. Ctrl Shift B · Collapse/expand sidebar. Ctrl Shift F · Toggle focus mode. Alt Left / Alt Right · Previous / next PDF view. H · Toggle the PDF hand tool with page focus. Ctrl + mouse wheel · Zoom around the pointer. + / − · Zoom with page focus. Ctrl F · Search an opened PDF. F3 / Shift F3 · Next / previous search match. Enter / Shift Enter · Step through matches from the search box. Ctrl D · Save a PDF page bookmark. Tab · Move between controls. Esc · Close a dialog, exit fullscreen or leave focus mode.'),element('h2','About this version'),element('p','This is a test version of PDFix. If something looks wrong or confusing, note what you were doing, then save a problem report and send it in. Some tools only support part of what other programs can do; each tool says what it keeps and what it leaves out.'));{const report=element('button','Save a problem report','secondary');report.onclick=saveProblemReport;card.append(report,element('p','The report lists recent events and error messages with your system details. It contains no document contents, and file names and folders are blanked out. Nothing is sent: you choose where to save it and whether to share it.','footnote'));}main.append(card);recentPreviewSettings(card,{announce});markupDefaultSettings(card,{announce});readingAppearanceControls(card,{announce});interfaceAccessibilityControls(card,{announce});if(window.pdfix){readingCapacity(card);formBuilderPrivacy(card,{announce});securityStatus(card);privacyControls(card,{announce,onRecents:recents=>{state.recents=recents;}});} }
function showInfo(title,text) { const dialog=document.querySelector('#info-dialog');dialog.querySelector('h2').textContent=title;dialog.querySelector('.dialog-body').textContent=text;dialog.showModal(); }
shell();window.pdfix?.onOutputWarning?.(message=>announce(message,true));initializeInterfaceAccessibility();initializeReadingAppearance();
appViewControls=layoutControls(app,{icon,announce});
let appClosePending=false;
if(window.pdfix)window.pdfix.onCloseRequested(async()=>{if(appClosePending)return;appClosePending=true;try{const store=sessionStore(),sessions=[...store.parked.values(),...(store.visibleKey?[{file:state.file,controllers:store.read()}]:[])],changed=sessions.filter(sessionHasChanges);const choice=changed.length?await askCloseWork(changed.map(session=>session.file.name)):'drafts';if(choice==='keep')return;const finish=async()=>{if(choice==='discard')for(const session of changed){await discardSessionRecovery(session);if(session.file.isNew&&session.file.newKey)forgetNewDocument(session.file.newKey);}await window.pdfix.finishClose();};await sessionStore().flushAll();await virtualPrinterWorkspace?.prepareDeparture();await scannerClose?.();await pdfReader?.prepareDeparture?.();await pdfReader?.tableExtractionWorkspace?.prepareDeparture();await batchCompressionWorkspace?.prepareDeparture();await batchBatesWorkspace?.prepareDeparture();await batchDocumentActionsWorkspace?.prepareDeparture();await selectedFileSearch?.prepareDeparture();await sheetSetWorkspace?.prepareDeparture();await pdfReader?.measurements?.prepareDeparture?.();await blankReview?.prepareDeparture();await formBuilderWorkspace?.prepareDeparture();await pdfReader?.reviewPanel?.prepareDeparture();await pdfReader?.bookmarkWorkspace?.prepareDeparture();await pdfReader?.decorationWorkspace?.prepareDeparture();await pdfReader?.sanitizeWorkspace?.prepareDeparture();await pdfReader?.attachmentsWorkspace?.prepareDeparture();await pdfReader?.printWorkspace?.prepareDeparture();if(pdfImageExport&&!pdfImageExport.closed){await pdfImageExport.prepareDeparture();await finish();return;}if(contentWorkspace&&!contentWorkspace.closed){await contentWorkspace.prepareDeparture();await finish();return;}if(pageWorkspace&&!pageWorkspace.closed){await pageWorkspace.prepareDeparture();await finish();return;}if(passwordWorkspace&&!passwordWorkspace.closed){await passwordWorkspace.prepareDeparture();await finish();return;}if(redactionWorkspace&&!redactionWorkspace.closed){await redactionWorkspace.prepareDeparture();await finish();return;}if(formWorkspace&&!formWorkspace.closed){await formWorkspace.prepareDeparture();await finish();return;}if(markupWorkspace&&!markupWorkspace.closed){await markupWorkspace.prepareDeparture();await finish();return;}{const exporting=activeEditor()?.pdfExport;if(exporting&&!exporting.closed&&!exporting.saving)await exporting.close();}if(activeEditor()?.saving){announce('Finish exporting the copy before closing.');return;}await activeEditor()?.prepareDeparture();await finish();}catch(error){announce(error.message,true);}finally{appClosePending=false;}});
if (window.pdfix) { try { await window.pdfix.setOpenFilesMode('tabs');const result=await window.pdfix.workspace();state.recents=result.recents;render();if(location.hash==='#editor')await newDocument();if(result.warning)announce(result.warning,true); } catch(e) {render();announce(e.message,true);} }
else render();

let lastLargePdfProgress=0;
if(window.pdfix?.onFileOpenProgress)window.pdfix.onFileOpenProgress(progress=>{if(!progress||typeof progress.name!=='string'||!Number.isFinite(progress.size)||progress.size<=0)return;if(progress.stage==='preparing'){lastLargePdfProgress=performance.now();announce(`Preparing ${progress.name} (${sizeLabel(progress.size)}). Large or complex PDFs may take longer; your original stays unchanged.`);}else if(progress.stage==='progress'&&Number.isFinite(progress.bytes)&&progress.bytes>=0&&progress.bytes<=progress.size){if(performance.now()-lastLargePdfProgress<3000)return;lastLargePdfProgress=performance.now();const percent=Math.floor(progress.bytes/progress.size*100);announce(`Preparing ${progress.name}: ${percent}%. The app is creating a local reading snapshot.`);}});
