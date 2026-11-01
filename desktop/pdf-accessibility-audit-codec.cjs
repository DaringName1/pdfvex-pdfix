'use strict';
const {PDFDocument,PDFDict,PDFArray,PDFRef,PDFName,PDFString,PDFHexString,PDFRawStream,PDFInvalidObject,PDFBool}=require('pdf-lib');
const {inspect:inspectTags}=require('./pdf-tags-codec.cjs');
const {ROLES}=require('./pdf-tags-validation.cjs');
const V=require('./pdf-accessibility-audit-validation.cjs');
const key=PDFName.of;
const clean=(value,max=3900)=>String(value??'').replace(/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/g,' ').toWellFormed().slice(0,max).toWellFormed();
const fail=message=>{throw new Error(message);};
const SCOPE='Read-only, bounded source structural audit. Observed means a specific dictionary fact was found; fail means the described local structural expectation is absent or inconsistent. Review requires human judgment; unsupported identifies uninspected structures. None of these categories is a compliance pass. PDF/UA, WCAG and Section 508 conformance are not determined.';
async function inspect(bytes){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>V.MAX_BYTES)fail('Choose a PDF under 100 MiB.');
 const sourceSha256=V.hash(bytes),report={version:1,rulesVersion:V.RULES_VERSION,sourceSha256,sourceBytes:bytes.length,reportSha256:'',pageCount:0,pages:[],structureInspected:false,findings:[],counts:Object.fromEntries(V.CATEGORIES.map(c=>[c,0])),requiredHumanChecks:V.HUMAN_CHECKS.map(c=>({...c})),scope:SCOPE,limits:[]};
 const sourceEvidence={objectRef:null,path:'source PDF bytes',value:bytes.length+' bytes; SHA-256 '+sourceSha256,objectSha256:sourceSha256};
 function add(ruleId,category,title,detail,guidance,evidence=[sourceEvidence],page=0,nodeId=null){if(report.findings.length>=14990)fail('The source exceeds the 15,000 finding audit budget.');report.findings.push({id:'finding-'+(report.findings.length+1),ruleId,category,title:clean(title,200),detail:clean(detail),guidance:clean(guidance),page,pageRef:page?report.pages[page-1]:null,nodeId,evidence,standards:V.MAPPING});report.counts[category]++;}
 function finish(){
  add('AA-ORDER','review','Reading order requires page and assistive-technology review','K children were inspected in their stored sequence where supported. Stored structure order does not establish intended reading order, keyboard focus order or complete content coverage.','Compare tag order with each visible page, extracted text and screen-reader output; review columns, footnotes, tables, links and forms.');
  add('AA-HUMAN','review','Required human acceptance remains open',V.HUMAN_CHECKS.map(c=>c.description).join(' '),'Complete every required human check. Select applicable standards and versions before making a conformance claim.');
  V.validReportBudget(report);report.reportSha256=V.hash(JSON.stringify(V.reportBody(report)));return V.validAuditReport(report,{sourceSha256,sourceBytes:bytes.length});
 }
 let doc;
 try{doc=await PDFDocument.load(bytes,{updateMetadata:false,throwOnInvalidObject:true,capNumbers:false});if(doc.isEncrypted||doc.context.trailerInfo.Encrypt)fail('Encrypted source inspection is unsupported.');}
 catch(error){add('AA-SOURCE','unsupported','Source could not be structurally inspected',clean(error.message),'Use an authorized unencrypted, well-formed PDF source and rerun the audit.');report.limits.push('PDF parsing did not complete; metadata, pages, tags and annotations were not inspected.');return finish();}
 let objects,resolve,get,name,evidence,pages;
 try{
  pages=doc.getPages();if(!pages.length||pages.length>500)fail('The audit supports 1–500 physical pages.');report.pageCount=pages.length;report.pages=pages.map(p=>p.ref.toString());
  const entries=doc.context.enumerateIndirectObjects();if(entries.length>100000)fail('The audit supports at most 100,000 indirect objects.');objects=new Map(entries.map(([r,o])=>[r.toString(),o]));
  resolve=raw=>{if(!(raw instanceof PDFRef))return raw;const value=objects.get(raw.toString());if(!value)fail('An unresolved PDF object reference prevents complete structural inspection.');return value;};get=(dict,field)=>resolve(dict.get(key(field)));name=v=>v instanceof PDFName?v.decodeText():'';
  const seen=new WeakSet(),stack=entries.map(([,value])=>({value,depth:0}));let count=0;
  while(stack.length){let {value,depth}=stack.pop();if(++count>300000||depth>80||stack.length>100000)fail('The PDF exceeds the bounded object graph budget.');value=resolve(value);if(!value||typeof value!=='object'||seen.has(value))continue;seen.add(value);if(value instanceof PDFInvalidObject)fail('Malformed PDF objects are unsupported.');if(value instanceof PDFRawStream){stack.push({value:value.dict,depth:depth+1});continue;}if(value instanceof PDFDict){if(value.entries().length>20000)fail('A dictionary exceeds the entry budget.');for(const [,v]of value.entries())stack.push({value:v,depth:depth+1});}else if(value instanceof PDFArray){if(value.size()>100000)fail('An array exceeds the entry budget.');for(let i=0;i<value.size();i++)stack.push({value:value.get(i),depth:depth+1});}}
  evidence=(raw,path,value)=>{const object=resolve(raw);return {objectRef:raw instanceof PDFRef?raw.toString():null,path:clean(path,500),value:clean(value,1950),objectSha256:V.hash(object instanceof PDFRawStream?Buffer.concat([Buffer.from(object.dict.toString()),Buffer.from(object.contents)]):String(object??'absent'))};};
 }catch(error){add('AA-SOURCE','unsupported','Object graph is outside the supported audit',error.message,'Use a supported source or obtain a specialist structural inspection.');report.limits.push('Object graph inventory did not complete; subsequent checks were skipped.');return finish();}
 const string=v=>v instanceof PDFString||v instanceof PDFHexString?v.decodeText():null;
 const field=(dict,name)=>string(get(dict,name));
 const catalogRaw=doc.context.trailerInfo.Root,cat=doc.catalog,catEvidence=(path,value)=>evidence(catalogRaw,'Catalog/'+path,value);
 const infoRaw=doc.context.trailerInfo.Info,info=resolve(infoRaw),title=info instanceof PDFDict?field(info,'Title'):null;
 add('AA-TITLE',title?.trim()?'observed':'review',title?.trim()?'Information dictionary title found':'No nonblank Information dictionary title found',title?.trim()?'Info/Title: '+title:'Info/Title is absent, blank or not a text string. XMP title alternatives were not interpreted.','Review that the title identifies this document. Verify title announcement in the intended PDF viewer.',[info instanceof PDFDict?evidence(infoRaw,'Trailer/Info/Title',title??'absent or non-text'):sourceEvidence]);
 const preferences=get(cat,'ViewerPreferences'),display=preferences instanceof PDFDict?get(preferences,'DisplayDocTitle'):null;
 if(!(display instanceof PDFBool&&display.asBoolean()))add('AA-TITLE','review','Viewer title preference needs review','ViewerPreferences/DisplayDocTitle is not explicitly true. Viewer behavior has not been exercised.','Verify that the intended viewer presents the document title; edit the metadata/preference in an appropriate tool if needed.',[catEvidence('ViewerPreferences/DisplayDocTitle',display?.toString()??'absent')]);
 if(cat.has(key('Metadata'))){add('AA-TITLE','unsupported','XMP metadata was not interpreted','The catalog contains a Metadata reference; XMP title/language precedence and synchronization are outside this audit.','Inspect XMP and synchronize document metadata using a qualified metadata workflow.',[catEvidence('Metadata',cat.get(key('Metadata')).toString())]);report.limits.push('XMP metadata is retained and not parsed; Information dictionary title findings are not a full metadata assessment.');}
 const language=field(cat,'Lang'),languageSyntax=v=>typeof v==='string'&&/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(v);
 add('AA-LANGUAGE',languageSyntax(language)?'observed':'fail',languageSyntax(language)?'Catalog language tag found':'Catalog language is missing or has unsupported syntax','Catalog/Lang: '+(language??'absent or non-text')+'. Syntax inspection does not establish the correct spoken language or registry validity.','Set the correct primary language and review language changes on individual content tags.',[catEvidence('Lang',language??'absent or non-text')]);
 let tags=null;
 try{tags=await inspectTags(bytes);report.structureInspected=true;}
 catch(error){add('AA-TREE','unsupported','Complete structure relationships could not be inventoried',error.message,'Inspect or repair the structure tree and ParentTree using a specialist tool; then rerun this audit.',[catEvidence('StructTreeRoot',cat.get(key('StructTreeRoot'))?.toString()??'absent')]);report.limits.push('Existing tag-tree preservation inventory refused this source; tag-dependent checks were skipped.');}
 const ownerByObject=new Map(),byId=new Map(tags?.nodes.map(n=>[n.id,n])??[]);
 const rawRef=id=>PDFRef.of(...id.split(' ').slice(0,2).map(Number));
 const nodeEvidence=(n,path,value)=>evidence(rawRef(n.id),'StructElem/'+path,value);
 function nodePage(n){if(n.page)return n.page;const pending=[n],seen=new Set();while(pending.length){const item=pending.pop();if(seen.has(item.id))continue;seen.add(item.id);for(const c of item.children){if(c.page)return c.page;if(c.nodeId&&byId.has(c.nodeId))pending.push(byId.get(c.nodeId));}}return 0;}
 function ancestor(n,role){let depth=0;while(n&&depth++<=48){if(n.resolvedRole===role)return n;n=byId.get(n.parentId);}return null;}
 if(tags){
  add('AA-TREE',tags.exists?'observed':'fail',tags.exists?'Structure tree and ownership inventoried':'Structure tree absent',tags.exists?tags.nodes.length+' real structure elements; '+tags.parentTree.length+' ParentTree entries. K children and ParentTree ownership were cross-checked.':'Catalog/StructTreeRoot is absent. No existing semantic tag tree can be audited.','Review tag semantics and content coverage on every page; use the tag workspace for supported corrections or initial tagging.',[catEvidence('StructTreeRoot',cat.get(key('StructTreeRoot'))?.toString()??'absent')]);
  if(tags.reason)add('AA-TREE','unsupported','Tag remediation boundary',tags.reason,'Use the preservation workspace only for supported structures; obtain specialist review for this boundary.');
  for(const map of tags.roleMap)add('AA-ROLEMAP','observed','Source RoleMap entry',map.from+' maps to '+map.to+'. Mapping syntax and cycles were checked by the structure inventory.','Verify the resulting standard role expresses the intended content.',[evidence(cat.get(key('StructTreeRoot')),'StructTreeRoot/RoleMap/'+map.from,map.to)]);
  let previousHeading=0,previousHeadingNode=null,headings=0;
  for(const n of tags.nodes){
   const page=nodePage(n);for(const c of n.children)if(c.kind==='objr')ownerByObject.set(c.objectRef,n);
   if(!ROLES.includes(n.resolvedRole))add('AA-ROLEMAP','unsupported','Unresolved standard structure role',n.role+' resolves to '+n.resolvedRole+'. This workflow does not interpret its semantics.','Review custom roles, namespaces and PDF version-specific semantics.',[nodeEvidence(n,'S',n.role+' → '+n.resolvedRole)],page,n.id);
   const heading=/^H([1-6])$/.exec(n.resolvedRole);
   if(heading){headings++;const level=Number(heading[1]);add('AA-HEADING',level>previousHeading+1?'review':'observed',level>previousHeading+1?'Heading level sequence needs review':'Numbered heading tag found','Level '+level+' follows '+(previousHeading?'level '+previousHeading:'the start of the tag sequence')+'.','Compare heading levels with the actual document outline; skipped levels are a review prompt, not proof of failure.',[nodeEvidence(n,'S',n.resolvedRole),...(previousHeadingNode?[nodeEvidence(previousHeadingNode,'S',previousHeadingNode.resolvedRole)]:[])],page,n.id);previousHeading=level;previousHeadingNode=n;}
   else if(n.resolvedRole==='H'){headings++;add('AA-HEADING','review','Generic heading level requires review','This source uses H without a numbered H1–H6 level.','Review contextual hierarchy and the applicable PDF version/heading convention.',[nodeEvidence(n,'S','H')],page,n.id);}
   if(n.lang!==null&&!languageSyntax(n.lang))add('AA-LANGUAGE','fail','Tag language has unsupported syntax','StructElem/Lang: '+n.lang,'Set a syntactically valid tag that matches this content; verify the language with a human reviewer.',[nodeEvidence(n,'Lang',n.lang)],page,n.id);
   if(n.resolvedRole==='Figure')add('AA-FIGURE',n.alt?.trim()?'observed':n.actualText?.trim()?'review':'fail',n.alt?.trim()?'Figure alternative text found':'Figure alternative requires attention','Alt: '+(n.alt??'absent')+'; ActualText: '+(n.actualText??'absent')+'. Presence does not establish meaningful equivalence.','Review the figure in context. Supply an appropriate equivalent description or explicitly classify decorative content as an artifact in a supported workflow.',[nodeEvidence(n,'Alt',n.alt??'absent'),nodeEvidence(n,'ActualText',n.actualText??'absent')],page,n.id);
   if(['Link','Form'].includes(n.resolvedRole)&&!n.children.length)add(n.resolvedRole==='Link'?'AA-LINK':'AA-FORM','review','Empty '+n.resolvedRole+' tag','This tag has no K children.','Determine whether this is meaningful content, an incomplete tag or stale structure.',[nodeEvidence(n,'K','absent or empty')],page,n.id);
  }
  if(tags.exists&&!headings)add('AA-HEADING','review','No heading tags inventoried','No H or H1–H6 tags occur in the inspected structure. Some documents legitimately have no headings.','Compare the document with its intended outline and tag real headings.');
  let idTree=null,idTreeError='';
  try{
   const root=resolve(cat.get(key('StructTreeRoot'))),raw=root instanceof PDFDict?root.get(key('IDTree')):undefined;
   if(raw){idTree=new Map();const seen=new WeakSet();let count=0;
    const byteKey=raw=>{const value=resolve(raw);if(!(value instanceof PDFString||value instanceof PDFHexString)||value.asBytes().length>4096)fail('Unsupported IDTree byte key.');return Buffer.from(value.asBytes()).toString('hex');};
    const walk=(raw,depth)=>{const d=resolve(raw);if(!(d instanceof PDFDict)||seen.has(d)||depth>32||++count>20000)fail('Malformed or oversized IDTree.');seen.add(d);const ns=get(d,'Names'),ks=get(d,'Kids'),keys=[];if(ns!==undefined&&ks!==undefined)fail('IDTree mixes Names and Kids.');
     if(ns!==undefined){if(!(ns instanceof PDFArray)||ns.size()%2||ns.size()>40000)fail('Malformed IDTree Names.');let previous=null;for(let i=0;i<ns.size();i+=2){const id=byteKey(ns.get(i)),owner=ns.get(i+1);if(!(owner instanceof PDFRef)||idTree.size>=20000)fail('Unsupported IDTree entry.');if(idTree.has(id)||previous!==null&&id<=previous)fail('Duplicate or unordered IDTree identifier.');previous=id;idTree.set(id,owner.toString());keys.push(id);}}
     else if(ks instanceof PDFArray&&ks.size()&&ks.size()<=20000){let previous=null;for(let i=0;i<ks.size();i++){const range=walk(ks.get(i),depth+1);if(!range.length||previous!==null&&range[0]<=previous)fail('Overlapping IDTree child ranges.');previous=range.at(-1);keys.push(...range);}}else fail('Unsupported IDTree node.');
     const limits=get(d,'Limits');if(limits!==undefined&&(!(limits instanceof PDFArray)||limits.size()!==2||!keys.length||byteKey(limits.get(0))!==keys[0]||byteKey(limits.get(1))!==keys.at(-1)))fail('IDTree Limits do not match its entries.');return keys;};walk(raw,0);
   }
  }catch(error){idTree=null;idTreeError=error.message;}
  const identified=new Map(tags.nodes.filter(n=>n.elementId!==null).map(n=>[n.elementId,n]));
  for(const n of tags.nodes.filter(n=>['Table','TH','TD'].includes(n.resolvedRole))){
   const page=nodePage(n),table=ancestor(n,'Table');
   if(n.resolvedRole==='Table'){const headers=tags.nodes.filter(h=>h.resolvedRole==='TH'&&ancestor(h,'Table')?.id===n.id);add('AA-TABLE',headers.length?'observed':'review',headers.length?'Table header tags found':'Table has no TH header tags',headers.length+' TH tags belong to this table.','Review whether the table needs headers and whether every data cell is associated with the correct row/column headers.',[nodeEvidence(n,'K',n.children.map(c=>c.id).join('; '))],page,n.id);continue;}
   if(!table)add('AA-TABLE','fail','Table cell has no containing Table',n.resolvedRole+' is outside a Table ancestor.','Repair the semantic table hierarchy.',[nodeEvidence(n,'P',n.parentId)],page,n.id);
   if(!n.table.editable){add('AA-TABLE','unsupported','Table attributes require specialist interpretation','Class attributes, multiple attribute owners or revisioned attributes are outside the single Table-attribute dictionary inventory.','Resolve inherited and revisioned table attributes before accepting header associations.',[nodeEvidence(n,'A/C','Attributes are not fully interpreted')],page,n.id);continue;}
   const missing=n.table.headers.filter(id=>{const h=identified.get(id);return !h||h.resolvedRole!=='TH'||!table||ancestor(h,'Table')?.id!==table.id||idTree?.get(id)!==h.id;});
   if(missing.length)add('AA-TABLE',idTreeError?'unsupported':'fail','Explicit header association could not be verified','Headers IDs: '+missing.join(', ')+'. '+(idTreeError||'Each ID must resolve through IDTree to a TH in the same Table.'),'Repair IDs, IDTree membership and header references; review the intended association for each data cell.',[nodeEvidence(n,'A/Headers',n.table.headers.join(', '))],page,n.id);
   else if(n.table.headers.length)add('AA-TABLE','observed','Explicit table header references verified',n.table.headers.length+' Headers IDs resolve to TH elements in this Table through IDTree.','Verify the semantic associations and spans against the visible table.',[nodeEvidence(n,'A/Headers',n.table.headers.join(', '))],page,n.id);
   else if(n.resolvedRole==='TH'&&n.table.scope)add('AA-TABLE','observed','Header scope found','Scope: '+n.table.scope+'.','Verify that this header applies to the intended row, column or both.',[nodeEvidence(n,'A/Scope',n.table.scope)],page,n.id);
   else if(n.resolvedRole==='TH')add('AA-TABLE','review','Header association method needs review','This TH has no explicit Scope or own Headers association. Its ID may be referenced by other cells.','Review direct Headers references from data cells or supply a suitable header scope.',[nodeEvidence(n,'A/Scope','absent')],page,n.id);
   else add('AA-TABLE','review','Data cell uses implicit header associations','This TD has no explicit Headers IDs. Scope-based header association may be sufficient for a simple table.','Review applicable TH scope, position and cell spans; complex tables may need explicit ID associations.',[nodeEvidence(n,'A/Headers','absent')],page,n.id);
  }
 }
 let annotations=0;
 for(let page=1;page<=pages.length;page++){
  const p=pages[page-1],annots=get(p.node,'Annots');if(annots===undefined)continue;
  try{
   if(!(annots instanceof PDFArray)||annots.size()>10000||annotations+annots.size()>10000)fail('Annotation arrays exceed the 10,000 annotation budget or have unsupported shape.');annotations+=annots.size();
   for(let index=0;index<annots.size();index++){
    const raw=annots.get(index),a=resolve(raw);if(!(a instanceof PDFDict))fail('An annotation is not a dictionary.');const subtype=name(get(a,'Subtype'));if(!['Link','Widget'].includes(subtype))continue;
    const objectId=raw instanceof PDFRef?raw.toString():null,owner=objectId?ownerByObject.get(objectId):null,role=subtype==='Link'?'Link':'Form',semantic=ancestor(owner,role),rule=subtype==='Link'?'AA-LINK':'AA-FORM',path='Page '+page+'/Annots['+index+']';
    const annotationEvidence=[evidence(raw,path+'/Subtype',subtype)];
    if(tags?.exists&&!semantic)add(rule,'fail',subtype+' has no verified '+role+' structure owner','The annotation has no inventoried OBJR owner under a '+role+' tag.','Associate this annotation with its appropriate semantic tag; verify announcement and keyboard navigation.',annotationEvidence,page,owner?.id??null);
    if(subtype==='Link'){
     const contents=field(a,'Contents'),alt=semantic?.alt;
     add(rule,contents?.trim()||alt?.trim()?'observed':'review',contents?.trim()||alt?.trim()?'Explicit link label candidate found':'Link purpose requires text and semantic review','Contents: '+(contents??'absent')+'; owning Link Alt: '+(alt??'absent')+'. Visible tagged link text and the destination were not interpreted.','Review announced link purpose against visible text and destination; verify the link in the intended viewer.',[...annotationEvidence,evidence(raw,path+'/Contents',contents??'absent'),...(semantic?[nodeEvidence(semantic,'Alt',alt??'absent')]:[])],page,semantic?.id??null);
    }else{
     let fieldDict=a,fieldRaw=raw,tooltip=null,fieldName=null,fieldType='',depth=0;const seen=new WeakSet();
     while(fieldDict instanceof PDFDict){if(seen.has(fieldDict)||depth++>32)fail('Cyclic or oversized widget field parent chain.');seen.add(fieldDict);const ft=name(get(fieldDict,'FT'));if(!fieldType&&ft)fieldType=ft;const tu=field(fieldDict,'TU');if(tooltip===null&&tu!==null)tooltip={value:tu,e:evidence(fieldRaw,path+'/field-parent['+(depth-1)+']/TU',tu)};const t=field(fieldDict,'T');if(fieldName===null&&t!==null)fieldName=t;fieldRaw=fieldDict.get(key('Parent'));if(!fieldRaw)break;fieldDict=resolve(fieldRaw);if(!(fieldDict instanceof PDFDict))fail('Widget Parent is not a field dictionary.');}
     const alt=semantic?.alt,label=tooltip?.value?.trim()||alt?.trim();
     add(rule,label?'observed':'review',label?'Form alternate label candidate found':'Form accessible label needs review','Field type: '+(fieldType||'unknown')+'; T: '+(fieldName??'absent')+'; TU: '+(tooltip?.value??'absent')+'; owning Form Alt: '+(alt??'absent')+'. T alone is not treated as an accepted accessible label.','Review the field label, instructions, group context, required state, errors and announced value with keyboard and screen reader.',[...annotationEvidence,...(tooltip?[tooltip.e]:[evidence(raw,path+'/TU','absent in inspected parent chain')]),...(semantic?[nodeEvidence(semantic,'Alt',alt??'absent')]:[])],page,semantic?.id??null);
    }
   }
  }catch(error){add('AA-SOURCE','unsupported','Page annotations were not fully inspected',error.message,'Inspect this page’s links/forms with a specialist annotation and accessibility workflow.',[evidence(p.ref,'Page '+page+'/Annots',annots.size?.()+' entries')],page);report.limits.push(clean('Page '+page+': annotation inspection incomplete.'));if(report.limits.length>=25){report.limits.push('The annotation failure budget was reached; annotation checks on remaining pages were skipped.');break;}}
 }
 const acro=get(cat,'AcroForm');if(acro instanceof PDFDict){if(acro.has(key('XFA')))add('AA-FORM','unsupported','XFA form semantics are not inspected','An XFA entry occurs in AcroForm.','Use an XFA-aware accessibility review workflow.',[evidence(cat.get(key('AcroForm')),'Catalog/AcroForm/XFA','present')]);add('AA-FORM','review','Form behavior and non-page fields require review','Widget labels on physical pages were inspected. AcroForm field-tree coverage, hidden fields, radio-group semantics, focus order, validation and announcements were not exercised.','Review the complete form tree and actual interaction with the intended viewer.',[evidence(cat.get(key('AcroForm')),'Catalog/AcroForm','present')]);}
 report.limits.push('Content streams, visual text, artifacts and untagged-content coverage are not audited. Alternative/label presence requires human semantic review.');
 return finish();
}
module.exports={inspect,MAX_BYTES:V.MAX_BYTES};
