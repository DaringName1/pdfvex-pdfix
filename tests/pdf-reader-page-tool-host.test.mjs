import {test} from 'node:test';import assert from 'node:assert/strict';import {ReaderPageToolHost} from '../src/pdf-reader-page-tool-host.js';
function fixture(){
 const children=[],listeners=new Set(),root=new EventTarget();let focused=0;
 const node=()=>({tagName:'SECTION',classList:{add(){}},attributes:new Map(),querySelector(){return null;},toggleAttribute(k,on){if(on)this.attributes.set(k,'');else this.attributes.delete(k);},style:{},setAttribute(k,v){this.attributes.set(k,v);},contains(){return false;},remove(){const i=children.indexOf(this);if(i>=0)children.splice(i,1);}});
 const panel=node(),overlay=node(),reader={root,paper:{isConnected:true,dataset:{ready:'true'},append(n){children.push(n);}},canvas:{pixels:'Original page artwork'},currentPage:{pageNumber:2},currentViewport:{scale:1.2},pageNumber:2,zoom:1.2,hasToolStrip:true,subscribeInteractionMode(fn){listeners.add(fn);fn('build');return()=>listeners.delete(fn);}};
 root.querySelector=selector=>selector==='.pdf-body'?{append:n=>children.push(n)}:{focus(){focused++;}};
 return {reader,panel,overlay,children,listeners,get focused(){return focused;},mode(value){reader.interactionMode=value;for(const fn of listeners)fn(value);}};
}
test('borrowing and closing a page tool retains source artwork, page and zoom',()=>{
 const f=fixture(),before={...f.reader.canvas};let renders=0;const prior=()=>renders++;f.reader.onRendered=prior;
 const host=new ReaderPageToolHost(f.reader,{panel:f.panel,overlay:f.overlay,label:'Table options',onRendered:details=>assert.equal(details.page.pageNumber,2)});
 host.refresh();assert.equal(renders,1);f.mode('view');assert.equal(f.panel.hidden,true);assert.equal(f.overlay.style.pointerEvents,'none');f.mode('build');assert.equal(f.panel.hidden,false);
 host.dispose();host.dispose();assert.deepEqual(f.reader.canvas,before);assert.equal(f.reader.pageNumber,2);assert.equal(f.reader.zoom,1.2);assert.equal(f.reader.onRendered,prior);assert.equal(f.reader.pageToolHost,null);assert.equal(f.listeners.size,0);assert.deepEqual(f.children,[]);assert.equal(f.focused,1);
});
test('closing does not overwrite a newer rendering listener',()=>{
 const f=fixture(),host=new ReaderPageToolHost(f.reader,{panel:f.panel,overlay:f.overlay,label:'Table options'}),newer=()=>{};f.reader.onRendered=newer;host.dispose();assert.equal(f.reader.onRendered,newer);
});
test('switching page tools suspends the old host, and popups remain refused',()=>{
 const f=fixture(),host=new ReaderPageToolHost(f.reader,{panel:f.panel,overlay:f.overlay,label:'Table options'}),secondPanel={...f.panel,attributes:new Map()};
 const second=new ReaderPageToolHost(f.reader,{panel:secondPanel,label:'Second tool'});assert.equal(host.active,false);assert.equal(f.panel.hidden,true);assert.equal(f.overlay.hidden,true);assert.equal(f.reader.pageToolHost,second);assert.deepEqual(f.reader.canvas,{pixels:'Original page artwork'});second.dispose();host.activate();assert.equal(host.active,true);assert.equal(f.panel.hidden,false);assert.equal(f.reader.pageToolHost,host);host.dispose();assert.deepEqual(f.children,[]);
 assert.throws(()=>new ReaderPageToolHost(f.reader,{panel:{...f.panel,tagName:'DIALOG'},label:'Popup'}),/beside the open PDF/);assert.deepEqual(f.children,[]);
});
