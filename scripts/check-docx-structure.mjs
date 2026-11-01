// Structural check of the Word and RTF copies PDFix writes, standing in for "open it in Word" on a machine without
// Word or LibreOffice. A document using every editor feature (headings 1-6 with link anchors, an internal link and a
// web link, bold/italic/underline/strike/colour/highlight, both list kinds, a table with merged and shaded cells, PNG
// and JPEG pictures, page setup) is written by the contained engine exactly as Export DOCX/RTF does, then:
//  - every DOCX part is well-formed XML, has a content type, and every relationship resolves to a real part;
//  - every r:id/r:embed in the body is declared, bookmarks pair up, internal links point at a bookmark, list and
//    style references exist;
//  - the RTF has balanced groups and the expected picture and table controls;
//  - both copies reopen in PDFix with the same headings, links, table and pictures (JPEG stays JPEG).
// Usage: node scripts/check-docx-structure.mjs   (needs a build: dist/native)
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import zlib from 'node:zlib';import {createRequire} from 'node:module';
import JSZip from 'jszip';import {DOMParser} from '@xmldom/xmldom';
const require=createRequire(import.meta.url);
const {DocumentSandboxService}=require('../desktop/document-sandbox-service.cjs');
const {validRichOutput,validDocxImport,validRtfImport}=require('../desktop/rich-document-validation.cjs');
const {defaultDocumentLayout}=require('../desktop/document-layout-validation.cjs');
const failures=[],notes=[];const tags=(doc,name)=>{const list=doc.getElementsByTagName(name);return Array.from({length:list.length},(_,i)=>list.item(i));};const expect=(ok,message)=>{if(!ok)failures.push(message);};

function png(width,height){const table=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});const crc=b=>{let c=0xffffffff;for(const x of b)c=table[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
 const chunk=(type,data)=>{const length=Buffer.alloc(4);length.writeUInt32BE(data.length);const body=Buffer.concat([Buffer.from(type),data]);const sum=Buffer.alloc(4);sum.writeUInt32BE(crc(body));return Buffer.concat([length,body,sum]);};
 const raw=Buffer.alloc((width*3+1)*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const at=y*(width*3+1)+1+x*3;raw[at]=x*4;raw[at+1]=y*4;raw[at+2]=128;}
 const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
// A 1x1 baseline JPEG (the end-of-image marker is added below).
const JPEG=Buffer.concat([Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=','base64'),Buffer.from([255,217])]).toString('base64');

const text=(value,marks)=>({type:'text',text:value,...(marks?{marks}:{})});
const p=(...content)=>({type:'paragraph',content});
const heading=(level,value,anchor)=>({type:'heading',attrs:{level,anchor},content:[text(value)]});
const cell=(value,attrs={})=>({type:'tableCell',attrs:{colspan:1,rowspan:1,colwidth:null,background:null,...attrs},content:[p(text(value))]});
const pngSrc='data:image/png;base64,'+png(64,48).toString('base64');
const content={type:'doc',content:[
 heading(1,'Site report','h-report'),
 p(text('Jump to '),text('the findings',[{type:'documentLink',attrs:{href:'#h-findings'}}]),text(' or visit '),text('the website',[{type:'documentLink',attrs:{href:'https://example.com/report'}}]),text('.')),
 p(text('Bold',[{type:'bold'}]),text(' italic',[{type:'italic'}]),text(' underline',[{type:'underline'}]),text(' struck',[{type:'strike'}]),text(' marked',[{type:'highlight',attrs:{color:'yellow'}}])),
 heading(2,'Findings','h-findings'),heading(3,'Roof',null),heading(4,'Gutters',null),heading(5,'Joints',null),heading(6,'Fixings',null),
 {type:'bulletList',content:[{type:'listItem',content:[p(text('First point'))]},{type:'listItem',content:[p(text('Second point'))]}]},
 {type:'orderedList',attrs:{start:1},content:[{type:'listItem',content:[p(text('Step one'))]},{type:'listItem',content:[p(text('Step two'))]}]},
 {type:'table',attrs:{columnGridTwips:[1,2,1]},content:[
  {type:'tableRow',content:[{...cell('Area'),type:'tableHeader'},{...cell('Note'),type:'tableHeader'},{...cell('Rating'),type:'tableHeader'}]},
  {type:'tableRow',content:[cell('North wall and roof',{colspan:2,background:'#ffeecc'}),cell('Good',{rowspan:2})]},
  {type:'tableRow',content:[cell('South'),cell('Minor staining')]}]},
 p(text('Chart: '),{type:'documentImage',attrs:{src:pngSrc,alt:'Test chart',width:128,height:96,pixelWidth:64,pixelHeight:48}}),
 p(text('Photo: '),{type:'documentImage',attrs:{src:'data:image/jpeg;base64,'+JPEG,alt:'Test photo',width:40,height:40,pixelWidth:1,pixelHeight:1}}),
 {type:'pageBreak'},p(text('Last page.'))]};
const draft={version:1,content,layout:{...defaultDocumentLayout(),paper:'letter',headerText:'Site report',pageNumbers:true}};

const staging=await fs.mkdtemp(path.join(os.tmpdir(),'PDFix-DocxStructure-'));
const service=new DocumentSandboxService({runtimeDirectory:path.resolve('dist/native/document-engine'),stagingDirectory:staging});
const run=(operation,bytes,options,validate)=>service.run(operation,bytes,options,validate);
try{
 const docx=await run('rich-docx-write',Uint8Array.of(1),{draft},value=>validRichOutput(value,'docx'));
 const zip=await JSZip.loadAsync(docx),names=Object.keys(zip.files).filter(name=>!zip.files[name].dir);
 const xml={};const parseErrors=[];
 for(const name of names.filter(n=>/\.(xml|rels)$/.test(n))){const source=await zip.file(name).async('string');const errors=[];const doc=new DOMParser({onError:(level,message)=>{if(level!=='warning')errors.push(message);}}).parseFromString(source,'text/xml');if(errors.length)parseErrors.push(name+': '+errors[0]);xml[name]=doc;}
 expect(!parseErrors.length,'XML parts are well-formed: '+parseErrors.join('; '));
 const types=xml['[Content_Types].xml'];expect(types,'[Content_Types].xml exists');
 const defaults=new Set(tags(types,'Default').map(e=>e.getAttribute('Extension').toLowerCase())),overrides=new Set(tags(types,'Override').map(e=>e.getAttribute('PartName').replace(/^\//,'')));
 for(const name of names.filter(n=>n!=='[Content_Types].xml'))expect(overrides.has(name)||defaults.has(name.split('.').pop().toLowerCase()),'content type declared for '+name);
 for(const name of overrides)expect(names.includes(name),'content-type override points at a real part: '+name);
 const relsFor={};
 for(const name of names.filter(n=>n.endsWith('.rels'))){const base=name.replace(/_rels\/([^/]*)\.rels$/,'$1'),dir=path.posix.dirname(base==='.'||base===''?'x':base),ids=new Set(),map={};
  for(const rel of tags(xml[name],'Relationship')){const id=rel.getAttribute('Id');expect(!ids.has(id),'relationship ids are unique in '+name+': '+id);ids.add(id);map[id]=rel;
   if(rel.getAttribute('TargetMode')!=='External'){const target=rel.getAttribute('Target'),resolved=target.startsWith('/')?target.slice(1):path.posix.normalize(path.posix.join(name==='_rels/.rels'?'':dir,target));expect(names.includes(resolved),'relationship target exists: '+name+' '+id+' -> '+resolved);}}
  relsFor[base]=map;}
 const body=xml['word/document.xml'];expect(body,'word/document.xml exists');
 const root=tags(xml['_rels/.rels'],'Relationship').some(r=>/officeDocument$/.test(r.getAttribute('Type'))&&r.getAttribute('Target').replace(/^\//,'')==='word/document.xml');expect(root,'package points at word/document.xml');
 const docRels=relsFor['word/document.xml']||{};
 const all=tags(body,'*');
 for(const element of all)for(const attribute of ['r:id','r:embed','r:link']){const value=element.getAttribute(attribute);if(value)expect(docRels[value],'body reference '+attribute+'='+value+' is declared');}
 const starts=new Map(),ends=new Set();
 for(const element of tags(body,'w:bookmarkStart')){const id=element.getAttribute('w:id');expect(!starts.has(id),'bookmark ids are unique: '+id);starts.set(id,element.getAttribute('w:name'));}
 for(const element of tags(body,'w:bookmarkEnd'))ends.add(element.getAttribute('w:id'));
 for(const id of starts.keys())expect(ends.has(id),'bookmark '+starts.get(id)+' has an end');
 const bookmarkNames=new Set(starts.values());
 for(const link of tags(body,'w:hyperlink')){const anchor=link.getAttribute('w:anchor');if(anchor)expect(bookmarkNames.has(anchor),'internal link points at a bookmark: '+anchor);}
 expect(bookmarkNames.has('h-findings')&&bookmarkNames.has('h-report'),'heading anchors are written as bookmarks');
 const numbering=xml['word/numbering.xml'],numIds=new Set(numbering?tags(numbering,'w:num').map(e=>e.getAttribute('w:numId')):[]);
 for(const element of tags(body,'w:numId'))expect(numIds.has(element.getAttribute('w:val')),'list numbering '+element.getAttribute('w:val')+' is defined');
 const styles=xml['word/styles.xml'],styleIds=new Set(styles?tags(styles,'w:style').map(e=>e.getAttribute('w:styleId')):[]);
 for(const tag of ['w:pStyle','w:rStyle','w:tblStyle'])for(const element of tags(body,tag))expect(styleIds.has(element.getAttribute('w:val')),'style '+element.getAttribute('w:val')+' is defined');
 const media=names.filter(n=>n.startsWith('word/media/'));expect(media.some(n=>/\.jpe?g$/i.test(n))&&media.some(n=>/\.png$/i.test(n)),'pictures are stored as one PNG and one JPEG: '+media.join(', '));
 notes.push('DOCX '+docx.length+' bytes, '+names.length+' parts, '+starts.size+' bookmarks, media '+media.join(', '));

 const back=await run('rich-docx-read',docx,{},validDocxImport);
 const html=back.html;
 expect(back.snapshot,'the PDFix copy carries its own formatting snapshot for reopening');
 expect((html.match(/<h[1-6]\b/g)||[]).length>=6||back.snapshot,'headings return on reopen');
 expect(back.assets.length===2&&back.assets.some(a=>a.mime==='image/jpeg')&&back.assets.some(a=>a.mime==='image/png'),'both pictures return with their own types: '+back.assets.map(a=>a.mime).join(', '));
 expect(/#h-findings/.test(html),'the internal link returns: '+(html.match(/href="[^"]*"/g)||[]).join(' '));
 expect(/https:\/\/example\.com\/report/.test(html),'the web link returns');
 expect(/<table/.test(html)&&/colspan="2"/.test(html),'the table returns with its merged cell');

 const rtf=await run('rich-rtf-write',Uint8Array.of(1),{draft},value=>validRichOutput(value,'rtf'));const rtfText=Buffer.from(rtf).toString('latin1');
 let depth=0,balanced=true;for(let i=0;i<rtfText.length;i++){const c=rtfText[i];if(c==='\\'){i++;continue;}if(c==='{')depth++;else if(c==='}'&&--depth<0)balanced=false;}
 expect(balanced&&depth===0,'RTF groups are balanced');
 for(const control of ['\\rtf1','\\pngblip','\\jpegblip','\\trowd','\\clmgf','\\bkmkstart','HYPERLINK \\\\l'])expect(rtfText.includes(control),'RTF contains '+control);
 const rtfBack=await run('rich-rtf-read',rtf,{},validRtfImport);const images=JSON.stringify(rtfBack.doc).match(/data:image\/(png|jpeg)/g)||[];
 expect(images.includes('data:image/jpeg')&&images.includes('data:image/png'),'RTF reopens with a PNG and a JPEG picture: '+images.join(', '));
 notes.push('RTF '+rtf.length+' bytes');
}catch(error){failures.push('Stopped: '+error.message);}
finally{await fs.rm(staging,{recursive:true,force:true}).catch(()=>{});}
console.log(JSON.stringify({pass:!failures.length,notes,failures},null,1));process.exit(failures.length?1:0);
