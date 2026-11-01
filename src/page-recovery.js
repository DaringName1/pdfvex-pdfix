import {pdfJob} from './pdf-jobs.js';
import {pageGeometry} from './page-geometry.js';

export class PageRecovery{
  constructor(workspace){this.workspace=workspace;this.pending=Promise.resolve();this.loading=true;this.revision=0;this.writes=0;}
  mount(){
    const w=this.workspace;this.root=w.element('div',undefined,'page-recovery');
    this.root.innerHTML='<span role="status" aria-live="polite">Reading saved arrangement…</span><div class="page-recovery-actions"><button class="secondary compact" data-recovery-retry hidden>Retry recovery</button><button class="text-button" data-recovery-fresh hidden>Start a fresh arrangement</button></div><div class="page-recovery-sources"></div>';
    w.dialog.querySelector('.page-actions').before(this.root);
    this.retry=this.root.querySelector('[data-recovery-retry]');this.fresh=this.root.querySelector('[data-recovery-fresh]');
    this.retry.onclick=()=>w.run(()=>this.blocked?this.load():this.flush());
    this.fresh.onclick=()=>{if(!this.confirmFresh){this.confirmFresh=true;this.fresh.textContent='Discard saved arrangement and start fresh';return;}w.run(async()=>{await window.pdfix.clearPagePlan(w.file.id);this.blocked=false;this.loading=false;this.confirmFresh=false;this.fresh.hidden=true;this.retry.hidden=true;this.root.querySelector('.page-recovery-sources').replaceChildren();this.changed();await this.flush();});};
  }
  status(message,error=false){this.root.querySelector('[role=status]').textContent=message;this.root.classList.toggle('recovery-error',error);}
  async load(){
    const w=this.workspace;this.loading=true;this.blocked=true;this.status('Reading saved arrangement…');this.root.querySelector('.page-recovery-sources').replaceChildren();
    try{
      const saved=await window.pdfix.loadPagePlan(w.file.id);if(w.closed)return;
      if(saved?.issues.length){
        this.status('Some original PDFs are missing or changed. Locate the exact originals to restore all pages, or start fresh.',true);
        for(const issue of saved.issues){const button=w.element('button',`Locate ${issue.name} (${issue.reason})`,'secondary compact');button.onclick=()=>w.run(async()=>{if(await window.pdfix.relinkPageSource(w.file.id,issue.index))await this.load();});this.root.querySelector('.page-recovery-sources').append(button);}
        this.retry.hidden=false;this.fresh.hidden=false;return;
      }
      if(saved){
        const sources=[];
        for(const file of saved.files){const info=await w.inspectSource(file);if(w.closed)return;sources.push({file,info});}
        const plan=structuredClone(saved.plan);
        for(const row of plan){const info=sources[row.source]?.info.pages[row.index];if(!info)throw new Error('A saved page is unavailable in its original PDF.');pageGeometry(info,row);}
        w.sources=sources;w.plan=plan;w.splitSettings=saved.split;w.history=[];w.redo=[];w.invalidate();w.renderPlan();
        this.status('Saved arrangement restored. Build a new preview before saving. Undo starts from this restored arrangement.');
      }else this.status('Your page changes are kept on this computer in case PDFix closes. Choose Preview new copy to save a new PDF.');
      this.blocked=false;this.retry.hidden=true;this.fresh.hidden=true;this.confirmFresh=false;
    }catch(error){if(w.closed)return;this.status(error.message,true);this.retry.hidden=false;this.fresh.hidden=false;w.announce(error.message,true);}
    finally{this.loading=false;if(!w.closed)w.setControls(w.busy);}
  }
  snapshot(){const w=this.workspace,plan=structuredClone(w.plan);for(const row of plan){if(row.resize&&row.resize.paper!=='custom'){const {paper,orientation,margin}=row.resize;row.resize={paper,orientation,margin};}}return {sourceIds:w.sources.map(s=>s.file.id),plan,split:structuredClone(w.splitSettings??null)};}
  changed(){if(this.loading||this.blocked||this.workspace.closed)return;this.dirty=true;this.revision++;this.status('Keeping your page changes in case PDFix closes…');clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush().catch(()=>{}),350);this.workspace.guard();}
  flush(){
    clearTimeout(this.timer);if(this.blocked)throw new Error('Restore the original PDFs or explicitly start fresh before changing this arrangement.');if(!this.dirty)return this.pending;
    const draft=this.snapshot(),revision=this.revision;this.dirty=false;this.writes++;this.workspace.guard();
    this.pending=this.pending.catch(()=>{}).then(()=>window.pdfix.savePagePlan(this.workspace.file.id,draft)).then(result=>{if(!this.workspace.closed&&revision===this.revision){this.status(result.versionWarning?'Arrangement saved. '+result.versionWarning:'Page arrangement saved locally.');this.retry.hidden=true;this.fresh.hidden=true;}}).catch(error=>{this.dirty=true;if(!this.workspace.closed){this.status('Recovery could not be saved. Retry before closing; your originals are safe.',true);this.retry.hidden=false;this.workspace.announce(error.message,true);}throw error;}).finally(()=>{this.writes--;this.workspace.guard();});
    return this.pending;
  }
  dispose(){clearTimeout(this.timer);}
}
