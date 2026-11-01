'use strict';
function validatePagedNavigation(value,pageCount){
 const fail=()=>{throw new Error('Invalid bounded PDF navigation metadata.');};
 const exact=(v,keys)=>v&&Object.getPrototypeOf(v)===Object.prototype&&Object.keys(v).sort().join(',')===keys.sort().join(',');
 if(!exact(value,Object.hasOwn(value??{},'labels')?['version','outline','truncated','labels']:['version','outline','truncated'])||value.version!==1||typeof value.truncated!=='boolean'||!Array.isArray(value.outline))fail();
 let count=0;
 const visit=(rows,depth)=>{if(depth>21||!Array.isArray(rows))fail();return rows.map(row=>{if(++count>1000||!exact(row,['title','dest','items'])||typeof row.title!=='string'||row.title.length>4096)fail();const d=row.dest;if(d!==null){const n={XYZ:3,Fit:0,FitB:0,FitH:1,FitBH:1,FitV:1,FitBV:1,FitR:4}[d?.[1]];if(!Array.isArray(d)||!Number.isInteger(d[0])||d[0]<0||d[0]>=pageCount||n===undefined||d.length!==n+2||d.slice(2).some(v=>v!==null&&(typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>1e8))||d[1]==='FitR'&&d.slice(2).some(v=>v===null)||d[1]==='XYZ'&&d[4]!==null&&(d[4]<0||d[4]>64))fail();}return {title:row.title,dest:d,items:visit(row.items,depth+1)};});};
 const labels=value.labels??null;if(labels!==null&&(!Array.isArray(labels)||labels.length!==pageCount||labels.length>25000||labels.some(label=>typeof label!=='string'||label.length>512)||labels.reduce((n,label)=>n+Buffer.byteLength(label,'utf8'),0)>1048576))fail();
 return {labels,version:1,outline:visit(value.outline,0),truncated:value.truncated};
}
function validatePagedPageLinks(value,pageCount,page){
 const fail=()=>{throw new Error('Invalid bounded original-page link metadata.');};
 if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join(',')!=='links,page,truncated,version'||value.version!==1||value.page!==page||typeof value.truncated!=='boolean'||!Array.isArray(value.links)||value.links.length>1000)fail();
 const ids=new Set();const links=value.links.map(link=>{
  if(!link||Object.getPrototypeOf(link)!==Object.prototype||Object.keys(link).sort().join(',')!=='annotationFlags,dest,id,rect,subtype'||link.subtype!=='Link'||typeof link.id!=='string'||!/^native-page-\d+-link-\d+$/.test(link.id)||ids.has(link.id)||!Number.isInteger(link.annotationFlags)||link.annotationFlags<0||link.annotationFlags>2147483647||(link.annotationFlags&(1|2|32))||!Array.isArray(link.rect)||link.rect.length!==4||link.rect.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>1e8)||link.rect[2]<=link.rect[0]||link.rect[3]<=link.rect[1]||link.dest===null)fail();
  ids.add(link.id);validatePagedNavigation({version:1,truncated:false,outline:[{title:'',dest:link.dest,items:[]}]},pageCount);return {...link,rect:[...link.rect],dest:[...link.dest]};
 });return {version:1,page,links,truncated:value.truncated};
}
module.exports={validatePagedNavigation,validatePagedPageLinks};
