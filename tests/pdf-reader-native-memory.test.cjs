const {test}=require('node:test'),assert=require('node:assert/strict');
test('native memory diagnostic preserves estimates and bounds retained stacks without changing its input',async()=>{
 const {summarizeNativeMemory}=await import('./helpers/reader-native-memory.mjs'),samples=Array.from({length:70},(_,i)=>({total:i,size:1,stack:Array(30).fill('x'.repeat(250))})),profile={samples,modules:[{name:'renderer',size:10,baseAddress:'private-address'}]},result=summarizeNativeMemory(profile);
 assert.equal(result.sampleCount,70);assert.equal(result.estimatedBytes,2415);assert.equal(result.top.length,60);assert.equal(result.top[0].total,69);assert.equal(result.top[0].stack.length,24);assert.equal(result.top[0].stack[0].length,200);assert.equal(profile.samples[0].total,0);assert.deepEqual(result.modules,[{name:'renderer',size:10}]);
});
test('native memory diagnostic refuses malformed or oversized profiles',async()=>{
 const {summarizeNativeMemory}=await import('./helpers/reader-native-memory.mjs');for(const profile of [null,{samples:[],modules:null},{samples:Array(100001),modules:[]},{samples:[{size:1,total:NaN,stack:[]}],modules:[]},{samples:[{size:1,total:-1,stack:[]}],modules:[]}])assert.throws(()=>summarizeNativeMemory(profile));
});

test('native samples retain build identities and resolve addresses to bounded module offsets',async()=>{
 const {summarizeNativeMemory}=await import('./helpers/reader-native-memory.mjs'),profile={samples:[{total:100,size:10,stack:['0x1000','0x10ff','0x1100','unresolved function']}],modules:[{name:'renderer.dll',baseAddress:'0x1000',size:256,uuid:'known-build'}]},result=summarizeNativeMemory(profile);
 assert.deepEqual(result.modules,[{name:'renderer.dll',baseAddress:'0x1000',size:256,uuid:'known-build'}]);assert.deepEqual(result.top[0].moduleFrames,[{module:'renderer.dll',offset:'0x0'},{module:'renderer.dll',offset:'0xff'},null,null]);assert.equal(profile.samples[0].stack[0],'0x1000');
});

test('native sample resolution refuses unsafe ranges and bounds module identity text',async()=>{
 const {summarizeNativeMemory}=await import('./helpers/reader-native-memory.mjs'),result=summarizeNativeMemory({samples:[{total:1,size:1,stack:['0x1000']}],modules:[{name:'x',baseAddress:'0x1000',size:Infinity},{name:'safe',baseAddress:'0x2000',size:16,uuid:'x'.repeat(500)}]});assert.equal(result.top[0].moduleFrames,undefined);assert.equal(result.modules[0].baseAddress,undefined);assert.equal(result.modules[1].uuid.length,200);
});
