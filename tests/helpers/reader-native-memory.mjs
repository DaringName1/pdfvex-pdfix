// Diagnostic estimates only. Sampling changes allocation overhead and is never
// substituted for the uninstrumented long-session memory acceptance gate.
export function summarizeNativeMemory(profile){
 if(!profile||!Array.isArray(profile.samples)||profile.samples.length>100000||!Array.isArray(profile.modules))throw Error('Native allocation profile is unavailable or too large.');
 const samples=profile.samples.map(sample=>{if(!Number.isFinite(sample.total)||sample.total<0||!Number.isFinite(sample.size)||sample.size<0||!Array.isArray(sample.stack))throw Error('Invalid native allocation sample.');return {total:sample.total,size:sample.size,stack:sample.stack.slice(0,24).map(frame=>String(frame).slice(0,200))};});
 const address=value=>typeof value==='string'&&/^0x[0-9a-f]{1,16}$/i.test(value)?BigInt(value):null;
 const modules=profile.modules.slice(0,100).map(module=>{const result={name:String(module.name).slice(0,200),size:module.size};if(address(module.baseAddress)!==null&&Number.isSafeInteger(module.size)&&module.size>0){result.baseAddress=module.baseAddress;if(typeof module.uuid==='string')result.uuid=module.uuid.slice(0,200);}return result;});
 const top=samples.sort((a,b)=>b.total-a.total).slice(0,60).map(sample=>{const moduleFrames=sample.stack.map(frame=>{const point=address(frame);if(point===null)return null;const module=modules.find(m=>m.baseAddress&&point>=address(m.baseAddress)&&point<address(m.baseAddress)+BigInt(m.size));return module?{module:module.name,offset:'0x'+(point-address(module.baseAddress)).toString(16)}:null;});return moduleFrames.some(Boolean)?{...sample,moduleFrames}:sample;});
 return {scope:'Sampled native allocations; not an independent live-memory measurement',sampleCount:samples.length,estimatedBytes:samples.reduce((sum,sample)=>sum+sample.total,0),top,modules};
}
