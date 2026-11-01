import {ReaderPageToolHost} from './pdf-reader-page-tool-host.js';

// The source reader stays intact. The independently opened clean-copy reader
// takes the same document area only while reviewing that prepared output.
export class ReaderRedactionHost extends ReaderPageToolHost {
  constructor(workspace){
    const reader=workspace.inlineOwner;
    super(reader,{panel:workspace.dialog,overlay:workspace.layer,label:'Redact a PDF options',onEscape:()=>workspace.requestClose(),onRendered:details=>workspace.sourceRendered(details)});
    this.workspace=workspace;this.previewRoot=workspace.dialog.querySelector('.redaction-output-reader');this.previewRoot.classList.add('reader-inline-proof');this.previewRoot.setAttribute('role','region');this.previewRoot.setAttribute('aria-label','Clean copy preview');reader.root.querySelector('.pdf-body').insertBefore(this.previewRoot,this.panel);
    workspace.dialog.querySelector('.redaction-source-reader').hidden=true;
    const disclosure=workspace.dialog.querySelector('.redaction-disclosure');if(disclosure){const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='How the clean copy works';details.append(summary);disclosure.before(details);details.append(disclosure);}
    this.sourceNodes=[...reader.root.querySelector('.pdf-body').children].filter(node=>node!==this.panel&&node!==this.previewRoot);this.priorHidden=new Map();this.priorInert=new Map();
    const header=document.querySelector('.file-header>button.secondary');if(header){this.header=header;this.headerText=header.textContent;this.headerTitle=header.title;header.textContent='Save redacted copy';header.title='Save only the reviewed clean copy';header.addEventListener('click',event=>this.save(event),{capture:true,signal:this.events.signal});}
    document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&!event.altKey&&!event.shiftKey&&event.key.toLowerCase()==='s'&&!event.defaultPrevented)this.save(event);},{capture:true,signal:this.events.signal});
  }
  show(output){
    const reader=this.reader,workspace=this.workspace;
    if(output){for(const node of this.sourceNodes){if(!this.priorHidden.has(node))this.priorHidden.set(node,node.hidden);node.hidden=true;}reader.root.dataset.inlineProof='true';this.previewRoot.hidden=false;reader.activePageReader=workspace.previewReader||null;}
    else{delete reader.root.dataset.inlineProof;delete reader.activePageReader;for(const[node,hidden]of this.priorHidden)node.hidden=hidden;this.priorHidden.clear();this.previewRoot.hidden=true;}
  }
  setBusy(locked){
    // The Cancel button is inside the options panel, so the reader root itself
    // must stay interactive. Only its source navigation and artwork are locked.
    for(const node of [this.reader.root.querySelector('.pdf-toolbar'),this.reader.root.querySelector('.reader-job-tools'),...this.sourceNodes]){
      if(!node)continue;if(locked){if(!this.priorInert.has(node))this.priorInert.set(node,node.inert);node.inert=true;}else if(this.priorInert.has(node)){node.inert=this.priorInert.get(node);this.priorInert.delete(node);}
    }
  }
  mountPreview(){this.show(true);}
  attachPreview(reader){reader.root.inert=!!this.workspace.busy;this.reader.activePageReader=reader;}
  save(event){event.preventDefault();event.stopImmediatePropagation();const w=this.workspace;if(w.closed)return;if(w.busy||w.saving||!w.output||!w.reviewed.checked){w.announce('Prepare the clean copy and check its pages before saving. Your original still contains the information you marked.',true);return;}w.run(()=>w.save());}
  dispose(){if(this.closed)return;this.show(false);this.setBusy(false);if(this.header?.isConnected){this.header.textContent=this.headerText;this.header.title=this.headerTitle;}this.previewRoot.remove();super.dispose();}
}
