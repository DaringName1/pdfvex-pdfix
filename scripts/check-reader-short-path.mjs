// Generated native compatibility check for Windows 8.3 TEMP aliases. Run via agent-run.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {PDFDocument} from 'pdf-lib';
const require=createRequire(import.meta.url),{PagedPdfService}=require('../desktop/paged-pdf-service.cjs');
const root=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix long staged path regression-'));
const report={scope:'Generated native reader with a real Windows short-directory alias; compatibility check, not a reproduction of the cloud volume-lookup restriction; no Electron or remote-desktop claim',cases:[]};
try{
  const directory=path.join(root,'Reader staging with a long directory name');await fs.mkdir(directory);
  // Filesystem COM only, not Windows UI Automation. No settings are changed.
  const script="$f=New-Object -ComObject Scripting.FileSystemObject; $f.GetFolder('"+directory.replaceAll("'","''")+"').ShortPath";
  const result=await promisify(execFile)('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,timeout:15000});
  const alias=result.stdout.trim(),canonical=await fs.realpath(directory);
  if(!path.isAbsolute(alias)||alias===canonical||!alias.includes('~'))throw Object.assign(Error('A real 8.3 directory alias is unavailable on this volume; regression is blocked, not passed.'),{code:'ALIAS_UNAVAILABLE'});
  report.realAliasAvailable=true;
  const pdf=await PDFDocument.create();for(let i=1;i<=501;i++)pdf.addPage([400,600]).drawText('Alias regression physical page '+i,{x:30,y:400});
  const bytes=Buffer.from(await pdf.save()),source=path.join(root,'source.pdf');await fs.writeFile(source,bytes);
  const sha=createHash('sha256').update(bytes).digest('hex');
  const selected={pagedInput:async()=>({length:bytes.length,sha256:sha,validate:async()=>Buffer.from(await fs.readFile(source)).equals(bytes),stage:async target=>fs.copyFile(source,target,require('node:fs').constants.COPYFILE_EXCL)})};
  for(const control of [true,false]){
    const service=new PagedPdfService({engineDirectory:path.resolve('dist/native/qpdf'),stagingDirectory:alias});
    const entry={mode:control?'raw-short-alias-control':'canonical-broker-path'};let timer;
    if(control){const initialize=service.initialize.bind(service);service.initialize=async()=>{await initialize();service.directory=alias;};}
    try{
      timer=setTimeout(()=>{void service.cancel('fixture');},120000);
      const metadata=await service.open('fixture',selected);
      if(metadata.pageCount!==501||(!control&&service.directory!==canonical))throw Error('Canonical staging or physical page count is incorrect.');
      for(const number of [1,501]){const page=await service.page('fixture',selected,number,randomUUID());if((await PDFDocument.load(page.bytes)).getPageCount()!==1)throw Error('Independent extracted-page readback failed.');}
      entry.pagesReadBack=[1,501];entry.canonicalStagingUsed=!control;
      entry.pass=true;
    }catch(error){entry.pass=false;entry.error=error.message;throw error;}
    finally{clearTimeout(timer);await service.dispose();entry.closed=true;report.cases.push(entry);}
  }
  report.originalUnchanged=Buffer.from(await fs.readFile(source)).equals(bytes);if(!report.originalUnchanged)throw Error('Generated original changed.');
  report.pass=true;
}catch(error){report.pass=false;report.error=error.message;report.blocked=error.code==='ALIAS_UNAVAILABLE';process.exitCode=report.blocked?2:1;}
finally{await fs.writeFile(path.join(root,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,report:path.join(root,'report.json')},null,2));}
