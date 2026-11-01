// Test-only Windows process ownership receipts. Never stop a process by name,
// and never stop a reused PID: creation time must match a captured descendant.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
const exec=promisify(execFile);
export function descendants(rows,root){
 const identities=new Map(rows.map(row=>[row.pid,row]));if(!identities.has(root))return [];
 const selected=new Set([root]);let changed=true;
 while(changed){changed=false;for(const row of rows){if(!selected.has(row.parent)||selected.has(row.pid))continue;const parent=identities.get(row.parent),created=Date.parse(row.created),parentCreated=Date.parse(parent.created);if(!Number.isFinite(created)||!Number.isFinite(parentCreated)||created<parentCreated)continue;selected.add(row.pid);changed=true;}}
 return rows.filter(row=>selected.has(row.pid));
}
export function survivingOwned(rows,owned){return rows.filter(row=>owned.some(old=>old.pid===row.pid&&old.created===row.created&&old.name===row.name));}
async function powershell(script,extra={}){const result=await exec('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,timeout:15000,maxBuffer:1024*1024,env:{...process.env,...extra}});return JSON.parse(result.stdout.trim()||'null');}
export async function processSnapshot(){
 if(process.platform!=='win32')throw Error('Reader process receipts require Windows.');
 return powershell(`$ErrorActionPreference='Stop';$rows=@(Get-CimInstance Win32_Process | ForEach-Object { [pscustomobject]@{pid=[int]$_.ProcessId;parent=[int]$_.ParentProcessId;name=$_.Name;created=$_.CreationDate.ToUniversalTime().ToString('o');privateBytes=[double]$_.PrivatePageCount;workingSetBytes=[double]$_.WorkingSetSize;handles=[int]$_.HandleCount} });$os=Get-CimInstance Win32_OperatingSystem;[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');processes=$rows;freePhysicalKiB=[double]$os.FreePhysicalMemory;freeVirtualKiB=[double]$os.FreeVirtualMemory;totalVirtualKiB=[double]$os.TotalVirtualMemorySize}|ConvertTo-Json -Compress -Depth 4`);
}
export async function stopOwned(owned){
 if(!owned.length)return [];
 // Read identity again in the stopping process, immediately before Stop-Process.
 return powershell(`$ErrorActionPreference='Stop';$expected=ConvertFrom-Json $env:PDFIX_OWNED_PROCESSES;$stopped=@();foreach($entry in $expected){$current=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$entry.pid);if($null-ne $current-and $current.Name-eq $entry.name-and $current.CreationDate.ToUniversalTime().ToString('o')-eq $entry.created){Stop-Process -Id ([int]$entry.pid) -Force -ErrorAction Stop;$stopped+=[int]$entry.pid}};ConvertTo-Json -InputObject $stopped -Compress`,{PDFIX_OWNED_PROCESSES:JSON.stringify(owned.map(({pid,name,created})=>({pid,name,created})))});
}
export async function ownedReceipt(app){
 const child=app.process(),snapshot=await processSnapshot();
 if(child.exitCode!==null||child.signalCode!==null)return {...snapshot,processes:[]};
 const root=snapshot.processes.find(row=>row.pid===child.pid);if(!root)return {...snapshot,processes:[]};
 if(app.readerRootIdentity&&!survivingOwned([root],[app.readerRootIdentity]).length)throw Error('The captured reader root PID was reused; refusing process ownership.');
 app.readerRootIdentity??=root;const processes=descendants(snapshot.processes,child.pid),ids=new Set(processes.map(row=>row.pid));
 // Other PDFix instances may be legitimate. Record these for diagnosis only;
 // never add them to this app's cleanup ownership set.
 const otherNativeProcesses=snapshot.processes.filter(row=>['pdfix.sandbox.exe','pdfix.pagedsession.exe'].includes(row.name.toLowerCase())&&!ids.has(row.pid));
 return {...snapshot,processes,otherNativeProcesses};
}
export async function desktopReceipt(){
 const result=await exec('powershell.exe',['-NoProfile','-NonInteractive','-File',fileURLToPath(new URL('./reader-desktop-resources.ps1',import.meta.url))],{windowsHide:true,timeout:15000,maxBuffer:65536});return JSON.parse(result.stdout.trim());
}
export async function drainOwned(owned,{waitMs=10000}={}){
 const started=Date.now();let remaining;
 do{remaining=survivingOwned((await processSnapshot()).processes,owned);if(!remaining.length)return {remaining:[],forced:[]};await new Promise(resolve=>setTimeout(resolve,250));}while(Date.now()-started<waitMs);
 const forced=await stopOwned(remaining);await new Promise(resolve=>setTimeout(resolve,500));
 return {forced,remaining:survivingOwned((await processSnapshot()).processes,owned)};
}
