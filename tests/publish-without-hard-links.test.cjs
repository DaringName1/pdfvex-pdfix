// Saving a copy on drives without hard links (FAT32/exFAT USB sticks, SD cards, some network or cloud drives).
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const path=require('node:path');const os=require('node:os');
const {stageOutput,publishOutput}=require('../desktop/verified-output.cjs');
const noLinks=code=>async()=>{throw Object.assign(new Error('no hard links here'),{code});};
async function folder(t){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-nolink-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));return dir;}
const leftovers=async dir=>(await fs.readdir(dir)).filter(n=>n.endsWith('.partial'));
for(const code of ['ENOTSUP','EISDIR','EPERM']){
  test(`no hard links (${code}): an exclusive copy is saved and checked`,async t=>{
    const dir=await folder(t),bytes=Buffer.from('%PDF-1.7 checked copy'),stage=await stageOutput(dir,bytes),out=path.join(dir,'copy.pdf');
    const result=await publishOutput(stage,out,{link:noLinks(code)});
    assert.equal(result.publishedBy,'exclusive-copy');assert.deepEqual(await fs.readFile(out),bytes);assert.deepEqual(await leftovers(dir),[],'no temporary file left');
  });
}
test('no hard links: an existing file with that name is never overwritten',async t=>{
  const dir=await folder(t),out=path.join(dir,'taken.pdf');await fs.writeFile(out,'someone else');
  const stage=await stageOutput(dir,Buffer.from('mine'));
  await assert.rejects(publishOutput(stage,out,{link:noLinks('ENOTSUP')}),e=>e.code==='EXISTS');
  assert.equal(await fs.readFile(out,'utf8'),'someone else');assert.deepEqual(await leftovers(dir),[]);
});
test('no hard links: a copy that comes out wrong is removed and not reported as saved',async t=>{
  const dir=await folder(t),out=path.join(dir,'bad.pdf'),stage=await stageOutput(dir,Buffer.from('the reviewed bytes'));
  const brokenCopy=async(from,to,mode)=>{await fs.copyFile(from,to,mode);await fs.appendFile(to,' and a damaged tail');};
  await assert.rejects(publishOutput(stage,out,{link:noLinks('ENOTSUP'),copyFile:brokenCopy}),e=>e.code==='VERIFY');
  await assert.rejects(fs.access(out),'the damaged copy is gone');assert.deepEqual(await leftovers(dir),[]);
});
test('normal drives still use the hard link',async t=>{
  const dir=await folder(t),stage=await stageOutput(dir,Buffer.from('linked')),out=path.join(dir,'linked.pdf');
  const result=await publishOutput(stage,out);assert.equal(result.publishedBy,undefined);assert.equal(await fs.readFile(out,'utf8'),'linked');
});
