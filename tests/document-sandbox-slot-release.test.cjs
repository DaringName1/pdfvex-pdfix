const test=require('node:test'),assert=require('node:assert/strict'),os=require('node:os'),path=require('node:path');
const {DocumentSandboxService,containedJobsForTests:jobs}=require('../desktop/document-sandbox-service.cjs');
const service=()=>new DocumentSandboxService({runtimeDirectory:path.join(os.tmpdir(),'pdfix-slot-test'),stagingDirectory:path.join(os.tmpdir(),'pdfix-slot-test')});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('a stopped job keeps its slot until its process exit is observed, then returns it',async()=>{
 const s=service(),lease=Symbol('slot');let exit;const job={folder:null,brokerExit:new Promise(resolve=>{exit=resolve;})};jobs.add(lease);
 s.releaseAfterExit(job,lease);await tick();assert.equal(jobs.has(lease),true,'slot kept while the process may still run');
 exit({code:1,launchError:false});await tick();await tick();assert.equal(jobs.has(lease),false,'slot returned after the exit was observed');assert.equal(job.observed,true);
});
test('the slot stays taken when the staging folder cannot be cleaned',async()=>{
 const s=service(),lease=Symbol('slot');s.cleanup=async()=>false;const job={folder:'job-ABCDEF',brokerExit:Promise.resolve({code:0,launchError:false})};jobs.add(lease);
 s.releaseAfterExit(job,lease);await tick();await tick();assert.equal(jobs.has(lease),true);jobs.delete(lease);
});
test('a job without an observable exit never returns its slot',async()=>{
 const s=service(),lease=Symbol('slot');const job={folder:null,brokerExit:undefined};jobs.add(lease);
 s.releaseAfterExit(job,lease);await tick();await tick();assert.equal(jobs.has(lease),true);jobs.delete(lease);
});
