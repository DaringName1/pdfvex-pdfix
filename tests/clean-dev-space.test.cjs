// The space cleanup removes only old generated files and never follows a link out of them (owner, October 28).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const load=()=>import('../scripts/clean-dev-space.mjs');
const HOUR=3600*1000;
async function make(file,content='x'){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,content);}
async function age(target,hours,now){const when=new Date(now-hours*HOUR);await fs.utimes(target,when,when);}
const exists=p=>fs.lstat(p).then(()=>true,()=>false);

test('removes old generated folders, keeps recent work, installers and shared libraries',async()=>{
 const {cleanDevSpace}=await load(),base=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-clean-')),root=path.join(base,'project'),temp=path.join(base,'temp'),now=Date.now();
 try{
  const shared=path.join(base,'shared-node_modules');await make(path.join(shared,'electron','index.js'),'keep me');
  await make(path.join(root,'.test-data','old-run-abc123','profile','x.txt'));await make(path.join(root,'.test-data','new-run-def456','x.txt'));
  await make(path.join(root,'tmp','pkg-old','file.txt'));await fs.symlink(shared,path.join(root,'tmp','pkg-old','node_modules'),'junction');
  await make(path.join(root,'tmp','review-today','file.txt'));await make(path.join(root,'tmp','desktop-shortcut-backup-2026-10-21','PDFix.lnk'));
  await make(path.join(root,'tmp','notes.txt'));await make(path.join(root,'tmp','app-run.lock'));
  for(const stamp of ['20261016T005455262-dbabc25d','20261020T010716501-6522727c','20261021T054409131-d207b695'])await make(path.join(root,'releases',`PDFix-0.1.0-${stamp}-win-x64`,'app.exe'));
  await make(path.join(root,'releases','PDFix-Setup-2026-10-28-03752e4.exe'));
  await make(path.join(temp,'pdfix-test-runtimes','reader-runtime-AbC123','dist','index.html'));
  await make(path.join(root,'src','app.js'));
  for(const p of ['.test-data/old-run-abc123','tmp/pkg-old','tmp/notes.txt','releases/PDFix-0.1.0-20261016T005455262-dbabc25d-win-x64','releases/PDFix-0.1.0-20261020T010716501-6522727c-win-x64','releases/PDFix-0.1.0-20261021T054409131-d207b695-win-x64','releases/PDFix-Setup-2026-10-28-03752e4.exe','tmp/desktop-shortcut-backup-2026-10-21','tmp/app-run.lock'])await age(path.join(root,p),100,now);
  await age(path.join(temp,'pdfix-test-runtimes','reader-runtime-AbC123'),30,now);await age(path.join(root,'tmp','review-today'),1,now);

  const dry=await cleanDevSpace({root,temp,now,dryRun:true,quiet:true});
  assert.equal(dry.removed,4,'dry run counts but removes nothing');assert.ok(await exists(path.join(root,'tmp','pkg-old')));

  const result=await cleanDevSpace({root,temp,now,quiet:true});
  assert.deepEqual(result.failed,[]);
  for(const gone of ['.test-data/old-run-abc123','tmp/pkg-old','releases/PDFix-0.1.0-20261016T005455262-dbabc25d-win-x64'])assert.equal(await exists(path.join(root,gone)),false,gone+' should be removed');
  assert.equal(await exists(path.join(temp,'pdfix-test-runtimes','reader-runtime-AbC123')),false,'old snapshot removed');
  for(const kept of ['.test-data/new-run-def456','tmp/review-today','tmp/notes.txt','tmp/app-run.lock','tmp/desktop-shortcut-backup-2026-10-21/PDFix.lnk','releases/PDFix-0.1.0-20261020T010716501-6522727c-win-x64','releases/PDFix-0.1.0-20261021T054409131-d207b695-win-x64','releases/PDFix-Setup-2026-10-28-03752e4.exe','src/app.js'])assert.ok(await exists(path.join(root,kept)),kept+' must be kept');
  assert.equal(await fs.readFile(path.join(shared,'electron','index.js'),'utf8'),'keep me','a linked folder is never followed');

  const again=await cleanDevSpace({root,temp,now:now+HOUR,quiet:true});
  assert.equal(again.skipped,true,'runs at most every 6 hours');
 }finally{await fs.rm(base,{recursive:true,force:true});}
});

test('refuses to plan anything outside the generated folders',async()=>{
 const {planCleanup}=await load(),base=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-clean-'));
 try{const plan=await planCleanup({root:path.join(base,'empty'),temp:path.join(base,'t')});assert.deepEqual(plan,[]);}
 finally{await fs.rm(base,{recursive:true,force:true});}
});
