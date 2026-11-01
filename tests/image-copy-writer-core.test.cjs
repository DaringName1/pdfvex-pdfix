const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),UPNG=require('@pdf-lib/upng').default;
const {writeImageCopies}=require('../desktop/image-export-writer.cjs');
const part=page=>({page,width:2,height:1,bytes:new Uint8Array(UPNG.encode([new Uint8Array(8).buffer],2,1,0))});
async function folder(t){const parent=path.resolve(os.tmpdir()),root=await fs.mkdtemp(path.join(parent,'pdfix-image-writer-'));t.after(()=>{if(path.dirname(path.resolve(root))!==parent||!path.basename(root).startsWith('pdfix-image-writer-'))throw new Error('Unexpected test cleanup path.');return fs.rm(root,{recursive:true,force:true});});return root;}
test('image copies retain order, exact disk bytes, geometry and source bytes',async t=>{
 const root=await folder(t),parts=[part(3),part(1)],before=parts.map(p=>p.bytes.slice()),result=await writeImageCopies(root,'Copies',parts,'png');
 assert.equal(result.count,2);assert.deepEqual(result.files.map(p=>p.page),[3,1]);
 for(let index=0;index<parts.length;index++){assert.deepEqual(new Uint8Array(await fs.readFile(path.join(result.location,result.files[index].name))),before[index]);assert.deepEqual(parts[index].bytes,before[index]);assert.equal(result.files[index].width,2);}
});
test('image copies snapshot reviewed bytes and page metadata before asynchronous file access',async t=>{
 const root=await folder(t),parts=[part(1)],before=parts[0].bytes.slice(),pending=writeImageCopies(root,'Snapshot',parts,'png');
 parts[0].bytes.fill(0);parts[0].page=9;parts[0].width=100;parts.push(part(2));const result=await pending;
 assert.equal(result.count,1);assert.equal(result.files[0].name,'page-001.png');assert.equal(result.files[0].width,2);assert.deepEqual(new Uint8Array(await fs.readFile(path.join(result.location,'page-001.png'))),before);
});
test('image copy collisions preserve existing folders and files',async t=>{
 const root=await folder(t);await fs.mkdir(path.join(root,'Existing'));await fs.writeFile(path.join(root,'Existing','keep.txt'),'keep');
 await assert.rejects(writeImageCopies(root,'Existing',[part(1)],'png'),error=>error.code==='EXISTS');assert.equal(await fs.readFile(path.join(root,'Existing','keep.txt'),'utf8'),'keep');
});
test('invalid image copy plans and folder names produce no outputs',async t=>{
 const root=await folder(t);
 for(const name of ['../escape','CON','bad.',''])await assert.rejects(writeImageCopies(root,name,[part(1)],'png'),error=>error.code==='FOLDER');
 await assert.rejects(writeImageCopies(root,'Wrong',[{...part(1),width:3}],'png'),error=>error.code==='IMAGE');await assert.rejects(writeImageCopies(root,'Duplicate',[part(1),part(1)],'png'),error=>error.code==='OUTPUT');
 assert.deepEqual(await fs.readdir(root),[]);
});
test('damaged or incomplete PNG containers are refused before creating an output folder',async t=>{
 const root=await folder(t),original=part(1),bytes=original.bytes,damaged=bytes.slice();damaged[damaged.length-1]^=1;
 for(const bytes of [original.bytes.slice(0,33),original.bytes.slice(0,-12),damaged,new Uint8Array([...original.bytes,0])])await assert.rejects(writeImageCopies(root,'Invalid',[{...original,bytes}],'png'),error=>error.code==='IMAGE');
 assert.deepEqual(await fs.readdir(root),[]);
});
test('failed image writes remove only newly created copies and output folder',async t=>{
 const root=await folder(t),originalOpen=fs.open;await fs.writeFile(path.join(root,'keep.txt'),'keep');let writes=0;
 fs.open=async(...args)=>{if(args[1]==='wx+'&&++writes===2)throw new Error('Simulated disk failure');return originalOpen(...args);};
 try{await assert.rejects(writeImageCopies(root,'Failure',[part(1),part(2)],'png'),error=>error.code==='WRITE');}finally{fs.open=originalOpen;}
 assert.deepEqual(await fs.readdir(root),['keep.txt']);assert.equal(await fs.readFile(path.join(root,'keep.txt'),'utf8'),'keep');
});
