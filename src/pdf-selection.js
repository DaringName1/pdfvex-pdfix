const MAX_WORDS=10000;
const finite=value=>typeof value==='number'&&Number.isFinite(value);

// Keep the array-of-lines return value used by table extraction callers.
export function orderVisualText(entries){
  if(!Array.isArray(entries)||entries.length>MAX_WORDS)throw new Error('Select at most 10,000 words.');
  const words=entries.filter(entry=>typeof entry.text==='string'&&entry.text.trim());
  for(const word of words)if(![word.top,word.left,word.width,word.height].every(finite)||word.width<=0||word.height<=0)throw new Error('Selected text has unreadable geometry. Try a smaller, unrotated area.');
  const sorted=words.map((word,index)=>({...word,index})).sort((a,b)=>a.top+a.height/2-(b.top+b.height/2)||a.left-b.left||a.index-b.index);
  const rows=[];
  for(const word of sorted){
    const center=word.top+word.height/2,last=rows.at(-1);
    if(last&&Math.abs(center-last.center)<=Math.max(2,Math.min(last.height,word.height)*.45)){
      last.items.push(word);last.center=(last.center*(last.items.length-1)+center)/last.items.length;last.height=Math.min(last.height,word.height);
    }else rows.push({center,height:word.height,items:[word]});
  }
  return rows.map(row=>{
    const rtl=row.items.filter(word=>word.dir==='rtl').length>row.items.length/2;
    row.items.sort((a,b)=>rtl?b.left-a.left||a.index-b.index:a.left-b.left||a.index-b.index);
    return row.items.map(word=>word.text).join(' ').replace(/\s+/g,' ').trim();
  });
}

export function insideSelection(entry,rect){
  const x=entry.left+entry.width/2,y=entry.top+entry.height/2;
  return x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom;
}

export function intersectsSelection(entry,rect){
  return entry.left<rect.right&&entry.left+entry.width>rect.left&&entry.top<rect.bottom&&entry.top+entry.height>rect.top;
}

export function rectangleRuns(layer,paperBounds,rect,{crossing=false}={}){
  if(!layer||!paperBounds||!rect||![paperBounds.left,paperBounds.top,paperBounds.width,paperBounds.height,rect.left,rect.top,rect.right,rect.bottom].every(finite)||paperBounds.width<=0||paperBounds.height<=0||rect.left<0||rect.top<0||rect.right>paperBounds.width||rect.bottom>paperBounds.height||rect.right<=rect.left||rect.bottom<=rect.top)throw new Error('The selected rectangle is outside the rendered page. Draw it again.');
  const entries=[];let measured=0;
  for(const span of layer.querySelectorAll('span')){
    if(span.querySelector('span'))continue;
    const outer=span.getBoundingClientRect();
    if(![outer.left,outer.top,outer.right,outer.bottom].every(finite))throw new Error('Selected text has unreadable geometry. Try a smaller, unrotated area.');
    if(outer.right-paperBounds.left<rect.left||outer.left-paperBounds.left>rect.right||outer.bottom-paperBounds.top<rect.top||outer.top-paperBounds.top>rect.bottom)continue;
    const computed=span.ownerDocument.defaultView.getComputedStyle(span),transform=computed.transform,dir=span.dir||computed.direction;
    if(transform&&transform!=='none'){
      const matrix=new DOMMatrixReadOnly(transform);
      if(![matrix.a,matrix.b,matrix.c,matrix.d].every(finite)||Math.abs(matrix.b)>0.01||Math.abs(matrix.c)>0.01||matrix.a<=0||matrix.d<=0)throw new Error('This area contains rotated or mirrored text. Rectangle copying cannot determine its order; use text selection.');
    }
    for(const node of span.childNodes){
      if(node.nodeType!==3)continue;
      for(const match of node.textContent.matchAll(/\S+/g)){
        if(++measured>MAX_WORDS)throw new Error('This area contains more than 10,000 words. Select a smaller area.');
        const range=layer.ownerDocument.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
        const box=range.getBoundingClientRect();
        if(![box.left,box.top,box.width,box.height].every(finite)||box.width<=0||box.height<=0)throw new Error('Selected text has unreadable geometry. Try a smaller, unrotated area.');
        const entry={span,range,text:match[0],dir,left:box.left-paperBounds.left,top:box.top-paperBounds.top,width:box.width,height:box.height};
        if((crossing?intersectsSelection:insideSelection)(entry,rect))entries.push(entry);
      }
    }
  }
  return entries;
}
