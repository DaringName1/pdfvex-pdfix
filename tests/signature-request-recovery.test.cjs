'use strict';
// Signing request work in progress is kept for crash recovery: unfinished details are allowed, the location rules are
// the same as for building the copy, and anything else is refused by the recovery store.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {validSignatureRequestRecovery}=require('../desktop/signature-request-validation.cjs'),{RecoveryStore}=require('../desktop/recovery-store.cjs');
const location=(over={})=>({id:'loc-1',page:1,kind:'sign',x:.1,y:.7,width:.3,height:.08,...over});
const draft=(over={})=>({kind:'signature-request',version:1,recipient:'',email:'',subject:'Please sign',message:'',placements:[location()],...over});
test('unfinished details are kept; locations follow the same rules as the prepared copy',()=>{
 assert.deepEqual(validSignatureRequestRecovery(draft()).placements,[location()]);assert.equal(validSignatureRequestRecovery(draft({placements:[]})).placements.length,0);
 for(const bad of [draft({kind:'redaction'}),draft({version:2}),draft({extra:1}),draft({email:'x'.repeat(255)}),draft({recipient:'a‮b'}),draft({placements:[location({x:.9,width:.3})]}),draft({placements:[location(),location()]}),draft({placements:[location({kind:'stamp'})]}),draft({placements:Array.from({length:101},(_,i)=>location({id:'loc-'+i}))})])
  assert.throws(()=>validSignatureRequestRecovery(bad));
});
test('the recovery store accepts a signing request draft and refuses a broken one',async t=>{
 const root=path.resolve('.test-data','signature-recovery-'+randomUUID());t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await fs.mkdir(root,{recursive:true});const store=new RecoveryStore(root);await store.init?.();const identity={key:'a'.repeat(64),fingerprint:'b'.repeat(64)};
 await store.save(identity,draft());assert.deepEqual((await store.load(identity)).placements,[location()]);
 await assert.rejects(async()=>store.save(identity,draft({placements:[location({page:0})]})),/invalid/);
 await store.clearDraft(identity);assert.equal(await store.load(identity),null);
});
