// Read-only analysis; never starts Electron, collects garbage or changes a PDF.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const mib = bytes => Math.round(bytes / 1048576 * 10) / 10;
const quantile = (values, fraction) => values.length ? [...values].sort((a,b)=>a-b)[Math.max(0,Math.ceil(values.length*fraction)-1)] : null;

export function summarizeMemory(report, osReport) {
  const samples=report.memory?.samples;
  if(!Array.isArray(samples)||samples.length<2)throw Error('At least two reader memory samples are required.');
  let previous=-1;
  const rows=samples.map(sample=>{
    if(!finite(sample.elapsedMs)||sample.elapsedMs<previous||!Array.isArray(sample.processes)||!sample.processes.length)throw Error('Memory samples require ordered elapsed times and process measurements.');
    previous=sample.elapsedMs;
    let privateBytes=0;
    const processes={};
    for(const process of sample.processes){
      if(!finite(process.privateKiB)||typeof process.type!=='string')throw Error('A process private-memory measurement is missing.');
      privateBytes+=process.privateKiB*1024;
      processes[process.type]=(processes[process.type]||0)+process.privateKiB*1024;
    }
    return {label:sample.label,elapsedSeconds:Math.round(sample.elapsedMs/100)/10,privateMiB:mib(privateBytes),rendererHeapMiB:finite(sample.heap?.JSHeapUsedSize)?mib(sample.heap.JSHeapUsedSize):null,processesMiB:Object.fromEntries(Object.entries(processes).map(([type,bytes])=>[type,mib(bytes)]))};
  });
  const navigation=report.memory.navigation||[];
  if(!Array.isArray(navigation)||navigation.some(row=>!finite(row.navigationMs)||!finite(row.heartbeatExtraMs)))throw Error('Navigation samples require timings and heartbeat measurements.');
  const completed=report.pass===true&&report.closed===true&&report.exit?.code===0&&finite(report.memory.elapsedMs);
  const result={
    completed,
    scope:report.memory.scope,
    graphicsMode:report.graphicsMode,
    // A receipt without final hash checks never establishes unchanged inputs.
    inputIntegrityVerified:completed&&report.originalUnchanged===true&&report.inputCopiesUnchanged===true&&report.largeOriginalUnchanged===true&&(!report.suppliedSource||report.suppliedSourceUnchanged===true),
    durationSeconds:rows.at(-1).elapsedSeconds,
    sampleCount:rows.length,
    electronPrivateMiB:{baseline:rows[0].privateMiB,peak:Math.max(...rows.map(row=>row.privateMiB)),last:rows.at(-1).privateMiB},
    homeSamples:rows.filter(row=>/^Home\b/.test(row.label||'')),
    navigation:{count:navigation.length,p50Ms:quantile(navigation.map(row=>row.navigationMs),.5),p95Ms:quantile(navigation.map(row=>row.navigationMs),.95),maxMs:navigation.length?Math.max(...navigation.map(row=>row.navigationMs)):null,maxHeartbeatExtraMs:navigation.length?Math.max(...navigation.map(row=>row.heartbeatExtraMs)):null},
    samples:rows,
    interpretation:'Sampled process private memory includes caches, native allocations and allocator reserves. These totals alone establish neither a leak nor a stable plateau. No forced-GC claim follows from this report.'
  };
  if(osReport){
    const root=samples[0].processes.find(process=>process.type==='Browser')?.pid;
    if(!Number.isSafeInteger(root)||root!==osReport.rootPid)throw Error('The Windows sampler belongs to another app process.');
    if(!Array.isArray(osReport.samples)||!osReport.samples.length||osReport.samples.some(sample=>!finite(sample.totalPrivateBytes)))throw Error('Windows private-memory samples are missing.');
    result.windowsProcessTree={rootPid:root,sampleCount:osReport.samples.length,exitObserved:osReport.closed===true,peakPrivateMiB:mib(Math.max(...osReport.samples.map(sample=>sample.totalPrivateBytes))),lastPrivateMiB:mib(osReport.samples.at(-1).totalPrivateBytes),scope:osReport.scope};
  }
  return result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const [receipt,osFile,output]=process.argv.slice(2);
  if(!receipt)throw Error('Usage: node scripts/check-reader-memory-report.mjs <report.json> [os-memory.json] [output.json]');
  const summary=summarizeMemory(JSON.parse(await fs.readFile(receipt,'utf8')),osFile?JSON.parse(await fs.readFile(osFile,'utf8')):undefined);
  if(output)await fs.writeFile(output,JSON.stringify(summary,null,2)+'\n');
  const {samples,...compact}=summary;
  console.log(JSON.stringify(compact,null,2));
  if(!summary.completed)process.exitCode=1;
}
