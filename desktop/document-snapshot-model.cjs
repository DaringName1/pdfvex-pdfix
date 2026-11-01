const LIMITS=require('./document-limits.cjs');
// A DOCX copy written by PDFix carries a bounded copy of the editor's own document model in two custom
// document properties, so reopening it restores fonts, sizes, colors, alignment and page setup that the
// generic Word import simplifies. The copy is trusted only when it is bound to the exact body PDFix wrote
// and (checked by the editor) its text equals the text the generic import sees. Images stay in the Word
// package; the copy holds numbered placeholders for them.
const SNAPSHOT_PROPERTY='PDFixDocumentSnapshot',SHA_PROPERTY='PDFixDocumentSha256',SNAPSHOT_LIMIT=512*1024;
const IMAGE_MARKER=/^pdfix-snapshot-image-(\d{1,2})$/;
const STUB='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==';
const fail=()=>{throw new Error('The saved PDFix document copy is not usable.');};
const plain=value=>value&&Object.getPrototypeOf(value)===Object.prototype;
function walk(node,visit,depth=0){if(!plain(node)||depth>64)fail();visit(node);if(node.content!==undefined){if(!Array.isArray(node.content))fail();for(const child of node.content)walk(child,visit,depth+1);}}
// Writer side: replace embedded image data with ordered placeholders; null when the copy would be too large.
function documentSnapshot(content,layout){
 const copy=structuredClone(content);let images=0;walk(copy,node=>{if(node.type==='documentImage')node.attrs={...node.attrs,src:'pdfix-snapshot-image-'+(++images)};});
 const text=JSON.stringify({version:1,content:copy,layout});return text.length>SNAPSHOT_LIMIT||images>LIMITS.IMAGE_COUNT?null:text;
}
// Reader side, inside the contained engine and again in the parent: shape and bounds only.
// validateContent receives the model with a stub in place of every image and must throw for anything unsupported.
function validDocumentSnapshot(snapshot,validateContent,validateLayout){
 if(!plain(snapshot)||Object.keys(snapshot).sort().join(',')!=='content,layout,version'||snapshot.version!==1)fail();
 let size;try{size=JSON.stringify(snapshot).length;}catch{fail();}if(size>SNAPSHOT_LIMIT+64)fail();
 let images=0;const stubbed=structuredClone(snapshot.content);
 walk(stubbed,node=>{if(node.type!=='documentImage')return;const a=node.attrs;if(!plain(a)||Object.keys(a).sort().join(',')!=='alt,height,pixelHeight,pixelWidth,src,width'||typeof a.src!=='string')fail();const match=IMAGE_MARKER.exec(a.src);if(!match||Number(match[1])!==++images||images>20||typeof a.alt!=='string'||a.alt.length>500||![a.width,a.height].every(v=>Number.isFinite(v)&&v>=8&&v<=2000)||![a.pixelWidth,a.pixelHeight].every(v=>Number.isInteger(v)&&v>=1&&v<=8192))fail();node.attrs={src:STUB,alt:'',width:8,height:8,pixelWidth:1,pixelHeight:1};});
 try{validateContent(stubbed);validateLayout(snapshot.layout);}catch{fail();}
 return snapshot;
}
module.exports={SNAPSHOT_PROPERTY,SHA_PROPERTY,SNAPSHOT_LIMIT,documentSnapshot,validDocumentSnapshot};
