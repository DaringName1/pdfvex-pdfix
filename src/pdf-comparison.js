import {rememberPdfDialogFocus} from './pdf-dialog-focus.js';
import {destroyPdfDocument} from './pdf-document-lifecycle.js';
import * as pdfjs from 'pdfjs-dist';
import { textChanges, pixelChanges } from './pdf-difference.js';
import './pdf-comparison.css';
import {DrawingOverlay} from './drawing-overlay.js';
import {PdfComparisonMatching} from './pdf-comparison-matching.js';

export class PdfComparison {
  constructor(sources, output, ui, plan = null) {
    this.sources = sources; this.output = output; this.plan = plan; Object.assign(this, ui);
    this.leftSource = 0; this.leftPage = 1; this.rightPage = 1; this.linked = !!plan;
    this.version = 0; this.queue = Promise.resolve(); this.tasks = new Set(); this.renderTasks = new Set(); this.cancelledTasks = new WeakSet(); this.labelWaits=new Set();
  }
  async open() {
    this.dialog = this.element('dialog', undefined, 'pdf-comparison');
    this.dialog.innerHTML = `<div class="dialog-header"><div><h2>Compare PDFs</h2><p class="subtitle">Review page artwork and selectable text. Both files stay unchanged.</p></div><button class="icon-button" aria-label="Close PDF comparison" title="Close PDF comparison">×</button></div>
      <div class="comparison-controls"><label><input type="checkbox" data-linked ${this.linked?'checked':''}> Follow matched pairs</label><label><input type="checkbox" data-scroll checked> Link scrolling</label><button class="secondary compact" data-fit>Fit page</button><button class="secondary compact" data-zoom-out aria-label="Zoom out comparison">−</button><button class="secondary compact" data-zoom-in aria-label="Zoom in comparison">+</button><label><input type="checkbox" data-difference> Show visual changes</label><button class="secondary compact" data-check>Check all page pairs</button><button class="secondary compact" data-cancel hidden>Cancel check</button></div>
      <p class="comparison-status" role="status" aria-live="polite">Opening the comparison locally…</p><p class="comparison-alignment">${this.plan ? 'Linked pages follow your output page order, including combined and duplicated pages.' : 'Use Page matching to pair corresponding pages before checking all pages.'}</p>
      <div class="comparison-pages">${['left','right'].map((side, index) => `<section class="comparison-pane" data-side="${side}" aria-label="${index ? 'Compared PDF' : 'Original PDF'}"><div class="comparison-page-heading"><b>${index ? 'Compared copy' : 'Original'}</b>${!index && this.sources.length > 1 ? '<select aria-label="Original source"></select>' : '<span class="comparison-filename"></span>'}</div><div class="comparison-page-controls"><button class="secondary compact" data-prev aria-label="Previous ${side} page">‹</button><label>Page <input aria-label="${index ? 'Compared' : 'Original'} page number" type="number" min="1" value="1"></label><span class="comparison-total"></span><button class="secondary compact" data-next aria-label="Next ${side} page">›</button></div><div class="comparison-stage" tabindex="0" aria-label="${index ? 'Compared' : 'Original'} page artwork"><canvas class="comparison-artwork" aria-label="${index ? 'Compared' : 'Original'} rendered page"></canvas>${index ? '<canvas class="comparison-difference" aria-label="Visual change map" hidden></canvas>' : ''}</div></section>`).join('')}</div>
      <details class="comparison-text"><summary>Text changes <span class="comparison-text-count"></span></summary><p class="comparison-text-note"></p><div class="comparison-text-content" tabindex="0" aria-label="Page text changes"></div></details>
      <details class="comparison-report" hidden><summary>Page check results</summary><p class="comparison-report-note"></p><div class="comparison-report-list"></div></details>
      <p class="comparison-policy">Pink shows artwork changes at review resolution. Text uses PDF extraction order and can differ on complex layouts. This review does not verify metadata, attachments, links, permissions or interactive form behavior.</p>`;
    document.body.append(this.dialog); rememberPdfDialogFocus(this.dialog);this.dialog.showModal();
    this.dialog.querySelector('[aria-label="Close PDF comparison"]').onclick = () => this.dialog.close();
    this.dialog.addEventListener('close', () => this.dispose());
    this.left = this.dialog.querySelector('[data-side=left]'); this.right = this.dialog.querySelector('[data-side=right]');
    this.status = this.dialog.querySelector('.comparison-status');
    this.overlay = new DrawingOverlay(this);const overlayNote=this.overlay.root.querySelector('.comparison-overlay-note');overlayNote.textContent=overlayNote.textContent.replace('retain their original physical page/page-plan comparisons','follow the confirmed page mapping without overlay alignment adjustments');this.matching = new PdfComparisonMatching(this);
    this.dialog.querySelector('[data-linked]').onchange = e => { this.linked = e.target.checked; this.schedule(); };
    this.dialog.querySelector('[data-difference]').onchange = () => this.showDifference();
    this.dialog.querySelector('[data-fit]').onclick = () => { this.zoom = null; this.schedule(); };
    for (const [name, change] of [['zoom-in', .25], ['zoom-out', -.25]]) this.dialog.querySelector(`[data-${name}]`).onclick = () => { this.zoom = Math.max(.25, Math.min(3, (this.zoom ?? this.lastScale ?? 1)+change)); this.schedule(); };
    this.dialog.querySelector('[data-check]').onclick = () => this.checkAll();
    this.dialog.querySelector('[data-cancel]').onclick = () => { this.cancelCheck = true; for (const task of this.renderTasks) task.cancel(); };
    for (const [pane, side] of [[this.left,'left'],[this.right,'right']]) {
      const change = n => {
        if (this.checking || this.matchingBusy || !this.output.doc) return;
        const doc = side === 'left' ? this.sources[this.leftSource].doc : this.output.doc;
        if (!doc) return;
        n = Math.max(1, Math.min(doc.numPages, Math.trunc(n)||1));
        if (side === 'left') { this.leftPage = n; if (this.linked) this.rightPage = Math.min(n, this.output.doc.numPages); }
        else this.rightPage = n;
        this.schedule();
      };
      pane.querySelector('input').onchange = e => change(Number(e.target.value));
      pane.querySelector('[data-prev]').onclick = () => change((side === 'left' ? this.leftPage : this.rightPage)-1);
      pane.querySelector('[data-next]').onclick = () => change((side === 'left' ? this.leftPage : this.rightPage)+1);
      const stage = pane.querySelector('.comparison-stage');
      stage.addEventListener('keydown', event => {
        if (event.target !== stage || event.ctrlKey || event.altKey || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
        event.preventDefault(); const target = (this.pageMapping || this.plan) && this.linked ? this.right : pane;
        target.querySelector(event.key === 'ArrowLeft' ? '[data-prev]' : '[data-next]').click();
      });
      stage.addEventListener('scroll', () => {
        if (!this.dialog.querySelector('[data-scroll]').checked || this.scrollSource && this.scrollSource !== stage) return;
        this.scrollSource = stage; clearTimeout(this.scrollTimer);
        const proportion = (value, extent) => extent > 0 ? value/extent : 0;
        const peers=[this.left.querySelector('.comparison-stage'),this.right.querySelector('.comparison-stage'),this.overlay.stage];
        for(const other of peers)if(other!==stage&&other.clientHeight){other.scrollTop = proportion(stage.scrollTop, stage.scrollHeight-stage.clientHeight)*(other.scrollHeight-other.clientHeight);other.scrollLeft = proportion(stage.scrollLeft, stage.scrollWidth-stage.clientWidth)*(other.scrollWidth-other.clientWidth);}
        this.scrollTimer = setTimeout(() => { this.scrollSource = null; }, 80);
      });
    }
    this.overlay.stage.addEventListener('scroll',()=>{const stage=this.overlay.stage;if(!this.dialog.querySelector('[data-scroll]').checked||this.scrollSource&&this.scrollSource!==stage)return;this.scrollSource=stage;clearTimeout(this.scrollTimer);for(const pane of [this.left,this.right]){const other=pane.querySelector('.comparison-stage');other.scrollTop=(stage.scrollHeight>stage.clientHeight?stage.scrollTop/(stage.scrollHeight-stage.clientHeight):0)*(other.scrollHeight-other.clientHeight);other.scrollLeft=(stage.scrollWidth>stage.clientWidth?stage.scrollLeft/(stage.scrollWidth-stage.clientWidth):0)*(other.scrollWidth-other.clientWidth);}this.scrollTimer=setTimeout(()=>{this.scrollSource=null;},80);});
    const select = this.left.querySelector('select');
    if (select) { this.sources.forEach((source,index) => { const option = this.element('option',source.name); option.value = index; select.append(option); }); select.onchange = e => { this.leftSource = Number(e.target.value); this.leftPage = 1; this.schedule(); }; }
    this.resize = new ResizeObserver(() => { const geometry=[this.left,this.right].map(p=>{const stage=p.querySelector('.comparison-stage');return `${stage.clientWidth},${stage.clientHeight}`;}).join('|');if(geometry===this.resizeGeometry)return;this.resizeGeometry=geometry;clearTimeout(this.resizeTimer);if(this.ready&&!this.checking&&!this.matchingBusy){this.dialog.dataset.ready='false';this.controls(true);this.resizeTimer=setTimeout(()=>this.schedule(),150);} });
    this.resize.observe(this.left.querySelector('.comparison-stage')); this.resize.observe(this.right.querySelector('.comparison-stage'));
    this.controls(true);
    try {
      await this.load(this.output); if (this.closed) return;
      this.align(); await this.load(this.sources[this.leftSource]); if (this.closed) return;
      this.ready = true; this.matching.ready(); await this.schedule();
    } catch (error) { if (!this.closed) { this.status.textContent = error.message; this.announce(error.message, true); } }
    finally { if (!this.closed) this.controls(!this.ready||this.dialog.dataset.ready!=='true'); }
  }
  async load(source) {
    if (source.doc) return source.doc;
    const assets = new URL('pdf-assets/', document.baseURI).href;
    const task = pdfjs.getDocument({ data: new Uint8Array(source.bytes), cMapUrl: assets+'cmaps/', cMapPacked: true, standardFontDataUrl: assets+'standard_fonts/', wasmUrl: assets+'wasm/', iccUrl: assets+'iccs/', isEvalSupported: false, enableXfa: false, maxImageSize: 16_000_000, stopAtErrors: true });
    this.tasks.add(task);
    task.onPassword = (update, reason) => this.password(task, update, reason, source.name);
    let timer;
    try {
      const doc = await Promise.race([task.promise, new Promise((_,reject) => { timer = setTimeout(() => { task.destroy(); reject(new Error('Comparison opening timed out. Try a smaller or repaired PDF.')); }, 120_000); })]);
      if (this.closed) { await destroyPdfDocument(doc); return; }
      if (doc.numPages > 500) throw new Error('Comparison supports up to 500 pages per PDF. Extract a smaller range first.');
      const permissions = await doc.getPermissions(); source.copyAllowed = !permissions || permissions.has(pdfjs.PermissionFlag.COPY);
      source.doc = doc; return doc;
    } catch (error) {
      await task.destroy();
      throw new Error(this.cancelledTasks.has(task) || error.name === 'PasswordException' ? 'Comparison canceled. Reopen it to enter the PDF password.' : error.message || 'The comparison PDF could not be read.');
    } finally { clearTimeout(timer); this.passwordDialog?.close(); this.passwordDialog?.remove(); this.passwordDialog = null; }
  }
  password(task, update, reason, name) {
    this.passwordDialog?.remove();
    const dialog = this.element('dialog',undefined,'password-dialog');
    dialog.append(this.element('h2','Unlock comparison PDF'), this.element('p', `${name} · ${reason === pdfjs.PasswordResponses.INCORRECT_PASSWORD ? 'That password did not unlock the file. Try again.' : 'Use the password supplied by the owner. It stays in this session.'}`));
    const form = this.element('form'), label = this.element('label','PDF password'), input = this.element('input'); input.type = 'password'; input.autocomplete = 'off'; input.setAttribute('aria-label','Comparison PDF password'); label.append(input);
    const actions = this.element('div',undefined,'dialog-actions'), cancel = this.element('button','Cancel','secondary'), unlock = this.element('button','Unlock','primary'); cancel.type = 'button'; actions.append(cancel,unlock); form.append(label,actions); dialog.append(form); document.body.append(dialog); this.passwordDialog = dialog;
    let submitted = false;
    form.onsubmit = e => { e.preventDefault(); if (!input.value) return; submitted = true; const value = input.value; input.value = ''; dialog.close(); dialog.remove(); this.passwordDialog = null; update(value); };
    cancel.onclick = () => dialog.close(); dialog.onclose = () => { if (!submitted) { this.cancelledTasks.add(task); task.destroy(); } dialog.remove(); }; dialog.showModal(); input.focus();
  }
  align() {
    if (!this.linked) return;
    const row = this.matching?.mapping(this.rightPage-1); if (row) { this.leftSource = row.source; this.leftPage = row.index+1; }
  }
  controls(disabled) {
    this.dialog.querySelectorAll('button,input,select').forEach(control => { if (control.getAttribute('aria-label') !== 'Close PDF comparison' && !control.hasAttribute('data-cancel') && !control.hasAttribute('data-match-cancel')) control.disabled = disabled; });
    if (!disabled) {
      for (const [pane, source, number] of [[this.left,this.sources[this.leftSource],this.leftPage],[this.right,this.output,this.rightPage]]) { pane.querySelector('[data-prev]').disabled = !source.doc || number <= 1; pane.querySelector('[data-next]').disabled = !source.doc || number >= source.doc.numPages; pane.querySelector('input').disabled = !source.doc; }
      if ((this.pageMapping || this.plan) && this.linked) this.left.querySelectorAll('input,select,[data-prev],[data-next]').forEach(control => control.disabled = true);
      this.dialog.querySelector('[data-linked]').disabled = !this.pageMapping && !this.plan;
      this.dialog.querySelector('[data-check]').disabled = this.output.doc.numPages > 100 || !this.pageMapping && !this.plan;
      const unmatched=this.linked&&(this.pageMapping||this.plan)&&!this.matching.mapping(this.rightPage-1);this.dialog.querySelector('[data-difference]').disabled=!!unmatched;
      this.matching?.syncControls();
      this.dialog.querySelector('[data-check]').title = this.output.doc.numPages > 100 ? 'Whole-document checking is limited to 100 output pages. Individual page comparisons remain available.' : this.pageMapping || this.plan ? 'Check each output page against its confirmed counterpart; unmatched pages are reported separately.' : 'Confirm page matching before checking all pairs.';
    }
  }
  schedule() {
    if (this.closed || !this.ready || this.checking || this.matchingBusy) return this.queue;
    clearTimeout(this.resizeTimer);
    const version = ++this.version; for (const task of this.renderTasks) task.cancel();
    this.overlay?.invalidate();
    this.dialog.dataset.ready = 'false'; this.status.textContent = 'Updating page comparison…'; this.controls(true);
    this.queue = this.queue.catch(() => {}).then(async () => {
      if (this.closed || version !== this.version) return;
      try { await this.render(version); }
      catch (error) { if (!this.closed && version === this.version) { this.status.textContent = error.message; this.announce(error.message,true); this.controls(false); } }
    }); return this.queue;
  }
  async raster(page, canvas, scale, common = null, display = false) {
    const viewport = page.getViewport({scale});
    const ratio = display ? Math.min(window.devicePixelRatio || 1,2,Math.sqrt(15_990_000/(viewport.width*viewport.height))) : 1;
    const width = common?.width ?? Math.ceil(viewport.width*ratio), height = common?.height ?? Math.ceil(viewport.height*ratio);
    if (width*height > 16_000_000) throw new Error('This page exceeds the comparison pixel limit.');
    canvas.width = width; canvas.height = height;
    if (display) { canvas.style.width = `${viewport.width}px`; canvas.style.height = `${viewport.height}px`; }
    const context = canvas.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0,0,width,height);
    const task = page.render({canvasContext:context,viewport,background:'#fff',transform:ratio !== 1 ? [ratio,0,0,ratio,0,0] : undefined}); this.renderTasks.add(task);
    try { await task.promise; } finally { this.renderTasks.delete(task); }
    return canvas;
  }
  async pair(leftDoc, leftNumber, rightDoc, rightNumber) {
    return [await leftDoc.getPage(leftNumber), await rightDoc.getPage(rightNumber)];
  }
  async difference(pages, source) {
    const bases = pages.map(page => page.getViewport({scale:1}));
    const scale = Math.min(1,512/Math.max(...bases.map(b => b.width)),768/Math.max(...bases.map(b => b.height)));
    const width = Math.max(...bases.map(b => Math.ceil(b.width*scale))), height = Math.max(...bases.map(b => Math.ceil(b.height*scale)));
    const canvases = [document.createElement('canvas'), document.createElement('canvas')];
    try {
      await this.raster(pages[0],canvases[0],scale,{width,height}); await this.raster(pages[1],canvases[1],scale,{width,height});
      const visual = pixelChanges(canvases[0].getContext('2d').getImageData(0,0,width,height).data,canvases[1].getContext('2d').getImageData(0,0,width,height).data,width,height);
      let text;
      if (source.copyAllowed === false || this.output.copyAllowed === false) text = { unavailable:'Text comparison is disabled because a PDF restricts copying.',parts:[] };
      else {
        const strings = []; let oversized = false;
        for (const page of pages) {
          const content = await page.getTextContent(), runs = []; let size = 0;
          for (const item of content.items) if ('str' in item) { size += item.str.length+1; if (size > 100_000) { oversized = true; break; } runs.push(item.str+(item.hasEOL?'\n':' ')); }
          strings.push(oversized ? '' : runs.join('').trim());
        }
        if (oversized) text = {unavailable:'This page has too much text for a detailed comparison. Review its artwork.',parts:[]};
        else {
          text = textChanges(...strings); text.scan = !strings[0] || !strings[1];
          if (text.scan) text.note = !strings[0] && !strings[1] ? 'Neither page has selectable text. Review the artwork; OCR accuracy is not assessed.' : 'One page has no selectable text. Text changes may reflect OCR or a scan rather than visible edits. Review the artwork.';
        }
      }
      const resized = Math.abs(bases[0].width-bases[1].width) > .5 || Math.abs(bases[0].height-bases[1].height) > .5;
      return {visual,text,width,height,resized};
    } finally { canvases.forEach(canvas => { canvas.width = canvas.height = 0; }); }
  }
  async render(version) {
    this.align(); if(this.linked&&(this.pageMapping||this.plan)&&!this.matching.mapping(this.rightPage-1))return this.renderUnmatched(version);const source = this.sources[this.leftSource]; await this.load(source);
    if (this.closed || version !== this.version) return;
    this.leftPage = Math.min(this.leftPage,source.doc.numPages); const pages = await this.pair(source.doc,this.leftPage,this.output.doc,this.rightPage);
    if (this.closed || version !== this.version) return;
    this.dialog.dataset.ready = 'false'; this.status.textContent = 'Checking this page pair…'; this.controls(true);
    try {
      const stages = [this.left,this.right].map(pane => pane.querySelector('.comparison-stage'));
      if (this.dialog.dataset.leftPage !== String(this.leftPage) || this.dialog.dataset.rightPage !== String(this.rightPage) || this.dialog.dataset.leftSource !== String(this.leftSource)) stages.forEach(stage => { stage.scrollTop = stage.scrollLeft = 0; });
      const bases = pages.map(page => page.getViewport({scale:1}));
      const available = Math.min(...stages.map(stage => Math.min((stage.clientWidth-26)/Math.max(...bases.map(b => b.width)),(stage.clientHeight-26)/Math.max(...bases.map(b => b.height)))));
      const scale = Math.min(this.zoom ?? Math.max(.05,Math.min(2,available)),...bases.map(b => Math.sqrt(16_000_000/(b.width*b.height)))); this.lastScale = scale;
      for (let i = 0; i < 2; i++) {
        const pane = i ? this.right : this.left, doc = i ? this.output.doc : source.doc, number = i ? this.rightPage : this.leftPage;
        const input = pane.querySelector('input'); input.value = number; input.max = doc.numPages;
        pane.querySelector('.comparison-total').textContent = `/ ${doc.numPages}`;
        const name = pane.querySelector('.comparison-filename'); if (name) { name.textContent = i ? this.output.name : source.name; name.title = name.textContent; }
        if (pane.querySelector('select')) pane.querySelector('select').value = this.leftSource;
        await this.raster(pages[i],pane.querySelector('.comparison-artwork'),scale,null,true);
        if (this.closed || version !== this.version) return;
      }
      const result = await this.difference(pages,source); if (this.closed || version !== this.version) return;
      const canvas = this.right.querySelector('.comparison-difference'); canvas.width = result.width; canvas.height = result.height; canvas.style.width = `${result.width*scale/Math.min(1,512/Math.max(...bases.map(b => b.width)),768/Math.max(...bases.map(b => b.height)))}px`;
      canvas.getContext('2d').putImageData(new ImageData(result.visual.pixels,result.width,result.height),0,0);
      const percent = result.visual.changed ? `${result.visual.fraction < .0001 ? '<0.01' : (result.visual.fraction*100).toFixed(2)}% of the review pixels differ` : 'No artwork changes detected at review resolution';
      this.status.textContent = `${source.name} · page ${this.leftPage} ↔ ${this.output.name} · page ${this.rightPage}. ${percent}.${result.resized ? ' Page dimensions or orientation differ.' : ''}${this.linked?' Confirmed counterpart.':' These pages have not been matched.'}`;
      this.left.querySelector('.comparison-unmatched')?.remove();this.dialog.dataset.unmatched='false';this.renderText(result.text); this.showDifference();
      const labels=await Promise.all([this.pageLabel(source,this.leftPage),this.pageLabel(this.output,this.rightPage)]);if(this.closed||version!==this.version)return;
      this.overlay.setPair({key:`${this.leftSource}:${this.leftPage}:${this.rightPage}`,leftName:source.name,rightName:this.output.name,leftNumber:this.leftPage,rightNumber:this.rightPage,leftLabel:labels[0],rightLabel:labels[1],leftCanvas:this.left.querySelector('.comparison-artwork'),rightCanvas:this.right.querySelector('.comparison-artwork'),leftBase:bases[0],rightBase:bases[1],displayScale:scale});
      for(const [pane,label]of [[this.left,labels[0]],[this.right,labels[1]]]){let note=pane.querySelector('.comparison-page-label');if(!note){note=this.element('span',undefined,'comparison-page-label');pane.querySelector('.comparison-page-controls').append(note);}note.textContent=label?`Label: ${label}`:'Physical page';note.title=note.textContent;}
      this.dialog.dataset.visualChanges = String(result.visual.changed); this.dialog.dataset.textChanged = result.text.changed ? 'true' : result.text.unavailable ? 'unavailable' : 'false';
      this.dialog.dataset.unmatched='false';this.dialog.dataset.leftPage = this.leftPage; this.dialog.dataset.rightPage = this.rightPage; this.dialog.dataset.leftSource = this.leftSource; this.dialog.dataset.ready = 'true';
    } finally { if (!this.closed && version === this.version) this.controls(false); }
  }
  async renderUnmatched(version){
    const page=await this.output.doc.getPage(this.rightPage);if(this.closed||version!==this.version)return;
    const stage=this.right.querySelector('.comparison-stage'),base=page.getViewport({scale:1}),available=Math.min((stage.clientWidth-26)/base.width,(stage.clientHeight-26)/base.height),scale=Math.min(this.zoom??Math.max(.05,Math.min(2,available)),Math.sqrt(16_000_000/(base.width*base.height)));this.lastScale=scale;
    await this.raster(page,this.right.querySelector('.comparison-artwork'),scale,null,true);if(this.closed||version!==this.version)return;
    for(const canvas of this.left.querySelectorAll('canvas'))canvas.width=canvas.height=0;const difference=this.right.querySelector('.comparison-difference');difference.width=difference.height=0;
    const originalStage=this.left.querySelector('.comparison-stage');if(!originalStage.querySelector('.comparison-unmatched'))originalStage.append(this.element('p','No original counterpart selected.','comparison-unmatched'));this.left.querySelector('.comparison-page-label')?.remove();
    this.right.querySelector('input').value=this.rightPage;this.right.querySelector('input').max=this.output.doc.numPages;this.right.querySelector('.comparison-total').textContent='/ '+this.output.doc.numPages;this.right.querySelector('.comparison-filename').textContent=this.output.name;
    this.left.querySelector('.comparison-total').textContent='No counterpart';this.dialog.dataset.unmatched='true';this.showDifference();this.overlay.invalidate();this.overlay.heading.textContent='Compared page '+this.rightPage+' has no confirmed original counterpart.';this.overlay.status.textContent='Choose a counterpart in Page matching to use the drawing overlay.';
    const label=await this.pageLabel(this.output,this.rightPage);if(this.closed||version!==this.version)return;let labelNode=this.right.querySelector('.comparison-page-label');if(!labelNode){labelNode=this.element('span',undefined,'comparison-page-label');this.right.querySelector('.comparison-page-controls').append(labelNode);}labelNode.textContent=label?'Label: '+label:'Physical page';labelNode.title=labelNode.textContent;
    this.renderText({unavailable:'No text or artwork difference is calculated for an unmatched page.',parts:[]});this.status.textContent=`${this.output.name} · physical page ${this.rightPage}: unmatched / inserted in your reviewed mapping. No original page is substituted.`;this.dialog.dataset.leftPage='';this.dialog.dataset.leftSource='';this.dialog.dataset.rightPage=String(this.rightPage);this.dialog.dataset.visualChanges='unmatched';this.dialog.dataset.textChanged='unavailable';this.dialog.dataset.ready='true';this.controls(false);
  }
  async pageLabel(source,number){
    if(!source.comparisonPageLabelsRead){
      source.comparisonPageLabelsRead=true;let timer,finish;
      try{
        const cancelled=new Promise(resolve=>{finish=()=>resolve(null);this.labelWaits.add(finish);timer=setTimeout(finish,10000);});
        const labels=await Promise.race([source.doc.getPageLabels(),cancelled]);source.comparisonPageLabels=Array.isArray(labels)&&labels.length<=500?labels.map(value=>typeof value==='string'?value.slice(0,200):''):null;
      }catch{source.comparisonPageLabels=null;}finally{clearTimeout(timer);this.labelWaits.delete(finish);}
    }
    return source.comparisonPageLabels?.[number-1]||'';
  }
  renderText(result) {
    const content = this.dialog.querySelector('.comparison-text-content'); content.replaceChildren();
    this.dialog.querySelector('.comparison-text-count').textContent = result.unavailable ? '· unavailable' : result.changed ? '· changes found' : result.scan ? '· no selectable text' : '· no changes';
    this.dialog.querySelector('.comparison-text-note').textContent = result.unavailable || `${result.note || 'Removed text is red and crossed out; added text is green and underlined.'}${result.coarse ? ' Large changed passages are shown as whole blocks.' : ''}`;
    for (const part of result.parts) content.append(this.element(part.kind === 'added' ? 'ins' : part.kind === 'removed' ? 'del' : 'span',part.text,`comparison-${part.kind}`));
    if (!result.parts.length) content.append(this.element('p',result.unavailable || 'No selectable text on this page pair.'));
  }
  showDifference() { const enabled = this.dialog.dataset.unmatched!=='true'&&this.dialog.querySelector('[data-difference]').checked; this.right.querySelector('.comparison-artwork').hidden = enabled; this.right.querySelector('.comparison-difference').hidden = !enabled; this.right.querySelector('.comparison-stage').setAttribute('aria-label',enabled ? 'Visual change map, pink marks changed artwork' : 'Compared page artwork'); }
  async checkAll() {
    if (this.checking || this.matchingBusy || !this.ready) return;
    await this.queue; if (this.closed || this.checking || this.matchingBusy) return;if(!this.pageMapping&&!this.plan){this.announce('Confirm page matching before checking all page pairs.');return;}
    this.checking = true; this.cancelCheck = false; this.controls(true); this.dialog.querySelector('[data-cancel]').hidden = false;
    const report = this.dialog.querySelector('.comparison-report'), list = report.querySelector('.comparison-report-list'); report.hidden = false; report.open = true; list.replaceChildren();
    const started = performance.now(); let checked = 0, changed = 0, uncertain = 0, unmatched = 0;
    try {
      for (let index = 0; index < this.output.doc.numPages; index++) {
        if (this.closed || this.cancelCheck) throw new Error('Page check canceled. Results below are partial.');
        if (performance.now()-started > 120_000) throw new Error('Page checking reached its two-minute limit. Results below are partial.');
        const mapping = this.matching.mapping(index);if(!mapping){unmatched++;checked++;const row=this.element('button',`Compared page ${index+1}: unmatched / inserted; no counterpart was confirmed.`,'text-button');row.onclick=()=>{this.rightPage=index+1;this.linked=true;this.dialog.querySelector('[data-linked]').checked=true;this.schedule();};list.append(row);continue;}const source=this.sources[mapping.source];await this.load(source);const number=mapping.index+1;
        this.status.textContent = `Checking page pair ${index+1} of ${this.output.doc.numPages}…`;
        if (number > source.doc.numPages) { changed++; const row = this.element('button',`Compared page ${index+1} has no original counterpart.`,'text-button'); row.onclick = () => { this.rightPage = index+1; this.linked = true; this.dialog.querySelector('[data-linked]').checked = true; this.schedule(); }; list.append(row); checked++; continue; }
        const pages = await this.pair(source.doc,number,this.output.doc,index+1), result = await this.difference(pages,source);
        if (this.closed || this.cancelCheck) throw new Error('Page check canceled. Results below are partial.');
        const differs = result.visual.changed > 0 || result.resized || result.text.changed;
        const unsure = !!(result.text.scan || result.text.unavailable); if (differs) changed++; if (unsure) uncertain++;
        const row = this.element('button',`${source.name} · page ${number} → page ${index+1}: ${differs ? 'changes detected' : 'no changes detected at review resolution'}${unsure ? ' · visual review needed' : ''}`,'text-button');
        row.onclick = () => { this.rightPage = index+1; this.linked = true; this.dialog.querySelector('[data-linked]').checked = true; this.schedule(); }; list.append(row); checked++;
        await new Promise(resolve => setTimeout(resolve,0));
      }
      let extra = '';
      const effective=this.pageMapping??this.plan,retained=new Set(effective.filter(Boolean).map(row=>`${row.source}:${row.index}`)),unknown=this.sources.some(source=>!source.doc&&!Number.isInteger(source.pageCount)),total=this.sources.reduce((sum,source)=>sum+(source.doc?.numPages||source.pageCount||0),0);extra=` ${retained.size} distinct original counterparts; ${unknown?'original omissions are not fully counted because some sources were not opened':Math.max(0,total-retained.size)+' original pages are unmatched / omitted'}. Matches follow ${this.pageMapping?'your confirmed review mapping':'the exact output page plan'}.`;
      this.status.textContent = `Reviewed ${checked} compared pages: ${changed} page pairs with detected changes, ${unmatched} unmatched compared pages, ${uncertain} pairs needing visual/text uncertainty review.${extra}`;
    } catch (error) { if (!this.closed) this.status.textContent = this.cancelCheck ? 'Page check canceled. Results below are partial.' : error.message; }
    finally { if (!this.closed) { report.querySelector('.comparison-report-note').textContent = this.status.textContent; this.checking = false; this.dialog.querySelector('[data-cancel]').hidden = true; this.controls(false); } }
  }
  dispose() {
    if (this.closed) return; this.closed = true; this.version++; this.cancelCheck = true;
    clearTimeout(this.resizeTimer); clearTimeout(this.scrollTimer); for(const finish of this.labelWaits)finish();this.labelWaits.clear();this.resize?.disconnect();this.matching?.dispose();this.overlay?.dispose();
    for (const task of this.renderTasks) task.cancel(); for (const task of this.tasks) task.destroy();
    this.passwordDialog?.close(); this.passwordDialog?.remove(); if (this.dialog.open) this.dialog.close(); this.dialog.remove();
    this.dialog.querySelectorAll('canvas').forEach(canvas => { canvas.width = canvas.height = 0; });
    this.sources = []; this.output = null;
  }
}
