'use strict';
// PDF structure inventory and comparison for the V1 audit (area 3, data integrity). It lists what a PDF carries beside
// its page artwork (pages, comments, form fields and their calculations, bookmarks, attached files, signatures,
// accessibility tags, document details and scripts) and reports every difference between two files, so a save test
// can say which differences it expects and fail on any other. Read-only: it never changes either file.
const {PDFDocument,PDFName,PDFDict,PDFArray,PDFString,PDFHexString,PDFRef,PDFStream,PDFNumber,PDFBool}=require('pdf-lib');
const k=name=>PDFName.of(name);
function text(value){if(value instanceof PDFString||value instanceof PDFHexString)return value.decodeText();if(value instanceof PDFName)return value.decodeText();if(value instanceof PDFNumber)return value.asNumber();if(value instanceof PDFBool)return value.asBoolean();return value===undefined?undefined:String(value);}
function lookup(doc,value){return value instanceof PDFRef?doc.context.lookup(value):value;}
function dict(doc,value){const v=lookup(doc,value);return v instanceof PDFDict?v:null;}
function array(doc,value){const v=lookup(doc,value);return v instanceof PDFArray?v.asArray().map(item=>lookup(doc,item)):[];}
function rect(doc,value){return array(doc,value).map(n=>Math.round((n instanceof PDFNumber?n.asNumber():0)*100)/100);}
function streamBytes(value){try{return value instanceof PDFStream?value.getContents().length:null;}catch{return null;}}

async function pdfStructure(bytes){
 const doc=await PDFDocument.load(bytes,{ignoreEncryption:true,updateMetadata:false,throwOnInvalidObject:false}),catalog=doc.catalog,out={};
 // Hostile files: every walk below visits a dictionary at most once, stops at depth 64, and all walks share a
 // budget of 200,000 steps; going over it throws instead of looping or exhausting memory.
 let budget=200000;const seen=new Set(),enter=(d,depth)=>{if(--budget<0)throw new Error('PDF structure exceeds the inventory limit.');if(depth>64||!d||seen.has(d))return false;seen.add(d);return true;};
 out.pages=doc.getPages().map(page=>({size:[Math.round(page.getWidth()*100)/100,Math.round(page.getHeight()*100)/100],rotation:page.getRotation().angle}));
 out.annotations=doc.getPages().flatMap((page,index)=>array(doc,page.node.get(k('Annots'))).filter(a=>a instanceof PDFDict).map(a=>({page:index+1,type:text(a.get(k('Subtype'))),rect:rect(doc,a.get(k('Rect'))),contents:text(lookup(doc,a.get(k('Contents')))),name:text(lookup(doc,a.get(k('NM')))),field:text(lookup(doc,a.get(k('T'))))})));
 const acro=dict(doc,catalog.get(k('AcroForm')));
 const fields=[];const walk=(node,prefix,depth=0)=>{const d=dict(doc,node);if(!enter(d,depth))return;const part=text(lookup(doc,d.get(k('T')))),name=part===undefined?prefix:prefix?prefix+'.'+part:part;const kids=array(doc,d.get(k('Kids'))).filter(x=>x instanceof PDFDict&&x.get(k('T'))!==undefined);
  if(kids.length)for(const kid of kids)walk(kid,name,depth+1);else fields.push({name,type:text(d.get(k('FT'))),value:text(lookup(doc,d.get(k('V')))),calculation:!!dict(doc,dict(doc,d.get(k('AA')))?.get(k('C'))),signed:text(d.get(k('FT')))==='Sig'&&d.get(k('V'))!==undefined});};
 for(const field of array(doc,acro?.get(k('Fields'))))walk(field,'');
 out.fields=fields;out.calculationOrder=array(doc,acro?.get(k('CO'))).length;out.signatures=fields.filter(f=>f.signed).map(f=>f.name);
 const outline=[];const visit=(item,depth)=>{for(let d=dict(doc,item);d&&enter(d,depth);d=dict(doc,d.get(k('Next')))){outline.push({depth,title:text(lookup(doc,d.get(k('Title'))))});visit(d.get(k('First')),depth+1);}};
 visit(dict(doc,catalog.get(k('Outlines')))?.get(k('First')),0);out.outline=outline;
 const files=[];const names=dict(doc,dict(doc,catalog.get(k('Names')))?.get(k('EmbeddedFiles')));const leaf=(node,depth=0)=>{const d=dict(doc,node);if(!enter(d,depth))return;const list=array(doc,d.get(k('Names')));for(let i=0;i+1<list.length;i+=2){const spec=dict(doc,list[i+1]),ef=dict(doc,spec?.get(k('EF')));files.push({name:text(list[i]),bytes:streamBytes(lookup(doc,ef?.get(k('F'))))});}for(const kid of array(doc,d.get(k('Kids'))))leaf(kid,depth+1);};
 leaf(names);out.attachments=files;
 const tree=dict(doc,catalog.get(k('StructTreeRoot')));let tags=0;const count=(node,depth)=>{for(const kid of array(doc,lookup(doc,node) instanceof PDFDict?lookup(doc,node).get(k('K')):node)){if(kid instanceof PDFDict&&enter(kid,depth)){tags++;count(kid,depth+1);}}};
 if(tree)count(tree,0);out.tags={present:!!tree,elements:tags,marked:!!dict(doc,catalog.get(k('MarkInfo')))};
 const info=dict(doc,doc.context.trailerInfo.Info);out.info={};if(info)for(const [key,value] of info.entries())out.info[key.decodeText()]=text(lookup(doc,value));
 out.xmp=streamBytes(lookup(doc,catalog.get(k('Metadata'))));
 out.scripts={openAction:catalog.get(k('OpenAction'))!==undefined,documentJavaScript:!!dict(doc,dict(doc,catalog.get(k('Names')))?.get(k('JavaScript')))};
 out.encrypted=doc.isEncrypted;return out;
}
// Differences between two inventories, as readable lines ("fields: 'Total' calculation true -> false").
function structureDiff(a,b,prefix=''){
 const lines=[];const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 for(const key of new Set([...Object.keys(a??{}),...Object.keys(b??{})])){const x=a?.[key],y=b?.[key],where=prefix?prefix+'.'+key:key;
  if(same(x,y))continue;
  if(Array.isArray(x)&&Array.isArray(y)){if(x.length!==y.length)lines.push(`${where}: ${x.length} -> ${y.length} items`);for(let i=0;i<Math.min(x.length,y.length);i++)if(!same(x[i],y[i]))lines.push(`${where}[${i}]: ${JSON.stringify(x[i])} -> ${JSON.stringify(y[i])}`);}
  else if(x&&y&&typeof x==='object'&&typeof y==='object')lines.push(...structureDiff(x,y,where));
  else lines.push(`${where}: ${JSON.stringify(x)} -> ${JSON.stringify(y)}`);}
 return lines;
}
// Compares two files; `expected` lists patterns for the differences the save was meant to make (for example
// /^annotations/ for added comments, /^info\.ModDate/). Returns {unexpected, expected, before, after}.
async function compareStructure(beforeBytes,afterBytes,expected=[]){
 const before=await pdfStructure(beforeBytes),after=await pdfStructure(afterBytes),all=structureDiff(before,after);
 const isExpected=line=>expected.some(pattern=>pattern.test(line));
 return {unexpected:all.filter(line=>!isExpected(line)),expected:all.filter(isExpected),before,after};
}
module.exports={pdfStructure,structureDiff,compareStructure};
