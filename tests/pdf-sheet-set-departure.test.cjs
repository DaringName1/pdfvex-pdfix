const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function node(){return {append(){},setAttribute(){},addEventListener(){},showModal(){}};}
async function open(){
 const source=fs.readFileSync(require.resolve('../src/sheet-set-workspace.js'),'utf8').replace(/^import .*;\r?$/gm,'').replace('export class SheetSetWorkspace','class SheetSetWorkspace');
 const context=vm.createContext({document:{createElement:node,body:node()},pdfjs:{GlobalWorkerOptions:{}},workerUrl:'',rememberPdfDialogFocus(){},sheetLabel:(_,i)=>String(i+1)});
 vm.runInContext(source+'\nglobalThis.Workspace=SheetSetWorkspace;',context,{timeout:1000});
 const w=new context.Workspace({id:'generated-pdf',ext:'pdf'});Object.assign(w,{run:async action=>action(),inspectSource:async()=>({pageCount:2}),sourceOptions(){},paint(){},controls(){},showSelected:async()=>{},refresh:async()=>{}});await w.open();return w;
}
test('opening original sheets creates a clean baseline that can leave without discarding',async()=>{const w=await open();assert.equal(w.sheets.length,2);assert.equal(w.dirty,false);let closed=0;w.close=async force=>{assert.equal(force,true);closed++;};await w.prepareDeparture();assert.equal(closed,1);});
test('real changes still prevent departure until explicitly saved or discarded',async()=>{const w=await open();let closed=0;w.close=async()=>{closed++;};w.sheets[0].title='Changed title';w.changed();await assert.rejects(w.prepareDeparture(),/Save or explicitly discard/);assert.equal(w.sheets[0].title,'Changed title');assert.equal(closed,0);w.saving=true;await assert.rejects(w.prepareDeparture(),/Finish saving/);});
