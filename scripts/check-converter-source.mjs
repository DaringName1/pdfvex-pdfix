import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
if(!process.argv[2])throw new Error('Usage: node scripts/check-converter-source.mjs OUTPUT_PARENT');
const parent=path.resolve(process.argv[2]);await fs.mkdir(parent,{recursive:true});const output=await fs.mkdtemp(path.join(parent,'converter-source-'));
const files=['image-adjustments-core','image-conversion-core','image-file-output-core','image-normalization-core','pdf-image-encoding','pdf-image-export-model','pdf-image-operation','tiff-conversion-core','workbook-csv-core','office-conversion-core','email-conversion-core','image-copy-writer-core','batch-conversion-core','batch-pdf-text-core'].map(name=>'tests/'+name+'.test.cjs');
const report={kind:'PDFix.ConverterSourceChecks.v1',scope:'Converter source/unit and actual temporary disk-writer checks. Browser codecs, PDFix app/native bridge and real-file corpus acceptance are separate.',output,files};
let log='';
const code=await new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,['--test','--test-reporter=spec',...files],{cwd:root,windowsHide:true,env:{...process.env,NODE_DISABLE_COLORS:'1'}});
 for(const stream of [child.stdout,child.stderr])stream.on('data',data=>{log+=data.toString();});child.on('error',reject);child.on('close',resolve);
});
report.exitCode=code;for(const name of ['tests','pass','fail','cancelled','skipped'])report[name]=Number(new RegExp('(?:ℹ |i )?'+name+' (\\d+)').exec(log)?.[1]??0);
await fs.writeFile(path.join(output,'tests.log'),log);await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(code){console.error(log);process.exitCode=code;}
