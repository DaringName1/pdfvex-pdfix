'use strict';
const {MAX_BYTES,hash,validSecuritySource}=require('./pdf-security-validation.cjs');
const RULES_VERSION='2026.10.1';
const RULE_IDS=Object.freeze(['AA-SOURCE','AA-TITLE','AA-LANGUAGE','AA-TREE','AA-ROLEMAP','AA-HEADING','AA-FIGURE','AA-TABLE','AA-LINK','AA-FORM','AA-ORDER','AA-HUMAN']);
const CATEGORIES=Object.freeze(['fail','review','unsupported','observed']);
const MAPPING='Standards mapping unverified. This rule is source-specific guidance, not a PDF/UA, WCAG or Section 508 conformance result.';
const HUMAN_CHECKS=Object.freeze([
 {id:'meaning',description:'Review whether tags, heading hierarchy, figure descriptions, link purpose, field labels and table headers convey the actual visible meaning.'},
 {id:'order',description:'Compare logical tag order, text extraction and keyboard focus order with the intended sequence, including columns, sidebars, footnotes and repeated content.'},
 {id:'coverage',description:'Inspect every page for meaningful content missing from tags, text alternatives, scanned text/OCR errors, artifacts, contrast and information conveyed only by color.'},
 {id:'assistive-technology',description:'Use the intended PDF viewer with screen-reader and keyboard-only workflows; verify navigation, link activation, forms, table reading and announced content.'},
 {id:'standards',description:'A qualified reviewer must identify the applicable standards and versions, map requirements, and assess all automated and manual requirements before any conformance claim.'},
]);
const fail=message=>{throw new Error(message||'The PDF accessibility audit report failed source/shape validation.');};
function shape(v,keys){if(!v||Object.getPrototypeOf(v)!==Object.prototype||Object.keys(v).sort().join(',')!==[...keys].sort().join(','))fail();}
function text(v,max=4000){if(typeof v!=='string'||v.length>max||!v.isWellFormed()||/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/.test(v))fail();return v;}
function digest(v){if(typeof v!=='string'||!/^[a-f0-9]{64}$/.test(v))fail();return v;}
function ref(v){if(typeof v!=='string'||!/^\d{1,10} \d{1,5} R$/.test(v))fail();return v;}
function integer(v,max){if(!Number.isInteger(v)||v<0||v>max)fail();return v;}
function list(v,max){if(!Array.isArray(v)||v.length>max)fail();return v;}
function reportBody(r){const {reportSha256,...body}=r;return body;}
function validReportBudget(report){
 const pending=[{value:report,depth:0}],ancestors=new WeakSet();let nodes=0;
 while(pending.length){const {value,depth,leaving}=pending.pop();if(leaving){ancestors.delete(value);continue;}if(++nodes>295000||depth>100)fail('The accessibility audit exceeds its contained report node/depth budget. Narrow or repair the source before retrying.');if(value&&typeof value==='object'){if(ancestors.has(value))fail('The accessibility audit report has a cyclic object.');ancestors.add(value);pending.push({value,depth,leaving:true});for(const child of Object.values(value))pending.push({value:child,depth:depth+1});}}
 return report;
}
function validAuditToken(token){if(typeof token!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token))fail('Invalid accessibility audit operation token.');return token;}
function validAuditReport(r,{sourceSha256,sourceBytes}){
 validReportBudget(r);
 shape(r,['version','rulesVersion','sourceSha256','sourceBytes','reportSha256','pageCount','pages','structureInspected','findings','counts','requiredHumanChecks','scope','limits']);
 if(r.version!==1||r.rulesVersion!==RULES_VERSION||r.sourceSha256!==digest(sourceSha256)||r.sourceBytes!==sourceBytes||!Number.isInteger(sourceBytes)||sourceBytes<1||sourceBytes>MAX_BYTES||typeof r.structureInspected!=='boolean')fail();
 integer(r.pageCount,500);digest(r.reportSha256);text(r.scope,10000);const pages=list(r.pages,500);if(pages.length!==r.pageCount||new Set(pages.map(ref)).size!==pages.length)fail();
 shape(r.counts,CATEGORIES);for(const count of Object.values(r.counts))integer(count,15000);
 const actual=Object.fromEntries(CATEGORIES.map(c=>[c,0])),ids=new Set();
 for(const f of list(r.findings,15000)){
  shape(f,['id','ruleId','category','title','detail','guidance','page','pageRef','nodeId','evidence','standards']);
  if(f.id!=='finding-'+(ids.size+1)||ids.has(f.id)||!RULE_IDS.includes(f.ruleId)||!CATEGORIES.includes(f.category)||f.standards!==MAPPING)fail();ids.add(f.id);actual[f.category]++;
  text(f.title,200);text(f.detail);text(f.guidance);integer(f.page,r.pageCount);if(f.pageRef!==(f.page?pages[f.page-1]:null))fail();if(f.nodeId!==null)ref(f.nodeId);
  const evidence=list(f.evidence,8);if(!evidence.length)fail();for(const e of evidence){shape(e,['objectRef','path','value','objectSha256']);if(e.objectRef!==null)ref(e.objectRef);text(e.path,500);if(!e.path)fail();text(e.value,2000);digest(e.objectSha256);}
 }
 if(CATEGORIES.some(c=>actual[c]!==r.counts[c]))fail();list(r.limits,30).forEach(v=>text(v));
 if(JSON.stringify(r.requiredHumanChecks)!==JSON.stringify(HUMAN_CHECKS)||!r.findings.some(f=>f.ruleId==='AA-HUMAN'&&f.category==='review')||!r.findings.some(f=>f.ruleId==='AA-ORDER'&&f.category==='review'))fail();
 if(r.reportSha256!==hash(JSON.stringify(reportBody(r)))||Buffer.byteLength(JSON.stringify(r))>12*1024*1024)fail();return r;
}
module.exports={MAX_BYTES,hash,RULES_VERSION,RULE_IDS,CATEGORIES,MAPPING,HUMAN_CHECKS,reportBody,validReportBudget,validAuditReport,validAuditToken,validAuditSource:validSecuritySource};
