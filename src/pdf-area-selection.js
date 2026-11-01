import {orderVisualText,rectangleRuns} from './pdf-selection.js';
import './pdf-area-selection.css';

const choices=[['rows','Visible rows'],['two','Two columns, left then right'],['three','Three columns, left to right'],['content','Original PDF content sequence']];
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export class PdfAreaSelection{
  constructor(reader){
    this.reader=reader;this.region=reader.region;this.box=reader.regionBox;this.panel=reader.root.querySelector('.selection-panel');
    this.textarea=this.panel.querySelector('textarea');this.order='rows';this.entries=[];this.drag=null;
  }
  init(){
    if(this.events)return this;
    const doc=this.region.ownerDocument,label=doc.createElement('label'),select=doc.createElement('select'),note=doc.createElement('p');
    label.className='area-order';label.textContent='Copy reading order';select.setAttribute('aria-label','Selected area reading order');
    for(const[value,title]of choices){const option=doc.createElement('option');option.value=value;option.textContent=title;select.append(option);}
    label.append(select);note.className='area-scope';note.setAttribute('role','status');
    this.panel.querySelector('[data-action="copy-area"]').before(label,note);
    this.select=select;this.note=note;this.events=new AbortController();const signal=this.events.signal;
    this.region.addEventListener('pointerdown',event=>this.start(event),{signal});
    this.region.addEventListener('pointermove',event=>this.move(event),{signal});
    this.region.addEventListener('pointerup',event=>this.finish(event),{signal});
    this.region.addEventListener('pointercancel',event=>this.cancel(event),{signal});
    this.region.addEventListener('lostpointercapture',event=>this.cancel(event),{signal});
    select.addEventListener('change',()=>{this.order=select.value;this.preview();},{signal});
    return this;
  }
  bounds(){
    const b=this.reader.paper.getBoundingClientRect();
    if(![b.left,b.top,b.width,b.height].every(finite)||b.width<=0||b.height<=0)throw new Error('The page is not ready for rectangle selection.');
    return b;
  }
  point(event,b){
    if(![event.clientX,event.clientY].every(finite))throw new Error('The pointer location is unavailable. Draw the area again.');
    return {x:clamp(event.clientX-b.left,0,b.width),y:clamp(event.clientY-b.top,0,b.height)};
  }
  clear({preserveCompleted=false}={}){
    if(!preserveCompleted)this.completed=null;
    const active=this.drag;this.drag=null;
    if(active&&this.region.hasPointerCapture(active.id))this.region.releasePointerCapture(active.id);
    this.entries=[];this.reader.areaText='';this.reader.rect=null;this.box.hidden=true;this.panel.hidden=true;this.textarea.value='';
    if(this.note)this.note.textContent='';
    globalThis.CSS?.highlights?.delete('pdfix-area');
  }
  suspend(){this.clear({preserveCompleted:true});}
  restore(){
    const saved=this.completed,r=this.reader;
    if(!saved)return;
    if(r.disposed||r.doc!==saved.doc||r.pageNumber!==saved.page||r.viewRotation!==saved.rotation||!r.copyAllowed||this.region.hidden||r.paper.hidden){this.clear();return;}
    try{
      const b=this.bounds(),[left,top,right,bottom]=saved.area,rect={left:left*b.width,top:top*b.height,right:right*b.width,bottom:bottom*b.height};
      // Rebuild ranges against the new text layer, never retain detached DOM.
      this.entries=rectangleRuns(r.layer,b,rect);
      if(!this.entries.length){this.clear();return;}
      r.rect=rect;this.draw(rect);this.box.hidden=false;
      if(globalThis.CSS?.highlights&&typeof globalThis.Highlight==='function')globalThis.CSS.highlights.set('pdfix-area',new Highlight(...this.entries.map(entry=>entry.range)));
      this.preview();this.panel.hidden=false;
    }catch{this.clear();}
  }
  start(event){
    if(this.drag||this.reader.disposed||this.region.hidden||!this.reader.copyAllowed||event.button!==0||!event.isPrimary)return;
    this.clear();
    try{
      const b=this.bounds(),anchor=this.point(event,b);
      this.region.setPointerCapture(event.pointerId);
      this.drag={id:event.pointerId,anchor,b,page:this.reader.pageNumber,version:this.reader.version};
      this.box.hidden=false;this.draw({left:anchor.x,top:anchor.y,right:anchor.x,bottom:anchor.y});
      this.region.ownerDocument.getSelection()?.removeAllRanges();event.preventDefault();
    }catch(error){this.clear();this.reader.announce(error.message,true);}
  }
  samePage(){
    const drag=this.drag;if(!drag||this.reader.disposed||this.region.hidden||!this.reader.copyAllowed||this.reader.pageNumber!==drag.page||this.reader.version!==drag.version)return false;
    const b=this.bounds();return Math.abs(b.left-drag.b.left)<0.5&&Math.abs(b.top-drag.b.top)<0.5&&Math.abs(b.width-drag.b.width)<0.5&&Math.abs(b.height-drag.b.height)<0.5;
  }
  rectangle(event){
    const {anchor,b}=this.drag,p=this.point(event,b);
    return {left:Math.min(anchor.x,p.x),top:Math.min(anchor.y,p.y),right:Math.max(anchor.x,p.x),bottom:Math.max(anchor.y,p.y)};
  }
  draw(rect){
    Object.assign(this.box.style,{left:rect.left+'px',top:rect.top+'px',width:(rect.right-rect.left)+'px',height:(rect.bottom-rect.top)+'px'});
  }
  move(event){
    if(!this.drag||event.pointerId!==this.drag.id)return;
    try{if(!this.samePage()){this.clear();return;}const rect=this.rectangle(event);this.reader.rect=rect;this.draw(rect);}
    catch(error){this.clear();this.reader.announce(error.message,true);}
  }
  finish(event){
    if(!this.drag||event.pointerId!==this.drag.id)return;
    try{
      if(!this.samePage()){this.clear();return;}
      const rect=this.rectangle(event),bounds=this.drag.b;
      this.drag=null;if(this.region.hasPointerCapture(event.pointerId))this.region.releasePointerCapture(event.pointerId);
      if(rect.right-rect.left<2||rect.bottom-rect.top<2)throw new Error('Draw an area at least two pixels wide and high.');
      this.reader.rect=rect;this.draw(rect);
      this.entries=rectangleRuns(this.reader.layer,bounds,rect);
      if(!this.entries.length)throw new Error('No selectable words were found inside this area. Scanned text needs OCR.');
      this.completed={doc:this.reader.doc,page:this.reader.pageNumber,rotation:this.reader.viewRotation,area:[rect.left/bounds.width,rect.top/bounds.height,rect.right/bounds.width,rect.bottom/bounds.height]};
      if(globalThis.CSS?.highlights&&typeof globalThis.Highlight==='function')globalThis.CSS.highlights.set('pdfix-area',new Highlight(...this.entries.map(entry=>entry.range)));
      this.preview();this.panel.hidden=false;
    }catch(error){this.clear();this.reader.announce(error.message,true);}
  }
  cancel(event){if(this.drag&&event.pointerId===this.drag.id)this.clear();}
  preview(){
    if(!this.entries.length)return;
    const rect=this.reader.rect,entries=this.entries;let lines,crossing=0;
    if(this.order==='content')lines=[entries.map(entry=>entry.text).join(' ')];
    else if(this.order==='rows')lines=orderVisualText(entries);
    else{
      const count=this.order==='three'?3:2,columns=Array.from({length:count},()=>[]),width=(rect.right-rect.left)/count;
      for(const entry of entries){
        const midpoint=entry.left+entry.width/2,index=clamp(Math.floor((midpoint-rect.left)/width),0,count-1);
        if(entry.left<rect.left+index*width||entry.left+entry.width>rect.left+(index+1)*width)crossing++;
        columns[index].push(entry);
      }
      lines=columns.flatMap(column=>orderVisualText(column));
    }
    const text=lines.join('\n');this.reader.areaText=text;this.textarea.value=text;
    const method=choices.find(([value])=>value===this.order)?.[1]||'Visible rows';
    this.note.textContent=`${entries.length} selectable word${entries.length===1?'':'s'} inside this rectangle on page ${this.reader.pageNumber}. ${method} controls the preview and copied text. PDF positions and content order may differ from intended reading order; compare with the page artwork before copying.${crossing?` ${crossing} word${crossing===1?'':'s'} cross a column boundary and were assigned by center.`:''} Image-only text is not included; this tool produces no OCR text.`;
  }
  dispose(){this.clear();this.events?.abort();this.events=null;this.select?.parentElement?.remove();this.note?.remove();}
}
