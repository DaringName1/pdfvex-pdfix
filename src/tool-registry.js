// One name per tool, used everywhere a tool is offered: Home, All tools (Workspaces), the reader's tool bar and
// Find a tool. The owner approved the layout on October 19 (docs/UI-WALKTHROUGH-2026-10-18.md, section 9): once a
// file is open its tools sit in eight groups, always in this order. "Create" is for starting work without an open
// PDF (new documents, converting, scanning, office files, folders) and appears on Home and in All tools only.
//
// Contract for other modules (Codex's reader tool bar included):
//   TOOL_GROUPS          the eight file groups in order, then Create
//   TOOLS                {id, name, group, aliases}; `name` is the caption to show, `aliases` are older names that
//                        search must still find (and that older tests may use)
//   toolByName(text)     the entry whose name or alias is `text`
//   groupOf(text)        the group id for a tool name or alias ('create' when unknown)
//   toolMatches(tool,q)  true when the search text q (already lower-cased) matches the name, an alias, a search
//                        word or the group
//   searchWords(tool)    everyday words people type for this tool ("split", "password", "pdf to word"); search only,
//                        never used to rename a button
export const TOOL_GROUPS=Object.freeze([
 {id:'view',name:'View'},{id:'comment',name:'Comment'},{id:'edit',name:'Edit'},{id:'fill-sign',name:'Fill & Sign'},
 {id:'pages',name:'Pages'},{id:'protect',name:'Protect'},{id:'measure',name:'Measure'},{id:'export',name:'Export'},
 {id:'create',name:'Create'}
].map(Object.freeze));
const tool=(id,name,group,aliases=[])=>Object.freeze({id,name,group,aliases:Object.freeze(aliases)});
export const TOOLS=Object.freeze([
 tool('read','Read a PDF','view'),
 tool('markup','Mark up a PDF','comment',['Mark up a drawing']),
 tool('review-comments','Review drawing comments','comment',['Review comments']),
 tool('edit-content','Edit PDF text and images','edit',['Edit PDF text & images','Add text and images']),
 tool('ocr','Make a scan searchable','edit',['Make scan searchable']),
 tool('edit-copy','PDF to Word','edit'),
 tool('fill-sign','Fill and sign','fill-sign'),
 tool('create-fields','Create fillable fields','fill-sign'),
 tool('signing-request','Prepare signing request','fill-sign'),
 tool('native-combine','Combine PDFs','pages',['Merge PDFs','Join PDFs']),
 tool('organize','Organize pages','pages',['Fix or combine pages']),
 tool('page-numbers','Page numbers and stamps','pages',['Page numbers, Bates and stamps']),
 tool('bates','Bates numbering across PDFs','pages'),
 tool('outline','Edit the PDF outline','pages',['Edit document outline']),
 tool('page-boxes','Edit PDF page boxes','pages'),
 tool('protect','Protect or unlock a PDF','protect'),
 tool('redact','Redact a PDF','protect',['Hide private information','Redact private information']),
 tool('health','Document health report','protect'),
 tool('fingerprint','Verify PDF fingerprint','protect'),
 tool('takeoffs','Drawing takeoffs','measure',['Measure drawing']),
 tool('compare','Compare drawing revisions','measure',['Compare with another PDF']),
 tool('sheet-sets','Drawing sheet sets','measure'),
 tool('pdf-to-images','PDF to images','export',['Export pages as images']),
 tool('compress','Compress a PDF','export',['Make a file smaller','Compress PDF']),
 tool('compress-batch','Compress several PDFs','export'),
 tool('extract-table','Extract a table','export'),
 tool('unchanged-copy','Name and save unchanged copy','export'),
 tool('batch-copy','Batch copy, rename or export text','export'),
 tool('print-marks','Print-production marks','export'),
 tool('thin-lines','Inspect and repair thin lines','measure'),
 tool('new-document','New document','create'),
 tool('open-document','Open a document','create'),
 tool('image-to-pdf','Image to PDF','create'),
 tool('scan','Scan to PDF','create'),
 tool('email','Create from email or clipboard','create'),
 tool('workbook','Edit a workbook','create'),
 tool('slides','Edit slide text','create'),
 tool('search-files','Search selected files','create'),
 tool('synchronized','Open a synchronized file','create'),
 tool('watched-folders','Watched-folder workflows','create'),
 tool('virtual-printer','Virtual PDF printer','create'),
 tool('right-click','Windows right-click PDF tools','create')
]);
const SEARCH_WORDS=Object.freeze({"markup":["annotate","add comments","highlight text","sticky note"],"edit-content":["edit text","edit pdf","change text","fix a typo","edit images","replace picture"],"ocr":["ocr","recognize text","recognise text","scanned pdf","scan to text"],"edit-copy":["pdf to word","export to word","convert to word","docx"],"fill-sign":["fill a form","fill in","sign a pdf","signature","initials"],"create-fields":["make a form","form fields","text field","checkbox"],"signing-request":["send for signature","request signatures"],"organize":["split","split a pdf","extract pages","delete pages","remove pages","rotate pages","reorder pages","move pages","insert pages"],"page-numbers":["header","footer","headers and footers","watermark","stamp","add page numbers","bates numbering","date stamp"],"protect":["password","add a password","remove password","unlock","encrypt","restrict printing"],"redact":["black out","blackout","remove private information","censor"],"pdf-to-images":["pdf to jpg","pdf to png","save pages as pictures","pictures","jpg","png"],"compress":["reduce file size","shrink","smaller","email size"],"extract-table":["pdf to excel","table to excel","export table","csv","spreadsheet"],"compare":["compare pdfs","compare two pdfs","differences","what changed"],"image-to-pdf":["pictures to pdf","jpg to pdf","png to pdf","photo to pdf"],"scan":["scanner","scan a document"],"new-document":["blank document","write a document","word document"],"search-files":["search pdfs","find in files"]});
export const searchWords=entry=>SEARCH_WORDS[entry?.id]??[];
const byText=new Map();for(const entry of TOOLS)for(const text of [entry.name,...entry.aliases])byText.set(text.toLocaleLowerCase(),entry);
export const toolByName=text=>byText.get(String(text).trim().toLocaleLowerCase())??null;
export const groupOf=text=>toolByName(text)?.group??'create';
export const toolMatches=(entry,query)=>!query||[entry.name,...entry.aliases,...searchWords(entry),TOOL_GROUPS.find(g=>g.id===entry.group)?.name??''].some(text=>text.toLocaleLowerCase().includes(query));
