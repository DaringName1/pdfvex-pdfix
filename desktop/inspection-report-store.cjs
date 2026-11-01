'use strict';
const {createHash,randomUUID}=require('node:crypto');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const families=new Set(['preflight','accessibilityAudit']);
// Main-only sealed inspection reports. Renderers supply only an opaque token.
class InspectionReportStore{
 constructor(){this.entries=new Map();this.generations=new Map();}
 begin(family){if(!families.has(family))throw new Error('Unknown inspection report family.');this.clear(family);const generation=randomUUID();this.generations.set(family,generation);return generation;}
 retain(family,generation,sourceId,source,report){
  if(this.generations.get(family)!==generation)throw new Error('Inspection report canceled. Inspect the source again.');
  if(source?.ext!=='pdf'||report?.sourceSha256!==source.fingerprint||!Number.isSafeInteger(report.sourceBytes)||report.sourceBytes<1||report.sourceBytes>100*1024*1024)throw new Error('The inspection report does not match its source.');
  const bytes=Buffer.from(JSON.stringify({format:'PDFix inspection evidence',version:1,family,createdAt:new Date().toISOString(),verification:'Source inspection only. Human, runtime, security and standards acceptance remain pending.',report},null,2)+'\n');
  if(bytes.length>24*1024*1024){bytes.fill(0);throw new Error('The formatted inspection report exceeds its 24 MiB export budget.');}
  const token=randomUUID();this.entries.set(family,{generation,sourceId,source,token,bytes,sha256:hash(bytes)});return token;
 }
 output(family,sourceId,source,token){
  const entry=this.entries.get(family);
  if(!entry||entry.sourceId!==sourceId||entry.source!==source||entry.token!==token||this.generations.get(family)!==entry.generation)throw new Error('Inspect and review this exact source again before exporting its report.');
  if(hash(entry.bytes)!==entry.sha256)throw new Error('The sealed inspection report changed. Inspect again.');
  return {bytes:Buffer.from(entry.bytes),sha256:entry.sha256};
 }
 clear(family,sourceId,token){const entry=this.entries.get(family);if(sourceId!==undefined&&entry&&(entry.sourceId!==sourceId||token&&entry.token!==token))return false;entry?.bytes.fill(0);this.entries.delete(family);this.generations.delete(family);return true;}
 dispose(){for(const family of families)this.clear(family);}
}
module.exports={InspectionReportStore};
