const {test}=require('node:test'),assert=require('node:assert/strict');
const {PagedPdfService}=require('../desktop/paged-pdf-service.cjs');
const token='12345678-1234-4234-8234-123456789abc';
function pending(kind){const service=new PagedPdfService(),errors=[],values=[],session={protocol:{exited:false,stopping:false,stdoutBytes:0,buffer:'',pagesProcessed:0,waiter:{kind,token,page:1,resolve:v=>values.push(v),reject:()=>{}}}};service.stopSession=async(_,error)=>errors.push(error);return {service,session,errors,values};}
test('native response kinds and tokens cannot cross metadata/page requests',()=>{
 const metadata=pending('NAV');metadata.service.protocolData(metadata.session,Buffer.from(`PDFIX_PAGED:PAGE:${token}:1:123:1048576\n`));assert.equal(metadata.errors[0].code,'PIPE');assert.equal(metadata.values.length,0);
 const page=pending('PAGE');page.service.protocolData(page.session,Buffer.from(`PDFIX_PAGED:NAV:${token}:123:1048576\n`));assert.equal(page.errors[0].code,'PIPE');assert.equal(page.values.length,0);
 const other=pending('NAV');other.service.protocolData(other.session,Buffer.from('PDFIX_PAGED:NAV:aaaaaaaa-1234-4234-8234-123456789abc:123:1048576\n'));assert.equal(other.errors[0].code,'PIPE');
});
test('native metadata response rejects excess size and non-ASCII diagnostics',()=>{
 const big=pending('NAV');big.service.protocolData(big.session,Buffer.from(`PDFIX_PAGED:NAV:${token}:2097153:1048576\n`));assert.equal(big.errors[0].code,'LIMIT');
 const text=pending('NAV');text.service.protocolData(text.session,Buffer.from('PDFIX_PAGED:PRIVATE:é\n'));assert.equal(text.errors[0].code,'PIPE');assert.equal(text.values.length,0);
 const valid=pending('NAV');valid.service.protocolData(valid.session,Buffer.from(`PDFIX_PAGED:NAV:${token}:123:1048576\n`));assert.deepEqual(valid.values,[{outputBytes:123,memory:1048576}]);
});
