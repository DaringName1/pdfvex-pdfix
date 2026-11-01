const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises');
test('preserving page inspection refuses encryption with plain guidance and unchanged input',async()=>{
 const bytes=await fs.readFile('tests/fixtures/password.pdf'),original=Buffer.from(bytes);
 await assert.rejects(require('../desktop/pdf-page-order-codec.cjs').inspectPageOrder(bytes),error=>/password-protected.*authorized unprotected copy/.test(error.message)&&!error.message.includes('ignoreEncryption'));
 assert.deepEqual(bytes,original);
});
