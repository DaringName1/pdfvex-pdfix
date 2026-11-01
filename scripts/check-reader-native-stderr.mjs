// Generated native-helper acceptance. Run through agent-run; no Electron UI claim.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {PDFDocument} from 'pdf-lib';
const require=createRequire(import.meta.url),{PagedPdfService}=require('../desktop/paged-pdf-service.cjs');
const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-reader-stderr-'));
const report={scope:'Generated PDFs through the contained native reader; not built-app or outside-software evidence',cases:[]};
const pdf=await PDFDocument.create();pdf.addPage([400,600]).drawText('Generated safe page',{x:30,y:400});
const sentinel='PDFIX_PRIVATE_PARSE_SENTINEL';
const fixtures=[{name:'valid',bytes:Buffer.from(await pdf.save()),valid:true},{name:'malformed',bytes:Buffer.from('%PDF-1.7\n'+sentinel+'\ntrailer << /Root 999 0 R >>\nstartxref\n0\n%%EOF'),valid:false}];
for(const fixture of fixtures){
  const folder=path.join(root,fixture.name);await fs.mkdir(folder);
  const source=path.join(folder,'source.pdf');await fs.writeFile(source,fixture.bytes);
  const sha=createHash('sha256').update(fixture.bytes).digest('hex');
  const selected={pagedInput:async()=>({length:fixture.bytes.length,sha256:sha,validate:async()=>Buffer.from(await fs.readFile(source)).equals(fixture.bytes),stage:async(target)=>fs.copyFile(source,target,require('node:fs').constants.COPYFILE_EXCL)})};
  const service=new PagedPdfService({engineDirectory:path.resolve('dist/native/qpdf'),stagingDirectory:path.join(folder,'staging')});
  let diagnostics='',protocol='',overflow=false,timer;
  const launch=service.sandbox.launchPagedSession.bind(service.sandbox);
  service.sandbox.launchPagedSession=async(...args)=>{
    const child=await launch(...args);
    const collect=(type,chunk)=>{if(type==='stderr')diagnostics+=chunk;else protocol+=chunk;if(diagnostics.length+protocol.length>65536){overflow=true;child.kill();}};
    child.stderr.on('data',chunk=>collect('stderr',chunk));child.stdout.on('data',chunk=>collect('stdout',chunk));return child;
  };
  const result={name:fixture.name};
  try{
    timer=setTimeout(()=>{void service.cancel('fixture');},120000);
    let rejected;
    try{
      const metadata=await service.open('fixture',selected);
      if(!fixture.valid)throw Error('Malformed input was accepted.');
      if(metadata.pageCount!==1)throw Error('Unexpected generated page count.');
      const page=await service.page('fixture',selected,1,randomUUID());
      if((await PDFDocument.load(page.bytes)).getPageCount()!==1)throw Error('Independent page readback failed.');
      result.pageReadBack=true;
    }catch(error){if(fixture.valid)throw error;rejected=error;}
    if(!fixture.valid&&(!rejected||!protocol.includes('PDFIX_PAGED:ERROR:OPEN:PARSE')))throw Error('Malformed source did not produce the bounded parser refusal.');
    if(overflow||diagnostics.includes(sentinel)||protocol.includes(sentinel))throw Error('Raw parser text escaped its controlled channels.');
    const lines=diagnostics.trim().split(/\r?\n/).filter(Boolean);
    if(lines.some(line=>!/^PDFIX_PAGED_(API|REJECT|HOST):[A-Z_]+:-?\d+$/.test(line)))throw Error('Unstructured parser diagnostics escaped.');
    result.diagnosticLines=lines;result.structuredParseRefusal=!fixture.valid;result.pass=true;
  }catch(error){result.pass=false;result.error=error.message;process.exitCode=1;}
  finally{
    clearTimeout(timer);
    try{await service.dispose();result.closed=true;}catch(error){result.pass=false;result.closeError=error.message;process.exitCode=1;}
    result.sourceUnchanged=Buffer.from(await fs.readFile(source)).equals(fixture.bytes);
    if(!result.sourceUnchanged){result.pass=false;process.exitCode=1;}
    report.cases.push(result);
  }
}
report.pass=report.cases.every(result=>result.pass&&result.closed);
await fs.writeFile(path.join(root,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,report:path.join(root,'report.json')},null,2));
