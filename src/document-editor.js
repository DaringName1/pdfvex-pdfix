import {installDocumentStatus} from './document-status.js';
import {Extension} from '@tiptap/core';
import {applyDocxParagraphs,wordHeadingAnchors} from './docx-paragraph-layout.js';
import {newDocumentName,rememberNewDocument} from './new-documents.js';
import {applyImportedTableGrids} from './document-grid-import.js';
import {importedBandLayout} from './document-band-import.js';
import {DocumentImage,DocumentImageControls} from './document-images.js';
import LIMITS from '../desktop/document-limits.cjs';
import {validateDocumentImages,validateDocumentImage} from './document-image-model.js';
import {DocumentTable,DocumentTableRow,DocumentTableCell,DocumentTableHeader,DocumentTableControls} from './document-tables.js';
import {validateDocumentTables} from './document-table-model.js';
import {SourcePreview} from './source-preview.js';
import {DocumentZoom} from './document-zoom.js';
import {DocumentTextStyle,DocumentAlignment,DocumentFormattingControls} from './document-formatting.js';
import {DocumentFind,DocumentFindHighlights} from './document-find.js';
import {DocumentPageBreak} from './document-page-break.js';
import {defaultDocumentLayout,documentLayout,DocumentLayoutControls} from './document-layout.js';
import {DocumentPdfExport} from './document-pdf-export.js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {sanitizeDocumentHTML} from './document-html.js';
import { textDocument, plainText } from './document-codec.js';
import { VersionHistory } from './version-history.js';
import { DocumentStatistics } from './document-statistics.js';
import {DocumentTextTools} from './document-text-tools.js';
import {DocumentSpellingHighlights} from './document-spelling.js';
import {DocumentPages} from './document-pages.js';import {installDocumentMode} from './document-mode.js';
import {documentPaperSize,documentPageMargins} from './document-layout-model.js';
import {DocumentToolbar} from './document-toolbar.js';
import {DocumentLink,DocumentHeadingAnchor,DocumentLinkControls} from './document-links.js';
import {restoreDocumentSnapshot} from './document-snapshot.js';
import {DocumentParagraphFormat} from './document-paragraph.js';
import {DocumentSuperscript,DocumentSubscript,DocumentHighlight} from './document-marks.js';
import {normalizePastedHTML} from './document-paste.js';
import {formattedSourceKind,formattedSourceDocument,markdownImageTargets} from './source-to-document.js';
import {Slice} from '@tiptap/pm/model';
import {Selection} from '@tiptap/pm/state';
// Ctrl+End / Ctrl+Home always go to the true end / start of the document, as in Word. Left to the browser they did
// nothing when the caret sat on the editor's frame (found by the user robot after opening a Word file).
const moveTo=(editor,atEnd)=>{const {state,view}=editor;view.dispatch(state.tr.setSelection(atEnd?Selection.atEnd(state.doc):Selection.atStart(state.doc)).scrollIntoView());if(!view.hasFocus())view.focus();return true;};
// Ctrl+End / Ctrl+Home always set the editor's own selection to the true end / start in the same keystroke, so the
// next key (Enter, typing) acts there. Leaving it to the browser alone could leave a stale selection: after a dialog
// paused editing and an undo/redo, Enter then replaced the line just typed (found by the robot on the spare PC). When
// the caret is in text the browser still moves its own caret too; on the frame or an empty paragraph it does nothing.
const fallbackMove=(editor,atEnd)=>{const root=editor.view.dom,anchor=root.ownerDocument.getSelection()?.anchorNode;moveTo(editor,atEnd);return !(anchor?.nodeType===3&&root.contains(anchor));};
const DocumentEnds=Extension.create({name:'documentEnds',addKeyboardShortcuts(){return {'Mod-End':()=>fallbackMove(this.editor,true),'Mod-Home':()=>fallbackMove(this.editor,false)};}});

const NAME_KEY='pdfix-new-document-name';
const IN_PLACE_TEXT=['txt','md','markdown','json','xml','yaml','yml','csv'];
const SOURCES=new Set(['md','markdown','json','xml','yaml','yml','csv']);
export class DocumentEditor {
  constructor(root,file,ui){this.root=root;this.file=file;Object.assign(this,ui);this.disposed=false;this.sourceMode=SOURCES.has(file.ext);this.pending=Promise.resolve();this.revision=0;this.draftWrites=0;this.layout=defaultDocumentLayout(this.sourceMode);}
  async job(input){
    if(input.action==='import'){this.richImporting=true;this.richOpening=this.whenEngineFree(()=>window.pdfix.readRichDocx(this.file.id)).finally(()=>{this.richImporting=false;});const parsed=await this.richOpening;if(this.disposed||this.departing)throw new Error('Document import stopped before leaving.');const {snapshot,paragraphs,...generic}=parsed,normalized=await this.job({action:'normalize-imported-images',...generic});return {...normalized,...(snapshot?{snapshot}:{}),...(paragraphs?{paragraphs}:{})};}
    if(input.action==='import-rtf'){this.richImporting=true;this.richOpening=this.whenEngineFree(()=>window.pdfix.readRichRtf(this.file.id)).finally(()=>{this.richImporting=false;});return this.richOpening;}
    const worker=new Worker(new URL('./document.worker.js',import.meta.url),{type:'module'});this.worker=worker;
    return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{worker.terminate();reject(new Error('Document processing exceeded 60 seconds. Try a smaller file.'));},60000);this.jobTimer=timer;this.rejectJob=reject;worker.onmessage=({data})=>{clearTimeout(timer);worker.terminate();data.error?reject(new Error(data.error)):resolve(data.value);};worker.onerror=()=>{clearTimeout(timer);worker.terminate();reject(new Error('Document processing failed. Try a fresh copy.'));};worker.postMessage(input);});
  }
  async open(){
    this.root.classList.toggle("source-editor-mode",this.sourceMode);
    this.root.innerHTML=`<div class="editor-toolbar" role="toolbar" aria-label="Document formatting"><select aria-label="Paragraph style"><option value="0">Normal text</option><option value="1">Heading 1</option><option value="2">Heading 2</option><option value="3">Heading 3</option><option value="4">Heading 4</option><option value="5">Heading 5</option><option value="6">Heading 6</option></select><button data-command="bold" aria-label="Bold"><b>B</b></button><button data-command="italic" aria-label="Italic"><i>I</i></button><button data-command="underline" aria-label="Underline"><u>U</u></button><button data-command="strike" aria-label="Strikethrough"><s>S</s></button><button data-command="superscript" aria-label="Superscript">X<sup>2</sup></button><button data-command="subscript" aria-label="Subscript">X<sub>2</sub></button><span class="toolbar-separator"></span><button data-command="bulletList" aria-label="Bulleted list">• List</button><button data-command="orderedList" aria-label="Numbered list">1. List</button><span class="toolbar-separator"></span><button data-command="undo" aria-label="Undo">↶</button><button data-command="redo" aria-label="Redo">↷</button><button data-find-document>Find / replace</button><button class="compact" data-document-spelling>Spell check</button><button class="compact" data-document-speech>Read aloud</button><button data-page-break title="Ctrl+Enter">Page break</button><div class="editor-exports"><button class="secondary compact" data-text>Save text copy</button><button class="primary compact" data-docx>Export DOCX copy</button><button class="secondary compact" data-rtf>Export RTF copy</button><button class="secondary compact" data-pdf>Export PDF copy</button><button class="secondary compact" data-print title="Print this document (Ctrl+P)">Print</button></div></div><details class="editor-import-notes"><summary>Format &amp; import notes</summary><p class="editor-warning"></p></details><div class="editor-canvas" role="region" aria-label="Document page area"><article class="editor-page"><div class="editor-mount"></div></article></div><div class="editor-footer"><span class="word-count"></span><span class="draft-status">Opening…</span></div>`;
    let content=this.file.initialContent||textDocument('');
    this.warning=this.root.querySelector('.editor-warning');
    // What a conversion changed is kept under File > Format & import notes; say so on opening, since the editor opens on Home.
    if(this.file.initialContent){this.warning.textContent=this.file.importWarning||'';if(this.file.importWarning){const first=this.file.importWarning.split(/(?<=\.)\s/)[0];setTimeout(()=>{if(!this.disposed)this.announce?.(first+' What changed is listed under File > Format & import notes.');},300);}}
    else if(this.file.bytes){
      if(this.file.ext==='docx'){
        this.warning.textContent='Importing an editable copy. Headers and footers can be edited in Layout > Page setup; any header or footer PDFix cannot keep is named in the notes below. Paragraph alignment, indents and the listed spacing values are kept when set on the paragraph itself; fonts, other spacing and placement are simplified. Embedded PNG and JPEG pictures become editable pictures; floating positions and text wrapping are simplified. Supported table cells, spans and text remain editable; original table border styles are simplified. Supported declared column proportions are retained only when uniquely matched. Review before exporting.';
        this.gridInspecting=true;const grids=typeof window.pdfix.inspectDocumentTableGrids==='function'?window.pdfix.inspectDocumentTableGrids(this.file.id).catch(error=>({error:error.message})).finally(()=>{this.gridInspecting=false;}):Promise.resolve({error:'the contained grid API is unavailable'}).finally(()=>{this.gridInspecting=false;});const imported=await this.job({action:'import',bytes:this.file.bytes});if(this.disposed||this.departing)return;this.importedGridReport=await grids;if(this.disposed||this.departing)return;
        content=sanitizeDocumentHTML(wordHeadingAnchors(applyDocxParagraphs(imported.html,imported.paragraphs).html));
        // A copy PDFix saved itself reopens with its own formatting when the file is unchanged since.
        if(imported.snapshot)try{const restored=restoreDocumentSnapshot(imported.snapshot,content);content=restored.content;this.restoredLayout=restored.layout;this.warning.textContent='Reopened a document saved by PDFix with its formatting and page setup. Changes made in another program would switch this to the simplified Word import.';}catch(error){this.warning.textContent+=' Saved PDFix formatting was not used ('+String(error.message).slice(0,200)+'); this is the simplified Word import.';}
        if(imported.warnings.length&&imported.warnings.some(note=>/pictures? (was|were) left out/.test(note)))this.announce(imported.warnings.find(note=>/pictures? (was|were) left out/.test(note)),true);if(imported.warnings.length)this.warning.textContent+=' Import notes: '+imported.warnings.slice(0,4).map(note=>String(note).slice(0,400)).join(' ') +(imported.warnings.length>4?` (${imported.warnings.length} total notes.)`:'');
      }else if(this.file.ext==='rtf'){
        this.warning.textContent='Importing a simplified editable RTF copy…';
        const imported=await this.job({action:'import-rtf',bytes:this.file.bytes});if(this.disposed||this.departing)return;
        content=imported.doc;this.importedRtfBands=imported.bands;this.importedRtfPage=imported.page;this.warning.textContent=imported.warnings.join(' ');
      }else {
        if(this.file.bytes.length>2*1024*1024)throw new Error('Text editing is limited to 2 MB. Open a smaller file.');
        let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(this.file.bytes);}catch{throw new Error('This editor supports UTF-8 text. Convert the file encoding before editing.');}
        this.text=text;content=textDocument(text);
        this.warning.textContent=this.sourceMode?'Source editing preserves the text format. JSON/XML/YAML/CSV syntax and schemas are not automatically validated.':'TXT keeps plain text only. Export a DOCX copy to keep headings, lists and emphasis.';
      }
    }
    let draft;try{draft=await window.pdfix.loadDraft(this.draftId);}catch(error){this.warning.textContent+=' '+error.message;this.root.querySelector('.editor-import-notes').open=true;this.announce(error.message,true);}if(this.disposed||this.departing)return;if(draft?.layout)try{this.layout=documentLayout(draft.layout);}catch(error){this.announce(error.message,true);}
    if(this.sourceMode){
      this.root.querySelector('.editor-toolbar select').disabled=true;this.root.querySelectorAll('[data-command]').forEach(b=>b.disabled=true);this.root.querySelector('[data-docx]').hidden=true;this.root.querySelector('[data-rtf]').hidden=true;this.root.querySelector('[data-page-break]').hidden=true;this.root.querySelector('[data-text]').textContent='Save source copy';
      this.input=document.createElement('textarea');this.input.className='source-editor';this.input.setAttribute('aria-label','Editable source text');this.input.spellcheck=false;this.input.value=draft?.kind==='source'?draft.text:this.text||'';this.root.querySelector('.editor-mount').append(this.input);this.input.addEventListener('input',()=>this.changed());
    }else{
      this.editor=new Editor({element:this.root.querySelector('.editor-mount'),extensions:[DocumentEnds,StarterKit.configure({heading:{levels:[1,2,3,4,5,6]},link:false}),DocumentPageBreak,DocumentFindHighlights,DocumentSpellingHighlights,DocumentPages.configure({metrics:()=>this.pageMetrics()}),DocumentTextStyle,DocumentLink,DocumentHeadingAnchor,DocumentAlignment,DocumentParagraphFormat,DocumentSuperscript,DocumentSubscript,DocumentHighlight,DocumentTable.configure({onLimit:message=>this.announce(message,true),validate:doc=>validateDocumentImages(doc)}),DocumentTableRow,DocumentTableCell,DocumentTableHeader,DocumentImage],content:draft?.kind==='rich'?draft.content:content,editorProps:{attributes:{'aria-label':'Editable document',role:'textbox','aria-multiline':'true'},// Pasting into an empty paragraph keeps the pasted paragraph's own alignment, indent and heading level
      // instead of pouring its text into the empty one.
      transformPasted:(slice,view)=>{const {$from,empty}=view.state.selection,first=slice.content.firstChild;return empty&&slice.openStart>0&&$from.parent.isTextblock&&!$from.parent.content.size&&first?.isTextblock&&$from.depth===1?new Slice(slice.content,0,0):slice;},transformPastedHTML:html=>{try{return sanitizeDocumentHTML(normalizePastedHTML(html));}catch(error){this.announce(error.message,true);return '';}}},// Opening can normalize the document (for example a trailing paragraph after a list). That is not a user edit.
      onUpdate:()=>{if(!this.ready&&!this.editor?.isFocused)return;this.changed();},onSelectionUpdate:()=>this.formatState()});
      this.validateDocument(this.editor.getJSON());if(this.restoredLayout&&!draft)this.layout=this.restoredLayout;if(this.importedGridReport&&draft?.kind!=='rich'&&!this.restoredLayout){const notices=await applyImportedTableGrids(this,this.importedGridReport);if(this.disposed||this.departing)return;this.warning.textContent+=' '+notices.join(' ');if(!this.importedGridReport.error&&this.importedGridReport.bands){this.layout=importedBandLayout(this.layout,this.importedGridReport.bands);if(this.importedGridReport.page)try{this.layout=documentLayout({...this.layout,...this.importedGridReport.page});}catch(error){this.warning.textContent+=' Original page size omitted: '+error.message;}const bandNotes=(this.importedGridReport.notices??[]).filter(note=>/header|footer|section/i.test(note));this.warning.textContent+=' '+bandNotes.slice(0,6).join(' ')+(bandNotes.length>6?` (${bandNotes.length} band import notes total.)`:'');}}if(this.importedRtfBands&&draft?.kind!=='rich'){this.layout=importedBandLayout(this.layout,this.importedRtfBands);if(this.importedRtfPage)try{this.layout=documentLayout({...this.layout,...this.importedRtfPage});}catch(error){this.warning.textContent+=' Original page size omitted: '+error.message;}}this.tables=new DocumentTableControls(this);this.images=new DocumentImageControls(this);this.links=new DocumentLinkControls(this);
      this.root.querySelectorAll('[data-command]').forEach(b=>{b.addEventListener('mousedown',e=>e.preventDefault());b.addEventListener('click',()=>{const command=b.dataset.command;const chain=this.editor.chain().focus();if(['undo','redo'].includes(command))chain[command]().run();else chain[`toggle${command[0].toUpperCase()+command.slice(1)}`]().run();this.formatState();});});
      this.root.querySelector('select').addEventListener('change',e=>{const level=Number(e.target.value);level?this.editor.chain().focus().setHeading({level}).run():this.editor.chain().focus().setParagraph().run();});
    }
    if(this.sourceMode)this.sourcePreview=new SourcePreview(this);
    this.formatting=new DocumentFormattingControls(this);
    this.layoutControls=new DocumentLayoutControls(this);this.zoom=new DocumentZoom(this);this.find=new DocumentFind(this);this.statistics=new DocumentStatistics(this);this.textTools=new DocumentTextTools(this);this.root.querySelector('[data-find-document]').onclick=()=>this.find.show();
    this.root.querySelector('[data-page-break]').onclick=()=>this.editor?.chain().focus().insertPageBreak().run();
    this.root.querySelector('[data-text]').addEventListener('click',()=>this.save(this.sourceMode?this.file.ext:'txt'));
    this.root.querySelector('[data-docx]').addEventListener('click',()=>this.save('docx'));
    this.root.querySelector('[data-rtf]').addEventListener('click',()=>{this.announce('RTF copies keep basic text formatting and page setup. Pictures, tables (with merged and shaded cells) and lists are kept and reopen as such in PDFix.');this.save('rtf');});
    this.root.querySelector('[data-pdf]').onclick=()=>{if(this.saving||this.departing)return;this.pdfExport=new DocumentPdfExport(this);this.pdfExport.open().catch(error=>this.announce(error.message,true));};
    // Print: the same page setup and PDF pages as Export PDF, previewed, then handed straight to print preparation.
    this.root.querySelector('[data-print]').onclick=()=>{if(this.saving||this.departing)return;this.pdfExport=new DocumentPdfExport(this);this.pdfExport.openForPrint().catch(error=>this.announce(error.message,true));};
    this.root.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&!event.shiftKey&&!event.altKey&&event.key.toLowerCase()==='p'){event.preventDefault();this.root.querySelector('[data-print]')?.click();}});
    const history=document.createElement('button');history.className='secondary history-button';history.textContent='Version history';history.onclick=()=>{if(this.saving||this.departing)return;this.versionView?.dispose();this.versionView=new VersionHistory(this);this.versionView.open().catch(error=>this.announce(error.message,true));};this.root.querySelector('.editor-exports').prepend(history);
    this.recoveryAlert=document.createElement('div');this.recoveryAlert.className='recovery-alert';this.recoveryAlert.hidden=true;this.recoveryAlert.setAttribute('role','alert');this.recoveryAlert.innerHTML='<p>These edits could not be kept in recovery. Retry or export a copy before leaving; the editor will stay open.</p><button class="secondary compact">Retry recovery save</button>';this.recoveryAlert.querySelector('button').onclick=()=>this.flush().catch(()=>{});this.root.querySelector('.editor-import-notes').after(this.recoveryAlert);
    // New documents share one recovery draft, so the chosen name is remembered beside it.
    if(this.file.isNew)try{const saved=this.file.newKey?newDocumentName(this.file.newKey):localStorage.getItem(NAME_KEY);if(draft&&saved)this.rename(saved,false);else if(!draft&&!this.file.newKey)localStorage.removeItem(NAME_KEY);}catch{}
    this.toolbar=new DocumentToolbar(this);this.documentStatus=installDocumentStatus(this,{kind:'document'});this.modeControls=installDocumentMode(this);this.formatState();
    try{await window.pdfix.checkpoint(this.draftId,this.snapshot(),draft?'Recovered draft':'Opened document');}catch(error){this.announce('Editing is available, but '+error.message,true);}if(this.disposed||this.departing)return;
    this.root.querySelector('.draft-status').textContent=draft?'Recovered local draft':'Ready to edit';this.updateWords();this.ready=true;this.root.dataset.ready='true';
    this.keyHandler=e=>{if(document.querySelector('dialog[open]')||!this.root.isConnected)return;if(e.ctrlKey&&!e.shiftKey&&e.key.toLowerCase()==='f'){e.preventDefault();this.find.show();return;}if(e.key==='F3'){e.preventDefault();this.find.root.hidden=false;this.find.move(e.shiftKey?-1:1);return;}if(e.ctrlKey&&e.key.toLowerCase()==='s'&&this.root.isConnected){e.preventDefault();this.saveInPlace();}};document.addEventListener('keydown',this.keyHandler);
  }
  rename(value,remember=true){const name=String(value??'').replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim().slice(0,100)||'Untitled document';this.file.name=name;const title=document.querySelector('.document-title');if(title&&this.root.isConnected){title.title=name;const text=title.querySelector('b');if(text)text.textContent=name;}if(remember){if(this.file.newKey)rememberNewDocument(this.file.newKey,name);else try{localStorage.setItem(NAME_KEY,name);}catch{}}}
  // New documents share one recovery draft. Starting blank checkpoints the current one into Version history first.
  async startBlank(){
    if(!this.file.isNew||this.sourceMode||this.saving||this.imageBusy||this.disposed||this.departing)return;this.saving=true;this.guardClose();this.holdEditing(true);
    try{await this.flush();if(this.getText().trim())await window.pdfix.checkpoint(this.draftId,this.snapshot(),'Before starting a blank document');await window.pdfix.clearDraft(this.draftId);try{localStorage.removeItem(NAME_KEY);}catch{}
      this.layout=defaultDocumentLayout(false);this.pdfOptions=null;this.layoutControls?.sync();this.editor.commands.setContent(textDocument(''),{emitUpdate:false});this.rename('',false);this.toolbar?.syncName();this.revision++;this.textTools?.changed();this.modified=false;this.dirty=false;this.pending=Promise.resolve();this.updateWords();this.formatState();this.find?.scan();this.recoveryAlert.hidden=true;
      this.root.querySelector('.draft-status').textContent='Blank document ready';this.announce('Started a blank document. The previous draft is kept in Version history.');}
    catch(error){this.announce('The current draft was kept. '+error.message,true);}finally{this.saving=false;this.guardClose();if(!this.disposed){this.holdEditing(false);this.editor?.commands.focus();}}
  }
  // Markdown or CSV source becomes an editable formatted copy in the same workspace; the source file is not changed.
  async openAsFormatted(){
    const kind=formattedSourceKind(this.file.ext);if(!kind||!this.sourceMode||!this.openFormatted||this.saving||this.imageBusy||this.disposed||this.departing)return;
    try{const images=kind==='markdown'?await this.resolveMarkdownImages(this.input.value):undefined;if(this.disposed)return;const converted=formattedSourceDocument(this.file.ext,this.input.value,this.sourcePreview?.delimiter,{images});this.validateDocument(converted.doc);await this.flush().catch(()=>{});if(this.modified)await window.pdfix.checkpoint(this.draftId,this.snapshot(),'Before opening as a formatted document').catch(()=>{});
      await this.openFormatted(converted.doc,'Converted from '+(kind==='markdown'?'Markdown':'CSV')+' into an editable formatted copy. The source file is unchanged; save a DOCX, RTF or PDF copy from here.'+(converted.notes.length?' '+converted.notes.join(' '):''));}
    catch(error){this.announce(error.message,true);}
  }
  // A document left while it was still importing frees the contained engine a moment after leaving; opening another
  // document in that moment is refused as busy, so the import waits and retries for up to about five seconds.
  async whenEngineFree(read){for(let attempt=0;;attempt++){try{return await read();}catch(error){if(attempt>=10||this.disposed||this.departing||!/Finish or cancel the current/.test(error?.message??''))throw error;await new Promise(resolve=>setTimeout(resolve,500));}}}
  // Pictures a Markdown source refers to, prepared like inserted images: files beside the Markdown file (read by the
  // main process) and embedded data: pictures. Web addresses are left as labels; a picture that fails stays a label.
  async resolveMarkdownImages(source){
    const images=new Map();if(!['md','markdown'].includes(this.file.ext))return images;
    for(const target of markdownImageTargets(source)){
      try{let bytes,mime;const data=/^data:(image\/(?:png|jpeg));base64,([a-z0-9+/=\s]+)$/i.exec(target);
        if(data){mime=data[1].toLowerCase();const binary=atob(data[2].replace(/\s+/g,''));bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));}
        else if(/^[a-z][a-z0-9+.-]*:/i.test(target))continue;else{if(!this.file.id)continue;({bytes,mime}=await window.pdfix.readMarkdownImage(this.file.id,target));}
        if(!bytes.length||bytes.length>LIMITS.IMAGE_SOURCE_BYTES)continue;const prepared=await this.job({action:'image',bytes,mime,alt:''});validateDocumentImage(prepared.attrs);images.set(target,prepared.attrs);
      }catch{}
      if(this.disposed)break;
    }
    return images;
  }
  exportName(){return this.file.copyName??(this.file.isNew?this.file.name:undefined); }
  // Recovery drafts and versions: the opened file, this new document's own key, or the single shared draft from before keys.
  get draftId(){return this.file.id??this.file.newKey??null;}
  // Sheet size for the page view (CSS pixels); none for source files edited as plain text.
  pageMetrics(){if(this.sourceMode||!this.layout)return null;const page=this.root?.querySelector('.editor-page');if(!page)return null;const mm=96/25.4,[,height]=documentPaperSize(this.layout),bands=documentPageMargins(this.layout);
    return {contentHeight:(height-bands.top-bands.bottom)*mm,marginTop:bands.top*mm,marginBottom:bands.bottom*mm,padLeft:bands.left*mm,padRight:bands.right*mm,zoom:parseFloat(page.style.zoom)||1};}
  validateDocument(doc){validateDocumentTables(doc);validateDocumentImages(doc);return doc;}
  getText(){return this.sourceMode?this.input.value:plainText(this.editor.getJSON());}
  snapshot(){return this.sourceMode?{kind:'source',text:this.input.value,layout:{...this.layout}}:{kind:'rich',content:this.editor.getJSON(),layout:{...this.layout}};}
  updateWords(){this.statistics?.changed();}
  formatState(){this.links?.sync();this.images?.sync();this.tables?.sync();this.formatting?.sync();this.toolbar?.sync();if(!this.editor)return;this.root.querySelectorAll('[data-command]').forEach(b=>{if(!['undo','redo'].includes(b.dataset.command))b.setAttribute('aria-pressed',String(this.editor.isActive(b.dataset.command)));});}
  holdEditing(hold){const viewing=this.interactionMode==='view';this.editor?.setEditable(!hold&&!viewing,false);if(this.input)this.input.readOnly=hold||viewing;if(this.toolbar)this.toolbar.setLocked(hold);else this.root.querySelector('.editor-toolbar').inert=hold;if(this.layoutControls)this.layoutControls.root.inert=hold;if(this.find)this.find.root.inert=hold;const button=this.root.querySelector('.history-button');if(button)button.disabled=hold;this.tables?.sync();this.images?.sync();this.links?.sync();this.toolbar?.sync();}
  guardClose(){window.pdfix.editorGuard(!!(this.dirty||this.draftWrites||this.saving||this.imageBusy)).catch(error=>this.announce(error.message,true));}
  changed(){this.formatState();this.sourcePreview?.changed();this.find?.changed();this.revision++;this.textTools?.changed();this.modified=true;this.dirty=true;if(this.file.isNew){if(this.file.newKey)rememberNewDocument(this.file.newKey,this.file.name);else if(this.file.name!=='Untitled document')try{localStorage.setItem(NAME_KEY,this.file.name);}catch{}}this.guardClose();this.updateWords();this.root.querySelector('.draft-status').textContent='Saving recovery draft…';clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush().catch(()=>{}),350);}
  flush(){
    clearTimeout(this.timer);if(!this.dirty||(!this.editor&&!this.input))return this.pending;
    this.dirty=false;this.draftWrites++;this.draftSaving=true;this.guardClose();const draft=this.snapshot();this.pending=this.pending.catch(()=>{}).then(()=>window.pdfix.saveDraft(this.draftId,draft)).then(result=>{if(!this.disposed){this.recoveryAlert.hidden=true;this.root.querySelector('.draft-status').textContent=this.dirty?'Saving recovery draft…':result?.versionWarning?'Draft saved; version history unavailable':'Recovery draft saved locally';}}).catch(e=>{this.dirty=true;if(!this.disposed){this.recoveryAlert.hidden=false;this.root.querySelector('.draft-status').textContent='Draft could not be saved — export a copy';}this.announce(e.message,true);throw e;}).finally(()=>{this.draftWrites--;this.draftSaving=this.draftWrites>0;this.guardClose();});return this.pending;
  }
  async prepareDeparture(){this.layoutControls?.bandEditor?.prepareDeparture();if(this.imageBusy)throw new Error('Finish or cancel image insertion before leaving this document.');if(this.saving)throw new Error('Finish exporting the copy before leaving this document.');this.departing=true;this.holdEditing(true);try{await this.textTools?.prepareDeparture();if(this.root.dataset.ready!=='true'){if(this.richImporting){await window.pdfix.cancelRichDocumentJob(this.file.id);await this.richOpening?.catch(()=>{});}if(this.gridInspecting)await window.pdfix.cancelDocumentTableGrids?.(this.file.id);clearTimeout(this.jobTimer);this.worker?.terminate();this.rejectJob?.(new Error('Document import stopped before leaving.'));await this.opening?.catch(()=>{});}await this.flush();if(this.modified&&(this.editor||this.input))try{await window.pdfix.checkpoint(this.draftId,this.snapshot(),'Before leaving workspace');}catch(error){this.announce('Recovery draft kept; '+error.message,true);}}catch(error){this.releaseDeparture();throw error;}}
  releaseDeparture(){this.departing=false;this.textTools?.releaseDeparture();if(!this.disposed&&!this.saving)this.holdEditing(false);}
  applyVersion(draft){this.layout=draft.layout?documentLayout(draft.layout):defaultDocumentLayout(this.sourceMode);this.pdfOptions=null;this.layoutControls?.sync();if(this.sourceMode)this.input.value=draft.text;else this.editor.commands.setContent(draft.content,{emitUpdate:false});this.revision++;this.textTools?.changed();this.modified=true;this.dirty=false;this.updateWords();this.formatState();this.find?.scan();if(this.sourcePreview){this.sourcePreview.revision=-1;this.sourcePreview.refresh();}this.recoveryAlert.hidden=true;this.root.querySelector('.draft-status').textContent='Earlier version restored; recovery saved';}
  // New-document copies keep their draft until the person explicitly chooses Continue with this copy.
  async save(ext){
    if(this.saving||this.imageBusy||this.disposed||this.departing)return;this.saving=true;this.guardClose();this.holdEditing(true);this.root.querySelectorAll('.editor-exports button').forEach(b=>b.disabled=true);
    try{await this.flush().catch(()=>{});await window.pdfix.checkpoint(this.draftId,this.snapshot(),'Before exporting a copy').catch(()=>{});let saved;if(['docx','rtf'].includes(ext)){saved=await window.pdfix.saveRichDocumentCopy(this.file.id,ext,this.editor.getJSON(),this.layout,this.exportName());}else{const bytes=new TextEncoder().encode(this.getText());if(!bytes.length)throw new Error('Add some text before saving a copy.');saved=await window.pdfix.exportDocument(this.file.id,ext,bytes,this.exportName());}if(saved){const preservesRich=!this.sourceMode&&ext==='docx',preservesSource=this.sourceMode&&ext===this.file.ext;let retained=this.file.isNew||!(preservesRich||preservesSource);if(!retained)try{await window.pdfix.clearDraft(this.draftId);}catch{retained=true;}if(!retained){this.modified=false;this.dirty=false;this.pending=Promise.resolve();this.recoveryAlert.hidden=true;}this.announce(`Saved ${saved.name}. Original unchanged.${retained?' Editing recovery retained; this copy does not replace the complete editable draft.':''}`);this.root.querySelector('.draft-status').textContent=retained?'Copy saved; editing recovery retained':'Copy saved';}}
    catch(e){this.announce(e.message,true);}finally{this.saving=false;this.guardClose();if(!this.disposed){this.holdEditing(false);this.root.querySelectorAll('.editor-exports button').forEach(b=>b.disabled=false);}}
    if(this.reopenSaved&&!this.disposed){this.reopenSaved=false;await this.openSavedFile();}
  }
  // Save over the opened file (user decision, October 14). DOCX and RTF go through the contained writer; text formats
  // are saved as text. New documents still choose a place through Save a copy.
  canSaveInPlace(){return !this.file.isNew&&!this.file.copyName&&(this.sourceMode?IN_PLACE_TEXT.includes(this.file.ext):['docx','rtf',...IN_PLACE_TEXT].includes(this.file.ext));}
  async saveInPlace(){
    if(!this.canSaveInPlace()){this.save(this.sourceMode?this.file.ext:this.file.ext==='rtf'?'rtf':'docx');return;}
    if(this.saving||this.imageBusy||this.disposed||this.departing)return;
    const rich=!this.sourceMode&&['docx','rtf'].includes(this.file.ext),plainFromRich=!this.sourceMode&&!rich;
    // A Word or RTF file PDFix did not write may hold things PDFix cannot keep, so the first save over it asks.
    if(rich&&!this.inPlaceConfirmed&&!(this.file.ext==='docx'&&this.restoredLayout)){const choice=await this.confirmReplace();if(choice==='copy'){this.save(this.file.ext);return;}if(choice!=='replace')return;}
    this.saving=true;this.guardClose();this.holdEditing(true);this.root.querySelectorAll('.editor-exports button').forEach(b=>b.disabled=true);
    try{
      await this.flush().catch(()=>{});await window.pdfix.checkpoint(this.draftId,this.snapshot(),'Before saving over the original').catch(()=>{});
      let saved;if(rich)saved=await window.pdfix.saveRichDocumentInPlace(this.file.id,this.editor.getJSON(),this.layout);else{const bytes=new TextEncoder().encode(this.getText());if(!bytes.length)throw new Error('Add some text before saving.');saved=await window.pdfix.saveTextInPlace(this.file.id,bytes);}
      this.inPlaceConfirmed=true;
      // Formatting added to a plain text file is not in the saved text, so its recovery draft is kept.
      if(!plainFromRich){try{await window.pdfix.clearDraft(this.draftId);}catch{}this.modified=false;this.dirty=false;this.pending=Promise.resolve();this.recoveryAlert.hidden=true;}
      this.root.querySelector('.draft-status').textContent=plainFromRich?'Saved as text; formatting kept in recovery':'Saved';
      this.announce(`Saved ${saved.name}. The previous version is kept as a backup.${plainFromRich?' This is a plain text file, so formatting was not saved into it; save a DOCX copy to keep it.':''}`);
    }catch(e){this.announce(e.message,true);}finally{this.saving=false;this.guardClose();if(!this.disposed){this.holdEditing(false);this.root.querySelectorAll('.editor-exports button').forEach(b=>b.disabled=false);}}
  }
  confirmReplace(){
    return new Promise(resolve=>{
      const dialog=document.createElement('dialog');dialog.className='recovery-cleanup replace-original';dialog.setAttribute('aria-label','Save over the original file');
      dialog.innerHTML='<div class="dialog-header"><h2></h2></div><p>PDFix will rewrite this file with what you see here. Things PDFix does not edit, such as comments, tracked changes, text boxes, section layouts and fonts other than Arial, Times New Roman and Consolas, will not be kept. The current file is kept as a backup in PDFix\'s data folder.</p><div class="cleanup-actions"><button class="secondary" data-cancel>Cancel</button><button class="secondary" data-copy>Save a copy instead</button><button class="primary" data-replace>Replace the file</button></div>';
      dialog.querySelector('h2').textContent='Replace '+this.file.name+'?';
      let answer='cancel';const finish=value=>{answer=value;dialog.close();};
      dialog.querySelector('[data-cancel]').onclick=()=>finish('cancel');dialog.querySelector('[data-copy]').onclick=()=>finish('copy');dialog.querySelector('[data-replace]').onclick=()=>finish('replace');
      dialog.addEventListener('close',()=>{dialog.remove();resolve(answer);});document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-replace]').focus();
    });
  }
  async dispose({prepared=false}={}){if(this.disposed)return;if(!prepared)await this.prepareDeparture();await this.textTools?.dispose();this.modeControls?.dispose();this.disposed=true;if(this.gridInspecting)await window.pdfix.cancelDocumentTableGrids?.(this.file.id).catch(()=>{});clearTimeout(this.timer);clearTimeout(this.jobTimer);this.versionView?.dispose();this.documentStatus?.dispose();this.statistics?.dispose();this.toolbar?.dispose();this.layoutControls?.dispose();this.sourcePreview?.dispose();this.find?.dispose();this.zoom?.dispose();this.tables?.dispose();this.images?.dispose();this.links?.dispose();await this.pdfExport?.dispose();document.removeEventListener('keydown',this.keyHandler);this.worker?.terminate();this.rejectJob?.(new Error('Document workspace closed.'));this.editor?.destroy();await window.pdfix.editorGuard(false);}
}
