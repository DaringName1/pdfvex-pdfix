// Child-only structural PDF inventory. Never required by the trusted parent.
const {createHash}=require('node:crypto');
const {PDFDocument,PDFDict,PDFArray,PDFRef,PDFName,PDFString,PDFHexString,PDFNumber,PDFRawStream,PDFInvalidObject}=require('pdf-lib');
// The fixed child entry point installs the object-stream allocation/decode guard.
const clean = value => String(value).toWellFormed().replace(/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/g, ' ').slice(0, 320);
async function inspect(bytes) {
  if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > 100 * 1024 * 1024) throw new Error('The PDF exceeds the 100 MB inspection limit.');
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false, throwOnInvalidObject: true, capNumbers: true });
  const counts = { javascript: 0, additionalActions: 0, openActions: 0, actions: 0, linkActions: 0, embeddedStreams: 0, attachmentSpecs: 0, optionalLayers: 0, formFields: 0, signatureFields: 0, signatureDictionaries: 0, xmpStreams: 0, multimedia: 0, invalidObjects: 0 };
  const flags = { xfa: false, acroForm: false, optionalContent: false, embeddedFileNameTree: false, informationMetadata: !!doc.context.trailerInfo.Info, tagged: false };
  const actions = new Map(), attachments = [], seen = new WeakSet(), refs = new Set();
  const limits = [], unresolved = new Set();
  let nodes = 0, objects = 0;
  const resolve = object => {
    if (!(object instanceof PDFRef)) return object;
    const found = doc.context.lookup(object);
    if (!found) unresolved.add(object.toString());
    return found;
  };
  const get = (dict, key) => resolve(dict.get(PDFName.of(key)));
  const name = object => object instanceof PDFName ? object.decodeText() : '';
  const text = object => object instanceof PDFString || object instanceof PDFHexString ? clean(object.decodeText()) : '';
  const number = object => object instanceof PDFNumber && Number.isSafeInteger(object.asNumber()) && object.asNumber() >= 0 ? object.asNumber() : null;
  function dictReport(dict) {
    const type = name(get(dict, 'Type')), subtype = name(get(dict, 'Subtype')), field = name(get(dict, 'FT')), action = name(get(dict, 'S'));
    if (dict.has(PDFName.of('JS')) || action === 'JavaScript') counts.javascript++;
    if (dict.has(PDFName.of('AA'))) counts.additionalActions++;
    if (dict.has(PDFName.of('OpenAction'))) counts.openActions++;
    if (action && (type === 'Action' || ['JavaScript','URI','Launch','GoTo','GoToR','GoToE','SubmitForm','ResetForm','ImportData','Named','SetOCGState','Rendition','Movie','Sound','Hide','Trans'].includes(action))) {
      counts.actions++; actions.set(clean(action), (actions.get(clean(action)) || 0) + 1);
      if (['URI','Launch','GoToR','GoToE','SubmitForm','ImportData'].includes(action)) counts.linkActions++;
    }
    if (type === 'EmbeddedFile') counts.embeddedStreams++;
    if (type === 'OCG') counts.optionalLayers++;
    if (field) counts.formFields++;
    if (field === 'Sig') counts.signatureFields++;
    if (type === 'Sig' || dict.has(PDFName.of('ByteRange')) && dict.has(PDFName.of('Contents'))) counts.signatureDictionaries++;
    if (type === 'Metadata' || subtype === 'XML' && dict.has(PDFName.of('Length'))) counts.xmpStreams++;
    if (['RichMedia','Movie','Sound','Screen','3D'].includes(subtype) || type === 'Rendition') counts.multimedia++;
    for (const [key, flag] of [['XFA','xfa'],['AcroForm','acroForm'],['OCProperties','optionalContent'],['EmbeddedFiles','embeddedFileNameTree'],['StructTreeRoot','tagged']]) if (dict.has(PDFName.of(key))) flags[flag] = true;
    const ef = get(dict, 'EF');
    if (ef instanceof PDFDict) {
      counts.attachmentSpecs++;
      if (attachments.length < 100) {
        const stream = get(ef, 'UF') || get(ef, 'F');
        const params = stream instanceof PDFRawStream ? get(stream.dict, 'Params') : null;
        attachments.push({ name: text(get(dict, 'UF')) || text(get(dict, 'F')) || '(unnamed embedded file)', description: text(get(dict, 'Desc')), type: stream instanceof PDFRawStream ? clean(name(get(stream.dict, 'Subtype'))) || 'not declared' : 'unreadable', declaredBytes: params instanceof PDFDict ? number(get(params, 'Size')) : null });
      }
    }
  }
  function visit(value, depth) {
    if (++nodes > 200000) throw new Error('Inspection reached its 200,000-node limit.');
    if (depth > 40) { if (!limits.includes('Some nested structures exceeded the 40-level traversal limit.')) limits.push('Some nested structures exceeded the 40-level traversal limit.'); return; }
    if (value instanceof PDFRef) { const key = value.toString(); if (refs.has(key)) return; refs.add(key); return visit(resolve(value), depth + 1); }
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (value instanceof PDFInvalidObject) counts.invalidObjects++;
    if (value instanceof PDFRawStream) return visit(value.dict, depth + 1);
    if (value instanceof PDFDict) { dictReport(value); for (const [, item] of value.entries()) visit(item, depth + 1); }
    else if (value instanceof PDFArray) { for (let i = 0; i < value.size(); i++) visit(value.get(i), depth + 1); }
  }
  try {
    visit(doc.catalog, 0);
    if (doc.context.trailerInfo.Info) visit(doc.context.trailerInfo.Info, 0);
    // Enumerate disconnected objects too: hidden/orphaned information can remain
    // in a PDF even when the current page tree does not reference it.
    for (const [, object] of doc.context.enumerateIndirectObjects()) { if (++objects > 100000) throw new Error('Inspection reached its 100,000-object limit.'); visit(object, 0); }
  } catch (error) { limits.push(clean(error.message)); }
  const encrypted = !!doc.context.trailerInfo.Encrypt || doc.isEncrypted;
  if (encrypted) limits.push('This source is encrypted. The parser does not decrypt it; encrypted strings and compressed structures may be unreadable. This report is incomplete. Inspect an owner-authorized decrypted copy for a fuller report.');
  if (unresolved.size) limits.push(`${unresolved.size} referenced objects could not be resolved.`);
  if (counts.invalidObjects) limits.push(`${counts.invalidObjects} invalid objects could not be inspected.`);
  if (counts.attachmentSpecs > attachments.length) limits.push('Only the first 100 embedded-file descriptions are listed.');
  if (actions.size > 100) limits.push('Only the first 100 action-type summaries are listed.');
  return { version: 1, sha256: createHash('sha256').update(bytes).digest('hex'), inspectedAt: new Date().toISOString(), byteLength: bytes.length, complete: limits.length === 0, encrypted, counts, flags, actionTypes: [...actions].slice(0, 100).map(([type,count]) => ({type,count})), attachments, limits, signatureValidity: 'unable to verify', scope: 'Structural inventory of the immutable opened PDF snapshot, including parsed disconnected objects. Counts describe dictionaries and references, not confirmed executions, distinct user-visible fields or a malware verdict.', boundaries: 'No scripts, links, attachments or multimedia are executed or opened. Stream contents, historical byte revisions, certificate trust, signature integrity and malware are not validated. This inventory runs in the fixed Windows AppContainer document engine; runtime isolation acceptance and independent security review remain pending.' };
}
module.exports={inspect};
