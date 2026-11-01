const {test}=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {readEmailMessage}=require('../desktop/email-message-codec.cjs'),{validEmailMessageReport}=require('../desktop/email-message-validation.cjs');
const message=text=>Buffer.from(text.replaceAll('\n','\r\n'));
test('EML decoding preserves UTF-8 headers/body and the exact source hash',()=>{
 const bytes=message('From: sender@example.com\nSubject: =?UTF-8?B?Y2Fmw6k=?=\nContent-Type: text/plain; charset=utf-8\nContent-Transfer-Encoding: base64\n\n'+Buffer.from('Hello 界\nnext').toString('base64')),original=bytes.slice(),report=readEmailMessage(bytes);
 validEmailMessageReport(report,createHash('sha256').update(bytes).digest('hex'));assert.equal(report.title,'café');assert.equal(report.body.content,'Hello 界\nnext');assert.deepEqual(bytes,original);
});
test('EML multipart keeps plain alternative and explicitly inventories omitted attachments',()=>{
 const bytes=message('Subject: Mixed\nContent-Type: multipart/mixed; boundary=outer\n\n--outer\nContent-Type: multipart/alternative; boundary=inner\n\n--inner\nContent-Type: text/html\n\n<p>HTML</p>\n--inner\nContent-Type: text/plain\n\nPlain body\n--inner--\n--outer\nContent-Type: application/octet-stream\nContent-Disposition: attachment; filename="sample.bin"\nContent-Transfer-Encoding: base64\n\nAQID\n--outer--'),report=readEmailMessage(bytes);
 validEmailMessageReport(report);assert.match(report.body.content,/Plain body/);assert.doesNotMatch(report.body.content,/HTML/);assert.equal(report.attachments[0].name,'sample.bin');assert.equal(report.attachments[0].size,3);assert.equal(report.attachments[0].omitted,true);
});
test('EML HTML removes active content, attributes and remote URLs before its report leaves the codec',()=>{
 const report=readEmailMessage(message('Content-Type: text/html; charset=utf-8\n\n<p onclick="bad()">Safe</p><script>secret()</script><img src="https://example.com/pixel"><a href="javascript:bad()">link</a><iframe src="https://example.com">remote</iframe>'));
 validEmailMessageReport(report);assert.match(report.body.content,/<p>Safe<\/p>/);assert.match(report.body.content,/Image omitted/);assert.doesNotMatch(report.body.content,/secret|onclick|https:|javascript:|iframe|script|src=/);
});
test('EML refuses malformed transfer data, duplicate content headers and unclosed multipart',()=>{
 assert.throws(()=>readEmailMessage(message('Content-Transfer-Encoding: base64\n\n%%%')),/base64/);
 assert.throws(()=>readEmailMessage(message('Content-Type: text/plain\nContent-Type: text/html\n\nbody')),/duplicate/);
 assert.throws(()=>readEmailMessage(message('Content-Type: multipart/mixed; boundary=x\n\n--x\nContent-Type: text/plain\n\nbody')),/truncated/);
});
