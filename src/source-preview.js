import './source-preview.css';
const node=(tag,text)=>{const element=document.createElement(tag);if(text!==undefined)element.textContent=text;return element;};
function inline(parent,text){
 // No source HTML is parsed. Links/images are inert labels; remote resources are never fetched.
 const pattern=/(`[^`\n]{1,2000}`|\*\*[^*\n]{1,2000}\*\*|__[^_\n]{1,2000}__|\*[^*\n]{1,2000}\*|_[^_\n]{1,2000}_|!?\[[^\]\n]{0,1000}\]\([^\)\n]{1,2000}\))/g;
 let at=0,count=0;for(const match of text.matchAll(pattern)){if(++count>1000)break;parent.append(document.createTextNode(text.slice(at,match.index)));const value=match[0];
  if(value[0]==='`')parent.append(node('code',value.slice(1,-1)));
  else if(value.startsWith('**')||value.startsWith('__'))parent.append(node('strong',value.slice(2,-2)));
  else if(value.startsWith('*')||value.startsWith('_'))parent.append(node('em',value.slice(1,-1)));
  else{const parts=/^(!?)\[([^\]]*)\]\(([^)]*)\)$/.exec(value),label=node('span',parts[1]?`[Image: ${parts[2]||'unlabelled'}]`:`${parts[2]} (${parts[3]})`);label.className='source-inert-link';label.title=parts[3];parent.append(label);}
  at=match.index+value.length;
 }parent.append(document.createTextNode(text.slice(at)));
}
export class SourcePreview{
 constructor(parent){this.parent=parent;this.kind=['md','markdown'].includes(parent.file.ext)?'markdown':parent.file.ext==='csv'?'csv':null;if(!this.kind)return;
  this.view='source';this.page=0;this.column=0;this.revision=-1;this.delimiter=',';this.header=true;
  this.controls=node('div');this.controls.className='source-view-controls';this.controls.setAttribute('role','group');this.controls.setAttribute('aria-label','Source and preview view');
  for(const [value,label]of [['source','Edit source'],['preview',this.kind==='csv'?'Table view':'Markdown preview'],['split','Source and preview']]){const button=node('button',label);button.type='button';button.className='secondary compact';button.dataset.sourceView=value;if(value!=='source')button.title='Preview the source. HTML stays literal; links and pictures stay inactive. Complex formatting may look different.';button.onclick=()=>this.setView(value);this.controls.append(button);}
  if(this.kind==='csv'){const label=node('label','Separator '),select=node('select');select.setAttribute('aria-label','CSV separator');for(const [value,title]of [[',','Comma'],[';','Semicolon'],['\t','Tab']]){const option=node('option',title);option.value=value;select.append(option);}select.onchange=()=>{this.delimiter=select.value;this.revision=-1;this.refresh();};label.append(select);this.controls.append(label);const head=node('label'),check=node('input');check.type='checkbox';check.checked=true;check.onchange=()=>{this.header=check.checked;this.page=0;this.render();};head.append(check,document.createTextNode('First row is a heading'));this.controls.append(head);}
  this.status=node('p');this.status.className='source-preview-status';this.status.setAttribute('role','status');this.controls.append(this.status);
  parent.root.querySelector('.editor-import-notes').after(this.controls);
  this.panel=node('section');this.panel.className='source-preview-panel';this.panel.setAttribute('aria-label',this.kind==='csv'?'CSV table preview':'Markdown preview');this.panel.hidden=true;parent.root.querySelector('.editor-canvas').append(this.panel);this.setView('source');
 }
 setView(value){this.view=value;this.parent.root.dataset.sourceView=value;this.panel.hidden=value==='source';for(const button of this.controls.querySelectorAll('[data-source-view]'))button.setAttribute('aria-pressed',String(button.dataset.sourceView===value));if(value!=='source')this.refresh();else this.status.textContent='';this.parent.zoom?.sync();}
 changed(){if(!this.kind)return;clearTimeout(this.timer);this.status.dataset.previewReady='false';this.status.textContent=this.view==='source'?'':'Preview updating…';if(this.view!=='source')this.timer=setTimeout(()=>this.refresh(),300);}
 refresh(){if(!this.kind||this.view==='source'||this.disposed)return;this.worker?.terminate();clearTimeout(this.deadline);const revision=this.parent.revision;
  if(this.model&&this.revision===revision){this.render();return;}
  this.status.dataset.previewReady='false';this.status.textContent='Preparing local preview…';const worker=new Worker(new URL('./source-preview.worker.js',import.meta.url),{type:'module'});this.worker=worker;
  const fail=message=>{if(this.worker!==worker)return;worker.terminate();clearTimeout(this.deadline);this.worker=null;this.model=null;this.panel.replaceChildren(node('p',message));this.status.textContent='Preview unavailable; source editing remains available.';};
  this.deadline=setTimeout(()=>fail('Preview exceeded 10 seconds. Use a smaller source file.'),10000);
  worker.onerror=()=>fail('The local preview could not finish.');worker.onmessage=({data})=>{if(this.worker!==worker||this.disposed)return;if(data.error){fail(data.error);return;}worker.terminate();clearTimeout(this.deadline);this.worker=null;if(this.parent.revision!==revision){this.refresh();return;}this.model=data.value;this.revision=revision;this.page=0;this.column=0;this.render();};
  worker.postMessage({kind:this.kind,text:this.parent.input.value,delimiter:this.delimiter});
 }
 nav(total,count){const controls=node('div');controls.className='source-preview-nav';controls.hidden=total<=count;for(const [label,delta]of [['Previous',-1],['Next',1]]){const button=node('button',label);button.type='button';button.className='secondary compact';button.disabled=delta<0?this.page===0:(this.page+1)*count>=total;button.onclick=()=>{this.page+=delta;this.render();this.panel.scrollTop=0;};controls.append(button);}controls.append(node('span',`${Math.min(total,this.page*count+1)}–${Math.min(total,(this.page+1)*count)} of ${total}`));return controls;}
 render(){if(!this.model||this.disposed)return;this.panel.replaceChildren();if(this.kind==='markdown'){
   const blocks=this.model.blocks;let cellBudget=5000;this.page=Math.max(0,Math.min(this.page,Math.ceil(blocks.length/100)-1));this.panel.append(this.nav(blocks.length,100));
   for(const block of blocks.slice(this.page*100,(this.page+1)*100)){
    if(block.type==='table'){const wrapper=node('div');wrapper.className='source-table-scroll';const table=node('table');let shown=0;for(const [i,row]of block.rows.slice(0,100).entries()){if(cellBudget<Math.min(row.length,30))break;shown++;const tr=node('tr');for(const text of row.slice(0,30)){cellBudget--;const cell=node(i?'td':'th');if(!i)cell.scope='col';inline(cell,text);tr.append(cell);}table.append(tr);}wrapper.append(table);if(block.rows.length>shown||block.rows.some(row=>row.length>30))wrapper.append(node('p','This table preview is bounded to 100 rows, 30 columns and 5,000 cells per preview page. The complete table remains in source.'));this.panel.append(wrapper);continue;}
    const element=node(block.type==='quote'?'blockquote':block.type==='item'?'p':block.type);
    if(block.type==='pre')element.textContent=block.text;else if(block.type!=='hr'){if(block.type==='item'){element.className='source-list-item';element.style.paddingLeft=(block.depth*16)+'px';element.append(document.createTextNode(block.task!==null?(block.task?'☑ ':'☐ '):block.ordered?block.number+'. ':'• '));}inline(element,block.text);}this.panel.append(element);
   }
   this.status.textContent='Preview ready. Links and pictures stay inactive.';this.status.title='Basic Markdown preview: HTML stays literal; links and pictures are inactive. Complex nesting and extensions may look different.';
  }else{
   const rows=this.model.rows,start=this.header&&rows.length?1:0,total=rows.length-start;this.page=Math.max(0,Math.min(this.page,Math.ceil(total/50)-1));this.panel.append(this.nav(total,50));
   const columns=node('div');columns.className='source-preview-nav';for(const [label,delta]of [['Earlier columns',-1],['Later columns',1]]){const button=node('button',label);button.type='button';button.disabled=delta<0?!this.column:this.column+30>=this.model.columns;button.onclick=()=>{this.column=Math.max(0,this.column+delta*30);this.render();};columns.append(button);}columns.append(node('span',`Columns ${Math.min(this.model.columns,this.column+1)}–${Math.min(this.model.columns,this.column+30)}`));if(this.model.columns>30)this.panel.append(columns);
   const wrapper=node('div');wrapper.className='source-table-scroll';const table=node('table'),thead=node('thead'),heading=node('tr');heading.append(node('th','Row'));for(let column=this.column;column<Math.min(this.model.columns,this.column+30);column++){const title=this.header?rows[0]?.[column]??'':String(column+1),cell=node('th',title.slice(0,2000));cell.scope='col';heading.append(cell);}thead.append(heading);table.append(thead);const body=node('tbody');
   for(let r=start+this.page*50;r<Math.min(rows.length,start+(this.page+1)*50);r++){const tr=node('tr'),label=node('th',String(r+1));label.scope='row';tr.append(label);for(let c=this.column;c<Math.min(this.model.columns,this.column+30);c++){const value=rows[r][c]??'',cell=node('td',value.slice(0,2000)+(value.length>2000?'…':''));cell.tabIndex=0;cell.title='Enter or double-click to inspect the complete cell';const show=()=>this.showCell(r+1,c+1,value);cell.ondblclick=show;cell.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();show();}};tr.append(cell);}body.append(tr);}table.append(body);wrapper.append(table);this.panel.append(wrapper);
   this.status.textContent=`${rows.length} source rows · ${this.model.columns} columns · ${this.model.cells} cells. Values are literal; formulas are never executed. Enter on a cell shows its full value. Editing stays in source.`;
  }
  this.status.dataset.previewReady='true';
 }
 showCell(row,column,value){this.cellDialog?.close();const dialog=node('dialog');dialog.className='source-cell-dialog';const heading=node('h2',`Row ${row}, column ${column}`),input=node('textarea');input.readOnly=true;input.value=value;input.setAttribute('aria-label','Complete cell value');const close=node('button','Close');close.onclick=()=>dialog.close();dialog.append(heading,input,close);dialog.addEventListener('close',()=>{dialog.remove();if(this.cellDialog===dialog)this.cellDialog=null;});document.body.append(dialog);dialog.showModal();this.cellDialog=dialog;}
 dispose(){this.disposed=true;clearTimeout(this.timer);clearTimeout(this.deadline);this.worker?.terminate();this.cellDialog?.close();this.controls?.remove();this.panel?.remove();}
}
