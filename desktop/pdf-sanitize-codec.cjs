const {PDFDocument,PDFDict,PDFArray,PDFRef,PDFName,PDFRawStream,PDFInvalidObject,PDFNumber,PDFString,PDFHexString}=require('pdf-lib');
const PDFWriter=require('pdf-lib/cjs/core/writers/PDFWriter.js').default;
const {createHash}=require('node:crypto');
const {MAX_BYTES,CATEGORIES,choices}=require('./pdf-sanitize-validation.cjs');
const ACTIONS=new Set(['JavaScript','URI','Launch','GoTo','GoToR','GoToE','SubmitForm','ResetForm','ImportData','Named','SetOCGState','Rendition','Movie','Sound','Hide','Trans','Thread']);
const key=PDFName.of;
const fail=message=>{throw new Error(message);};
function scan(doc,{all=false}={}){
 const context=doc.context,seen=new WeakSet(),refs=new Set(),objects=[],stack=[];let nodes=0;
 const resolve=value=>{if(!(value instanceof PDFRef))return value;const found=context.lookup(value);if(!found)fail('The PDF contains an unresolved object reference. Cleanup is unavailable.');return found;};
 const get=(dict,name)=>resolve(dict.get(key(name))),name=value=>value instanceof PDFName?value.decodeText():'';
 const push=(value,depth)=>stack.push({value,depth});
 for(const value of Object.values(context.trailerInfo))if(value)push(value,0);
 if(all)for(const [,value]of context.enumerateIndirectObjects())push(value,0);
 while(stack.length){let {value,depth}=stack.pop();if(++nodes>300000)fail('This PDF exceeds the 300,000-node cleanup limit.');if(depth>80)fail('This PDF exceeds the cleanup nesting limit.');
  if(value instanceof PDFRef){const id=value.toString();if(refs.has(id))continue;refs.add(id);value=resolve(value);}
  if(!value||typeof value!=='object'||seen.has(value))continue;seen.add(value);objects.push(value);
  if(value instanceof PDFNumber&&(!Number.isFinite(value.asNumber())||Math.abs(value.asNumber())>1e15))fail('An unsupported PDF number cannot be preserved safely.');
  if(value instanceof PDFInvalidObject)fail('Invalid PDF objects cannot be safely rewritten.');
  if(value instanceof PDFRawStream){push(value.dict,depth+1);continue;}
  if(value instanceof PDFDict){for(const [,item]of value.entries())push(item,depth+1);}else if(value instanceof PDFArray){if(value.size()>100000)fail('This PDF contains an oversized array.');for(let index=0;index<value.size();index++)push(value.get(index),depth+1);}
 }
 if(context.enumerateIndirectObjects().length>100000)fail('This PDF exceeds the 100,000-object cleanup limit.');
 return {objects,refs,resolve,get,name};
}
function inventory(doc,graph){
 const counts={metadata:0,attachments:0,annotations:0,forms:0,actions:0,layers:0,multimedia:0},dicts=graph.objects.filter(value=>value instanceof PDFDict);
 if(doc.context.trailerInfo.Info)counts.metadata++;
 if(doc.context.trailerInfo.ID)counts.metadata++;
 const identities=new Set();
 for(const dict of dicts){const type=graph.name(graph.get(dict,'Type')),subtype=graph.name(graph.get(dict,'Subtype')),action=graph.name(graph.get(dict,'S'));
  if(type==='Sig'||graph.name(graph.get(dict,'FT'))==='Sig'||dict.has(key('ByteRange'))||dict.has(key('DocMDP'))||dict.has(key('UR3')))fail('Signed or signature-bearing PDFs require a separately authorized unsigned source. Certificate signatures are not validated here.');
  if(dict.has(key('XFA')))fail('XFA PDFs cannot be selectively cleaned in this build.');
  if(dict.has(key('Metadata'))||type==='Metadata')counts.metadata++;
  if(dict.has(key('EF'))||type==='EmbeddedFile'||dict.has(key('EmbeddedFiles'))||dict.has(key('AF')))counts.attachments++;
  if(subtype&&type==='Annot'||['Widget','Text','Link','FreeText','Line','Square','Circle','Polygon','PolyLine','Highlight','Underline','Squiggly','StrikeOut','Stamp','Caret','Ink','Popup','FileAttachment','Sound','Movie','Screen','PrinterMark','TrapNet','Watermark','3D','Redact','RichMedia'].includes(subtype)){if(subtype==='Widget')counts.forms++;else if(subtype!=='FileAttachment')counts.annotations++;}
  if(dict.has(key('AcroForm'))||dict.has(key('FT')))counts.forms++;
  if(type==='Action'||ACTIONS.has(action)||dict.has(key('JS'))||dict.has(key('AA'))||dict.has(key('OpenAction'))||dict.has(key('JavaScript')))counts.actions++;
  if(type==='OCG'||dict.has(key('OCProperties')))counts.layers++;
  if(['RichMedia','Movie','Sound','Screen','3D'].includes(subtype)||type==='Rendition')counts.multimedia++;
  if(type==='Page')identities.add(dict);
 }
 return {counts,pageCount:identities.size};
}
async function load(bytes){if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>MAX_BYTES)fail('Choose a PDF under 100 MB.');const doc=await PDFDocument.load(bytes,{updateMetadata:false,throwOnInvalidObject:true,capNumbers:false});if(doc.isEncrypted||doc.context.trailerInfo.Encrypt)fail('Cleanup needs an owner-authorized decrypted copy.');if(doc.catalog.has(key('Perms')))fail('This PDF declares document permission or certification constraints. Cleanup requires a reviewed, owner-authorized unrestricted source.');if(doc.getPageCount()<1||doc.getPageCount()>500)fail('Choose a PDF containing 1 to 500 pages.');return doc;}
function fingerprint(object){const hash=createHash('sha256');if(object instanceof PDFRawStream){hash.update(object.dict.toString());hash.update(object.contents);}else hash.update(object.toString());return hash.digest('hex');}
async function inspect(bytes){const doc=await load(bytes),graph=scan(doc,{all:true}),report=inventory(doc,graph);return {version:1,sha256:createHash('sha256').update(bytes).digest('hex'),byteLength:bytes.length,pageCount:doc.getPageCount(),counts:report.counts,categories:CATEGORIES,scope:'Counts describe structural dictionaries and entries, not distinct visible items. Cleanup removes only selected structures. Repeated information inside retained page text, artwork or other categories remains.',limits:['Hidden-layer removal and vector-preserving redaction are not supported by this cleanup tool.','This inspection and writer run in the fixed Windows AppContainer document engine; runtime isolation acceptance and security review remain pending.','Encrypted, signature-bearing, XFA, malformed and unsupported shared structures are refused.']};}
async function sanitize(bytes,selection){
 const selected=choices(selection),doc=await load(bytes),graph=scan(doc,{all:true}),before=inventory(doc,graph),removed=Object.fromEntries(CATEGORIES.map(name=>[name,0])),sensitiveRoots=new Set(),sensitiveStreams=new Set();
 // Track removed roots and opaque payloads. If any alias keeps them reachable,
 // refuse the output rather than claiming a selected payload disappeared.
 const mark=(value,{payload=false}={})=>{if(!value)return;const root=graph.resolve(value);if(root&&typeof root==='object'&&!(root instanceof PDFName))sensitiveRoots.add(root);if(!payload)return;const stack=[root],seen=new WeakSet();let nodes=0;while(stack.length){const item=graph.resolve(stack.pop());if(++nodes>100000)fail('A cleanup payload exceeds its traversal budget.');if(!item||typeof item!=='object'||seen.has(item))continue;seen.add(item);if(item instanceof PDFDict&&['Page','Pages','Catalog'].includes(graph.name(graph.get(item,'Type'))))continue;if(item instanceof PDFDict||item instanceof PDFArray||item instanceof PDFRawStream||item instanceof PDFString||item instanceof PDFHexString)sensitiveRoots.add(item);if(item instanceof PDFRawStream){sensitiveStreams.add(item);continue;}if(item instanceof PDFDict){for(const [name,value]of item.entries()){if(['P','Parent','Resources','DR'].includes(name.decodeText()))continue;stack.push(value);}}else if(item instanceof PDFArray)for(let i=0;i<item.size();i++)stack.push(item.get(i));}};
 const sourceActions=new Set(graph.objects.filter(object=>object instanceof PDFDict&&(graph.name(graph.get(object,'Type'))==='Action'||ACTIONS.has(graph.name(graph.get(object,'S'))))));for(const object of graph.objects)if(object instanceof PDFDict){const a=graph.get(object,'A');if(a instanceof PDFDict&&graph.name(graph.get(a,'S')))sourceActions.add(a);}
 const remove=(dict,name,category,payload=false)=>{if(!dict.has(key(name)))return;mark(dict.get(key(name)),{payload});dict.delete(key(name));removed[category]++;};
 if(selected.metadata){if(doc.context.trailerInfo.Info){mark(doc.context.trailerInfo.Info,{payload:true});delete doc.context.trailerInfo.Info;removed.metadata++;}if(doc.context.trailerInfo.ID){mark(doc.context.trailerInfo.ID);delete doc.context.trailerInfo.ID;removed.metadata++;}}
 for(const object of graph.objects){if(!(object instanceof PDFDict))continue;const type=graph.name(graph.get(object,'Type')),subtype=graph.name(graph.get(object,'Subtype')),action=graph.name(graph.get(object,'S'));
  if(selected.metadata){remove(object,'Metadata','metadata',true);if(type==='Metadata')sensitiveRoots.add(object);}
  if(selected.attachments){remove(object,'EmbeddedFiles','attachments',true);remove(object,'AF','attachments',true);remove(object,'EF','attachments',true);if(type==='EmbeddedFile')sensitiveRoots.add(object);if(subtype==='FileAttachment'){mark(object,{payload:true});}}
  if(selected.forms){remove(object,'AcroForm','forms',true);if(object.has(key('FT'))||subtype==='Widget')mark(object,{payload:true});}
  if(selected.actions){for(const name of ['AA','OpenAction','JS','JavaScript'])remove(object,name,'actions',true);const a=graph.get(object,'A');if(a instanceof PDFDict&&sourceActions.has(a))remove(object,'A','actions',true);if(sourceActions.has(object)){for(const [name,value]of object.entries()){if(['S','Type'].includes(name.decodeText()))continue;mark(value,{payload:true});object.delete(name);}object.delete(key('S'));if(type==='Action')object.delete(key('Type'));removed.actions++;}}
  if(object.has(key('Annots'))){const list=graph.get(object,'Annots');if(!(list instanceof PDFArray))fail('An annotation array cannot be safely inspected.');for(let i=list.size()-1;i>=0;i--){const annotation=graph.resolve(list.get(i));if(!(annotation instanceof PDFDict))fail('An annotation dictionary cannot be safely inspected.');const sub=graph.name(graph.get(annotation,'Subtype'));const take=sub==='Widget'?selected.forms:sub==='FileAttachment'?selected.attachments:selected.annotations;if(take){mark(list.get(i),{payload:true});list.remove(i);removed[sub==='Widget'?'forms':sub==='FileAttachment'?'attachments':'annotations']++;}}if(!list.size())object.delete(key('Annots'));}
 }
 // Normalize stream Length before reachability pruning: PDFWriter does this
 // during sizing too. Old indirect Length objects must not survive as orphans.
 for(const object of graph.objects)if(object instanceof PDFRawStream)object.updateDict();
 const retained=scan(doc),retainedObjects=new Set(retained.objects);
 for(const object of [...sensitiveRoots,...sensitiveStreams])if(retainedObjects.has(object))fail('A removed structure or payload is shared with retained content. This PDF needs a different cleanup workflow; no output was produced.');
 for(const object of retained.objects){const dict=object instanceof PDFRawStream?object.dict:object;if(dict instanceof PDFDict&&['ObjStm','XRef'].includes(retained.name(retained.get(dict,'Type'))))fail('A retained object contains a compressed object or cross-reference history stream. This PDF cannot be safely cleaned here.');}
 let pruned=0;for(const [ref]of doc.context.enumerateIndirectObjects())if(!retained.refs.has(ref.toString())){doc.context.delete(ref);pruned++;}
 // This is a fresh serialization, not an incremental revision. PDF-lib keeps
 // the old allocation high-water mark after deletion, but its xref writer
 // emits only retained references. Keep trailer Size consistent with that
 // actual table so strict readers do not need recovery or report warnings.
 let highestRetained=0;for(const [ref]of doc.context.enumerateIndirectObjects())highestRetained=Math.max(highestRetained,ref.objectNumber);doc.context.largestObjectNumber=highestRetained;
 const after=inventory(doc,scan(doc,{all:true}));for(const category of CATEGORIES)if(selected[category]&&after.counts[category])fail('Selected '+category+' structures remain reachable. This PDF cannot be safely cleaned here.');
 const expected=new Map(doc.context.enumerateIndirectObjects().map(([ref,object])=>[ref.toString(),fingerprint(object)]));
 // PDFWriter serializes this pruned context into a new buffer. It never appends
 // the source file, an incremental revision, old xref bytes or orphan objects.
 const writer=PDFWriter.forContext(doc.context,100),measure=await writer.computeBufferSize();if(measure.size>MAX_BYTES)fail('The rebuilt copy exceeds 100 MB.');const output=await writer.serializeToBuffer();
 const reopened=await load(output),reopenedGraph=scan(reopened,{all:true}),verified=inventory(reopened,reopenedGraph);
 if(reopened.getPageCount()!==doc.getPageCount())fail('The rebuilt PDF changed its page count.');
 const actual=reopened.context.enumerateIndirectObjects();if(actual.length!==expected.size)fail('The rebuilt PDF changed its retained object count.');for(const [ref,object]of actual)if(expected.get(ref.toString())!==fingerprint(object))fail('A retained PDF object changed while independently reopening the copy.');
 for(const category of CATEGORIES)if(selected[category]&&verified.counts[category])fail('Reinspection found a selected cleanup structure in the output.');
 const reachable=scan(reopened);for(const [ref]of actual)if(!reachable.refs.has(ref.toString()))fail('The rebuilt copy contains an unexpected disconnected object.');
 return {bytes:output,report:{version:1,selected,before:before.counts,after:verified.counts,removedEntries:removed,prunedObjects:pruned,pageCount:reopened.getPageCount(),sourceSha256:createHash('sha256').update(bytes).digest('hex'),sha256:createHash('sha256').update(output).digest('hex'),originalBytes:bytes.length,outputBytes:output.length,verified:true,scope:'Selected structures were removed, disconnected objects were pruned, and a fresh PDF was independently reopened. Retained object fingerprints and page count matched. Duplicated information in retained page text, artwork, resources or unselected structures remains; this is not content redaction or a malware certification.'}};
}
module.exports={inspect,sanitize,choices,CATEGORIES,MAX_BYTES};
