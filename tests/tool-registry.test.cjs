const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const registry=import('../src/tool-registry.js');
// Every tool offered on Home or in Workspaces is in the shared list, each name and older name points to exactly one tool,
// and the reader's eight groups keep the owner-approved order.
test('one shared name and group for every offered tool',async()=>{
 const {TOOL_GROUPS,TOOLS,toolByName,groupOf,toolMatches}=await registry;
 assert.deepEqual(TOOL_GROUPS.map(g=>g.name),['View','Comment','Edit','Fill & Sign','Pages','Protect','Measure','Export','Create']);
 const texts=TOOLS.flatMap(t=>[t.name,...t.aliases].map(x=>x.toLowerCase()));assert.equal(new Set(texts).size,texts.length,'a name or older name is used twice');
 assert.equal(new Set(TOOLS.map(t=>t.id)).size,TOOLS.length);for(const t of TOOLS)assert.ok(TOOL_GROUPS.some(g=>g.id===t.group),t.name);
 const app=fs.readFileSync('src/app.js','utf8'),hub=app.slice(app.indexOf('function renderWorkspaceHub'),app.indexOf('\n',app.indexOf('function renderWorkspaceHub')));
 const workspace=[...hub.matchAll(/\['[a-z]+','([^']+)','/g)].map(m=>m[1]);assert.ok(workspace.length>=35,'Workspaces cards found: '+workspace.length);
 const homeStart=app.indexOf('const tasks = ['),home=[...app.slice(homeStart,app.indexOf('];',homeStart)).matchAll(/\['[a-z]+','([^']+)','/g)].map(m=>m[1]);assert.ok(home.length>=6&&home.length<=9,"Home keeps six to nine starting jobs: "+home.length);
 for(const title of [...workspace,...home].filter(title=>title!=='All tools'))assert.ok(toolByName(title),'not in the shared list: '+title);
 assert.equal(toolByName('Hide private information').name,'Redact a PDF');assert.equal(groupOf('Fix or combine pages'),'pages');assert.equal(groupOf('unknown tool'),'create');
 assert.ok(toolMatches(toolByName('Redact a PDF'),'hide private'));assert.ok(toolMatches(toolByName('Redact a PDF'),'protect'));assert.ok(!toolMatches(toolByName('Redact a PDF'),'thumbnail'));
});
// Owner, Oct 29: tools are found by the everyday words people type, without renaming any button.
test('everyday words find the right tool and never rename a button',async()=>{
 const {TOOLS,toolByName,toolMatches}=await registry;
 const first=q=>TOOLS.find(t=>toolMatches(t,q))?.id;
 for(const [query,id] of [['split','organize'],['merge','organize'],['extract pages','organize'],['password','protect'],['pdf to word','edit-copy'],['pdf to jpg','pdf-to-images'],['pdf to excel','extract-table'],['watermark','page-numbers'],['header','page-numbers'],['bates','page-numbers'],['ocr','ocr'],['reduce file size','compress'],['black out','redact'],['jpg to pdf','image-to-pdf']])
  assert.ok(TOOLS.filter(t=>toolMatches(t,query)).some(t=>t.id===id),`"${query}" finds ${id} (first: ${first(query)})`);
 assert.equal(toolByName('password'),null,'search words never act as button names');assert.equal(toolByName('split'),null);
});
