const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {sweepContainedStaging}=require('../desktop/contained-staging-sweep.cjs');
const HOUR=60*60*1000,NOW=Date.now();

// Stands in for the native sandbox: records which folders it was asked to clean and removes the runtime copy like the real one.
const fakeSandbox=()=>({cleaned:[],async cleanup(folder){this.cleaned.push(path.basename(folder));fs.rmSync(path.join(folder,'_sandbox-runtime'),{recursive:true,force:true});return true;}});
function job(root,name,{ageHours,marker=true,extra}={}){
 const folder=path.join(root,name);fs.mkdirSync(path.join(folder,'_sandbox-runtime'),{recursive:true});
 if(marker)fs.writeFileSync(path.join(folder,'.pdfix-document-job.json'),JSON.stringify({owner:'PDFix contained document job',version:1,id:'x',sourceSha256:'0'.repeat(64),operation:'form-fill-build'}));
 fs.writeFileSync(path.join(folder,'input.bin'),'copy of a document');fs.writeFileSync(path.join(folder,'_sandbox-runtime','engine.cjs'),'');
 if(extra)fs.writeFileSync(path.join(folder,extra),'not from PDFix');
 const when=new Date(NOW-ageHours*HOUR);
 for(const file of [path.join(folder,'_sandbox-runtime','engine.cjs'),path.join(folder,'_sandbox-runtime'),...fs.readdirSync(folder).map(n=>path.join(folder,n)).filter(f=>fs.statSync(f).isFile()),folder])fs.utimesSync(file,when,when);
 return folder;
}

test('old leftover job folders are removed; recent, unmarked and foreign folders are kept',async t=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pdfix-sweep-test-'));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
 const form=path.join(temp,'PDFix-contained-FormFill'),other=path.join(temp,'Someone-else');
 job(form,'job-old111',{ageHours:30});
 job(form,'job-new222',{ageHours:0.2});
 job(form,'job-nomark',{ageHours:30,marker:false});
 job(form,'job-extra3',{ageHours:30,extra:'notes.txt'});
 job(form,'keep-me',{ageHours:30});
 job(other,'job-other4',{ageHours:30});
 const sandbox=fakeSandbox(),result=await sweepContainedStaging({tempDirectory:temp,sandbox,now:NOW});
 assert.deepEqual(sandbox.cleaned,['job-old111'],'only the old marked job reaches the sandbox cleanup');
 assert.equal(fs.existsSync(path.join(form,'job-old111')),false,'old job removed');
 for(const name of ['job-new222','job-nomark','job-extra3','keep-me'])assert.equal(fs.existsSync(path.join(form,name)),true,name+' kept');
 assert.equal(fs.existsSync(path.join(other,'job-other4')),true,'folders outside PDFix-contained-* are never touched');
 assert.equal(result.removed,1);assert.equal(result.failed,0);
});

test('a recent file inside an old folder keeps the whole job (another PDFix may still be using it)',async t=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pdfix-sweep-test-'));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
 const folder=job(path.join(temp,'PDFix-contained-Office'),'job-busy55',{ageHours:30});
 fs.writeFileSync(path.join(folder,'input.bin'),'still being written');
 const result=await sweepContainedStaging({tempDirectory:temp,sandbox:fakeSandbox(),now:NOW});
 assert.equal(fs.existsSync(folder),true);assert.equal(result.removed,0);
});

test('an empty old job folder from a crash right after creation is removed, and the emptied staging folder too',async t=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pdfix-sweep-test-'));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
 const root=path.join(temp,'PDFix-contained-Redaction'),folder=path.join(root,'job-empty6');fs.mkdirSync(folder,{recursive:true});
 const when=new Date(NOW-30*HOUR);fs.utimesSync(folder,when,when);
 const result=await sweepContainedStaging({tempDirectory:temp,sandbox:fakeSandbox(),now:NOW});
 assert.equal(result.removed,1);assert.equal(fs.existsSync(root),false);
});

test('an old folder holding only the copied engine runtime is removed; one with an unknown file beside it is kept',async t=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pdfix-sweep-test-'));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
 const root=path.join(temp,'PDFix-contained-Rich-document'),when=new Date(NOW-30*HOUR);
 for(const name of ['job-runtm8','job-runtm9']){const runtime=path.join(root,name,'_sandbox-runtime');fs.mkdirSync(runtime,{recursive:true});fs.writeFileSync(path.join(runtime,'node.exe'),'');}
 fs.writeFileSync(path.join(root,'job-runtm9','stray.txt'),'');
 for(const name of ['job-runtm8','job-runtm9'])for(const f of [path.join(root,name,'_sandbox-runtime','node.exe'),path.join(root,name,'_sandbox-runtime'),...fs.readdirSync(path.join(root,name)).map(n=>path.join(root,name,n)),path.join(root,name)])fs.utimesSync(f,when,when);
 const result=await sweepContainedStaging({tempDirectory:temp,sandbox:fakeSandbox(),now:NOW});
 assert.equal(fs.existsSync(path.join(root,'job-runtm8')),false);assert.equal(fs.existsSync(path.join(root,'job-runtm9')),true);assert.equal(result.removed,1);
});

test('a failed sandbox cleanup keeps the folder and is counted',async t=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pdfix-sweep-test-'));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
 const folder=job(path.join(temp,'PDFix-contained-Bookmark'),'job-stuck7',{ageHours:30});
 const result=await sweepContainedStaging({tempDirectory:temp,sandbox:{cleanup:async()=>false},now:NOW});
 assert.equal(fs.existsSync(path.join(folder,'input.bin')),true);assert.equal(result.failed,1);
});
