const test=require('node:test'),assert=require('node:assert/strict'),os=require('node:os'),path=require('node:path');
const {ContainedServiceContext}=require('../desktop/contained-service-context.cjs');
const context=()=>new ContainedServiceContext('test tool','RenewTest',{runtimeDirectory:path.join(os.tmpdir(),'pdfix-renew-test'),stagingDirectory:path.join(os.tmpdir(),'pdfix-renew-test')});
test('a tool whose engine closed after a slow stop works again once that job was observed and cleaned',()=>{
 const c=context(),old=c.engine;c.disposed=true;c.active={stale:true};
 assert.equal(c.disposed,true,'stays closed while the stopped job may still run');assert.equal(c.engine,old);
 old.recovered=true;
 assert.equal(c.disposed,false,'reopens once recovered');assert.notEqual(c.engine,old,'gets a fresh engine');assert.equal(c.active,null);
});
test('a tool closed on purpose stays closed even if its engine recovered',async()=>{
 const c=context();await c.dispose();c.engine.recovered=true;
 assert.equal(c.disposed,true);
});
