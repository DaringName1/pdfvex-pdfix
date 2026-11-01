import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {hash} from '../scripts/user-robot/verify.mjs';
import {verifyReaderEvidence} from '../scripts/user-robot/actions-codex-remaining.mjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {inspect}=require('../desktop/pdf-preflight-codec.cjs');

test('unchanged-copy and attachment checks reject changed or empty saved bytes',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-robot-evidence-'));
 try{const output=path.join(root,'saved.bin'),bytes=Buffer.from('Known inert payload');await fs.writeFile(output,bytes);
  for(const expected of [{kind:'copy',sourceHash:hash(bytes)},{kind:'attachment',payloadHash:hash(bytes)}]){
   assert.equal((await verifyReaderEvidence(output,expected)).pass,true);
   await fs.writeFile(output,Buffer.alloc(0));assert.equal((await verifyReaderEvidence(output,expected)).pass,false);await fs.writeFile(output,bytes);
  }
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('saved preflight evidence must describe the real fixture, not just have a success flag',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-report-evidence-'));
 try{
  const pdf=await PDFDocument.create();for(let i=0;i<3;i++)pdf.addPage([400,600]).drawText('Robot reader needle '+(i+1),{x:40,y:520});const bytes=Buffer.from(await pdf.save()),output=path.join(root,'report.json');
  const report=await inspect(bytes,{profileId:'practical-print-v1'});
  const expected={kind:'report',sourceHash:hash(bytes),sourceBytes:bytes.length,audit:false};
  const envelope=report=>({format:'PDFix inspection evidence',version:1,family:'preflight',report});
  await fs.writeFile(output,JSON.stringify(envelope(report)));assert.equal((await verifyReaderEvidence(output,expected)).pass,true);
  for(const mutate of [r=>{r.sourceSha256='0'.repeat(64);},r=>{r.pages[0].boxes[0].rect=[0,0,1,1];},r=>{r.fonts=[];},r=>{r.findings=[];}]){const changed=structuredClone(report);mutate(changed);await fs.writeFile(output,JSON.stringify(envelope(changed)));assert.equal((await verifyReaderEvidence(output,expected)).pass,false);}
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
