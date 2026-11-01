const {test}=require('node:test'),assert=require('node:assert/strict');
test('reader cleanup follows only its rooted tree, including grandchildren',async()=>{
 const {descendants}=await import('./helpers/reader-process-tree.mjs');const rows=[{pid:10,parent:1},{pid:11,parent:10},{pid:12,parent:11},{pid:20,parent:1}].map(row=>({...row,created:'2026-10-19T12:00:00.000Z'}));assert.deepEqual(descendants(rows,10).map(r=>r.pid),[10,11,12]);
});
test('a pre-existing process cannot become a child when Windows reuses its former parent PID',async()=>{
 const {descendants}=await import('./helpers/reader-process-tree.mjs');const rows=[{pid:10,parent:1,created:'2026-10-19T12:00:00Z'},{pid:11,parent:10,created:'2026-10-19T11:00:00Z'},{pid:12,parent:11,created:'2026-10-19T12:01:00Z'},{pid:13,parent:10,created:'2026-10-19T12:00:01Z'},{pid:14,parent:10,created:'unknown'}];assert.deepEqual(descendants(rows,10).map(row=>row.pid),[10,13]);
});
test('a reused PID or changed executable is never an owned cleanup target',async()=>{
 const {survivingOwned}=await import('./helpers/reader-process-tree.mjs');const original={pid:10,created:'old',name:'electron.exe'};
 assert.deepEqual(survivingOwned([{...original,created:'new'},{...original,name:'other.exe'},{...original,pid:99}], [original]),[]);assert.deepEqual(survivingOwned([original],[original]),[original]);
});
test('Windows cleanup refuses a live PID with a nonmatching creation time',{skip:process.platform!=='win32'},async()=>{
 const {stopOwned}=await import('./helpers/reader-process-tree.mjs');assert.deepEqual(await stopOwned([{pid:process.pid,name:'node.exe',created:'not-a-process-creation-time'}]),[]);
});
test('Windows cleanup stops and observes only a disposable captured child',{skip:process.platform!=='win32'},async t=>{
 const {spawn}=require('node:child_process'),{once}=require('node:events');const {processSnapshot,descendants,stopOwned,drainOwned}=await import('./helpers/reader-process-tree.mjs');
 const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{windowsHide:true,stdio:'ignore'});t.after(()=>{if(child.exitCode===null&&child.signalCode===null)child.kill();});await once(child,'spawn');
 const rows=descendants((await processSnapshot()).processes,process.pid),captured=rows.find(row=>row.pid===child.pid);assert.ok(captured);assert.deepEqual(await stopOwned([captured]),[child.pid]);assert.deepEqual(await drainOwned([captured],{waitMs:1000}),{remaining:[],forced:[]});
});
