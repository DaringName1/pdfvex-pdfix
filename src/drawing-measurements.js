import {MEASUREMENT_UNITS,pointDistance} from './drawing-measurement-math.js';
import './drawing-measurements.css';
import {TakeoffLedger} from './takeoff-ledger.js';
import {MAX_TAKEOFF_POINTS,takeoffPath} from './takeoff-ledger-model.js';
const SVG='http://www.w3.org/2000/svg';
const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
const number=value=>new Intl.NumberFormat(undefined,{maximumFractionDigits:4}).format(value);
export class DrawingMeasurements{
 constructor(reader){this.reader=reader;this.points=[];this.mode='calibrate';this.active=false;this.ready=false;this.closed=false;this.mount();}
 mount(){
  this.button=el('button','Measure drawing','text-button');this.button.type='button';this.button.setAttribute('aria-pressed','false');this.reader.root.querySelector('.reader-tools').append(this.button);
  this.panel=el('section',undefined,'drawing-measurements');this.panel.hidden=true;this.panel.setAttribute('aria-label','Drawing measurements');
  this.panel.innerHTML='<div class="drawing-measurement-heading"><b>Drawing measurements</b><button type="button" class="icon-button" data-close aria-label="Close drawing measurements" title="Close drawing measurements">×</button></div><p class="drawing-measurement-scope"></p><div class="drawing-measurement-controls"><label>Tool<select data-mode aria-label="Drawing measurement tool"><option value="calibrate">Calibrate scale</option><option value="distance">Distance</option><option value="perimeter">Polyline / perimeter</option><option value="area">Polygon area</option><option value="count">Count points</option></select></label><label>Units<select data-unit aria-label="Drawing measurement units"></select></label><label class="drawing-measurement-close-loop"><input type="checkbox" data-loop> Close perimeter loop</label><button type="button" class="secondary compact" data-undo>Undo point</button><button type="button" class="secondary compact" data-clear>Clear points</button><button type="button" class="secondary compact" data-finish>Finish measurement</button><button type="button" class="text-button" data-recalibrate>Recalibrate</button></div><div class="drawing-calibration"><label>Known reference length<input type="number" data-length min="0.000000001" max="1000000000000" step="any" aria-label="Known drawing reference length" placeholder="For example 10"></label><label><input type="checkbox" data-confirm> I checked the two points, length and units against the drawing.</label><button type="button" class="primary compact" data-calibrate>Confirm scale</button></div><p class="drawing-measurement-result" role="status" aria-live="polite"></p><p class="drawing-measurement-help">Click points on the page. Keyboard: focus the overlay, arrows move the cursor (Shift for fine movement), Space adds a point, Enter finishes, Backspace undoes, Escape cancels. Finished measurements can be added explicitly to the separate takeoff ledger below. Measurements are approximate, using one uniform confirmed scale on this page; counts need no calibration. Check results against source dimensions; no CAD, geospatial or 3D interpretation.</p>';
  this.reader.root.querySelector('.pdf-body').before(this.panel);this.modeSelect=this.panel.querySelector('[data-mode]');this.units=this.panel.querySelector('[data-unit]');
  for(const [id,unit]of Object.entries(MEASUREMENT_UNITS)){const option=el('option',`${id} · ${unit.name}`);option.value=id;this.units.append(option);}
  this.svg=document.createElementNS(SVG,'svg');this.svg.classList.add('drawing-measurement-overlay');this.svg.setAttribute('tabindex','0');this.svg.setAttribute('role','application');this.svg.setAttribute('aria-label','Drawing measurement point placement. Arrow keys move; Space places a point.');this.svg.setAttribute('hidden','');this.reader.paper.append(this.svg);
  this.events=new AbortController();const on=(node,event,fn)=>node.addEventListener(event,fn,{signal:this.events.signal});
  on(this.button,'click',()=>this.toggle());on(this.panel.querySelector('[data-close]'),'click',()=>this.toggle(false));
  on(this.panel,'keydown',event=>{if(event.key==='Escape'&&!event.defaultPrevented){event.preventDefault();event.stopPropagation();this.toggle(false);}});
  on(this.modeSelect,'change',()=>{this.mode=this.modeSelect.value;this.clearPoints();});on(this.units,'change',()=>{this.unconfirm();this.update();});
  on(this.panel.querySelector('[data-length]'),'input',()=>{this.unconfirm();this.update();});on(this.panel.querySelector('[data-confirm]'),'change',()=>this.update());
  on(this.panel.querySelector('[data-loop]'),'change',()=>{this.finished=false;this.unconfirm();this.update();});
  on(this.panel.querySelector('[data-undo]'),'click',()=>this.undo());on(this.panel.querySelector('[data-clear]'),'click',()=>this.clearPoints());on(this.panel.querySelector('[data-recalibrate]'),'click',()=>this.recalibrate());
  on(this.panel.querySelector('[data-calibrate]'),'click',()=>this.calibrate());on(this.panel.querySelector('[data-finish]'),'click',()=>this.finish());
  on(this.svg,'pointerdown',event=>{if(!this.canPlace()||event.button!==0)return;event.preventDefault();this.svg.focus();this.pointer={id:event.pointerId,x:event.clientX,y:event.clientY};this.svg.setPointerCapture(event.pointerId);});
  on(this.svg,'pointerup',event=>{const start=this.pointer;this.releasePointer();if(!start||start.id!==event.pointerId||Math.hypot(start.x-event.clientX,start.y-event.clientY)>6)return;const box=this.svg.getBoundingClientRect();this.cursor=[(event.clientX-box.left)*this.viewport.width/box.width,(event.clientY-box.top)*this.viewport.height/box.height];this.place(this.cursor);});
  on(this.svg,'pointercancel',()=>this.releasePointer());on(this.svg,'lostpointercapture',()=>{this.pointer=null;});on(this.svg,'keydown',event=>this.key(event));
  this.observe=new MutationObserver(()=>{if(this.reader.paper.dataset.ready!=='true')this.invalidate();else if(this.reader.paper.hidden)this.toggle(false);});this.observe.observe(this.reader.paper,{attributes:true,attributeFilter:['data-ready','hidden']});this.ledger=new TakeoffLedger(this);this.update();
 }
 installOptionsPanel(){
  if(this.optionsPanel)return;this.optionsPanel=true;this.panel.classList.add('drawing-measurement-options');
  const instruction=el('p','Click points on the drawing. Press Enter to finish.','drawing-measurement-instruction');
  this.panel.querySelector('.drawing-measurement-heading').after(instruction);
  const more=el('details',undefined,'drawing-measurement-more'),summary=el('summary','How measurements work');more.append(summary,this.panel.querySelector('.drawing-measurement-scope'),this.panel.querySelector('.drawing-measurement-help'),...this.panel.querySelectorAll('.takeoff-ledger-note'));this.panel.append(more);
  const retention=el('p','Save the ledger to keep your quantities. Saving a PDF copy is separate.','takeoff-ledger-note');this.ledger.root.querySelector('summary').after(retention);
  this.reader.root.querySelector('.pdf-body').append(this.panel);
 }
 toggle(value=!this.active){
  if(value&&(!this.ready||this.reader.paper.hidden)){this.reader.announce('Wait for a rendered page and select Page view before measuring.');return;}
  if(value&&!this.active&&this.optionsPanel&&this.reader.root.clientWidth<1000){this.foldedPanes=['thumbnails','inspector'].filter(name=>!this.reader.root.querySelector(name==='thumbnails'?'.pdf-navigation':'.reader-inspector').hidden);for(const name of this.foldedPanes)this.reader.setPane(name,false,{persist:false});}
  const restoreFocus=!value&&(this.panel.contains(document.activeElement)||this.svg.contains(document.activeElement));this.active=value;this.panel.hidden=!value;this.button.setAttribute('aria-pressed',String(value));this.svg.toggleAttribute('hidden',!value||!this.ready);if(!value)this.releasePointer();else{this.reader.options.open=false;this.svg.focus();}this.draw();if(restoreFocus)this.reader.stage.focus();
  if(value&&this.optionsPanel&&this.reader.fit){const width=this.reader.stage.clientWidth,height=this.reader.stage.clientHeight;if(width!==this.reader.lastStageWidth||height!==this.reader.lastStageHeight){this.reader.lastStageWidth=width;this.reader.lastStageHeight=height;clearTimeout(this.reader.resizeTimer);this.focusWhenReady=true;this.invalidate();this.reader.renderPage().catch(error=>this.reader.announce(error.message,true));}}
  if(!value&&this.foldedPanes){const panes=this.foldedPanes;this.foldedPanes=null;if(!this.reader.disposed&&!this.reader.disposing)for(const name of panes)this.reader.setPane(name,true,{persist:false});}
 }
 invalidate(){if(this.closed)return;this.ready=false;this.svg.setAttribute('hidden','');this.releasePointer();this.update();}
 rendered({page,viewport}){
  if(this.closed)return;const view=page.view;
  if(!view||view.length!==4||view.some(v=>!Number.isFinite(v)||Math.abs(v)>1e7)||view[2]<=view[0]||view[3]<=view[1]||!Number.isFinite(viewport.width)||!Number.isFinite(viewport.height)||viewport.width<=0||viewport.height<=0){this.invalidate();return;}
  const key=JSON.stringify([this.reader.file.id??this.reader.file.name,page.pageNumber,view,page.userUnit]);
  if(this.pageKey!==key){this.pageKey=key;this.calibration=null;this.points=[];this.mode='calibrate';this.modeSelect.value=this.mode;this.finished=false;this.unconfirm();this.panel.querySelector('[data-length]').value='';}
  this.page=page;this.viewport=viewport;this.view=[...view];this.ready=true;this.cursor=[viewport.width/2,viewport.height/2];this.svg.setAttribute('viewBox',`0 0 ${viewport.width} ${viewport.height}`);this.svg.toggleAttribute('hidden',!this.active||this.reader.paper.hidden);this.update();if(this.focusWhenReady){this.focusWhenReady=false;if(this.active&&!this.panel.contains(document.activeElement))this.svg.focus();}
 }
 releasePointer(){const pointer=this.pointer;this.pointer=null;if(pointer&&this.svg.hasPointerCapture(pointer.id))this.svg.releasePointerCapture(pointer.id);}
 canPlace(){return this.active&&this.ready&&!this.closed&&!this.reader.paper.hidden&&this.reader.paper.dataset.ready==='true'&&!this.finished&&!this.ledger?.busy&&!this.ledger?.pdfWorkspace;}
 place(position){
  if(!this.canPlace())return;try{
   if(!['calibrate','count'].includes(this.mode)&&!this.calibration)throw new Error('Calibrate this page using a known reference before measuring.');
   const maximum=['calibrate','distance'].includes(this.mode)?2:MAX_TAKEOFF_POINTS;if(this.points.length>=maximum)throw new Error(`This tool accepts up to ${maximum} points. Clear or undo points to continue.`);
   const point=this.viewport.convertToPdfPoint(position[0],position[1]);if(point.some(v=>!Number.isFinite(v))||point[0]<this.view[0]-1e-5||point[0]>this.view[2]+1e-5||point[1]<this.view[1]-1e-5||point[1]>this.view[3]+1e-5)throw new Error('Place the point inside the visible PDF page.');
   if(this.points.length&&pointDistance(this.points.at(-1),point)<1e-5)throw new Error('Choose a different point.');this.points.push(point);this.unconfirm();this.finished=false;this.update();
  }catch(error){this.status(error.message);}
 }
 unconfirm(){this.panel.querySelector('[data-confirm]').checked=false;if(this.ledger)this.ledger.confirm.checked=false;}
 clearPoints(){if(this.ledger?.busy||this.ledger?.pdfWorkspace)return;this.releasePointer();this.points=[];this.finished=false;this.unconfirm();this.update();}
 undo(){if(this.ledger?.busy||this.ledger?.pdfWorkspace)return;this.releasePointer();this.points.pop();this.finished=false;this.unconfirm();this.update();}
 recalibrate(){if(this.ledger?.busy||this.ledger?.pdfWorkspace)return;this.calibration=null;this.mode='calibrate';this.modeSelect.value=this.mode;this.clearPoints();}
 calibrate(){if(this.ledger?.busy||this.ledger?.pdfWorkspace)return;try{
  if(!this.ready||this.mode!=='calibrate'||this.points.length!==2)throw new Error('Choose two points on a known reference length.');
  const length=Number(this.panel.querySelector('[data-length]').value),unit=MEASUREMENT_UNITS[this.units.value],distance=pointDistance(...this.points);
  if(!unit||!Number.isFinite(length)||length<1e-9||length>1e12||distance<1e-5)throw new Error('Enter a positive supported reference length and choose two distinct points.');
  if(!this.panel.querySelector('[data-confirm]').checked)throw new Error('Confirm that you checked the reference points, length and units.');
  this.calibration={mmPerPoint:length*unit.mm/distance,length,unit:this.units.value,reference:this.points.map(p=>[...p])};this.mode='distance';this.modeSelect.value=this.mode;this.points=[];this.finished=false;this.update();this.status('Scale confirmed for this page. Place two points to measure a distance.');
 }catch(error){this.status(error.message);}}
 finish(){if(this.ledger?.busy||this.ledger?.pdfWorkspace)return;try{if(!this.ready||this.mode!=='count'&&!this.calibration||this.mode==='calibrate')throw new Error('Confirm this page’s scale first.');this.result();this.finished=true;this.update();}catch(error){this.status(error.message);}}
 result(){const closed=this.mode==='area'||this.mode==='perimeter'&&this.panel.querySelector('[data-loop]').checked,result=takeoffPath(this.points,{closed,area:this.mode==='area',count:this.mode==='count'}),factor=this.mode==='count'?1:this.calibration.mmPerPoint/MEASUREMENT_UNITS[this.units.value].mm;return {length:result.length*factor,area:result.area*factor*factor,count:result.count,closed};}
 status(text){this.panel.querySelector('.drawing-measurement-result').textContent=text;}
 update(){
  if(this.closed)return;this.button.disabled=!this.ready||this.reader.paper.hidden;this.button.title=this.button.disabled?'Wait for the PDF page to finish loading, then use Page view.':'Drawing takeoffs';const calibrating=this.mode==='calibrate',unit=this.units.value;
  this.panel.querySelector('.drawing-calibration').hidden=!calibrating;this.panel.querySelector('.drawing-measurement-close-loop').hidden=this.mode!=='perimeter';
  const calibration=this.calibration;this.panel.querySelector('.drawing-measurement-scope').textContent=this.page?`${this.reader.file.name} · Page ${this.page.pageNumber} · Visible PDF bounds [${this.view.map(number).join(', ')}]${calibration?` · Confirmed reference ${number(calibration.length)} ${calibration.unit}`:' · Scale not calibrated'}`:'Wait for a rendered PDF page.';
  this.panel.querySelector('[data-calibrate]').disabled=!this.ready||this.points.length!==2||!this.panel.querySelector('[data-confirm]').checked;
  this.panel.querySelector('[data-undo]').disabled=!this.points.length;this.panel.querySelector('[data-clear]').disabled=!this.points.length;
  this.panel.querySelector('[data-finish]').disabled=!this.ready||calibrating||!calibration&&this.mode!=='count'||this.finished;
  if(!this.ready)this.status('Measurement paused while the page changes.');else if(calibrating)this.status(this.points.length===2?'Enter the known real length and units, check the reference, then confirm the scale.':`Place two reference points (${this.points.length}/2).`);
  else if(!calibration&&this.mode!=='count')this.status('Calibrate this page before measuring.');else{try{const result=this.result();this.status(`${this.finished?'Finished':'Current'} ${this.mode==='count'?`${result.count} count`:this.mode==='area'?`area ${number(result.area)} ${unit}² · Boundary ${number(result.length)} ${unit}`:`${result.closed?'perimeter':'length'} ${number(result.length)} ${unit}`} · ${this.points.length} points.${this.finished?' Clear points for another measurement.':''}`);}catch(error){this.status(error.message);}}
  const locked=!!this.ledger?.busy||!!this.ledger?.pdfWorkspace;if(locked)this.panel.querySelectorAll('button,input,select').forEach(control=>control.disabled=true);else{this.modeSelect.disabled=false;this.units.disabled=false;this.panel.querySelector('[data-length]').disabled=false;this.panel.querySelector('[data-confirm]').disabled=false;this.panel.querySelector('[data-loop]').disabled=false;this.panel.querySelector('[data-recalibrate]').disabled=false;this.panel.querySelector('[data-close]').disabled=false;}
  this.draw();this.ledger?.render();
 }
 draw(){
  this.svg.replaceChildren();if(!this.ready||!this.active)return;
  const projected=this.points.map(p=>this.viewport.convertToViewportPoint(...p)),closed=this.mode==='area'||this.mode==='perimeter'&&this.panel.querySelector('[data-loop]').checked;
  if(projected.length&&this.mode!=='count'){const path=document.createElementNS(SVG,closed&&projected.length>=3?'polygon':'polyline');path.setAttribute('points',projected.map(p=>p.join(',')).join(' '));path.setAttribute('class','drawing-measurement-line');this.svg.append(path);}
  projected.forEach((p,i)=>{const circle=document.createElementNS(SVG,'circle');circle.setAttribute('cx',p[0]);circle.setAttribute('cy',p[1]);circle.setAttribute('r','4');circle.setAttribute('class','drawing-measurement-point');const label=document.createElementNS(SVG,'text');label.setAttribute('x',p[0]+7);label.setAttribute('y',p[1]-7);label.textContent=String(i+1);this.svg.append(circle,label);});
  if(this.cursor&&document.activeElement===this.svg){const cursor=document.createElementNS(SVG,'path'),[x,y]=this.cursor;cursor.setAttribute('d',`M ${x-9} ${y} H ${x+9} M ${x} ${y-9} V ${y+9}`);cursor.setAttribute('class','drawing-measurement-cursor');this.svg.append(cursor);}
  this.ledger?.draw();
 }
 key(event){
  if(!this.active)return;const step=event.shiftKey?1:event.ctrlKey?50:10,offset={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[event.key];
  if(offset){event.preventDefault();event.stopPropagation();if(!this.ready)return;this.cursor??=[this.viewport.width/2,this.viewport.height/2];this.cursor=[Math.max(0,Math.min(this.viewport.width,this.cursor[0]+offset[0])),Math.max(0,Math.min(this.viewport.height,this.cursor[1]+offset[1]))];this.draw();return;}
  if([' ','Enter','Backspace','Escape'].includes(event.key)){event.preventDefault();event.stopPropagation();if(event.key===' ')this.place(this.cursor);else if(event.key==='Enter')this.finish();else if(event.key==='Backspace')this.undo();else this.toggle(false);}
 }
 async prepareDeparture(){await this.ledger?.prepareDeparture();}
 dispose(){if(this.closed)return;this.closed=true;this.ledger?.dispose();this.releasePointer();this.events.abort();this.observe.disconnect();this.svg.remove();this.panel.remove();this.button.remove();this.points=[];this.calibration=null;this.viewport=null;this.page=null;}
}
