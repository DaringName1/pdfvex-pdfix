const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
// Invoke the real pane operation, with storage replaced by a write recorder.
function setup(preview){
 const source=fs.readFileSync(require.resolve('../src/pdf-reader.js'),'utf8'),start=source.indexOf('  setPane('),end=source.indexOf('  async action(',start),writes=[];
 const context=vm.createContext({saveLayoutPreference:(...args)=>writes.push(args)}),setPane=vm.runInContext('({'+source.slice(start,end)+'}).setPane',context,{timeout:1000});
 const panels={'.pdf-navigation':{hidden:true},'.reader-inspector':{hidden:true}},buttons={thumbnails:{setAttribute(){}},inspector:{setAttribute(){}}};let thumbnails=0;
 const reader={keyboardWithinRoot:preview,root:{querySelector:selector=>panels[selector]||buttons[selector.match(/"(.*?)"/)[1]]},scheduleThumbnails(){thumbnails++;}};
 return {reader,panels,writes,setPane:(...args)=>setPane.call(reader,...args),thumbnails:()=>thumbnails};
}
test('opening search in a proof is local and cannot change the main-reader saved preference',()=>{const s=setup(true);s.setPane('inspector',true);assert.equal(s.panels['.reader-inspector'].hidden,false);assert.equal(s.writes.length,0);s.setPane('inspector',false);assert.equal(s.writes.length,0);});
test('explicit main-reader choices still persist, while temporary markup folding does not',()=>{const s=setup(false);s.setPane('thumbnails',true);assert.deepEqual(s.writes,[['thumbnails',true]]);s.setPane('thumbnails',false,{persist:false});s.setPane('thumbnails',true,{persist:false});assert.equal(s.writes.length,1);assert.equal(s.panels['.pdf-navigation'].hidden,false);assert.equal(s.thumbnails(),3);});
