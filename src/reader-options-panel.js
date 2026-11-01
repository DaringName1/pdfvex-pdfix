// Presentation only. Existing controls retain their handlers and save/review ownership.
export class ReaderOptionsPanel {
 constructor(panel,{instruction='Choose a tool, then work on the page.'}={}){
  this.panel=panel;this.events=new AbortController();const doc=panel.ownerDocument,header=panel.querySelector('.dialog-header');
  if(!doc||!header)return;
  this.header=header;this.body=doc.createElement('div');this.body.className='reader-options-body';this.body.setAttribute('role','region');this.body.setAttribute('aria-label','Tool settings');this.body.tabIndex=0;
  this.help=doc.createElement('p');this.help.className='reader-options-help';this.help.textContent=instruction;this.body.append(this.help);
  for(const node of [...panel.childNodes])if(node!==header)this.body.append(node);
  this.footer=doc.createElement('div');this.footer.className='reader-options-footer';const cancel=doc.createElement('button');cancel.type='button';cancel.className='secondary compact reader-tool-cancel';cancel.textContent='Cancel';cancel.title='Close this tool; unsaved work stays in recovery unless you choose Discard';cancel.onclick=()=>header.querySelector('button[aria-label^=Close],button[data-close]')?.click();this.footer.append(cancel);const safe=doc.createElement('small');safe.textContent='Your original stays unchanged.';this.body.append(safe);
  this.resize=doc.createElement('div');this.resize.className='reader-options-resize';this.resize.tabIndex=0;this.resize.setAttribute('role','separator');this.resize.setAttribute('aria-label','Options panel width');this.resize.setAttribute('aria-orientation','vertical');this.resize.title='Drag to resize options, or use Left and Right arrows';
  panel.classList.add('reader-options-panel');panel.append(this.resize,header,this.body,this.footer);
  const signal=this.events.signal,on=(node,type,fn)=>node.addEventListener(type,fn,{signal});
  const limits=()=>({min:220,max:Math.max(220,Math.min(480,(panel.parentElement?.clientWidth||800)*.46))});
  this.setWidth=value=>{const{min,max}=limits(),width=Math.max(min,Math.min(max,value));panel.style.setProperty('--options-width',width+'px');this.resize.setAttribute('aria-valuemin',String(min));this.resize.setAttribute('aria-valuemax',String(Math.round(max)));this.resize.setAttribute('aria-valuenow',String(Math.round(width)));};
  on(this.resize,'keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const{min,max}=limits();this.setWidth(event.key==='Home'?min:event.key==='End'?max:panel.getBoundingClientRect().width+(event.key==='ArrowLeft'?20:-20));});
  on(this.resize,'pointerdown',event=>{if(event.button!==0)return;this.drag={id:event.pointerId,x:event.clientX,width:panel.getBoundingClientRect().width};this.resize.setPointerCapture(event.pointerId);event.preventDefault();});
  on(this.resize,'pointermove',event=>{if(this.drag?.id===event.pointerId)this.setWidth(this.drag.width+this.drag.x-event.clientX);});
  const end=event=>{if(this.drag?.id!==event.pointerId)return;this.drag=null;if(this.resize.hasPointerCapture(event.pointerId))this.resize.releasePointerCapture(event.pointerId);};on(this.resize,'pointerup',end);on(this.resize,'pointercancel',end);
  on(window,'resize',()=>{if(panel.style.getPropertyValue('--options-width'))this.setWidth(parseFloat(panel.style.getPropertyValue('--options-width')));});
  // Keep keyboard focus inside this scroll area when the ribbon/tabs change height.
  const keepFocus=()=>{const active=doc.activeElement;if(!active||active===this.body||!this.body.contains(active))return;const control=active.getBoundingClientRect(),frame=this.body.getBoundingClientRect();if(control.top<frame.top+4)this.body.scrollTop-=frame.top+4-control.top;else if(control.bottom>frame.bottom-4)this.body.scrollTop+=Math.max(0,Math.min(control.bottom-frame.bottom+4,control.top-frame.top-4));};
  const scheduleFocus=()=>{cancelAnimationFrame(this.focusFrame);this.focusFrame=requestAnimationFrame(keepFocus);};on(this.body,'focusin',scheduleFocus);this.focusResize=new ResizeObserver(scheduleFocus);this.focusResize.observe(this.body);
  this.resize.setAttribute('aria-valuemin','220');this.resize.setAttribute('aria-valuemax','480');this.resize.setAttribute('aria-valuenow','290');
 }
 setInstruction(text){if(this.help)this.help.textContent=text;}
 dispose(){this.events.abort();this.focusResize?.disconnect();if(this.focusFrame)cancelAnimationFrame(this.focusFrame);}
}
