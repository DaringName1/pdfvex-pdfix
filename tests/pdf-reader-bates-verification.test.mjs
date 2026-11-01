import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {hash} from '../scripts/user-robot/verify.mjs';
import {verifyBatchOutcome} from '../scripts/user-robot/actions-codex-batch.mjs';

test('Bates report cannot hide a duplicated identifier on the wrong saved page',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-bates-verifier-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const parent=path.join(root,'out');await fs.mkdir(parent);const original=await PDFDocument.create();original.addPage([200,300]).drawText('Source body',{x:20,y:200});const bytes=Buffer.from(await original.save()),file=path.join(root,'source.pdf');await fs.writeFile(file,bytes);const output=await PDFDocument.load(bytes);output.getPage(0).drawText('BATES-000041',{x:20,y:100});output.addPage([200,300]).drawText('BATES-000041',{x:20,y:100});await fs.writeFile(path.join(parent,'numbered.pdf'),await output.save());const report=path.join(root,'report.json');await fs.writeFile(report,JSON.stringify({nextNumber:44,sources:[{status:'saved'},{status:'skipped'},{status:'saved'}]}));const result=await verifyBatchOutcome({kind:'bates',parent,report,sources:[{file,sha256:hash(bytes)}],expected:[{name:'numbered.pdf',pages:2,text:['Source body'],identifiers:['BATES-000041','BATES-000042']}]});assert.equal(result.pass,false);assert.match(result.problems.join(' '),/wrong page/);
});
