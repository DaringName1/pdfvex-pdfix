const {test}=require('node:test');
const assert=require('node:assert/strict');
const pageReader=import('../src/pdf-search-page.js');
const deferred=()=>{let resolve,reject;const promise=new Promise((ok,no)=>{resolve=ok;reject=no;});return {promise,resolve,reject};};

test('a search canceled before dispatch never asks the PDF worker for a page',async()=>{
  const {searchPageContent}=await pageReader,controller=new AbortController();controller.abort();
  let called=false;await assert.rejects(searchPageContent({getPage(){called=true;}},1,{signal:controller.signal}),{code:'CANCELED'});assert.equal(called,false);
});

test('Stop settles while page loading is pending and never dispatches late text extraction',async()=>{
  const {searchPageContent}=await pageReader,controller=new AbortController(),page=deferred();let textCalls=0;
  const pending=searchPageContent({getPage:()=>page.promise},2,{signal:controller.signal});
  await Promise.resolve();controller.abort();await assert.rejects(pending,{code:'CANCELED'});
  page.resolve({getTextContent(){textCalls++;return {items:[]};}});await new Promise(resolve=>setImmediate(resolve));assert.equal(textCalls,0);
});

test('a hung text request reaches its deadline and a late worker failure is consumed',async()=>{
  const {searchPageContent}=await pageReader,text=deferred();
  const pending=searchPageContent({getPage:async()=>({getTextContent:()=>text.promise})},3,{timeoutMs:15});
  await assert.rejects(pending,error=>error.code==='PDF_SEARCH_TIMEOUT'&&/page 3/.test(error.message));
  text.reject(new Error('Late worker failure'));await new Promise(resolve=>setImmediate(resolve));
});

test('successful text reading releases abort listeners and propagates source errors',async()=>{
  const {searchPageContent}=await pageReader,controller=new AbortController(),content={items:[{str:'Readable'}]};let listeners=0;
  const add=controller.signal.addEventListener.bind(controller.signal),remove=controller.signal.removeEventListener.bind(controller.signal);
  controller.signal.addEventListener=(...args)=>{listeners++;return add(...args);};controller.signal.removeEventListener=(...args)=>{listeners--;return remove(...args);};
  assert.equal(await searchPageContent({getPage:async()=>({getTextContent:async()=>content})},1,{signal:controller.signal}),content);assert.equal(listeners,0);
  await assert.rejects(searchPageContent({getPage:async()=>{throw new Error('Unreadable page');}},1),/Unreadable page/);
  await assert.rejects(searchPageContent({},1,{timeoutMs:Infinity}),/limits/);
});
