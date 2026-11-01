export {headerHistoryActions} from './actions-codex-header-history.mjs';
export {documentLayoutActions} from './actions-codex-document-layout.mjs';
export {savedCopyActions} from './actions-codex-saved-copy.mjs';
export {homeFileActions} from './actions-codex-home-files.mjs';
export {quickActions} from './actions-codex-quick.mjs';
import {makeViewRibbonActions} from './actions-codex-view-ribbon.mjs';
import {makeWindowLayoutActions} from './actions-codex-window-layout.mjs';
import {makeEditingRibbonActions} from './actions-codex-editing-ribbon.mjs';
import {makeOutputRibbonActions} from './actions-codex-output-ribbon.mjs';
import {makePagesRibbonActions} from './actions-codex-pages-ribbon.mjs';
import {makeRibbonActions} from './actions-codex-ribbon.mjs';
import {chooseDocumentMode} from './document-mode.mjs';
import {makeRedactActions} from './actions-codex-redact.mjs';
import {makeTableActions} from './actions-codex-table.mjs';
import {makeTextActions} from './actions-codex-text.mjs';
import {makeModeActions} from './actions-codex-mode.mjs';
import {makeBatchActions} from './actions-codex-batch.mjs';
import {makeHomeActions} from './actions-codex-home.mjs';
import {makeExtraActions} from './actions-codex-extra.mjs';
import {makeRemainingActions} from './actions-codex-remaining.mjs';
import {makeNativeActions} from './actions-codex-native.mjs';
import {TOOL_GROUPS,toolByName} from '../../src/tool-registry.js';
// UI actions use only visible text, accessible names and roles. File pickers are
// supplied by the runner; verification reads saved files independently.
import fs from 'node:fs/promises';
import path from 'node:path';
import {PDFDocument,PDFName,PDFString} from 'pdf-lib';
import {expect} from '@playwright/test';
import {inspectPdf,hash} from './verify.mjs';

// Runner contract: ctx.files (temporary output directory), goHome(),
// chooseFile(path), saveAs(path). No app internals are needed by this module.
async function setup(ctx){
 if(ctx.codexFixtures)return ctx.codexFixtures;
 if(!path.isAbsolute(ctx.files)||!['goHome','chooseFile','saveAs'].every(k=>typeof ctx[k]==='function'))throw Error('Codex actions require temporary ctx.files, goHome, chooseFile and saveAs.');
 await fs.mkdir(ctx.files,{recursive:true});
 const source=path.join(ctx.files,'codex-source.pdf'),extra=path.join(ctx.files,'codex-additional.pdf');
 const pdf=await PDFDocument.create();for(let i=1;i<=3;i++)pdf.addPage([400,600]).drawText(`Robot reader needle ${i}`,{x:40,y:520,size:16});
 const c=pdf.context,outline=c.register(c.obj({Type:'Outlines'})),entry=c.register(c.obj({Title:PDFString.of('Robot last page'),Parent:outline,Dest:[pdf.getPage(2).ref,'Fit']}));
 c.lookup(outline).set(PDFName.of('First'),entry);c.lookup(outline).set(PDFName.of('Last'),entry);pdf.catalog.set(PDFName.of('Outlines'),outline);
 const additional=await PDFDocument.create();additional.addPage([400,600]).drawText('Robot additional sheet',{x:40,y:520,size:16});
 const bytes=Buffer.from(await pdf.save()),more=Buffer.from(await additional.save());await fs.writeFile(source,bytes,{flag:'wx'});await fs.writeFile(extra,more,{flag:'wx'});
 ctx.codexFixtures={source,extra,sourceHash:hash(bytes),extraHash:hash(more),counter:0,inputs:[]};return ctx.codexFixtures;
}
async function open(page,ctx,file,{mode='build'}={}){await ctx.goHome();await ctx.chooseFile(file);await page.getByRole('button',{name:'Open a file',exact:true}).click();await page.getByLabel(/^Rendered PDF page [0-9]+$/).first().waitFor({timeout:90000});const number=page.getByRole('spinbutton',{name:'Page number',exact:true});await number.fill('1');await number.press('Tab');await page.getByLabel('Rendered PDF page 1',{exact:true}).first().waitFor({timeout:90000});await chooseDocumentMode(page,mode);}
async function menu(page,group='View',tool){await chooseDocumentMode(page,'build');const tabs=page.getByRole('tablist',{name:'PDF tool groups',exact:true});if(await tabs.count()){const entry=toolByName(tool),name=entry?TOOL_GROUPS.find(g=>g.id===entry.group).name:({'View and selection':'View','Reading and text':'View','Drawing review':'Comment','Pages and files':'Pages','Forms and editing':'Fill & Sign','Security and repair':'Protect','Accessibility and output':'Export'}[group]||group);await tabs.getByRole('tab',{name:name==='Comment'?'Review':name,exact:true}).click();if(name==='View'){const more=page.getByRole('button',{name:'More',exact:true});if(await more.isVisible()&&!await more.evaluate(n=>n.parentElement.open))await more.click();}if(tool)await page.getByRole('searchbox',{name:'Filter tools',exact:true}).fill(tool);return;}await page.getByText('Tools & view',{exact:true}).first().click();if(group&&group!=='View'){const heading=page.getByText(group,{exact:true}).first();if(await heading.isVisible())await heading.click();}}

async function fileFor(ctx,stem,ext='pdf'){const f=await setup(ctx);return path.join(ctx.files,`codex-${stem}-${++f.counter}.${ext}`);}
async function freshSource(ctx){const f=await setup(ctx),file=await fileFor(ctx,'input');await fs.copyFile(f.source,file);f.inputs.push([file,f.sourceHash]);return file;}
async function saved(file){await expect.poll(()=>fs.stat(file).then(s=>s.size,()=>0),{timeout:90000}).toBeGreaterThan(0);}
async function copy(page,ctx,file){await ctx.saveAs(file);await page.getByRole('button',{name:'Save a copy',exact:true}).click();await saved(file);}
function outcome(ctx,output,expected){ctx.codexOutcome={output,...expected};}
async function verify(ctx){
 const f=ctx.codexFixtures,o=ctx.codexOutcome,problems=[];if(!f||!o)return {pass:false,problems:['Action did not produce an expected saved file.']};
 for(const [file,expected]of [[f.source,f.sourceHash],[f.extra,f.extraHash],...f.inputs])if(hash(await fs.readFile(file))!==expected)problems.push('A generated original changed.');
 if(o.ledger){
  const ledger=JSON.parse(await fs.readFile(o.output,'utf8')),e=ledger.entries?.[0];
  if(ledger.source?.sha256!==f.sourceHash||ledger.entries?.length!==1||e?.kind!=='distance'||e.name!=='Robot measured line'||e.page!==1||Math.abs(e.quantity?.value-100)>.5)problems.push('Saved measurement identity, geometry or quantity differs.');
  if(e?.points?.length===2&&e?.calibration?.reference?.length===2){const distance=p=>Math.hypot(p[1][0]-p[0][0],p[1][1]-p[0][1]);if(Math.abs(distance(e.points)/distance(e.calibration.reference)*100-e.quantity.value)>.01)problems.push('Saved measurement does not recompute from its points.');}else problems.push('Saved measurement lacks two reference/measurement points.');
  return {pass:!problems.length,problems,info:{file:o.output,entries:ledger.entries?.length}};
 }
 const info=await inspectPdf(o.output);if(!info.ok)problems.push(info.problem);
 const bytes=await fs.readFile(o.output),pdf=await PDFDocument.load(bytes);info.sha256=hash(bytes);info.bytes=bytes.length;
 if(pdf.getPageCount()!==o.pages)problems.push(`Expected ${o.pages} pages, found ${pdf.getPageCount()}.`);
 if(o.exact&&hash(bytes)!==f.sourceHash)problems.push('Reader copy changed the source bytes.');
 for(const text of o.text??[])if(!info.text.includes(text))problems.push('Saved PDF text missing: '+text);
 for(const text of o.absent??[])if(info.text.includes(text))problems.push('Deleted page text remains: '+text);
 for(const [i,rotation]of (o.rotations??[]).entries())if(pdf.getPage(i).getRotation().angle!==rotation)problems.push('Saved page rotation differs.');
 if(o.annotations){const a=pdf.getPage(0).node.lookup(PDFName.of('Annots'));const rows=a?Array.from({length:a.size()},(_,i)=>pdf.context.lookup(a.get(i))):[];
  for(const kind of ['Highlight','Text'])if(!rows.some(r=>r.get(PDFName.of('Subtype'))?.toString()==='/'+kind))problems.push('Saved annotation missing: '+kind);
  if(!rows.some(r=>r.get(PDFName.of('Contents'))?.decodeText?.()==='Robot persistent note'))problems.push('Saved note body differs.');
 }
 return {pass:!problems.length,problems,info:{...info,text:info.text.slice(0,240),file:o.output}};
}
async function pages(page,ctx,mode){
 const f=await setup(ctx);await open(page,ctx,await freshSource(ctx));await menu(page,'Pages and files');await page.getByRole('button',{name:'Organize pages',exact:true}).click();const d=page.getByRole('region',{name:'Organize PDF pages',exact:true});
 await expect(d.getByRole('button',{name:'Rotate output page 1',exact:true})).toBeEnabled({timeout:120000});
 if(mode==='rotate')await d.getByRole('button',{name:'Rotate output page 1',exact:true}).click();
 if(mode==='delete')await d.getByRole('button',{name:'Remove output page 2',exact:true}).click();
 if(mode==='extract'){const options=d.getByText('Page options and copy details',{exact:true});if(await options.count())await options.click();await d.getByText('Keep a page range',{exact:true}).click();await d.getByRole('textbox',{name:'Output page range',exact:true}).fill('2');await d.getByRole('button',{name:'Keep selected pages',exact:true}).click();}
 if(mode==='combine'){await ctx.chooseFile(f.extra);await d.getByRole('button',{name:'Add another PDF',exact:true}).click();await expect(d.getByRole('button',{name:'Remove output page 4',exact:true})).toBeEnabled({timeout:120000});}
 await d.getByRole('button',{name:'Preview new copy',exact:true}).click();await expect(d.getByRole('button',{name:'Save this copy',exact:true})).toBeEnabled({timeout:90000});
 await ctx.capture?.('pages-'+mode+'-preview');const output=await fileFor(ctx,mode);await ctx.saveAs(output);await d.getByRole('button',{name:'Save this copy',exact:true}).click();await saved(output);await expect(d.getByRole('status').filter({hasText:/^Saved .*Originals unchanged/})).toBeVisible({timeout:120000});await expect(d.getByRole('button',{name:'Preview new copy',exact:true})).toBeEnabled({timeout:120000});await d.getByRole('button',{name:'Close page workspace',exact:true}).click();
 outcome(ctx,output,mode==='rotate'?{pages:3,rotations:[90,0,0],text:['needle 1','needle 2','needle 3']}:mode==='delete'?{pages:2,text:['needle 1','needle 3'],absent:['needle 2']}:mode==='extract'?{pages:1,text:['needle 2'],absent:['needle 1','needle 3']}:{pages:4,text:['needle 1','needle 2','needle 3','Robot additional sheet']});
}
const reader={name:'reader: search, jump, zoom and bookmark',weight:3,async run(page,ctx){
 const f=await setup(ctx);await open(page,ctx,await freshSource(ctx));await menu(page,'View and selection');await page.getByRole('combobox',{name:'Reading view',exact:true}).selectOption('page');
 await page.getByRole('button',{name:'Find in PDF',exact:true}).click();await page.getByRole('searchbox',{name:'Search selectable text',exact:true}).fill('needle');await page.getByRole('button',{name:'Search PDF',exact:true}).click();await page.getByRole('button',{name:'Next search match',exact:true}).click();await page.keyboard.press('Escape');
 const number=page.getByRole('spinbutton',{name:'Page number',exact:true});await number.fill('2');await number.press('Tab');await page.getByLabel('Rendered PDF page 2',{exact:true}).waitFor();
 for(const name of ['Zoom in','Zoom out']){await page.getByRole('button',{name,exact:true}).click();await page.getByLabel('Rendered PDF page 2',{exact:true}).waitFor();}
 const outline=page.getByRole('tab',{name:'Outline',exact:true});if(!await outline.isVisible()){await menu(page,'View and selection');await page.getByRole('button',{name:'Pages panel',exact:true}).click();}await outline.click();await page.getByRole('button',{name:'Robot last page',exact:true}).click();await page.getByLabel('Rendered PDF page 3',{exact:true}).waitFor();
 const output=await fileFor(ctx,'reader');await copy(page,ctx,output);outcome(ctx,output,{pages:3,exact:true,text:['needle 1','needle 2','needle 3']});
},verify};
const markup={name:'markup: highlight, note, save and reopen',weight:2,async run(page,ctx){
 const f=await setup(ctx);await open(page,ctx,await freshSource(ctx));await menu(page,'View');await page.getByRole('button',{name:'Fit page',exact:true}).click();await menu(page,'Comment');let d=page.getByRole('region',{name:'PDF comment options',exact:true});let tools=page.getByRole('toolbar',{name:'Comment tools',exact:true});await expect(tools.getByRole('button',{name:'Highlight',exact:true})).toBeEnabled({timeout:120000});const surface=page.getByRole('img',{name:'Markup drawing surface',exact:true});
 await tools.getByRole('button',{name:'Highlight',exact:true}).click();await surface.scrollIntoViewIfNeeded();let box=await surface.boundingBox();await page.mouse.move(box.x+box.width*.08,box.y+box.height*.1);await page.mouse.down();await page.mouse.move(box.x+box.width*.85,box.y+box.height*.16,{steps:8});await page.mouse.up();
 await tools.getByRole('button',{name:'Comment',exact:true}).click();await surface.click({position:{x:box.width*.3,y:box.height*.4}});await d.getByRole('textbox',{name:'Markup comment or text',exact:true}).fill('Robot persistent note');const output=await fileFor(ctx,'markup');await ctx.saveAs(output);await page.getByRole('button',{name:'Save a copy',exact:true}).click();await saved(output);await expect(d.getByRole('status').filter({hasText:/^Saved /})).toBeVisible({timeout:120000});await ctx.capture?.('markup-saved');await d.getByRole('button',{name:'Close markup workspace',exact:true}).click();
 await open(page,ctx,output);await menu(page,'Comment');d=page.getByRole('region',{name:'PDF comment options',exact:true});await d.getByRole('button',{name:/Robot persistent note/}).click();await expect(d.getByRole('textbox',{name:'Markup comment or text',exact:true})).toHaveValue('Robot persistent note');await ctx.capture?.('markup-reopened');await d.getByRole('button',{name:'Close markup workspace',exact:true}).click();outcome(ctx,output,{pages:3,annotations:true,text:['needle 1','needle 3']});
},verify};
const drawing={name:'drawing: calibrate, measure and save ledger',weight:1,async run(page,ctx){
 const f=await setup(ctx);await open(page,ctx,await freshSource(ctx));await menu(page,'View');await page.getByRole('button',{name:'Fit page',exact:true}).click();await menu(page,'Measure');await expect(page.getByRole('button',{name:'Drawing takeoffs',exact:true})).toBeEnabled({timeout:120000});await page.getByRole('button',{name:'Drawing takeoffs',exact:true}).click();const overlay=page.getByRole('application',{name:'Drawing measurement point placement. Arrow keys move; Space places a point.',exact:true});await overlay.waitFor();await expect(page.getByText(/^Opened .*Your original is unchanged\.$/).first()).not.toBeVisible({timeout:12000});await ctx.capture?.('drawing-options-reference');
 const points=async()=>{let b,last='',since=0;await expect.poll(async()=>{b=await overlay.boundingBox();const key=b?JSON.stringify([b.x,b.y,b.width,b.height]):'';if(key!==last){last=key;since=Date.now();}return !!key&&Date.now()-since>=400;},{timeout:120000,intervals:[100]}).toBe(true);for(const x of [.2,.6])await overlay.click({position:{x:b.width*x,y:b.height*.4}});};await points();await page.getByRole('combobox',{name:'Drawing measurement units',exact:true}).selectOption('mm');await page.getByRole('spinbutton',{name:'Known drawing reference length',exact:true}).fill('100');await page.getByRole('checkbox',{name:'I checked the two points, length and units against the drawing.',exact:true}).check();await page.getByRole('button',{name:'Confirm scale',exact:true}).click();await page.getByRole('combobox',{name:'Drawing measurement tool',exact:true}).scrollIntoViewIfNeeded();await ctx.capture?.('drawing-options-calibrated');await points();await page.getByRole('button',{name:'Finish measurement',exact:true}).click();await page.getByRole('textbox',{name:'Takeoff entry name',exact:true}).fill('Robot measured line');await page.getByRole('checkbox',{name:'I checked this name, points and scale (or count) against the drawing.',exact:true}).check();await page.getByRole('button',{name:'Add finished measurement to takeoff',exact:true}).click();await expect(page.getByRole('button',{name:'Review / save JSON ledger',exact:true})).toBeEnabled();await expect(page.getByText(/^Takeoff quantities.*1 entr/)).toBeVisible();const measurePanel=page.getByRole('region',{name:'Drawing measurements',exact:true}),panelBox=await measurePanel.boundingBox(),paperBox=await overlay.boundingBox();expect(panelBox.x).toBeGreaterThanOrEqual(paperBox.x+paperBox.width-2);expect(paperBox.height).toBeGreaterThan(150);expect(panelBox.height).toBeGreaterThan(150);await ctx.capture?.('drawing-populated-ledger');await page.getByRole('button',{name:'Review / save JSON ledger',exact:true}).click();const d=page.getByRole('dialog').last();await d.getByRole('checkbox',{name:'I reviewed these names, page references, quantities and scales.',exact:true}).check();await ctx.capture?.('drawing-ledger-save-review');if(ctx.cancelSave){await ctx.cancelSave();await d.getByRole('button',{name:'Confirm reviewed operation',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Save canceled. The ledger remains in memory.'})).toBeVisible();await page.getByRole('button',{name:'Review / save JSON ledger',exact:true}).click();await d.getByRole('checkbox',{name:'I reviewed these names, page references, quantities and scales.',exact:true}).check();}const output=await fileFor(ctx,'measurement','json');await ctx.saveAs(output);await d.getByRole('button',{name:'Confirm reviewed operation',exact:true}).click();await saved(output);await expect(page.getByRole('button',{name:'Review / save JSON ledger',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Close drawing measurements',exact:true}).click();await expect(measurePanel).not.toBeVisible();await page.getByRole('button',{name:'Drawing takeoffs',exact:true}).click();await expect(page.getByText(/^Takeoff quantities.*1 entr/)).toBeVisible();await measurePanel.getByRole('combobox',{name:'Drawing measurement tool',exact:true}).focus();await page.keyboard.press('Escape');await expect(measurePanel).not.toBeVisible();outcome(ctx,output,{ledger:true});
},verify};
export const actions=[reader,markup,...['rotate','delete','extract','combine'].map(mode=>({name:'pages: '+mode+' and save',weight:2,run:(page,ctx)=>pages(page,ctx,mode),verify})),drawing];
export default actions;

// Opt-in: Claude supplies ctx.profile before adding these to robot.mjs.
const helpers={setup,open,menu,fileFor,freshSource,saved,copy,outcome,verify};
export const coverageActions=[...makeHomeActions(helpers),...makeRemainingActions(helpers),...makeNativeActions(helpers)];
// Eighteen actions verified locally at both size/text configurations.
export const additionalActions=[...makeExtraActions(helpers),...coverageActions];
export const candidateActions=coverageActions;
// Pending integrator wiring: requires ctx.chooseFiles(paths), never enabled implicitly.
export const batchActions=makeBatchActions(helpers);

// Enable only with a package containing the Build/View reader.
export const modeActions=makeModeActions(helpers);

export const textActions=makeTextActions(helpers);

export const tableActions=makeTableActions(helpers);

export const inlineRedactActions=makeRedactActions(helpers);

export const ribbonActions=makeRibbonActions(helpers);

export const pagesRibbonActions=makePagesRibbonActions(helpers);

export const outputRibbonActions=makeOutputRibbonActions(helpers);

export const editingRibbonActions=makeEditingRibbonActions(helpers);

export const windowLayoutActions=makeWindowLayoutActions(helpers);

export const viewRibbonActions=makeViewRibbonActions(helpers);
export {historyActions} from './actions-codex-history.mjs';
export {toolSearchActions} from './actions-codex-tool-search.mjs';

export {objectOptionsActions} from './actions-codex-object-options.mjs';

export {copySaveActions} from './actions-codex-copy-save.mjs';
