import {viewportRectangle} from './pdf-viewport-geometry.js';
import './pdf-view-navigation.css';

const MAX_HISTORY=50,MAX_PIXELS=16_000_000;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const same=(a,b)=>a&&b&&a.doc===b.doc&&a.file===b.file&&a.fullscreen===b.fullscreen&&a.page===b.page&&a.mode===b.mode&&a.rotation===b.rotation&&a.fit===b.fit&&a.fitPage===b.fitPage&&(a.fit||Math.abs(a.zoom-b.zoom)<.0001)&&Math.abs(a.left-b.left)<1&&Math.abs(a.top-b.top)<1;

/** Intentional view navigation only. begin()/commit() surround go, fit/zoom,
 * rotation and reading-view changes; render/resize never create history entries.
 * Fullscreen transitions use a separate presentation history, reset on change.
 * This module neither mutates a PDF nor consumes its text selection. */
export class PdfViewNavigation {
  constructor(reader){
    this.reader=reader;this.closed=false;this.entries=[];this.cursor=-1;this.serial=0;this.suppressed=0;this.busy=false;
    this.events=new AbortController();const signal=this.events.signal;
    const menu=reader.root.querySelector('.view-options-panel');
    this.controls=document.createElement('div');this.controls.className='pdf-view-history';this.controls.setAttribute('role','group');this.controls.setAttribute('aria-label','Previous and next views');
    this.back=this.button('Previous view','Alt+ArrowLeft');this.forward=this.button('Next view','Alt+ArrowRight');this.regionButton=this.button('Zoom to region');this.regionButton.setAttribute('aria-pressed','false');
    this.controls.append(this.back,this.forward,this.regionButton);menu?.append(this.controls);
    const run=work=>Promise.resolve().then(work).catch(error=>{if(!this.closed&&!reader.disposed)reader.announce(error.message,true);});
    this.back.addEventListener('click',()=>run(()=>this.move(-1)),{signal});this.forward.addEventListener('click',()=>run(()=>this.move(1)),{signal});
    this.regionButton.addEventListener('click',()=>run(()=>this.active?this.cancelRegion():this.startRegion()),{signal});
    this.overlay=document.createElement('div');this.overlay.className='pdf-zoom-region-overlay';this.overlay.hidden=true;this.overlay.tabIndex=0;this.overlay.setAttribute('role','application');this.overlay.setAttribute('aria-label','Zoom region. Drag a rectangle on the PDF. Escape cancels.');
    this.box=document.createElement('div');this.box.className='pdf-zoom-region-box';this.box.hidden=true;this.box.setAttribute('aria-hidden','true');this.overlay.append(this.box);reader.paper.append(this.overlay);
    this.overlay.addEventListener('pointerdown',event=>this.pointerDown(event),{signal});this.overlay.addEventListener('pointermove',event=>this.pointerMove(event),{signal});this.overlay.addEventListener('pointerup',event=>run(()=>this.pointerUp(event)),{signal});
    this.overlay.addEventListener('pointercancel',()=>this.cancelRegion(),{signal});this.overlay.addEventListener('lostpointercapture',()=>{this.drag=null;},{signal});
    document.addEventListener('keydown',event=>{
      if(this.closed||reader.disposed||!reader.root.isConnected||document.querySelector('dialog[open]'))return;
      if(this.active&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();this.cancelRegion();reader.stage.focus({preventScroll:true});return;}
      if(!reader.root.contains(event.target)||event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||!event.altKey||event.target.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])'))return;
      const direction=event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:0;if(!direction)return;event.preventDefault();event.stopImmediatePropagation();run(()=>this.move(direction));
    },{signal,capture:true});
    window.addEventListener('blur',()=>this.cancelRegion(),{signal});
    this.observer=new MutationObserver(()=>{if(this.active&&!this.regionLive())this.cancelRegion();this.sync();});
    this.observer.observe(reader.root,{attributes:true,subtree:true,attributeFilter:['hidden','data-ready','data-page','data-rotation']});this.sync();
  }
  button(label,shortcut){const button=document.createElement('button');button.type='button';button.className='secondary compact';button.textContent=label;if(shortcut){button.setAttribute('aria-keyshortcuts',shortcut);button.title=label+' ('+shortcut.replace('Arrow','')+')';}return button;}
  usable(){const r=this.reader;return !this.closed&&!this.busy&&!r.disposed&&r.doc&&r.root.isConnected&&!document.querySelector('dialog[open]')&&!r.artworkFullscreen?.busy&&r.paper.dataset.ready==='true';}
  snapshot(){const r=this.reader;if(!r.doc||r.disposed||r.artworkFullscreen?.busy||r.paper.dataset.ready!=='true')return null;return {doc:r.doc,file:r.file,fullscreen:!!r.artworkFullscreen?.active,page:r.pageNumber,mode:r.readingView??r.root.querySelector('.reading-view').value,zoom:r.zoom,fit:r.fit,fitPage:r.fitPage,rotation:r.viewRotation,left:r.stage.scrollLeft,top:r.stage.scrollTop};}
  ensureContext(state){const current=this.entries[this.cursor];if(current&&(current.doc!==state.doc||current.file!==state.file||current.fullscreen!==state.fullscreen)){this.entries=[];this.cursor=-1;}if(this.cursor<0){this.entries=[state];this.cursor=0;}}
  begin(force=false){
    if(this.closed||this.suppressed&&!force)return null;
    const before=this.snapshot();if(!before)return null;this.cancelRegion();this.ensureContext(before);this.entries[this.cursor]=before;
    return {id:++this.serial,before,transition:this.reader.artworkFullscreen?.transition};
  }
  commit(token){
    if(!token||this.closed||token.id!==this.serial||this.reader.artworkFullscreen?.busy||token.transition!==this.reader.artworkFullscreen?.transition)return;
    const after=this.snapshot();if(!after||after.doc!==token.before.doc||after.file!==token.before.file||after.fullscreen!==token.before.fullscreen)return;
    if(!same(token.before,after)){this.entries.splice(this.cursor+1);this.entries.push(after);if(this.entries.length>MAX_HISTORY)this.entries.shift();this.cursor=this.entries.length-1;}else this.entries[this.cursor]=after;this.sync();
  }
  async navigate(work){if(this.busy||!this.usable())throw new Error('Wait for the PDF view to finish before navigating.');const token=this.begin(true);this.busy=true;this.suppressed++;this.sync();try{const result=await work();this.commit(token);return result;}finally{this.suppressed--;this.busy=false;this.sync();}}
  presentationChanged(){this.serial++;this.cancelRegion();this.entries=[];this.cursor=-1;const state=this.snapshot();if(state)this.ensureContext(state);this.sync();}
  rendered({page,viewport}){this.current={doc:this.reader.doc,page:page.pageNumber,rotation:this.reader.viewRotation,viewport};if(this.active&&!this.regionLive())this.cancelRegion();if(!this.suppressed&&!this.busy&&this.cursor<0){const state=this.snapshot();if(state)this.ensureContext(state);}this.sync();}
  sync(){const usable=!!this.usable();this.back.disabled=!usable||this.cursor<=0;this.forward.disabled=!usable||this.cursor<0||this.cursor>=this.entries.length-1;this.regionButton.disabled=!usable||!!this.reader.measurements?.active||!this.reader.region.hidden;this.regionButton.setAttribute('aria-pressed',String(!!this.active));}
  syncFit(){const r=this.reader;r.root.querySelector('[data-action=fit]').setAttribute('aria-pressed',String(r.fit&&!r.fitPage));r.root.querySelector('[data-action=fit-page]').setAttribute('aria-pressed',String(r.fit&&r.fitPage));}
  async move(direction){
    if(!this.usable())return;this.cancelRegion();const current=this.snapshot();if(!current)return;this.ensureContext(current);
    const index=this.cursor+Math.sign(direction),target=this.entries[index];if(!target)return;
    if(target.doc!==current.doc||target.file!==current.file||target.fullscreen!==current.fullscreen){this.presentationChanged();return;}
    this.entries[this.cursor]=current;this.busy=true;this.suppressed++;const id=++this.serial,transition=this.reader.artworkFullscreen?.transition;this.sync();
    try{
      const r=this.reader;r.options.open=false;r.zoom=target.zoom;r.fit=target.fit;r.fitPage=target.fitPage;r.viewRotation=target.rotation;r.pageNumber=target.page;r.pageInput.value=target.page;this.syncFit();r.root.querySelector('.reading-view').value=target.mode;
      await r.changeReadingView(target.mode);
      // setMode returns early for an unchanged multi-page mode; explicitly
      // navigate the physical page before restoring that mode's scroll offset.
      if(r.multiPage?.active)await r.multiPage.render(target.page,{scroll:true});
      if(this.closed||r.disposed||r.doc!==target.doc||r.file!==target.file||r.pageNumber!==target.page||r.viewRotation!==target.rotation||r.root.querySelector('.reading-view').value!==target.mode||r.fit!==target.fit||r.fitPage!==target.fitPage||!target.fit&&Math.abs(r.zoom-target.zoom)>.0001||id!==this.serial||r.artworkFullscreen?.busy||transition!==r.artworkFullscreen?.transition||!!r.artworkFullscreen?.active!==target.fullscreen)return;
      r.stage.scrollLeft=target.left;r.stage.scrollTop=target.top;this.cursor=index;r.stage.focus({preventScroll:true});
    }finally{this.suppressed--;this.busy=false;this.sync();}
  }
  async startRegion(){
    const r=this.reader;if(!this.usable())throw new Error('Wait for a rendered PDF page.');if(r.measurements?.active||!r.region.hidden)throw new Error('Finish drawing measurements or rectangle text selection before zooming to a region.');
    if(r.root.querySelector('.reading-view').value!=='page')await this.navigate(async()=>{r.root.querySelector('.reading-view').value='page';await r.changeReadingView('page');});
    if(!this.usable()||r.paper.hidden||r.multiPage?.active||this.current?.doc!==r.doc||this.current.page!==r.pageNumber||this.current.rotation!==r.viewRotation)throw new Error('Select Page view and wait for the page before zooming to a region.');
    this.active={doc:r.doc,file:r.file,page:r.pageNumber,rotation:r.viewRotation,viewport:this.current.viewport,transition:r.artworkFullscreen?.transition,fullscreen:!!r.artworkFullscreen?.active};
    this.previousHand=!!r.canvasNavigation?.hand;r.canvasNavigation?.setHand(false);this.overlay.hidden=false;this.box.hidden=true;r.options.open=false;this.overlay.focus({preventScroll:true});this.sync();r.announce('Drag a rectangle on the page to zoom. Escape cancels.');
  }
  regionLive(){const r=this.reader,a=this.active;return a&&this.usable()&&a.doc===r.doc&&a.file===r.file&&a.page===r.pageNumber&&a.rotation===r.viewRotation&&!r.paper.hidden&&!r.multiPage?.active&&r.region.hidden&&!r.measurements?.active&&a.transition===r.artworkFullscreen?.transition&&a.fullscreen===!!r.artworkFullscreen?.active;}
  point(event){const bounds=this.overlay.getBoundingClientRect();return {x:clamp(event.clientX-bounds.left,0,bounds.width),y:clamp(event.clientY-bounds.top,0,bounds.height),width:bounds.width,height:bounds.height};}
  pointerDown(event){if(!this.regionLive()||event.button!==0||!event.isPrimary)return;event.preventDefault();event.stopPropagation();this.drag={id:event.pointerId,start:this.point(event)};this.overlay.setPointerCapture(event.pointerId);this.box.hidden=false;this.updateBox(this.drag.start,this.drag.start);}
  pointerMove(event){if(!this.drag||this.drag.id!==event.pointerId)return;if(!this.regionLive()){this.cancelRegion();return;}event.preventDefault();this.updateBox(this.drag.start,this.point(event));}
  updateBox(a,b){Object.assign(this.box.style,{left:Math.min(a.x,b.x)+'px',top:Math.min(a.y,b.y)+'px',width:Math.abs(a.x-b.x)+'px',height:Math.abs(a.y-b.y)+'px'});}
  async pointerUp(event){
    const drag=this.drag,a=this.active;if(!drag||drag.id!==event.pointerId||!this.regionLive())return;event.preventDefault();event.stopPropagation();const end=this.point(event);this.releaseDrag();
    if(Math.abs(end.x-drag.start.x)<8||Math.abs(end.y-drag.start.y)<8){this.box.hidden=true;return;}
    const viewport=a.viewport;if(!end.width||!end.height)return;
    const p=viewport.convertToPdfPoint(drag.start.x*viewport.width/end.width,drag.start.y*viewport.height/end.height),q=viewport.convertToPdfPoint(end.x*viewport.width/end.width,end.y*viewport.height/end.height);
    if([...p,...q].some(value=>!Number.isFinite(value))){this.cancelRegion();throw new Error('This page region could not be mapped to PDF coordinates.');}
    this.cancelRegion();
    await this.navigate(async()=>{
      const r=this.reader,page=await r.doc.getPage(a.page);if(r.disposed||r.doc!==a.doc||r.file!==a.file||r.pageNumber!==a.page||r.viewRotation!==a.rotation||r.artworkFullscreen?.busy||a.transition!==r.artworkFullscreen?.transition)throw new Error('The PDF view changed. Select the region again.');
      const base=page.getViewport({scale:1,rotation:(page.rotate+a.rotation)%360}),box=viewportRectangle(base,[...p,...q]),width=Math.abs(box[2]-box[0]),height=Math.abs(box[3]-box[1]),style=getComputedStyle(r.stage),availableWidth=Math.max(1,r.stage.clientWidth-parseFloat(style.paddingLeft||0)-parseFloat(style.paddingRight||0)-24),availableHeight=Math.max(1,r.stage.clientHeight-parseFloat(style.paddingTop||0)-parseFloat(style.paddingBottom||0)-24);
      if(!width||!height||![width,height,base.width,base.height].every(value=>Number.isFinite(value)&&value>0))throw new Error('Unsupported page region dimensions.');
      r.fit=false;r.fitPage=false;r.zoom=Math.min(clamp(Math.min(availableWidth/width,availableHeight/height),.25,3),Math.sqrt(MAX_PIXELS/(base.width*base.height)));this.syncFit();
      await r.renderPage();if(r.disposed||r.doc!==a.doc||r.file!==a.file||r.pageNumber!==a.page||r.viewRotation!==a.rotation||r.artworkFullscreen?.busy||a.transition!==r.artworkFullscreen?.transition||r.paper.dataset.ready!=='true')return;
      const current=this.current;if(!current||current.page!==a.page||current.rotation!==a.rotation)return;const mapped=viewportRectangle(current.viewport,[...p,...q]),bounds=r.paper.getBoundingClientRect(),stage=r.stage.getBoundingClientRect();
      r.stage.scrollLeft+=bounds.left+(mapped[0]+mapped[2])/2-stage.left-r.stage.clientWidth/2;r.stage.scrollTop+=bounds.top+(mapped[1]+mapped[3])/2-stage.top-r.stage.clientHeight/2;r.stage.focus({preventScroll:true});
    });
  }
  releaseDrag(){const drag=this.drag;this.drag=null;if(drag&&this.overlay.hasPointerCapture(drag.id))this.overlay.releasePointerCapture(drag.id);}
  cancelRegion(){this.releaseDrag();this.active=null;this.overlay.hidden=true;this.box.hidden=true;if(this.previousHand!==undefined){this.reader.canvasNavigation?.setHand(this.previousHand);this.previousHand=undefined;}this.sync();}
  dispose(){if(this.closed)return;this.closed=true;this.serial++;this.cancelRegion();this.events.abort();this.observer.disconnect();this.controls.remove();this.overlay.remove();this.entries=[];this.current=null;}
}
