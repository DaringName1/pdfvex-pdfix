const {test}=require('node:test'),assert=require('node:assert/strict');
test('PDF Home renders physical text sizes and indents in PDF points before zoom',async()=>{
 const {pdfPointStyles}=await import('../src/pdf-home-editor-formatting.js');
 assert.equal(pdfPointStyles('font-size:18pt;margin-left:0.5in;text-indent:-.5in;line-height:1.5;color:#123456'),'font-size:18px;margin-left:36px;text-indent:-36px;line-height:1.5;color:#123456');
 assert.equal(pdfPointStyles('margin-top:6pt;margin-bottom:0pt'),'margin-top:6px;margin-bottom:0px');
});
