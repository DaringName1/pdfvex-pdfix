const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {PagedPdfService}=require('../desktop/paged-pdf-service.cjs');

test('staging uses a canonical directory spelling before creating native job paths',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-stage-canonical-'));
 const directory=path.join(root,'Staging Directory');await fs.mkdir(directory);
 const service=new PagedPdfService({stagingDirectory:process.platform==='win32'?directory.toLowerCase():directory});
 try{await service.init();assert.equal(service.directory,await fs.realpath(directory));}
 finally{await service.dispose();await fs.rmdir(directory);await fs.rmdir(root);}
});

test('canonicalization never accepts a junction or symbolic-link staging directory',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-stage-junction-'));
 const target=path.join(root,'target'),alias=path.join(root,'alias');await fs.mkdir(target);await fs.symlink(target,alias,'junction');
 const service=new PagedPdfService({stagingDirectory:alias});
 try{await assert.rejects(service.init(),error=>error.code==='PATH');}
 finally{await service.dispose();await fs.unlink(alias);await fs.rmdir(target);await fs.rmdir(root);}
});

test('staged input identity guard still refuses a changed file after canonicalization',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-stage-identity-')),input=path.join(root,'input.pdf');
 await fs.writeFile(input,'original');const before=await fs.lstat(input),service=new PagedPdfService();
 const session={released:false,job:{folder:root,canceled:false},capability:{length:8,validate:async()=>true},inputStat:before};
 try{await service.guard(session);await fs.writeFile(input,'modified');await fs.utimes(input,new Date(),new Date(before.mtimeMs+2000));await assert.rejects(service.guard(session),error=>error.code==='CHANGED');}
 finally{await service.dispose();await fs.unlink(input);await fs.rmdir(root);}
});
