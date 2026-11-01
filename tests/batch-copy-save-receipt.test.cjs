const {test}=require('node:test'),assert=require('node:assert/strict');
const {BatchBatesService}=require('../desktop/batch-bates-service.cjs');
const {BatchCompression}=require('../desktop/batch-compression.cjs');
const {BatchDocumentActions}=require('../desktop/batch-document-actions.cjs');
const sha256='a'.repeat(64);
for(const Class of [BatchBatesService,BatchCompression,BatchDocumentActions]){
 test(Class.name+' accepts only the exact prepared-output hash before touching the destination',async()=>{
  const service=Object.create(Class.prototype),sentinel=new Error('destination boundary reached');let folders=0,writes=0;
  service.records=new Map();service.idle=()=>{};service.check=()=>{};service.output=()=>({report:{sha256}});service.sources={assertCurrent:async()=>{}};
  service.prepareFolder=async()=>{folders++;throw sentinel;};
  const store={saveCopy:async()=>{writes++;throw Error('Unexpected write');}};
  for(const receipt of [undefined,{}, {sha256:'b'.repeat(64)},{sha256,reviewed:true},[sha256],Object.assign(Object.create(null),{sha256})]){
   await assert.rejects(service.save(store,'session','source','job',receipt),error=>error!==sentinel);assert.equal(folders,0);assert.equal(writes,0);
  }
  await assert.rejects(service.save(store,'session','source','job',{sha256}),error=>error===sentinel);
  assert.equal(folders,1);assert.equal(writes,0);assert.equal(service.saving,false);assert.equal(service.savePending,null);
 });
}

