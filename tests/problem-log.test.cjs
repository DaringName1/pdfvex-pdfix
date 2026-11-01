const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {ProblemLog,scrub}=require('../desktop/problem-log.cjs');
test('problem log entries never keep paths or document file names',()=>{
 const text=scrub(String.raw`Could not open C:\Users\Dad\Drawings\Smith House A-201.pdf: damaged; also "Site plan rev 3.pdf" and \\server\share\x.docx and notes.txt`);
 assert.doesNotMatch(text,/Dad|Drawings|Smith|Site plan|server|share|notes/);
 assert.match(text,/\[path\]/);assert.match(text,/\[file\]\.txt/);assert.match(text,/damaged/);
});
test('the log keeps the newest 300 entries, survives a restart and writes a readable report',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-problem-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const log=new ProblemLog(dir);await log.init();for(let i=0;i<320;i++)log.note('error','event '+i);await log.flush();
 const again=new ProblemLog(dir);await again.init();assert.equal(again.entries.length,300);assert.match(again.entries[0].detail,/event 20$/);
 const report=again.report({'PDFix version':'0.1.0'});assert.match(report,/PDFix problem report/);assert.match(report,/no document contents/);assert.match(report,/event 319/);
});
