const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(){
 const source=fs.readFileSync(require.resolve('../src/pdf-area-selection.js'),'utf8').replace(/^import .*;\r?$/gm,'').replace('export class PdfAreaSelection','class PdfAreaSelection');
 let calls=0,empty=false;const context=vm.createContext({AbortController,rectangleRuns(layer,bounds,rect){calls++;assert.equal(layer.rebuilt,true);assert.equal(bounds.width,400);assert.equal(rect.left,40);assert.equal(rect.right,200);return empty?[]:[{text:'Restored words',left:40,width:160,range:{fresh:true}}];},orderVisualText:entries=>entries.map(e=>e.text)});
 vm.runInContext(source+'\nglobalThis.Selection=PdfAreaSelection;',context,{timeout:1000});
 const panel={hidden:false,querySelector:()=>({value:'Old words'})},reader={doc:{},pageNumber:2,viewRotation:0,copyAllowed:true,region:{hidden:false,hasPointerCapture:()=>false},regionBox:{hidden:false,style:{}},root:{querySelector:()=>panel},paper:{hidden:false,getBoundingClientRect:()=>({left:0,top:0,width:400,height:800})},layer:{rebuilt:true},areaText:'Old words',rect:{left:20,top:20,right:100,bottom:80}};
 const selection=new context.Selection(reader);selection.note={textContent:''};selection.entries=[{range:{detached:true}}];selection.completed={doc:reader.doc,page:2,rotation:0,area:[.1,.1,.5,.2]};
 return {selection,reader,panel,calls:()=>calls,empty:()=>{empty=true;}};
}
test('same-page reflow drops detached ranges and rebuilds selection in the new page scale',()=>{
 const {selection:s,reader:r,panel,calls}=setup();s.suspend();assert.equal(s.entries.length,0);assert.equal(panel.hidden,true);assert.equal(r.areaText,'');assert.ok(s.completed);s.restore();assert.equal(calls(),1);assert.equal(r.areaText,'Restored words');assert.equal(panel.hidden,false);assert.equal(r.rect.top,80);assert.equal(r.rect.bottom,160);assert.equal(s.entries[0].range.fresh,true);
});
test('page, document, view rotation, unavailable text and copy permission changes invalidate the selection',()=>{
 for(const change of [r=>r.pageNumber++,r=>r.doc={},r=>r.viewRotation=90,r=>r.copyAllowed=false,r=>r.paper.hidden=true,r=>r.region.hidden=true,r=>r.disposed=true]){const {selection:s,reader:r,calls}=setup();s.suspend();change(r);s.restore();assert.equal(s.completed,null);assert.equal(r.areaText,'');assert.equal(calls(),0);}
});
test('explicit clear cannot resurrect completed text on a later reflow',()=>{const {selection:s,reader:r,calls}=setup();s.clear();s.restore();assert.equal(s.completed,null);assert.equal(r.areaText,'');assert.equal(calls(),0);});
test('empty replacement text layer clears rather than publishing stale text',()=>{const {selection:s,reader:r,panel,empty}=setup();s.suspend();empty();s.restore();assert.equal(s.completed,null);assert.equal(r.areaText,'');assert.equal(panel.hidden,true);});
test('a canceled active gesture discards any prior completed selection',()=>{const {selection:s,reader:r}=setup();s.drag={id:9};s.cancel({pointerId:9});assert.equal(s.drag,null);assert.equal(s.completed,null);assert.equal(r.areaText,'');});
