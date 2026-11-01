const {writeArchive}=require('../../desktop/office-archive.cjs');
const REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships',PKG='http://schemas.openxmlformats.org/package/2006/relationships';
function workbookFixture({protectedSheet=false,external=false}={}){
 const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
 return writeArchive(new Map(Object.entries({
  '[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>',
  'xl/workbook.xml':`<workbook xmlns="${ns}" xmlns:r="${REL}"><sheets><sheet name="Values" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  'xl/_rels/workbook.xml.rels':`<Relationships xmlns="${PKG}"><Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/>${external?`<Relationship Id="web" Type="${REL}/hyperlink" Target="https://example.com/" TargetMode="External"/>`:''}</Relationships>`,
  'xl/worksheets/sheet1.xml':`<worksheet xmlns="${ns}"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Original</t></is></c><c r="B1"><v>42</v></c><c r="C1" t="b"><v>1</v></c><c r="D1"><f>B1*2</f><v>84</v></c></row></sheetData>${protectedSheet?'<sheetProtection sheet="1"/>':''}<mergeCells><mergeCell ref="A2:B2"/></mergeCells></worksheet>`,
  'xl/styles.xml':'<styleSheet xmlns="'+ns+'"><fonts count="1"><font><name val="Calibri"/></font></fonts></styleSheet>',
  'custom/unrendered.bin':Buffer.from([0,1,2,255])
 }).map(([name,value])=>[name,Buffer.from(value)])));
}
function presentationFixture({signed=false,field=false}={}){
 const ns='http://schemas.openxmlformats.org/presentationml/2006/main',draw='http://schemas.openxmlformats.org/drawingml/2006/main';
 const entries=new Map(Object.entries({
  '[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/></Types>',
  'ppt/presentation.xml':`<p:presentation xmlns:p="${ns}" xmlns:r="${REL}"><p:sldIdLst><p:sldId id="256" r:id="slide1"/></p:sldIdLst><p:sldSz cx="9144000" cy="6858000"/></p:presentation>`,
  'ppt/_rels/presentation.xml.rels':`<Relationships xmlns="${PKG}"><Relationship Id="slide1" Type="${REL}/slide" Target="slides/slide1.xml"/></Relationships>`,
  'ppt/slides/slide1.xml':`<p:sld xmlns:p="${ns}" xmlns:a="${draw}" show="0"><p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="914400" cy="914400"/></a:xfrm></p:spPr><p:txBody><a:bodyPr/><a:p><a:${field?'fld':'r'}><a:rPr b="1" sz="2400"/><a:t>Original slide</a:t></a:${field?'fld':'r'}></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`,
  'ppt/theme/theme1.xml':`<a:theme xmlns:a="${draw}" name="Retained theme"/>`,
  'custom/unrendered.bin':Buffer.from([10,20,30,0])
 }).map(([name,value])=>[name,Buffer.from(value)]));
 if(signed)entries.set('_xmlsignatures/sig1.xml',Buffer.from('<Signature/>'));return writeArchive(entries);
}
module.exports={workbookFixture,presentationFixture};
