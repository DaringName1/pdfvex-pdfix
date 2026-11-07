import {ReaderOptionsPanel} from './reader-options-panel.js';
const liveCallback=callback=>{while(callback?.pageToolHost?.closed)callback=callback.previousPageToolCallback;return callback;};
// A tool borrows the already-open page. This owns only its panel, overlay and
// listeners; closing it must never clear the reader's canvas or text layer.
export class ReaderPageToolHost {
  constructor(reader,{panel,overlay,label,onRendered=()=>{},onEscape=()=>{},allowQuick=false,allowView=false}){
    if(reader.disposed||!reader.hasToolStrip||!reader.paper?.isConnected)throw new Error('Open the PDF before using this tool.');
    if(!panel||panel.tagName==='DIALOG'||panel.contains(reader.root))throw new Error('Tool options must stay beside the open PDF.');
    reader.pageToolHosts??=new Set();reader.pageToolHost?.suspend();
    this.reader=reader;this.allowQuick=allowQuick;this.allowView=allowView;this.active=true;this.extraOverlays=new Set();this.panel=panel;this.overlay=overlay;this.closed=false;this.events=new AbortController();this.previous=reader.onRendered;
    panel.classList.add('reader-page-tool-options');panel.setAttribute('role','region');panel.setAttribute('aria-label',label);
    reader.root.querySelector('.pdf-body').append(panel);this.options=new ReaderOptionsPanel(panel,{instruction:label.startsWith('Fill')?'Click a field to fill it, or click the page to place text or a signature.':label.startsWith('Edit')?'Click existing words to edit them, or click the page to add text.':label.startsWith('Compress')?'Choose quality. The checked preview updates automatically.':label.startsWith('Redact')?'Drag over what must go, then review and apply redactions.':'Choose a method, then work on the page.'});if(overlay)reader.paper.append(overlay);reader.pageToolHost=this;reader.pageToolHosts.add(this);
    this.rendered=details=>{liveCallback(this.previous)?.(details);if(!this.closed&&this.active&&!this.panel.hidden)onRendered(details);};this.rendered.pageToolHost=this;this.rendered.previousPageToolCallback=this.previous;reader.onRendered=this.rendered;
    this.unsubscribe=reader.subscribeInteractionMode?.(()=>this.visibility());
    reader.root.addEventListener('keydown',event=>{if(this.closed||!this.active||this.panel.hidden||event.defaultPrevented||event.key!=='Escape'||event.target.closest('dialog,[aria-modal=true]'))return;if(event.target.closest('[data-pdf-reader-root]')!==reader.root)return;if(!panel.contains(event.target)&&!reader.stage?.contains(event.target)&&event.target!==reader.root)return;event.preventDefault();event.stopPropagation();onEscape();},{signal:this.events.signal});
  }
  visibility(){const mode=this.reader.interactionMode,hidden=!this.active||mode==='view'&&!this.allowView||mode==='quick'&&!this.allowQuick;this.panel.hidden=hidden;this.panel.inert=hidden;for(const overlay of [this.overlay,...this.extraOverlays].filter(Boolean)){overlay.hidden=hidden;overlay.toggleAttribute('hidden',hidden);overlay.inert=hidden;overlay.style.pointerEvents=hidden?'none':'';}}
  attachOverlay(node){this.extraOverlays.add(node);this.reader.paper.append(node);this.visibility();}
  releaseOverlay(node){this.extraOverlays.delete(node);node.remove();}
  suspend(){this.active=false;this.visibility();}
  activate(){if(this.closed)return;for(const host of this.reader.pageToolHosts)if(host!==this)host.suspend();this.active=true;this.reader.pageToolHost=this;this.visibility();this.refresh();}
  refresh(){const reader=this.reader;if(reader.currentViewport&&reader.paper.dataset.ready==='true')this.rendered({page:reader.currentPage,viewport:reader.currentViewport});}
  dispose(){if(this.closed)return;this.closed=true;this.reader.pageToolHosts.delete(this);this.events.abort();this.options?.dispose();this.unsubscribe?.();if(this.reader.onRendered===this.rendered)this.reader.onRendered=liveCallback(this.previous);if(this.reader.pageToolHost===this){this.reader.pageToolHost=null;this.reader.root.inert=false;}this.overlay?.remove();for(const overlay of this.extraOverlays)overlay.remove();this.extraOverlays.clear();this.panel.remove();if(this.reader.focusToolControls)this.reader.focusToolControls();else this.reader.root.querySelector('.reader-job-tabs [aria-selected=true]')?.focus({preventScroll:true});}
}
