import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {hash} from '../scripts/user-robot/verify.mjs';
import {verifyBatchOutcome} from '../scripts/user-robot/actions-codex-batch.mjs';
async function fixture(t,kind='copy'){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-batch-verifier-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const parent=path.join(root,'outputs');await fs.mkdir(parent);const doc=await PDFDocument.create();doc.addPage([200,300]).drawText('Source body',{x:20,y:200});const bytes=Buffer.from(await doc.save()),file=path.join(root,'original.pdf');await fs.writeFile(file,bytes);return {kind,parent,sources:[{file,sha256:hash(bytes)}],expected:[{name:'copy.pdf',pages:1,text:['Source body'],exact:hash(bytes)}],bytes};
}
test('exact batch copy rejects a different valid PDF with the same page count',async t=>{const o=await fixture(t);await fs.writeFile(path.join(o.parent,'copy.pdf'),o.bytes);assert.equal((await verifyBatchOutcome(o)).pass,true);const other=await PDFDocument.create();other.addPage([200,300]).drawText('Source body',{x:40,y:200});await fs.writeFile(path.join(o.parent,'copy.pdf'),await other.save());const result=await verifyBatchOutcome(o);assert.equal(result.pass,false);assert.match(result.problems.join(' '),/Exact PDF copy/);});
test('batch verification detects changed originals and unexpected extra output',async t=>{const o=await fixture(t);await fs.writeFile(path.join(o.parent,'copy.pdf'),o.bytes);await fs.writeFile(path.join(o.parent,'extra.pdf'),o.bytes);await fs.appendFile(o.sources[0].file,'changed');const result=await verifyBatchOutcome(o);assert.equal(result.pass,false);assert.match(result.problems.join(' '),/original changed/);assert.match(result.problems.join(' '),/unexpected number/);});
test('text batches require exact source words and valid round-tripping UTF-8',async t=>{const o=await fixture(t,'text');o.expected=[{name:'copy.txt',text:['Source body']}];const file=path.join(o.parent,'copy.txt');await fs.writeFile(file,'--- Physical page 1 ---\nSource body\n');assert.equal((await verifyBatchOutcome(o)).pass,true);await fs.writeFile(file,'Other body');assert.equal((await verifyBatchOutcome(o)).pass,false);await fs.writeFile(file,Buffer.from([0xc3,0x28]));assert.equal((await verifyBatchOutcome(o)).pass,false);});
test('compressed output being smaller is insufficient when source text is lost',async t=>{const o=await fixture(t,'compression');delete o.expected[0].exact;o.expected[0].smallerThan=100000;const blank=await PDFDocument.create();blank.addPage([200,300]);await fs.writeFile(path.join(o.parent,'copy.pdf'),await blank.save());const result=await verifyBatchOutcome(o);assert.equal(result.pass,false);assert.match(result.problems.join(' '),/Source text missing/);});
test('empty or unknown batch outcomes cannot pass',async()=>{for(const o of [null,{kind:'unknown',sources:[],expected:[]},{kind:'copy',sources:[],expected:[]}])assert.equal((await verifyBatchOutcome(o)).pass,false);});
