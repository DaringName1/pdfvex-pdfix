const {test}=require('node:test'),assert=require('node:assert/strict');
function heap({reader=true,retained=false}={}){
 const strings=[],intern=s=>{let i=strings.indexOf(s);if(i<0){i=strings.length;strings.push(s);}return i;},rows=[];
 const add=(id,props={},prototype=null)=>{rows.push({id,props,prototype});return rows.length-1;};
 const base=add(1),prototypes=Array.from({length:6},(_,i)=>add(10+i,{},base)),text=reader||retained?add(100,{},prototypes[4]):base;
 const shape=(keys,p,id)=>add(id,Object.fromEntries(keys.map(key=>[key,base])),p);
 if(reader||retained){const r=shape(['pageNumber','thumbnailQueue','thumbnailCandidates','thumbnailLive','index','find'],prototypes[0],101);rows[r].props.textLayer=text;}
 if(reader){shape(['highlightName','activeName','readableHighlightName','readableActiveName','matches','reader'],prototypes[1],102);shape(['regionDrafts','tagVersion','settings','reader'],prototypes[2],103);shape(['livePages','dimensions','slots','reader','waiters'],prototypes[3],104);}
 // Same minified constructor name, different prototype: never a reader.
 add(200,{ordinary:base},prototypes[5]);const nodes=[],edges=[];
 for(const row of rows){const props=Object.fromEntries([...Object.entries(row.props),...(row.prototype===null?[]:[['__proto__',row.prototype]])]);nodes.push(0,intern('e'),row.id,Object.keys(props).length);for(const [name,to]of Object.entries(props))edges.push(0,intern(name),to*4);}
 return {snapshot:{meta:{node_fields:['type','name','id','edge_count'],edge_fields:['type','name_or_index','to_node'],node_types:[['object']],edge_types:[['property']]}},strings,nodes,edges};
}
test('heap positive controls survive minified name collisions and find retained prototypes',async()=>{
 const {readerHeapObjects}=await import('./helpers/reader-heap.mjs'),control=readerHeapObjects(heap());assert.equal(control.classes.length,5);assert.ok(control.classes.every(c=>c.positiveCount===1&&c.prototypeIds.length===1));assert.equal(control.objects.length,5);
 assert.deepEqual(readerHeapObjects(heap({reader:false}),control.classes).objects,[]);
 assert.deepEqual(readerHeapObjects(heap({reader:false,retained:true}),control.classes).objects.map(o=>o.class).sort(),['PdfReader','TextLayer']);
});
test('a failed heap diagnostic file closes and removes its chunk listener',async()=>{
 const {writeReaderHeapSnapshot}=await import('./helpers/reader-heap.mjs'),{EventEmitter}=require('node:events'),{randomUUID}=require('node:crypto'),path=require('node:path'),events=new EventEmitter();
 const session={on:(name,fn)=>events.on(name,fn),off:(name,fn)=>events.off(name,fn),send:async()=>{events.emit('HeapProfiler.addHeapSnapshotChunk',{chunk:'{}'});await new Promise(resolve=>setTimeout(resolve,20));}};let timer;
 try{await assert.rejects(Promise.race([writeReaderHeapSnapshot(session,path.resolve('.test-data','absent-'+randomUUID(),'heap.json')),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Diagnostic file failure hung')),1000);})]),/ENOENT/);assert.equal(events.listenerCount('HeapProfiler.addHeapSnapshotChunk'),0);}finally{clearTimeout(timer);}
});
