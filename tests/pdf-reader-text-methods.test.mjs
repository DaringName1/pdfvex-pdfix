import {test} from 'node:test';import assert from 'node:assert/strict';
import {TextMethodRegistry} from '../src/pdf-reader-text-tool.js';
test('unavailable and failed methods preserve the current text draft',async()=>{
 const registry=new TextMethodRegistry(),draft={text:'Keep this unfinished line'},session={draft};registry.register('text-box',async()=>session);await registry.open('text-box');
 await assert.rejects(registry.open('edit-existing'),/not available/);registry.register('edit-existing',async()=>{throw Error('Could not open existing text.');});await assert.rejects(registry.open('edit-existing'),/Could not open/);
 assert.equal(registry.active,session);assert.equal(registry.activeId,'text-box');assert.equal(session.draft.text,'Keep this unfinished line');
});
test('switching methods suspends with retained drafts and validates a new session first',async()=>{
 const calls=[],registry=new TextMethodRegistry({validate:session=>{if(!session.valid)throw Error('Cannot use a popup.');}});const first={valid:true,suspend:async options=>calls.push(options)},rejected={valid:false,dispose:async()=>calls.push('cleaned rejected')};registry.register('text-box',async()=>first);await registry.open('text-box');registry.register('edit-existing',async()=>rejected);await assert.rejects(registry.open('edit-existing'),/popup/);assert.equal(registry.active,first);assert.deepEqual(calls,['cleaned rejected']);
 const next={valid:true};registry.register('click-to-type',async()=>next);await registry.open('click-to-type');assert.equal(registry.active,next);assert.deepEqual(calls,['cleaned rejected',{retainDraft:true}]);
});
test('closing during activation cancels and cleans the late session',async()=>{
 let finish,disposed=0;const registry=new TextMethodRegistry();registry.register('text-box',()=>new Promise(resolve=>finish=resolve));const opening=registry.open('text-box');await assert.rejects(registry.open('text-box'),/Wait/);await registry.dispose();finish({dispose:async()=>disposed++});await assert.rejects(opening,/canceled/);assert.equal(disposed,1);assert.equal(registry.active,null);
});
test('unregistering an old provider cannot remove its replacement',async()=>{
 const registry=new TextMethodRegistry(),remove=registry.register('text-box',async()=>({old:true}));registry.register('text-box',async()=>({current:true}));remove();assert.equal((await registry.open('text-box')).current,true);await assert.rejects(registry.open('unknown'),/supported/);
});
test('repeated method selection keeps one bounded session per method',async()=>{
 let opened=0,disposed=0;const registry=new TextMethodRegistry();
 registry.register('text-box',async()=>{opened++;return {dispose:async()=>disposed++};});
 for(let i=0;i<100;i++)await registry.open('text-box');assert.equal(opened,1);assert.equal(registry.sessions.size,1);
 assert.throws(()=>registry.register('text-box',async()=>({})),/Finish/);await registry.dispose();assert.equal(disposed,1);
});

test('one failing cleanup still releases every other method and clears ownership',async()=>{
 const released=[],registry=new TextMethodRegistry();
 registry.register('text-box',async()=>({dispose:async()=>{released.push('box');throw Error('Close failed.');}}));
 registry.register('click-to-type',async()=>({dispose:async()=>released.push('click')}));
 await registry.open('text-box');await registry.open('click-to-type');await assert.rejects(registry.dispose(),AggregateError);
 assert.deepEqual(released,['box','click']);assert.equal(registry.active,null);assert.equal(registry.activeId,null);assert.equal(registry.sessions.size,0);
});
