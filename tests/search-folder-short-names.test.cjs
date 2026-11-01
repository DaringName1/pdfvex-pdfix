'use strict';
// Folder grants (watched folders, folder search) on a Windows short 8.3 path: an account name with a space gets a TEMP
// like C:\Users\PDFIXT~1\..., which is the same folder as the long path, not a link. Real links are still refused.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{randomUUID}=require('node:crypto'),{execFileSync}=require('node:child_process');
const {SearchFolderGrant}=require('../desktop/search-folder-grant.cjs');
const shortName=folder=>execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','(New-Object -ComObject Scripting.FileSystemObject).GetFolder($env:PDFIX_SHORT_TARGET).ShortPath'],{encoding:'utf8',env:{...process.env,PDFIX_SHORT_TARGET:folder}}).trim();
test('a folder reached through its short 8.3 name is accepted; a junction is still refused',{skip:process.platform!=='win32'},async t=>{
 const root=path.resolve('.test-data','short-names-'+randomUUID()),folder=path.join(root,'Long folder name with spaces');await fs.mkdir(folder,{recursive:true});
 const grants=[],make=where=>{const grant=new SearchFolderGrant(where,false);grants.push(grant);return grant;};
 t.after(async()=>{for(const grant of grants)grant.revoke();await fs.rm(root,{recursive:true,force:true});});
 const short=shortName(folder);if(short.toLowerCase()===folder.toLowerCase()){t.skip('this drive does not create short 8.3 names');return;}
 assert.match(short,/~\d/);const grant=await make(short).init();assert.equal(grant.root.toLowerCase(),folder.toLowerCase(),'the grant uses the long path from then on');
 await make(folder).init();
 const link=path.join(root,'linked');await fs.symlink(folder,link,'junction');await assert.rejects(make(link).init(),/Linked, reparse/);
});
test('watched-folder storage starts and finds its file when the data folder is a short 8.3 path',{skip:process.platform!=='win32'},async t=>{
 const {WatchedFolderStorage}=require('../desktop/watched-folder-storage.cjs'),os=require('node:os');
 const base=path.join(os.tmpdir(),'PDFix short data '+randomUUID());await fs.mkdir(base,{recursive:true});const short=shortName(base);
 const storage=new WatchedFolderStorage(short,{isEncryptionAvailable:()=>true,encryptString:s=>Buffer.from(s),decryptString:b=>b.toString()});
 t.after(async()=>{storage.guard?.revoke();await fs.rm(base,{recursive:true,force:true});});
 if(short.toLowerCase()===base.toLowerCase()){t.skip('this drive does not create short 8.3 names');return;}
 await storage.init();assert.equal(await storage.target(),null,'no consent file yet, and no refusal');
});
