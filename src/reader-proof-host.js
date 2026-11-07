import {ReaderPageToolHost} from './pdf-reader-page-tool-host.js';
// A tool on the open PDF (owner, Oct 30: no pop-up subpages): its settings stay in the side panel and, while its
// checked result is shown, that result takes the main document area. "Back to my PDF" returns to the page.
// The result element is wrapped (not changed), because some previews replace their own contents when they load.
export class ReaderProofHost extends ReaderPageToolHost{
 constructor(reader,{proof,backLabel='Back to my PDF',...options}){
  super(reader,{allowQuick:true,...options});this.proof=proof;this.showing=false;this.priorHidden=new Map();
  this.frame=document.createElement('section');this.frame.className='reader-inline-proof reader-proof-frame';this.frame.setAttribute('role','region');this.frame.setAttribute('aria-label',options.label+' result');this.frame.hidden=true;
  this.back=document.createElement('button');this.back.type='button';this.back.className='secondary compact reader-proof-back';this.back.textContent=backLabel;this.back.addEventListener('click',()=>this.showProof(false),{signal:this.events.signal});
  this.frame.append(this.back,proof);reader.root.querySelector('.pdf-body').insertBefore(this.frame,this.panel);
 }
 showProof(value){
  if(this.closed)return;this.showing=!!value;const body=this.frame.parentElement;if(!body)return;
  if(value){for(const node of body.children){if(node===this.panel||node===this.frame)continue;if(!this.priorHidden.has(node))this.priorHidden.set(node,node.hidden);node.hidden=true;}this.frame.hidden=false;this.proof.hidden=false;this.reader.root.dataset.inlineProof='true';}
  else{for(const [node,hidden] of this.priorHidden)node.hidden=hidden;this.priorHidden.clear();this.frame.hidden=true;delete this.reader.root.dataset.inlineProof;}
 }
 suspend(){const was=this.showing;this.showProof(false);this.showing=was;super.suspend();}
 activate(){super.activate();if(this.showing)this.showProof(true);}
 dispose(){if(this.closed)return;this.showProof(false);this.frame.remove();super.dispose();}
}
