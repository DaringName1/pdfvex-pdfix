// Uploads the latest committed PDFix to the private GitHub repository without anything on the exclude list
// (real client files stay on this PC). The GitHub copy has its own history: one commit per upload, naming the local
// commits it contains. The local project history is never changed.
// Usage: node scripts/publish-github.mjs            (first run creates the upload copy)
//        node scripts/publish-github.mjs --check    (privacy check only, uploads nothing)
// Upload copy: C:\Users\andre\pdfix-github (outside Google Drive). Exclude list: .github-publish-exclude
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
const root=path.resolve('.'),mirror=process.env.PDFIX_PUBLISH_DIR||'C:/Users/andre/pdfix-github',remote='https://github.com/DaringName1/pdfix.git';
const git=(args,cwd=root,opts={})=>execFileSync('git',args,{cwd,encoding:'utf8',maxBuffer:256*1024*1024,...opts});
const exclude=(await fs.readFile(path.join(root,'.github-publish-exclude'),'utf8')).split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('#'));
const head=git(['rev-parse','HEAD']).trim();
// Only committed content is uploaded; another agent's unsaved work never leaves this PC.
const files=git(['ls-tree','-r','--name-only','-z','HEAD']).split('\0').filter(Boolean).filter(f=>!exclude.some(e=>f===e||f.startsWith(e.replace(/\/?$/,'/'))));
// Privacy guard (owner, October 23): the private-name list lives outside the project (it is private itself). The
// upload stops if the list is missing, if any file or the upload message
// contains a listed name. Nothing is written to the upload copy before these checks pass.
const namesFile=process.env.PDFIX_PRIVATE_NAMES||path.join(os.homedir(),'.pdfix-private-names.txt');
let privateNames;try{privateNames=(await fs.readFile(namesFile,'utf8')).split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')).map(l=>l.toLowerCase());}
catch{console.error('Upload stopped: the private-name list '+namesFile+' is missing. Create it (one private name per line) before uploading.');process.exit(1);}
if(!privateNames.length){console.error('Upload stopped: the private-name list is empty.');process.exit(1);}
const hits=[];for(const file of files){const text=execFileSync('git',['show','HEAD:'+file],{cwd:root,maxBuffer:256*1024*1024}).toString('latin1').toLowerCase();const name=file.toLowerCase();if(privateNames.some(n=>name.includes(n)||text.includes(n)))hits.push(file);}
if(hits.length){console.error('Upload stopped. Private material found; nothing was uploaded.');for(const file of hits)console.error('  contains a private name: '+file);process.exit(1);}
// node scripts/publish-github.mjs --check : run only the privacy check, upload nothing.
if(process.argv.includes('--check')){console.log('Privacy check passed: '+files.length+' files, '+privateNames.length+' private names, nothing uploaded.');process.exit(0);}
await fs.mkdir(mirror,{recursive:true});
let fresh=false;try{await fs.access(path.join(mirror,'.git'));}catch{fresh=true;git(['init','-b','main'],mirror);git(['remote','add','origin',remote],mirror);}
// Replace the copy's files with exactly the committed set.
for(const entry of await fs.readdir(mirror))if(entry!=='.git')await fs.rm(path.join(mirror,entry),{recursive:true,force:true});
for(const file of files){const target=path.join(mirror,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,execFileSync('git',['show','HEAD:'+file],{cwd:root,maxBuffer:256*1024*1024}));}
git(['add','-A'],mirror);
const last=fresh?null:(git(['log','-1','--format=%B'],mirror).match(/Local commit: ([0-9a-f]{40})/)||[])[1];
const included=last?git(['log','--format=%h %an: %s',`${last}..${head}`]).trim():git(['log','-1','--format=%h %an: %s']).trim();
if(!git(['status','--porcelain'],mirror).trim()){console.log('Nothing new to upload.');process.exit(0);}
const message=`${fresh?'PDFix as of ':'Update to '}${head.slice(0,7)}\n\nLocal commit: ${head}\n\nIncludes:\n${included.split('\n').slice(0,60).join('\n')}\n`;
if(privateNames.some(n=>message.toLowerCase().includes(n))){console.error('Upload stopped: the upload message would contain a private name. Nothing was uploaded.');git(['reset','-q'],mirror);process.exit(1);}
git(['-c','user.name=andrewturley06','-c','user.email=andrewturley06@users.noreply.github.com','commit','-q','-F','-'],mirror,{input:message});
git(['push','-u','origin','main'],mirror,{stdio:'inherit'});
console.log(`Uploaded ${files.length} files (local ${head.slice(0,7)}); left out: ${exclude.join(', ')}`);
