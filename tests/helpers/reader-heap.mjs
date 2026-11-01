export async function readerHeapSnapshot(session){
 const chunks=[];let size=0;const chunk=({chunk})=>{size+=chunk.length;if(size<=100*1024*1024)chunks.push(chunk);};
 session.on('HeapProfiler.addHeapSnapshotChunk',chunk);
 try{await session.send('HeapProfiler.takeHeapSnapshot',{reportProgress:false});if(size>100*1024*1024)throw new Error('Reader heap diagnostic exceeded 100 MiB.');return JSON.parse(chunks.join(''));}
 finally{session.off('HeapProfiler.addHeapSnapshotChunk',chunk);}
}
// Stream diagnostics to disk; parsing the snapshot in the app's main process
// would contaminate the private-memory measurement we are trying to make.
export async function writeReaderHeapSnapshot(session,file){
 const {createWriteStream}=await import('node:fs'),stream=createWriteStream(file,{flags:'wx'}),closed=new Promise(resolve=>stream.once('close',resolve));let size=0,failure;
 stream.on('error',error=>{failure=error;});const chunk=({chunk})=>{size+=Buffer.byteLength(chunk);if(size>100*1024*1024){failure??=new Error('Reader heap diagnostic exceeded 100 MiB.');return;}if(!failure)stream.write(chunk);};
 session.on('HeapProfiler.addHeapSnapshotChunk',chunk);
 try{await session.send('HeapProfiler.takeHeapSnapshot',{reportProgress:false});}
 finally{session.off('HeapProfiler.addHeapSnapshotChunk',chunk);stream.end();await closed;}
 if(failure)throw failure;return {file,bytes:size};
}
export function readerHeapObjects(snapshot,known){
 const f=snapshot.snapshot.meta.node_fields,e=snapshot.snapshot.meta.edge_fields,N=f.length,E=e.length,types=snapshot.snapshot.meta.node_types[0],edgeTypes=snapshot.snapshot.meta.edge_types[0],nodes=snapshot.nodes,edges=snapshot.edges,strings=snapshot.strings,records=[];
 let edge=0;for(let n=0;n<nodes.length;n+=N){const count=nodes[n+f.indexOf('edge_count')],props=new Map();let prototypeId=null;
  for(let k=0;k<count;k++,edge+=E){const type=edgeTypes[edges[edge+e.indexOf('type')]],name=strings[edges[edge+e.indexOf('name_or_index')]],to=edges[edge+e.indexOf('to_node')];if(type==='property')props.set(name,to);if(name==='__proto__'&&(type==='property'||type==='internal'))prototypeId=String(nodes[to+f.indexOf('id')]);}
  if(types[nodes[n+f.indexOf('type')]]==='object')records.push({node:n,id:String(nodes[n+f.indexOf('id')]),name:strings[nodes[n+f.indexOf('name')]],prototypeId,props});
 }
 const byNode=new Map(records.map(row=>[row.node,row])),shapes={PdfReader:['pageNumber','thumbnailQueue','thumbnailCandidates','thumbnailLive','index','find'],PdfSearch:['highlightName','activeName','readableHighlightName','readableActiveName','matches','reader'],PdfReadableView:['regionDrafts','tagVersion','settings','reader'],PdfMultiPageView:['livePages','dimensions','slots','reader','waiters']};
 const classes=known?structuredClone(known):Object.entries(shapes).map(([name,keys])=>{const rows=records.filter(row=>keys.every(key=>row.props.has(key)));return {class:name,prototypeIds:[...new Set(rows.map(row=>row.prototypeId).filter(Boolean))],positiveCount:rows.length,constructorNames:[...new Set(rows.map(row=>row.name))]};});
 if(!known){const layers=records.filter(row=>row.props.has('textLayer')&&(row.props.has('thumbnailCandidates')||row.props.has('slot'))).map(row=>byNode.get(row.props.get('textLayer'))).filter(Boolean);classes.push({class:'TextLayer',prototypeIds:[...new Set(layers.map(row=>row.prototypeId).filter(Boolean))],positiveCount:layers.length,constructorNames:[...new Set(layers.map(row=>row.name))]});}
 const objects=records.flatMap(row=>classes.filter(c=>row.prototypeId&&c.prototypeIds.includes(row.prototypeId)).map(c=>({node:row.node,class:c.class,constructorName:row.name})));
 return {classes,objects};
}
