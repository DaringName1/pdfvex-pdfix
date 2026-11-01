'use strict';
// V1 audit, area 5 (security), Claude's lane: Excel and PowerPoint files are ZIP packages of XML, the usual route for
// hostile files. Each crafted file below must be refused with an error within a few seconds: never hang, crash,
// expand without limit, follow a path outside the package or run macros.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {readWorkbook}=require('../desktop/workbook-codec.cjs'),{readPresentation}=require('../desktop/presentation-codec.cjs');
const {zip}=require('./helpers/test-zip.cjs');
const good=fs.readFileSync('tests/fixtures/robot-workbook.xlsx'),goodSlides=fs.readFileSync('tests/fixtures/robot-slides.pptx');
const types='<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>';
const book='<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="A" sheetId="1" r:id="rId1"/></sheets></workbook>';
const rels='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>';
const sheet=body=>`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
const workbookWith=(sheetXml,extra=[])=>zip([{name:'[Content_Types].xml',data:types},{name:'xl/workbook.xml',data:book},{name:'xl/_rels/workbook.xml.rels',data:rels},{name:'xl/worksheets/sheet1.xml',data:sheetXml},...extra]);
const quick=(label,fn)=>{const started=Date.now();assert.throws(fn,Error,label);const ms=Date.now()-started;assert.ok(ms<5000,`${label} took ${ms} ms`);};

test('the real samples still open (the hostile cases below are refused for their own reason)',()=>{
 assert.equal(readWorkbook(new Uint8Array(good)).model.sheets.length,2);assert.equal(readPresentation(new Uint8Array(goodSlides)).model.slides.length,3);
 assert.equal(readWorkbook(new Uint8Array(workbookWith(sheet('<row r="1"><c r="A1"><v>7</v></c></row>')))).model.sheets[0].cells[0].value,'7');
});
test('not a ZIP, truncated, empty and oversized files are refused',()=>{
 for(const read of [readWorkbook,readPresentation]){quick('text file',()=>read(new Uint8Array(Buffer.from('this is not an Office file at all, just words'))));
  quick('truncated',()=>read(new Uint8Array(good.subarray(0,Math.floor(good.length/2)))));quick('empty',()=>read(new Uint8Array(0)));
  quick('oversized',()=>read(new Uint8Array(Buffer.alloc(60*1024*1024))));}
});
test('a zip bomb that lies about its size, and packages that expand past the limit, are refused',()=>{
 const zeros=Buffer.alloc(40*1024*1024);
 quick('lying bomb',()=>readWorkbook(new Uint8Array(workbookWith(sheet(''),[{name:'xl/media/bomb.bin',data:zeros,declared:1000}]))));
 quick('honest bomb',()=>readWorkbook(new Uint8Array(workbookWith(sheet(''),[{name:'xl/media/big.bin',data:zeros}]))));
 quick('many parts',()=>readWorkbook(new Uint8Array(workbookWith(sheet(''),Array.from({length:2100},(_,i)=>({name:`xl/media/p${i}.bin`,data:'x',store:true}))))));
});
test('paths outside the package, macros and embedded programs are refused',()=>{
 for(const name of ['../../evil.xml','/abs.xml','xl\\back.xml','xl/./dot.xml','xl/vbaProject.bin','xl/embeddings/oleObject1.bin','C:evil.xml'])quick(name,()=>readWorkbook(new Uint8Array(workbookWith(sheet(''),[{name,data:'x'}]))));
 quick('duplicate part',()=>readWorkbook(new Uint8Array(workbookWith(sheet(''),[{name:'xl/workbook.xml',data:book}]))));
});
test('XML entity expansion, foreign encodings and runaway nesting are refused or bounded',()=>{
 const laughs='<?xml version="1.0"?><!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">]><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>&lol2;</t></is></c></row></sheetData></worksheet>';
 quick('billion laughs',()=>readWorkbook(new Uint8Array(workbookWith(laughs))));
 quick('UTF-16 declared',()=>readWorkbook(new Uint8Array(workbookWith('<?xml version="1.0" encoding="UTF-16"?><worksheet/>'))));
 const deep='<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+'<x>'.repeat(200000)+'</x>'.repeat(200000)+'<sheetData/></worksheet>';
 const started=Date.now();try{readWorkbook(new Uint8Array(workbookWith(deep)));}catch{}assert.ok(Date.now()-started<10000,'deep nesting finishes or refuses within 10 s');
});
test('cell addresses and counts beyond Excel limits are refused',()=>{
 quick('column past XFD',()=>readWorkbook(new Uint8Array(workbookWith(sheet('<row r="1"><c r="XFE1"><v>1</v></c></row>')))));
 quick('row past 1048576',()=>readWorkbook(new Uint8Array(workbookWith(sheet('<row r="1048577"><c r="A1048577"><v>1</v></c></row>')))));
 const many=Array.from({length:3000},(_,r)=>`<row r="${r+1}">`+Array.from({length:200},(_,c)=>`<c r="${String.fromCharCode(65+c%26)}${c>=26?'':''}${r+1}"><v>1</v></c>`).join('')+'</row>').join('');
 const started=Date.now();try{readWorkbook(new Uint8Array(workbookWith(sheet(many))));}catch{}assert.ok(Date.now()-started<15000,'a very large sheet finishes or refuses within 15 s');
});
