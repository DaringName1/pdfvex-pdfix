import {ReaderPageToolHost} from './pdf-reader-page-tool-host.js';

// Presentation adapter only. Extraction, correction drafts, CSV/XLSX writes and
// disk verification remain in PdfTableExtractionWorkspace and its model.
export class ReaderTableHost extends ReaderPageToolHost {
  constructor(workspace){
    const reader=workspace.reader,overlay=workspace.overlay;
    super(reader,{panel:workspace.dialog,overlay,label:'Extract a table options',onEscape:()=>workspace.requestEscape(),onRendered:({page,viewport})=>{
      if(workspace.closed||!page)return;
      if(workspace.pageNumber!==reader.pageNumber){workspace.invalidate(true);workspace.pageNumber=reader.pageNumber;workspace.pageInput.value=reader.pageNumber;}
      workspace.page=page;workspace.viewport=viewport;workspace.ready=true;workspace.textAvailable=!!reader.layer.textContent.trim();workspace.drawGrid();workspace.controls();
    }});
    this.workspace=workspace;this.priorRotation=reader.viewRotation;
    workspace.dialog.querySelector('.table-extraction-source').remove();
    workspace.paper=reader.paper;workspace.canvas=reader.canvas;workspace.layer=reader.layer;
  }
  async load(){
    const w=this.workspace,r=this.reader,number=Number(w.pageInput.value);if(!Number.isInteger(number)||number<1||number>r.doc.numPages)throw new Error('Choose an existing page.');
    w.ready=false;w.invalidate(true);await r.singlePageView();r.viewRotation=0;await r.go(number);await r.renderPage();w.check();this.refresh();w.status.textContent=w.textAvailable?'Page loaded. Draw around its table and read selectable words.':'Page loaded. Draw around its table and recognize the scan locally.';
  }
  async dispose(){
    if(this.closed)return;super.dispose();const reader=this.reader;
    if(this.priorRotation&&reader.viewRotation===0&&!reader.disposed&&!reader.disposing){reader.viewRotation=this.priorRotation;await reader.renderPage();}
  }
}
