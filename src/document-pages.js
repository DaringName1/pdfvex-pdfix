import {Extension} from '@tiptap/core';
import {Plugin,PluginKey} from '@tiptap/pm/state';
import {Decoration,DecorationSet} from '@tiptap/pm/view';
// Page view (owner, October 20: work like Word and Google Docs): the document shows as separate sheets of the chosen
// paper. After each change the editor measures where its blocks fall and puts a gap — the bottom margin of one sheet, a
// grey space, the top margin of the next — where a sheet fills up or a manual page break is. Only the view changes:
// the document, recovery and every export are unaffected. A block taller than a sheet runs on, as in a web page view.
const key=new PluginKey('pdfix-document-pages'),GAP=24;
function gapElement(gap){const node=document.createElement('div');node.className='pdfix-page-gap';node.contentEditable='false';node.setAttribute('aria-hidden','true');
 const {height,bottom,pad}=gap;Object.assign(node.style,{height:height+'px',marginLeft:-pad.left+'px',marginRight:-pad.right+'px',background:`linear-gradient(to bottom,#fff 0 ${bottom}px,var(--page-gap,#e7ece8) ${bottom}px ${bottom+GAP}px,#fff ${bottom+GAP}px)`});return node;}
export const DocumentPages=Extension.create({
 name:'documentPages',
 // metrics(): {contentHeight, marginTop, marginBottom, padLeft, padRight, zoom} in CSS pixels, or null to show no sheets.
 addOptions(){return {metrics:()=>null};},
 addProseMirrorPlugins(){const options=this.options;return [new Plugin({key,
  state:{init:()=>({set:DecorationSet.empty,gaps:[]}),apply(transaction,old){const next=transaction.getMeta(key);return next??{set:old.set.map(transaction.mapping,transaction.doc),gaps:old.gaps};}},
  props:{decorations:state=>key.getState(state).set},
  view(view){let frame=0,settling=0,disposed=false;
   const schedule=()=>{if(disposed)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
   function measure(){const m=options.metrics();if(disposed||!view.dom.isConnected)return;const current=key.getState(view.state).gaps;
    if(!m||!(m.contentHeight>40)){if(current.length){view.dispatch(view.state.tr.setMeta(key,{set:DecorationSet.empty,gaps:[]}));}view.dom.style.paddingBottom='';return;}
    const zoom=m.zoom||1,origin=view.dom.getBoundingClientRect().top,children=[...view.dom.children],nodes=[];view.state.doc.forEach((node,offset)=>nodes.push({node,offset}));
    // Natural positions: where each block would sit with no gaps, so the measurement does not chase its own gaps.
    const blocks=[];let gapSum=0;for(const child of children){if(child.classList.contains('pdfix-page-gap')){gapSum+=child.getBoundingClientRect().height/zoom;continue;}const rect=child.getBoundingClientRect(),style=getComputedStyle(child);blocks.push({top:(rect.top-origin)/zoom-gapSum-parseFloat(style.marginTop||0),bottom:(rect.bottom-origin)/zoom-gapSum+parseFloat(style.marginBottom||0),child});}
    if(blocks.length!==nodes.length)return;
    const gaps=[],page=m.contentHeight,pad={left:m.padLeft,right:m.padRight};let pageStart=0;
    const gapAt=(pos,used)=>({pos,height:Math.max(0,page-used)+m.marginBottom+GAP+m.marginTop,bottom:Math.max(0,page-used)+m.marginBottom,pad});
    for(let i=0;i<blocks.length;i++){const block=blocks[i],{node,offset}=nodes[i],top=block.top-pageStart,height=block.bottom-block.top;
     if(i&&top+height>page&&top>0&&gaps.length<500){gaps.push(gapAt(offset,top));pageStart=block.top;}
     if(node.type.name==='pageBreak'&&i<blocks.length-1&&gaps.length<500){const used=block.bottom-pageStart;gaps.push(gapAt(offset+node.nodeSize,used));pageStart=block.bottom;}
     else if(block.bottom-pageStart>page)pageStart+=Math.floor((block.bottom-pageStart)/page)*page;}
    const last=blocks.length?blocks.at(-1).bottom-pageStart:0;view.dom.style.paddingBottom=Math.max(0,Math.round(page-last))+'px';
    const same=gaps.length===current.length&&gaps.every((gap,i)=>gap.pos===current[i].pos&&Math.abs(gap.height-current[i].height)<1.5);
    if(same){settling=0;return;}if(++settling>6)return;
    view.dispatch(view.state.tr.setMeta(key,{set:DecorationSet.create(view.state.doc,gaps.map(gap=>Decoration.widget(gap.pos,()=>gapElement(gap),{side:-1,key:`page-gap-${gap.pos}-${Math.round(gap.height)}`,ignoreSelection:true}))),gaps}).setMeta('addToHistory',false));}
   const resize=new ResizeObserver(schedule);resize.observe(view.dom);schedule();
   return {update(updated,previous){if(updated.state.doc!==previous.doc){settling=0;schedule();}},destroy(){disposed=true;cancelAnimationFrame(frame);resize.disconnect();view.dom.style.paddingBottom='';}};}
 })];}
});
