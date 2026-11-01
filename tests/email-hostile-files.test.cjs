'use strict';
// V1 audit, area 5: hostile saved emails (.eml) must be refused or bounded within seconds, never hang or swell.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {readEmailMessage}=require('../desktop/email-message-codec.cjs');
const eml=text=>new Uint8Array(Buffer.from(text.replace(/\n/g,'\r\n')));
const bounded=(label,input)=>{const started=Date.now();let result,error;try{result=readEmailMessage(input);}catch(e){error=e;}const ms=Date.now()-started;assert.ok(ms<5000,`${label} took ${ms} ms`);
 if(result)assert.ok(JSON.stringify(result).length<12*1024*1024,`${label} produced an unbounded report`);return {result,error};};
test('a plain message still converts (the cases below differ only in the hostile part)',()=>{
 const {result}=bounded('plain',eml('From: a@example.test\nSubject: Site visit\nContent-Type: text/plain; charset=utf-8\n\nMeeting at 10:00.\n'));assert.ok(result);
});
test('deeply nested multiparts, thousands of parts and huge header lines are refused or bounded',()=>{
 let body='Content-Type: text/plain\n\nInner text\n';for(let i=0;i<500;i++)body=`Content-Type: multipart/mixed; boundary="b${i}"\n\n--b${i}\n${body}\n--b${i}--\n`;
 bounded('500 nested multiparts',eml('From: a@example.test\nSubject: Nest\n'+body));
 const parts=Array.from({length:20000},(_,i)=>`--x\nContent-Type: text/plain\n\npart ${i}\n`).join('');bounded('20,000 parts',eml('From: a@example.test\nSubject: Many\nContent-Type: multipart/mixed; boundary="x"\n\n'+parts+'--x--\n'));
 bounded('9 MB header line',eml('From: a@example.test\nSubject: '+'A'.repeat(9*1024*1024)+'\nContent-Type: text/plain\n\nBody\n'));
});
test('an attachment that swells when decoded, and oversized messages, are refused or bounded',()=>{
 const b64=Buffer.alloc(7*1024*1024,65).toString('base64').match(/.{1,76}/g).join('\n');
 bounded('7 MB base64 attachment',eml('From: a@example.test\nSubject: Big\nContent-Type: multipart/mixed; boundary="y"\n\n--y\nContent-Type: text/plain\n\nSee attached\n--y\nContent-Type: application/octet-stream\nContent-Transfer-Encoding: base64\n\n'+b64+'\n--y--\n'));
 const {error}=bounded('11 MB message',new Uint8Array(11*1024*1024));assert.ok(error,'a message over the 10 MB limit is refused');
});
