// Makes PDFix-Setup-<version>.exe (what people install; owner, October 27, 2026) from a finished Windows package.
// Usage: node scripts/make-setup-exe.mjs --package releases/PDFix-<build>-win-x64
// Needs Inno Setup 6 (free; jrsoftware.org) installed for the current user or in Program Files.
// Every package file is checked against the package inventory before it goes into the Setup.exe.
// Output: releases/PDFix-Setup-<version>.exe and a .sha256.txt beside it.
import fs from 'node:fs/promises';import {createReadStream,existsSync} from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=name=>{const i=process.argv.indexOf(name);return i>0?process.argv[i+1]:undefined;};
const hashFile=async file=>{const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);return h.digest('hex');};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function findCompiler(){
 const candidates=[process.env.PDFIX_ISCC,path.join(process.env.LOCALAPPDATA||'','Programs','Inno Setup 6','ISCC.exe'),path.join(process.env['ProgramFiles(x86)']||'C:\\Program Files (x86)','Inno Setup 6','ISCC.exe'),path.join(process.env.ProgramFiles||'C:\\Program Files','Inno Setup 6','ISCC.exe')].filter(Boolean);
 const found=candidates.find(file=>existsSync(file));if(!found)throw new Error('Inno Setup 6 is not installed. Install it from jrsoftware.org (for the current user is enough), then run this again.');return found;
}
export async function makeSetupExe(packageArg){
 const packageRoot=path.resolve(packageArg),app=path.join(packageRoot,'app');
 const manifestBytes=await fs.readFile(path.join(packageRoot,'package-manifest.json')),manifest=JSON.parse(manifestBytes),complete=JSON.parse(await fs.readFile(path.join(packageRoot,'PACKAGE-COMPLETE.json'),'utf8'));
 if(manifest.kind!=='PDFix.WindowsPackage.v1'||complete.manifestSha256!==hash(manifestBytes)||manifest.launch!=='PDFix.exe')throw new Error('This is not a completed PDFix Windows package.');
 for(const entry of manifest.files){const file=path.resolve(app,entry.path);if(!file.startsWith(app+path.sep))throw new Error('Unsafe package path: '+entry.path);const stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==entry.bytes||await hashFile(file)!==entry.sha256)throw new Error('Package file changed: '+entry.path);}
 const listed=new Set(manifest.files.map(entry=>path.resolve(app,entry.path).toLowerCase()));
 const walk=async dir=>{for(const item of await fs.readdir(dir,{withFileTypes:true})){const full=path.join(dir,item.name);if(item.isDirectory())await walk(full);else if(!listed.has(full.toLowerCase()))throw new Error('A file not in the package inventory would be installed: '+path.relative(app,full));}};await walk(app);
 const out=path.join(packageRoot,'..'),compiler=findCompiler(),name='PDFix-Setup-'+manifest.appVersion+'.exe',target=path.join(out,name);
 await fs.rm(target,{force:true});
 const result=spawnSync(compiler,['/Q','/DSourceDir='+app,'/DAppVersion='+manifest.appVersion,'/DBuildId='+manifest.buildId,'/DOutputDir='+out,'/DIconFile='+path.join(root,'public','brand','pdfix.ico'),path.join(root,'packaging','PDFix-Setup.iss')],{encoding:'utf8',maxBuffer:1<<26,windowsHide:true});
 if(result.status!==0)throw new Error('Inno Setup failed:\n'+(result.stdout||'')+(result.stderr||''));
 const sha256=await hashFile(target),size=(await fs.stat(target)).size;
 await fs.writeFile(target+'.sha256.txt',sha256+'  '+name+'\r\n');
 return {setup:target,sha256,size,buildId:manifest.buildId,files:manifest.files.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const pkg=arg('--package');if(!pkg){console.error('Usage: node scripts/make-setup-exe.mjs --package releases/PDFix-<build>-win-x64');process.exit(2);}
 console.log(JSON.stringify(await makeSetupExe(pkg),null,1));
}
