const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {regularChosenPath}=require('../desktop/chosen-bounded-file.cjs');
// Windows gives folders with spaces or long names a short (8.3) spelling, e.g. a user folder "PDFix Tester" -> PDFIXT~1.
// Passed to cmd.exe verbatim so Node does not add its own quoting around the inner quotes.
const shortName=file=>execFileSync('cmd.exe',['/d','/s','/c','"for %I in ("'+file+'") do @echo %~sI"'],{encoding:'utf8',windowsVerbatimArguments:true}).trim().replace(/^"|"$/g,'');
test('a Windows short (8.3) path to a regular file is accepted as that same file',{skip:process.platform!=='win32'},async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-short-')),folder=path.join(root,'Long folder name with spaces'),file=path.join(folder,'Site visit message.eml');
 t.after(()=>fs.rm(root,{recursive:true,force:true}));await fs.mkdir(folder);await fs.writeFile(file,'From: a@example.com\r\n\r\nHello');
 const short=shortName(file);if(!/~[0-9]/.test(short)){t.skip('8.3 names are turned off on this drive');return;}
 const chosen=await regularChosenPath(short,['eml']);assert.equal(chosen.path.toLowerCase(),(await fs.realpath(file)).toLowerCase());
});
test('a linked folder is still refused',{skip:process.platform!=='win32'},async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-link-')),real=path.join(root,'real'),link=path.join(root,'link');t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await fs.mkdir(real);await fs.writeFile(path.join(real,'a.eml'),'x');await fs.symlink(real,link,'junction');
 await assert.rejects(regularChosenPath(path.join(link,'a.eml'),['eml']),/Linked/);
});
