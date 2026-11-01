import {ReaderPageToolHost} from './pdf-reader-page-tool-host.js';
import './pdf-reader-page-tool-host.css';

// Presentation only: the original stays loaded while the verified copy borrows
// its document area. Compression and publication remain the workspace's work.
export class ReaderCompressionHost extends ReaderPageToolHost {
 constructor(workspace){
  const reader=workspace.sourceReader;
  super(reader,{panel:workspace.dialog,label:'Compress a PDF options',onEscape:()=>workspace.requestClose()});
  this.options.footer.append(this.panel.querySelector('.compression-save'));
  this.originalView={zoom:reader.currentViewport?.scale||reader.zoom,fit:reader.fit,fitPage:reader.fitPage};
  reader.zoom=this.originalView.zoom;reader.fit=false;reader.fitPage=false;
  for(const action of ['fit','fit-page'])reader.root.querySelector('[data-action='+action+']')?.setAttribute('aria-pressed','false');
  this.workspace=workspace;this.previewRoot=workspace.dialog.querySelector('.compression-reader');
  workspace.dialog.querySelector('.subtitle').textContent='Choose quality. The preview updates automatically.';
  workspace.dialog.querySelector('.compression-settings-panel details').append(workspace.dialog.querySelector('.compression-tradeoff'));
  this.previewRoot.classList.add('reader-inline-proof');this.previewRoot.setAttribute('role','region');this.previewRoot.setAttribute('aria-label','Compressed copy preview');
  reader.root.querySelector('.pdf-body').insertBefore(this.previewRoot,this.panel);
  this.sources=[...reader.root.querySelector('.pdf-body').children].filter(n=>n!==this.panel&&n!==this.previewRoot&&!n.matches('.reader-panel-rail'));this.hidden=new Map();this.inert=new Map();
  this.header=document.querySelector('.file-header>button.secondary');
  if(this.header){this.headerText=this.header.textContent;this.headerTitle=this.header.title;this.header.addEventListener('click',event=>this.save(event),{capture:true,signal:this.events.signal});}
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&!event.altKey&&!event.shiftKey&&event.key.toLowerCase()==='s'&&!event.defaultPrevented)this.save(event);},{capture:true,signal:this.events.signal});
  this.modeSubscription=reader.subscribeInteractionMode?.(()=>this.show(!!workspace.previewReady));
 }
 show(output){
  const active=output&&this.reader.interactionMode==='build';
  if(active){for(const n of this.sources){if(!this.hidden.has(n))this.hidden.set(n,n.hidden);n.hidden=true;}this.reader.root.dataset.inlineProof='true';this.previewRoot.hidden=false;this.reader.activePageReader=this.workspace.reader||null;}
  else{delete this.reader.root.dataset.inlineProof;delete this.reader.activePageReader;for(const[n,value]of this.hidden)n.hidden=value;this.hidden.clear();this.previewRoot.hidden=true;}
  if(this.header){const editing=this.reader.interactionMode==='build';this.header.textContent=editing?'Save compressed PDF':this.headerText;this.header.title=editing?'Save the checked compressed copy':this.headerTitle;}
 }
 setBusy(locked){
  for(const n of [this.reader.root.querySelector('.pdf-toolbar'),this.reader.root.querySelector('.reader-job-tools'),...this.sources]){
   if(!n)continue;if(locked){if(!this.inert.has(n))this.inert.set(n,n.inert);n.inert=true;}else if(this.inert.has(n)){n.inert=this.inert.get(n);this.inert.delete(n);}
  }
 }
 save(event){
  if(this.reader.interactionMode!=='build')return;
  event.preventDefault();event.stopImmediatePropagation();const w=this.workspace;
  if(w.closed)return;
  if(w.busy||!w.previewReady||!w.output){w.announce('Wait for the compressed preview to finish checking before saving.',true);return;}
  w.run(()=>w.save());
 }
 dispose(){
  if(this.closed)return;this.modeSubscription?.();this.show(false);this.setBusy(false);
  if(this.header?.isConnected){this.header.textContent=this.headerText;this.header.title=this.headerTitle;}
  if(Math.abs(this.reader.zoom-this.originalView.zoom)<.0001){this.reader.fit=this.originalView.fit;this.reader.fitPage=this.originalView.fitPage;for(const action of ['fit','fit-page'])this.reader.root.querySelector('[data-action='+action+']')?.setAttribute('aria-pressed',String(!!this.reader.fit&&(action==='fit-page'?this.reader.fitPage:!this.reader.fitPage)));}
  this.previewRoot.remove();super.dispose();
  if(!this.reader.disposed&&!this.reader.disposing)this.reader.renderPage().catch(error=>this.reader.announce(error.message,true));
 }
}
