// Natural settled-Home private memory; no forced collection or heap snapshots.
// The wrapper reserves ten extra minutes; allow one minute for command startup.
export function readerSoakLeaseCovers(lock, minutes, now=Date.now()) {
  const started=Date.parse(lock?.started),expires=Date.parse(lock?.expiresAt);
  return Number.isFinite(started)&&Number.isFinite(expires)&&started<=now&&
    now-started<=60000&&expires-started>=(minutes+10)*60000&&
    expires-now>=(minutes+9)*60000;
}
export function memoryPlateau(samples, elapsedMs) {
  const limits={minimumMs:3600000,minimumCycles:8,ceilingMiB:2048,slopeMiBPerMinute:1,minimumAllowanceMiB:64,relativeAllowance:.05};
  const eligible=elapsedMs>=limits.minimumMs&&samples.length>=limits.minimumCycles;
  const warmup=Math.max(2,Math.ceil(samples.length*.2)),rows=samples.slice(warmup);
  const half=Math.floor(rows.length/2),earlier=rows.slice(0,half),later=rows.slice(half);
  const median=a=>{const n=a.slice().sort((a,b)=>a-b);return n.length?(n[Math.floor((n.length-1)/2)]+n[Math.ceil((n.length-1)/2)])/2:null;};
  const before=median(earlier.map(s=>s.privateMiB)),after=median(later.map(s=>s.privateMiB));
  const valid=samples.every(s=>Number.isFinite(s.atMs)&&Number.isFinite(s.privateMiB)&&s.privateMiB>=0)&&samples.every((s,i)=>!i||s.atMs>samples[i-1].atMs);
  const x=rows.map(s=>s.atMs/60000),y=rows.map(s=>s.privateMiB),mean=a=>a.reduce((a,b)=>a+b,0)/a.length;
  const mx=mean(x),my=mean(y),den=x.reduce((v,n)=>v+(n-mx)**2,0),slope=den?x.reduce((v,n,i)=>v+(n-mx)*(y[i]-my),0)/den:null;
  const allowance=before===null?null:Math.max(limits.minimumAllowanceMiB,before*limits.relativeAllowance),growth=before===null||after===null?null:after-before;
  const peak=samples.length?Math.max(...samples.map(s=>s.privateMiB)):null;
  const pass=eligible&&valid&&growth!==null&&growth<=allowance&&Number.isFinite(slope)&&slope<=limits.slopeMiBPerMinute&&peak<=limits.ceilingMiB;
  return {pass,eligible,valid,limits,warmupCycles:warmup,earlierMedianMiB:before,laterMedianMiB:after,growthMiB:growth,allowanceMiB:allowance,slopeMiBPerMinute:slope,peakSettledMiB:peak};
}

// A process crash can reset memory counters and imitate a plateau.
export function readerProcessFailures(events){
 if(!Array.isArray(events))return [{event:"diagnostics-unavailable"}];
 return events.filter(e=>e.event==="did-fail-load"||["child-process-gone","render-process-gone"].includes(e.event)&&e.reason!=="clean-exit");
}
