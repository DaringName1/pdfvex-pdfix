const path=require('node:path');
const PAPER_IDS=new Set(require('./paper-sizes.json').map(size=>size.id));
const LIMIT=100*1024*1024;
const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const keys=(v,allowed)=>object(v)&&Object.keys(v).every(k=>allowed.includes(k));
const number=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
function validPageRecipe(draft){
  const fail=()=>{throw new Error('The saved page arrangement is invalid.');};
  if(!keys(draft,['kind','version','sources','plan','split'])||draft.kind!=='pages'||draft.version!==1||!Array.isArray(draft.sources)||!draft.sources.length||draft.sources.length>10||!Array.isArray(draft.plan)||draft.plan.length>500)fail();
  let total=0;
  for(const source of draft.sources){
    if(!keys(source,['path','name','fingerprint','size'])||typeof source.path!=='string'||source.path.length>32767||source.path.includes('\0')||!path.isAbsolute(source.path)||path.extname(source.path).toLowerCase()!=='.pdf'||typeof source.name!=='string'||source.name.length>32767||typeof source.fingerprint!=='string'||!/^[a-f0-9]{64}$/.test(source.fingerprint)||!Number.isInteger(source.size)||!number(source.size,1,LIMIT))fail();
    total+=source.size;
  }
  if(total>LIMIT)fail();
  for(const row of draft.plan){
    if(!keys(row,['source','index','turn','crop','resize'])||!Number.isInteger(row.source)||!number(row.source,0,draft.sources.length-1)||!Number.isInteger(row.index)||!number(row.index,0,499)||![0,90,180,270].includes(row.turn))fail();
    if(row.crop!==undefined&&row.crop!==null&&(!keys(row.crop,['top','right','bottom','left'])||!['top','right','bottom','left'].every(k=>number(row.crop[k],0,5000))))fail();
    if(row.resize!==undefined&&row.resize!==null){const r=row.resize;if(!keys(r,['paper','orientation','margin','width','height'])||r.paper!=='custom'&&!PAPER_IDS.has(r.paper)||!['portrait','landscape'].includes(r.orientation)||!number(r.margin,0,50)||r.width!==undefined&&!number(r.width,10,2000)||r.height!==undefined&&!number(r.height,10,2000)||r.paper==='custom'&&(!number(r.width,10,2000)||!number(r.height,10,2000)))fail();}
  }
  if(draft.split!==undefined&&draft.split!==null){const s=draft.split;if(!keys(s,['mode','every','ranges','folder','maxMiB'])||!['every','ranges','size'].includes(s.mode)||typeof s.every!=='string'||s.every.length>24||typeof s.ranges!=='string'||s.ranges.length>4000||typeof s.folder!=='string'||s.folder.length>80||s.maxMiB!==undefined&&!number(s.maxMiB,0.25,100)||s.mode==='size'&&!number(s.maxMiB,0.25,100))fail();}
  return draft;
}
module.exports={validPageRecipe};
