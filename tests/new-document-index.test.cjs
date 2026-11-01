const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {FileStore}=require('../desktop/file-store.cjs');
// V1 audit, area 4: the list of unsaved new documents is kept on disk by the main process, so a draft is still offered
// after PDFix is ended suddenly (the window's own list in browser storage may never reach the disk).
const draft=text=>({kind:'rich',content:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text}]}]},layout:require('../desktop/document-layout-validation.cjs').defaultDocumentLayout()});
test('drafts of new documents are listed by a fresh start; cleared and discarded ones are not',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pdfix-new-index-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const dir=path.join(root,'metadata');
 const a='new:11111111-2222-4333-8444-555555555555',b='new:66666666-7777-4888-9999-aaaaaaaaaaaa',c='new:12345678-1234-4123-8123-123456789abc';
 let store=new FileStore(dir);await store.init();await store.saveDraft(a,draft('kept'));await store.saveDraft(b,draft('cleared'));await store.saveDraft(c,draft('discarded'));
 await store.clearDraft(b);await store.discardNewDocument(c);
 store=new FileStore(dir);await store.init();const listed=await store.listNewDocuments();
 assert.deepEqual(listed.map(entry=>entry.key),[a]);assert.match(JSON.stringify(await store.loadDraft(a)),/kept/);
 assert.deepEqual((await fs.readdir(dir)).filter(name=>name.endsWith('.tmp')),[],'no temporary index file is left');
 await fs.writeFile(path.join(dir,'new-documents.json'),'{not json');assert.deepEqual(await store.listNewDocuments(),[],'a damaged list is ignored, not fatal');
});
