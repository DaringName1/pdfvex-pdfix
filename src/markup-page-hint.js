import './markup-page-hint.css';

const instructions={
 highlight:['Drag across words to highlight','text'],
 underline:['Drag across words to underline','text'],
 note:['Click where you want to comment','copy'],
 text:['Drag a text box, then type inside it','text'],
 ink:['Drag to draw','crosshair'],
 line:['Drag to draw a line','crosshair'],
 arrow:['Drag from the tail to the arrow tip','crosshair'],
 cloud:['Drag around the detail','crosshair'],
 callout:['Drag from the detail to its comment','crosshair'],
 move:['Drag the selected mark to move it','move'],
 erase:['Click the drawing you want to remove','crosshair'],
 'partial-erase':['Drag over the ink you want to erase','crosshair']
};

// A visual reminder beside the pointer, never a hit target or a second editor.
// The panel instruction remains available to keyboard and screen-reader users.
export function attachMarkupPageHint(workspace){
 const layer=workspace.layer,doc=layer.ownerDocument,events=new AbortController(),hint=doc.createElement('div');
 hint.className='markup-page-hint';hint.setAttribute('aria-hidden','true');hint.hidden=true;doc.body.append(hint);
 const hide=()=>{hint.hidden=true;};
 const sync=()=>{const instruction=instructions[workspace.tool];layer.style.cursor=instruction?.[1]||'auto';hint.textContent=instruction?.[0]||'';hide();};
 layer.addEventListener('pointermove',event=>{
  if(event.pointerType==='touch'||event.buttons||workspace.gesture||workspace.busy||workspace.saving||workspace.departing||!workspace.ready||!instructions[workspace.tool]){hide();return;}
  hint.textContent=instructions[workspace.tool][0];hint.hidden=false;
  const bounds=hint.getBoundingClientRect(),view=doc.defaultView;
  hint.style.left=Math.max(8,Math.min(event.clientX+18,view.innerWidth-bounds.width-8))+'px';
  hint.style.top=Math.max(8,Math.min(event.clientY+22,view.innerHeight-bounds.height-8))+'px';
 },{signal:events.signal});
 for(const type of ['pointerleave','pointerdown','pointercancel'])layer.addEventListener(type,hide,{signal:events.signal});
 doc.addEventListener('scroll',hide,{capture:true,signal:events.signal});doc.addEventListener('keydown',hide,{signal:events.signal});doc.addEventListener('pointerdown',hide,{signal:events.signal});doc.defaultView.addEventListener('blur',hide,{signal:events.signal});
 sync();return{sync,dispose(){events.abort();hint.remove();}};
}
