import {ReaderPageToolHost} from './pdf-reader-page-tool-host.js';
// The native-checked copy occupies the main document area; the original remains loaded for editing.
export class ReaderFormHost extends ReaderPageToolHost{
 constructor(workspace,options){super(workspace.hostReader,options);this.workspace=workspace;this.previewRoot=workspace.dialog.querySelector('.form-output-reader');this.previewRoot.classList.add('reader-inline-proof');this.previewRoot.setAttribute('role','region');this.previewRoot.setAttribute('aria-label','Filled copy preview');this.previewRoot.hidden=true;this.reader.root.querySelector('.pdf-body').insertBefore(this.previewRoot,this.panel);this.sourceNodes=[...this.previewRoot.parentElement.children].filter(n=>n!==this.panel&&n!==this.previewRoot);this.priorHidden=new Map();}
 showProof(value){if(value){for(const n of this.sourceNodes){if(!this.priorHidden.has(n))this.priorHidden.set(n,n.hidden);n.hidden=true;}this.reader.root.dataset.inlineProof='true';this.reader.activePageReader=this.workspace.previewReader;this.previewRoot.hidden=false;this.overlay.hidden=true;}else{for(const[n,hidden]of this.priorHidden)n.hidden=hidden;this.priorHidden.clear();delete this.reader.root.dataset.inlineProof;if(this.reader.activePageReader===this.workspace.previewReader)delete this.reader.activePageReader;this.previewRoot.hidden=true;this.overlay.hidden=this.panel.hidden;}}
 attachPreview(preview){for(const action of ['print','find','pdf-fullscreen']){const button=preview.root.querySelector('[data-action='+action+']');if(button)button.hidden=true;}if(preview.artworkFullscreen?.button)preview.artworkFullscreen.button.hidden=true;this.reader.activePageReader=preview;}
 suspend(){this.showProof(false);super.suspend();}
 activate(){super.activate();if(this.workspace.output&&this.workspace.showingFormProof)this.showProof(true);}
 dispose(){if(this.closed)return;this.showProof(false);this.previewRoot.remove();super.dispose();}
}
