const {test}=require('node:test'),assert=require('node:assert/strict');
const {validatePagedNavigation,validatePagedPageLinks}=require('../desktop/paged-pdf-navigation.cjs');
const metadata=dest=>({version:1,truncated:false,outline:[{title:'Sheet',dest,items:[]}]});
test('bounded navigation accepts numeric original page destinations and disabled unsupported entries',()=>{
 assert.deepEqual(validatePagedNavigation(metadata([500,'Fit']),501).outline[0].dest,[500,'Fit']);assert.equal(validatePagedNavigation(metadata(null),501).outline[0].dest,null);
 for(const dest of [[501,'Fit'],[-1,'Fit'],[0,'JavaScript'],[0,'XYZ',null,null,65],[0,'FitR',0,0,Infinity,10]])assert.throws(()=>validatePagedNavigation(metadata(dest),501),/bounded/);
});
test('navigation metadata rejects unknown fields and excess nesting/counts',()=>{
 assert.throws(()=>validatePagedNavigation({...metadata(null),url:'https://example.com'},1),/bounded/);
 const many=metadata(null);many.outline=Array.from({length:1001},()=>({title:'x',dest:null,items:[]}));assert.throws(()=>validatePagedNavigation(many,1),/bounded/);
 const deep=metadata(null);let row=deep.outline[0];for(let i=0;i<25;i++){row.items=[{title:'x',dest:null,items:[]}];row=row.items[0];}assert.throws(()=>validatePagedNavigation(deep,1),/bounded/);
});
test('page labels retain exact physical-page alignment and enforce their text budget',()=>{
 const value={...metadata(null),labels:['i','ii','A-1']};assert.deepEqual(validatePagedNavigation(value,3).labels,value.labels);
 assert.throws(()=>validatePagedNavigation(value,2),/bounded/);assert.throws(()=>validatePagedNavigation({...value,labels:['i',42,'A-1']},3),/bounded/);
 assert.throws(()=>validatePagedNavigation({...metadata(null),labels:Array(25000).fill('x'.repeat(512))},25000),/bounded/);
});
test('original-page links accept only bounded visible internal destinations for the requested page',()=>{
 const link={id:'native-page-1-link-0',subtype:'Link',rect:[0,0,20,20],annotationFlags:4,dest:[500,'Fit']},value={version:1,page:1,truncated:false,links:[link]};assert.equal(validatePagedPageLinks(value,501,1).links[0].dest[0],500);
 for(const patch of [{annotationFlags:32},{rect:[0,0,0,20]},{dest:[501,'Fit']},{dest:null},{url:'https://example.com'}])assert.throws(()=>validatePagedPageLinks({...value,links:[{...link,...patch}]},501,1));
 assert.throws(()=>validatePagedPageLinks(value,501,2));assert.throws(()=>validatePagedPageLinks({...value,links:[link,link]},501,1));
});
