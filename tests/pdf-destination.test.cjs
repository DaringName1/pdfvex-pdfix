const {test}=require('node:test');
const assert=require('node:assert/strict');
const destination=import('../src/pdf-destination.js');
const page={rotate:0,view:[10,20,610,820],getViewport({scale,rotation}){
  const rotated=rotation%180!==0;
  return {width:(rotated?800:600)*scale,height:(rotated?600:800)*scale,
    convertToViewportPoint(x,y){return rotated?[(y-20)*scale,(x-10)*scale]:[(x-10)*scale,(820-y)*scale];}};
}};

test('named outline destinations resolve exact views and physical page references',async()=>{
  const {resolvePdfDestination}=await destination;
  const doc={numPages:3,getDestination:async name=>{assert.equal(name,'section');return [{num:17,gen:0},{name:'XYZ'},42,700,1.5];},getPageIndex:async ref=>{assert.equal(ref.num,17);return 1;}};
  assert.deepEqual(await resolvePdfDestination(doc,'section'),{page:2,kind:'XYZ',args:[42,700,1.5]});
  assert.equal((await resolvePdfDestination(doc,[0,{name:'Fit'}])).page,1);
  for(const raw of [[3,{name:'Fit'}],[0,{name:'XYZ'},1,2,Infinity],[0,{name:'FitR'},null,0,3,4],[0,{name:'Launch'}],[0,{name:'XYZ'},1,2,-1]])await assert.rejects(resolvePdfDestination(doc,raw));
});

test('XYZ preserves null coordinates/zoom and maps cropped page coordinates',async()=>{
  const {pdfDestinationView}=await destination;
  const view=pdfDestinationView(page,{kind:'XYZ',args:[null,700,0]},{width:500,height:400,zoom:2,currentPoint:[60,750]});
  assert.equal(view.zoom,2);assert.equal(view.left,100);assert.equal(view.top,240);
});

test('page, width, height and rectangle fitting use rotated page geometry',async()=>{
  const {pdfDestinationView}=await destination;
  const options={width:400,height:300,zoom:1,rotation:90};
  assert.equal(pdfDestinationView(page,{kind:'Fit',args:[]},options).zoom,.5);
  assert.equal(pdfDestinationView(page,{kind:'FitH',args:[700]},options).zoom,.5);
  assert.equal(pdfDestinationView(page,{kind:'FitV',args:[100]},options).zoom,.5);
  const region=pdfDestinationView(page,{kind:'FitR',args:[110,220,210,420]},options);
  assert.equal(region.zoom,2);assert.equal(region.left,400);assert.equal(region.top,150);
  assert.throws(()=>pdfDestinationView(page,{kind:'FitR',args:[210,220,110,420]},options),/rectangle/);
});

test('destination zoom obeys existing canvas pixel and dimension limits',async()=>{
  const {pdfDestinationView}=await destination;
  const view=pdfDestinationView(page,{kind:'XYZ',args:[10,820,20]},{width:500,height:400,zoom:1,pixelLimit:120000});
  assert.equal(view.zoom,.5);assert.equal(view.viewport.width*view.viewport.height,120000);
});

test('a source or navigation change during resolution never navigates the replacement',async()=>{
  const {navigatePdfDestination}=await destination;
  let resolve;const pending=new Promise(ok=>{resolve=ok;});let calls=0;
  const doc={numPages:1,getDestination:()=>pending,getPage:async()=>page};
  const reader={doc,file:{},navigationIntent:0,viewRotation:0,go(){calls++;}};
  const work=navigatePdfDestination(reader,'section');reader.navigationIntent++;
  resolve([0,{name:'Fit'}]);await assert.rejects(work,/view changed/);assert.equal(calls,0);
  await assert.rejects(navigatePdfDestination({...reader,doc:{}},[0,{name:'Fit'}],{expectedDoc:doc}),/view changed/);
});

test('a user navigation while a resized view is loading cancels the queued destination',async()=>{
 const {navigatePdfDestination}=await destination;let calls=0;
 const reader={doc:{numPages:1,getPage:async()=>page},file:{},navigationIntent:0,viewRotation:0,root:{isConnected:true},paper:{dataset:{ready:'false'}},go(){calls++;}};
 const pending=navigatePdfDestination(reader,[0,{name:'Fit'}]);
 setTimeout(()=>{reader.navigationIntent++;},60);
 await assert.rejects(pending,/view changed/);assert.equal(calls,0);
});

test('disposing a reader cancels a destination waiting for rendering',async()=>{
 const {navigatePdfDestination}=await destination;let calls=0;
 const reader={doc:{numPages:1,getPage:async()=>page},file:{},navigationIntent:0,viewRotation:0,root:{isConnected:true},paper:{dataset:{ready:'false'}},go(){calls++;}};
 const pending=navigatePdfDestination(reader,[0,{name:'Fit'}]);
 setImmediate(()=>{reader.disposed=true;});
 await assert.rejects(pending,/view changed/);assert.equal(calls,0);
});

test('a pending view refit settles before destination page extraction begins',async()=>{
 const {navigatePdfDestination}=await destination;let calls=0;
 const reader={file:{},navigationIntent:0,viewRotation:0,root:{isConnected:true},paper:{dataset:{ready:'false'}},activePageRenders:1};
 reader.doc={numPages:1,getPage:async()=>{calls++;assert.equal(reader.paper.dataset.ready,'true');assert.equal(reader.activePageRenders,0);reader.navigationIntent++;return page;}};
 const pending=navigatePdfDestination(reader,[0,{name:'Fit'}]);
 setTimeout(()=>{reader.activePageRenders=0;reader.paper.dataset.ready='true';},50);
 await assert.rejects(pending,/view changed/);assert.equal(calls,1);
});