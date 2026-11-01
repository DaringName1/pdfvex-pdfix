'use strict';
// Protect, three choices (owner, October 21): a password to open only, limits only, or both. Each copy is really
// encrypted (AES-256), opens as described, and can be unprotected again only by the right password. A PDF with two
// passwords and nothing limited still needs its owner password (tests/passwords.test.cjs and passwords.spec.js).
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{randomUUID}=require('node:crypto');
const {PasswordEngine,settings}=require('../desktop/password-engine.cjs'),{fixture}=require('./helpers/compression-fixture.cjs'),{PDFDocument}=require('pdf-lib');
const OPEN='Open-example-741',LIMITS='Owner-example-962',all={allowPrint:true,allowCopy:true,allowChanges:true},none={allowPrint:false,allowCopy:false,allowChanges:false};
async function setup(t){const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-password-choices-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const engine=new PasswordEngine(path.join(root,'jobs'),path.resolve('dist/native/qpdf'));await engine.init();return {engine,source:await fixture(true)};}
const protect=(engine,source,value)=>engine.process('file',randomUUID(),source,{mode:'protect',currentPassword:'',...value});
const remove=(engine,bytes,password)=>engine.process('file',randomUUID(),bytes,{mode:'remove',currentPassword:password});
const opensWithoutPassword=async bytes=>PDFDocument.load(bytes).then(()=>true,()=>false);

test('password to open only: needs the password to open, limits nothing, and that password removes the protection',async t=>{
 const {engine,source}=await setup(t),result=await protect(engine,source,{openPassword:OPEN,ownerPassword:'',...all});
 assert.deepEqual(result.permissions,{print:true,copy:true,changes:true});assert.equal(await opensWithoutPassword(result.bytes),false,'it must not open without the password');
 const clear=await remove(engine,result.bytes,OPEN);assert.equal(await opensWithoutPassword(clear.bytes),true);
 await assert.rejects(remove(engine,result.bytes,'Wrong-password-741'),e=>['OWNER','PASSWORD'].includes(e.code));
});
test('limits only: anyone can open it, the limits are set, and only the limits password removes them',async t=>{
 const {engine,source}=await setup(t),result=await protect(engine,source,{openPassword:'',ownerPassword:LIMITS,allowPrint:true,allowCopy:false,allowChanges:false});
 assert.deepEqual(result.permissions,{print:true,copy:false,changes:false});
 const doc=await PDFDocument.load(result.bytes,{ignoreEncryption:true});assert.ok(doc.isEncrypted,'the copy carries real encryption for its limits');
 await assert.rejects(remove(engine,result.bytes,''),e=>['OWNER','PASSWORD'].includes(e.code),'opening it does not give the right to remove limits');
 const clear=await remove(engine,result.bytes,LIMITS);assert.equal(await opensWithoutPassword(clear.bytes),true);
});
test('both: the opening password alone cannot remove limits; the limits password can',async t=>{
 const {engine,source}=await setup(t),result=await protect(engine,source,{openPassword:OPEN,ownerPassword:LIMITS,...none});
 assert.equal(await opensWithoutPassword(result.bytes),false);await assert.rejects(remove(engine,result.bytes,OPEN),e=>['OWNER','PASSWORD'].includes(e.code));
 assert.equal(await opensWithoutPassword((await remove(engine,result.bytes,LIMITS)).bytes),true);
});
test('combinations that would protect nothing, or leave limits without their own password, are refused in plain words',()=>{
 const base={mode:'protect',currentPassword:''};
 assert.throws(()=>settings({...base,openPassword:'',ownerPassword:'',...all}),/a password to open the PDF, a password for its limits, or both/);
 assert.throws(()=>settings({...base,openPassword:'',ownerPassword:LIMITS,...all}),/at least one thing to limit/);
 assert.throws(()=>settings({...base,openPassword:OPEN,ownerPassword:'',...none}),/Limits need their own password/);
 assert.throws(()=>settings({...base,openPassword:OPEN,ownerPassword:OPEN,...none}),/different/);
 assert.equal(settings({...base,openPassword:OPEN,ownerPassword:'',...all}).ownerPassword,OPEN,'with a password to open only, that password is also the owner password');
});
