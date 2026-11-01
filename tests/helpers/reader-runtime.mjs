// A private immutable copy prevents another agent's rebuild from removing a
// worker/native executable underneath an already-running reader check.
import fs from 'node:fs/promises';
import {createReadStream,rmSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
const hashFile=async file=>{const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex');};
let runtime;
const scratch=path.join(os.tmpdir(),'pdfix-test-runtimes'),owned=new Set();
// Only this worker's own generated snapshots are removed. Never sweep another
// worker's cache or a source/profile folder, including on a failed capture.
function ownPath(destination){return path.dirname(path.resolve(destination))===path.resolve(scratch)&&/^reader-runtime-[A-Za-z0-9]{6}$/.test(path.basename(destination));}
process.once('exit',()=>{for(const destination of owned)if(ownPath(destination))try{rmSync(destination,{recursive:true,force:true});}catch{/* A crash may leave a local temporary copy, never a Drive copy. */}});
export async function releaseReaderRuntime(){runtime=undefined;for(const destination of [...owned]){if(!ownPath(destination))throw Error('Refusing to remove a snapshot outside its temporary cache.');await fs.rm(destination,{recursive:true,force:true});owned.delete(destination);}}
export function readerRuntime(){return runtime??=capture().catch(error=>{runtime=undefined;throw error;});}
async function capture(){
  const repo=path.resolve('.');await fs.mkdir(scratch,{recursive:true});
  const locked=()=>fs.access(path.join(repo,'tmp/build.lock')).then(()=>true,()=>false);
  for(let attempt=0;attempt<3;attempt++){
    if(await locked()){await new Promise(resolve=>setTimeout(resolve,1000));continue;}
    const destination=await fs.mkdtemp(path.join(scratch,'reader-runtime-'));owned.add(destination);let count=0,total=0;
    try{
      const manifestBytes=await fs.readFile(path.join(repo,'dist/build-source-manifest.json')),manifest=JSON.parse(manifestBytes);
      if(manifest.kind!=='PDFix.BuildSourceSnapshot.v1'||!Array.isArray(manifest.files))throw new Error('Build source manifest is unavailable.');
      const copy=async relative=>{
        const source=path.join(repo,relative),target=path.join(destination,relative),stat=await fs.lstat(source);
        if(stat.isSymbolicLink())throw new Error('Linked runtime inputs are unsupported.');
        if(stat.isDirectory()){await fs.mkdir(target,{recursive:true});for(const entry of(await fs.readdir(source)).sort())await copy(path.join(relative,entry));return;}
        if(!stat.isFile()||++count>5000||(total+=stat.size)>1024*1024*1024)throw new Error('Reader runtime snapshot exceeds its one-GiB/5,000-file boundary.');
        const expected=relative.startsWith('desktop'+path.sep)||relative==='package.json'?manifest.files.find(file=>file.path===relative.split(path.sep).join('/'))?.sha256:await hashFile(source);
        if(!expected)throw new Error('A runtime source is absent from the successful build manifest. Rebuild first.');
        await fs.copyFile(source,target);if(await hashFile(target)!==expected)throw new Error('A runtime input changed during capture: '+relative.split(path.sep).join('/')+'. Rebuild first.');
      };
      await copy('package.json');await copy('desktop');await copy('dist');
      // Previously the snapshot inherited these installed libraries from its
      // project ancestor. Keep that same lookup without copying another full
      // node_modules tree into either Drive or the temporary cache.
      const dependencies=path.join(repo,'node_modules'),dependencyStat=await fs.lstat(dependencies).catch(()=>null);
      if(dependencyStat){const installed=await fs.realpath(dependencies);if(!(await fs.stat(installed)).isDirectory())throw Error('Use an installed dependency folder for reader tests.');await fs.symlink(installed,path.join(destination,'node_modules'),process.platform==='win32'?'junction':'dir');}
      if(await locked()||!(await fs.readFile(path.join(repo,'dist/build-source-manifest.json'))).equals(manifestBytes))throw new Error('Another build overlapped reader runtime capture.');
      await fs.writeFile(path.join(destination,'reader-runtime.json'),JSON.stringify({sourceSha256:manifest.sha256,files:count,bytes:total,scope:'Private built-runtime test snapshot; not a release package'}));
      return destination;
    }catch(error){if(ownPath(destination)){await fs.rm(destination,{recursive:true,force:true});owned.delete(destination);}if(attempt===2)throw error;await new Promise(resolve=>setTimeout(resolve,1000));}
  }
  throw new Error('A build is running. Finish the locked build before capturing an isolated reader test runtime.');
}
