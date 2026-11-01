// Run from the shared project under agent-run. Only committed source is copied;
// both the clean build and its app check remain inside that shared run lease.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile),repo=process.cwd(),commit=process.argv[2];
if(!/^[0-9a-f]{40}$/.test(commit||''))throw Error('Pass the exact 40-character committed snapshot.');
const mode=process.argv[3]||'';
if(process.argv.length>4||!['','--with-word','--markup-only','--everyday-tools','--comment-tools','--print-tools','--resume-tools','--panel-tools','--word-safety','--release-tools'].includes(mode))throw Error('Choose a supported committed UI test mode.');
const lock=JSON.parse(await fs.readFile(path.join(repo,'tmp/app-run.lock'),'utf8'));
if(lock.agent!=='codex'||!Number.isInteger(lock.pid))throw Error('Run through agent-run.mjs codex.');
process.kill(lock.pid,0);
const actual=(await exec('git',['rev-parse',commit+'^{commit}'],{cwd:repo})).stdout.trim();
if(actual!==commit)throw Error('The requested commit does not resolve exactly.');
const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-committed-home-')),source=path.join(root,'source'),archive=path.join(root,'source.tar'),output=path.join(root,'results');
await fs.mkdir(source);let code=1;
const run=(command,args)=>new Promise((resolve,reject)=>{const child=spawn(command,args,{cwd:source,env:process.env,stdio:'inherit',windowsHide:true});child.once('error',reject);child.once('close',result=>resolve(result??1));});
try{
 await exec('git',['archive','--format=tar','-o',archive,commit],{cwd:repo});
 await exec('tar',['-xf',archive,'-C',source]);await fs.unlink(archive);
 const installed=await fs.realpath(path.join(repo,'node_modules'));
 await fs.symlink(installed,path.join(source,'node_modules'),process.platform==='win32'?'junction':'dir');
 code=await run(process.execPath,['scripts/agent-build.mjs','codex']);
 const specs=mode==='--comment-tools'?['tests/desktop/comment-empty-finish.spec.js','tests/desktop/markup.spec.js','tests/desktop/reader-quick.spec.js','tests/desktop/highlight-word-drag.spec.js']:['--markup-only','--everyday-tools'].includes(mode)?['tests/desktop/highlight-word-drag.spec.js','tests/desktop/markup.spec.js']:['tests/desktop/pdf-home-formatting.spec.js'];if(mode==='--resume-tools')specs.splice(0,specs.length,'tests/desktop/reader-quick.spec.js','tests/desktop/pdf-home-recovery-notice.spec.js','tests/desktop/pdf-reading.spec.js','tests/desktop/markup.spec.js','tests/desktop/compact-form-ui.spec.js','tests/desktop/live-file-tabs.spec.js','tests/desktop/reader-panel-policy.spec.js');if(mode==='--panel-tools')specs.splice(0,specs.length,'tests/desktop/reader-panel-policy.spec.js');if(mode==='--word-safety')specs.splice(0,specs.length,'tests/desktop/live-file-safety.spec.js','tests/desktop/everyday-repeat.spec.js','tests/desktop/document-compact-layout.spec.js','tests/desktop/document-unified-home.spec.js','tests/desktop/unified-build-tabs.spec.js','tests/desktop/copy-title.spec.js');if(mode==='--release-tools')specs.splice(0,specs.length,'tests/desktop/reader-quick.spec.js','tests/desktop/pdf-home-recovery-notice.spec.js','tests/desktop/pdf-reading.spec.js','tests/desktop/markup.spec.js','tests/desktop/compact-form-ui.spec.js','tests/desktop/live-file-tabs.spec.js','tests/desktop/reader-panel-policy.spec.js','tests/desktop/live-file-safety.spec.js','tests/desktop/everyday-repeat.spec.js','tests/desktop/document-compact-layout.spec.js','tests/desktop/document-unified-home.spec.js','tests/desktop/unified-build-tabs.spec.js','tests/desktop/copy-title.spec.js','tests/desktop/type-unplaced-recovery.spec.js','tests/desktop/comment-empty-finish.spec.js','tests/desktop/highlight-word-drag.spec.js','tests/desktop/document-print.spec.js');if(mode==='--with-word')specs.push('tests/desktop/document-compact-layout.spec.js','tests/desktop/document-unified-home.spec.js','tests/desktop/unified-build-tabs.spec.js');
 if(mode==='--everyday-tools')specs.push('tests/desktop/reader-quick.spec.js','--grep','Highlight follows|Quick edit uses|all markup tools|cropped [0-9]+-degree pages|markup recovery|markup uses|canceling markup');
 if(code===0)code=mode==='--print-tools'?await run(process.execPath,['scripts/check-reader-live-previews.mjs']):await run(process.execPath,[path.join(installed,'@playwright/test/cli.js'),'test',...specs,'--output',output]);
}finally{
 await fs.writeFile(path.join(root,'receipt.json'),JSON.stringify({commit,source:'git archive of the exact committed snapshot',exitCode:code,results:output,scope:['--release-tools','--resume-tools','--word-safety','--panel-tools'].includes(mode)?'Focused everyday UI, saved-file and safety acceptance; no installed-app or whole-release claim':mode==='--comment-tools'?'Focused Comment, Quick edit, Highlight and markup checks, not full UI or release acceptance':mode==='--everyday-tools'?'Focused Quick edit methods, word Highlight and markup checks, not full UI or release acceptance':mode==='--markup-only'?'Focused word Highlight and markup check, not full UI or release acceptance':'Focused PDF Home check, not full UI or release acceptance'},null,2));
 // Delete only the source tree created above; keep the small evidence/receipt.
 if(path.dirname(source)!==root||path.basename(source)!=='source'||path.dirname(root)!==os.tmpdir())throw Error('Unexpected temporary source path.');
 await fs.rm(source,{recursive:true,force:true});
 console.log('Committed Home evidence: '+root);
}
process.exitCode=code;
