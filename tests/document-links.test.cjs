const {test}=require('node:test');const assert=require('node:assert/strict');const JSZip=require('jszip');const mammoth=require('mammoth');
const {validDocumentLink,documentLinkFromInput}=require('../desktop/document-link-model.cjs');
const {validRichContent}=require('../desktop/rich-document-validation.cjs');
const linked=(text,href,extra=[])=>({type:'text',text,marks:[...extra,{type:'documentLink',attrs:{href}}]});
const doc={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'See the '},linked('manual','https://example.com/guide?x=1#top',[{type:'bold'}]),{type:'text',text:' or write to '},linked('sales','mailto:sales@example.com'),{type:'text',text:'.'}]}]};
test('only web and email targets are document links',()=>{
  assert.equal(validDocumentLink('https://example.com/guide?x=1#top'),'https://example.com/guide?x=1#top');assert.equal(validDocumentLink('HTTP://Example.com'),'http://example.com/');assert.equal(validDocumentLink('mailto:sales@example.com'),'mailto:sales@example.com');
  for(const bad of ['javascript:alert(1)','JaVaScRiPt:alert(1)','file:///C:/Windows/win.ini','data:text/html,x','vbscript:x','ms-settings:privacy','\\\\server\\share','https://user:pw@example.com/','https://','https://exa mple.com','https://example.com/"x','mailto:','mailto:nobody','mailto:a@b.com,c@d.com','https://example.com/'+'a'.repeat(2000),'',null,7,{}])assert.throws(()=>validDocumentLink(bad),/web address/,String(bad).slice(0,40));
});
test('typed addresses get a safe scheme or are refused',()=>{
  assert.equal(documentLinkFromInput(' example.com/guide '),'https://example.com/guide');assert.equal(documentLinkFromInput('sales@example.com'),'mailto:sales@example.com');assert.equal(documentLinkFromInput('http://example.com'),'http://example.com/');
  for(const bad of ['javascript:alert(1)','not a link','localhost','file:///etc/passwd','','   '])assert.throws(()=>documentLinkFromInput(bad),/web address/,bad);
});
test('the contained document validator accepts normalized links only',()=>{
  validRichContent(structuredClone(doc));
  for(const attrs of [{href:'javascript:alert(1)'},{href:'HTTP://Example.com'},{href:'https://example.com/',title:'x'},{},undefined]){const bad=structuredClone(doc);bad.content[0].content[1].marks[1]={type:'documentLink',...(attrs===undefined?{}:{attrs})};assert.throws(()=>validRichContent(bad),/Unsupported document link/,JSON.stringify(attrs));}
});
test('DOCX and RTF copies carry link targets and reject unsafe ones',async()=>{
  const {exportDocx}=await import('../src/document-codec.js'),{exportRtf,importRtf}=await import('../src/rtf-codec.js');
  const bytes=await exportDocx(doc),zip=await JSZip.loadAsync(bytes),rels=await zip.file('word/_rels/document.xml.rels').async('string'),html=(await mammoth.convertToHtml({buffer:Buffer.from(bytes)})).value;
  assert.equal((rels.match(/TargetMode="External"/g)??[]).length,2);assert.match(html,/<a href="https:\/\/example\.com\/guide\?x=1#top"><strong>manual<\/strong><\/a>/);assert.match(html,/<a href="mailto:sales@example\.com">sales<\/a>/);
  const rtf=exportRtf(doc),text=Buffer.from(rtf).toString('latin1');assert.ok(text.includes('HYPERLINK "https://example.com/guide?x=1#top"'));assert.ok(text.includes('HYPERLINK "mailto:sales@example.com"'));
  const back=importRtf(rtf),plain=JSON.stringify(back.doc);assert.ok(plain.includes('manual')&&plain.includes('sales'),'link text survives RTF reopen');assert.ok(!plain.includes('HYPERLINK'),'field instructions never become body text');
  const unsafe=structuredClone(doc);unsafe.content[0].content[1].marks[1].attrs.href='javascript:alert(1)';await assert.rejects(exportDocx(unsafe),/web address/);assert.throws(()=>exportRtf(unsafe),/web address/);
});
