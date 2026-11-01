const {test}=require('node:test');
const assert=require('node:assert/strict');
const keyboard=import('../src/pdf-reader-keyboard.js');

test('Home Find Escape closes the search panel and restores its actual quick button',async()=>{
 const {createPdfReaderKeyHandler}=await keyboard,oldStyle=global.getComputedStyle;global.getComputedStyle=()=>({visibility:'visible'});
 try{
  let focused=0,closed=0;const button={focus(){focused++;}},root={dataset:{toolGroup:'Home'},isConnected:true,closest:()=>null,getClientRects:()=>[{}],ownerDocument:{querySelectorAll:()=>[]},contains:()=>true,querySelector:selector=>selector==='.reader-inspector'?{hidden:false}:button};
  const target={nodeType:1,closest:selector=>selector==='[data-pdf-reader-root]'?root:['.pdf-query','.reader-inspector'].includes(selector)||selector.startsWith('input,')?{}:null};
  const event={key:'Escape',target,preventDefault(){this.defaultPrevented=true;}};
  createPdfReaderKeyHandler({root,doc:{},find:{searching:false},setPane(name,visible){assert.equal(name,'inspector');assert.equal(visible,false);closed++;},stage:{focus(){throw Error('Focus must return to Home Find');}}})(event);
  assert.equal(event.defaultPrevented,true);assert.equal(closed,1);assert.equal(focused,1);
 }finally{global.getComputedStyle=oldStyle;}
});

test('a nested proof preview owns its print shortcut instead of its containing reader',async()=>{
 const {createPdfReaderKeyHandler}=await keyboard;const oldStyle=global.getComputedStyle;
 global.getComputedStyle=()=>({visibility:'visible'});
 try{
  const document={querySelectorAll:()=>[]},base={dataset:{},isConnected:true,closest:()=>null,getClientRects:()=>[{}],ownerDocument:document,contains:()=>true},outer={...base},inner={...base};
  const target={nodeType:1,closest:selector=>selector==='[data-pdf-reader-root]'?inner:null};let calls=0;
  const event={target,key:'p',ctrlKey:true,preventDefault(){this.defaultPrevented=true;}};
  createPdfReaderKeyHandler({root:outer,doc:{},print(){throw Error('Outer reader stole the preview shortcut');}})(event);
  assert.equal(event.defaultPrevented,undefined);
  createPdfReaderKeyHandler({root:inner,doc:{},print(){calls++;}})(event);await Promise.resolve();await Promise.resolve();
  assert.equal(event.defaultPrevented,true);assert.equal(calls,1);
 }finally{global.getComputedStyle=oldStyle;}
});

test('an active clean-copy preview owns body-focus print without printing the hidden original',async()=>{
 const {createPdfReaderKeyHandler}=await keyboard,oldStyle=global.getComputedStyle;global.getComputedStyle=()=>({visibility:'visible'});
 try{
  const body={nodeType:1,closest:()=>null},document={body,querySelectorAll:()=>[]},root={dataset:{},isConnected:true,closest:()=>null,getClientRects:()=>[{}],ownerDocument:document,contains:()=>false,querySelector:()=>({hidden:true})};let printed=0;
  const preview={root,doc:{},keyboardWithinRoot:true,print(){printed++;}},source={activePageReader:preview,print(){throw Error('Hidden original printed');}},event={target:body,key:'p',ctrlKey:true,preventDefault(){this.defaultPrevented=true;}};
  createPdfReaderKeyHandler(source)(event);await Promise.resolve();await Promise.resolve();assert.equal(event.defaultPrevented,true);assert.equal(printed,1);
 }finally{global.getComputedStyle=oldStyle;}
});
test('page navigation preserves controls, modifiers and handled events',async()=>{
 const {readerKeyAction}=await keyboard;
 assert.equal(readerKeyAction({key:'ArrowRight'}),'next-page');
 for(const event of [{key:'ArrowRight',defaultPrevented:true},{key:'PageDown',isComposing:true},{key:'ArrowLeft',altKey:true},{key:'ArrowLeft',ctrlKey:true},{key:'ArrowRight',shiftKey:true}])assert.equal(readerKeyAction(event),null);
 assert.equal(readerKeyAction({key:'ArrowRight'},{control:true}),null);
 assert.equal(readerKeyAction({key:'PageDown'},{editable:true}),null);
});
test('first/last-page shortcuts preserve editing-field navigation',async()=>{
 const {readerKeyAction}=await keyboard;
 assert.equal(readerKeyAction({key:'Home',ctrlKey:true}),'first');assert.equal(readerKeyAction({key:'End',metaKey:true}),'last');
 assert.equal(readerKeyAction({key:'End',ctrlKey:true},{control:true}),null);assert.equal(readerKeyAction({key:'Home'}),null);
});
test('find, occurrence navigation and Escape retain reader-specific actions',async()=>{
 const {readerKeyAction}=await keyboard;
 assert.equal(readerKeyAction({key:'f',ctrlKey:true}),'search');assert.equal(readerKeyAction({key:'F3',shiftKey:true},{control:true}),'previous-match');
 assert.equal(readerKeyAction({key:'F3',ctrlKey:true}),null);
 assert.equal(readerKeyAction({key:'Escape'},{query:true,control:true,searching:true}),'stop-search');assert.equal(readerKeyAction({key:'Escape'},{control:true,searching:true}),null);
 assert.equal(readerKeyAction({key:'Escape'},{optionsOpen:true}),'close-options');assert.equal(readerKeyAction({key:'f',ctrlKey:true},{editable:true}),null);
});

test('Escape closes Tools and view from its summary and buttons without stealing unrelated controls',async()=>{
 const {readerKeyAction}=await keyboard;for(const control of [true,false])assert.equal(readerKeyAction({key:'Escape'},{control,optionsOpen:true,menu:true}),'close-options');
 assert.equal(readerKeyAction({key:'Escape'},{control:true,optionsOpen:true,menu:false}),null);assert.equal(readerKeyAction({key:'Escape',defaultPrevented:true},{control:true,optionsOpen:true,menu:true}),null);
});

test('preview search Escape stops work first, then closes only that panel',async()=>{
 const {readerKeyAction}=await keyboard;const context={control:true,query:true,previewSearchOpen:true,searchPanel:true};assert.equal(readerKeyAction({key:'Escape'},context),'close-search');assert.equal(readerKeyAction({key:'Escape'},{...context,searching:true}),'stop-search');assert.equal(readerKeyAction({key:'Escape'},{...context,previewSearchOpen:false}),null);assert.equal(readerKeyAction({key:'Escape'},{...context,searchPanel:false}),null);assert.equal(readerKeyAction({key:'Escape',defaultPrevented:true},context),null);
});
