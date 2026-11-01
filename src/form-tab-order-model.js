// Inert, source-bound custom widget orders. No document-origin code is evaluated.
export function validateFormTabOrders(value=[],info=null){
 const fail=message=>{throw new Error(message||'The reviewed keyboard order is invalid.');};
 if(!Array.isArray(value)||value.length>500)fail();const pages=new Set();let widgets=0;
 return value.map(item=>{
  if(!item||Object.getPrototypeOf(item)!==Object.prototype||Object.keys(item).some(key=>!['page','widgets','sourceSha256','reviewed'].includes(key))||!Number.isInteger(item.page)||item.page<0||item.page>499||pages.has(item.page)||item.reviewed!==true||typeof item.sourceSha256!=='string'||!/^[a-f0-9]{64}$/.test(item.sourceSha256)||!Array.isArray(item.widgets)||item.widgets.length<2||item.widgets.length>2000||new Set(item.widgets).size!==item.widgets.length||item.widgets.some(id=>typeof id!=='string'||!/^pdfix-widget-[1-9][0-9]{0,9}-[0-9]{1,5}$/.test(id)))fail();
  pages.add(item.page);widgets+=item.widgets.length;if(widgets>2000)fail();
  if(info){const source=info.tabOrderPages?.find(page=>page.page===item.page);if(item.sourceSha256!==info.sourceSha256||!source?.supported||source.widgets.length!==item.widgets.length||source.widgets.some(widget=>!item.widgets.includes(widget.id)))fail('Keyboard order no longer matches the exact supported source page. Reinspect and review it again.');}
  return {page:item.page,widgets:[...item.widgets],sourceSha256:item.sourceSha256,reviewed:true};
 });
}
