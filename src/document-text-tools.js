import {SpellCheckWorkspace} from './spell-check-workspace.js';
import {ReadAloudWorkspace} from './read-aloud-workspace.js';
import {TextSelection} from '@tiptap/pm/state';
import {documentSpellingSnapshot,documentSpellingRange,setDocumentSpellingHighlights} from './document-spelling.js';
import './document-text-tools.css';
import LIMITS from '../desktop/document-limits.cjs';
const MAX_RECOVERY=2*1024*1024,MAX_DOCUMENT=LIMITS.DOCUMENT_BYTES;
export class DocumentTextTools{
 constructor(editor){
  this.editor=editor;this.includeSource=false;this.disposed=false;this.departing=false;this.serial=Promise.resolve();this.speechStopping=Promise.resolve();
  for(const kind of ['spelling','speech']){const button=editor.root.querySelector(`[data-document-${kind}]`);button.onmousedown=event=>event.preventDefault();button.onclick=()=>this.show(kind).catch(error=>editor.announce(error.message,true));}
 }
 revision(){return String(this.editor.file.id)+':'+this.editor.revision;}
 capture(){const e=this.editor;return {revision:this.revision(),...(e.sourceMode?{from:e.input.selectionStart,to:e.input.selectionEnd}:{from:e.editor.state.selection.from,to:e.editor.state.selection.to})};}
 nativeSourceUndo(){return typeof document.queryCommandSupported==='function'&&document.queryCommandSupported('insertText')&&document.queryCommandSupported('delete');}
 snapshot(){
  const e=this.editor;if(e.disposed)throw new Error('The document workspace is closed.');
  if(!e.sourceMode)return documentSpellingSnapshot(e.editor,this.revision(),e.file.name||'Document');
  return {text:e.input.value,revision:this.revision(),sourceLabel:e.file.name||'Source text',segments:[{start:0,end:e.input.value.length}],optOut:!this.includeSource,readOnly:e.input.readOnly||!this.nativeSourceUndo(),reason:!this.includeSource?'Source and code text are excluded until you explicitly include them.':!this.nativeSourceUndo()?'Suggestions are read-only because this textarea cannot guarantee native Undo for replacement.':'Source spelling is explicitly enabled. Replacements preserve textarea Undo; use Ctrl+Z.'};
 }
 async show(kind){
  if(this.disposed||this.departing||this.editor.saving)return;const selection=this.capture();
  const operation=this.serial.catch(()=>{}).then(async()=>{await this.close();if(this.disposed||this.departing)return;this.selection=selection;this.kind=kind;
   const dialog=document.createElement('dialog');dialog.className='document-text-tools-dialog';dialog.setAttribute('aria-label',kind==='spelling'?'Document spell check':'Document read aloud');const header=document.createElement('div');header.className='document-text-tools-heading';
   const title=document.createElement('strong');title.textContent=kind==='spelling'?'Document spell check':'Document read aloud';const close=document.createElement('button');close.className='icon-button';close.type='button';close.textContent='×';close.setAttribute('aria-label','Close text tools');close.onclick=()=>this.close().catch(error=>this.editor.announce(error.message,true));header.append(title,close);dialog.append(header);
   if(this.editor.sourceMode){const label=document.createElement('label');label.className='document-text-tools-optin';const input=document.createElement('input');input.type='checkbox';input.checked=this.includeSource;label.append(input,document.createTextNode(' Include source/code text for this document'));input.onchange=()=>{this.includeSource=input.checked;this.changed();};dialog.append(label);}
   const mount=document.createElement('div');dialog.append(mount);this.dialog=dialog;this.editor.root.append(dialog);dialog.addEventListener('cancel',event=>{event.preventDefault();this.close().catch(error=>this.editor.announce(error.message,true));});dialog.showModal();
   this.workspace=kind==='spelling'?new SpellCheckWorkspace(mount,{ignores:this.spellingIgnores??={once:new Set(),words:new Set()},getSnapshot:()=>this.snapshot(),applyReplacement:request=>this.replace(request),onLocate:(finding,snapshot)=>this.locate(finding,snapshot),onFindings:(findings,snapshot)=>{if(!this.editor.sourceMode&&!this.editor.disposed)setDocumentSpellingHighlights(this.editor.editor,findings,snapshot);},announce:this.editor.announce}):new ReadAloudWorkspace(mount,{sourceProvider:request=>this.readingBatch(request),highlight:finding=>this.highlightSpeech(finding),announce:this.editor.announce});
   await this.workspace.open();if(kind==='speech'&&this.workspace.scope){const page=this.workspace.scope.querySelector('[value="page"]');page.disabled=true;page.textContent='Current page · PDF only';this.workspace.scope.value=selection.from===selection.to?'document':'selection';}
  });this.serial=operation;return operation;
 }
 locate(finding,snapshot){
  const e=this.editor;if(e.disposed||snapshot.revision!==this.revision())return;
  if(e.sourceMode){e.input.setSelectionRange(finding.start,finding.start+finding.length);return;}
  const range=documentSpellingRange(snapshot,finding);if(range)e.editor.view.dispatch(e.editor.state.tr.setSelection(TextSelection.create(e.editor.state.doc,range.from,range.to)).setMeta('addToHistory',false).scrollIntoView());
 }
 async replace(request){
  const e=this.editor;if(e.disposed||this.departing||e.departing||e.saving||e.imageBusy||request.revision!==this.revision())return false;
  const snapshot=this.snapshot();if(snapshot.readOnly||snapshot.optOut||snapshot.text.slice(request.start,request.start+request.length)!==request.word)return false;
  if(e.sourceMode){
   const before=e.input.value,after=before.slice(0,request.start)+request.replacement+before.slice(request.start+request.length);if(new TextEncoder().encode(after).length>MAX_RECOVERY)throw new Error('Replacement would exceed the 2 MB source recovery limit.');
   const revision=e.revision,dialog=this.dialog;let succeeded=false;
   // A modal makes the underlying textarea inert. Temporarily release that
   // synchronous focus boundary so the native command targets the source field,
   // then restore the same reviewed dialog without assigning textarea.value.
   try{dialog?.close();e.input.focus();e.input.setSelectionRange(request.start,request.start+request.length);succeeded=document.execCommand(request.replacement?'insertText':'delete',false,request.replacement);}finally{if(dialog?.isConnected)dialog.showModal();}
   if(e.input.value!==before&&e.revision===revision)e.changed();
   if(!succeeded||e.input.value!==after)throw new Error('The textarea could not complete a replacement with native Undo. Review the source; use Ctrl+Z if any text changed.');return true;
  }
  const range=documentSpellingRange(snapshot,request);if(!range||e.editor.state.doc.textBetween(range.from,range.to,'\n','\uFFFC')!==request.word)return false;
  const transaction=e.editor.state.tr.insertText(request.replacement,range.from,range.to).scrollIntoView();const value=transaction.doc.toJSON();if(new TextEncoder().encode(JSON.stringify(value)).length>MAX_DOCUMENT)throw new Error('This replacement would make the document larger than PDFix can edit.');e.validateDocument(value);e.editor.view.dispatch(transaction);return true;
 }
 readingBatch({scope,cursor,maxChunks,maxChars,maxChunkChars,signal}){
  if(signal?.aborted||this.disposed||this.departing)throw new Error('Document reading canceled.');const snapshot=this.snapshot();
  if(snapshot.optOut)return {chunks:[],notice:snapshot.reason};
  if(scope==='page')return {chunks:[],notice:'Physical page text is unavailable in this editable document. Use selected text or the whole document; current-page reading is available in the PDF reader.'};
  if(!['selection','document'].includes(scope))throw new Error('Choose a supported document reading scope.');
  const selection=this.selection;if(scope==='selection'&&(!selection||selection.revision!==snapshot.revision))throw new Error('The selected text changed. Close and reopen Read aloud to capture a new selection.');
  const ranges=scope==='document'?[{start:0,end:snapshot.text.length}]:this.editor.sourceMode?[{start:selection.from,end:selection.to}]:snapshot.segments.map(segment=>({start:segment.start+Math.max(0,selection.from-segment.from),end:segment.start+Math.min(segment.end-segment.start,selection.to-segment.from)})).filter(range=>range.end>range.start);
  if(cursor&&(cursor.revision!==snapshot.revision||cursor.scope!==scope||!Number.isSafeInteger(cursor.range)||!Number.isSafeInteger(cursor.offset)))throw new Error('The source changed. Prepare a new reading batch.');
  let index=cursor?.range??0,offset=cursor?.offset??ranges[0]?.start??0;if(index<0||index>=ranges.length||offset<ranges[index].start||offset>ranges[index].end)return {chunks:[],notice:'No selected prose text is available.'};
  const countLimit=Math.min(128,maxChunks),charLimit=Math.min(200000,maxChars),chunkLimit=Math.min(4096,maxChunkChars),chunks=[];let chars=0;
  while(index<ranges.length&&chunks.length<countLimit&&chars<charLimit){if(signal?.aborted)throw new Error('Document reading canceled.');const range=ranges[index];if(offset>=range.end){index++;offset=ranges[index]?.start??0;continue;}
   let end=Math.min(range.end,offset+chunkLimit,offset+charLimit-chars);if(end<range.end){const boundary=Math.max(snapshot.text.lastIndexOf('\n',end-1),snapshot.text.lastIndexOf(' ',end-1));if(boundary>offset+Math.floor(chunkLimit/2))end=boundary+1;else if(/[\uD800-\uDBFF]/.test(snapshot.text[end-1]))end--;}
   if(end<=offset)break;const text=snapshot.text.slice(offset,end);if(text.trim()){chunks.push({text,start:offset,sourceLabel:String(snapshot.sourceLabel).replace(/[\0\r\n]/g,' ').slice(0,256)});chars+=text.length;}offset=end;
  }
  while(index<ranges.length&&offset>=ranges[index].end){index++;offset=ranges[index]?.start??0;}
  this.speechSnapshot=snapshot;return {chunks,...(index<ranges.length?{nextCursor:{revision:snapshot.revision,scope,range:index,offset}}:{}),notice:this.editor.sourceMode?'Source/code reading was explicitly enabled. Physical pagination is available only in the PDF reader.':'Editable prose is read in document order. Code blocks and inline code are excluded; physical pagination is available only in the PDF reader.'};
 }
 highlightSpeech(finding){if(finding.clear){this.restoreSelection();return;}const snapshot=this.speechSnapshot;if(snapshot&&snapshot.revision===this.revision())this.locate({...finding,word:snapshot.text.slice(finding.start,finding.start+finding.length)},snapshot);}
 restoreSelection(){const e=this.editor,selection=this.selection;if(!selection||selection.revision!==this.revision()||e.disposed)return;if(e.sourceMode)e.input.setSelectionRange(selection.from,selection.to);else e.editor.commands.setTextSelection({from:selection.from,to:selection.to});}
 changed(){
  if(this.disposed)return;if(this.kind==='spelling')this.workspace?.sourceChanged();
  else if(this.kind==='speech'&&this.workspace){this.workspace.invalidate();this.speechStopping=this.speechStopping.catch(()=>{}).then(()=>this.workspace?.stop()).catch(error=>this.editor.announce(error.message,true));}
 }
 async close({restore=true}={}){
  if(this.closing)return this.closing;const workspace=this.workspace;if(!workspace&&!this.dialog)return;
  this.closing=(async()=>{if(workspace)await workspace.dispose();if(this.workspace===workspace)this.workspace=null;this.dialog?.close();this.dialog?.remove();this.dialog=null;this.kind=null;await this.speechStopping;if(restore)this.restoreSelection();})();
  try{await this.closing;}finally{this.closing=null;}
 }
 async prepareDeparture(){this.departing=true;await this.close({restore:false});await this.serial.catch(()=>{});}
 releaseDeparture(){this.departing=false;}
 async dispose(){if(this.disposed)return;await this.prepareDeparture();this.disposed=true;}
}
