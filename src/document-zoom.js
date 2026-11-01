import {documentPaperSize} from './document-layout-model.js';
const PRESETS=[25,50,75,100,125,150,175,200],KEY='pdfix-document-zoom';
export class DocumentZoom{
 constructor(editor){
  this.editor=editor;this.canvas=editor.root.querySelector('.editor-canvas');this.page=editor.root.querySelector('.editor-page');this.mode='page';
  try{const saved=localStorage.getItem(KEY);if(saved==='fit'||saved==='page'||PRESETS.includes(Number(saved)))this.mode=['fit','page'].includes(saved)?saved:Number(saved);}catch{}
  this.root=editor.element('div',undefined,'document-zoom-controls');this.root.innerHTML='<button type="button" data-zoom-out aria-label="Zoom document out">−</button><select aria-label="Document view zoom"><option value="page">Page</option><option value="fit">Fit width</option>'+PRESETS.map(value=>`<option value="${value}">${value}%</option>`).join('')+'</select><button type="button" data-zoom-in aria-label="Zoom document in">+</button><output aria-live="polite" aria-label="Current document zoom"></output>';
  editor.root.querySelector('.draft-status').before(this.root);this.select=this.root.querySelector('select');if(editor.sourceMode)this.select.querySelector('[value=page]').textContent='Default size';
  this.root.querySelector('[data-zoom-out]').onclick=()=>this.step(-1);this.root.querySelector('[data-zoom-in]').onclick=()=>this.step(1);
  this.select.onchange=()=>this.set(['fit','page'].includes(this.select.value)?this.select.value:Number(this.select.value));
  this.wheel=event=>{if(!event.ctrlKey)return;event.preventDefault();const now=performance.now();if(this.lastWheel&&now-this.lastWheel<100)return;this.lastWheel=now;this.step(event.deltaY<0?1:-1);};
  this.canvas.addEventListener('wheel',this.wheel,{passive:false});this.observer=new ResizeObserver(()=>{if(editor.sourceMode||this.mode==='fit'||this.mode==='page')this.sync();});this.observer.observe(this.canvas);this.sync();
 }
 set(value){if(value!=='fit'&&value!=='page'&&!PRESETS.includes(value))return;this.mode=value;try{localStorage.setItem(KEY,String(value));}catch{}this.sync();}
 step(direction){const value=this.value??100,next=direction>0?PRESETS.find(p=>p>value+.1):PRESETS.findLast(p=>p<value-.1);if(next)this.set(next);}
 sync(){
  const layout=this.editor.layout,dimensions=documentPaperSize(layout);const width=dimensions[0]*96/25.4;
  const style=getComputedStyle(this.canvas),available=Math.max(0,this.canvas.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-2);
  const fit=Math.max(25,Math.min(200,Math.floor(available/width*100)));this.value=this.mode==='fit'?fit:this.mode==='page'?Math.min(100,fit):this.mode;
  if(this.editor.sourceMode){
   // Native textareas paint reliably when their pane remains unscaled. Zoom the text, not the native surface.
   this.value=typeof this.mode==='number'?this.mode:100;const track=(value,fallback)=>/^([\d.]+)px(?:\s|$)/.exec(value)?.[1]??fallback,split=this.editor.root.dataset.sourceView==='split',paneWidth=Number(split?track(style.gridTemplateColumns,available):available),availableHeight=Math.max(1,this.canvas.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)),paneHeight=Number(split?track(style.gridTemplateRows,availableHeight):availableHeight);
   this.page.style.width=Math.max(1,paneWidth)+'px';this.page.style.height=Math.max(1,paneHeight)+'px';this.page.style.minHeight='0';this.page.style.padding=Math.min(22,Math.max(2,(paneHeight-40)/2))+'px';this.page.style.zoom='1';this.editor.input.style.fontSize=13*this.value/100+'px';
  }else{this.page.style.width=`${dimensions[0]}mm`;this.page.style.minHeight=`${dimensions[1]}mm`;this.page.style.zoom=String(this.value/100);}this.select.value=String(this.mode);
  this.root.querySelector('output').textContent=`${this.value}%`;this.root.querySelector('[data-zoom-out]').disabled=this.value<=25;this.root.querySelector('[data-zoom-in]').disabled=this.value>=200;
 }
 dispose(){this.observer.disconnect();this.canvas.removeEventListener('wheel',this.wheel);this.root.remove();}
}
