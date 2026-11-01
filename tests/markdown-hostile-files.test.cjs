'use strict';
// V1 audit, area 5: hostile Markdown. A Markdown file may name pictures; only PNG/JPEG files inside its own folder are
// ever read. Escapes, drive and network paths, web addresses, links out of the folder and oversized files are refused.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {readMarkdownImage}=require('../desktop/markdown-image-reader.cjs');
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(32,1)]),jpeg=Buffer.concat([Buffer.from([0xff,0xd8,0xff,0xe0]),Buffer.alloc(32,2)]);
async function folder(t){const parent=path.resolve('.test-data'),root=path.join(parent,'markdown-hostile-'+randomUUID()),notes=path.join(root,'notes');await fs.mkdir(path.join(notes,'pictures'),{recursive:true});
 t.after(async()=>{assert.ok(root.startsWith(parent+path.sep));await fs.rm(root,{recursive:true,force:true});});
 await fs.writeFile(path.join(notes,'site.md'),'# Site');await fs.writeFile(path.join(notes,'pictures','ok.png'),png);await fs.writeFile(path.join(notes,'pictures','ok.jpg'),jpeg);await fs.writeFile(path.join(root,'private.png'),png);
 return {root,notes,markdown:path.join(notes,'site.md')};}
const refused=(markdown,target,code)=>assert.rejects(readMarkdownImage(markdown,target),error=>(!code||error.code===code)&&!/private/i.test(error.message),target);
test('pictures beside the Markdown file are read as PNG or JPEG',async t=>{
 const {markdown}=await folder(t);assert.equal((await readMarkdownImage(markdown,'pictures/ok.png')).mime,'image/png');assert.equal((await readMarkdownImage(markdown,'pictures/ok.jpg?v=2#top')).mime,'image/jpeg');assert.equal((await readMarkdownImage(markdown,'pictures%2Fok.png')).mime,'image/png');
});
test('escapes, drive letters, network paths and web addresses are refused before anything is opened',async t=>{
 const {root,markdown}=await folder(t);
 for(const target of ['../private.png','..\\private.png','pictures/../../private.png','%2e%2e/private.png','%2E%2E%5Cprivate.png','..%2fprivate.png',path.join(root,'private.png'),'C:private.png','C%3A/Windows/win.ini','/etc/passwd','\\\\server\\share\\x.png','%5C%5Cserver%5Cshare%5Cx.png','//server/share/x.png','file:///C:/Windows/win.ini','https://example.com/x.png','data:image/png;base64,AAAA','pictures/ok.png%00.txt','','x'.repeat(1001),'%E0%A4%A'])await refused(markdown,target);
 await refused(markdown,undefined,'PATH');await refused(markdown,{toString:()=>'pictures/ok.png'},'PATH');
});
test('a folder or file link inside the folder that leads outside is refused',async t=>{
 const {root,notes,markdown}=await folder(t);
 try{await fs.symlink(path.join(root,'private.png'),path.join(notes,'link.png'),'file');}catch{t.diagnostic('this account cannot make file links (needs admin or developer mode); the folder junction case still runs');}
 await fs.symlink(root,path.join(notes,'up'),'junction');
 if(await fs.lstat(path.join(notes,'link.png')).catch(()=>null))await refused(markdown,'link.png','FORMAT');
 await refused(markdown,'up/private.png','FORMAT');
});
test('wrong content, wrong type, folders and files over 5 MB are refused',async t=>{
 const {notes,markdown}=await folder(t);
 await fs.writeFile(path.join(notes,'fake.png'),Buffer.from('<svg onload="alert(1)"/>'));await refused(markdown,'fake.png','FORMAT');
 await fs.writeFile(path.join(notes,'shot.svg'),png);await refused(markdown,'shot.svg','FORMAT');
 await fs.mkdir(path.join(notes,'folder.png'));await refused(markdown,'folder.png','SIZE');
 await fs.writeFile(path.join(notes,'huge.png'),Buffer.concat([png,Buffer.alloc(5*1024*1024)]));await refused(markdown,'huge.png','SIZE');
 await refused(markdown,'missing.png','MISSING');
});
