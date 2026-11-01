import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
export async function packageSourceSnapshot(root=process.cwd()){
 const entries=[];
 async function visit(filename){const stat=await fs.lstat(filename);if(stat.isSymbolicLink())throw new Error('Linked build inputs are unsupported.');if(stat.isDirectory()){for(const child of (await fs.readdir(filename)).sort()){if(['node_modules','.git','vendor'].includes(child))continue;await visit(path.join(filename,child));}return;}if(!stat.isFile()||stat.size>16*1024*1024)throw new Error('Unexpected or oversized build source.');const bytes=await fs.readFile(filename),after=await fs.stat(filename);if(bytes.length!==stat.size||stat.mtimeMs!==after.mtimeMs||stat.ctimeMs!==after.ctimeMs)throw new Error('A build input changed while its source snapshot was read.');entries.push({path:path.relative(root,filename).split(path.sep).join('/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
 for(const name of ['desktop','src','public','scripts','packaging','package.json','package-lock.json','vite.config.js'])await visit(path.join(root,name));
 entries.sort((a,b)=>a.path.localeCompare(b.path));const sha256=createHash('sha256').update(JSON.stringify(entries)).digest('hex');return {version:1,kind:'PDFix.BuildSourceSnapshot.v1',sha256,files:entries};
}
