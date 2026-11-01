// Additional reader tools. UI work uses accessible names only. Verification
// reads generated originals and saved bytes; it does not trust success messages.
import fs from 'node:fs/promises';
import {PDFDocument,PDFName,PDFString} from 'pdf-lib';
import {expect} from '@playwright/test';
import {hash} from './verify.mjs';

export async function verifyReaderEvidence(output,expected){
 const problems=[],bytes=await fs.readFile(output);
 if(expected.kind==='attachment'){
  if(hash(bytes)!==expected.payloadHash)problems.push('Extracted attachment bytes differ from the generated attachment.');
 }else if(expected.kind==='report'){
  if(bytes.length>8*1024*1024)throw Error('Saved inspection report exceeds the verification budget.');
  const envelope=JSON.parse(bytes.toString('utf8')),report=envelope.report??{};
  if(envelope.format!=='PDFix inspection evidence'||envelope.version!==1||envelope.family!==(expected.audit?'accessibilityAudit':'preflight'))problems.push('Saved inspection evidence has the wrong format or tool family.');
  if(report.version!==1||report.sourceSha256!==expected.sourceHash||report.sourceBytes!==expected.sourceBytes||report.pageCount!==3)problems.push('Saved report is not bound to the generated three-page source.');
  if(!Array.isArray(report.findings)||!report.findings.length)problems.push('The deliberately incomplete fixture has no reported findings.');
  if(expected.audit){
   if(report.structureInspected!==true||!Array.isArray(report.requiredHumanChecks)||!report.requiredHumanChecks.length)problems.push('Accessibility evidence omits the structural inspection or outstanding human checks.');
  }else{
   if(report.profile?.id!=='practical-print-v1'||report.pages?.length!==3)problems.push('Saved preflight profile or page inventory differs.');
   for(const page of report.pages??[]){const box=page.boxes?.find(b=>b.name==='MediaBox')?.rect;if(JSON.stringify(box)!==JSON.stringify([0,0,400,600]))problems.push('Saved report has incorrect generated page geometry.');}
   if(!report.fonts?.length)problems.push('Saved preflight report omitted the fixture font.');
  }
 }else if(hash(bytes)!==expected.sourceHash)problems.push('The unchanged-copy tool changed the generated source bytes.');
 return {pass:!problems.length,problems,info:{file:output,bytes:bytes.length,sha256:hash(bytes)}};
}

export function makeRemainingActions(h){
 const deadline={timeout:120000};
 async function verify(ctx){
  const f=ctx.codexFixtures,o=ctx.codexOutcome,problems=[];
  for(const [file,digest]of [[f.source,f.sourceHash],[f.extra,f.extraHash],...f.inputs])if(hash(await fs.readFile(file))!==digest)problems.push('A generated original changed.');
  const result=await verifyReaderEvidence(o.output,o.evidence);result.problems.unshift(...problems);result.pass=!result.problems.length;return result;
 }
 const action=(name,run)=>({name,weight:1,run,verify});
 async function start(page,ctx,group,name,file){await h.open(page,ctx,file??await h.freshSource(ctx));await h.menu(page,group,name);await page.getByRole('button',{name,exact:true}).click();}
 async function exactCopy(page,ctx,stem,sourceHash){const f=await h.setup(ctx),output=await h.fileFor(ctx,stem);await h.copy(page,ctx,output);h.outcome(ctx,output,{evidence:{kind:'copy',sourceHash:sourceHash??f.sourceHash}});}
 async function generated(ctx,stem,change){const f=await h.setup(ctx),pdf=await PDFDocument.load(await fs.readFile(f.source));await change(pdf);const file=await h.fileFor(ctx,stem),bytes=Buffer.from(await pdf.save({useObjectStreams:false}));await fs.writeFile(file,bytes,{flag:'wx'});f.inputs.push([file,hash(bytes)]);return {file,digest:hash(bytes)};}
 return [
  action('reader: prepare whole-document read aloud without playing audio',async(page,ctx)=>{
   await start(page,ctx,'View','Read aloud');const d=page.getByRole('dialog',{name:'Read PDF aloud',exact:true});await d.getByRole('combobox',{name:'Read aloud text scope',exact:true}).selectOption('document');await expect(d.getByRole('button',{name:'Prepare text',exact:true})).toBeEnabled(deadline);await d.getByRole('button',{name:'Prepare text',exact:true}).click();const text=d.getByRole('textbox',{name:'Prepared read aloud text',exact:true});for(let i=1;i<=3;i++)await expect(text).toHaveValue(new RegExp('Robot reader needle '+i),deadline);await ctx.capture?.('read-aloud-prepared');await d.getByRole('button',{name:'Close',exact:true}).click();await expect(d).not.toBeVisible();await exactCopy(page,ctx,'read-aloud-source');
  }),
  ...[{audit:true,name:'Accessibility audit',dialog:'PDF accessibility source audit',save:'Save audit evidence',group:'View'},{audit:false,name:'Print preflight',dialog:'PDF practical preflight inspection',save:'Save inspection report',group:'Export'}].map(spec=>action('reader: save source-bound '+(spec.audit?'accessibility evidence':'preflight report'),async(page,ctx)=>{
   const f=await h.setup(ctx);await start(page,ctx,spec.group,spec.name);const d=page.getByRole('dialog',{name:spec.dialog,exact:true}),save=d.getByRole('button',{name:spec.save,exact:true});await expect(save).toBeEnabled(deadline);await ctx.capture?.(spec.audit?'accessibility-audit-populated':'preflight-populated');if(spec.audit){const search=d.getByRole('searchbox',{name:'Search findings',exact:true});await search.scrollIntoViewIfNeeded();if((await search.boundingBox())?.width<200)throw Error('Audit search is too narrow to read.');await search.fill('title');await expect(d.getByRole('button',{name:/AA-TITLE · No nonblank/})).toBeVisible();await ctx.capture?.('accessibility-audit-filtered');await search.fill('');}const output=await h.fileFor(ctx,spec.audit?'accessibility-evidence':'preflight-evidence','json');await ctx.saveAs(output);await save.click();await h.saved(output);await expect(save).toBeEnabled(deadline);await d.getByRole('button',{name:'Close',exact:true}).click();await expect(d).not.toBeVisible();h.outcome(ctx,output,{evidence:{kind:'report',sourceHash:f.sourceHash,sourceBytes:(await fs.stat(f.source)).size,audit:spec.audit}});
  })),
  action('reader: name and save a byte-identical PDF copy',async(page,ctx)=>{
   await start(page,ctx,'Export','Name and save unchanged copy');const d=page.getByRole('dialog').last();await d.getByRole('textbox',{name:'New PDF filename',exact:true}).fill('Robot unchanged drawing.pdf');await expect(d.getByRole('checkbox',{name:'I reviewed the name and want an unchanged new copy.',exact:true})).toHaveCount(0);const save=d.getByRole('button',{name:'Choose destination and save copy',exact:true});await expect(save).toBeEnabled(deadline);await ctx.capture?.('named-copy-reviewed');const output=await h.fileFor(ctx,'named-copy');await ctx.cancelSave();await save.click();await expect(d.getByRole('status')).toContainText('canceled');await expect(save).toBeEnabled(deadline);expect(await fs.stat(output).then(()=>true,()=>false)).toBe(false);await ctx.saveAs(output);await save.click();await h.saved(output);await expect(save).toBeEnabled(deadline);await ctx.capture?.('ordinary-named-saved');await d.getByRole('button',{name:'Close filename suggestions',exact:true}).click();h.outcome(ctx,output,{evidence:{kind:'copy',sourceHash:ctx.codexFixtures.sourceHash}});
  }),
  action('reader: inspect and extract exact embedded-file bytes',async(page,ctx)=>{
   const payload=Buffer.from('Robot inert attachment\nNo executable content.\n','utf8'),source=await generated(ctx,'attachment-source',pdf=>pdf.attach(payload,'robot-note.txt',{description:'Generated robot attachment'}));await start(page,ctx,'Export','Review embedded files',source.file);const d=page.getByRole('dialog',{name:'Review PDF embedded files',exact:true});await expect(d.getByRole('button',{name:'Review decoded metadata',exact:true})).toBeEnabled(deadline);await d.getByRole('button',{name:'Review decoded metadata',exact:true}).click();await d.getByRole('checkbox',{name:'I reviewed the name, size and hash and want to save these untrusted bytes',exact:true}).check();await ctx.capture?.('attachment-reviewed');const output=await h.fileFor(ctx,'attachment','bin');await ctx.saveAs(output);const save=d.getByRole('button',{name:'Save selected embedded file',exact:true});await expect(save).toBeEnabled(deadline);await save.click();await h.saved(output);await expect(save).toBeEnabled(deadline);await d.getByRole('button',{name:'Close',exact:true}).click();h.outcome(ctx,output,{evidence:{kind:'attachment',payloadHash:hash(payload)}});
  }),
  action('reader: toggle a PDF layer and retain its document defaults',async(page,ctx)=>{
   const source=await generated(ctx,'layer-source',pdf=>{const c=pdf.context,group=c.register(c.obj({Type:'OCG',Name:PDFString.of('Robot review layer')}));pdf.catalog.set(PDFName.of('OCProperties'),c.obj({OCGs:[group],D:{Name:PDFString.of('Robot layer defaults'),BaseState:'ON',ON:[group],Order:[group]}}));});await start(page,ctx,'View','PDF layers',source.file);const panel=page.getByRole('region',{name:'PDF optional content layers',exact:true}),layer=panel.getByRole('checkbox',{name:'Robot review layer',exact:true});await expect(layer).toBeEnabled(deadline);await expect(layer).toBeChecked();await layer.uncheck();await expect(layer).toBeEnabled(deadline);await expect(layer).not.toBeChecked();await ctx.capture?.('layer-hidden');await panel.getByRole('button',{name:'Restore document defaults',exact:true}).click();await expect(layer).toBeEnabled(deadline);await expect(layer).toBeChecked();await panel.getByRole('button',{name:'Close PDF layers',exact:true}).click();await expect(page.getByRole('button',{name:/^(More|PDF layers)$/})).toBeFocused();await exactCopy(page,ctx,'layer-source-copy',source.digest);
  }),
  action('reader: calculate a known geographic point and retain the registered PDF',async(page,ctx)=>{
   const source=await generated(ctx,'map-source',pdf=>{const c=pdf.context;pdf.getPage(0).node.set(PDFName.of('VP'),c.obj([{Type:'Viewport',Name:PDFString.of('Robot known map'),BBox:[0,0,400,600],Measure:{Type:'Measure',Subtype:'GEO',Bounds:[0,0,1,0,1,1,0,1],LPTS:[0,0,1,0,1,1,0,1],GPTS:[40,-75,40,-74,41,-74,41,-75],GCS:{Type:'GEOGCS',EPSG:4326}}}]));});await start(page,ctx,'Measure','Map coordinates and distances',source.file);const d=page.getByRole('dialog',{name:'Geospatial PDF coordinates and measurements',exact:true}),x=d.getByRole('spinbutton',{name:'PDF page x coordinate',exact:true});await expect(x).toBeEnabled(deadline);await x.fill('200');await d.getByRole('spinbutton',{name:'PDF page y coordinate',exact:true}).fill('300');await d.getByText('PDF x',{exact:true}).scrollIntoViewIfNeeded();await ctx.capture?.('geographic-input-labels');await d.getByRole('button',{name:'Add page coordinate',exact:true}).click();await d.getByRole('button',{name:'Calculate geographic result',exact:true}).click();await expect(d.getByText(/1: latitude 40\.500000°, longitude -74\.500000°/)).toBeVisible(deadline);await ctx.capture?.('geographic-point-result');await d.getByRole('button',{name:'Close',exact:true}).click();await exactCopy(page,ctx,'registered-map-copy',source.digest);
  }),
  action('reader: leave certificate signing unapproved and save an unchanged copy',async(page,ctx)=>{
   await start(page,ctx,'Fill & Sign','Sign with a Windows certificate');const d=page.getByRole('dialog',{name:'Sign PDF with a Windows certificate',exact:true});await expect(d.getByRole('button',{name:'Refresh certificates',exact:true})).toBeEnabled(deadline);await expect(d.getByRole('combobox',{name:'Select a Windows signing certificate',exact:true})).toHaveValue('');await expect(d.getByRole('button',{name:'Sign this PDF',exact:true})).toBeDisabled();await expect(d.getByRole('button',{name:'Save signed PDF copy',exact:true})).not.toBeVisible();await ctx.capture?.('certificate-unapproved');await d.getByRole('button',{name:'Close',exact:true}).click();await expect(d).not.toBeVisible();await exactCopy(page,ctx,'unsigned-source-copy');
  })
 ];
}
