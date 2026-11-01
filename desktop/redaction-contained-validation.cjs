const {createHash}=require('node:crypto');
const {validSecuritySource,MAX_BYTES}=require('./pdf-security-validation.cjs');
const {validRedactionDraft}=require('./redaction-validation.cjs');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=()=>{throw new Error('The contained redaction receipt failed its exact source, geometry or mask-plan contract.');};
const exact=(value,keys)=>value&&Object.getPrototypeOf(value)===Object.prototype&&Object.keys(value).sort().join(',')===[...keys].sort().join(',');
const sha=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const digest=value=>hash(Buffer.from(JSON.stringify(canonical(value))));
function validToken(token){if(typeof token!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token))fail();return token;}
function validSource(id,source){return validSecuritySource(id,source);}
function validBytes(bytes){if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>MAX_BYTES||!Buffer.from(bytes.buffer,bytes.byteOffset,Math.min(bytes.length,1024)).includes(Buffer.from('%PDF-')))fail();return Uint8Array.from(bytes);}
function validInspection(value,sourceSha256,sourceBytes){
 if(!exact(value,['version','sourceSha256','sourceBytes','pages','hasForm'])||value.version!==1||!sha(value.sourceSha256)||value.sourceSha256!==sourceSha256||!Number.isInteger(value.sourceBytes)||value.sourceBytes!==sourceBytes||sourceBytes<1||sourceBytes>MAX_BYTES||typeof value.hasForm!=='boolean'||!Array.isArray(value.pages)||!value.pages.length||value.pages.length>100||Buffer.byteLength(JSON.stringify(value))>64*1024)fail();
 for(const page of value.pages){if(!exact(page,['box','rotation','userUnit','width','height'])||!Array.isArray(page.box)||page.box.length!==4||page.box.some(v=>typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>1e7)||page.box[2]<=page.box[0]||page.box[3]<=page.box[1]||![0,90,180,270].includes(page.rotation)||typeof page.userUnit!=='number'||!Number.isFinite(page.userUnit)||page.userUnit<=0||page.userUnit>75000)fail();const w=(page.box[2]-page.box[0])*page.userUnit,h=(page.box[3]-page.box[1])*page.userUnit;if(page.width!==(page.rotation%180?h:w)||page.height!==(page.rotation%180?w:h)||!Number.isFinite(w)||!Number.isFinite(h))fail();}
 return value;
}
function validPlan(value,pages){
 if(!exact(value,['kind','version','settings','marks'])||!exact(value.settings,['dpi','cleanupOnly']))fail();validRedactionDraft(value);
 if(!value.marks.length&&!value.settings.cleanupOnly)fail();let pixels=0;
 const layout=pages.map(page=>{const width=Math.ceil(page.width*value.settings.dpi/72),height=Math.ceil(page.height*value.settings.dpi/72);if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>8192||height>8192||width*height>16000000||(pixels+=width*height)>100000000)fail();return {width,height,pageWidth:page.width,pageHeight:page.height};});
 for(const mark of value.marks){if(!exact(mark,['id','page','rect'])||!pages[mark.page])fail();const b=pages[mark.page].box,r=mark.rect;if(r[0]<b[0]-.001||r[1]<b[1]-.001||r[2]>b[2]+.001||r[3]>b[3]+.001)fail();}
 return {draft:structuredClone(value),layout,draftSha256:digest(value)};
}
function validVerificationOptions(options){if(!exact(options,['inspection','draft']))fail();validInspection(options.inspection,options.inspection?.sourceSha256,options.inspection?.sourceBytes);validPlan(options.draft,options.inspection.pages);return options;}
function validResult(result,inspection,draft,candidateSha256,candidateBytes){
 if(!exact(result,['version','verified','sourceSha256','sourceBytes','inspectionSha256','draftSha256','sha256','outputBytes','pageCount','layout','regions','cleanupOnly'])||result.version!==1||result.verified!==true||result.sourceSha256!==inspection.sourceSha256||result.sourceBytes!==inspection.sourceBytes||result.inspectionSha256!==digest(inspection)||result.draftSha256!==digest(draft)||!sha(candidateSha256)||result.sha256!==candidateSha256||result.outputBytes!==candidateBytes||!Number.isInteger(candidateBytes)||candidateBytes<1||candidateBytes>MAX_BYTES||result.pageCount!==inspection.pages.length||result.regions!==draft.marks.length||result.cleanupOnly!==draft.settings.cleanupOnly||!Array.isArray(result.layout)||result.layout.length!==inspection.pages.length||Buffer.byteLength(JSON.stringify(result))>64*1024)fail();
 const {layout}=validPlan(draft,inspection.pages);for(let i=0;i<layout.length;i++)if(!exact(result.layout[i],['width','height','pageWidth','pageHeight'])||Object.keys(layout[i]).some(key=>result.layout[i][key]!==layout[i][key]))fail();return result;
}
module.exports={hash,digest,MAX_BYTES,validToken,validSource,validBytes,validInspection,validPlan,validVerificationOptions,validResult};
