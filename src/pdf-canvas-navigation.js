import './pdf-canvas-navigation.css';

const INTERACTIVE='input,textarea,select,button,a,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="application"],.region-layer,.drawing-measurement-overlay';

/** View-only gestures. Rendering and scale limits remain owned by PdfReader.
 * Construct after reader.stage/options/multiPage exist; dispose with the reader.
 * No PDF data or global layout preferences are changed. */
export class PdfCanvasNavigation {
  constructor(reader){
    this.reader=reader;this.stage=reader.stage;this.closed=false;this.hand=false;this.pendingSteps=0;this.wheelDelta=0;
    this.events=new AbortController();const signal=this.events.signal;
    this.button=document.createElement('button');this.button.type='button';this.button.className='secondary compact';
    this.button.textContent='Hand tool';this.button.setAttribute('aria-pressed','false');this.button.setAttribute('aria-keyshortcuts','H');
    this.button.title='Drag to move around the page. H toggles this tool while the page view is focused.';
    reader.root.querySelector('.view-options-panel')?.append(this.button);
    this.button.addEventListener('click',()=>{this.setHand(!this.hand);reader.options.open=false;this.stage.focus({preventScroll:true});},{signal});
    this.stage.addEventListener('pointerdown',event=>this.pointerDown(event),{signal,capture:true});
    this.stage.addEventListener('pointermove',event=>this.pointerMove(event),{signal,capture:true});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])this.stage.addEventListener(type,event=>{if(event.pointerId===this.drag?.id)this.releaseDrag();},{signal,capture:true});
    this.stage.addEventListener('wheel',event=>this.wheel(event),{signal,passive:false});
    this.stage.addEventListener('keydown',event=>this.key(event),{signal});
    this.stage.addEventListener('dragstart',event=>{if(this.drag)event.preventDefault();},{signal});
    window.addEventListener('blur',()=>this.releaseDrag(),{signal});
    this.observe=new MutationObserver(()=>{if(!this.usable())this.releaseDrag();this.sync();});
    this.observe.observe(reader.root,{attributes:true,subtree:true,attributeFilter:['hidden','data-ready']});
    this.sync();
  }
  usable(target=this.stage){
    const reader=this.reader;
    if(this.closed||reader.disposed||!reader.doc||!reader.root.isConnected||document.querySelector('dialog[open]'))return false;
    const artwork=reader.artworkFullscreen;
    if(artwork?.busy||!reader.readable?.hidden)return false;
    if(!artwork?.active&&(reader.measurements?.active||reader.region&&!reader.region.hidden))return false;
    if(target instanceof Element&&target.closest(INTERACTIVE))return false;
    return true;
  }
  sync(){
    const usable=this.usable();this.button.disabled=!usable;
    this.stage.classList.toggle('pdf-hand-mode',this.hand&&usable);
    this.button.setAttribute('aria-pressed',String(this.hand));
  }
  setHand(value){this.hand=!!value;this.releaseDrag();this.sync();}
  pointerDown(event){
    if(!event.isPrimary||!this.usable(event.target)||event.ctrlKey||event.altKey||event.metaKey||!(this.hand&&event.button===0||event.button===1))return;
    this.releaseDrag();event.preventDefault();event.stopPropagation();
    this.stage.focus({preventScroll:true});
    this.drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:this.stage.scrollLeft,top:this.stage.scrollTop};
    this.stage.classList.add('pdf-hand-dragging');this.stage.setPointerCapture(event.pointerId);
  }
  pointerMove(event){
    const drag=this.drag;if(!drag||drag.id!==event.pointerId)return;
    if(!this.usable()){this.releaseDrag();return;}
    event.preventDefault();event.stopPropagation();
    this.stage.scrollLeft=drag.left+drag.x-event.clientX;this.stage.scrollTop=drag.top+drag.y-event.clientY;
  }
  releaseDrag(){
    const drag=this.drag;this.drag=null;this.stage.classList.remove('pdf-hand-dragging');
    if(drag&&this.stage.hasPointerCapture(drag.id))this.stage.releasePointerCapture(drag.id);
  }
  wheel(event){
    if(!event.ctrlKey||event.altKey||event.metaKey||!this.usable(event.target)||!Number.isFinite(event.deltaY)||!event.deltaY)return;
    event.preventDefault();this.releaseDrag();
    const factor=event.deltaMode===1?16:event.deltaMode===2?this.stage.clientHeight:1;
    const delta=event.deltaY*factor;
    if(this.wheelDelta&&Math.sign(this.wheelDelta)!==Math.sign(delta))this.wheelDelta=0;
    this.wheelDelta+=delta;clearTimeout(this.wheelTimer);this.wheelTimer=setTimeout(()=>{this.wheelDelta=0;},180);
    const steps=Math.trunc(this.wheelDelta/40);if(!steps)return;
    this.wheelDelta-=steps*40;this.queueZoom(-steps,{x:event.clientX,y:event.clientY});
  }
  key(event){
    if(event.defaultPrevented||event.altKey||event.metaKey||!this.usable(event.target))return;
    if(!event.ctrlKey&&!event.shiftKey&&event.key.toLowerCase()==='h'){
      event.preventDefault();event.stopPropagation();this.setHand(!this.hand);return;
    }
    const direction=['+','='].includes(event.key)?1:['-','−'].includes(event.key)?-1:0;
    if(!direction)return;event.preventDefault();event.stopPropagation();
    const rect=this.stage.getBoundingClientRect();this.queueZoom(direction,{x:rect.left+this.stage.clientWidth/2,y:rect.top+this.stage.clientHeight/2});
  }
  paperAt(point){
    if(!this.reader.multiPage?.active)return this.reader.paper.hidden?null:this.reader.paper;
    let nearest=null,distance=Infinity;
    for(const record of this.reader.multiPage.slots.values()){
      const rect=record.paper.getBoundingClientRect();
      const dx=Math.max(rect.left-point.x,0,point.x-rect.right),dy=Math.max(rect.top-point.y,0,point.y-rect.bottom),gap=dx*dx+dy*dy;
      if(gap<distance){nearest=record.paper;distance=gap;if(gap===0)break;}
    }
    return nearest;
  }
  anchorAt(point){
    const paper=this.paperAt(point);if(!paper)return null;
    const bounds=paper.getBoundingClientRect();if(!bounds.width||!bounds.height)return null;
    const x=Math.max(0,Math.min(1,(point.x-bounds.left)/bounds.width)),y=Math.max(0,Math.min(1,(point.y-bounds.top)/bounds.height));
    return {point:{x:bounds.left+x*bounds.width,y:bounds.top+y*bounds.height},doc:this.reader.doc,page:this.reader.pageNumber,rotation:this.reader.viewRotation,
      mode:this.reader.multiPage?.mode,fullscreen:!!this.reader.artworkFullscreen?.active,fullscreenTransition:this.reader.artworkFullscreen?.transition,anchorPage:Number(paper.closest('.pdf-multi-slot')?.dataset.page)||this.reader.pageNumber,
      x,y};
  }
  sameView(anchor){const reader=this.reader;return anchor&&reader.doc===anchor.doc&&reader.pageNumber===anchor.page&&reader.viewRotation===anchor.rotation&&reader.multiPage?.mode===anchor.mode&&!!reader.artworkFullscreen?.active===anchor.fullscreen&&reader.artworkFullscreen?.transition===anchor.fullscreenTransition&&!reader.artworkFullscreen?.busy;}
  restoreAnchor(anchor){
    const reader=this.reader;
    if(!this.usable()||!this.sameView(anchor))return;
    const paper=reader.multiPage?.active?reader.multiPage.slots.get(anchor.anchorPage)?.paper:reader.paper;
    if(!paper)return;const bounds=paper.getBoundingClientRect();
    this.stage.scrollLeft+=bounds.left+anchor.x*bounds.width-anchor.point.x;
    this.stage.scrollTop+=bounds.top+anchor.y*bounds.height-anchor.point.y;
  }
  queueZoom(steps,point){
    if(!this.usable()||!Number.isFinite(steps))return;
    this.releaseDrag();
    // Coalesce high-frequency trackpad events; never start overlapping PDF renders.
    this.pendingSteps=Math.max(-4,Math.min(4,this.pendingSteps+steps));this.zoomPoint=point;
    if(!this.zoomRunning)this.drainZoom();
  }
  async drainZoom(){
    this.zoomRunning=true;
    try{
      while(this.pendingSteps&&this.usable()){
        const direction=Math.sign(this.pendingSteps);this.pendingSteps-=direction;
        const anchor=this.anchorAt(this.zoomPoint);
        const before=this.reader.zoom;
        if(!this.reader.fit&&(direction>0&&before>=3||direction<0&&before<=.25)){this.pendingSteps=0;break;}
        await this.reader.action(direction>0?'zoom-in':'zoom-out');
        if(this.closed||!this.sameView(anchor))break;this.restoreAnchor(anchor);
        if(this.reader.zoom===before){this.pendingSteps=0;break;}
      }
    }catch(error){if(!this.closed&&!this.reader.disposed)this.reader.announce(error.message,true);}
    finally{this.pendingSteps=0;this.zoomRunning=false;}
  }
  dispose(){
    if(this.closed)return;this.closed=true;this.pendingSteps=0;clearTimeout(this.wheelTimer);
    this.releaseDrag();this.events.abort();this.observe.disconnect();this.button.remove();this.stage.classList.remove('pdf-hand-mode');
  }
}
