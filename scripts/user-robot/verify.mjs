// The verifier: decides from the saved files alone whether a task worked. It never looks at the app's screen or
// messages, so a success message cannot hide a broken file.
import fs from 'node:fs/promises';
import JSZip from 'jszip';
import {createHash} from 'node:crypto';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

export async function inspectPdf(file){
 const bytes=new Uint8Array(await fs.readFile(file));if(String.fromCharCode(...bytes.subarray(0,5))!=='%PDF-')return {ok:false,problem:'not a PDF (bad header)'};
 const sha256=hash(bytes),byteLength=bytes.length;const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');let task;
 try{task=pdfjs.getDocument({data:bytes,useSystemFonts:true});const doc=await task.promise;let text='';
  for(let i=1;i<=Math.min(doc.numPages,20);i++)text+=(await (await doc.getPage(i)).getTextContent()).items.map(item=>item.str).join(' ')+'\n';
  return {ok:doc.numPages>0,pages:doc.numPages,text,sha256,bytes:byteLength};}
 catch(error){return {ok:false,problem:'PDF does not open: '+error.message.slice(0,200)};}finally{await task?.destroy();}
}
export async function inspectDocx(file){
 const bytes=await fs.readFile(file);let zip;try{zip=await JSZip.loadAsync(bytes);}catch(error){return {ok:false,problem:'Word file is not a valid package: '+error.message.slice(0,160)};}
 const body=await zip.file('word/document.xml')?.async('string');if(!body)return {ok:false,problem:'Word file has no word/document.xml'};
 const text=[...body.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map(m=>m[1]).join('');
 return {ok:true,text,images:Object.keys(zip.files).filter(n=>/^word\/media\//.test(n)).length,tables:(body.match(/<w:tbl>/g)||[]).length,bold:/<w:b\/>|<w:b w:val="(1|true)"\/>/.test(body),sha256:hash(bytes),bytes:bytes.length};
}
// Web and email links in a Word file: each w:hyperlink's relationship target, with the text it covers.
export async function docxHyperlinks(file){
 const zip=await JSZip.loadAsync(await fs.readFile(file)),body=await zip.file('word/document.xml')?.async('string')??'',rels=await zip.file('word/_rels/document.xml.rels')?.async('string')??'';
 const targets=new Map([...rels.matchAll(/<Relationship\b[^>]*>/g)].map(m=>[/\bId="([^"]+)"/.exec(m[0])?.[1],/\bTarget="([^"]+)"/.exec(m[0])?.[1]]));
 return [...body.matchAll(/<w:hyperlink\b([^>]*)>([\s\S]*?)<\/w:hyperlink>/g)].map(m=>({target:targets.get(/r:id="([^"]+)"/.exec(m[1])?.[1])??null,text:[...m[2].matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map(t=>t[1]).join('')}));
}
// Checks an outcome against what the robot expected to be in the file.
export async function verifyOutput({file,kind,expectText=[],expectTable=false,expectBold=false}){
 const info=kind==='pdf'?await inspectPdf(file):await inspectDocx(file);if(!info.ok)return {pass:false,problems:[info.problem],info};
 const problems=[];const flat=info.text.replace(/\s+/g,' ');
 for(const piece of expectText)if(!flat.includes(piece))problems.push(`expected text missing: "${piece}"`);
 if(kind==='docx'&&expectTable&&!info.tables)problems.push('expected a table, found none');
 if(kind==='docx'&&expectBold&&!info.bold)problems.push('expected bold text, found none');
 return {pass:!problems.length,problems,info:{...info,text:info.text.slice(0,300)}};
}
// A protected PDF must refuse to open without its password and open with it.
export async function verifyProtected(file,password){
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),bytes=await fs.readFile(file),problems=[];
 let task=pdfjs.getDocument({data:new Uint8Array(bytes)});try{await task.promise;problems.push('opened without a password');}catch(error){if(!/password/i.test(error.name+error.message))problems.push('failed for another reason: '+error.message.slice(0,120));}finally{await task.destroy();}
 task=pdfjs.getDocument({data:new Uint8Array(bytes),password});let pages=0;try{pages=(await task.promise).numPages;}catch(error){problems.push('did not open with the password: '+error.message.slice(0,120));}finally{await task.destroy();}
 return {pass:!problems.length&&pages>0,problems,info:{pages,sha256:hash(bytes)}};
}
export async function unchanged(file,sha256){return hash(await fs.readFile(file))===sha256;}
export {hash};
// The names of a PDF's form fields, read with an independent PDF reader.
export async function pdfFieldNames(file){
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');const task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile(file))});
 try{const doc=await task.promise,names=new Set();for(let i=1;i<=doc.numPages;i++)for(const note of await (await doc.getPage(i)).getAnnotations())if(note.fieldName)names.add(note.fieldName);return [...names];}finally{await task.destroy();}
}
// Each page's size in points (width x height), read with an independent PDF reader.
export async function pdfPageSizes(file){
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');const task=pdfjs.getDocument({data:new Uint8Array(await fs.readFile(file))});
 try{const doc=await task.promise,sizes=[];for(let i=1;i<=doc.numPages;i++){const [x0,y0,x1,y1]=(await doc.getPage(i)).view;sizes.push([Math.round(x1-x0),Math.round(y1-y0)]);}return sizes;}finally{await task.destroy();}
}
// Workbooks: the sheets and the first sheet's cells (value and formula) read straight from the saved package.
export async function inspectXlsx(file){
 const bytes=await fs.readFile(file);let zip;try{zip=await JSZip.loadAsync(bytes);}catch(error){return {ok:false,problem:'workbook is not a valid package: '+error.message.slice(0,160)};}
 const book=await zip.file('xl/workbook.xml')?.async('string'),sheet=await zip.file('xl/worksheets/sheet1.xml')?.async('string');if(!book||!sheet)return {ok:false,problem:'workbook has no workbook.xml or first sheet'};
 const shared=[...((await zip.file('xl/sharedStrings.xml')?.async('string'))||'').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m=>[...m[1].matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map(t=>t[1]).join(''));
 const cells={};for(const m of sheet.matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)){const ref=/r="([A-Z]+[0-9]+)"/.exec(m[1])?.[1],type=/t="([^"]+)"/.exec(m[1])?.[1],body=m[2]||'';if(!ref)continue;
  const v=/<v>([^<]*)<\/v>/.exec(body)?.[1],f=/<f(?:\s[^>]*)?>([^<]*)<\/f>/.exec(body)?.[1],inline=[...body.matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map(t=>t[1]).join('');
  cells[ref]={value:type==='s'?shared[Number(v)]:type==='inlineStr'?inline:v,formula:f};}
 return {ok:true,sheets:(book.match(/<sheet\s/g)||[]).length,cells,sha256:hash(bytes),bytes:bytes.length};
}
// Slides: the number of slides and all slide text, in slide order.
export async function inspectPptx(file){
 const bytes=await fs.readFile(file);let zip;try{zip=await JSZip.loadAsync(bytes);}catch(error){return {ok:false,problem:'slides are not a valid package: '+error.message.slice(0,160)};}
 const names=Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide[0-9]+\.xml$/.test(n)).sort((a,b)=>Number(a.match(/[0-9]+/)[0])-Number(b.match(/[0-9]+/)[0]));if(!names.length)return {ok:false,problem:'slides package has no slides'};
 let text='';for(const n of names)text+=[...(await zip.file(n).async('string')).matchAll(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g)].map(m=>m[1]).join(' ')+'\n';
 return {ok:true,slides:names.length,text,sha256:hash(bytes),bytes:bytes.length};
}
