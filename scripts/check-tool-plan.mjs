// Fails if a tool name in the app is missing from docs/TOOL-PLAN.md, so the plan never leaves a tool out
// (owner, October 28, 2026: "go to every tool ... do not leave a tool out"). Run: node scripts/check-tool-plan.mjs
import fs from 'node:fs';
const read=file=>fs.readFileSync(file,'utf8');
const plan=read('docs/TOOL-PLAN.md').toLowerCase(),names=new Set();
for(const m of read('src/tool-registry.js').matchAll(/tool\('[^']+','([^']+)'/g))names.add(m[1]);
for(const file of ['reader-editing-ribbons','reader-output-ribbons','reader-pages-ribbon','reader-view-ribbon','reader-quick-tools','reader-home-ribbon'])
 for(const group of read(`src/${file}.js`).matchAll(/\['[^']+',\[([^\]]*)\]\]/g))for(const name of group[1].matchAll(/'([^']+)'/g))names.add(name[1]);
const markup=read('src/markup-workspace.js').match(/groups:\[(.*?)\]\]\]/);if(markup)for(const name of markup[1].matchAll(/'([^']+)'/g))names.add(name[1]);
for(const m of read('src/app.js').matchAll(/(?:pdfAction|action)\('([A-Z][^']+)'/g))names.add(m[1]);
const missing=[...names].filter(name=>!plan.includes(name.toLowerCase()));
console.log(`${names.size} tool names checked; ${missing.length} missing from docs/TOOL-PLAN.md.`);
if(missing.length){console.log(missing.join('\n'));process.exit(1);}
