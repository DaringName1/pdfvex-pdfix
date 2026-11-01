'use strict';
const {createHash}=require('node:crypto');
const {validSecuritySource}=require('./pdf-security-validation.cjs');
const {geometry}=require('./pdf-page-order-validation.cjs');
const MAX_BYTES=100*1024*1024,HASH=/^[a-f0-9]{64}$/,TOKEN=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=message=>{throw new Error(message||'Repair evidence failed its source, shape or preservation checks.');};
function exact(v,keys){if(!v||Object.getPrototypeOf(v)!==Object.prototype||Object.keys(v).sort().join(',')!==[...keys].sort().join(','))fail();}
function token(v){if(typeof v!=='string'||!TOKEN.test(v))fail('Invalid repair operation token.');return v;}
function inventory(v,sha256,bytes){
 exact(v,['version','sha256','bytes','pageCount','pages','reachableSha256','orphanSha256','streamSha256','objectCount','scope','inventorySha256']);
 if(v.version!==1||v.sha256!==sha256||v.bytes!==bytes||!HASH.test(sha256)||!Number.isInteger(bytes)||bytes<1||bytes>MAX_BYTES||!Number.isInteger(v.pageCount)||v.pageCount<1||v.pageCount>500||!Array.isArray(v.pages)||v.pages.length!==v.pageCount||!Number.isInteger(v.objectCount)||v.objectCount<1||v.objectCount>100000)fail();
 for(const p of v.pages)geometry(p);for(const k of ['reachableSha256','orphanSha256','streamSha256','inventorySha256'])if(!HASH.test(v[k]))fail();
 if(v.scope!==SCOPE)fail();const {inventorySha256,...body}=v;if(hash(JSON.stringify(body))!==inventorySha256||Buffer.byteLength(JSON.stringify(v))>1024*1024)fail();return v;
}
const SCOPE='Available baseline: independently parsed current document graph, disconnected non-structural objects, encoded stream payloads, page count and geometry. Cross-reference/object-stream containers, stream Length, trailer ID, original byte revisions, missing bytes and visual/semantic correctness are not proved. Encrypted, signed, certified, permission-controlled, XFA, invalid-object or unresolved-reference sources are refused.';
function selection(v){exact(v,['inspectionSha256','acknowledgeUnverifiable']);if(!HASH.test(v.inspectionSha256)||v.acknowledgeUnverifiable!==true)fail('Review and acknowledge the available baseline and unverified differences before rebuilding.');return {...v};}
function preserved(a,b){return a.pageCount===b.pageCount&&JSON.stringify(a.pages)===JSON.stringify(b.pages)&&a.reachableSha256===b.reachableSha256&&a.orphanSha256===b.orphanSha256&&a.streamSha256===b.streamSha256;}
module.exports={MAX_BYTES,SCOPE,hash,token,inventory,selection,preserved,validSource:validSecuritySource};
