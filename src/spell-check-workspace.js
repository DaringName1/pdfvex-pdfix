import './spell-check-workspace.css';
const MAX_SOURCE=1000000,MAX_CHUNK=100000,MAX_FINDINGS=1000;
const wordKey=value=>value.normalize('NFC').toLowerCase();
const element=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
function chunks(text){
 const rows=[];let start=0;while(start<text.length){let end=Math.min(start+MAX_CHUNK,text.length);if(end<text.length){const boundary=Math.max(text.lastIndexOf('\n',end-1),text.lastIndexOf(' ',end-1),text.lastIndexOf('\t',end-1));if(boundary>start+MAX_CHUNK/2)end=boundary+1;else if(/[\uD800-\uDBFF]/.test(text[end-1]))end--;}
  rows.push({start,text:text.slice(start,end)});start=end;}return rows;
}
export class SpellCheckWorkspace{
 // ignores: optional sets kept by the caller, so Ignore once / Ignore all last while the document stays open.
 constructor(root,{getSnapshot,applyReplacement=null,onLocate=()=>{},onFindings=()=>{},announce=()=>{},api=window.pdfix,ignores=null}={}){
  this.root=root;this.getSnapshot=getSnapshot;this.applyReplacement=applyReplacement;this.onLocate=onLocate;this.onFindings=onFindings;this.announce=announce;this.api=api;this.ignores=ignores;this.findings=[];this.ignored=ignores?.once??new Set();this.ignoreWords=ignores?.words??new Set();this.dictionary={version:1,languages:{}};this.generation=0;this.disposed=false;this.busy=false;
 }
 async open(){
  this.root.innerHTML='<section class="spell-check-workspace" aria-label="Local spell checking"><div class="spelling-heading"><h2>Spell check</h2><p>Free local checking with installed Windows dictionaries. Text stays on this computer.</p></div><div class="spelling-controls"><label>Language <select data-language aria-label="Spelling language"></select></label><button class="primary compact" data-check>Check text</button><button class="secondary compact" data-cancel hidden>Cancel</button><button class="text-button" data-reset>Reset ignored words</button></div><p class="spelling-source"></p><p class="spelling-status" role="status" aria-live="polite">Reading installed Windows dictionaries…</p><ol class="spelling-findings" aria-label="Possible spelling errors"></ol><details class="spelling-dictionary"><summary>Personal dictionary</summary><p>One word per line for the selected language. Saved only in PDFix; other applications’ dictionaries are unchanged.</p><textarea data-words aria-label="Personal spelling dictionary" spellcheck="false" rows="6" maxlength="1300000"></textarea><div class="spelling-controls"><button class="secondary compact" data-save-dictionary>Save dictionary</button><button class="text-button" data-clear-dictionary>Clear this language</button></div></details></section>';
  this.statusNode=this.root.querySelector('.spelling-status');this.language=this.root.querySelector('[data-language]');this.list=this.root.querySelector('.spelling-findings');this.source=this.root.querySelector('.spelling-source');this.dictionaryInput=this.root.querySelector('[data-words]');
  const run=callback=>()=>{Promise.resolve().then(callback).catch(error=>this.error(error));};
  this.root.querySelector('[data-check]').onclick=run(()=>this.check());this.root.querySelector('[data-cancel]').onclick=run(()=>this.cancel());this.root.querySelector('[data-reset]').onclick=()=>{this.ignored.clear();this.ignoreWords.clear();this.sourceChanged();this.status('Ignored words reset. Check again.');};
  this.root.querySelector('[data-save-dictionary]').onclick=run(()=>this.saveDictionary());this.root.querySelector('[data-clear-dictionary]').onclick=run(()=>this.saveDictionary([]));
  this.language.onchange=()=>{if(this.language.value===this.chosenLanguage)return;this.chosenLanguage=this.language.value;if(this.ignores)this.ignores.language=this.language.value;this.ignoreWords.clear();this.ignored.clear();this.sourceChanged();this.showDictionary();this.status('Language changed. Check again.');};
  this.busy=true;this.controls();const generation=this.generation;
  this.active=(async()=>{const languages=await this.api.localSpellingLanguages();const dictionary=await this.api.localSpellingDictionary();if(this.disposed||generation!==this.generation)return;
   this.dictionary=dictionary;for(const row of languages.languages){const option=element('option',row.label+' · '+row.tag);option.value=row.tag;this.language.append(option);}const locale=this.ignores?.language??navigator.language;if(languages.languages.some(row=>row.tag===locale))this.language.value=locale;this.chosenLanguage=this.language.value;
   this.showDictionary();this.describeSnapshot(await this.snapshot());this.status(languages.languages.length?'Choose a language and check the current text.':languages.notice+' No spelling languages are currently installed.');
  })();
  try{await this.active;}catch(error){if(!this.disposed)this.error(error);}finally{this.busy=false;this.controls();}return this;
 }
 status(message){if(!this.disposed&&this.statusNode)this.statusNode.textContent=message;}
 error(error){if(this.disposed)return;this.status(error.message||String(error));this.announce(error.message||String(error),true);}
 async snapshot(){const value=await this.getSnapshot();if(!value||typeof value.text!=='string'||value.revision===undefined)throw new Error('No source text is available for spell checking.');return value;}
 describeSnapshot(snapshot){this.source.textContent=(snapshot.sourceLabel||'Current text')+(snapshot.readOnly?' · Read-only findings; use the page links to review.':' · Replacements use the editor’s Undo and recovery.');if(snapshot.reason)this.source.textContent+=' '+snapshot.reason;}
 controls(){if(this.disposed||!this.language)return;for(const control of this.root.querySelectorAll('button,input,select,textarea'))control.disabled=this.busy;
  this.root.querySelector('[data-check]').disabled=this.busy||!this.language.value;this.root.querySelector('[data-cancel]').hidden=!this.busy;this.root.querySelector('[data-cancel]').disabled=!this.busy||this.canceling;
  for(const name of ['save-dictionary','clear-dictionary'])this.root.querySelector('[data-'+name+']').disabled=this.busy||!this.language.value;
  for(const button of this.root.querySelectorAll('[data-spelling-replacement]'))button.disabled=this.busy||Boolean(this.snapshotValue?.readOnly)||!this.applyReplacement;
 }
 showDictionary(){this.dictionaryInput.value=(this.dictionary.languages[this.language.value]||[]).join('\n');}
 async check(){
  if(this.busy||this.disposed||!this.language.value)return;const snapshot=await this.snapshot();if(snapshot.optOut){this.describeSnapshot(snapshot);this.status(snapshot.reason||'Code, source and identifier fields are excluded from spelling checks.');return;}
  if(snapshot.text.length>MAX_SOURCE)throw new Error('Check a selection or smaller source. Local review is limited to 1,000,000 text characters.');
  this.snapshotValue=snapshot;this.describeSnapshot(snapshot);this.findings=[];this.onFindings([],snapshot);this.render();this.busy=true;this.canceling=false;this.controls();const generation=++this.generation,language=this.language.value;let truncated=false,canceled=false;
  this.active=(async()=>{const rows=chunks(snapshot.text);for(const [index,chunk]of rows.entries()){
   if(this.disposed||generation!==this.generation){canceled=true;break;}this.status(`Checking text ${index+1} of ${rows.length} locally…`);
   const result=await this.api.localSpellingCheck({text:chunk.text,language,revision:snapshot.revision,ignoreWords:[...this.ignoreWords]});if(this.disposed||generation!==this.generation){canceled=true;break;}
   const current=await this.snapshot();if(current.revision!==snapshot.revision||current.text!==snapshot.text){this.sourceChanged();canceled=true;this.status('Text changed during checking. Check again to refresh findings.');break;}
   this.findings.push(...result.findings.map(finding=>({...finding,start:finding.start+chunk.start})));truncated||=result.truncated;
   if(this.findings.length>=MAX_FINDINGS){this.findings=this.findings.slice(0,MAX_FINDINGS);truncated=true;break;}
  }
  if(!canceled&&!this.disposed){this.onFindings(this.visibleFindings(),snapshot);this.render();this.status(`${this.visibleFindings().length} possible spelling ${this.visibleFindings().length===1?'error':'errors'}.${truncated?' Results reached a limit; check a smaller selection for a complete review.':''}${snapshot.readOnly?' Review the page links; replacements are unavailable in this read-only source.':''}`);}
  })();try{await this.active;}catch(error){if(generation===this.generation){this.findings=[];this.onFindings([],snapshot);this.render();this.error(error);}}finally{this.busy=false;this.controls();}
 }
 // Ignore once remembers the word with a little text either side, so the same occurrence stays ignored after edits
 // elsewhere in the document; changing the text right around it makes it a new occurrence.
 occurrence(row){const text=this.snapshotValue?.text??'';return row.word+'\u0001'+text.slice(Math.max(0,row.start-16),row.start)+'\u0001'+text.slice(row.start+row.length,row.start+row.length+16);}
 visibleFindings(){return this.findings.filter(row=>!this.ignored.has(this.occurrence(row))&&!this.ignoreWords.has(wordKey(row.word)));}
 locate(row){const segment=this.snapshotValue.segments?.find(value=>row.start>=value.start&&row.start<value.end);this.onLocate({...row,...(segment?.pageNumber?{pageNumber:segment.pageNumber}:{})},this.snapshotValue);}
 render(){
  if(this.disposed||!this.list)return;this.list.replaceChildren();const snapshot=this.snapshotValue;
  for(const row of this.visibleFindings()){
   const item=element('li',undefined,'spelling-finding'),header=element('div',undefined,'spelling-finding-heading'),locate=element('button',row.word,'text-button');locate.type='button';locate.onclick=()=>this.locate(row);header.append(locate);
   const page=snapshot?.segments?.find(value=>row.start>=value.start&&row.start<value.end)?.pageNumber;if(page)header.append(element('span','Page '+page));item.append(header);
   const context=element('p');context.textContent=snapshot.text.slice(Math.max(0,row.start-50),Math.min(snapshot.text.length,row.start+row.length+50)).replace(/\s+/g,' ');item.append(context);
   const choices=element('div',undefined,'spelling-choices');if(row.suggestions.length){for(const replacement of row.suggestions){const button=element('button',replacement||'Delete repeated text','secondary compact');button.type='button';button.setAttribute('data-spelling-replacement','');button.disabled=Boolean(snapshot.readOnly||!this.applyReplacement);button.onclick=()=>this.replace(row,replacement).catch(error=>this.error(error));choices.append(button);}}else choices.append(element('span','No suggestions available.'));
   const ignore=element('button','Ignore once','text-button');ignore.onclick=()=>{if(this.ignored.size<10000)this.ignored.add(this.occurrence(row));this.refreshFindings();};const ignoreAll=element('button','Ignore all','text-button');ignoreAll.onclick=()=>{if(this.ignoreWords.size>=10000){this.status('Ignored words reached the 10,000-word limit.');return;}this.ignoreWords.add(wordKey(row.word));this.refreshFindings();};const add=element('button','Add to dictionary','text-button');add.onclick=()=>this.addWord(row.word).catch(error=>this.error(error));choices.append(ignore,ignoreAll,add);item.append(choices);this.list.append(item);
  }
 }
 refreshFindings(){this.onFindings(this.visibleFindings(),this.snapshotValue);this.render();this.controls();this.status(`${this.visibleFindings().length} possible spelling errors remaining.`);}
 async replace(row,replacement){
  if(this.busy||this.disposed||!this.applyReplacement||this.snapshotValue?.readOnly)return;const snapshot=await this.snapshot();
  if(snapshot.readOnly||snapshot.revision!==this.snapshotValue.revision||snapshot.text!==this.snapshotValue.text||snapshot.text.slice(row.start,row.start+row.length)!==row.word){this.sourceChanged();throw new Error('The text or edit permissions changed. Check again before replacing.');}
  this.busy=true;this.controls();try{this.active=Promise.resolve(this.applyReplacement({revision:snapshot.revision,start:row.start,length:row.length,word:row.word,replacement}));const changed=await this.active;if(changed===false)throw new Error('The editor could not replace this word. Review the source and check again.');this.sourceChanged();this.status('Word replaced. Use the editor’s Undo to restore it. Check again to refresh findings.');}finally{this.busy=false;this.controls();}
  // Refresh the list straight away so the remaining findings stay in view after a replacement.
  if(!this.disposed)await this.check();
 }
 async saveDictionary(explicit){
  if(this.busy||this.disposed||!this.language.value)return;const list=explicit||this.dictionaryInput.value.split(/\r?\n/).map(word=>word.trim()).filter(Boolean);const seen=new Set();const unique=list.filter(word=>{const key=wordKey(word);if(seen.has(key))return false;seen.add(key);return true;});
  this.busy=true;this.controls();try{this.active=this.api.localSpellingUpdateDictionary({language:this.language.value,words:unique});this.dictionary=await this.active;this.showDictionary();this.sourceChanged();this.status(unique.length?'Personal dictionary saved locally. Check again to refresh findings.':'Personal dictionary cleared for this language. Check again.');}finally{this.busy=false;this.controls();}
 }
 async addWord(word){if(this.busy||this.disposed)return;const list=this.dictionary.languages[this.language.value]||[];await this.saveDictionary([...list,...(list.some(value=>wordKey(value)===wordKey(word))?[]:[word])]);}
 sourceChanged(){this.generation++;this.findings=[];this.onFindings([],this.snapshotValue);this.render();this.status('Source changed. Check again to refresh spelling findings.');}
 async cancel(){if(!this.busy||this.canceling)return;this.canceling=true;this.generation++;this.controls();this.status('Canceling local spelling and waiting for the helper to exit…');try{await this.api.localSpellingCancel();await this.active?.catch(()=>{});this.findings=[];this.onFindings([],this.snapshotValue);this.render();this.status('Local spelling canceled.');}finally{this.canceling=false;this.controls();}}
 // A check that was canceled to leave rejects by design; that must not stop the editor or the app from closing.
 async prepareDeparture(){if(this.busy)await this.cancel();await this.active?.catch(()=>{});}
 async dispose(){if(this.disposed)return;await this.prepareDeparture();this.disposed=true;this.generation++;this.onFindings([],this.snapshotValue);this.root.replaceChildren();}
}
