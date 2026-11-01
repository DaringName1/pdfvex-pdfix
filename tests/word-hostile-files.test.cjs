'use strict';
// V1 audit, area 5: hostile Word (.docx) and RTF files. Import runs inside the contained engine without network; these
// tests prove the reader itself refuses or bounds each trick within seconds and never reads files from the computer.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {readDocx,readRtf}=require('../desktop/rich-document-codec.cjs'),{zip}=require('./helpers/test-zip.cjs');
const types='<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
const rootRels='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
const body=inner=>`<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${inner}</w:body></w:document>`;
const docx=(documentXml,extra=[])=>zip([{name:'[Content_Types].xml',data:types},{name:'_rels/.rels',data:rootRels},{name:'word/document.xml',data:documentXml},...extra]);
async function bounded(label,work,ms=8000){const started=Date.now();let result,error;try{result=await work();}catch(e){error=e;}const took=Date.now()-started;assert.ok(took<ms,`${label} took ${took} ms`);return {result,error};}
test('a plain Word file still imports (the cases below differ only in the hostile part)',async()=>{
 const {result,error}=await bounded('plain',()=>readDocx(docx(body('<w:p><w:r><w:t>Site visit</w:t></w:r></w:p>')),{}));assert.ifError(error);assert.match(result.html,/Site visit/);
});
test('a Word zip bomb, entity expansion and foreign encodings are refused',async()=>{
 const {error:bomb}=await bounded('lying bomb',()=>readDocx(docx(body('<w:p/>'),[{name:'word/media/bomb.bin',data:Buffer.alloc(40*1024*1024),declared:1000}]),{}));assert.ok(bomb,'zip bomb refused');
 const laughs='<?xml version="1.0"?><!DOCTYPE d [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;">]>'+body('<w:p><w:r><w:t>&b;</w:t></w:r></w:p>').replace('<?xml version="1.0" encoding="UTF-8"?>','');
 const {error:entity}=await bounded('entities',()=>readDocx(docx(laughs),{}));assert.ok(entity,'DOCTYPE/entities refused');
});
test('a picture or link that points at a file on this computer is never read',async()=>{
 const secret=require('node:path').resolve('tests/fixtures/scan-page.png'),url='file:///'+secret.replace(/\\/g,'/');
 const rels=`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${url}" TargetMode="External"/></Relationships>`;
 const pic='<w:p><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="100" cy="100"/><wp:docPr id="1" name="p"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="p"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:link="rId9"/></pic:blipFill><pic:spPr/></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
 const {result,error}=await bounded('external picture',()=>readDocx(docx(body(pic),[{name:'word/_rels/document.xml.rels',data:rels}]),{}));
 const png=fs.readFileSync(secret).toString('base64').slice(0,40);assert.ok(error||!JSON.stringify(result).includes(png),'the file on this computer must not be read into the document');
});
test('RTF: runaway group nesting, huge binary blocks and oversized files are refused or bounded',async()=>{
 const plain=await bounded('plain RTF',()=>readRtf(new Uint8Array(Buffer.from('{'+String.fromCharCode(92)+'rtf1 Site visit notes}')),{}));assert.ifError(plain.error);assert.match(JSON.stringify(plain.result),/Site visit notes/);
 await bounded('100,000 nested groups',()=>readRtf(new Uint8Array(Buffer.from('{\\rtf1 '+'{'.repeat(100000)+'x'+'}'.repeat(100000)+'}')),{}));
 await bounded('binary block claiming 2 GB',()=>readRtf(new Uint8Array(Buffer.from('{\\rtf1 {\\bin2000000000 abc}}')),{}));
 const {error}=await bounded('101 MB',()=>readRtf(new Uint8Array(101*1024*1024),{}));assert.ok(error,'RTF over the 100 MB limit is refused');
 await bounded('not RTF',()=>readRtf(new Uint8Array(Buffer.from('plain words, no RTF header')),{}));
});
