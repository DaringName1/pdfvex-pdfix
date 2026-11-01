// Preserve only explicitly listed generated-fixture receipts, never profiles/PDFs.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const base='C:/Users/andre/AppData/Local/Temp';
const names=['pdfix-reader-speed-slCpub','pdfix-reader-scroll-lwhxR9',
 'pdfix-reader-soak-W9AiHQ','pdfix-reader-soak-9wfTqr','pdfix-reader-soak-PRvz6j','pdfix-reader-soak-1jM0Yo','pdfix-codex-robot-m0yZvZ',
 'pdfix-graphics-check-49MLGT','pdfix-graphics-check-YhEEy9',
 'pdfix-codex-robot-JHZGCN','pdfix-codex-robot-6c3GfX','pdfix-codex-robot-MZWBA1','pdfix-codex-robot-1ta2Qj'];
const calloutScreens=new Set(names.slice(-4));
const richScreens=new Set(['pdfix-codex-robot-BK70Id','pdfix-codex-robot-yDWe0Z','pdfix-codex-robot-Glv0fI','pdfix-codex-robot-nz4Epi']);
names.push(...richScreens);
const packagedScreens=new Map([['pdfix-packaged-reader-S8ewoH',['normal-reader.png','second-instance-reader.png']]]);
names.push('pdfix-packaged-graphics-R1hEC5',...packagedScreens.keys());
const destination=path.resolve('docs/evidence/codex');
const digest=b=>createHash('sha256').update(b).digest('hex');
function redact(value){
 if(typeof value==='string')return value.replace(/C:[\\/]Users[\\/]andre/gi,'<USER_HOME>');
 if(Array.isArray(value))return value.map(redact);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,redact(v)]));
 return value;
}
await fs.mkdir(destination,{recursive:true});
const manifest={archivedAt:new Date().toISOString(),scope:'Copies of existing generated-fixture receipts, not new checks. User home paths redacted. Explicitly listed generated-callout and rich-comment screenshots are included. No PDF, profile or private drawing artifacts copied.',receipts:[]};
for(const name of names){
 const source=path.join(base,name,'report.json');
 try{
  const raw=await fs.readFile(source),parsed=JSON.parse(raw.toString('utf8'));
  const output=Buffer.from(JSON.stringify(redact(parsed),null,2)+'\n');
  const file=name+'.json';await fs.writeFile(path.join(destination,file),output);
  const entry={file,originalSha256:digest(raw),archivedSha256:digest(output),originalBytes:raw.length,archivedBytes:output.length};
  if(calloutScreens.has(name)){
   if(parsed.pass!==true)throw Error('A final callout receipt is not passing: '+name);
   entry.screenshots=[];await fs.mkdir(path.join(destination,'callout-ui',name),{recursive:true});
   for(const image of ['callout-staged.png','callout-preview-source.png','callout-preview.png','callout-saved.png']){
    const bytes=await fs.readFile(path.join(base,name,image)),file=path.posix.join('callout-ui',name,image);
    await fs.writeFile(path.join(destination,file),bytes);entry.screenshots.push({file,sha256:digest(bytes),bytes:bytes.length});
   }
  }
  if(richScreens.has(name)){
   if(parsed.pass!==true)throw Error('A final rich-comment receipt is not passing: '+name);
   entry.screenshots=[];await fs.mkdir(path.join(destination,'richtext-ui',name),{recursive:true});
   for(const image of ['richtext-open.png','richtext-limits.png','richtext-staged.png','richtext-preview-source.png','richtext-preview.png','richtext-saved.png']){
    const bytes=await fs.readFile(path.join(base,name,image)),file=path.posix.join('richtext-ui',name,image);
    await fs.writeFile(path.join(destination,file),bytes);entry.screenshots.push({file,sha256:digest(bytes),bytes:bytes.length});
   }
  }
  if(packagedScreens.has(name)){entry.screenshots=[];await fs.mkdir(path.join(destination,'package-ui',name),{recursive:true});for(const image of packagedScreens.get(name)){const bytes=await fs.readFile(path.join(base,name,image)),file=path.posix.join('package-ui',name,image);await fs.writeFile(path.join(destination,file),bytes);entry.screenshots.push({file,sha256:digest(bytes),bytes:bytes.length});}}
  manifest.receipts.push(entry);
 }catch(error){if(error.code!=='ENOENT')throw error;manifest.receipts.push({file:name+'.json',status:'Original receipt unavailable; use dated documentation and reproduction script.'});}
}
await fs.writeFile(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
