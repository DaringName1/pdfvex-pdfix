import {ReaderPageToolHost} from './pdf-reader-page-tool-host.js';
import './reader-tool-proof-host.css';
// Same presentation contract as Claude's ReaderProofHost, kept separate until
// that reserved branch lands. The writer and checked preview remain tool-owned.
export class ReaderToolProofHost extends ReaderPageToolHost{
 constructor(reader,{proof,workspace,...options}){
  super(reader,{allowQuick:true,...options});this.workspace=workspace;this.proof=proof;this.priorHidden=new Map();
  this.frame=document.createElement('section');this.frame.className='reader-inline-proof reader-tool-proof-frame';this.frame.setAttribute('role','region');this.frame.setAttribute('aria-label',options.label+' result');this.frame.hidden=true;
  const back=document.createElement('button');back.type='button';back.className='secondary compact';back.textContent='Back to my PDF';back.addEventListener('click',()=>this.showProof(false),{signal:this.events.signal});this.frame.append(back,proof);proof.classList.add('reader-tool-proof-content');reader.root.querySelector('.pdf-body').insertBefore(this.frame,this.panel);
  document.addEventListener('keydown',event=>{if(event.key!=='Escape'||event.defaultPrevented||this.closed||!this.active||this.panel.hidden||!reader.root.isConnected||document.querySelector('dialog[open]'))return;event.preventDefault();event.stopPropagation();options.onEscape?.();},{signal:this.events.signal});
 }
 showProof(value){if(this.closed)return;this.showing=!!value;const body=this.frame.parentElement;if(!body)return;if(value){for(const node of body.children){if(node===this.panel||node===this.frame)continue;if(!this.priorHidden.has(node))this.priorHidden.set(node,node.hidden);node.hidden=true;}this.frame.hidden=false;this.proof.hidden=false;this.reader.root.dataset.inlineProof='true';}else{for(const[node,hidden]of this.priorHidden)node.hidden=hidden;this.priorHidden.clear();this.frame.hidden=true;delete this.reader.root.dataset.inlineProof;}}
 suspend(){const showing=this.showing;this.showProof(false);this.showing=showing;super.suspend();}
 activate(){super.activate();if(this.showing)this.showProof(true);}
 dispose(){if(this.closed)return;this.showProof(false);this.frame.remove();super.dispose();}
}
