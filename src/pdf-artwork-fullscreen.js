import './pdf-artwork-fullscreen.css';

/** Artwork-only presentation of the existing reader; no document mutation. */
export class PdfArtworkFullscreen {
  constructor(reader){
    this.reader=reader;this.app=reader.root.closest('#app');this.active=false;this.busy=false;
    if(!this.app)return;
    this.button=document.createElement('button');this.button.type='button';this.button.className='icon-button pdf-artwork-entry';this.button.innerHTML=reader.icon('fullscreen');this.button.title='PDF fullscreen (Ctrl Shift Enter)';this.button.setAttribute('aria-label','Show PDF only in fullscreen');this.button.setAttribute('aria-pressed','false');
    reader.root.querySelector('.reader-tools').append(this.button);
    this.controls=document.createElement('div');this.controls.className='pdf-artwork-exit';this.controls.hidden=true;
    this.exitButton=document.createElement('button');this.exitButton.type='button';this.exitButton.className='secondary compact';this.exitButton.textContent='Exit PDF fullscreen · Esc';this.controls.append(this.exitButton);reader.stage.append(this.controls);
    this.events=new AbortController();const on=(node,event,fn,options={})=>node.addEventListener(event,fn,{...options,signal:this.events.signal});
    const run=work=>work().catch(error=>reader.announce(error.message,true));
    on(this.button,'click',()=>run(()=>this.enter()));on(this.exitButton,'click',()=>run(()=>this.exit()));
    on(reader.stage,'pointermove',()=>{if(this.active)this.reveal();},{passive:true});
    on(document,'keydown',event=>{
      if(this.closed||!reader.root.isConnected||document.querySelector('dialog[open]'))return;
      // Escape must still take effect while entry is painting the page. exit() already waits for the active transition.
      if(this.busy){if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();run(()=>this.exit());}return;}
      if(!this.active){if(event.ctrlKey&&event.shiftKey&&event.key==='Enter'&&reader.doc){event.preventDefault();event.stopImmediatePropagation();run(()=>this.enter());}return;}
      if(event.key==='Escape'&&reader.viewNavigation?.active){event.preventDefault();event.stopImmediatePropagation();reader.viewNavigation.cancelRegion();reader.stage.focus({preventScroll:true});return;}
      if(event.key==='Escape'||event.key==='F11'){event.preventDefault();event.stopImmediatePropagation();run(()=>this.exit());return;}
      if(event.ctrlKey&&!event.shiftKey&&['f','p'].includes(event.key.toLowerCase())){event.preventDefault();event.stopImmediatePropagation();const action=event.key.toLowerCase()==='f'?'find':'print';run(async()=>{await this.exit();await reader.action(action);});return;}
      if(event.key==='Tab')this.reveal();
    },{capture:true});
    this.unsubscribe=window.pdfix?.onWindowState(state=>{this.windowFullscreen=state.fullscreen;if(this.active&&!this.busy&&!state.fullscreen)run(()=>this.exit({restoreWindow:false}));});
    on(document,'fullscreenchange',()=>{if(!window.pdfix){this.windowFullscreen=!!document.fullscreenElement;if(this.active&&!this.busy&&!this.windowFullscreen)run(()=>this.exit({restoreWindow:false}));}});
  }
  reveal(){this.controls.classList.add('is-visible');clearTimeout(this.hideTimer);this.hideTimer=setTimeout(()=>this.controls.classList.remove('is-visible'),1800);}
  async setWindowFullscreen(value){
    if(window.pdfix){const result=await window.pdfix.fullscreen(value);this.windowFullscreen=result.fullscreen;}
    else{if(value&&!document.fullscreenElement)await document.documentElement.requestFullscreen();else if(!value&&document.fullscreenElement)await document.exitFullscreen();this.windowFullscreen=!!document.fullscreenElement;}
  }
  enter(){if(this.closed||this.busy)return this.transition??Promise.resolve();this.transition=this.enterView();return this.transition;}
  async enterView(){
    const reader=this.reader;if(!this.app||this.closed||this.active||this.busy||reader.disposed||!reader.doc)return;
    if(document.querySelector('dialog[open]'))throw new Error('Close the current dialog before showing only the PDF.');
    this.busy=true;
    try{
      const state=window.pdfix?await window.pdfix.windowState():{fullscreen:!!document.fullscreenElement};
      if(this.closed||reader.disposed)return;
      this.saved={fullscreen:state.fullscreen,fit:reader.fit,fitPage:reader.fitPage,zoom:reader.zoom,page:reader.pageNumber,view:reader.root.querySelector('.reading-view').value,left:reader.stage.scrollLeft,top:reader.stage.scrollTop,focus:document.activeElement};
      this.windowFullscreen=state.fullscreen;
      reader.options.open=false;
      if(this.saved.view==='text'){reader.root.querySelector('.reading-view').value='page';await reader.changeReadingView('page');}
      this.active=true;this.app.classList.add('pdf-artwork-fullscreen');reader.root.classList.add('pdf-artwork-host');this.controls.hidden=false;this.button.setAttribute('aria-pressed','true');
      this.inertNodes=[...this.app.querySelectorAll('.sidebar,.topbar'),...reader.root.children].filter(node=>node!==reader.root.querySelector('.pdf-body')).map(node=>({node,inert:node.inert}));
      for(const item of this.inertNodes)item.node.inert=true;
      reader.fit=true;reader.fitPage=true;this.syncFit();
      if(!state.fullscreen)await this.setWindowFullscreen(true);
      if(this.closed||reader.disposed)return;
      await reader.renderPage();reader.stage.focus();this.reveal();
    }catch(error){await this.restore({restoreWindow:true,restoreView:true}).catch(()=>{});throw error;}
    finally{this.busy=false;this.reader.canvasNavigation?.sync();this.reader.viewNavigation?.presentationChanged();}
  }
  syncFit(){const reader=this.reader;reader.root.querySelector('[data-action=fit]').setAttribute('aria-pressed',String(reader.fit&&!reader.fitPage));reader.root.querySelector('[data-action=fit-page]').setAttribute('aria-pressed',String(reader.fit&&reader.fitPage));}
  async restore({restoreWindow=true,restoreView=true}={}){
    const saved=this.saved,reader=this.reader;this.active=false;this.saved=null;
    this.app?.classList.remove('pdf-artwork-fullscreen');reader.root.classList.remove('pdf-artwork-host');this.controls.hidden=true;clearTimeout(this.hideTimer);this.button.setAttribute('aria-pressed','false');
    for(const item of this.inertNodes??[])item.node.inert=item.inert;this.inertNodes=[];
    if(!saved)return;
    let windowError;try{if(restoreWindow&&this.windowFullscreen!==saved.fullscreen)await this.setWindowFullscreen(saved.fullscreen);}catch(error){windowError=error;}
    reader.fit=saved.fit;reader.fitPage=saved.fitPage;reader.zoom=saved.zoom;this.syncFit();
    if(restoreView&&!reader.disposed&&reader.root.isConnected){
      reader.pageNumber=saved.page;reader.root.querySelector('.reading-view').value=saved.view;await reader.changeReadingView(saved.view);
      reader.stage.scrollLeft=saved.left;reader.stage.scrollTop=saved.top;
      if(saved.focus?.isConnected&&!saved.focus.closest('[inert]'))saved.focus.focus({preventScroll:true});else reader.stage.focus({preventScroll:true});
    }
    if(windowError)throw windowError;
  }
  exit(options){if(this.busy)return (this.transition??Promise.resolve()).then(()=>this.active?this.exit(options):undefined);if(!this.active)return Promise.resolve();this.transition=this.exitView(options);return this.transition;}
  async exitView(options){this.busy=true;try{await this.restore(options);}finally{this.busy=false;this.reader.canvasNavigation?.sync();this.reader.viewNavigation?.presentationChanged();}}
  async dispose(){if(this.closed)return;await this.transition?.catch(()=>{});await this.exit({restoreView:false});this.closed=true;this.unsubscribe?.();this.events?.abort();clearTimeout(this.hideTimer);this.controls?.remove();this.button?.remove();}
}
