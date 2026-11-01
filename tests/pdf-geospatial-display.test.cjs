const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
// Exercise the real display methods with an inert DOM and a known backend
// receipt. CSS and the artwork renderer belong to the separate built-app check.
function node(){return {children:[],hidden:false,append(...items){this.children.push(...items);},prepend(...items){this.children.unshift(...items);},replaceChildren(...items){this.children=items;},setAttribute(){},textContent:''};}
function workspace(report){
 const source=fs.readFileSync(require.resolve('../src/pdf-geospatial-workspace.js'),'utf8').replace(/^import .*;\r?$/gm,'').replace('export class PdfGeospatialWorkspace','class PdfGeospatialWorkspace');
 const context=vm.createContext({document:{createElement:node,createElementNS:node},pdfjs:{GlobalWorkerOptions:{}},workerUrl:'',window:{pdfix:{queryPdfGeospatial:async()=>report}}});
 vm.runInContext(source+'\nglobalThis.Workspace=PdfGeospatialWorkspace;',context,{timeout:1000});
 const w=new context.Workspace({file:{id:'generated-map'}});Object.assign(w,{selected:{id:'known-viewport',supported:true,page:1},pageNumber:1,inventory:{inventoryToken:'generated'},mode:{value:'point'},referenceLat:{value:''},referenceLon:{value:''},resultNode:node(),statusNode:node(),overlay:node(),pointList:node(),x:{value:''},y:{value:''},points:[]});w.controls=()=>{};return w;
}
test('map point list displays the point coordinates and one-based sequence',()=>{
 const w=workspace();w.points=[{x:200,y:300},{x:210,y:310}];w.renderPoints();assert.equal(w.pointList.children[0].textContent,'1: PDF x 200.0000, y 300.0000 (page 1)');assert.equal(w.pointList.children[1].textContent,'2: PDF x 210.0000, y 310.0000 (page 1)');
});
test('geographic result displays the returned coordinates without confusing index and point',async()=>{
 const report={crs:{name:'Known WGS84 map'},page:1,accuracy:'unverified',points:[{x:200,y:300,latitude:40.5,longitude:-74.5}],distanceMeters:null,segments:[],reference:null,modelResidual:0,residualUnit:'degree',algorithm:'Affine fixture',scope:'Generated fixture',sourceSha256:'a'.repeat(64)},w=workspace(report);w.points=[{x:200,y:300}];await w.query();assert.equal(w.resultNode.hidden,false);assert.ok(w.resultNode.children.some(n=>n.textContent==='1: latitude 40.500000°, longitude -74.500000° · PDF x 200.0000, y 300.0000'));assert.equal(w.result,report);
});
