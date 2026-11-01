// Validate inert contained output only. No Office ZIP/XML reopening or formula evaluation.
const {imageDimensions}=require('./image-export-writer.cjs');
const MAX_MODEL=32*1024*1024,MAX_TEXT=8*1024*1024;
const fail=message=>{throw new Error('The contained Office result is invalid: '+message);};
const plain=value=>Boolean(value&&Object.getPrototypeOf(value)===Object.prototype);
function shape(value,keys){if(!plain(value)||Object.keys(value).sort().join(',')!==keys.split(',').sort().join(','))fail('unexpected model fields.');}
function text(value,max=32767){if(typeof value!=='string'||value.length>max||!value.isWellFormed()||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value))fail('unsupported literal text.');return value;}
function bool(value){if(typeof value!=='boolean')fail('invalid boolean.');}
function integer(value,min,max){if(!Number.isInteger(value)||value<min||value>max)fail('integer outside the model limit.');}
function finite(value,min,max){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)fail('geometry outside the model limit.');}
function color(value,nullable=true){if(!(nullable&&value===null)&&!(typeof value==='string'&&/^#[a-f0-9]{6}$/i.test(value)))fail('invalid inert color.');}
function part(value,prefix){text(value,1024);if(!value.startsWith(prefix)||value.includes('\\')||value.includes('?')||value.includes('#')||value.split('/').some(s=>!s||s==='.'||s==='..'))fail('unsupported package part identity.');}
function budget(value){if(Buffer.byteLength(JSON.stringify(value,(key,item)=>item instanceof Uint8Array?{bytes:item.length}:item))>MAX_MODEL)fail('model exceeds 32 MiB.');}
function address(value){text(value,16);const m=/^([A-Z]{1,3})([1-9]\d{0,6})$/.exec(value);if(!m)fail('invalid cell address.');let col=0;for(const c of m[1])col=col*26+c.charCodeAt(0)-64;const row=Number(m[2]);integer(row,1,1048576);integer(col,1,16384);return {row,col};}
function range(value){shape(value,'first,row,col,lastRow,lastCol');const first=address(value.first);if(first.row!==value.row||first.col!==value.col)fail('range identity does not match its cell.');integer(value.lastRow,value.row,1048576);integer(value.lastCol,value.col,16384);}
function validWorkbookModel(value){
 shape(value,'sheets,date1904,readOnly,external,signed,notice');for(const key of ['date1904','readOnly','external','signed'])bool(value[key]);text(value.notice,10000);
 if((value.external||value.signed)&&!value.readOnly)fail('protected workbook marked editable.');
 if(!Array.isArray(value.sheets)||value.sheets.length<1||value.sheets.length>50)fail('worksheet count.');
 let cells=0,literals=0,formulas=0;const parts=new Set();
 for(const sheet of value.sheets){
  shape(sheet,'name,state,protected,readOnly,ranges,formulaRanges,cells,maxRow,maxCol,part');text(sheet.name,128);if(!['visible','hidden','veryHidden'].includes(sheet.state))fail('worksheet visibility.');bool(sheet.protected);bool(sheet.readOnly);
  if(sheet.readOnly!==(value.readOnly||sheet.protected))fail('worksheet edit permission mismatch.');part(sheet.part,'xl/');if(parts.has(sheet.part))fail('duplicate worksheet part.');parts.add(sheet.part);
  if(!Array.isArray(sheet.ranges)||!Array.isArray(sheet.formulaRanges)||sheet.ranges.length+sheet.formulaRanges.length>5000)fail('worksheet range budget.');for(const item of [...sheet.ranges,...sheet.formulaRanges])range(item);
  if(!Array.isArray(sheet.cells)||(cells+=sheet.cells.length)>100000)fail('stored cell budget.');const refs=new Set();let maxRow=1,maxCol=1;
  for(const cell of sheet.cells){
   shape(cell,'ref,row,col,value,type,formula,unsupported,style');const point=address(cell.ref);if(point.row!==cell.row||point.col!==cell.col||refs.has(cell.ref))fail('duplicate/inconsistent stored cell.');refs.add(cell.ref);maxRow=Math.max(maxRow,cell.row);maxCol=Math.max(maxCol,cell.col);
   text(cell.value);if((literals+=Buffer.byteLength(cell.value))>MAX_TEXT)fail('stored text budget.');if(!['text','number','boolean'].includes(cell.type))fail('cell type.');bool(cell.unsupported);
   if(cell.type==='number'&&cell.value&&(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(cell.value)||!Number.isFinite(Number(cell.value))))fail('non-finite stored number.');
   if(cell.type==='boolean'&&!['true','false'].includes(cell.value))fail('stored boolean literal.');
   if(cell.formula!==null){text(cell.formula);if((formulas+=Buffer.byteLength(cell.formula))>MAX_TEXT)fail('formula literal budget.');}
   if(cell.style!==null&&(typeof cell.style!=='string'||!/^\d{1,10}$/.test(cell.style)))fail('stored style index.');
  }
  if(sheet.maxRow!==maxRow||sheet.maxCol!==maxCol)fail('worksheet bounds differ from stored cells.');
 }
 budget(value);return value;
}
function position(value){if(value===null)return;shape(value,'x,y,w,h,rotate');for(const key of ['x','y','rotate'])finite(value[key],-1e9,1e9);finite(value.w,Number.MIN_VALUE,1e9);finite(value.h,Number.MIN_VALUE,1e9);}
function validPresentationModel(value){
 shape(value,'width,height,slides,assets,external,signed,readOnly,warnings');finite(value.width,914400,91440000);finite(value.height,914400,91440000);for(const key of ['external','signed','readOnly'])bool(value[key]);if(value.signed&&!value.readOnly)fail('signed presentation marked editable.');
 if(!Array.isArray(value.slides)||value.slides.length<1||value.slides.length>100||!Array.isArray(value.assets)||value.assets.length>32||!Array.isArray(value.warnings)||value.warnings.length>100)fail('presentation counts.');for(const note of value.warnings)text(note,5000);
 let assetBytes=0,pixels=0;for(let index=0;index<value.assets.length;index++){
  const asset=value.assets[index];shape(asset,'id,bytes,mime,width,height');if(asset.id!==index||!(asset.bytes instanceof Uint8Array)||!asset.bytes.length||asset.bytes.length>4*1024*1024||!['image/png','image/jpeg'].includes(asset.mime))fail('preview asset identity/bytes.');integer(asset.width,1,8192);integer(asset.height,1,8192);
  if(asset.width*asset.height>4000000||(pixels+=asset.width*asset.height)>24000000||(assetBytes+=asset.bytes.length)>MAX_TEXT)fail('preview asset pixel/byte budget.');
  // Header-only bounds: no pixel decoding or Office parsing in the parent.
  const dimensions=imageDimensions(Buffer.from(asset.bytes.buffer,asset.bytes.byteOffset,asset.bytes.byteLength),asset.mime==='image/png'?'png':'jpg');if(dimensions[0]!==asset.width||dimensions[1]!==asset.height)fail('preview asset header dimensions differ.');
 }
 const parts=new Set();let runs=0,elements=0,literals=0,paragraphs=0,tokens=0;
 for(const slide of value.slides){
  shape(slide,'part,hidden,elements,runs,background,title');part(slide.part,'ppt/slides/');if(parts.has(slide.part))fail('duplicate slide part.');parts.add(slide.part);bool(slide.hidden);color(slide.background,false);text(slide.title,120);
  if(!Array.isArray(slide.runs)||(runs+=slide.runs.length)>20000||!Array.isArray(slide.elements)||(elements+=slide.elements.length)>3000)fail('slide run/shape budget.');
  for(let index=0;index<slide.runs.length;index++){const run=slide.runs[index];shape(run,'id,text,locked,font,size,bold,italic,underline,color');if(run.id!==index)fail('text run identity.');text(run.text);if((literals+=Buffer.byteLength(run.text))>2*1024*1024)fail('presentation literal budget.');text(run.font,1000);finite(run.size,1,400);for(const key of ['locked','bold','italic','underline'])bool(run[key]);color(run.color);}
  const referenced=new Set();
  for(const element of slide.elements){
   if(!plain(element)||!['shape','image','unsupported'].includes(element.kind))fail('slide element type.');text(element.name,160);position(element.position);
   if(element.kind==='image'){shape(element,'kind,name,position,asset');if(element.asset!==null)integer(element.asset,0,value.assets.length-1);continue;}
   if(element.kind==='shape'){shape(element,'kind,name,position,fill,stroke,preset,paragraphs');color(element.fill);color(element.stroke);text(element.preset,256);}else shape(element,'kind,name,position,paragraphs');
   if(!Array.isArray(element.paragraphs)||(paragraphs+=element.paragraphs.length)>50000)fail('paragraph budget.');
   for(const paragraph of element.paragraphs){shape(paragraph,'align,bullet,tokens');if(!['left','right','center','justify'].includes(paragraph.align))fail('paragraph alignment.');if(paragraph.bullet!==null)text(paragraph.bullet,128);if(!Array.isArray(paragraph.tokens)||(tokens+=paragraph.tokens.length)>100000)fail('paragraph token budget.');
    for(const token of paragraph.tokens){if(token?.type==='break'){shape(token,'type');continue;}shape(token,'type,id');if(token.type!=='run')fail('paragraph token type.');integer(token.id,0,slide.runs.length-1);if(referenced.has(token.id)||element.kind==='unsupported'&&!slide.runs[token.id].locked)fail('duplicate/unprotected text run.');referenced.add(token.id);}
   }
  }
  if(referenced.size!==slide.runs.length)fail('unreferenced presentation text run.');
 }
 budget(value);return value;
}
function validOfficeCopy(bytes){if(!(bytes instanceof Uint8Array)||bytes.length<22||bytes.length>10*1024*1024||bytes[0]!==0x50||bytes[1]!==0x4b||bytes[2]!==3||bytes[3]!==4)fail('Office copy byte envelope.');return bytes;}
module.exports={validWorkbookModel,validPresentationModel,validOfficeCopy};
